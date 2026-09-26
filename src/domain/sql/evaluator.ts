import {
  EMPLEADOS_DATASET,
  type CellValue,
  type ColumnType,
  type EducationalDataset,
  type EmpleadoRow,
} from '@/domain/dataset/empleados';
import type { ResultTable } from '@/domain/results/result-table';
import { rowKey } from '@/domain/results/result-table';
import { typeOf } from './analyzer';
import type { Condition, Expression, SelectItem, SelectStatement } from './ast';
import { diagnostic, type SqlDiagnostic } from './diagnostics';
import { itemHeader } from './headers';
import { resolveOrderBy } from './order';
import { EMPLEADOS_SCHEMA, type TableSchema } from './schema';
import type { Span } from './source';
import { and, compareValues, likeMatches, not, or, toText, type Truth } from './values';

export { itemHeader } from './headers';

/**
 * Evaluación educativa de una consulta ya validada sobre el dataset canónico, recorriendo
 * el árbol (sin `eval`) con la semántica de Oracle: lógica de tres valores, NULL en
 * cálculos y comparaciones, LIKE que distingue mayúsculas, orden binario de textos y
 * NULLS LAST/FIRST por defecto. Sigue el modelo lógico FROM → WHERE → SELECT → DISTINCT →
 * ORDER BY; es una vista previa rotulada como tal, no una ejecución en Oracle.
 */

export interface ResultColumn {
  readonly name: string;
  readonly type: ColumnType;
}

/** Cómo llegó cada fila al resultado: sirve para las vistas tabla → operación → resultado. */
export interface EvaluationTrace {
  readonly sourceRowCount: number;
  /** Valor de la condición de WHERE en cada fila de la tabla; `null` sin WHERE. */
  readonly conditions: readonly Truth[] | null;
  /** Filas de la tabla que pasan WHERE, en orden de tabla. */
  readonly keptRows: readonly number[];
  /** Filas de la tabla que DISTINCT retira por repetir una fila anterior del resultado. */
  readonly duplicateRows: readonly number[];
  /** Para cada fila del resultado, la fila de la tabla de la que sale. */
  readonly resultRows: readonly number[];
  /** Criterios de ORDER BY; `column` es la columna del resultado si el criterio es una. */
  readonly order: readonly { readonly column: number | null; readonly direction: 'ASC' | 'DESC' }[];
}

export interface EducationalResult {
  readonly columns: readonly ResultColumn[];
  readonly table: ResultTable;
  readonly trace: EvaluationTrace;
}

type Failure = {
  readonly ok: false;
  readonly reason: 'division-by-zero' | 'not-numeric' | 'unknown-column';
  readonly span: Span;
};

export type ExpressionValue = { readonly ok: true; readonly value: CellValue } | Failure;

type Row = Readonly<Record<string, CellValue>>;

export function evaluateExpression(
  expression: Expression,
  row: Row,
  aliases?: ReadonlyMap<string, CellValue>,
): ExpressionValue {
  switch (expression.kind) {
    case 'number':
      return { ok: true, value: expression.value };
    case 'string':
      // En Oracle, un texto vacío es NULL.
      return { ok: true, value: expression.value === '' ? null : expression.value };
    case 'null':
      return { ok: true, value: null };
    case 'date':
      return { ok: true, value: expression.value };
    case 'column':
      if (expression.name in row) return { ok: true, value: row[expression.name]! };
      if (aliases?.has(expression.name)) return { ok: true, value: aliases.get(expression.name)! };
      return { ok: false, reason: 'unknown-column', span: expression.span };
    case 'group':
      return evaluateExpression(expression.expression, row, aliases);
    case 'unary': {
      const operand = numeric(expression.operand, row, aliases);
      if (!operand.ok) return operand;
      if (operand.value === null) return { ok: true, value: null };
      return { ok: true, value: expression.operator === '-' ? -operand.value : operand.value };
    }
    case 'binary': {
      if (expression.operator === '||') {
        const left = evaluateExpression(expression.left, row, aliases);
        if (!left.ok) return left;
        const right = evaluateExpression(expression.right, row, aliases);
        if (!right.ok) return right;
        // NULL se comporta como un texto vacío al concatenar; el resultado vacío es NULL.
        const text = `${toText(left.value) ?? ''}${toText(right.value) ?? ''}`;
        return { ok: true, value: text === '' ? null : text };
      }
      const left = numeric(expression.left, row, aliases);
      if (!left.ok) return left;
      const right = numeric(expression.right, row, aliases);
      if (!right.ok) return right;
      if (left.value === null || right.value === null) return { ok: true, value: null };
      if (expression.operator === '/' && right.value === 0) {
        return { ok: false, reason: 'division-by-zero', span: expression.span };
      }
      const value =
        expression.operator === '+'
          ? left.value + right.value
          : expression.operator === '-'
            ? left.value - right.value
            : expression.operator === '*'
              ? left.value * right.value
              : left.value / right.value;
      return { ok: true, value };
    }
  }
}

function numeric(
  expression: Expression,
  row: Row,
  aliases?: ReadonlyMap<string, CellValue>,
): { ok: true; value: number | null } | Failure {
  const result = evaluateExpression(expression, row, aliases);
  if (!result.ok) return result;
  if (result.value === null || typeof result.value === 'number') {
    return { ok: true, value: result.value };
  }
  // Oracle convierte un texto numérico; cualquier otro texto falla (ORA-01722).
  return /^\s*[-+]?\d+(\.\d+)?\s*$/.test(result.value)
    ? { ok: true, value: Number(result.value) }
    : { ok: false, reason: 'not-numeric', span: expression.span };
}

/* ---------- Condiciones ---------- */

type TruthResult = { readonly ok: true; readonly value: Truth } | Failure;

function compareTruth(
  left: CellValue,
  right: CellValue,
  test: (order: number) => boolean,
  span: Span,
): TruthResult {
  if (left === null || right === null) return { ok: true, value: 'unknown' };
  const compared = compareValues(left, right);
  if (!compared.ok) return { ok: false, reason: 'not-numeric', span };
  return { ok: true, value: test(compared.order) ? 'true' : 'false' };
}

const COMPARISON: Readonly<Record<string, (order: number) => boolean>> = {
  '=': (order) => order === 0,
  '<>': (order) => order !== 0,
  '!=': (order) => order !== 0,
  '^=': (order) => order !== 0,
  '<': (order) => order < 0,
  '<=': (order) => order <= 0,
  '>': (order) => order > 0,
  '>=': (order) => order >= 0,
};

export function evaluateCondition(condition: Condition, row: Row): TruthResult {
  const value = (expression: Expression) => evaluateExpression(expression, row);
  switch (condition.kind) {
    case 'comparison': {
      const left = value(condition.left);
      if (!left.ok) return left;
      const right = value(condition.right);
      if (!right.ok) return right;
      return compareTruth(left.value, right.value, COMPARISON[condition.operator]!, condition.span);
    }
    case 'between': {
      const subject = value(condition.expression);
      if (!subject.ok) return subject;
      const low = value(condition.low);
      if (!low.ok) return low;
      const high = value(condition.high);
      if (!high.ok) return high;
      const above = compareTruth(subject.value, low.value, (order) => order >= 0, condition.span);
      if (!above.ok) return above;
      const below = compareTruth(subject.value, high.value, (order) => order <= 0, condition.span);
      if (!below.ok) return below;
      const inside = and(above.value, below.value);
      return { ok: true, value: condition.negated ? not(inside) : inside };
    }
    case 'in': {
      const subject = value(condition.expression);
      if (!subject.ok) return subject;
      let found: Truth = 'false';
      for (const candidate of condition.values) {
        const item = value(candidate);
        if (!item.ok) return item;
        const equal = compareTruth(
          subject.value,
          item.value,
          (order) => order === 0,
          condition.span,
        );
        if (!equal.ok) return equal;
        found = or(found, equal.value);
      }
      return { ok: true, value: condition.negated ? not(found) : found };
    }
    case 'like': {
      const subject = value(condition.expression);
      if (!subject.ok) return subject;
      const pattern = value(condition.pattern);
      if (!pattern.ok) return pattern;
      const text = toText(subject.value);
      const mask = toText(pattern.value);
      if (text === null || mask === null) return { ok: true, value: 'unknown' };
      const matches: Truth = likeMatches(text, mask) ? 'true' : 'false';
      return { ok: true, value: condition.negated ? not(matches) : matches };
    }
    case 'is-null': {
      const subject = value(condition.expression);
      if (!subject.ok) return subject;
      const missing = subject.value === null;
      return { ok: true, value: missing !== condition.negated ? 'true' : 'false' };
    }
    case 'logical': {
      const left = evaluateCondition(condition.left, row);
      if (!left.ok) return left;
      const right = evaluateCondition(condition.right, row);
      if (!right.ok) return right;
      return {
        ok: true,
        value:
          condition.operator === 'AND' ? and(left.value, right.value) : or(left.value, right.value),
      };
    }
    case 'not': {
      const inner = evaluateCondition(condition.condition, row);
      return inner.ok ? { ok: true, value: not(inner.value) } : inner;
    }
    case 'condition-group':
      return evaluateCondition(condition.condition, row);
  }
}

/* ---------- Sentencia ---------- */

function failureDiagnostic(source: string, failure: Failure): SqlDiagnostic {
  return diagnostic(source, {
    code:
      failure.reason === 'division-by-zero'
        ? 'division-by-zero'
        : failure.reason === 'not-numeric'
          ? 'type-mismatch'
          : 'unknown-column',
    category:
      failure.reason === 'unknown-column'
        ? 'identifier'
        : failure.reason === 'division-by-zero'
          ? 'operation'
          : 'oracle',
    span: failure.span,
    message:
      failure.reason === 'division-by-zero'
        ? 'No se puede dividir entre cero: Oracle detiene la consulta (ORA-01476) y no muestra un resultado parcial.'
        : failure.reason === 'not-numeric'
          ? 'Un valor de texto no pudo convertirse en número (en Oracle, ORA-01722).'
          : 'La expresión usa una columna que no existe.',
  });
}

function columnType(
  item: Extract<SelectItem, { kind: 'expression' }>,
  schema: TableSchema,
): ColumnType {
  const type = typeOf(item.expression, schema);
  return type === 'text' || type === 'date' ? type : 'number';
}

function compareKeys(
  left: CellValue,
  right: CellValue,
  direction: 'ASC' | 'DESC',
  nulls: 'FIRST' | 'LAST',
): number {
  if (left === null || right === null) {
    if (left === right) return 0;
    return (left === null) === (nulls === 'FIRST') ? -1 : 1;
  }
  const compared = compareValues(left, right);
  const order = compared.ok ? compared.order : 0;
  return direction === 'DESC' ? -order : order;
}

export function evaluateStatement(
  statement: SelectStatement,
  source: string,
  dataset: EducationalDataset = EMPLEADOS_DATASET,
  schema: TableSchema = EMPLEADOS_SCHEMA,
):
  | { readonly ok: true; readonly result: EducationalResult }
  | { readonly ok: false; readonly diagnostic: SqlDiagnostic } {
  const columns: ResultColumn[] = statement.items.flatMap((item) =>
    item.kind === 'star'
      ? dataset.columns.map(({ name, type }) => ({ name, type }))
      : [{ name: itemHeader(item, source), type: columnType(item, schema) }],
  );
  const rows = dataset.rows as readonly (EmpleadoRow & Row)[];

  // FROM → WHERE
  let conditions: Truth[] | null = null;
  const kept: number[] = [];
  if (statement.where) {
    conditions = [];
    for (const [index, row] of rows.entries()) {
      const truth = evaluateCondition(statement.where.condition, row);
      if (!truth.ok) return { ok: false, diagnostic: failureDiagnostic(source, truth) };
      conditions.push(truth.value);
      if (truth.value === 'true') kept.push(index);
    }
  } else {
    kept.push(...rows.keys());
  }

  // SELECT
  const projected: { source: number; values: CellValue[]; aliases: Map<string, CellValue> }[] = [];
  for (const index of kept) {
    const row = rows[index]!;
    const values: CellValue[] = [];
    const aliases = new Map<string, CellValue>();
    for (const item of statement.items) {
      if (item.kind === 'star') {
        values.push(...dataset.columns.map(({ name }) => row[name]));
        continue;
      }
      const value = evaluateExpression(item.expression, row);
      if (!value.ok) return { ok: false, diagnostic: failureDiagnostic(source, value) };
      values.push(value.value);
      if (item.alias) aliases.set(item.alias.header, value.value);
    }
    projected.push({ source: index, values, aliases });
  }

  // DISTINCT
  const duplicates: number[] = [];
  let distinct = projected;
  if (statement.distinct) {
    const seen = new Set<string>();
    distinct = projected.filter((entry) => {
      const key = rowKey(entry.values);
      if (seen.has(key)) {
        duplicates.push(entry.source);
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // ORDER BY
  const order: { column: number | null; direction: 'ASC' | 'DESC' }[] = [];
  let ordered = distinct;
  if (statement.orderBy) {
    const { targets } = resolveOrderBy(statement, schema, source);
    const keys: CellValue[][] = [];
    for (const entry of distinct) {
      const row = rows[entry.source]!;
      const entryKeys: CellValue[] = [];
      for (const [position, item] of statement.orderBy.items.entries()) {
        const target = targets[position];
        if (target?.slot !== null && target?.slot !== undefined) {
          entryKeys.push(entry.values[target.slot] ?? null);
          continue;
        }
        const value = evaluateExpression(item.expression, row, entry.aliases);
        if (!value.ok) return { ok: false, diagnostic: failureDiagnostic(source, value) };
        entryKeys.push(value.value);
      }
      keys.push(entryKeys);
    }
    const items = statement.orderBy.items;
    const indexes = distinct.map((_, index) => index);
    indexes.sort((a, b) => {
      for (const [position, item] of items.entries()) {
        const direction = item.direction ?? 'ASC';
        const nulls = item.nulls ?? (direction === 'ASC' ? 'LAST' : 'FIRST');
        const result = compareKeys(keys[a]![position]!, keys[b]![position]!, direction, nulls);
        if (result !== 0) return result;
      }
      return 0;
    });
    ordered = indexes.map((index) => distinct[index]!);
    items.forEach((item, position) =>
      order.push({ column: targets[position]?.slot ?? null, direction: item.direction ?? 'ASC' }),
    );
  }

  const table: ResultTable = {
    columns: columns.map(({ name }) => name),
    rows: ordered.map(({ values }) => values),
  };
  return {
    ok: true,
    result: {
      columns,
      table,
      trace: {
        sourceRowCount: rows.length,
        conditions,
        keptRows: kept,
        duplicateRows: duplicates,
        resultRows: ordered.map((entry) => entry.source),
        order,
      },
    },
  };
}
