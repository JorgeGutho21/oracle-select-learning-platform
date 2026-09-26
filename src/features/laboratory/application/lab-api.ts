import {
  EMPLEADOS_DATASET,
  rowValues,
  type CellValue,
  type ColumnType,
} from '@/domain/dataset/empleados';
import { rowKey } from '@/domain/results/result-table';
import { conditionColumns, sourceColumns } from '@/domain/sql/analyzer';
import { describeAnatomy, type AnatomyPart } from '@/domain/sql/anatomy';
import { predicates, unwrap, type Condition, type SelectStatement } from '@/domain/sql/ast';
import {
  applyFix,
  type DiagnosticCategory,
  type DiagnosticCode,
  type SqlDiagnostic,
} from '@/domain/sql/diagnostics';
import { runEducational } from '@/domain/sql/educational-run';
import {
  evaluateCondition,
  evaluateStatement,
  type EvaluationTrace,
  type ResultColumn,
} from '@/domain/sql/evaluator';
import { renderStatement } from '@/domain/sql/render';
import { positionAt } from '@/domain/sql/source';
import { translateStatement, type Translation } from '@/domain/sql/translator';
import { likeSegments, toText, type LikeSegment, type Truth } from '@/domain/sql/values';
import { findFutureTopic, topicAnchor } from '@/features/modules/domain/curriculum';
import { DIAGNOSTIC_EXAMPLES } from '../domain/examples';

/**
 * Superficie del laboratorio para presentación. `analyzeLabQuery` es el análisis
 * educativo (diagnóstico, anatomía, traducción y vista previa sobre el dataset);
 * `explainQuery` prepara la vista «tabla → consulta → resultado» que comparten Estudio y
 * Exposición. La ejecución real en Oracle es una operación distinta (`executeOnOracle`).
 */

export type { AnatomyPart, AnatomyRole } from '@/domain/sql/anatomy';
export type { Translation } from '@/domain/sql/translator';
export type { ResultColumn } from '@/domain/sql/evaluator';
export type { CellValue } from '@/domain/dataset/empleados';
export type { EmpleadoRow, EmpleadosColumn } from '@/domain/dataset/empleados';
export type { OracleExecutionResult, OracleServiceStatus } from '@/application/oracle-executor';
export {
  DEFAULT_LAB_SQL,
  LAB_EXAMPLE_GROUPS,
  LAB_EXAMPLES,
  type LabExample,
  type LabExampleGroup,
} from '../domain/examples';

export const EMPLEADOS = EMPLEADOS_DATASET;

/* ---------- Diagnóstico ---------- */

/** Grupos visibles del diagnóstico (CONTENT_REDESIGN_PLAN, 2.7). */
export type DiagnosticGroup =
  'SINTAXIS' | 'SEMÁNTICA' | 'ALCANCE EDUCATIVO' | 'ORACLE' | 'ADVERTENCIA';

export interface LabDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly category: DiagnosticCategory;
  readonly code: DiagnosticCode;
  readonly group: DiagnosticGroup;
  readonly message: string;
  readonly hint: string | null;
  readonly line: number;
  readonly column: number;
  readonly from: number;
  readonly to: number;
  /** Línea (o fragmento) donde está el problema. */
  readonly found: string;
  /** La misma línea con la corrección posible aplicada. */
  readonly correction: string | null;
  /** Consulta completa corregida, para aplicarla en el editor. */
  readonly fixedSql: string | null;
  /** Ejemplo mínimo correcto relacionado. */
  readonly example: string | null;
  /** Ficha del tema futuro que explica la construcción. */
  readonly learnMore: { readonly label: string; readonly href: string } | null;
}

export function diagnosticGroup(
  item: Pick<SqlDiagnostic, 'severity' | 'category'>,
): DiagnosticGroup {
  if (item.severity === 'warning') return 'ADVERTENCIA';
  switch (item.category) {
    case 'scope':
    case 'security':
    case 'limit':
      return 'ALCANCE EDUCATIVO';
    case 'oracle':
      return 'ORACLE';
    case 'syntax':
      return 'SINTAXIS';
    default:
      return 'SEMÁNTICA';
  }
}

function lineAt(source: string, line: number): string {
  return source.split('\n')[line - 1] ?? '';
}

function toLabDiagnostic(source: string, item: SqlDiagnostic): LabDiagnostic {
  const found = lineAt(source, item.line).trim() || source.slice(item.span.start, item.span.end);
  const fixedSql = item.fix ? applyFix(source, item.fix) : null;
  const correction = fixedSql
    ? (fixedSql.split('\n')[positionAt(fixedSql, item.fix!.span.start).line - 1] ?? '').trim()
    : null;
  const topic = item.future?.topic ? findFutureTopic(item.future.topic) : undefined;
  return {
    severity: item.severity,
    category: item.category,
    code: item.code,
    group: diagnosticGroup(item),
    message: item.message,
    hint: item.hint,
    line: item.line,
    column: item.column,
    from: item.span.start,
    to: item.span.end,
    found,
    correction: correction && correction !== found ? correction : null,
    fixedSql,
    example: DIAGNOSTIC_EXAMPLES[item.code] ?? null,
    learnMore: topic
      ? { label: `${topic.title} · Nivel ${topic.level}`, href: `/modules#${topicAnchor(topic)}` }
      : null,
  };
}

/* ---------- Análisis del laboratorio ---------- */

export interface LabAnalysis {
  readonly source: string;
  readonly status: 'valid' | 'invalid';
  readonly diagnostics: readonly LabDiagnostic[];
  readonly anatomy: readonly AnatomyPart[];
  readonly translation: Translation | null;
  readonly sourceColumns: readonly string[];
  readonly conditionColumns: readonly string[];
  /** Vista previa educativa calculada sobre el dataset; nunca una ejecución en Oracle. */
  readonly preview: {
    readonly datasetId: string;
    readonly columns: readonly ResultColumn[];
    readonly rows: readonly (readonly CellValue[])[];
    readonly trace: EvaluationTrace;
  } | null;
  /** Sentencia canónica que se enviaría al servicio Oracle. */
  readonly canonicalSql: string | null;
}

export function analyzeLabQuery(source: string): LabAnalysis {
  const run = runEducational(source);
  const { analysis } = run;
  const diagnostics = [
    ...analysis.diagnostics,
    ...(run.runtimeError ? [run.runtimeError] : []),
  ].map((item) => toLabDiagnostic(source, item));
  const statement = analysis.ok ? analysis.statement : null;
  return {
    source,
    status: statement && run.result ? 'valid' : 'invalid',
    diagnostics,
    anatomy: statement ? describeAnatomy(statement, source) : [],
    translation: statement ? translateStatement(statement, run.result?.trace ?? null) : null,
    sourceColumns: statement ? sourceColumns(statement) : [],
    conditionColumns: statement ? conditionColumns(statement) : [],
    preview: run.result
      ? {
          datasetId: EMPLEADOS_DATASET.id,
          columns: run.result.columns,
          rows: run.result.table.rows,
          trace: run.result.trace,
        }
      : null,
    canonicalSql: statement ? renderStatement(statement) : null,
  };
}

/* ---------- Vista «tabla → consulta → qué hace → resultado» ---------- */

export type FlowRowState = 'kept' | 'discarded' | 'unknown';

export type FlowCellMark =
  { readonly kind: 'match' } | { readonly kind: 'like'; readonly segments: readonly LikeSegment[] };

export interface FlowTable {
  readonly columns: readonly { readonly name: string; readonly type: ColumnType }[];
  readonly rows: readonly (readonly CellValue[])[];
  /** Total de filas antes de recortar la vista («8 de 20 filas»). */
  readonly totalRows: number;
  readonly highlightedColumns: readonly string[];
  readonly rowStates?: readonly FlowRowState[];
  readonly cellMarks?: readonly (readonly (FlowCellMark | null)[])[];
  readonly duplicateRows?: readonly number[];
  readonly sortedBy?: readonly { readonly column: number; readonly direction: 'ASC' | 'DESC' }[];
}

export interface ExplainedQuery {
  readonly sql: string;
  readonly ok: boolean;
  readonly source: FlowTable;
  /** Resultado antes de DISTINCT, con las repetidas marcadas; solo si hay DISTINCT. */
  readonly beforeDistinct: FlowTable | null;
  readonly result: FlowTable | null;
  readonly translation: Translation | null;
  readonly counts: {
    readonly source: number;
    readonly kept: number;
    readonly result: number;
    readonly columns: number;
  };
  readonly clauses: {
    readonly where: boolean;
    readonly distinct: boolean;
    readonly orderBy: boolean;
  };
  readonly diagnostics: readonly LabDiagnostic[];
}

export interface ExplainOptions {
  /** Columnas de EMPLEADOS que se muestran; por defecto NOMBRE y las que usa la consulta. */
  readonly sourceColumns?: readonly string[];
  /** Máximo de filas visibles en cada tabla (Exposición); por defecto, todas. */
  readonly maxRows?: number;
  /** Filas de EMPLEADOS (por posición) que se muestran en la tabla de origen. */
  readonly rows?: readonly number[];
}

const STATE: Readonly<Record<Truth, FlowRowState>> = {
  true: 'kept',
  false: 'discarded',
  unknown: 'unknown',
};

/** Columna simple a la que se aplica una condición, para marcar sus celdas. */
function subjectColumn(condition: Condition): string | null {
  const subject =
    condition.kind === 'comparison'
      ? condition.left
      : condition.kind === 'between' ||
          condition.kind === 'in' ||
          condition.kind === 'like' ||
          condition.kind === 'is-null'
        ? condition.expression
        : null;
  if (!subject) return null;
  const bare = unwrap(subject);
  return bare.kind === 'column' && !bare.quoted ? bare.name : null;
}

/** Filas visibles: todas o una muestra que mezcla filas que pasan y que no. */
function pickRows(total: number, kept: readonly number[], maxRows?: number): number[] {
  const all = Array.from({ length: total }, (_, index) => index);
  if (!maxRows || total <= maxRows) return all;
  if (kept.length === total || kept.length === 0) return all.slice(0, maxRows);
  const keptShare = Math.min(
    kept.length,
    Math.max(Math.ceil(maxRows * 0.6), maxRows - (total - kept.length)),
  );
  const chosen = new Set(kept.slice(0, keptShare));
  for (const index of all) {
    if (chosen.size >= maxRows) break;
    if (!kept.includes(index)) chosen.add(index);
  }
  return [...chosen].sort((a, b) => a - b);
}

function statementColumns(statement: SelectStatement): string[] {
  const used = new Set<string>(['NOMBRE']);
  sourceColumns(statement).forEach((name) => used.add(name));
  conditionColumns(statement).forEach((name) => used.add(name));
  for (const item of statement.orderBy?.items ?? []) {
    const bare = unwrap(item.expression);
    if (
      bare.kind === 'column' &&
      EMPLEADOS_DATASET.columns.some(({ name }) => name === bare.name)
    ) {
      used.add(bare.name);
    }
  }
  return EMPLEADOS_DATASET.columns.map(({ name }) => name).filter((name) => used.has(name));
}

export function explainQuery(sql: string, options: ExplainOptions = {}): ExplainedQuery {
  const analysis = analyzeLabQuery(sql);
  const run = runEducational(sql);
  const statement = run.analysis.ok ? run.analysis.statement : null;
  const dataset = EMPLEADOS_DATASET;
  const trace = run.result?.trace ?? null;
  const shownNames =
    options.sourceColumns ?? (statement ? statementColumns(statement) : ['NOMBRE']);
  const shown = dataset.columns.filter(({ name }) => shownNames.includes(name));
  const indexes = options.rows
    ? [...options.rows].sort((a, b) => a - b)
    : pickRows(dataset.rows.length, trace?.keptRows ?? [], options.maxRows);
  const highlighted = statement
    ? [...new Set([...sourceColumns(statement), ...conditionColumns(statement)])]
    : [];

  // Marcas de celda: la columna de cada condición simple, si esa condición se cumple.
  const leaves = statement?.where ? predicates(statement.where.condition) : [];
  const cellMarks = indexes.map((rowIndex) => {
    const row = dataset.rows[rowIndex]!;
    return shown.map(({ name }): FlowCellMark | null => {
      for (const leaf of leaves) {
        if (subjectColumn(leaf) !== name) continue;
        const truth = evaluateCondition(leaf, row);
        if (!truth.ok || truth.value !== 'true') continue;
        if (leaf.kind === 'like' && !leaf.negated) {
          const pattern = unwrap(leaf.pattern);
          const value = toText(row[name as keyof typeof row] ?? null);
          const segments =
            pattern.kind === 'string' && value !== null ? likeSegments(value, pattern.value) : null;
          if (segments) return { kind: 'like', segments };
        }
        return { kind: 'match' };
      }
      return null;
    });
  });

  const source: FlowTable = {
    columns: shown.map(({ name, type }) => ({ name, type })),
    rows: indexes.map((index) =>
      shown.map(
        ({ name }) => dataset.rows[index]![name as keyof (typeof dataset.rows)[number]] ?? null,
      ),
    ),
    totalRows: dataset.rows.length,
    highlightedColumns: highlighted,
    ...(trace?.conditions
      ? { rowStates: indexes.map((index) => STATE[trace.conditions![index]!]) }
      : {}),
    ...(leaves.length > 0 ? { cellMarks } : {}),
  };

  let beforeDistinct: FlowTable | null = null;
  if (statement?.distinct && run.result) {
    const plain = evaluateStatement({ ...statement, distinct: null, orderBy: null }, sql);
    if (plain.ok) {
      const seen = new Set<string>();
      const duplicates: number[] = [];
      plain.result.table.rows.forEach((row, index) => {
        const key = rowKey(row);
        if (seen.has(key)) duplicates.push(index);
        seen.add(key);
      });
      const limit = options.maxRows ?? plain.result.table.rows.length;
      beforeDistinct = {
        columns: plain.result.columns,
        rows: plain.result.table.rows.slice(0, limit),
        totalRows: plain.result.table.rows.length,
        highlightedColumns: [],
        duplicateRows: duplicates.filter((index) => index < limit),
      };
    }
  }

  const result: FlowTable | null = run.result
    ? {
        columns: run.result.columns,
        rows: run.result.table.rows.slice(0, options.maxRows ?? run.result.table.rows.length),
        totalRows: run.result.table.rows.length,
        highlightedColumns: [],
        sortedBy: run.result.trace.order
          .filter(
            (entry): entry is { column: number; direction: 'ASC' | 'DESC' } =>
              entry.column !== null,
          )
          .filter(
            (entry, index, all) =>
              all.findIndex((other) => other.column === entry.column) === index,
          ),
      }
    : null;

  return {
    sql,
    ok: analysis.status === 'valid',
    source,
    beforeDistinct,
    result,
    translation: analysis.translation,
    counts: {
      source: dataset.rows.length,
      kept: trace?.keptRows.length ?? 0,
      result: run.result?.table.rows.length ?? 0,
      columns: run.result?.columns.length ?? 0,
    },
    clauses: {
      where: Boolean(statement?.where),
      distinct: Boolean(statement?.distinct),
      orderBy: Boolean(statement?.orderBy),
    },
    diagnostics: analysis.diagnostics,
  };
}

/** Filas completas de EMPLEADOS en el orden del esquema (tablas de exploración). */
export function datasetRows(): readonly (readonly CellValue[])[] {
  return EMPLEADOS_DATASET.rows.map((row) => rowValues(EMPLEADOS_DATASET, row));
}
