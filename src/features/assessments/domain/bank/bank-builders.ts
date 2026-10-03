import { EMPLEADOS_DATASET, type EmpleadosColumn } from '@/domain/dataset/empleados';
import { runEducational } from '@/domain/sql/educational-run';
import type { DataTable, OptionDraft, QuestionContent } from '../question';

/**
 * Ayudas para escribir el banco oficial sin transcribir resultados a mano: la tabla de origen
 * y el resultado correcto salen del dataset y del motor educativo de DB LAB (el mismo que
 * `tests/integration/oracle-real.test.ts` compara con Oracle). Las comprobaciones (`checks`)
 * las ejecutan las pruebas del banco; no viajan a la base.
 */

export type BankCheck =
  /** La consulta devuelve exactamente estas filas (sobre todo el dataset o sobre `ids`). */
  | {
      readonly kind: 'rows';
      readonly sql: string;
      readonly rows: number;
      readonly ids?: readonly number[];
    }
  /** La consulta falla en Oracle (y en el motor educativo). */
  | { readonly kind: 'error'; readonly sql: string }
  /** La consulta es válida. */
  | { readonly kind: 'valid'; readonly sql: string }
  /** `sql` devuelve (o no) lo mismo que `target`. */
  | {
      readonly kind: 'same';
      readonly sql: string;
      readonly target: string;
      readonly expected: boolean;
    }
  /** Títulos de las columnas del resultado. */
  | { readonly kind: 'columns'; readonly sql: string; readonly columns: readonly string[] };

export interface OfficialQuestion extends QuestionContent {
  /** Clave estable (external_key). Cambiar el contenido crea una versión nueva, no otra clave. */
  readonly key: string;
  readonly checks?: readonly BankCheck[];
}

function dataset(ids?: readonly number[]) {
  if (!ids) return EMPLEADOS_DATASET;
  return {
    ...EMPLEADOS_DATASET,
    rows: EMPLEADOS_DATASET.rows.filter((row) => ids.includes(row.ID_EMPLEADO)),
  };
}

/** Resultado de la consulta en el motor educativo, o `null` si no es válida. */
export function evaluate(sql: string, ids?: readonly number[]): DataTable | null {
  const run = runEducational(sql, dataset(ids));
  if (!run.result || run.runtimeError) return null;
  return {
    columns: [...run.result.table.columns],
    rows: run.result.table.rows.map((row) => [...row]),
  };
}

function predicted(sql: string, ids?: readonly number[]): DataTable {
  const table = evaluate(sql, ids);
  if (!table) throw new Error(`Consulta del banco no válida: ${sql}`);
  return table;
}

/** Filas del dataset (en orden de ID) con las columnas que necesita la pregunta. */
export function source(
  ids: readonly number[],
  columns: readonly EmpleadosColumn[],
  caption = 'EMPLEADOS (filas de esta pregunta)',
): DataTable {
  return {
    caption,
    columns,
    rows: dataset(ids).rows.map((row) => columns.map((column) => row[column])),
  };
}

function placeAt<T>(items: readonly T[], item: T, index: number): T[] {
  const copy = [...items];
  copy.splice(Math.min(index, copy.length), 0, item);
  return copy;
}

/**
 * Opciones de predicción: la correcta es el resultado real de `sql` (sobre `ids`); los
 * distractores son tablas escritas a mano que representan confusiones frecuentes.
 */
export function resultOptions(
  sql: string,
  ids: readonly number[] | undefined,
  correct: { readonly body: string; readonly feedback: string; readonly at: number },
  distractors: readonly {
    readonly body: string;
    readonly rows: DataTable['rows'];
    readonly feedback: string;
  }[],
): OptionDraft[] {
  const table = predicted(sql, ids);
  const wrong = distractors.map<OptionDraft>(({ body, rows, feedback }) => ({
    body,
    kind: 'table',
    result: { columns: table.columns, rows },
    feedback,
  }));
  return placeAt(
    wrong,
    { body: correct.body, kind: 'table', result: table, correct: true, feedback: correct.feedback },
    correct.at,
  );
}

/** Opciones que son consultas: correcta si devuelve lo mismo que `target` (lo comprueba la prueba). */
export function queryOptions(
  target: string,
  options: readonly {
    readonly sql: string;
    readonly correct?: boolean;
    readonly feedback: string;
  }[],
): { options: OptionDraft[]; checks: BankCheck[] } {
  return {
    options: options.map(({ sql, correct, feedback }) => ({
      body: sql,
      kind: 'code',
      correct: Boolean(correct),
      feedback,
    })),
    checks: options.map(({ sql, correct }) => ({
      kind: 'same',
      sql,
      target,
      expected: Boolean(correct),
    })),
  };
}

/** Fragmentos a ordenar, en el orden correcto. */
export function fragments(
  parts: readonly string[],
  feedback: readonly string[] = [],
): OptionDraft[] {
  return parts.map((body, index) => ({
    body,
    kind: 'code',
    order: index + 1,
    feedback: feedback[index] ?? '',
  }));
}

export const SECTION_1 = 'fundamentos-sql' as const;

export const REF = {
  select:
    'Oracle Database SQL Language Reference 19c, «SELECT» (docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html).',
  conditions:
    'Oracle Database SQL Language Reference 19c, capítulo «Conditions»: comparación, lógicas, BETWEEN, IN, LIKE y NULL.',
  nulls: 'Oracle Database SQL Language Reference 19c, «Nulls» y «Null Conditions».',
  operators:
    'Oracle Database SQL Language Reference 19c, capítulo «Operators»: aritméticos y de concatenación.',
  orderBy: 'Oracle Database SQL Language Reference 19c, «SELECT»: order_by_clause.',
  dataset: 'Dataset EMPLEADOS v2 de DB LAB (docs/DATABASE_SCHEMA.md), verificado en Oracle 23ai.',
} as const;
