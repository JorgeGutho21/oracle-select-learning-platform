import type { CellValue } from '@/domain/dataset/empleados';

/**
 * Resultado tabular de una consulta. Se conserva el orden de columnas y la multiplicidad de
 * filas; el orden de filas solo es significativo si la consulta tiene ORDER BY, y entonces
 * se comprueba con `isSortedBy` (los empates pueden salir en cualquier orden).
 */
export interface ResultTable {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly CellValue[])[];
}

export type ResultDifference = 'columns' | 'row-count' | 'rows';

/** Identificadores no entrecomillados se comparan normalizados a mayúsculas. */
export function normalizeIdentifier(name: string): string {
  return name.trim().toUpperCase();
}

export function projectRows<Column extends string>(
  rows: readonly { readonly [K in Column]: CellValue }[],
  columns: readonly Column[],
): ResultTable {
  return {
    columns: [...columns],
    rows: rows.map((row) => columns.map((column) => row[column])),
  };
}

/** DISTINCT compara la combinación completa de valores y conserva la primera aparición. */
export function distinctRows(table: ResultTable): ResultTable {
  const seen = new Set<string>();
  const rows = table.rows.filter((row) => {
    const key = rowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { columns: table.columns, rows };
}

export function rowKey(row: readonly CellValue[]): string {
  return JSON.stringify(row);
}

/** Igualdad de multiconjuntos: ignora el orden y respeta las repeticiones. */
export function sameRowMultiset(
  left: readonly (readonly CellValue[])[],
  right: readonly (readonly CellValue[])[],
): boolean {
  if (left.length !== right.length) return false;
  const counts = new Map<string, number>();
  for (const row of left) counts.set(rowKey(row), (counts.get(rowKey(row)) ?? 0) + 1);
  for (const row of right) {
    const key = rowKey(row);
    const remaining = counts.get(key) ?? 0;
    if (remaining === 0) return false;
    counts.set(key, remaining - 1);
  }
  return true;
}

export function compareResults(
  actual: ResultTable,
  expected: ResultTable,
): { readonly equal: true } | { readonly equal: false; readonly difference: ResultDifference } {
  const sameColumns =
    actual.columns.length === expected.columns.length &&
    actual.columns.every(
      (column, index) =>
        normalizeIdentifier(column) === normalizeIdentifier(expected.columns[index] ?? ''),
    );
  if (!sameColumns) return { equal: false, difference: 'columns' };
  if (actual.rows.length !== expected.rows.length) return { equal: false, difference: 'row-count' };
  if (!sameRowMultiset(actual.rows, expected.rows)) return { equal: false, difference: 'rows' };
  return { equal: true };
}

/** Criterio de orden sobre una columna del resultado. */
export interface SortKey {
  readonly column: number;
  readonly direction: 'ASC' | 'DESC';
  /** Por defecto, como Oracle: NULLS LAST en ASC y NULLS FIRST en DESC. */
  readonly nulls?: 'FIRST' | 'LAST';
}

function compareCells(left: CellValue, right: CellValue, key: SortKey): number {
  const nulls = key.nulls ?? (key.direction === 'ASC' ? 'LAST' : 'FIRST');
  if (left === null || right === null) {
    if (left === right) return 0;
    return (left === null) === (nulls === 'FIRST') ? -1 : 1;
  }
  const order =
    typeof left === 'number' && typeof right === 'number'
      ? Math.sign(left - right)
      : String(left) < String(right)
        ? -1
        : String(left) > String(right)
          ? 1
          : 0;
  return key.direction === 'DESC' ? -order : order;
}

/** Las filas respetan el orden pedido; entre filas empatadas cualquier orden es válido. */
export function isSortedBy(
  rows: readonly (readonly CellValue[])[],
  keys: readonly SortKey[],
): boolean {
  for (let index = 1; index < rows.length; index++) {
    for (const key of keys) {
      const result = compareCells(
        rows[index - 1]![key.column] ?? null,
        rows[index]![key.column] ?? null,
        key,
      );
      if (result < 0) break;
      if (result > 0) return false;
    }
  }
  return true;
}
