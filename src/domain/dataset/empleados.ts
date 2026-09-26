/**
 * Fuente única del dataset educativo `empleados-select-v2` (DATABASE_SCHEMA.md).
 * Todo ejemplo, misión o tabla de la unidad deriva sus datos de este módulo. Los datos son
 * ficticios y están diseñados a propósito: cada concepto de la unidad tiene sus casos
 * (límites de BETWEEN, NULL frente a 0, nombres para LIKE, empates para ORDER BY).
 */

export const EMPLEADOS_COLUMNS = [
  'ID_EMPLEADO',
  'NOMBRE',
  'APELLIDO',
  'CARGO',
  'DEPARTAMENTO',
  'CIUDAD',
  'SALARIO',
  'BONO',
  'FECHA_INGRESO',
  'ESTADO',
  'CORREO',
  'ID_JEFE',
] as const;

export type EmpleadosColumn = (typeof EMPLEADOS_COLUMNS)[number];
/** Valor de una celda. `null` es la ausencia de valor (NULL); una fecha es 'AAAA-MM-DD'. */
export type CellValue = string | number | null;
export type ColumnType = 'number' | 'text' | 'date';

export interface DatasetColumn {
  readonly name: EmpleadosColumn;
  readonly type: ColumnType;
  /** Nombre en español para la interfaz, en minúsculas («ciudad»). */
  readonly label: string;
  /** Género gramatical del nombre, para leer condiciones («cuya ciudad», «cuyo salario»). */
  readonly gender: 'f' | 'm';
  readonly nullable: boolean;
  /** Tipo Oracle de la columna, tal como lo crea `oracle/empleados-select-v2.sql`. */
  readonly oracleType: string;
  readonly description: string;
}

export type EmpleadoRow = {
  readonly ID_EMPLEADO: number;
  readonly NOMBRE: string;
  readonly APELLIDO: string;
  readonly CARGO: string;
  readonly DEPARTAMENTO: string;
  readonly CIUDAD: string;
  readonly SALARIO: number;
  readonly BONO: number | null;
  readonly FECHA_INGRESO: string;
  readonly ESTADO: 'ACTIVO' | 'INACTIVO';
  readonly CORREO: string;
  readonly ID_JEFE: number | null;
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

type RowTuple = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  number | null,
  string,
  'ACTIVO' | 'INACTIVO',
  number | null,
];

function row(
  [id, nombre, apellido, cargo, departamento, ciudad, salario, bono, fecha, estado, jefe]: RowTuple,
  correo: string,
): EmpleadoRow {
  return {
    ID_EMPLEADO: id,
    NOMBRE: nombre,
    APELLIDO: apellido,
    CARGO: cargo,
    DEPARTAMENTO: departamento,
    CIUDAD: ciudad,
    SALARIO: salario,
    BONO: bono,
    FECHA_INGRESO: fecha,
    ESTADO: estado,
    CORREO: correo,
    ID_JEFE: jefe,
  };
}

/** Correo ficticio en el dominio reservado `empresa.example` (RFC 2606), sin tildes. */
function mail(nombre: string, apellido: string): string {
  const plain = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  return `${plain(nombre)}.${plain(apellido)}@empresa.example`;
}

// Una fila por línea para leer el dataset como tabla.
// prettier-ignore
const ROWS: readonly RowTuple[] = [
  [1, 'Ana', 'Rojas', 'Gerente general', 'Operaciones', 'Bogotá', 9000000, 900000, '2012-02-01', 'ACTIVO', null],
  [2, 'Carlos', 'Gómez', 'Líder de área', 'TI', 'Bogotá', 7500000, 600000, '2014-06-16', 'ACTIVO', 1],
  [3, 'María', 'Ruiz', 'Líder de área', 'Ventas', 'Medellín', 6000000, 500000, '2015-03-02', 'ACTIVO', 1],
  [4, 'Jorge', 'Díaz', 'Líder de área', 'Finanzas', 'Cali', 6800000, null, '2016-09-12', 'ACTIVO', 1],
  [5, 'Laura', 'Mora', 'Líder de área', 'Recursos Humanos', 'Bogotá', 5800000, 400000, '2017-01-23', 'ACTIVO', 1],
  [6, 'Andrés', 'Pérez', 'Analista', 'TI', 'Bogotá', 4200000, 300000, '2019-04-08', 'ACTIVO', 2],
  [7, 'Paula', 'Castro', 'Analista', 'TI', 'Medellín', 4200000, null, '2020-08-03', 'ACTIVO', 2],
  [8, 'Oscar', 'Vega', 'Analista', 'TI', 'Cali', 3800000, 250000, '2021-02-15', 'INACTIVO', 2],
  [9, 'Sofía', 'López', 'Representante comercial', 'Ventas', 'Medellín', 3000000, 450000, '2018-11-19', 'ACTIVO', 3],
  [10, 'Mario', 'Soto', 'Representante comercial', 'Ventas', 'Bogotá', 3500000, 0, '2019-07-01', 'ACTIVO', 3],
  [11, 'Valentina', 'Ríos', 'Representante comercial', 'Ventas', 'Cali', 2900000, 350000, '2022-05-09', 'ACTIVO', 3],
  [12, 'Ricardo', 'Herrera', 'Representante comercial', 'Ventas', 'Barranquilla', 3500000, null, '2023-01-16', 'ACTIVO', 3],
  [13, 'Camila', 'Cruz', 'Analista', 'Finanzas', 'Cali', 4500000, 200000, '2020-03-10', 'ACTIVO', 4],
  [14, 'Diego', 'Ortiz', 'Analista', 'Finanzas', 'Bogotá', 5200000, 300000, '2016-10-24', 'INACTIVO', 4],
  [15, 'Daniela', 'Suárez', 'Especialista', 'Finanzas', 'Medellín', 6100000, 350000, '2015-12-01', 'ACTIVO', 4],
  [16, 'Julián', 'Luna', 'Asistente', 'Recursos Humanos', 'Cali', 2300000, null, '2024-02-05', 'ACTIVO', 5],
  [17, 'Carolina', 'Vargas', 'Analista', 'Recursos Humanos', 'Medellín', 3900000, 150000, '2021-09-13', 'ACTIVO', 5],
  [18, 'Felipe', 'Mejía', 'Asistente', 'Operaciones', 'Bogotá', 2100000, null, '2025-01-20', 'ACTIVO', 1],
  [19, 'Alicia', 'Paz', 'Especialista', 'Operaciones', 'Valledupar', 4800000, 250000, '2013-05-06', 'INACTIVO', 1],
  [20, 'Esteban', 'Torres', 'Asistente', 'TI', 'Barranquilla', 2500000, null, '2025-03-03', 'ACTIVO', null],
];

export const EMPLEADOS_DATASET: EducationalDataset = deepFreeze({
  id: 'empleados-select-v2',
  table: 'EMPLEADOS',
  columns: [
    {
      name: 'ID_EMPLEADO',
      type: 'number',
      label: 'identificador',
      gender: 'm',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Identificador único del empleado (clave primaria).',
    },
    {
      name: 'NOMBRE',
      type: 'text',
      label: 'nombre',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Nombre de pila.',
    },
    {
      name: 'APELLIDO',
      type: 'text',
      label: 'apellido',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Primer apellido.',
    },
    {
      name: 'CARGO',
      type: 'text',
      label: 'cargo',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Puesto que ocupa.',
    },
    {
      name: 'DEPARTAMENTO',
      type: 'text',
      label: 'departamento',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Área de la empresa.',
    },
    {
      name: 'CIUDAD',
      type: 'text',
      label: 'ciudad',
      gender: 'f',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Ciudad donde trabaja.',
    },
    {
      name: 'SALARIO',
      type: 'number',
      label: 'salario',
      gender: 'm',
      nullable: false,
      oracleType: 'NUMBER(10)',
      description: 'Salario mensual en pesos colombianos.',
    },
    {
      name: 'BONO',
      type: 'number',
      label: 'bono',
      gender: 'm',
      nullable: true,
      oracleType: 'NUMBER(10)',
      description: 'Bono mensual en pesos. NULL si el empleado no tiene bono asignado.',
    },
    {
      name: 'FECHA_INGRESO',
      type: 'date',
      label: 'fecha de ingreso',
      gender: 'f',
      nullable: false,
      oracleType: 'DATE',
      description: 'Fecha en que empezó a trabajar.',
    },
    {
      name: 'ESTADO',
      type: 'text',
      label: 'estado',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(8 CHAR)',
      description: 'ACTIVO o INACTIVO.',
    },
    {
      name: 'CORREO',
      type: 'text',
      label: 'correo',
      gender: 'm',
      nullable: false,
      oracleType: 'VARCHAR2(60 CHAR)',
      description: 'Correo corporativo ficticio.',
    },
    {
      name: 'ID_JEFE',
      type: 'number',
      label: 'identificador del jefe',
      gender: 'm',
      nullable: true,
      oracleType: 'NUMBER(4)',
      description: 'ID_EMPLEADO del jefe directo. NULL si no tiene jefe asignado.',
    },
  ],
  rows: ROWS.map((tuple) => row(tuple, mail(tuple[1], tuple[2]))),
});

export function isEmpleadosColumn(name: string): name is EmpleadosColumn {
  return (EMPLEADOS_COLUMNS as readonly string[]).includes(name);
}

/** Valores de una fila en el orden del esquema. */
export function rowValues(dataset: EducationalDataset, entry: EmpleadoRow): CellValue[] {
  return dataset.columns.map(({ name }) => entry[name]);
}

/** Huella FNV-1a de 32 bits sobre la forma canónica; detecta divergencias de versión. */
export function datasetFingerprint(dataset: EducationalDataset): string {
  const canonical = JSON.stringify([
    dataset.id,
    dataset.table,
    dataset.columns.map(({ name, type }) => [name, type]),
    dataset.rows.map((entry) => rowValues(dataset, entry)),
  ]);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
