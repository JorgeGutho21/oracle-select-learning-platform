import type { CellValue } from '@/domain/dataset/empleados';

/**
 * Resultado tabular de una proyección. Se conserva el orden de columnas y la
 * multiplicidad de filas; el orden de filas no es significativo (LAB_SPEC).
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
