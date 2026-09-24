import { EMPLEADOS_COLUMNS, EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { distinctRows, projectRows } from '@/domain/results/result-table';
import type { AnyPublicMission, MissionId, Piece } from '../types';

/**
 * Parte pública de las diez misiones (GAME_SPEC.md, versión 1). Puede enviarse al
 * navegador: no contiene rúbricas, pistas, explicaciones ni el orden de las soluciones.
 * Las piezas se listan en un orden mezclado fijo.
 */

export const CHALLENGE_VERSION = 'select-challenge-v1';

const piece = (id: string, text: string, role: Piece['role']): Piece => ({ id, text, role });
const asText = (rows: readonly (readonly (string | number)[])[]) =>
  rows.map((row) => row.map(String));

const cities = distinctRows(projectRows(EMPLEADOS_DATASET.rows, ['CIUDAD'])).rows.map(([city]) =>
  String(city),
);

export const PUBLIC_MISSIONS: readonly AnyPublicMission[] = Object.freeze([
  {
    id: 'M01',
    version: 1,
    order: 1,
    title: 'SELECT Visual',
    description: 'Elige qué columnas mostrar de EMPLEADOS.',
    difficulty: 'facil',
    interactionType: 'drag-column',
    learningObjective: 'Proyectar columnas específicas en el orden pedido.',
    lessons: ['L01', 'L04'],
    instructions: 'Muestra solo NOMBRE y SALARIO de cada empleado, en ese orden.',
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
    version: 1,
    order: 2,
    title: 'Constructor de Consultas',
    description: 'Ordena las piezas de una consulta SELECT.',
    difficulty: 'facil',
    interactionType: 'reorder-sql',
    learningObjective: 'Ubicar la lista de columnas y el origen en el orden sintáctico.',
    lessons: ['L02', 'L04'],
    instructions:
      'Ordena las piezas para mostrar CIUDAD y después NOMBRE desde EMPLEADOS. El punto y coma es opcional.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'reorder-sql',
      pieces: [
        piece('m02-empleados', 'empleados', 'table'),
        piece('m02-nombre', 'nombre', 'column'),
        piece('m02-from', 'FROM', 'keyword'),
        piece('m02-comma', ',', 'punctuation'),
        piece('m02-select', 'SELECT', 'keyword'),
        piece('m02-ciudad', 'ciudad', 'column'),
        piece('m02-end', ';', 'punctuation'),
      ],
      optionalPieceIds: ['m02-end'],
    },
  },
  {
    id: 'M03',
    version: 1,
    order: 3,
    title: '¿Qué devuelve el asterisco?',
    description: 'Anticipa el resultado de SELECT *.',
    difficulty: 'facil',
    interactionType: 'predict-result',
    learningObjective: 'Interpretar * como todas las columnas visibles del dataset.',
    lessons: ['L03'],
    instructions:
      'Construye los encabezados del resultado de SELECT * FROM empleados; en orden e indica cuántas filas devuelve.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'predict-result',
      query: 'SELECT * FROM empleados;',
      headerOptions: ['SALARIO', '*', 'ID', 'DEPTO', 'NOMBRE', 'CIUDAD', 'EDAD'],
      valueOptions: [],
      asks: { headers: true, rows: false, rowCount: true },
    },
  },
  {
    id: 'M04',
    version: 1,
    order: 4,
    title: 'Predice la proyección',
    description: 'Construye el resultado de una proyección de una columna.',
    difficulty: 'media',
    interactionType: 'predict-result',
    learningObjective: 'Reconocer que proyectar no elimina filas repetidas.',
    lessons: ['L04'],
    instructions:
      'Construye el resultado de SELECT ciudad FROM empleados; con su encabezado y todas sus filas.',
    maxScore: 100,
    baseDurationSeconds: 75,
    publicData: {
      type: 'predict-result',
      query: 'SELECT ciudad FROM empleados;',
      headerOptions: ['NOMBRE', 'CIUDAD', '*'],
      valueOptions: cities,
      asks: { headers: true, rows: true, rowCount: false },
    },
  },
  {
    id: 'M05',
    version: 1,
    order: 5,
    title: 'El cálculo correcto',
    description: 'Construye una expresión aritmética con paréntesis.',
    difficulty: 'media',
    interactionType: 'expression-builder',
    learningObjective: 'Aplicar la precedencia de operadores en una expresión de proyección.',
    lessons: ['L05'],
    instructions:
      'Construye el salario anual proyectado tras sumar 100000 al salario mensual y escribe el resultado para Ana.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'expression-builder',
      palette: [
        piece('m05-salario', 'salario', 'column'),
        piece('m05-100000', '100000', 'number'),
        piece('m05-12', '12', 'number'),
        piece('m05-plus', '+', 'operator'),
        piece('m05-times', '*', 'operator'),
        piece('m05-open', '(', 'punctuation'),
        piece('m05-close', ')', 'punctuation'),
      ],
      targetEmployee: 'Ana',
    },
  },
  {
    id: 'M06',
    version: 1,
    order: 6,
    title: 'Encabezados con sentido',
    description: 'Nombra una columna calculada con AS.',
    difficulty: 'media',
    interactionType: 'alias-builder',
    learningObjective: 'Asociar un alias a la expresión que describe.',
    lessons: ['L06'],
    instructions:
      'Coloca AS salario_anual para nombrar la columna calculada salario * 12 y asigna la etiqueta al encabezado correcto. Esta misión exige AS explícito.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'alias-builder',
      pieces: [
        piece('m06-as', 'AS salario_anual', 'alias'),
        piece('m06-from', 'FROM', 'keyword'),
        piece('m06-select', 'SELECT', 'keyword'),
        piece('m06-expr', 'salario * 12', 'expression'),
        piece('m06-empleados', 'empleados', 'table'),
        piece('m06-comma', ',', 'punctuation'),
        piece('m06-nombre', 'nombre', 'column'),
      ],
      previewColumns: ['NOMBRE', 'salario * 12'],
    },
  },
  {
    id: 'M07',
    version: 1,
    order: 7,
    title: 'DISTINCT sobre combinaciones',
    description: 'Construye el resultado de DISTINCT sobre dos columnas.',
    difficulty: 'media',
    interactionType: 'distinct-result',
    learningObjective: 'Comprender que DISTINCT compara la fila completa de salida.',
    lessons: ['L07'],
    instructions:
      'Construye el resultado de SELECT DISTINCT ciudad, depto FROM empleados; retirando solo las repeticiones idénticas.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'distinct-result',
      query: 'SELECT DISTINCT ciudad, depto FROM empleados;',
      columns: ['CIUDAD', 'DEPTO'],
      candidateRows: asText(projectRows(EMPLEADOS_DATASET.rows, ['CIUDAD', 'DEPTO']).rows),
    },
  },
  {
    id: 'M08',
    version: 1,
    order: 8,
    title: 'Debug Terminal',
    description: 'Localiza y repara el error de una consulta.',
    difficulty: 'dificil',
    interactionType: 'hotspot-error',
    learningObjective: 'Distinguir una consulta válida de una que cumple el pedido.',
    lessons: ['L04', 'L05', 'L06'],
    instructions: 'Selecciona el elemento que provoca el error y repara la consulta.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'hotspot-error',
      tokens: [
        'SELECT',
        'nombre',
        ',',
        'salario',
        '*',
        '12',
        'AS',
        'salario_anual',
        ',',
        'FROM',
        'empleados',
        ';',
      ],
      requirement:
        'Mostrar el nombre y el salario anual de cada empleado, sin columnas adicionales.',
    },
  },
  {
    id: 'M09',
    version: 1,
    order: 9,
    title: 'Reconstrucción de un reporte',
    description: 'Reconstruye una consulta con DISTINCT y alias.',
    difficulty: 'dificil',
    interactionType: 'build-query',
    learningObjective: 'Combinar DISTINCT y alias sin cambiar la comparación de valores.',
    lessons: ['L02', 'L06', 'L07'],
    instructions:
      'Obtén los pares únicos de ciudad y departamento con las etiquetas CIUDAD_ORIGEN y DEPARTAMENTO, en ese orden, e indica cuántas filas devuelve.',
    maxScore: 100,
    baseDurationSeconds: 120,
    publicData: {
      type: 'build-query',
      pieces: [
        piece('m09-as-depto', 'AS departamento', 'alias'),
        piece('m09-from', 'FROM', 'keyword'),
        piece('m09-ciudad', 'ciudad', 'column'),
        piece('m09-distinct', 'DISTINCT', 'keyword'),
        piece('m09-empleados', 'empleados', 'table'),
        piece('m09-select', 'SELECT', 'keyword'),
        piece('m09-depto', 'depto', 'column'),
        piece('m09-comma', ',', 'punctuation'),
        piece('m09-as-ciudad', 'AS ciudad_origen', 'alias'),
        piece('m09-end', ';', 'punctuation'),
      ],
      optionalPieceIds: ['m09-end'],
      asksRowCount: true,
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
    lessons: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08'],
    instructions:
      'Para cada empleado, muestra NOMBRE, CIUDAD y su salario anual proyectado tras aumentar 100000 al salario mensual. Usa AS para llamar PROYECCION_ANUAL a la tercera columna. Conserva a todos los empleados y ese orden de columnas.',
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
