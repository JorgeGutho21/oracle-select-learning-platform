import { LESSON_CONTENT_A } from './lesson-content-a';
import { LESSON_CONTENT_B } from './lesson-content-b';
import type { LessonContent } from './lesson-types';

export type * from './lesson-types';

/** Contenido completo de las 22 lecciones, indexado por ruta. */
export const LESSON_CONTENT: readonly LessonContent[] = [...LESSON_CONTENT_A, ...LESSON_CONTENT_B];

export function findLessonContent(slug: string): LessonContent | undefined {
  return LESSON_CONTENT.find((lesson) => lesson.slug === slug);
}
