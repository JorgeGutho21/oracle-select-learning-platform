import {
  EMPLEADOS_DATASET,
  type CellValue,
  type EducationalDataset,
} from '@/domain/dataset/empleados';
import { distinctRows, type ResultTable } from '@/domain/results/result-table';
import type { Expression, SelectItem, SelectStatement } from './ast';
import { diagnostic, type SqlDiagnostic } from './diagnostics';
import type { Span } from './source';

/**
 * Evaluación educativa de una consulta ya validada sobre el dataset canónico, recorriendo
 * el árbol (sin `eval`). Sirve para comparar resultados en el Challenge y para la vista
 * previa del laboratorio, siempre rotulada como tal: no es una ejecución en Oracle.
 */

export interface ResultColumn {
  readonly name: string;
  readonly type: 'number' | 'text';
}

export interface EducationalResult {
  readonly columns: readonly ResultColumn[];
  readonly table: ResultTable;
}

export type ExpressionValue =
  | { readonly ok: true; readonly value: CellValue }
  | {
      readonly ok: false;
      readonly reason: 'division-by-zero' | 'not-numeric' | 'unknown-column';
      readonly span: Span;
    };

type Row = Readonly<Record<string, CellValue>>;

export function evaluateExpression(expression: Expression, row: Row): ExpressionValue {
  switch (expression.kind) {
    case 'number':
      return { ok: true, value: expression.value };
    case 'column':
      return expression.name in row
        ? { ok: true, value: row[expression.name]! }
        : { ok: false, reason: 'unknown-column', span: expression.span };
    case 'group':
      return evaluateExpression(expression.expression, row);
    case 'unary': {
      const operand = numeric(expression.operand, row);
      if (!operand.ok) return operand;
      return { ok: true, value: expression.operator === '-' ? -operand.value : operand.value };
    }
    case 'binary': {
      const left = numeric(expression.left, row);
      if (!left.ok) return left;
      const right = numeric(expression.right, row);
      if (!right.ok) return right;
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
): { ok: true; value: number } | Extract<ExpressionValue, { ok: false }> {
  const result = evaluateExpression(expression, row);
  if (!result.ok) return result;
  return typeof result.value === 'number'
    ? { ok: true, value: result.value }
    : { ok: false, reason: 'not-numeric', span: expression.span };
}

/** Encabezado que muestra Oracle: alias, nombre de columna o la expresión sin espacios. */
export function itemHeader(
  item: Extract<SelectItem, { kind: 'expression' }>,
  source: string,
): string {
  if (item.alias) return item.alias.header;
  if (item.expression.kind === 'column') return item.expression.name;
  return source
    .slice(item.expression.span.start, item.expression.span.end)
    .replace(/\s+/g, '')
    .toUpperCase();
}

export function evaluateStatement(
  statement: SelectStatement,
  source: string,
  dataset: EducationalDataset = EMPLEADOS_DATASET,
):
  | { readonly ok: true; readonly result: EducationalResult }
  | { readonly ok: false; readonly diagnostic: SqlDiagnostic } {
  const typeOf = (name: string) =>
    dataset.columns.find((column) => column.name === name)?.type ?? 'number';
  const columns: ResultColumn[] = statement.items.flatMap((item) =>
    item.kind === 'star'
      ? dataset.columns.map(({ name, type }) => ({ name, type }))
      : [
          {
            name: itemHeader(item, source),
            type: item.expression.kind === 'column' ? typeOf(item.expression.name) : 'number',
          },
        ],
  );
  const rows: CellValue[][] = [];
  for (const row of dataset.rows) {
    const values: CellValue[] = [];
    for (const item of statement.items) {
      if (item.kind === 'star') {
        values.push(...dataset.columns.map(({ name }) => row[name]));
        continue;
      }
      const value = evaluateExpression(item.expression, row);
      if (!value.ok) {
        return {
          ok: false,
          diagnostic: diagnostic(source, {
            code:
              value.reason === 'division-by-zero'
                ? 'division-by-zero'
                : value.reason === 'not-numeric'
                  ? 'text-arithmetic'
                  : 'unknown-column',
            category: value.reason === 'unknown-column' ? 'identifier' : 'operation',
            span: value.span,
            message:
              value.reason === 'division-by-zero'
                ? 'No se puede dividir entre cero: la consulta no produce ningún resultado parcial.'
                : value.reason === 'not-numeric'
                  ? 'Una operación aritmética recibió un valor de texto.'
                  : 'La expresión usa una columna que no existe.',
          }),
        };
      }
      values.push(value.value);
    }
    rows.push(values);
  }
  const table: ResultTable = { columns: columns.map(({ name }) => name), rows };
  return { ok: true, result: { columns, table: statement.distinct ? distinctRows(table) : table } };
}
