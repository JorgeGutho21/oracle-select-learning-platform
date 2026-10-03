import { mergeRecords, pendingUpload, type ProgressRecord } from '../domain/progress';

/**
 * Sincronización del progreso de una persona autenticada. El dispositivo sigue siendo la
 * fuente inmediata (las páginas leen y guardan en local como siempre); este servicio:
 * 1. al entrar, trae la nube y la integra en local; si el progreso local era de invitado
 *    (o de esta misma cuenta), sube lo que falte: el avance de invitado nunca se pierde;
 * 2. si el progreso local era de otra cuenta, no lo mezcla: lo sustituye por el de la nube;
 * 3. tras cada cambio significativo sube solo lo pendiente, con espera y reintentos;
 * 4. sin conexión, todo sigue en local y se reintenta más tarde.
 * Las escrituras son idempotentes y monótonas en la base: repetirlas no cambia nada.
 */

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'offline' | 'error';

export type CloudResult =
  | { readonly ok: true; readonly records: readonly ProgressRecord[] }
  | {
      readonly ok: false;
      readonly reason: 'offline' | 'unauthenticated' | 'unavailable' | 'error';
    };

export interface CloudProgressGateway {
  pull(): Promise<CloudResult>;
  push(records: readonly ProgressRecord[]): Promise<CloudResult>;
  reset(section: string, mode: string): Promise<boolean>;
}

export interface LocalProgressSource {
  snapshot(): Promise<readonly ProgressRecord[]>;
  /** Integra registros de la nube en el almacenamiento local, sin quitar avance. */
  absorb(records: readonly ProgressRecord[]): Promise<void>;
  /** Borra el progreso local (otra cuenta o cierre de sesión). */
  clear(): Promise<void>;
}

/** Dueño del progreso guardado en este dispositivo: `null` mientras es de invitado. */
export interface OwnerStore {
  read(): string | null;
  write(userId: string): void;
  clear(): void;
}

export interface Scheduler {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

const defaultScheduler: Scheduler = {
  set: (callback, ms) => globalThis.setTimeout(callback, ms),
  clear: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface ProgressSyncOptions {
  readonly local: LocalProgressSource;
  readonly cloud: CloudProgressGateway;
  readonly owner: OwnerStore;
  readonly scheduler?: Scheduler;
  readonly debounceMs?: number;
  readonly retryDelaysMs?: readonly number[];
  readonly now?: () => number;
}

export interface SyncSnapshot {
  readonly status: SyncStatus;
  /** Avance combinado de la nube y del dispositivo. */
  readonly records: readonly ProgressRecord[];
  readonly lastSyncedAt: number | null;
}

export class ProgressSync {
  private readonly local: LocalProgressSource;
  private readonly cloud: CloudProgressGateway;
  private readonly owner: OwnerStore;
  private readonly scheduler: Scheduler;
  private readonly debounceMs: number;
  private readonly retryDelaysMs: readonly number[];
  private readonly now: () => number;

  private userId: string | null = null;
  private cloudRecords: readonly ProgressRecord[] = [];
  private localRecords: readonly ProgressRecord[] = [];
  private pendingResets: { section: string; mode: string }[] = [];
  private state: SyncSnapshot = { status: 'idle', records: [], lastSyncedAt: null };
  private listeners = new Set<(snapshot: SyncSnapshot) => void>();
  private debounce: unknown = null;
  private retry: unknown = null;
  private attempt = 0;
  private running: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;
  private readyPromise: Promise<void>;
  private started = false;
  private lastPullAt = 0;

  constructor(options: ProgressSyncOptions) {
    this.local = options.local;
    this.cloud = options.cloud;
    this.owner = options.owner;
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.debounceMs = options.debounceMs ?? 2000;
    this.retryDelaysMs = options.retryDelaysMs ?? [5000, 15000, 30000, 60000, 120000, 300000];
    this.now = options.now ?? Date.now;
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  get snapshot(): SyncSnapshot {
    return this.state;
  }

  get activeUser(): string | null {
    return this.userId;
  }

  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Espera la primera sincronización, como mucho `timeoutMs`. Sin sesión (invitado) no
   * espera nada: las páginas leen el progreso local de inmediato.
   */
  ready(timeoutMs: number): Promise<void> {
    if (!this.started) return Promise.resolve();
    return Promise.race([
      this.readyPromise,
      new Promise<void>((resolve) => this.scheduler.set(resolve, timeoutMs)),
    ]);
  }

  /** Prepara la sincronización antes de conocer la cuenta: las lecturas esperan. */
  expectAccount(): void {
    this.started = true;
  }

  /** Abandona la espera si al final no hay sesión. */
  cancelExpectation(): void {
    if (this.userId) return;
    this.started = false;
    this.markReady();
  }

  async start(userId: string): Promise<void> {
    if (this.userId === userId && this.state.status !== 'idle') return;
    this.started = true;
    this.userId = userId;
    await this.run(() => this.initialSync(userId));
  }

  /** Vuelve a traer la nube (otra pestaña u otro dispositivo pudo avanzar). */
  async refresh(minIntervalMs = 0): Promise<void> {
    if (!this.userId || this.now() - this.lastPullAt < minIntervalMs) return;
    await this.run(() => this.pullAndPush());
  }

  /** El progreso local cambió: se sube tras una breve espera. */
  notifyLocalChange(): void {
    if (!this.userId) return;
    if (this.debounce !== null) this.scheduler.clear(this.debounce);
    this.debounce = this.scheduler.set(() => {
      this.debounce = null;
      void this.flush();
    }, this.debounceMs);
  }

  /** Sube ya lo pendiente. Devuelve `true` si la nube quedó al día. */
  async flush(): Promise<boolean> {
    if (!this.userId) return true;
    if (this.debounce !== null) {
      this.scheduler.clear(this.debounce);
      this.debounce = null;
    }
    await this.run(() => this.pushPending());
    return this.state.status === 'synced';
  }

  /** Reiniciar un modo (por ejemplo, el Modo Estudio) también lo borra de la nube. */
  async reset(section: string, mode: string): Promise<void> {
    if (!this.userId) return;
    this.cloudRecords = this.cloudRecords.filter(
      (record) => record.section !== section || record.mode !== mode,
    );
    this.pendingResets.push({ section, mode });
    await this.flush();
  }

  /**
   * Cierre de sesión: intenta dejar la nube al día y, si lo consigue, borra el progreso de
   * este dispositivo para que la siguiente persona empiece como invitada. Si no hay
   * conexión, lo conserva (y su dueño) para subirlo la próxima vez que esa cuenta entre.
   */
  async signOut(): Promise<boolean> {
    const synced = await this.flush();
    if (synced) {
      await this.local.clear();
      this.owner.clear();
    }
    this.stop();
    return synced;
  }

  stop(): void {
    if (this.debounce !== null) this.scheduler.clear(this.debounce);
    if (this.retry !== null) this.scheduler.clear(this.retry);
    this.debounce = null;
    this.retry = null;
    this.userId = null;
    this.started = false;
    this.cloudRecords = [];
    this.localRecords = [];
    this.pendingResets = [];
    this.attempt = 0;
    this.update({ status: 'idle', records: [], lastSyncedAt: null });
  }

  private markReady(): void {
    this.resolveReady?.();
  }

  private update(next: Partial<SyncSnapshot>): void {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener(this.state);
  }

  private publishRecords(status: SyncStatus): void {
    this.update({
      status,
      records: mergeRecords(this.cloudRecords, this.localRecords),
      lastSyncedAt: status === 'synced' ? this.now() : this.state.lastSyncedAt,
    });
  }

  /** Serializa las operaciones: nunca dos sincronizaciones a la vez. */
  private async run(task: () => Promise<void>): Promise<void> {
    while (this.running) await this.running;
    const current = task().finally(() => {
      if (this.running === current) this.running = null;
    });
    this.running = current;
    await current;
  }

  private async initialSync(userId: string): Promise<void> {
    this.update({ status: 'syncing' });
    const pulled = await this.cloud.pull();
    if (this.userId !== userId) return;
    const owner = this.owner.read();
    if (!pulled.ok) {
      this.localRecords = await this.local.snapshot();
      this.failed(pulled.reason);
      this.markReady();
      return;
    }
    this.lastPullAt = this.now();
    this.cloudRecords = pulled.records;
    if (owner !== null && owner !== userId) {
      // El progreso local pertenece a otra cuenta: no se mezcla con esta.
      await this.local.clear();
    }
    await this.local.absorb(pulled.records);
    this.owner.write(userId);
    this.markReady();
    await this.pushPending();
  }

  private async pullAndPush(): Promise<void> {
    const pulled = await this.cloud.pull();
    if (!pulled.ok) {
      this.failed(pulled.reason);
      return;
    }
    this.lastPullAt = this.now();
    this.cloudRecords = pulled.records;
    await this.local.absorb(pulled.records);
    await this.pushPending();
  }

  private async pushPending(): Promise<void> {
    if (!this.userId) return;
    while (this.pendingResets.length > 0) {
      const next = this.pendingResets[0]!;
      if (!(await this.cloud.reset(next.section, next.mode))) {
        this.failed('offline');
        return;
      }
      this.pendingResets.shift();
    }
    this.localRecords = await this.local.snapshot();
    const pending = pendingUpload(this.localRecords, this.cloudRecords);
    if (pending.length === 0) {
      this.succeeded();
      return;
    }
    this.update({ status: 'syncing' });
    const pushed = await this.cloud.push(pending);
    if (!pushed.ok) {
      this.failed(pushed.reason);
      return;
    }
    this.cloudRecords = mergeRecords(this.cloudRecords, pushed.records);
    this.succeeded();
  }

  private succeeded(): void {
    this.attempt = 0;
    if (this.retry !== null) this.scheduler.clear(this.retry);
    this.retry = null;
    this.publishRecords('synced');
  }

  private failed(reason: Exclude<CloudResult, { ok: true }>['reason']): void {
    if (reason === 'unauthenticated' || reason === 'unavailable') {
      // Sin sesión válida o sin servicio no tiene sentido reintentar: queda en local.
      this.publishRecords('error');
      return;
    }
    this.publishRecords(reason === 'offline' ? 'offline' : 'pending');
    if (this.retry !== null) return;
    const delay =
      this.retryDelaysMs[Math.min(this.attempt, this.retryDelaysMs.length - 1)] ?? 60000;
    this.attempt += 1;
    this.retry = this.scheduler.set(() => {
      this.retry = null;
      const user = this.userId;
      if (!user) return;
      void (this.lastPullAt === 0 ? this.run(() => this.initialSync(user)) : this.flush());
    }, delay);
  }

  /** Reintento inmediato (por ejemplo, al recuperar la conexión). */
  retryNow(): void {
    if (this.retry === null || !this.userId) return;
    this.scheduler.clear(this.retry);
    this.retry = null;
    const user = this.userId;
    void (this.lastPullAt === 0 ? this.run(() => this.initialSync(user)) : this.flush());
  }
}
