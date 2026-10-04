import type { CellValue } from '@/domain/dataset/empleados';
import { sourceTable } from '@/features/curriculum/application/curriculum-api';
import { curriculumLessonHref } from '@/features/curriculum/application/outline';
import { VERIFIED, type VerifiedTable } from '@/features/curriculum/application/verified-results';
import { exampleById, lessonById } from '@/features/curriculum/domain/registry';
import type { SectionId } from '@/features/sections/domain/sections';
import type { OfficialQuestion } from '../../domain/bank/bank-builders';
import type { DataTable, Exhibit, OptionDraft } from '../../domain/question';

/**
 * Ayudas para escribir los bancos de las secciones 2 y 3 sin transcribir resultados: cada
 * tabla, salida o error sale de un ejemplo de la fuente curricular ejecutado en Oracle real
 * (`curriculum/application/oracle-results.json`). Si un ejemplo cambia sin volver a
 * ejecutarse en Oracle, las pruebas del currículo fallan; si una pregunta cita un resultado
 * que no existe, falla al cargarse.
 */

/** Nivel cognitivo (QUESTION_BANK_SPEC): se guarda como etiqueta `nivel:…`. */
export type CognitiveLevel = 'recordar' | 'aplicar' | 'analizar';

export type BankQuestion = Omit<OfficialQuestion, 'section' | 'tags'> & {
  readonly level: CognitiveLevel;
  readonly tags?: readonly string[];
};

export function finalize(section: SectionId, question: BankQuestion): OfficialQuestion {
  const { level, tags, ...content } = question;
  return { ...content, section, tags: [`nivel:${level}`, ...(tags ?? [])] };
}

function example(id: string) {
  const found = exampleById(id);
  if (!found) throw new Error(`Banco: el ejemplo ${id} no existe`);
  return found;
}

function verified(id: string) {
  const result = VERIFIED.results[id];
  if (!result) throw new Error(`Banco: ${id} no tiene resultado verificado en Oracle`);
  return result;
}

/** Código del ejemplo tal como se ejecutó en Oracle. */
export function codeOf(id: string): string {
  const found = example(id);
  return (found.kind === 'query' ? found.sql : found.code).trim();
}

/** Objetos que el ejemplo crea antes de ejecutarse (procedimientos, triggers…). */
export function setupOf(id: string): readonly string[] {
  const found = example(id);
  return found.kind === 'plsql' ? (found.setup ?? []).map((code) => code.trim()) : [];
}

/** Consulta de comprobación que leyó una tabla después del bloque. */
export function afterQueryOf(id: string, index = 0): string {
  const found = example(id);
  const sql = found.kind === 'plsql' ? found.after?.[index] : undefined;
  if (!sql) throw new Error(`Banco: ${id} no tiene la consulta posterior ${index}`);
  return sql;
}

function dataTable(table: VerifiedTable, caption?: string): DataTable {
  return {
    ...(caption ? { caption } : {}),
    columns: table.columns.map(({ name }) => name),
    rows: table.rows.map((row) => [...row]),
  };
}

/** Resultado de una consulta verificada. */
export function tableOf(id: string): DataTable {
  const result = verified(id);
  if (result.kind !== 'query') throw new Error(`Banco: ${id} no es una consulta con resultado`);
  return dataTable(result.table);
}

export function rowCount(id: string): number {
  return tableOf(id).rows.length;
}

/** Primera celda del resultado (recuentos, sumas). */
export function valueOf(id: string): CellValue {
  return tableOf(id).rows[0]?.[0] ?? null;
}

/** Código del error de Oracle (ORA-… o PLS-…) de un ejemplo que falla. */
export function errorOf(id: string): string {
  const result = verified(id);
  if (result.kind === 'query-error') return result.code;
  if (result.kind === 'plsql' && result.error) return result.error.code;
  throw new Error(`Banco: ${id} no falla en Oracle`);
}

/** Líneas que escribió DBMS_OUTPUT al ejecutar el bloque en Oracle. */
export function outputOf(id: string): readonly string[] {
  const result = verified(id);
  if (result.kind !== 'plsql') throw new Error(`Banco: ${id} no es un bloque PL/SQL`);
  return result.output;
}

/** Tablas leídas después del bloque (consultas de comprobación). */
export function afterOf(id: string, index = 0): DataTable {
  const result = verified(id);
  if (result.kind !== 'plsql' || !result.after[index]) {
    throw new Error(`Banco: ${id} no tiene la tabla posterior ${index}`);
  }
  return dataTable(result.after[index]);
}

/** Tablas de origen del ejemplo, con las filas y columnas que muestra la lección. */
export function sourcesOf(id: string): readonly DataTable[] {
  const found = example(id);
  if (found.kind !== 'query') return [];
  return found.sources.map((view) => {
    const table = sourceTable(found.dataset, view);
    return {
      caption: view.keys ? `${view.table} (filas de esta pregunta)` : view.table,
      columns: table.columns.map(({ name }) => name),
      rows: table.rows.map((row) => [...row]),
    };
  });
}

/** Material de la pregunta: tablas de origen del ejemplo (y, si se pide, sus consultas). */
export function exhibitOf(id: string, queries?: Exhibit['queries']): Exhibit {
  const tables = sourcesOf(id);
  return {
    ...(tables.length ? { tables } : {}),
    ...(queries ? { queries } : {}),
  };
}

function placeAt<T>(items: readonly T[], item: T, index: number): T[] {
  const copy = [...items];
  copy.splice(Math.min(index, copy.length), 0, item);
  return copy;
}

/**
 * Opciones de predicción de resultado: la correcta es el resultado de `correct.example` en
 * Oracle; cada distractor es el resultado real de otra consulta plausible (`example`) o, si
 * la confusión no corresponde a una consulta, filas escritas a mano (`rows`).
 */
export function resultOptions(
  correct: { readonly example: string; readonly body: string; readonly feedback: string },
  at: number,
  distractors: readonly {
    readonly body: string;
    readonly feedback: string;
    readonly example?: string;
    readonly rows?: DataTable['rows'];
  }[],
): OptionDraft[] {
  const table = tableOf(correct.example);
  const wrong = distractors.map<OptionDraft>(({ body, feedback, example: id, rows }) => {
    const result = id ? tableOf(id) : { columns: table.columns, rows: rows ?? [] };
    return { body, kind: 'table', result, feedback };
  });
  return placeAt(
    wrong,
    { body: correct.body, kind: 'table', result: table, correct: true, feedback: correct.feedback },
    at,
  );
}

/**
 * Opciones de predicción sobre una tabla leída después de un bloque PL/SQL (por ejemplo,
 * AUDITORIA_SALARIOS tras un UPDATE con trigger): la correcta sale de Oracle.
 */
export function afterOptions(
  correct: {
    readonly example: string;
    readonly index?: number;
    readonly body: string;
    readonly feedback: string;
  },
  at: number,
  distractors: readonly {
    readonly body: string;
    readonly feedback: string;
    readonly rows: DataTable['rows'];
  }[],
): OptionDraft[] {
  const table = afterOf(correct.example, correct.index ?? 0);
  const wrong = distractors.map<OptionDraft>(({ body, feedback, rows }) => ({
    body,
    kind: 'table',
    result: { columns: table.columns, rows },
    feedback,
  }));
  return placeAt(
    wrong,
    { body: correct.body, kind: 'table', result: table, correct: true, feedback: correct.feedback },
    at,
  );
}

/** Salida de DBMS_OUTPUT como cuerpo de una opción (una línea por renglón). */
export function outputBody(id: string): string {
  return outputOf(id).join('\n');
}

/**
 * Opciones que son consultas de la fuente curricular: una opción es correcta si Oracle
 * devolvió exactamente el mismo resultado que la consulta objetivo.
 */
export function queryOptions(
  target: string,
  options: readonly { readonly example: string; readonly feedback: string }[],
): OptionDraft[] {
  const expected = JSON.stringify(tableOf(target));
  const same = (id: string) => {
    const result = verified(id);
    return result.kind === 'query' && JSON.stringify(dataTable(result.table)) === expected;
  };
  return options.map(({ example: id, feedback }) => ({
    body: codeOf(id),
    kind: 'code',
    correct: same(id),
    feedback,
  }));
}

/** Opciones de texto; `correct` marca las verdaderas. */
export function textOptions(
  options: readonly {
    readonly body: string;
    readonly feedback: string;
    readonly correct?: boolean;
    readonly code?: boolean;
  }[],
): OptionDraft[] {
  return options.map(({ body, feedback, correct, code }) => ({
    body,
    ...(code ? { kind: 'code' as const } : {}),
    ...(correct ? { correct: true } : {}),
    feedback,
  }));
}

/** Fragmentos a ordenar, en el orden correcto. */
export function orderOptions(parts: readonly string[]): OptionDraft[] {
  return parts.map((body, index) => ({ body, kind: 'code', order: index + 1, feedback: '' }));
}

/** «Lección S2-L08 · LEFT OUTER JOIN (/sections/…/study/left-outer-join)». */
export function reviewOf(section: SectionId, lessonId: string): string {
  const lesson = lessonById(lessonId);
  if (!lesson) throw new Error(`Banco: la lección ${lessonId} no existe`);
  return `Lección ${lessonId} · ${lesson.shortTitle} (${curriculumLessonHref(section, lesson.slug)})`;
}
