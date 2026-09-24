import type { LessonId } from '../domain/lesson-outline';
import { LESSON_OUTLINE } from '../domain/lesson-outline';

export const STUDY_PROGRESS_VERSION = 1;

export interface StudyProgressState {
  readonly releaseId: string;
  readonly version: number;
  readonly completed: readonly LessonId[];
  readonly lessonVersions: Readonly<Partial<Record<LessonId, number>>>;
  readonly lastLesson: LessonId | null;
  readonly updatedAt: number;
}

export type StoredStudyProgress =
  | { readonly status: 'found'; readonly data: unknown }
  | { readonly status: 'empty' | 'unavailable' | 'unreadable' };

export interface StudyProgressRepository {
  load(): Promise<StoredStudyProgress>;
  save(progress: StudyProgressState): Promise<boolean>;
  clear(): Promise<boolean>;
}

const LESSON_IDS: readonly LessonId[] = LESSON_OUTLINE.map(({ id }) => id);

function isLessonId(value: unknown): value is LessonId {
  return typeof value === 'string' && (LESSON_IDS as readonly string[]).includes(value);
}

export function emptyStudyProgress(releaseId: string, now: number): StudyProgressState {
  return {
    releaseId,
    version: STUDY_PROGRESS_VERSION,
    completed: [],
    lessonVersions: {},
    lastLesson: null,
    updatedAt: now,
  };
}

export type ParsedStudyProgress =
  | { readonly status: 'valid'; readonly progress: StudyProgressState }
  | { readonly status: 'other-release' };

/**
 * Valida un progreso leído del almacenamiento. Descarta identificadores desconocidos y
 * versiones no numéricas: un dato manipulado no puede marcar lecciones inexistentes.
 */
export function parseStudyProgress(data: unknown, releaseId: string): ParsedStudyProgress {
  if (!data || typeof data !== 'object') return { status: 'other-release' };
  const item = data as Record<string, unknown>;
  if (item.releaseId !== releaseId || item.version !== STUDY_PROGRESS_VERSION) {
    return { status: 'other-release' };
  }
  const completed = Array.isArray(item.completed)
    ? [...new Set(item.completed.filter(isLessonId))]
    : [];
  const versions: Partial<Record<LessonId, number>> = {};
  if (item.lessonVersions && typeof item.lessonVersions === 'object') {
    for (const [id, version] of Object.entries(item.lessonVersions as Record<string, unknown>)) {
      if (isLessonId(id) && typeof version === 'number' && Number.isInteger(version)) {
        versions[id] = version;
      }
    }
  }
  return {
    status: 'valid',
    progress: {
      releaseId,
      version: STUDY_PROGRESS_VERSION,
      completed,
      lessonVersions: versions,
      lastLesson: isLessonId(item.lastLesson) ? item.lastLesson : null,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : 0,
    },
  };
}

/** Visitar una lección solo recuerda dónde seguir; nunca la marca como completada (U02). */
export function withVisitedLesson(
  progress: StudyProgressState,
  id: LessonId,
  now: number,
): StudyProgressState {
  return progress.lastLesson === id ? progress : { ...progress, lastLesson: id, updatedAt: now };
}

export function withCompletedLesson(
  progress: StudyProgressState,
  id: LessonId,
  lessonVersion: number,
  now: number,
): StudyProgressState {
  return {
    ...progress,
    completed: progress.completed.includes(id) ? progress.completed : [...progress.completed, id],
    lessonVersions: { ...progress.lessonVersions, [id]: lessonVersion },
    lastLesson: id,
    updatedAt: now,
  };
}

/** Lecciones completadas con una versión anterior del contenido. */
export function updatedLessons(
  progress: StudyProgressState,
  currentVersions: Readonly<Record<LessonId, number>>,
): readonly LessonId[] {
  return progress.completed.filter((id) => progress.lessonVersions[id] !== currentVersions[id]);
}

/** Lecciones vigentes completadas: las desactualizadas no cuentan para el porcentaje. */
export function currentCompletedCount(
  progress: StudyProgressState,
  currentVersions: Readonly<Record<LessonId, number>>,
): number {
  return progress.completed.filter((id) => progress.lessonVersions[id] === currentVersions[id])
    .length;
}
