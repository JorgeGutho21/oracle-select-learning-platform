import {
  CLASS_ITEM,
  mergeRecord,
  progressKey,
  type ProgressRecord,
} from '@/features/progress/domain/progress';
import { readProgressRecord } from '@/features/progress/application/progress-wire';
import { outlineOf } from './outline';

/**
 * Progreso local de las secciones de la fuente curricular (lecciones, prácticas, misiones y
 * escena de la clase), en el mismo formato de registro que la sincronización de la Fase 2. Un
 * invitado lo guarda solo en su navegador; con sesión, la sincronización lo sube y absorbe lo
 * que llega de la nube sin quitar nunca avance.
 */

export interface CurriculumProgressStorage {
  load(): unknown;
  save(records: readonly ProgressRecord[]): boolean;
  clear(): void;
}

export interface MissionScore {
  readonly points: number;
  readonly result: 'solved' | 'revealed';
}

/** ¿Pertenece el registro a una sección de la fuente curricular? */
export function isCurriculumRecord(record: Pick<ProgressRecord, 'section'>): boolean {
  return outlineOf(record.section) !== undefined;
}

export class CurriculumProgressStore {
  private records = new Map<string, ProgressRecord>();
  private loaded = false;
  private version = 0;
  private cached: { version: number; records: readonly ProgressRecord[] } | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: CurriculumProgressStorage,
    private readonly onChange: () => void = () => {},
    private readonly now: () => number = () => Date.now(),
  ) {}

  private ensure(): void {
    if (this.loaded) return;
    this.loaded = true;
    const data = this.storage.load();
    if (!Array.isArray(data)) return;
    for (const entry of data) {
      const record = readProgressRecord(entry);
      if (record && isCurriculumRecord(record)) this.records.set(progressKey(record), record);
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Copia estable entre cambios (para useSyncExternalStore). */
  getSnapshot = (): readonly ProgressRecord[] => {
    this.ensure();
    if (this.cached?.version !== this.version) {
      this.cached = { version: this.version, records: [...this.records.values()] };
    }
    return this.cached.records;
  };

  private commit(changed: boolean, notifySync: boolean): void {
    if (!changed) return;
    this.version += 1;
    this.storage.save([...this.records.values()]);
    for (const listener of this.listeners) listener();
    if (notifySync) this.onChange();
  }

  private upsert(record: ProgressRecord): boolean {
    const key = progressKey(record);
    const current = this.records.get(key);
    const next = current ? mergeRecord(current, record) : record;
    if (current && JSON.stringify(current) === JSON.stringify(next)) return false;
    this.records.set(key, next);
    return true;
  }

  completed(section: string, mode: string): ReadonlySet<string> {
    return new Set(
      this.getSnapshot()
        .filter((record) => record.section === section && record.mode === mode)
        .filter((record) => record.status === 'completed')
        .map((record) => record.item),
    );
  }

  /** Lección abierta (en curso) o completada con su versión de contenido. */
  lesson(section: string, lessonId: string, version: number, completed: boolean): void {
    this.ensure();
    this.commit(
      this.upsert({
        section,
        mode: 'study',
        item: lessonId,
        status: completed ? 'completed' : 'in_progress',
        percent: completed ? 100 : 0,
        contentVersion: completed ? version : null,
        state: {},
        lastActivityAt: this.now(),
      }),
      true,
    );
  }

  practice(section: string, activityId: string): void {
    this.ensure();
    this.commit(
      this.upsert({
        section,
        mode: 'practice',
        item: activityId,
        status: 'completed',
        percent: 100,
        contentVersion: null,
        state: {},
        lastActivityAt: this.now(),
      }),
      true,
    );
  }

  mission(section: string, missionId: string, score: MissionScore): void {
    this.ensure();
    this.commit(
      this.upsert({
        section,
        mode: 'challenge',
        item: missionId,
        status: 'completed',
        percent: 100,
        contentVersion: null,
        state: { points: score.points, result: score.result },
        lastActivityAt: this.now(),
      }),
      true,
    );
  }

  /** Puntos guardados de cada misión cerrada. */
  missionScores(section: string): ReadonlyMap<string, MissionScore> {
    const scores = new Map<string, MissionScore>();
    for (const record of this.getSnapshot()) {
      if (record.section !== section || record.mode !== 'challenge') continue;
      const points = record.state.points;
      const result = record.state.result;
      if (typeof points === 'number' && (result === 'solved' || result === 'revealed')) {
        scores.set(record.item, { points, result });
      }
    }
    return scores;
  }

  scene(section: string, scene: number, total: number): void {
    this.ensure();
    if (!Number.isInteger(scene) || scene < 1 || scene > total) return;
    const key = progressKey({ section, mode: 'class', item: CLASS_ITEM });
    const current = this.records.get(key);
    // La posición es la última escena vista (no se fusiona): el porcentaje guarda el máximo.
    const record: ProgressRecord = {
      section,
      mode: 'class',
      item: CLASS_ITEM,
      status: scene === total || current?.status === 'completed' ? 'completed' : 'in_progress',
      percent: Math.max(current?.percent ?? 0, Math.round((scene / total) * 100)),
      contentVersion: null,
      state: { scene },
      lastActivityAt: this.now(),
    };
    this.records.set(key, record);
    this.commit(true, true);
  }

  lastScene(section: string): number | null {
    const record = this.getSnapshot().find(
      (entry) => entry.section === section && entry.mode === 'class',
    );
    const scene = record?.state.scene;
    return typeof scene === 'number' ? scene : null;
  }

  /** Registros de la nube: se integran sin quitar avance. */
  absorb(records: readonly ProgressRecord[]): void {
    this.ensure();
    let changed = false;
    for (const record of records) {
      if (isCurriculumRecord(record)) changed = this.upsert(record) || changed;
    }
    this.commit(changed, false);
  }

  /** Reinicia un modo de una sección (por ejemplo, volver a hacer las prácticas). */
  resetMode(section: string, mode: string): void {
    this.ensure();
    let changed = false;
    for (const [key, record] of this.records) {
      if (record.section === section && record.mode === mode) {
        this.records.delete(key);
        changed = true;
      }
    }
    this.commit(changed, false);
  }

  clear(): void {
    this.records.clear();
    this.loaded = true;
    this.storage.clear();
    this.version += 1;
    for (const listener of this.listeners) listener();
  }
}
