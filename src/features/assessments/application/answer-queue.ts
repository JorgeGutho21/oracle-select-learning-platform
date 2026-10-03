import type { Answer, AnswerEntry, ExamItem, SaveOutcome } from './exam-wire';
import { MAX_ANSWERS_PER_BATCH } from './exam-wire';

/**
 * Autoguardado del examen. Cada cambio sube la revisión de esa pregunta, se guarda primero
 * en el dispositivo y se envía agrupado unos instantes después. La base solo acepta una
 * revisión mayor que la guardada, así que reintentos y peticiones atrasadas nunca pisan una
 * respuesta nueva. Una respuesta local solo se borra cuando el servidor confirma su revisión.
 */

export interface ExamGateway {
  saveAnswers(
    attemptId: string,
    position: number,
    entries: readonly AnswerEntry[],
  ): Promise<SaveOutcome | 'network'>;
}

export interface DraftSnapshot {
  readonly position: number;
  readonly entries: readonly AnswerEntry[];
}

/** Copia local de lo que aún no confirmó el servidor (almacenamiento del navegador). */
export interface ExamDraftStore {
  load(attemptId: string): DraftSnapshot | null;
  save(attemptId: string, snapshot: DraftSnapshot): void;
  clear(attemptId: string): void;
}

export interface QueueScheduler {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'offline' | 'finished';

export interface ItemState {
  readonly answer: Answer | null;
  readonly flagged: boolean;
  readonly revision: number;
  readonly savedRevision: number;
}

export interface QueueSnapshot {
  readonly status: SaveStatus;
  readonly items: ReadonlyMap<number, ItemState>;
  readonly pending: number;
}

const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000, 30_000];

export class AnswerQueue {
  private readonly items = new Map<number, ItemState>();
  private status: SaveStatus = 'saved';
  private position = 1;
  private timer: unknown = null;
  private inFlight = false;
  private failures = 0;
  private disposed = false;
  private started = false;
  private readonly listeners = new Set<() => void>();
  private current: QueueSnapshot;
  private onFinished: () => void = () => undefined;

  /**
   * Solo con lo que envió el servidor: así el primer render del navegador coincide con el
   * HTML del servidor. La copia local se fusiona en `start()`.
   */
  constructor(
    private readonly attemptId: string,
    private readonly serverItems: readonly ExamItem[],
    private readonly deps: {
      readonly gateway: ExamGateway;
      readonly store: ExamDraftStore;
      readonly scheduler: QueueScheduler;
    },
    private readonly debounceMs = 700,
  ) {
    for (const item of serverItems) {
      this.items.set(item.position, {
        answer: item.answer,
        flagged: item.flagged,
        revision: item.revision,
        savedRevision: item.revision,
      });
    }
    this.current = this.build();
  }

  /** Fusiona lo pendiente de este dispositivo y reanuda el envío. */
  start(onFinished: () => void = () => undefined): void {
    this.onFinished = onFinished;
    this.disposed = false;
    if (!this.started) {
      this.started = true;
      const draft = this.deps.store.load(this.attemptId);
      for (const mine of draft?.entries ?? []) {
        const confirmed = this.serverItems.find((item) => item.position === mine.position);
        // Lo local gana solo si es más nuevo que lo que confirmó el servidor.
        if (confirmed && mine.revision > confirmed.revision) {
          this.items.set(mine.position, {
            answer: mine.answer,
            flagged: mine.flagged,
            revision: mine.revision,
            savedRevision: confirmed.revision,
          });
        }
      }
      if (draft?.position) this.position = draft.position;
      this.persist();
    }
    if (this.pendingEntries().length > 0) {
      this.status = 'pending';
      this.schedule(0);
    }
    this.emit();
  }

  /** Para useSyncExternalStore. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): QueueSnapshot => this.current;

  snapshot(): QueueSnapshot {
    return this.current;
  }

  private build(): QueueSnapshot {
    return {
      status: this.status,
      items: new Map(this.items),
      pending: this.pendingEntries().length,
    };
  }

  setPosition(position: number): void {
    this.position = position;
  }

  answer(position: number, answer: Answer | null): void {
    this.update(position, (item) => ({ ...item, answer }));
  }

  flag(position: number, flagged: boolean): void {
    this.update(position, (item) => ({ ...item, flagged }));
  }

  /** Envía ya lo pendiente (al volver la conexión o antes de entregar). */
  async flushNow(): Promise<void> {
    if (this.timer !== null) this.deps.scheduler.clearTimeout(this.timer);
    this.timer = null;
    await this.flush();
  }

  hasPending(): boolean {
    return this.pendingEntries().length > 0;
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer !== null) this.deps.scheduler.clearTimeout(this.timer);
  }

  private update(position: number, change: (item: ItemState) => ItemState): void {
    if (this.status === 'finished') return;
    const current = this.items.get(position);
    if (!current) return;
    const next = change(current);
    this.items.set(position, {
      ...next,
      revision: Math.max(current.revision, current.savedRevision) + 1,
    });
    this.persist();
    if (this.status !== 'offline' && !this.inFlight) this.status = 'pending';
    this.emit();
    this.schedule(this.debounceMs);
  }

  private pendingEntries(): AnswerEntry[] {
    const entries: AnswerEntry[] = [];
    for (const [position, item] of this.items) {
      if (item.revision > item.savedRevision) {
        entries.push({
          position,
          answer: item.answer,
          flagged: item.flagged,
          revision: item.revision,
        });
      }
    }
    return entries;
  }

  private persist(): void {
    const entries = this.pendingEntries();
    if (entries.length === 0) this.deps.store.clear(this.attemptId);
    else this.deps.store.save(this.attemptId, { position: this.position, entries });
  }

  private schedule(ms: number): void {
    if (this.disposed) return;
    if (this.timer !== null) this.deps.scheduler.clearTimeout(this.timer);
    this.timer = this.deps.scheduler.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, ms);
  }

  private async flush(): Promise<void> {
    if (this.inFlight || this.disposed || this.status === 'finished') return;
    const entries = this.pendingEntries().slice(0, MAX_ANSWERS_PER_BATCH);
    if (entries.length === 0) {
      this.status = 'saved';
      this.emit();
      return;
    }
    this.inFlight = true;
    this.status = 'saving';
    this.emit();
    let outcome: SaveOutcome | 'network';
    try {
      outcome = await this.deps.gateway.saveAnswers(this.attemptId, this.position, entries);
    } catch {
      outcome = 'network';
    }
    this.inFlight = false;
    if (this.disposed) return;
    if (outcome === 'network' || outcome.status === 'invalid' || outcome.status === 'not-found') {
      this.status = 'offline';
      const delay = RETRY_DELAYS_MS[Math.min(this.failures, RETRY_DELAYS_MS.length - 1)]!;
      this.failures += 1;
      this.emit();
      this.schedule(delay);
      return;
    }
    if (outcome.status === 'finished') {
      this.status = 'finished';
      this.emit();
      this.onFinished();
      return;
    }
    this.failures = 0;
    const confirmed = new Map(outcome.saved.map((entry) => [entry.position, entry.revision]));
    for (const position of outcome.rejected) {
      // La base rechazó la forma de la respuesta: no tiene sentido reenviarla.
      const sent = entries.find((entry) => entry.position === position);
      if (sent) confirmed.set(position, sent.revision);
    }
    for (const [position, revision] of confirmed) {
      const item = this.items.get(position);
      if (item)
        this.items.set(position, {
          ...item,
          savedRevision: Math.max(item.savedRevision, revision),
        });
    }
    this.persist();
    const remaining = this.pendingEntries().length;
    this.status = remaining > 0 ? 'pending' : 'saved';
    this.emit();
    if (remaining > 0) this.schedule(this.debounceMs);
  }

  private emit(): void {
    this.current = this.build();
    for (const listener of this.listeners) listener();
  }
}
