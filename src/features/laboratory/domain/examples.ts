import type { DiagnosticCode } from '@/domain/sql/diagnostics';

/**
 * Ejemplos del laboratorio (LAB_SPEC, casos LAB01–LAB24): uno por concepto de la unidad y
 * un grupo de consultas con errores para practicar la lectura del diagnóstico.
 */

export type LabExampleGroup =
  'Proyección' | 'Filtros' | 'NULL y orden' | 'Integración' | 'Errores para analizar';

export interface LabExample {
  readonly id: string;
  readonly title: string;
  readonly group: LabExampleGroup;
  readonly sql: string;
}

export const LAB_EXAMPLE_GROUPS: readonly LabExampleGroup[] = [
  'Proyección',
  'Filtros',
  'NULL y orden',
  'Integración',
  'Errores para analizar',
];

export const LAB_EXAMPLES: readonly LabExample[] = Object.freeze([
  {
    id: 'LAB01',
    group: 'Proyección',
    title: 'Todas las columnas',
    sql: 'SELECT *\nFROM empleados;',
  },
  {
    id: 'LAB02',
    group: 'Proyección',
    title: 'Columnas en otro orden',
    sql: 'select ciudad, nombre\nfrom EMPLEADOS',
  },
  {
    id: 'LAB03',
    group: 'Proyección',
    title: 'Cálculo con alias',
    sql: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
  },
  {
    id: 'LAB04',
    group: 'Proyección',
    title: 'Precedencia con paréntesis',
    sql: 'SELECT nombre, salario, bono,\n       (salario + bono) * 12 AS total_anual\nFROM empleados;',
  },
  {
    id: 'LAB05',
    group: 'Proyección',
    title: 'Nombre completo con ||',
    sql: "SELECT nombre || ' ' || apellido AS nombre_completo,\n       cargo\nFROM empleados;",
  },
  {
    id: 'LAB06',
    group: 'Proyección',
    title: 'Ciudades sin repetir',
    sql: 'SELECT DISTINCT ciudad\nFROM empleados;',
  },
  {
    id: 'LAB07',
    group: 'Proyección',
    title: 'Combinaciones únicas',
    sql: 'SELECT DISTINCT ciudad, departamento\nFROM empleados;',
  },
  {
    id: 'LAB08',
    group: 'Filtros',
    title: 'WHERE con texto',
    sql: "SELECT nombre, cargo, ciudad\nFROM empleados\nWHERE ciudad = 'Cali';",
  },
  {
    id: 'LAB09',
    group: 'Filtros',
    title: 'Comparación numérica',
    sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario >= 5000000;',
  },
  {
    id: 'LAB10',
    group: 'Filtros',
    title: 'AND y OR con paréntesis',
    sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
  },
  {
    id: 'LAB11',
    group: 'Filtros',
    title: 'Rango con BETWEEN',
    sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
  },
  {
    id: 'LAB12',
    group: 'Filtros',
    title: 'Lista con IN',
    sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Medellín', 'Cali');",
  },
  {
    id: 'LAB13',
    group: 'Filtros',
    title: 'Patrón con LIKE',
    sql: "SELECT nombre, apellido\nFROM empleados\nWHERE nombre LIKE '%ar%';",
  },
  {
    id: 'LAB14',
    group: 'Filtros',
    title: 'Fechas con DATE',
    sql: "SELECT nombre, fecha_ingreso\nFROM empleados\nWHERE fecha_ingreso >= DATE '2022-01-01';",
  },
  {
    id: 'LAB15',
    group: 'NULL y orden',
    title: 'Sin bono: IS NULL',
    sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;',
  },
  {
    id: 'LAB16',
    group: 'NULL y orden',
    title: 'Ordenar de mayor a menor',
    sql: 'SELECT nombre, departamento, salario\nFROM empleados\nORDER BY salario DESC;',
  },
  {
    id: 'LAB17',
    group: 'NULL y orden',
    title: 'Ordenar por dos columnas',
    sql: 'SELECT departamento, nombre, salario\nFROM empleados\nORDER BY departamento ASC, salario DESC;',
  },
  {
    id: 'LAB18',
    group: 'Integración',
    title: 'Consulta completa',
    sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 3000000 AND 6000000\nORDER BY salario DESC;",
  },
  {
    id: 'LAB19',
    group: 'Errores para analizar',
    title: 'Coma olvidada',
    sql: 'SELECT nombre salario\nFROM empleados;',
  },
  {
    id: 'LAB20',
    group: 'Errores para analizar',
    title: 'Texto sin comillas',
    sql: 'SELECT nombre\nFROM empleados\nWHERE ciudad = Bogotá;',
  },
  {
    id: 'LAB21',
    group: 'Errores para analizar',
    title: '= NULL',
    sql: 'SELECT nombre\nFROM empleados\nWHERE bono = NULL;',
  },
  {
    id: 'LAB22',
    group: 'Errores para analizar',
    title: 'BETWEEN al revés',
    sql: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;',
  },
  {
    id: 'LAB23',
    group: 'Errores para analizar',
    title: 'IN sin paréntesis',
    sql: "SELECT nombre\nFROM empleados\nWHERE ciudad IN 'Bogotá', 'Cali';",
  },
  {
    id: 'LAB24',
    group: 'Errores para analizar',
    title: 'AND y OR sin paréntesis',
    sql: "SELECT nombre\nFROM empleados\nWHERE estado = 'ACTIVO' OR departamento = 'TI' AND salario > 5000000;",
  },
]);

export const DEFAULT_LAB_SQL = "SELECT nombre, salario\nFROM empleados\nWHERE ciudad = 'Bogotá';";

const PROJECTION = 'SELECT nombre, salario\nFROM empleados;';
const TEXT = "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Bogotá';";
const RANGE = 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;';
const LIST = "SELECT nombre\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Cali');";
const PATTERN = "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';";
const NULLS = 'SELECT nombre\nFROM empleados\nWHERE bono IS NULL;';
const LOGIC =
  "SELECT nombre\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Cali')\n  AND salario > 5000000;";
const ORDER = 'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;';
const ALIAS = 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;';
const DATE = "SELECT nombre\nFROM empleados\nWHERE fecha_ingreso >= DATE '2020-01-01';";

/** Ejemplo mínimo correcto relacionado con cada diagnóstico. */
export const DIAGNOSTIC_EXAMPLES: Partial<Readonly<Record<DiagnosticCode, string>>> = {
  empty: PROJECTION,
  'missing-select': PROJECTION,
  'empty-select-list': PROJECTION,
  'missing-item': PROJECTION,
  'missing-item-after-comma': PROJECTION,
  'missing-comma': PROJECTION,
  'possible-missing-comma': PROJECTION,
  'missing-from': PROJECTION,
  'missing-table': PROJECTION,
  'unknown-table': 'SELECT *\nFROM empleados;',
  'column-as-table': 'SELECT *\nFROM empleados;',
  'unknown-column': PROJECTION,
  'table-as-column': PROJECTION,
  'quoted-column': PROJECTION,
  'star-mixed': 'SELECT *\nFROM empleados;',
  'star-alias': 'SELECT *\nFROM empleados;',
  'text-arithmetic': 'SELECT nombre, salario * 12\nFROM empleados;',
  'incomplete-expression': 'SELECT nombre, salario * 12\nFROM empleados;',
  'division-by-zero': 'SELECT nombre, salario / 2 AS mitad\nFROM empleados;',
  'invalid-alias': ALIAS,
  'implicit-alias': ALIAS,
  'unaliased-literal': "SELECT nombre || ' ' || apellido AS nombre_completo\nFROM empleados;",
  'comparison-in-select': 'SELECT nombre\nFROM empleados\nWHERE salario > 3000000;',
  'missing-condition': TEXT,
  'missing-comparison': TEXT,
  'missing-logical-operator': LOGIC,
  'chained-comparison': RANGE,
  'invalid-operator': TEXT,
  'unquoted-text': TEXT,
  'double-quoted-text': TEXT,
  'type-mismatch': TEXT,
  'implicit-conversion': 'SELECT nombre\nFROM empleados\nWHERE salario > 3000000;',
  'text-case': TEXT,
  'equals-null': NULLS,
  'missing-null': NULLS,
  'never-null': NULLS,
  'between-reversed': RANGE,
  'missing-between-and': RANGE,
  'in-without-parentheses': LIST,
  'empty-in-list': LIST,
  'in-null': LIST,
  'not-in-null': LIST,
  'like-unquoted-pattern': PATTERN,
  'like-without-wildcard': PATTERN,
  'like-on-number': PATTERN,
  'and-or-precedence': LOGIC,
  'contradictory-and': LIST,
  'alias-in-where':
    'SELECT nombre, salario * 12 AS anual\nFROM empleados\nWHERE salario * 12 > 60000000;',
  'date-text-comparison': DATE,
  'invalid-date': DATE,
  'misplaced-clause': "SELECT nombre\nFROM empleados\nWHERE estado = 'ACTIVO'\nORDER BY nombre;",
  'missing-by': ORDER,
  'missing-order-item': ORDER,
  'order-position': ORDER,
  'ambiguous-order': ORDER,
  'order-by-not-selected': 'SELECT DISTINCT ciudad\nFROM empleados\nORDER BY ciudad;',
  'unbalanced-parentheses': LOGIC,
};
