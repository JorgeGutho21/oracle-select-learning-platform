import { EMPLEADOS_DATASET, type ColumnType } from '@/domain/dataset/empleados';

/** Catálogo permitido del laboratorio: una tabla y sus columnas, derivados del dataset. */
export interface SchemaColumn {
  readonly name: string;
  readonly type: ColumnType;
}

export interface TableSchema {
  readonly name: string;
  readonly columns: readonly SchemaColumn[];
}

export const EMPLEADOS_SCHEMA: TableSchema = Object.freeze({
  name: EMPLEADOS_DATASET.table,
  columns: Object.freeze(EMPLEADOS_DATASET.columns.map(({ name, type }) => ({ name, type }))),
});

export function findColumn(schema: TableSchema, name: string): SchemaColumn | undefined {
  return schema.columns.find((column) => column.name === name.toUpperCase());
}

/** Distancia de edición para sugerir una columna parecida (SALARIOS → SALARIO). */
export function closestColumn(schema: TableSchema, name: string): string | null {
  const target = name.toUpperCase();
  let best: { name: string; distance: number } | null = null;
  for (const column of schema.columns) {
    const distance = editDistance(target, column.name);
    if (distance <= 2 && (!best || distance < best.distance))
      best = { name: column.name, distance };
  }
  return best?.name ?? null;
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = previous[j]!;
      previous[j] = Math.min(
        above + 1,
        previous[j - 1]! + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length]!;
}
