/**
 * Progreso de aprendizaje como conjunto de elementos (lección, misión, escena) por sección
 * y modo. Es el mismo modelo en el dispositivo y en la nube; la fusión es monótona, igual
 * que el disparador de `learning_progress`: un elemento completado nunca vuelve atrás, el
 * porcentaje no baja y la posición la decide la actividad más reciente. Fusionar dos veces
 * da el mismo resultado (idempotente) y el orden no importa (conmutativa).
 */

/** Elemento único del modo de posición de la exposición (Iniciar clase). */
export const CLASS_ITEM = 'scenes';

export const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export interface ProgressKey {
  readonly section: string;
  readonly mode: string;
  readonly item: string;
}

export interface ProgressRecord extends ProgressKey {
  readonly status: ProgressStatus;
  readonly percent: number;
  /** Versión del contenido con la que se completó; `null` si el elemento no tiene versión. */
  readonly contentVersion: number | null;
  /** Posición dentro del elemento (por ejemplo `{ scene: 7 }`). */
  readonly state: Readonly<Record<string, number | string | boolean>>;
  /** Momento de la actividad, en milisegundos; 0 si no se conoce. */
  readonly lastActivityAt: number;
}

const RANK: Readonly<Record<ProgressStatus, number>> = {
  not_started: 0,
  in_progress: 1,
  completed: 2,
};

export function progressKey(key: ProgressKey): string {
  return `${key.section}/${key.mode}/${key.item}`;
}

function clampPercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

export function normalizeRecord(record: ProgressRecord): ProgressRecord {
  const percent = record.status === 'completed' ? 100 : clampPercent(record.percent);
  return { ...record, percent };
}

function maxVersion(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

/** Fusión de dos registros del mismo elemento. */
export function mergeRecord(a: ProgressRecord, b: ProgressRecord): ProgressRecord {
  const status = RANK[a.status] >= RANK[b.status] ? a.status : b.status;
  // Con la misma marca de tiempo se elige siempre el mismo estado (orden independiente).
  const newer =
    b.lastActivityAt > a.lastActivityAt ||
    (b.lastActivityAt === a.lastActivityAt && JSON.stringify(b.state) > JSON.stringify(a.state))
      ? b
      : a;
  return normalizeRecord({
    section: a.section,
    mode: a.mode,
    item: a.item,
    status,
    percent: Math.max(a.percent, b.percent),
    contentVersion: maxVersion(a.contentVersion, b.contentVersion),
    state: newer.state,
    lastActivityAt: Math.max(a.lastActivityAt, b.lastActivityAt),
  });
}

/** Une dos conjuntos: nunca pierde un elemento ni reduce su avance. */
export function mergeRecords(
  ...sets: readonly (readonly ProgressRecord[])[]
): readonly ProgressRecord[] {
  const merged = new Map<string, ProgressRecord>();
  for (const set of sets) {
    for (const record of set) {
      const key = progressKey(record);
      const current = merged.get(key);
      merged.set(key, current ? mergeRecord(current, record) : normalizeRecord(record));
    }
  }
  return [...merged.values()];
}

function sameRecord(a: ProgressRecord, b: ProgressRecord): boolean {
  return (
    a.status === b.status &&
    a.percent === b.percent &&
    a.contentVersion === b.contentVersion &&
    a.lastActivityAt === b.lastActivityAt &&
    JSON.stringify(a.state) === JSON.stringify(b.state)
  );
}

/**
 * Registros que la nube todavía no tiene: los que faltan o los que, fusionados con la
 * versión de la nube, la cambian. Subir solo esto evita escrituras innecesarias.
 */
export function pendingUpload(
  local: readonly ProgressRecord[],
  cloud: readonly ProgressRecord[],
): readonly ProgressRecord[] {
  const known = new Map(cloud.map((record) => [progressKey(record), record]));
  return local.filter((record) => {
    const remote = known.get(progressKey(record));
    return !remote || !sameRecord(mergeRecord(remote, record), remote);
  });
}

/** El elemento con la actividad más reciente de un modo: «dónde me quedé». */
export function latestRecord(
  records: readonly ProgressRecord[],
  filter: (record: ProgressRecord) => boolean = () => true,
): ProgressRecord | null {
  let latest: ProgressRecord | null = null;
  for (const record of records) {
    if (!filter(record) || record.lastActivityAt <= 0) continue;
    if (!latest || record.lastActivityAt > latest.lastActivityAt) latest = record;
  }
  return latest;
}
