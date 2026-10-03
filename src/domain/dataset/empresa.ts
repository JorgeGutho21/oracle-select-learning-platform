import { EMPLEADOS_DATASET, type CellValue, type ColumnType } from './empleados';

/**
 * Dataset relacional `empresa-relacional-v1` de las secciones 2 y 3 (DATABASE_SCHEMA, 3.0).
 * Reutiliza a las mismas 20 personas de `empleados-select-v2` (Sección 1): el texto
 * DEPARTAMENTO se reemplaza por la clave foránea ID_DEPARTAMENTO hacia DEPARTAMENTOS, y se
 * añaden PROYECTOS y ASIGNACIONES (relación N:M) más AUDITORIA_SALARIOS, vacía, para los
 * triggers. El dataset de la Sección 1 no cambia.
 *
 * Casos diseñados a propósito:
 * - Esteban Torres (20) todavía no tiene departamento (ID_DEPARTAMENTO NULL): INNER JOIN lo
 *   pierde y LEFT JOIN lo conserva.
 * - Investigación (60) no tiene empleados ni proyectos: aparece solo con un OUTER JOIN.
 * - Automatización de nómina (106) no tiene asignaciones; seis personas no tienen proyecto.
 * - Camila Cruz (Finanzas) trabaja también en un proyecto de TI: el departamento de la
 *   persona y el del proyecto no siempre coinciden.
 * - ID_JEFE apunta a la misma tabla (SELF JOIN); Ana Rojas y Esteban Torres no tienen jefe.
 *
 * Es la fuente única: `oracle/dblab-empresa-v1.sql` se genera desde aquí (una prueba lo
 * comprueba) y las pruebas cargan estas mismas filas en Oracle y en PostgreSQL.
 */

export const EMPRESA_DATASET_ID = 'empresa-relacional-v1';

export type EmpresaTable =
  'DEPARTAMENTOS' | 'EMPLEADOS' | 'PROYECTOS' | 'ASIGNACIONES' | 'AUDITORIA_SALARIOS';

export interface EmpresaColumn {
  readonly name: string;
  readonly type: ColumnType;
  readonly nullable: boolean;
  /** Tipo Oracle tal como lo crea el script. */
  readonly oracleType: string;
  readonly description: string;
  /** Restricción de la columna en Oracle (sin el nombre de la columna ni el tipo). */
  readonly constraint?: string;
  /** Valor por defecto en Oracle (solo AUDITORIA_SALARIOS). */
  readonly oracleDefault?: string;
}

export interface ForeignKey {
  readonly name: string;
  readonly columns: readonly string[];
  readonly references: EmpresaTable;
  readonly referencedColumns: readonly string[];
}

export interface EmpresaTableDefinition {
  readonly name: EmpresaTable;
  /** Para qué existe la tabla, en una frase. */
  readonly purpose: string;
  readonly columns: readonly EmpresaColumn[];
  readonly primaryKey: { readonly name: string; readonly columns: readonly string[] };
  readonly foreignKeys: readonly ForeignKey[];
  readonly checks?: readonly { readonly name: string; readonly condition: string }[];
  readonly uniques?: readonly { readonly name: string; readonly columns: readonly string[] }[];
  readonly rows: readonly (readonly CellValue[])[];
  /** Columna que identifica la fila y columna con su nombre legible (vista responsive). */
  readonly idColumn: string;
  readonly nameColumn?: string;
  /** Grupos de columnas para pantallas estrechas (sin las de identidad). */
  readonly fieldGroups: readonly { readonly title: string; readonly columns: readonly string[] }[];
}

const DEPARTMENT_IDS: Readonly<Record<string, number>> = {
  Operaciones: 10,
  TI: 20,
  Ventas: 30,
  Finanzas: 40,
  'Recursos Humanos': 50,
};

/** Persona sin departamento asignado todavía (caso deliberado para OUTER JOIN). */
export const SIN_DEPARTAMENTO = 20;

const DEPARTAMENTOS: EmpresaTableDefinition = {
  name: 'DEPARTAMENTOS',
  purpose: 'Las áreas de la empresa: cada una se registra una sola vez.',
  columns: [
    {
      name: 'ID_DEPARTAMENTO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave primaria: identifica cada departamento.',
    },
    {
      name: 'NOMBRE_DEPARTAMENTO',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Nombre del área, único.',
    },
    {
      name: 'SEDE',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Ciudad donde está la oficina principal del área.',
    },
  ],
  primaryKey: { name: 'DEPARTAMENTOS_PK', columns: ['ID_DEPARTAMENTO'] },
  foreignKeys: [],
  uniques: [{ name: 'DEPARTAMENTOS_NOMBRE_UNICO', columns: ['NOMBRE_DEPARTAMENTO'] }],
  rows: [
    [10, 'Operaciones', 'Bogotá'],
    [20, 'TI', 'Bogotá'],
    [30, 'Ventas', 'Medellín'],
    [40, 'Finanzas', 'Cali'],
    [50, 'Recursos Humanos', 'Bogotá'],
    [60, 'Investigación', 'Barranquilla'],
  ],
  idColumn: 'ID_DEPARTAMENTO',
  nameColumn: 'NOMBRE_DEPARTAMENTO',
  fieldGroups: [{ title: 'Ubicación', columns: ['SEDE'] }],
};

const EMPLEADOS: EmpresaTableDefinition = {
  name: 'EMPLEADOS',
  purpose:
    'Las personas de la empresa. El departamento ya no se escribe como texto: se guarda su clave (ID_DEPARTAMENTO).',
  columns: [
    {
      name: 'ID_EMPLEADO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave primaria: identifica a cada persona.',
    },
    {
      name: 'NOMBRE',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Nombre.',
    },
    {
      name: 'APELLIDO',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Primer apellido.',
    },
    {
      name: 'CARGO',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Cargo.',
    },
    {
      name: 'ID_DEPARTAMENTO',
      type: 'number',
      nullable: true,
      oracleType: 'NUMBER(4)',
      description: 'Clave foránea hacia DEPARTAMENTOS. NULL si aún no tiene departamento.',
    },
    {
      name: 'CIUDAD',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Ciudad donde trabaja la persona.',
    },
    {
      name: 'SALARIO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(10)',
      description: 'Salario mensual en pesos colombianos.',
      constraint: 'CONSTRAINT EMPLEADOS_SALARIO_POSITIVO CHECK (SALARIO > 0)',
    },
    {
      name: 'BONO',
      type: 'number',
      nullable: true,
      oracleType: 'NUMBER(10)',
      description: 'Bono mensual. NULL si no tiene bono asignado (no es lo mismo que 0).',
      constraint: 'CONSTRAINT EMPLEADOS_BONO_NO_NEGATIVO CHECK (BONO >= 0)',
    },
    {
      name: 'FECHA_INGRESO',
      type: 'date',
      nullable: false,
      oracleType: 'DATE',
      description: 'Fecha de ingreso a la empresa.',
    },
    {
      name: 'ESTADO',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(8 CHAR)',
      description: 'ACTIVO o INACTIVO.',
      constraint: "CONSTRAINT EMPLEADOS_ESTADO CHECK (ESTADO IN ('ACTIVO', 'INACTIVO'))",
    },
    {
      name: 'ID_JEFE',
      type: 'number',
      nullable: true,
      oracleType: 'NUMBER(4)',
      description: 'ID_EMPLEADO del jefe directo (clave foránea a la misma tabla).',
    },
  ],
  primaryKey: { name: 'EMPLEADOS_PK', columns: ['ID_EMPLEADO'] },
  foreignKeys: [
    {
      name: 'EMPLEADOS_DEPARTAMENTO_FK',
      columns: ['ID_DEPARTAMENTO'],
      references: 'DEPARTAMENTOS',
      referencedColumns: ['ID_DEPARTAMENTO'],
    },
    {
      name: 'EMPLEADOS_JEFE_FK',
      columns: ['ID_JEFE'],
      references: 'EMPLEADOS',
      referencedColumns: ['ID_EMPLEADO'],
    },
  ],
  rows: EMPLEADOS_DATASET.rows.map((row) => [
    row.ID_EMPLEADO,
    row.NOMBRE,
    row.APELLIDO,
    row.CARGO,
    row.ID_EMPLEADO === SIN_DEPARTAMENTO ? null : DEPARTMENT_IDS[row.DEPARTAMENTO]!,
    row.CIUDAD,
    row.SALARIO,
    row.BONO,
    row.FECHA_INGRESO,
    row.ESTADO,
    row.ID_JEFE,
  ]),
  idColumn: 'ID_EMPLEADO',
  nameColumn: 'NOMBRE',
  fieldGroups: [
    { title: 'Identidad', columns: ['APELLIDO', 'CARGO'] },
    { title: 'Relaciones', columns: ['ID_DEPARTAMENTO', 'ID_JEFE'] },
    { title: 'Compensación', columns: ['SALARIO', 'BONO'] },
    { title: 'Empleo', columns: ['CIUDAD', 'FECHA_INGRESO', 'ESTADO'] },
  ],
};

const PROYECTOS: EmpresaTableDefinition = {
  name: 'PROYECTOS',
  purpose: 'Los proyectos en curso; cada uno pertenece a un departamento.',
  columns: [
    {
      name: 'ID_PROYECTO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave primaria del proyecto.',
    },
    {
      name: 'NOMBRE_PROYECTO',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(40 CHAR)',
      description: 'Nombre del proyecto.',
    },
    {
      name: 'ID_DEPARTAMENTO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave foránea: departamento responsable.',
    },
    {
      name: 'PRESUPUESTO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(12)',
      description: 'Presupuesto total en pesos.',
      constraint: 'CONSTRAINT PROYECTOS_PRESUPUESTO_POSITIVO CHECK (PRESUPUESTO > 0)',
    },
    {
      name: 'FECHA_INICIO',
      type: 'date',
      nullable: false,
      oracleType: 'DATE',
      description: 'Fecha de inicio.',
    },
  ],
  primaryKey: { name: 'PROYECTOS_PK', columns: ['ID_PROYECTO'] },
  foreignKeys: [
    {
      name: 'PROYECTOS_DEPARTAMENTO_FK',
      columns: ['ID_DEPARTAMENTO'],
      references: 'DEPARTAMENTOS',
      referencedColumns: ['ID_DEPARTAMENTO'],
    },
  ],
  rows: [
    [101, 'Migración a la nube', 20, 120000000, '2025-02-03'],
    [102, 'Portal de clientes', 20, 80000000, '2025-06-16'],
    [103, 'Expansión regional', 30, 95000000, '2025-03-10'],
    [104, 'Cierre contable 2025', 40, 30000000, '2025-11-04'],
    [105, 'Bienestar laboral', 50, 25000000, '2026-01-12'],
    [106, 'Automatización de nómina', 40, 60000000, '2026-04-06'],
    [107, 'Ruta logística', 10, 45000000, '2026-02-02'],
  ],
  idColumn: 'ID_PROYECTO',
  nameColumn: 'NOMBRE_PROYECTO',
  fieldGroups: [
    { title: 'Responsable', columns: ['ID_DEPARTAMENTO'] },
    { title: 'Plan', columns: ['PRESUPUESTO', 'FECHA_INICIO'] },
  ],
};

const ASIGNACIONES: EmpresaTableDefinition = {
  name: 'ASIGNACIONES',
  purpose:
    'Quién trabaja en qué proyecto: resuelve la relación muchos a muchos entre EMPLEADOS y PROYECTOS.',
  columns: [
    {
      name: 'ID_EMPLEADO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave foránea hacia EMPLEADOS (parte de la clave primaria).',
    },
    {
      name: 'ID_PROYECTO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Clave foránea hacia PROYECTOS (parte de la clave primaria).',
    },
    {
      name: 'ROL',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(30 CHAR)',
      description: 'Papel de la persona en el proyecto.',
    },
    {
      name: 'HORAS_SEMANALES',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(2)',
      description: 'Horas por semana dedicadas al proyecto.',
      constraint: 'CONSTRAINT ASIGNACIONES_HORAS CHECK (HORAS_SEMANALES BETWEEN 1 AND 40)',
    },
  ],
  primaryKey: { name: 'ASIGNACIONES_PK', columns: ['ID_EMPLEADO', 'ID_PROYECTO'] },
  foreignKeys: [
    {
      name: 'ASIGNACIONES_EMPLEADO_FK',
      columns: ['ID_EMPLEADO'],
      references: 'EMPLEADOS',
      referencedColumns: ['ID_EMPLEADO'],
    },
    {
      name: 'ASIGNACIONES_PROYECTO_FK',
      columns: ['ID_PROYECTO'],
      references: 'PROYECTOS',
      referencedColumns: ['ID_PROYECTO'],
    },
  ],
  rows: [
    [1, 107, 'Patrocinadora', 5],
    [2, 101, 'Líder', 20],
    [2, 102, 'Líder', 10],
    [3, 103, 'Líder', 20],
    [5, 105, 'Líder', 10],
    [6, 101, 'Desarrollador', 30],
    [7, 101, 'Desarrolladora', 20],
    [7, 102, 'Desarrolladora', 15],
    [8, 102, 'Desarrollador', 10],
    [9, 103, 'Comercial', 25],
    [11, 103, 'Comercial', 25],
    [13, 102, 'Analista financiera', 5],
    [13, 104, 'Analista', 20],
    [15, 104, 'Líder', 15],
    [17, 105, 'Analista', 20],
    [18, 107, 'Asistente', 30],
    [20, 101, 'Soporte', 15],
  ],
  idColumn: 'ID_EMPLEADO',
  fieldGroups: [{ title: 'Asignación', columns: ['ID_PROYECTO', 'ROL', 'HORAS_SEMANALES'] }],
};

const AUDITORIA_SALARIOS: EmpresaTableDefinition = {
  name: 'AUDITORIA_SALARIOS',
  purpose:
    'Historial de cambios de salario. Empieza vacía: la llenan los triggers de la Sección 3.',
  columns: [
    {
      name: 'ID_AUDITORIA',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER',
      description: 'Número del registro, generado por Oracle (columna identidad).',
      oracleDefault: 'GENERATED BY DEFAULT AS IDENTITY',
    },
    {
      name: 'ID_EMPLEADO',
      type: 'number',
      nullable: false,
      oracleType: 'NUMBER(4)',
      description: 'Persona cuyo salario cambió (sin clave foránea: la auditoría se conserva).',
    },
    {
      name: 'SALARIO_ANTERIOR',
      type: 'number',
      nullable: true,
      oracleType: 'NUMBER(10)',
      description: 'Valor de :OLD.SALARIO (NULL en una inserción).',
    },
    {
      name: 'SALARIO_NUEVO',
      type: 'number',
      nullable: true,
      oracleType: 'NUMBER(10)',
      description: 'Valor de :NEW.SALARIO (NULL en un borrado).',
    },
    {
      name: 'OPERACION',
      type: 'text',
      nullable: false,
      oracleType: 'VARCHAR2(10 CHAR)',
      description: 'INSERT, UPDATE o DELETE.',
    },
    {
      name: 'FECHA_CAMBIO',
      type: 'date',
      nullable: false,
      oracleType: 'DATE',
      description: 'Momento del cambio (SYSDATE).',
      oracleDefault: 'DEFAULT SYSDATE',
    },
  ],
  primaryKey: { name: 'AUDITORIA_SALARIOS_PK', columns: ['ID_AUDITORIA'] },
  foreignKeys: [],
  rows: [],
  idColumn: 'ID_AUDITORIA',
  fieldGroups: [
    { title: 'Cambio', columns: ['ID_EMPLEADO', 'SALARIO_ANTERIOR', 'SALARIO_NUEVO'] },
    { title: 'Registro', columns: ['OPERACION', 'FECHA_CAMBIO'] },
  ],
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

/** Tablas en orden de creación: cada tabla referenciada existe antes que la que la usa. */
export const EMPRESA_TABLES: readonly EmpresaTableDefinition[] = deepFreeze([
  DEPARTAMENTOS,
  EMPLEADOS,
  PROYECTOS,
  ASIGNACIONES,
  AUDITORIA_SALARIOS,
]);

export function empresaTable(name: string): EmpresaTableDefinition | undefined {
  return EMPRESA_TABLES.find((table) => table.name === name.toUpperCase());
}

export function columnIndex(table: EmpresaTableDefinition, column: string): number {
  const index = table.columns.findIndex((entry) => entry.name === column.toUpperCase());
  if (index < 0) throw new Error(`${table.name} no tiene la columna ${column}`);
  return index;
}

/** Valor de una celda por nombre de columna. */
export function cell(
  table: EmpresaTableDefinition,
  row: readonly CellValue[],
  column: string,
): CellValue {
  return row[columnIndex(table, column)] ?? null;
}

/* ---------- Scripts ---------- */

export type SqlDialect = 'oracle' | 'postgres';

const POSTGRES_TYPES: readonly [RegExp, string][] = [
  [/^NUMBER\((\d+)\)$/, 'numeric($1)'],
  [/^NUMBER$/, 'integer'],
  [/^VARCHAR2\((\d+) CHAR\)$/, 'varchar($1)'],
  [/^DATE$/, 'date'],
];

function columnType(column: EmpresaColumn, dialect: SqlDialect): string {
  if (dialect === 'oracle') return column.oracleType;
  for (const [pattern, replacement] of POSTGRES_TYPES) {
    if (pattern.test(column.oracleType)) return column.oracleType.replace(pattern, replacement);
  }
  throw new Error(`Tipo sin equivalente: ${column.oracleType}`);
}

function literal(value: CellValue, type: ColumnType): string {
  if (value === null) return 'NULL';
  if (type === 'number') return String(value);
  if (type === 'date') return `DATE '${value}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

function columnDefault(column: EmpresaColumn, dialect: SqlDialect): string {
  if (!column.oracleDefault) return '';
  if (dialect === 'postgres' && column.oracleDefault === 'DEFAULT SYSDATE') {
    return ' DEFAULT CURRENT_DATE';
  }
  return ` ${column.oracleDefault}`;
}

function createTable(table: EmpresaTableDefinition, dialect: SqlDialect): string {
  const lines = table.columns.map(
    (column) =>
      `  ${column.name} ${columnType(column, dialect)}${columnDefault(column, dialect)}` +
      `${column.nullable ? '' : ' NOT NULL'}${column.constraint ? ` ${column.constraint}` : ''}`,
  );
  lines.push(
    `  CONSTRAINT ${table.primaryKey.name} PRIMARY KEY (${table.primaryKey.columns.join(', ')})`,
  );
  for (const unique of table.uniques ?? []) {
    lines.push(`  CONSTRAINT ${unique.name} UNIQUE (${unique.columns.join(', ')})`);
  }
  for (const key of table.foreignKeys) {
    lines.push(
      `  CONSTRAINT ${key.name} FOREIGN KEY (${key.columns.join(', ')}) REFERENCES ${key.references} (${key.referencedColumns.join(', ')})`,
    );
  }
  return `CREATE TABLE ${table.name} (\n${lines.join(',\n')}\n)`;
}

function inserts(table: EmpresaTableDefinition): string[] {
  const names = table.columns.map((column) => column.name).join(', ');
  return table.rows.map(
    (row) =>
      `INSERT INTO ${table.name} (${names}) VALUES (${row
        .map((value, index) => literal(value, table.columns[index]!.type))
        .join(', ')})`,
  );
}

/**
 * Sentencias que crean y cargan el dataset, sin punto y coma final. En Oracle se ejecutan en
 * el esquema propietario; en PostgreSQL sirven a las pruebas cruzadas.
 */
export function empresaStatements(dialect: SqlDialect = 'oracle'): string[] {
  return [
    ...EMPRESA_TABLES.map((table) => createTable(table, dialect)),
    ...EMPRESA_TABLES.flatMap(inserts),
  ];
}

export const EMPRESA_SCRIPT_HEADER = [
  '-- DB LAB · dataset educativo empresa-relacional-v1 (secciones 2 y 3).',
  '-- Generado desde src/domain/dataset/empresa.ts; no editar a mano (una prueba lo compara).',
  '-- Se puede ejecutar en un esquema propio de Oracle (por ejemplo en FreeSQL u Oracle',
  '-- Live SQL) para repetir los ejemplos de las secciones 2 y 3. Datos ficticios.',
  "-- Las fechas usan literales DATE 'AAAA-MM-DD': no dependen de NLS_DATE_FORMAT.",
].join('\n');

/** Script Oracle completo (el archivo `oracle/dblab-empresa-v1.sql`). */
export function empresaOracleScript(): string {
  const creates = EMPRESA_TABLES.map((table) => `${createTable(table, 'oracle')};`);
  const loads = EMPRESA_TABLES.filter((table) => table.rows.length > 0).map((table) =>
    inserts(table)
      .map((statement) => `${statement};`)
      .join('\n'),
  );
  return `${EMPRESA_SCRIPT_HEADER}\n\n${[...creates, ...loads].join('\n\n')}\n\nCOMMIT;\n`;
}
