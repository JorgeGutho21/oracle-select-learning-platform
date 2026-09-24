/**
 * Fuente única del dataset educativo `empleados-select-v1` (DATABASE_SCHEMA.md).
 * Todo ejemplo, misión o tabla de la unidad deriva sus datos de este módulo.
 */

export const EMPLEADOS_COLUMNS = ['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO'] as const;

export type EmpleadosColumn = (typeof EMPLEADOS_COLUMNS)[number];
export type CellValue = string | number;
export type ColumnType = 'number' | 'text';

export interface DatasetColumn {
  readonly name: EmpleadosColumn;
  readonly type: ColumnType;
  readonly label: string;
}

export type EmpleadoRow = {
  readonly [K in EmpleadosColumn]: K extends 'NOMBRE' | 'CIUDAD' | 'DEPTO' ? string : number;
};

export interface EducationalDataset {
  readonly id: string;
  readonly table: string;
  readonly columns: readonly DatasetColumn[];
  readonly rows: readonly EmpleadoRow[];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export const EMPLEADOS_DATASET: EducationalDataset = deepFreeze({
  id: 'empleados-select-v1',
  table: 'EMPLEADOS',
  columns: [
    { name: 'ID', type: 'number', label: 'ID' },
    { name: 'NOMBRE', type: 'text', label: 'Nombre' },
    { name: 'EDAD', type: 'number', label: 'Edad' },
    { name: 'CIUDAD', type: 'text', label: 'Ciudad' },
    { name: 'SALARIO', type: 'number', label: 'Salario' },
    { name: 'DEPTO', type: 'text', label: 'Departamento' },
  ],
  rows: [
    { ID: 1, NOMBRE: 'Ana', EDAD: 25, CIUDAD: 'Bogotá', SALARIO: 3000000, DEPTO: 'Ventas' },
    { ID: 2, NOMBRE: 'Carlos', EDAD: 35, CIUDAD: 'Cali', SALARIO: 5000000, DEPTO: 'Sistemas' },
    { ID: 3, NOMBRE: 'Laura', EDAD: 28, CIUDAD: 'Bogotá', SALARIO: 4200000, DEPTO: 'Sistemas' },
    { ID: 4, NOMBRE: 'Pedro', EDAD: 19, CIUDAD: 'Medellín', SALARIO: 1800000, DEPTO: 'Ventas' },
    { ID: 5, NOMBRE: 'María', EDAD: 30, CIUDAD: 'Cali', SALARIO: 3700000, DEPTO: 'Contabilidad' },
    { ID: 6, NOMBRE: 'Jorge', EDAD: 22, CIUDAD: 'Bogotá', SALARIO: 2800000, DEPTO: 'Sistemas' },
  ],
});

export function isEmpleadosColumn(name: string): name is EmpleadosColumn {
  return (EMPLEADOS_COLUMNS as readonly string[]).includes(name);
}

/** Huella FNV-1a de 32 bits sobre la forma canónica; detecta divergencias de versión. */
export function datasetFingerprint(dataset: EducationalDataset): string {
  const canonical = JSON.stringify([
    dataset.id,
    dataset.table,
    dataset.columns.map(({ name, type }) => [name, type]),
    dataset.rows.map((row) => dataset.columns.map(({ name }) => row[name])),
  ]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
