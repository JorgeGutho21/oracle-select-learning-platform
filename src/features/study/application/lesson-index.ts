import {
  LESSON_OUTLINE,
  STUDY_BLOCKS,
  type LessonId,
  type LessonOutline,
} from '../domain/lesson-outline';

/**
 * Índice ligero de lecciones para el navegador (progreso, temario, buscador): no incluye el
 * contenido de las lecciones, que se renderiza en el servidor.
 */

/** Versión del recorrido: el progreso guardado con otra versión se descarta. */
export const STUDY_RELEASE_ID = 'select-study-v2';

/** Versión del contenido de cada lección; subirla marca el progreso como «desactualizado». */
export const LESSON_CONTENT_VERSION = 1;

export interface LessonIndexEntry extends LessonOutline {
  readonly number: number;
  readonly version: number;
}

export const LESSON_INDEX: readonly LessonIndexEntry[] = LESSON_OUTLINE.map((lesson, index) => ({
  ...lesson,
  number: index + 1,
  version: LESSON_CONTENT_VERSION,
}));

export const LESSON_VERSIONS = Object.fromEntries(
  LESSON_INDEX.map(({ id, version }) => [id, version]),
) as Readonly<Record<LessonId, number>>;

export const LESSON_COUNT = LESSON_INDEX.length;

export { STUDY_BLOCKS };
export type { LessonId };
