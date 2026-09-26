import {
  analyzeLabQuery,
  EMPLEADOS,
  explainQuery,
  type ExplainedQuery,
} from '@/features/laboratory/application/lab-api';
import { findLessonContent } from '../domain/lesson-content';
import type {
  BuildStep,
  LessonComparison,
  LessonContent,
  MiniCheck,
} from '../domain/lesson-content';
import { blockOf, type LessonOutline, type StudyBlock } from '../domain/lesson-outline';
import { LESSON_INDEX } from './lesson-index';

export type { BlockId, LessonId, LessonOutline, StudyBlock } from '../domain/lesson-outline';
export type {
  CheckOption,
  LessonComparison,
  LessonContent,
  LessonError,
  LessonNote,
  MiniCheck,
} from '../domain/lesson-content';
export { STUDY_BLOCKS } from '../domain/lesson-outline';

export {
  LESSON_COUNT,
  LESSON_INDEX,
  LESSON_VERSIONS,
  STUDY_RELEASE_ID,
  type LessonIndexEntry,
} from './lesson-index';

export const STUDY_DATASET = EMPLEADOS;

export interface StudyLesson extends LessonOutline {
  readonly version: number;
  readonly number: number;
  readonly content: LessonContent;
  readonly blockInfo: StudyBlock;
}

/** Datos de una mini comprobación listos para la interfaz, con su respuesta calculada. */
export type CheckView =
  | (Extract<MiniCheck, { kind: 'choice' }> & { readonly answer: number })
  | (Extract<MiniCheck, { kind: 'count' }> & { readonly answer: number })
  | (Extract<MiniCheck, { kind: 'number' }> & { readonly answer: number })
  | (Extract<MiniCheck, { kind: 'order' }> & {
      readonly answer: readonly string[];
      /** Orden fijo y mezclado en que se ofrecen las piezas. */
      readonly shuffled: readonly string[];
    });

export const LESSONS: readonly StudyLesson[] = LESSON_INDEX.map((entry) => {
  const content = findLessonContent(entry.slug);
  if (!content) throw new Error(`Falta el contenido de la lección ${entry.slug}.`);
  return { ...entry, content, blockInfo: blockOf(entry.block) };
});

export function getLesson(slug: string): StudyLesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

export function lessonsOfBlock(block: StudyBlock['id']): readonly StudyLesson[] {
  return LESSONS.filter((lesson) => lesson.block === block);
}

export function lessonNeighbors(slug: string): {
  readonly previous: StudyLesson | null;
  readonly next: StudyLesson | null;
} {
  const index = LESSONS.findIndex((lesson) => lesson.slug === slug);
  return {
    previous: index > 0 ? LESSONS[index - 1]! : null,
    next: index >= 0 && index < LESSONS.length - 1 ? LESSONS[index + 1]! : null,
  };
}

/** Enlace al laboratorio con la consulta y el camino de vuelta a la lección. */
export function lessonLabHref(sql: string, returnTo: string): string {
  return `/lab?${new URLSearchParams({ sql, returnTo }).toString()}`;
}

/** Mezcla determinista: el mismo orden en el servidor y en el navegador. */
function shuffle(pieces: readonly string[]): string[] {
  const shuffled = [...pieces].sort((a, b) => a.localeCompare(b, 'es'));
  return shuffled.join('|') === pieces.join('|') ? [...pieces].reverse() : shuffled;
}

export function checkView(check: MiniCheck): CheckView {
  switch (check.kind) {
    case 'choice':
      return { ...check, answer: check.options.findIndex((option) => option.correct) };
    case 'count': {
      const analysis = analyzeLabQuery(check.sql);
      if (!analysis.preview) throw new Error(`Consulta de comprobación inválida: ${check.sql}`);
      return {
        ...check,
        answer:
          check.measure === 'rows' ? analysis.preview.rows.length : analysis.preview.columns.length,
      };
    }
    case 'number': {
      const value = analyzeLabQuery(check.sql).preview?.rows[0]?.[0];
      if (typeof value !== 'number') throw new Error(`Consulta numérica inválida: ${check.sql}`);
      return { ...check, answer: value };
    }
    case 'order':
      return { ...check, answer: check.pieces, shuffled: shuffle(check.pieces) };
  }
}

/** Vista de una lección con sus tablas calculadas por el motor. */
export interface LessonView {
  readonly lesson: StudyLesson;
  readonly example: ExplainedQuery;
  readonly comparisons: readonly (LessonComparison & { readonly explained: ExplainedQuery })[];
  readonly steps: readonly (BuildStep & { readonly explained: ExplainedQuery })[];
  readonly check: CheckView;
}

export function lessonView(lesson: StudyLesson): LessonView {
  const { content } = lesson;
  const options = content.sourceColumns ? { sourceColumns: content.sourceColumns } : {};
  // Muestras rotuladas «N de 20 filas» (con filas que cumplen y que no) en lugar de muros de
  // tablas completas; EMPLEADOS y DISTINCT necesitan ver la tabla entera.
  const exampleRows = content.fullTable ? {} : { maxRows: 10 };
  return {
    lesson,
    example: explainQuery(content.example.sql, { ...options, ...exampleRows }),
    comparisons: (content.comparisons ?? []).map((comparison) => ({
      ...comparison,
      explained: explainQuery(comparison.sql, { ...options, maxRows: 6 }),
    })),
    steps: (content.steps ?? []).map((step) => ({
      ...step,
      explained: explainQuery(step.sql, { ...options, maxRows: 6 }),
    })),
    check: checkView(content.check),
  };
}
