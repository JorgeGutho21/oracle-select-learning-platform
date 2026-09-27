import type { EmpleadosColumn } from '@/domain/dataset/empleados';
import type { ConceptId } from './sql-concepts';

/**
 * Proyecciones didácticas: para cada concepto, qué parte de EMPLEADOS se muestra y por qué.
 * No son datos nuevos: señalan columnas y filas (por ID_EMPLEADO) del dataset real
 * `empleados-select-v2`, que sigue completo en Oracle, el laboratorio y las pruebas. El
 * resultado de cada consulta lo calcula el motor educativo sobre esas mismas filas.
 *
 * Modelo que siguen las escenas: TABLA DE ORIGEN → CONSULTA → QUÉ HACE CADA PARTE →
 * RESULTADO → IDEA CLAVE.
 */

export interface ProjectionPart {
  /** Fragmento de la consulta tal como aparece en el SQL. */
  readonly code: string;
  /** Concepto que explica la parte: su glosa sale de la fuente conceptual única. */
  readonly concept: ConceptId;
  /** Explicación propia de esta consulta cuando la glosa general no basta. */
  readonly detail?: string;
}

export interface ConceptProjectionSpec {
  readonly id: string;
  /** Concepto principal que la proyección enseña. */
  readonly concept: ConceptId;
  /** Consulta válida en Oracle SQL. */
  readonly sql: string;
  /** Columnas relevantes de EMPLEADOS para la tabla de origen (en el orden de la tabla). */
  readonly columns: readonly EmpleadosColumn[];
  /** Filas de muestra por ID_EMPLEADO: casos que cumplen y que no, cuando hay filtro. */
  readonly sampleIds: readonly number[];
  /** Qué parte de la consulta explica cada fragmento. */
  readonly parts: readonly ProjectionPart[];
  /** Propósito pedagógico: qué debe entender quien mira la proyección. */
  readonly purpose: string;
  /** Idea clave; por defecto, la del concepto en la fuente conceptual. */
  readonly keyIdea?: string;
}

const SELECT_FROM: readonly ProjectionPart[] = [
  { code: 'SELECT nombre, ciudad', concept: 'select' },
  { code: 'FROM empleados', concept: 'from' },
];

export const CONCEPT_PROJECTIONS = {
  'select-from': {
    id: 'select-from',
    concept: 'select',
    sql: 'SELECT nombre, ciudad\nFROM empleados;',
    columns: ['NOMBRE', 'CARGO', 'CIUDAD'],
    sampleIds: [1, 2, 3, 4],
    parts: SELECT_FROM,
    purpose: 'Distinguir qué se muestra (SELECT) de dónde salen los datos (FROM).',
  },
  star: {
    id: 'star',
    concept: 'star',
    sql: 'SELECT *\nFROM empleados;',
    columns: [
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
    ],
    sampleIds: [1, 2],
    parts: [
      { code: 'SELECT', concept: 'select', detail: 'elige qué mostrar' },
      { code: '*', concept: 'star' },
      { code: 'FROM', concept: 'from', detail: 'de dónde salen los datos' },
      { code: 'empleados', concept: 'table', detail: 'la tabla de origen' },
    ],
    purpose: 'Ver que * pide todas las columnas y conserva todas las filas.',
    keyIdea: 'SELECT * conserva las filas y pide todas las columnas, en el orden de la tabla.',
  },
  columns: {
    id: 'columns',
    concept: 'column-list',
    sql: 'SELECT nombre, ciudad\nFROM empleados;',
    columns: ['NOMBRE', 'CARGO', 'CIUDAD', 'SALARIO'],
    sampleIds: [1, 3, 4],
    parts: [
      { code: 'nombre, ciudad', concept: 'column-list' },
      { code: ',', concept: 'comma' },
    ],
    purpose: 'Ver que SELECT elige columnas y su orden, sin quitar filas.',
  },
  expression: {
    id: 'expression',
    concept: 'expression',
    sql: 'SELECT nombre, salario + bono * 12,\n       (salario + bono) * 12\nFROM empleados;',
    columns: ['NOMBRE', 'SALARIO', 'BONO'],
    sampleIds: [1, 2, 4],
    parts: [
      { code: 'salario + bono * 12', concept: 'expression' },
      {
        code: 'bono * 12',
        concept: 'arithmetic-precedence',
        detail: 'se calcula primero: * antes que +',
      },
      { code: '(salario + bono)', concept: 'parentheses' },
    ],
    purpose: 'Seguir el cálculo fila a fila y ver que el orden de las operaciones cambia el valor.',
  },
  alias: {
    id: 'alias',
    concept: 'alias',
    sql: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    columns: ['NOMBRE', 'SALARIO'],
    sampleIds: [1, 2, 3],
    parts: [
      { code: 'salario * 12', concept: 'expression' },
      { code: 'AS', concept: 'as' },
      { code: 'salario_anual', concept: 'alias', detail: 'encabezado temporal del resultado' },
    ],
    purpose: 'Ver que el alias solo cambia el encabezado del resultado.',
  },
  distinct: {
    id: 'distinct',
    concept: 'distinct',
    sql: 'SELECT DISTINCT ciudad\nFROM empleados;',
    columns: ['NOMBRE', 'CIUDAD'],
    sampleIds: [1, 2, 3, 4, 5, 7],
    parts: [
      { code: 'DISTINCT', concept: 'distinct' },
      { code: 'ciudad', concept: 'column', detail: 'la columna cuyos valores se comparan' },
    ],
    purpose: 'Ver que DISTINCT quita repeticiones del resultado, no de la tabla.',
  },
  where: {
    id: 'where',
    concept: 'where',
    sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali';",
    columns: ['NOMBRE', 'CIUDAD', 'SALARIO'],
    sampleIds: [1, 3, 4, 8, 12, 13],
    parts: [...SELECT_FROM, { code: "WHERE ciudad = 'Cali'", concept: 'where' }],
    purpose: 'Ver qué filas cumplen la condición y cuáles quedan fuera.',
  },
  comparison: {
    id: 'comparison',
    concept: 'comparison',
    sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario >= 6000000;',
    columns: ['NOMBRE', 'SALARIO'],
    sampleIds: [1, 2, 3, 5, 6, 15],
    parts: [
      { code: 'WHERE', concept: 'where' },
      {
        code: 'salario >= 6000000',
        concept: 'comparison',
        detail: 'mayor o igual: 6.000.000 también cumple',
      },
    ],
    purpose: 'Comprobar un operador de comparación fila a fila, incluido el valor límite.',
    keyIdea: "Los números van sin comillas; los textos, entre comillas simples: 'Cali'.",
  },
  between: {
    id: 'between',
    concept: 'between',
    sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000\n              AND 6000000;',
    columns: ['NOMBRE', 'SALARIO'],
    sampleIds: [3, 6, 9, 11, 15],
    parts: [
      { code: 'BETWEEN', concept: 'between' },
      { code: '3000000 AND 6000000', concept: 'between', detail: 'límites incluidos' },
    ],
    purpose: 'Ver que los dos límites del rango cuentan y los valores de fuera no.',
  },
  in: {
    id: 'in',
    concept: 'in',
    sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Medellín', 'Cali');",
    columns: ['NOMBRE', 'CIUDAD'],
    sampleIds: [1, 3, 4, 12, 17],
    parts: [
      { code: 'IN', concept: 'in' },
      {
        code: "('Medellín', 'Cali')",
        concept: 'comma',
        detail: 'lista entre paréntesis, separada por comas',
      },
    ],
    purpose: 'Ver que IN acepta cualquier valor de una lista.',
  },
  like: {
    id: 'like',
    concept: 'like',
    sql: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';",
    columns: ['NOMBRE', 'CIUDAD'],
    sampleIds: [1, 2, 3, 6, 19],
    parts: [
      { code: 'LIKE', concept: 'like' },
      { code: "'A%'", concept: 'percent', detail: 'A y después cualquier texto' },
    ],
    purpose: 'Ver qué parte del texto coincide con el patrón.',
  },
  'is-null': {
    id: 'is-null',
    concept: 'is-null',
    sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;',
    columns: ['NOMBRE', 'BONO'],
    sampleIds: [1, 4, 7, 10, 12],
    parts: [
      { code: 'IS NULL', concept: 'is-null' },
      { code: 'bono', concept: 'null', detail: 'NULL es ausencia de valor, no 0' },
    ],
    purpose: 'Distinguir NULL (sin valor) de 0 y consultarlo con IS NULL.',
  },
  'order-by': {
    id: 'order-by',
    concept: 'order-by',
    sql: 'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;',
    columns: ['NOMBRE', 'SALARIO'],
    sampleIds: [3, 4, 5, 9, 15],
    parts: [
      { code: 'ORDER BY salario', concept: 'order-by' },
      { code: 'DESC', concept: 'desc' },
    ],
    purpose: 'Ver que ORDER BY reordena las filas del resultado sin cambiar la tabla.',
  },
} as const satisfies Readonly<Record<string, ConceptProjectionSpec>>;

export type ConceptProjectionId = keyof typeof CONCEPT_PROJECTIONS;
