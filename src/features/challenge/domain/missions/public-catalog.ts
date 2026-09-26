import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import type { AnyPublicMission, MissionId, Piece } from '../types';

/**
 * Parte pública de las diez misiones (GAME_SPEC.md, Challenge v3). Puede enviarse al
 * navegador: no contiene rúbricas, pistas, explicaciones ni el orden de las soluciones.
 * Las piezas se listan en un orden mezclado fijo. La dificultad crece de M01 a M10 y el
 * recorrido cubre la unidad ampliada: proyección, WHERE, DISTINCT, alias y ORDER BY.
 */

export const CHALLENGE_VERSION = 'select-challenge-v3';

const piece = (id: string, text: string, role: Piece['role']): Piece => ({ id, text, role });

/** Departamentos de Bogotá en el orden de la tabla: la lista de partida de M07. */
const bogotaDepartments = EMPLEADOS_DATASET.rows
  .filter((row) => row.CIUDAD === 'Bogotá')
  .map((row) => row.DEPARTAMENTO);

export const PUBLIC_MISSIONS: readonly AnyPublicMission[] = Object.freeze([
  {
    id: 'M01',
    version: 2,
    order: 1,
    title: 'Columnas a la vista',
    description: 'Elige qué columnas mostrar de EMPLEADOS.',
    difficulty: 'facil',
    interactionType: 'drag-column',
    learningObjective: 'Proyectar solo las columnas pedidas, en el orden pedido.',
    request: 'Muéstrame solamente nombre y salario.',
    lessons: ['L02', 'L05'],
    instructions:
      'Arrastra a la lista de SELECT las columnas que responden al pedido, en ese orden.',
    maxScore: 100,
    baseDurationSeconds: 45,
    publicData: {
      type: 'drag-column',
      datasetId: EMPLEADOS_DATASET.id,
      availableColumns: [...EMPLEADOS_COLUMNS],
    },
  },
  {
    id: 'M02',
    version: 3,
    order: 2,
    title: 'El orden de SQL',
    description: 'Ordena las piezas de una consulta con WHERE.',
    difficulty: 'facil',
    interactionType: 'reorder-sql',
    learningObjective: 'Escribir SELECT, FROM y WHERE en su orden.',
    request: 'Muéstrame el nombre y la ciudad de los empleados de TI.',
    lessons: ['L03', 'L11'],
    instructions: 'Ordena todas las piezas para formar la consulta. El punto y coma es opcional.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'reorder-sql',
      pieces: [
        piece('m02-from', 'FROM', 'keyword'),
        piece('m02-ciudad', 'ciudad', 'column'),
        piece('m02-condition', "departamento = 'TI'", 'expression'),
        piece('m02-end', ';', 'punctuation'),
        piece('m02-select', 'SELECT', 'keyword'),
        piece('m02-where', 'WHERE', 'keyword'),
        piece('m02-empleados', 'empleados', 'table'),
        piece('m02-comma', ',', 'punctuation'),
        piece('m02-nombre', 'nombre', 'column'),
      ],
    },
  },
  {
    id: 'M03',
    version: 2,
    order: 3,
    title: '¿Qué trae el asterisco?',
    description: 'Descubre qué proyecta SELECT *.',
    difficulty: 'facil',
    interactionType: 'predict-result',
    learningObjective: 'Interpretar * como todas las columnas de la tabla.',
    request: 'Muéstrame todo lo que guarda la tabla EMPLEADOS.',
    lessons: ['L04'],
    instructions:
      'Construye los encabezados que devuelve SELECT * FROM empleados; en su orden e indica cuántas filas devuelve.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'predict-result',
      query: 'SELECT * FROM empleados;',
      headerOptions: [
        'SALARIO',
        '*',
        'ID_EMPLEADO',
        'CORREO',
        'DEPARTAMENTO',
        'NOMBRE',
        'FECHA_INGRESO',
        'CIUDAD',
        'ESTADO',
        'APELLIDO',
        'ID_JEFE',
        'CARGO',
        'BONO',
      ],
      asks: { headers: true, rowSelection: false, rowCount: true },
    },
  },
  {
    id: 'M04',
    version: 3,
    order: 4,
    title: 'Predice las filas',
    description: 'Construye el resultado de una consulta con WHERE.',
    difficulty: 'media',
    interactionType: 'predict-result',
    learningObjective: 'Reconocer qué filas conserva WHERE y qué columnas muestra SELECT.',
    request: '¿Qué tabla devuelve esta consulta?',
    lessons: ['L11', 'L12'],
    instructions:
      'Construye los encabezados del resultado y marca los empleados que cumplen la condición.',
    maxScore: 100,
    baseDurationSeconds: 75,
    publicData: {
      type: 'predict-result',
      query: "SELECT nombre, salario\nFROM empleados\nWHERE ciudad = 'Cali';",
      headerOptions: ['SALARIO', 'CIUDAD', 'NOMBRE', 'ID_EMPLEADO', 'CARGO'],
      asks: { headers: true, rowSelection: true, rowCount: false },
      sourceColumns: ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'SALARIO'],
    },
  },
  {
    id: 'M05',
    version: 3,
    order: 5,
    title: 'Columnas calculadas',
    description: 'Construye una expresión y predice sus valores.',
    difficulty: 'media',
    interactionType: 'expression-builder',
    learningObjective: 'Calcular una columna nueva sin modificar la tabla de origen.',
    request: 'Muéstrame el salario mensual de cada empleado y cuánto gana al año.',
    lessons: ['L06', 'L07'],
    instructions:
      'Completa la tercera columna con una expresión que calcule el salario anual y escribe el valor que mostrará para cada empleado indicado.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'expression-builder',
      query: 'SELECT nombre, salario, ▢ FROM empleados;',
      palette: [
        piece('m05-salario', 'salario', 'column'),
        piece('m05-bono', 'bono', 'column'),
        piece('m05-12', '12', 'number'),
        piece('m05-100', '100', 'number'),
        piece('m05-times', '*', 'operator'),
        piece('m05-plus', '+', 'operator'),
      ],
      predictionEmployeeIds: [1, 9, 18],
    },
  },
  {
    id: 'M06',
    version: 2,
    order: 6,
    title: 'Encabezados con AS',
    description: 'Nombra una columna calculada con un alias.',
    difficulty: 'media',
    interactionType: 'alias-builder',
    learningObjective: 'Comprender que AS cambia el encabezado mostrado, no la tabla.',
    request: 'Muestra el nombre y el salario anual con el encabezado SALARIO_ANUAL.',
    lessons: ['L08'],
    instructions:
      'Ordena las piezas para que la columna calculada salario * 12 se muestre como SALARIO_ANUAL. Observa qué cambia en el resultado y qué no cambia en la tabla.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'alias-builder',
      pieces: [
        piece('m06-as', 'AS salario_anual', 'alias'),
        piece('m06-from', 'FROM', 'keyword'),
        piece('m06-nombre', 'nombre', 'column'),
        piece('m06-select', 'SELECT', 'keyword'),
        piece('m06-expr', 'salario * 12', 'expression'),
        piece('m06-empleados', 'empleados', 'table'),
        piece('m06-comma', ',', 'punctuation'),
        piece('m06-end', ';', 'punctuation'),
      ],
    },
  },
  {
    id: 'M07',
    version: 3,
    order: 7,
    title: 'Valores únicos con DISTINCT',
    description: 'Retira las repeticiones de un resultado filtrado.',
    difficulty: 'media',
    interactionType: 'distinct-result',
    learningObjective: 'Comprender que DISTINCT elimina filas repetidas del resultado.',
    request: '¿Qué departamentos tienen empleados en Bogotá? Sin repetir ninguno.',
    lessons: ['L10', 'L11'],
    instructions:
      'La lista muestra el resultado sin DISTINCT. Conserva solo las filas que devuelve la consulta con DISTINCT.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'distinct-result',
      query: "SELECT DISTINCT departamento\nFROM empleados\nWHERE ciudad = 'Bogotá';",
      sourceQuery: "SELECT departamento FROM empleados WHERE ciudad = 'Bogotá';",
      column: 'DEPARTAMENTO',
      candidateValues: bogotaDepartments,
    },
  },
  {
    id: 'M08',
    version: 2,
    order: 8,
    title: 'Detecta el error',
    description: 'Localiza lo que le falta a una consulta.',
    difficulty: 'dificil',
    interactionType: 'hotspot-error',
    learningObjective: 'Distinguir una consulta válida de una que cumple el pedido.',
    request: 'Muéstrame el nombre y el salario de cada empleado.',
    lessons: ['L05', 'L08'],
    instructions:
      'Esta consulta no cumple el pedido. Selecciona el hueco donde falta un símbolo para que devuelva dos columnas.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'hotspot-error',
      tokens: ['SELECT', 'nombre', 'salario', 'FROM', 'empleados', ';'],
      requirement: `Dos columnas, NOMBRE y SALARIO, para los ${EMPLEADOS_DATASET.rows.length} empleados.`,
      insertToken: ',',
    },
  },
  {
    id: 'M09',
    version: 3,
    order: 9,
    title: 'Del lenguaje al SQL',
    description: 'Traduce un pedido con orden a una consulta completa.',
    difficulty: 'dificil',
    interactionType: 'build-query',
    learningObjective: 'Traducir un pedido en lenguaje natural a SELECT … FROM … ORDER BY.',
    request:
      'Muéstrame el nombre, la ciudad y el salario de todos los empleados, del salario más alto al más bajo.',
    lessons: ['L05', 'L19'],
    instructions:
      'Construye la consulta con los bloques necesarios. Algunos bloques sobran. Se evalúa el resultado y su orden, no el texto exacto.',
    maxScore: 100,
    baseDurationSeconds: 120,
    publicData: {
      type: 'build-query',
      pieces: [
        piece('m09-salario', 'salario', 'column'),
        piece('m09-from', 'FROM', 'keyword'),
        piece('m09-desc', 'DESC', 'keyword'),
        piece('m09-comma-a', ',', 'punctuation'),
        piece('m09-bono', 'bono', 'column'),
        piece('m09-nombre', 'nombre', 'column'),
        piece('m09-order', 'ORDER BY', 'keyword'),
        piece('m09-distinct', 'DISTINCT', 'keyword'),
        piece('m09-select', 'SELECT', 'keyword'),
        piece('m09-asc', 'ASC', 'keyword'),
        piece('m09-star', '*', 'punctuation'),
        piece('m09-ciudad', 'ciudad', 'column'),
        piece('m09-comma-b', ',', 'punctuation'),
        piece('m09-salario-orden', 'salario', 'column'),
        piece('m09-empleados', 'empleados', 'table'),
        piece('m09-end', ';', 'punctuation'),
      ],
    },
  },
  {
    id: 'M10',
    version: 2,
    order: 10,
    title: 'Final Boss: Query Master',
    description: 'Escribe una consulta completa desde un pedido.',
    difficulty: 'dificil',
    interactionType: 'write-query',
    learningObjective:
      'Escribir y justificar una consulta completa con filtro, cálculo, alias y orden.',
    request:
      'Para los empleados ACTIVOS de Bogotá, muestra NOMBRE, CARGO y su salario anual proyectado tras aumentar 100000 al salario mensual, con el encabezado PROYECCION_ANUAL, de la proyección más alta a la más baja.',
    lessons: ['L07', 'L08', 'L11', 'L13', 'L19', 'L20'],
    instructions:
      'Escribe la consulta completa: filtra con WHERE, usa AS para llamar PROYECCION_ANUAL a la tercera columna y ordena con ORDER BY.',
    maxScore: 100,
    baseDurationSeconds: 180,
    publicData: {
      type: 'write-query',
      requirement:
        'La corrección exige WHERE, AS explícito, una expresión basada en SALARIO y ORDER BY. Se evalúa en Oracle.',
      requiresOracle: true,
    },
  },
] satisfies readonly AnyPublicMission[]);

export function findPublicMission(id: MissionId): AnyPublicMission | undefined {
  return PUBLIC_MISSIONS.find((mission) => mission.id === id);
}
