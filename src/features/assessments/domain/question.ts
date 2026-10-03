import type { CellValue } from '@/domain/dataset/empleados';
import type { SectionId } from '@/features/sections/domain/sections';

/**
 * Banco de preguntas (docs/QUESTION_BANK_SPEC.md). El tipo pedagógico decide cómo se
 * presenta la pregunta; la forma de respuesta, cómo se contesta y se califica. Añadir un tipo
 * nuevo es añadirlo aquí y en la restricción de `question_bank`; una forma de respuesta nueva
 * (texto, SQL ejecutado en Oracle) necesita además su calificación en la base.
 */

export const QUESTION_TYPES = [
  'single_choice',
  'multiple_choice',
  'predict_result',
  'find_error',
  'choose_query',
  'interpret_query',
  'order_fragments',
  'compare_results',
  'concept',
  'short_case',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const RESPONSE_KINDS = ['single', 'multiple', 'order'] as const;
export type ResponseKind = (typeof RESPONSE_KINDS)[number];

export const QUESTION_TYPE_LABEL: Readonly<Record<QuestionType, string>> = {
  single_choice: 'Selección única',
  multiple_choice: 'Selección múltiple',
  predict_result: 'Predicción de resultado',
  find_error: 'Identificación de error',
  choose_query: 'Elección de consulta',
  interpret_query: 'Interpretación de consulta',
  order_fragments: 'Ordenamiento de fragmentos',
  compare_results: 'Comparación de resultados',
  concept: 'Concepto Oracle',
  short_case: 'Caso corto',
};

/** Formas de respuesta que admite cada tipo (la base aplica la misma regla). */
export const RESPONSE_KINDS_BY_TYPE: Readonly<Record<QuestionType, readonly ResponseKind[]>> = {
  single_choice: ['single'],
  multiple_choice: ['multiple'],
  predict_result: ['single'],
  find_error: ['single'],
  choose_query: ['single'],
  interpret_query: ['single'],
  order_fragments: ['order'],
  compare_results: ['single', 'multiple'],
  concept: ['single', 'multiple'],
  short_case: ['single', 'multiple'],
};

export const RESPONSE_INSTRUCTION: Readonly<Record<ResponseKind, string>> = {
  single: 'Elige una respuesta.',
  multiple: 'Elige todas las respuestas correctas.',
  order: 'Ordena los fragmentos.',
};

export const QUESTION_STATUSES = ['draft', 'published', 'retired'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_STATUS_LABEL: Readonly<Record<QuestionStatus, string>> = {
  draft: 'Borrador',
  published: 'Publicada',
  retired: 'Retirada',
};

export const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Peso por defecto según la dificultad interna: 1; 1,25; 1,5; 1,75; 2. Cada pregunta puede
 * tener otro peso (entre 0,25 y 10) y la evaluación lo congela al publicar.
 */
export function defaultWeight(difficulty: Difficulty): number {
  return 1 + (difficulty - 1) * 0.25;
}

/** Tabla que acompaña a la pregunta o a una opción (solo datos; se pinta como tabla). */
export interface DataTable {
  readonly caption?: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly CellValue[])[];
}

/** Material de la pregunta: tablas de origen y consultas que se comparan. */
export interface Exhibit {
  readonly tables?: readonly DataTable[];
  readonly queries?: readonly { readonly label: string; readonly sql: string }[];
}

export type OptionKind = 'text' | 'code' | 'table';

export interface OptionDraft {
  readonly body: string;
  readonly kind?: OptionKind;
  readonly result?: DataTable;
  readonly correct?: boolean;
  /** Posición correcta (1…n) en las preguntas de ordenar. */
  readonly order?: number;
  /** Por qué es correcta o qué confusión revela si se elige. */
  readonly feedback?: string;
}

/** Contenido completo de una pregunta, tal como se guarda en el banco. */
export interface QuestionContent {
  readonly section: SectionId;
  readonly topic: string;
  readonly subtopic: string;
  readonly type: QuestionType;
  readonly response: ResponseKind;
  readonly difficulty: Difficulty;
  readonly weight?: number;
  readonly prompt: string;
  readonly code?: string;
  readonly exhibit?: Exhibit;
  readonly options: readonly OptionDraft[];
  /** Por qué la respuesta correcta lo es. */
  readonly explanation: string;
  /** Concepto relacionado. */
  readonly concept: string;
  /** Qué revisar si se falla (lección o recurso de DB LAB). */
  readonly review: string;
  /** Fuente académica: documentación oficial de Oracle o contenido validado de DB LAB. */
  readonly reference: string;
  readonly tags?: readonly string[];
}

/** Problemas de forma, con los mismos códigos que devuelve la base. */
export function questionProblems(content: Pick<QuestionContent, 'response' | 'options'>): string[] {
  const { response, options } = content;
  const problems: string[] = [];
  if (options.length < 2 || options.length > 8) problems.push('options-count');
  if (options.some((option) => option.body.trim() === '')) problems.push('option-body');
  if (options.some((option) => option.kind === 'table' && !option.result)) {
    problems.push('option-table');
  }
  const correct = options.filter((option) => option.correct).length;
  if (response === 'single' && correct !== 1) problems.push('single-correct');
  if (response === 'multiple' && (correct < 1 || correct >= options.length)) {
    problems.push('multiple-correct');
  }
  if (response === 'order') {
    const orders = options.map((option) => option.order ?? 0).sort((a, b) => a - b);
    if (orders.some((value, index) => value !== index + 1)) problems.push('order-permutation');
  }
  return problems;
}
