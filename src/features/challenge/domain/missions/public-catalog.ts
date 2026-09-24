import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { projectRows } from '@/domain/results/result-table';
import type { AnyPublicMission, MissionId, Piece } from '../types';

/**
 * Parte pública de las diez misiones (GAME_SPEC.md, Challenge v2). Puede enviarse al
 * navegador: no contiene rúbricas, pistas, explicaciones ni el orden de las soluciones.
 * Las piezas se listan en un orden mezclado fijo. La dificultad crece de M01 a M10.
 */

export const CHALLENGE_VERSION = 'select-challenge-v2';

const piece = (id: string, text: string, role: Piece['role']): Piece => ({ id, text, role });

const cityColumn = projectRows(EMPLEADOS_DATASET.rows, ['CIUDAD']).rows.map(([city]) =>
  String(city),
);

export const PUBLIC_MISSIONS: readonly AnyPublicMission[] = Object.freeze([
  {
    id: 'M01',
    version: 1,
    order: 1,
    title: 'Columnas a la vista',
    description: 'Elige qué columnas mostrar de EMPLEADOS.',
    difficulty: 'facil',
    interactionType: 'drag-column',
    learningObjective: 'Proyectar solo las columnas pedidas, en el orden pedido.',
    request: 'Muéstrame solamente nombre y salario.',
    lessons: ['L01', 'L04'],
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
    version: 2,
    order: 2,
    title: 'El orden de SQL',
    description: 'Ordena las piezas de una consulta.',
    difficulty: 'facil',
    interactionType: 'reorder-sql',
    learningObjective: 'Ubicar la lista de columnas y el origen en el orden sintáctico.',
    request: 'Muéstrame el nombre y la ciudad de cada empleado.',
    lessons: ['L02', 'L04'],
    instructions: 'Ordena todas las piezas para formar la consulta. El punto y coma es opcional.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'reorder-sql',
      pieces: [
        piece('m02-from', 'FROM', 'keyword'),
        piece('m02-ciudad', 'ciudad', 'column'),
        piece('m02-end', ';', 'punctuation'),
        piece('m02-select', 'SELECT', 'keyword'),
        piece('m02-empleados', 'empleados', 'table'),
        piece('m02-comma', ',', 'punctuation'),
        piece('m02-nombre', 'nombre', 'column'),
      ],
    },
  },
  {
    id: 'M03',
    version: 1,
    order: 3,
    title: '¿Qué trae el asterisco?',
    description: 'Descubre qué proyecta SELECT *.',
    difficulty: 'facil',
    interactionType: 'predict-result',
    learningObjective: 'Interpretar * como todas las columnas visibles de la tabla.',
    request: 'Muéstrame todo lo que guarda la tabla EMPLEADOS.',
    lessons: ['L03'],
    instructions:
      'Construye los encabezados que devuelve SELECT * FROM empleados; en su orden e indica cuántas filas devuelve.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'predict-result',
      query: 'SELECT * FROM empleados;',
      headerOptions: ['SALARIO', '*', 'ID', 'DEPTO', 'NOMBRE', 'CIUDAD', 'EDAD'],
      asks: { headers: true, rowSelection: false, rowCount: true },
    },
  },
  {
    id: 'M04',
    version: 2,
    order: 4,
    title: 'Predice el resultado',
    description: 'Construye la tabla que devuelve una proyección.',
    difficulty: 'media',
    interactionType: 'predict-result',
    learningObjective: 'Reconocer que proyectar columnas conserva todas las filas.',
    request: '¿Qué tabla devuelve esta consulta?',
    lessons: ['L01', 'L04'],
    instructions:
      'Construye los encabezados del resultado de SELECT nombre, salario FROM empleados; y marca qué empleados aparecen en él.',
    maxScore: 100,
    baseDurationSeconds: 75,
    publicData: {
      type: 'predict-result',
      query: 'SELECT nombre, salario FROM empleados;',
      headerOptions: ['SALARIO', 'EDAD', 'NOMBRE', 'ID', 'CIUDAD', 'DEPTO'],
      asks: { headers: true, rowSelection: true, rowCount: false },
    },
  },
  {
    id: 'M05',
    version: 2,
    order: 5,
    title: 'Columnas calculadas',
    description: 'Construye una expresión y predice sus valores.',
    difficulty: 'media',
    interactionType: 'expression-builder',
    learningObjective: 'Calcular una columna nueva sin modificar la tabla de origen.',
    request: 'Muéstrame el salario mensual de cada empleado y cuánto gana al año.',
    lessons: ['L05'],
    instructions:
      'Completa la tercera columna con una expresión que calcule el salario anual y escribe el valor que mostrará para cada empleado indicado.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'expression-builder',
      query: 'SELECT nombre, salario, ▢ FROM empleados;',
      palette: [
        piece('m05-salario', 'salario', 'column'),
        piece('m05-edad', 'edad', 'column'),
        piece('m05-12', '12', 'number'),
        piece('m05-100', '100', 'number'),
        piece('m05-times', '*', 'operator'),
        piece('m05-plus', '+', 'operator'),
      ],
      predictionEmployeeIds: [1, 4, 5],
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
    lessons: ['L06'],
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
    version: 2,
    order: 7,
    title: 'Valores únicos con DISTINCT',
    description: 'Retira las repeticiones de una proyección.',
    difficulty: 'media',
    interactionType: 'distinct-result',
    learningObjective: 'Comprender que DISTINCT elimina filas repetidas del resultado.',
    request: '¿En qué ciudades hay empleados? Sin repetir ninguna.',
    lessons: ['L07'],
    instructions:
      'La lista muestra SELECT ciudad FROM empleados;. Conserva solo las filas que devuelve SELECT DISTINCT ciudad FROM empleados;.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'distinct-result',
      query: 'SELECT DISTINCT ciudad FROM empleados;',
      column: 'CIUDAD',
      candidateValues: cityColumn,
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
    lessons: ['L04', 'L06'],
    instructions:
      'Esta consulta no cumple el pedido. Selecciona el hueco donde falta un símbolo para que devuelva dos columnas.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'hotspot-error',
      tokens: ['SELECT', 'nombre', 'salario', 'FROM', 'empleados', ';'],
      requirement: 'Dos columnas: NOMBRE y SALARIO, para los seis empleados.',
      insertToken: ',',
    },
  },
  {
    id: 'M09',
    version: 2,
    order: 9,
    title: 'Del lenguaje al SQL',
    description: 'Traduce un pedido a una consulta completa con bloques.',
    difficulty: 'dificil',
    interactionType: 'build-query',
    learningObjective: 'Traducir un pedido en lenguaje natural a una consulta de proyección.',
    request: 'Muéstrame el nombre, ciudad y salario de todos los empleados.',
    lessons: ['L02', 'L04', 'L08'],
    instructions:
      'Construye la consulta con los bloques necesarios. Algunos bloques sobran. Se evalúa el resultado, no el texto exacto.',
    maxScore: 100,
    baseDurationSeconds: 120,
    publicData: {
      type: 'build-query',
      pieces: [
        piece('m09-salario', 'salario', 'column'),
        piece('m09-from', 'FROM', 'keyword'),
        piece('m09-comma-a', ',', 'punctuation'),
        piece('m09-edad', 'edad', 'column'),
        piece('m09-nombre', 'nombre', 'column'),
        piece('m09-distinct', 'DISTINCT', 'keyword'),
        piece('m09-select', 'SELECT', 'keyword'),
        piece('m09-star', '*', 'punctuation'),
        piece('m09-ciudad', 'ciudad', 'column'),
        piece('m09-comma-b', ',', 'punctuation'),
        piece('m09-depto', 'depto', 'column'),
        piece('m09-empleados', 'empleados', 'table'),
        piece('m09-end', ';', 'punctuation'),
      ],
    },
  },
  {
    id: 'M10',
    version: 1,
    order: 10,
    title: 'Final Boss: Query Master',
    description: 'Escribe una consulta completa desde un pedido.',
    difficulty: 'dificil',
    interactionType: 'write-query',
    learningObjective: 'Escribir y justificar una consulta de proyección completa.',
    request:
      'Para cada empleado, muestra NOMBRE, CIUDAD y su salario anual proyectado tras aumentar 100000 al salario mensual, con el encabezado PROYECCION_ANUAL.',
    lessons: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08'],
    instructions:
      'Escribe la consulta completa. Usa AS para llamar PROYECCION_ANUAL a la tercera columna y conserva a todos los empleados.',
    maxScore: 100,
    baseDurationSeconds: 180,
    publicData: {
      type: 'write-query',
      requirement:
        'La corrección exige AS explícito y una expresión basada en SALARIO. Se evalúa en Oracle.',
      requiresOracle: true,
    },
  },
] satisfies readonly AnyPublicMission[]);

export function findPublicMission(id: MissionId): AnyPublicMission | undefined {
  return PUBLIC_MISSIONS.find((mission) => mission.id === id);
}
