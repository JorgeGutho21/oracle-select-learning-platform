import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import type { AnyPublicMission, MissionId, Piece } from '../types';

/**
 * Parte pública de las diez misiones (GAME_SPEC.md, Challenge v4). Puede enviarse al
 * navegador: no contiene rúbricas, pistas, explicaciones ni el orden de las soluciones.
 * Las piezas se listan en un orden mezclado fijo. Cada misión pide razonar sobre una muestra
 * de trabajo pequeña (hasta 8 registros y 3–4 columnas): observar, predecir, construir,
 * comparar, corregir y justificar. La dificultad crece de M01 a M10.
 */

export const CHALLENGE_VERSION = 'select-challenge-v4';

const piece = (id: string, text: string, role: Piece['role']): Piece => ({ id, text, role });

/** Ciudades de EMPLEADOS en el orden de la tabla: opciones de la predicción de M07. */
const cities = [...new Set(EMPLEADOS_DATASET.rows.map((row) => row.CIUDAD))];

export const PUBLIC_MISSIONS: readonly AnyPublicMission[] = Object.freeze([
  {
    id: 'M01',
    version: 4,
    order: 1,
    title: 'Columnas a la vista',
    description: 'Elige qué columnas mostrar, en qué orden y cuáles no.',
    difficulty: 'facil',
    interactionType: 'drag-column',
    learningObjective: 'Proyectar solo las columnas pedidas, en el orden pedido.',
    request:
      'Recursos Humanos necesita una lista para contactar a los empleados: el nombre, la ciudad y el correo, en ese orden. No debe aparecer información salarial.',
    lessons: ['L02', 'L05'],
    instructions:
      'Arrastra o toca las columnas que responden al pedido para ponerlas en la lista de SELECT, en el orden pedido. Algunas columnas no se piden.',
    maxScore: 100,
    baseDurationSeconds: 45,
    publicData: {
      type: 'drag-column',
      datasetId: EMPLEADOS_DATASET.id,
      availableColumns: [
        'ID_EMPLEADO',
        'NOMBRE',
        'APELLIDO',
        'CARGO',
        'CIUDAD',
        'SALARIO',
        'BONO',
        'CORREO',
      ],
    },
  },
  {
    id: 'M02',
    version: 4,
    order: 2,
    title: 'El orden de SQL',
    description: 'Construye una consulta con solo las piezas necesarias.',
    difficulty: 'facil',
    interactionType: 'reorder-sql',
    learningObjective:
      'Escribir SELECT y FROM en su orden y descartar lo que el pedido no necesita.',
    request:
      'Para una lista de asistencia necesito el nombre y la ciudad de todos los empleados, sin quitar ninguno.',
    lessons: ['L02', 'L03'],
    instructions:
      'Construye la consulta con las piezas necesarias, en el orden de SQL. Algunas piezas sobran: decide cuáles no responden al pedido.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'reorder-sql',
      pieces: [
        piece('m02-from', 'FROM', 'keyword'),
        piece('m02-ciudad', 'ciudad', 'column'),
        piece('m02-where', 'WHERE', 'keyword'),
        piece('m02-end', ';', 'punctuation'),
        piece('m02-select', 'SELECT', 'keyword'),
        piece('m02-star', '*', 'punctuation'),
        piece('m02-empleados', 'empleados', 'table'),
        piece('m02-distinct', 'DISTINCT', 'keyword'),
        piece('m02-comma', ',', 'punctuation'),
        piece('m02-nombre', 'nombre', 'column'),
      ],
    },
  },
  {
    id: 'M03',
    version: 3,
    order: 3,
    title: '¿Qué trae el asterisco?',
    description: 'Predice qué devuelve SELECT * y qué no hace.',
    difficulty: 'facil',
    interactionType: 'predict-result',
    learningObjective:
      'Interpretar * como todas las columnas, reconocer que SELECT controla columnas y que sin WHERE no se descarta ninguna fila.',
    request: 'Necesito ver todo lo que guarda la tabla EMPLEADOS.',
    lessons: ['L04'],
    instructions:
      'Observa el esquema de EMPLEADOS. Indica cuántas columnas y cuántas filas devuelve la consulta, y decide qué hace y qué no hace el asterisco.',
    maxScore: 100,
    baseDurationSeconds: 60,
    publicData: {
      type: 'predict-result',
      query: 'SELECT *\nFROM empleados;',
      headerOptions: [],
      asks: {
        headers: false,
        rowSelection: false,
        rowCount: true,
        columnCount: true,
        claims: true,
      },
      claims: [
        { id: 'star-column', text: 'Aparece una columna llamada *.' },
        { id: 'table-order', text: 'Las columnas salen en el mismo orden que en la tabla.' },
        { id: 'drops-null', text: 'Descarta a los empleados que tienen BONO en NULL.' },
        { id: 'sorts', text: 'Ordena las filas alfabéticamente por nombre.' },
        {
          id: 'select-controls',
          text: 'Para ver solo NOMBRE y CIUDAD, se cambia el * por esas dos columnas.',
        },
      ],
    },
  },
  {
    id: 'M04',
    version: 5,
    order: 4,
    title: 'Predice las filas',
    description: 'Marca qué filas conserva WHERE y construye la condición.',
    difficulty: 'media',
    interactionType: 'predict-result',
    learningObjective:
      'Distinguir WHERE, que selecciona filas, de SELECT, que selecciona columnas.',
    request: 'Necesitamos únicamente a los empleados de Cali.',
    lessons: ['L11', 'L12'],
    instructions:
      'Paso 1: marca en la muestra las filas que cumplirán la condición. Paso 2: construye la condición de WHERE con las piezas; algunas sobran.',
    maxScore: 100,
    baseDurationSeconds: 75,
    publicData: {
      type: 'predict-result',
      query: 'SELECT nombre, ciudad, salario\nFROM empleados\n▢;',
      headerOptions: [],
      asks: { headers: false, rowSelection: true, rowCount: false, condition: true },
      sourceColumns: ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'SALARIO'],
      // Ocho registros: tres de Cali y cinco de otras ciudades.
      sampleIds: [1, 3, 4, 6, 11, 12, 16, 17],
      conditionPieces: [
        piece('m04-cali-text', "'Cali'", 'expression'),
        piece('m04-salario', 'salario', 'column'),
        piece('m04-where', 'WHERE', 'keyword'),
        piece('m04-cali-bare', 'Cali', 'expression'),
        piece('m04-equals', '=', 'operator'),
        piece('m04-ciudad', 'ciudad', 'column'),
        piece('m04-greater', '>', 'operator'),
      ],
    },
  },
  {
    id: 'M05',
    version: 4,
    order: 5,
    title: 'Expresiones y precedencia',
    description: 'Predice dos cálculos y construye el que responde al pedido.',
    difficulty: 'media',
    interactionType: 'expression-builder',
    learningObjective:
      'Calcular una columna nueva respetando la precedencia: * antes que +, salvo paréntesis.',
    request:
      'Finanzas quiere el ingreso anual de cada empleado: cada mes recibe su salario más su bono, durante 12 meses.',
    lessons: ['L06', 'L07'],
    instructions:
      'Paso 1: predice el valor de las dos expresiones para Ana. Paso 2: construye la expresión que calcula el ingreso anual pedido.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'expression-builder',
      query: 'SELECT nombre, salario, bono, ▢\nFROM empleados;',
      palette: [
        piece('m05-salario', 'salario', 'column'),
        piece('m05-bono', 'bono', 'column'),
        piece('m05-12', '12', 'number'),
        piece('m05-plus', '+', 'operator'),
        piece('m05-times', '*', 'operator'),
        piece('m05-open', '(', 'punctuation'),
        piece('m05-close', ')', 'punctuation'),
      ],
      predictionEmployeeIds: [1],
      comparisons: ['salario + bono * 12', '(salario + bono) * 12'],
    },
  },
  {
    id: 'M06',
    version: 3,
    order: 6,
    title: 'Encabezados con AS',
    description: 'Nombra una columna calculada con un alias.',
    difficulty: 'media',
    interactionType: 'alias-builder',
    learningObjective:
      'Comprender que AS solo cambia el encabezado del resultado: no renombra la columna guardada ni cambia la tabla.',
    request:
      'Muestra el nombre y el salario anual de cada empleado. El encabezado de la columna calculada debe ser SALARIO_ANUAL, escrito con AS.',
    lessons: ['L08'],
    instructions:
      'Construye la consulta con las piezas; algunas sobran. Compara el encabezado sin alias y con alias: los valores no cambian.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'alias-builder',
      pieces: [
        piece('m06-as', 'AS', 'keyword'),
        piece('m06-from', 'FROM', 'keyword'),
        piece('m06-quoted', "'salario_anual'", 'alias'),
        piece('m06-nombre', 'nombre', 'column'),
        piece('m06-select', 'SELECT', 'keyword'),
        piece('m06-expr', 'salario * 12', 'expression'),
        piece('m06-alias', 'salario_anual', 'alias'),
        piece('m06-empleados', 'empleados', 'table'),
        piece('m06-comma', ',', 'punctuation'),
        piece('m06-end', ';', 'punctuation'),
      ],
    },
  },
  {
    id: 'M07',
    version: 4,
    order: 7,
    title: 'Valores únicos con DISTINCT',
    description: 'Predice qué deja DISTINCT con una columna y con un par.',
    difficulty: 'media',
    interactionType: 'distinct-result',
    learningObjective:
      'Comprender que DISTINCT quita filas repetidas del resultado y que, con dos columnas, compara el par completo.',
    request: '¿En qué ciudades trabajan los analistas? Cada ciudad una sola vez.',
    lessons: ['L10', 'L11'],
    instructions:
      'Paso 1: marca las ciudades que devolverá SELECT DISTINCT ciudad. Paso 2: predice cuántas filas devuelve DISTINCT con ciudad y departamento.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'distinct-result',
      query: "SELECT DISTINCT ciudad\nFROM empleados\nWHERE cargo = 'Analista';",
      pairQuery: "SELECT DISTINCT ciudad, departamento\nFROM empleados\nWHERE cargo = 'Analista';",
      sourceQuery: "SELECT nombre, ciudad, departamento\nFROM empleados\nWHERE cargo = 'Analista';",
      column: 'CIUDAD',
      options: cities,
    },
  },
  {
    id: 'M08',
    version: 3,
    order: 8,
    title: 'Detecta el error',
    description: 'Clasifica, localiza y corrige un error de SQL.',
    difficulty: 'dificil',
    interactionType: 'hotspot-error',
    learningObjective:
      'Diagnosticar una consulta: distinguir errores de sintaxis, de semántica y de concepto, y corregirla.',
    request: 'Esta consulta no cumple el pedido. Encuentra el error y corrígelo.',
    lessons: ['L05', 'L11', 'L16', 'L18'],
    instructions:
      'Paso 1: decide qué tipo de error es. Paso 2: toca la parte de la consulta donde está. Paso 3: escribe la consulta corregida.',
    maxScore: 100,
    baseDurationSeconds: 90,
    publicData: {
      type: 'hotspot-error',
      variants: [
        {
          id: 'coma',
          request: 'Muestra el nombre y el salario de cada empleado.',
          tokens: ['SELECT', 'nombre', 'salario', 'FROM', 'empleados', ';'],
        },
        {
          id: 'from',
          request: 'Muestra el nombre y la ciudad de cada empleado.',
          tokens: ['SELECT', 'nombre', ',', 'ciudad', 'empleados', ';'],
        },
        {
          id: 'comillas',
          request: 'Muestra el nombre de los empleados de Cali.',
          tokens: ['SELECT', 'nombre', 'FROM', 'empleados', 'WHERE', 'ciudad', '=', 'Cali', ';'],
        },
        {
          id: 'doble-coma',
          request: 'Muestra el nombre, el cargo y la ciudad de cada empleado.',
          tokens: ['SELECT', 'nombre', ',', ',', 'cargo', ',', 'ciudad', 'FROM', 'empleados', ';'],
        },
        {
          id: 'parentesis',
          request: 'Muestra el nombre y el ingreso anual: salario más bono, durante 12 meses.',
          tokens: [
            'SELECT',
            'nombre',
            ',',
            '(',
            'salario',
            '+',
            'bono',
            '*',
            '12',
            'FROM',
            'empleados',
            ';',
          ],
        },
        {
          id: 'igual-null',
          request: 'Muestra el nombre de los empleados que no tienen bono registrado (NULL).',
          tokens: ['SELECT', 'nombre', 'FROM', 'empleados', 'WHERE', 'bono', '=', 'NULL', ';'],
        },
        {
          id: 'in',
          request: 'Muestra el nombre de los empleados de Cali o de Medellín.',
          tokens: [
            'SELECT',
            'nombre',
            'FROM',
            'empleados',
            'WHERE',
            'ciudad',
            'IN',
            "'Cali'",
            ',',
            "'Medellín'",
            ';',
          ],
        },
        {
          id: 'distinct',
          request: 'Muestra cada ciudad una sola vez.',
          tokens: ['SELECT', 'ciudad', 'DISTINCT', 'FROM', 'empleados', ';'],
        },
      ],
    },
  },
  {
    id: 'M09',
    version: 4,
    order: 9,
    title: 'Del lenguaje al SQL',
    description: 'Traduce un pedido con filtro y orden a una consulta completa.',
    difficulty: 'dificil',
    interactionType: 'build-query',
    learningObjective:
      'Traducir un pedido en lenguaje natural a SELECT … FROM … WHERE … ORDER BY, combinando condiciones.',
    request:
      'Muestra el nombre, la ciudad y el salario de los empleados de Bogotá o Cali que ganan al menos 4.200.000, del salario más alto al más bajo.',
    lessons: ['L05', 'L12', 'L13', 'L16', 'L19'],
    instructions:
      'Construye la consulta con los bloques necesarios; varios sobran. Se evalúa el resultado y su orden sobre la tabla completa, no el texto exacto.',
    maxScore: 100,
    baseDurationSeconds: 120,
    publicData: {
      type: 'build-query',
      pieces: [
        piece('m09-salario-w', 'salario', 'column'),
        piece('m09-from', 'FROM', 'keyword'),
        piece('m09-or', 'OR', 'keyword'),
        piece('m09-desc', 'DESC', 'keyword'),
        piece('m09-comma-a', ',', 'punctuation'),
        piece('m09-list', "('Bogotá', 'Cali')", 'expression'),
        piece('m09-nombre', 'nombre', 'column'),
        piece('m09-gt', '>', 'operator'),
        piece('m09-order', 'ORDER BY', 'keyword'),
        piece('m09-where', 'WHERE', 'keyword'),
        piece('m09-distinct', 'DISTINCT', 'keyword'),
        piece('m09-select', 'SELECT', 'keyword'),
        piece('m09-in', 'IN', 'keyword'),
        piece('m09-asc', 'ASC', 'keyword'),
        piece('m09-ciudad', 'ciudad', 'column'),
        piece('m09-4200000', '4200000', 'number'),
        piece('m09-and', 'AND', 'keyword'),
        piece('m09-comma-b', ',', 'punctuation'),
        piece('m09-ciudad-w', 'ciudad', 'column'),
        piece('m09-gte', '>=', 'operator'),
        piece('m09-salario', 'salario', 'column'),
        piece('m09-empleados', 'empleados', 'table'),
        piece('m09-salario-o', 'salario', 'column'),
        piece('m09-end', ';', 'punctuation'),
      ],
    },
  },
  {
    id: 'M10',
    version: 3,
    order: 10,
    title: 'Final Boss: Query Master',
    description: 'Escribe una consulta completa desde un pedido.',
    difficulty: 'dificil',
    interactionType: 'write-query',
    learningObjective:
      'Escribir y justificar una consulta completa con filtro combinado, cálculo, alias y orden.',
    request:
      'Para los empleados ACTIVOS de Bogotá o de Cali, muestra NOMBRE, CIUDAD y su salario anual si recibieran 100000 más cada mes, con el encabezado PROYECCION_ANUAL, de la proyección más alta a la más baja.',
    lessons: ['L07', 'L08', 'L13', 'L14', 'L16', 'L19'],
    instructions:
      'Escribe la consulta completa: combina las condiciones de WHERE, calcula con paréntesis, usa AS para llamar PROYECCION_ANUAL a la tercera columna y ordena con ORDER BY.',
    maxScore: 100,
    baseDurationSeconds: 180,
    publicData: {
      type: 'write-query',
      requirement:
        'La corrección exige WHERE, AS explícito, una expresión basada en SALARIO y ORDER BY. Se evalúa con la salida real de Oracle.',
      requiresOracle: true,
    },
  },
] satisfies readonly AnyPublicMission[]);

export function findPublicMission(id: MissionId): AnyPublicMission | undefined {
  return PUBLIC_MISSIONS.find((mission) => mission.id === id);
}
