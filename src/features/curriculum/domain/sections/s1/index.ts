import type { CurriculumExtension } from '../../types';
import {
  FUNCTION_CONCEPTS,
  FUNCTION_EXAMPLES,
  FUNCTION_LESSONS,
  FUNCTIONS_BLOCK,
} from './functions';

/** Sección 1 · ampliación «Funciones de una fila» (dataset empleados-select-v2). */
export const S1_FUNCTIONS: CurriculumExtension = {
  kind: 'extension',
  // La Sección 1 tiene 22 lecciones propias (L00–L21): estas son la 23, la 24 y la 25.
  lessonOffset: 22,
  section: 'fundamentos-sql',
  dataset: 'empleados-v2',
  blocks: [FUNCTIONS_BLOCK],
  concepts: FUNCTION_CONCEPTS,
  lessons: FUNCTION_LESSONS,
  examples: FUNCTION_EXAMPLES,
  practice: [],
};
