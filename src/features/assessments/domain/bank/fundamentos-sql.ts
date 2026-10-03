import {
  fragments,
  queryOptions,
  REF,
  resultOptions,
  SECTION_1,
  source,
  type OfficialQuestion,
} from './bank-builders';

/**
 * Banco oficial de la Sección 1, Fundamentos SQL (50 preguntas). Todo se apoya en el temario
 * de DB LAB (lecciones L00–L21) y en el dataset EMPLEADOS v2. Los resultados correctos los
 * calcula el motor educativo y las pruebas comprueban cada afirmación con él. Los
 * distractores representan confusiones frecuentes documentadas en las lecciones.
 * Fuentes por grupo en docs/QUESTION_BANK_SPEC.md.
 */

type Question = Omit<OfficialQuestion, 'section'>;

const lesson = (id: string, title: string, slug: string) =>
  `Lección ${id} · ${title} (/learn/${slug})`;

// ---------------------------------------------------------------------------
// Fundamentos
// ---------------------------------------------------------------------------

const fundamentos: Question[] = [
  {
    key: 'S1-FUN-01',
    topic: 'fundamentos',
    subtopic: 'Filas y columnas',
    type: 'concept',
    response: 'single',
    difficulty: 1,
    prompt:
      'La tabla EMPLEADOS tiene 20 filas y 12 columnas. ¿Cuántos valores de SALARIO guarda y por qué?',
    options: [
      {
        body: '12: uno por cada columna de la tabla.',
        feedback: 'Confunde filas con columnas: SALARIO es una sola columna.',
      },
      {
        body: '20: cada fila es un empleado y cada empleado tiene su salario.',
        correct: true,
        feedback: 'Cada fila describe a un empleado; la columna SALARIO tiene un valor por fila.',
      },
      {
        body: '1: SALARIO es una sola columna.',
        feedback: 'Una columna tiene un valor en cada fila, no un único valor.',
      },
      {
        body: '240: filas por columnas.',
        feedback: 'Ese es el total de celdas de la tabla, no los valores de una columna.',
      },
    ],
    explanation:
      'Una fila representa un empleado completo y una columna, un dato de todos ellos. La columna SALARIO tiene un valor por cada una de las 20 filas (puede ser NULL en columnas que lo admiten, no en SALARIO).',
    concept: 'Tabla, fila y columna',
    review: lesson('L00', 'Bases de datos, tablas y SQL', 'introduccion'),
    reference: REF.dataset,
    checks: [{ kind: 'rows', sql: 'SELECT SALARIO FROM EMPLEADOS', rows: 20 }],
  },
  {
    key: 'S1-FUN-02',
    topic: 'fundamentos',
    subtopic: 'Qué hace SELECT',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 2,
    prompt: '¿Cuáles de estas afirmaciones sobre una consulta SELECT en Oracle son correctas?',
    options: [
      {
        body: 'Lee datos y no modifica la tabla.',
        correct: true,
        feedback: 'SELECT consulta; INSERT, UPDATE y DELETE son las que modifican.',
      },
      {
        body: 'Si no se escribe ORDER BY, devuelve las filas ordenadas por ID_EMPLEADO.',
        feedback: 'Sin ORDER BY Oracle no garantiza ningún orden, aunque a veces lo parezca.',
      },
      {
        body: 'Su resultado también es una tabla, con filas y columnas.',
        correct: true,
        feedback:
          'El resultado tiene columnas (las de la lista SELECT) y filas (las que cumplen las condiciones).',
      },
      {
        body: 'Las filas que no aparecen en el resultado se borran de la tabla.',
        feedback: 'WHERE solo elige qué filas mostrar; la tabla queda igual.',
      },
    ],
    explanation:
      'SELECT construye un resultado tabular a partir de la tabla sin cambiarla. El orden de las filas solo está garantizado con ORDER BY.',
    concept: 'Consulta de solo lectura',
    review: lesson('L02', 'SELECT: qué columnas mostrar', 'select'),
    reference: REF.select,
  },
  {
    key: 'S1-FUN-03',
    topic: 'fundamentos',
    subtopic: 'Palabras clave y nombres',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 1,
    prompt: 'En la consulta mostrada, ¿qué afirmaciones son correctas?',
    code: 'SELECT NOMBRE, SALARIO\nFROM EMPLEADOS;',
    options: [
      {
        body: 'SELECT y FROM son palabras clave de SQL.',
        correct: true,
        feedback: 'Son las cláusulas que estructuran la consulta.',
      },
      {
        body: 'NOMBRE y SALARIO son nombres de tablas.',
        feedback: 'Son columnas de la tabla EMPLEADOS.',
      },
      {
        body: 'EMPLEADOS es el nombre de la tabla de la que salen los datos.',
        correct: true,
        feedback: 'FROM indica la tabla de origen.',
      },
      {
        body: 'SALARIO es una palabra reservada de Oracle.',
        feedback: 'Es un nombre elegido para una columna de este esquema.',
      },
    ],
    explanation:
      'Una consulta combina palabras clave del lenguaje (SELECT, FROM) con nombres del esquema: la tabla EMPLEADOS y sus columnas NOMBRE y SALARIO.',
    concept: 'Palabras clave y nombres del esquema',
    review: lesson('L03', 'FROM: de qué tabla salen los datos', 'from'),
    reference: REF.select,
    checks: [{ kind: 'valid', sql: 'SELECT NOMBRE, SALARIO FROM EMPLEADOS' }],
  },
];

// ---------------------------------------------------------------------------
// SELECT y FROM
// ---------------------------------------------------------------------------

const selectFrom: Question[] = [
  {
    key: 'S1-SEL-01',
    topic: 'select-from',
    subtopic: 'Orden de la lista SELECT',
    type: 'predict_result',
    response: 'single',
    difficulty: 1,
    prompt: 'Con estas filas de EMPLEADOS, ¿qué resultado devuelve la consulta?',
    code: 'SELECT CIUDAD, NOMBRE\nFROM EMPLEADOS;',
    exhibit: { tables: [source([1, 2, 3], ['NOMBRE', 'APELLIDO', 'CIUDAD', 'SALARIO'])] },
    options: resultOptions(
      'SELECT CIUDAD, NOMBRE FROM EMPLEADOS',
      [1, 2, 3],
      {
        body: 'CIUDAD y NOMBRE, en ese orden, para las tres filas.',
        feedback: 'Las columnas salen en el orden de la lista SELECT.',
        at: 1,
      },
      [
        {
          body: 'NOMBRE y CIUDAD, en el orden de la tabla.',
          rows: [
            ['Ana', 'Bogotá'],
            ['Carlos', 'Bogotá'],
            ['María', 'Medellín'],
          ],
          feedback: 'El orden de las columnas lo decide SELECT, no la tabla.',
        },
        {
          body: 'Solo las ciudades distintas.',
          rows: [
            ['Bogotá', 'Ana'],
            ['Medellín', 'María'],
          ],
          feedback: 'Sin DISTINCT no se eliminan filas repetidas.',
        },
        {
          body: 'CIUDAD y NOMBRE, solo de la primera fila.',
          rows: [['Bogotá', 'Ana']],
          feedback: 'Sin WHERE se devuelven todas las filas.',
        },
      ],
    ),
    explanation:
      'SELECT elige qué columnas mostrar y en qué orden; FROM indica la tabla. Sin WHERE ni DISTINCT llegan todas las filas.',
    concept: 'Lista de columnas',
    review: lesson('L05', 'Columnas específicas y comas', 'columnas'),
    reference: REF.select,
  },
  {
    key: 'S1-SEL-02',
    topic: 'select-from',
    subtopic: 'Coma olvidada',
    type: 'interpret_query',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve Oracle con esta consulta?',
    code: 'SELECT NOMBRE SALARIO\nFROM EMPLEADOS;',
    options: [
      {
        body: 'Un error de sintaxis porque falta la coma.',
        feedback: 'No es un error: Oracle lo interpreta de otra forma, y por eso es peligroso.',
      },
      { body: 'Dos columnas, NOMBRE y SALARIO.', feedback: 'Sin coma no hay dos columnas.' },
      {
        body: 'Una sola columna con los nombres, titulada SALARIO.',
        correct: true,
        feedback: 'Sin coma, SALARIO se toma como alias de NOMBRE.',
      },
      {
        body: 'Una sola columna con los salarios, titulada NOMBRE.',
        feedback: 'El valor sale de la primera palabra (NOMBRE); la segunda es el título.',
      },
    ],
    explanation:
      'Una columna seguida de otra palabra sin coma se lee como «columna alias». La consulta es válida, pero muestra los nombres con el título SALARIO.',
    concept: 'Alias sin AS',
    review: lesson('L21', 'Errores frecuentes', 'errores-frecuentes'),
    reference: REF.select,
    checks: [
      { kind: 'columns', sql: 'SELECT NOMBRE SALARIO FROM EMPLEADOS', columns: ['SALARIO'] },
    ],
  },
  {
    key: 'S1-SEL-03',
    topic: 'select-from',
    subtopic: 'Coma antes de FROM',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: 'Esta consulta falla. ¿Dónde está el error?',
    code: 'SELECT NOMBRE, CIUDAD,\nFROM EMPLEADOS;',
    options: [
      {
        body: 'En la coma después de CIUDAD: tras ella falta una columna.',
        correct: true,
        feedback: 'La coma separa columnas; después de la última no va ninguna.',
      },
      { body: 'En CIUDAD: esa columna no existe.', feedback: 'CIUDAD sí existe en EMPLEADOS.' },
      {
        body: 'Las columnas deben ir entre paréntesis.',
        feedback: 'La lista SELECT no lleva paréntesis.',
      },
      {
        body: 'FROM debe ir en la misma línea que SELECT.',
        feedback: 'Los saltos de línea no cambian el significado.',
      },
    ],
    explanation:
      'La coma separa elementos de la lista SELECT. Una coma final deja una columna vacía y Oracle responde con un error (falta una expresión).',
    concept: 'Lista de columnas y comas',
    review: lesson('L05', 'Columnas específicas y comas', 'columnas'),
    reference: REF.select,
    checks: [{ kind: 'error', sql: 'SELECT NOMBRE, CIUDAD, FROM EMPLEADOS' }],
  },
  {
    key: 'S1-SEL-04',
    topic: 'select-from',
    subtopic: 'SELECT *',
    type: 'single_choice',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué tamaño tiene el resultado de esta consulta sobre EMPLEADOS?',
    code: 'SELECT *\nFROM EMPLEADOS;',
    options: [
      {
        body: '12 columnas y 20 filas.',
        correct: true,
        feedback: 'El asterisco pide todas las columnas, y sin WHERE llegan todas las filas.',
      },
      {
        body: '1 columna llamada * y 20 filas.',
        feedback: 'El asterisco no es una columna: significa «todas».',
      },
      { body: '12 columnas y 1 fila.', feedback: 'Sin WHERE no se filtran filas.' },
      {
        body: '20 columnas y 12 filas.',
        feedback: 'Confunde filas (empleados) con columnas (datos).',
      },
    ],
    explanation: '`*` en SELECT equivale a escribir las 12 columnas en el orden de la tabla.',
    concept: 'SELECT *',
    review: lesson('L04', 'SELECT *: todas las columnas', 'asterisco'),
    reference: REF.select,
    checks: [{ kind: 'rows', sql: 'SELECT * FROM EMPLEADOS', rows: 20 }],
  },
];

// ---------------------------------------------------------------------------
// Expresiones
// ---------------------------------------------------------------------------

const expresiones: Question[] = [
  {
    key: 'S1-EXP-01',
    topic: 'expresiones',
    subtopic: 'Precedencia aritmética',
    type: 'predict_result',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué valores calcula la columna NUEVO?',
    code: 'SELECT NOMBRE, SALARIO + 100000 * 2 AS NUEVO\nFROM EMPLEADOS;',
    exhibit: { tables: [source([6, 8, 10], ['NOMBRE', 'SALARIO'])] },
    options: resultOptions(
      'SELECT NOMBRE, SALARIO + 100000 * 2 AS NUEVO FROM EMPLEADOS',
      [6, 8, 10],
      {
        body: 'Salario más 200.000.',
        feedback: 'La multiplicación se calcula antes que la suma.',
        at: 2,
      },
      [
        {
          body: 'El doble de (salario + 100.000).',
          rows: [
            ['Andrés', 8600000],
            ['Oscar', 7800000],
            ['Mario', 7200000],
          ],
          feedback: 'Eso sería (SALARIO + 100000) * 2: hacen falta paréntesis.',
        },
        {
          body: 'El doble del salario más 100.000.',
          rows: [
            ['Andrés', 8500000],
            ['Oscar', 7700000],
            ['Mario', 7100000],
          ],
          feedback: 'El 2 multiplica a 100000, no a SALARIO.',
        },
        {
          body: 'Salario más 100.000.',
          rows: [
            ['Andrés', 4300000],
            ['Oscar', 3900000],
            ['Mario', 3600000],
          ],
          feedback: 'La multiplicación por 2 también cuenta.',
        },
      ],
    ),
    explanation:
      'Como en matemáticas, * y / se evalúan antes que + y -. SALARIO + 100000 * 2 es SALARIO + 200000.',
    concept: 'Precedencia de operadores',
    review: lesson('L07', 'Precedencia y paréntesis', 'precedencia'),
    reference: REF.operators,
  },
  {
    key: 'S1-EXP-02',
    topic: 'expresiones',
    subtopic: 'Paréntesis',
    type: 'choose_query',
    response: 'single',
    difficulty: 3,
    prompt:
      'Se necesita el ingreso anual: 12 salarios más una bonificación única de 500.000. ¿Qué consulta lo calcula?',
    ...queryOptions('SELECT SALARIO * 12 + 500000 AS ANUAL FROM EMPLEADOS', [
      {
        sql: 'SELECT (SALARIO + 500000) * 12 AS ANUAL\nFROM EMPLEADOS;',
        feedback: 'Suma la bonificación doce veces.',
      },
      {
        sql: 'SELECT SALARIO * 12 + 500000 AS ANUAL\nFROM EMPLEADOS;',
        correct: true,
        feedback: 'Primero los 12 salarios y después la bonificación única.',
      },
      {
        sql: 'SELECT SALARIO + 500000 * 12 AS ANUAL\nFROM EMPLEADOS;',
        feedback: 'Multiplica la bonificación por 12 y suma un solo salario.',
      },
      {
        sql: 'SELECT SALARIO * (12 + 500000) AS ANUAL\nFROM EMPLEADOS;',
        feedback: 'Multiplica el salario por 500012.',
      },
    ]),
    explanation:
      'SALARIO * 12 + 500000 multiplica primero y luego suma; no necesita paréntesis. Los paréntesis cambian qué se agrupa.',
    concept: 'Precedencia y paréntesis',
    review: lesson('L07', 'Precedencia y paréntesis', 'precedencia'),
    reference: REF.operators,
  },
  {
    key: 'S1-EXP-03',
    topic: 'expresiones',
    subtopic: 'División por cero',
    type: 'concept',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué ocurre en Oracle al ejecutar esta consulta?',
    code: 'SELECT NOMBRE, SALARIO / 0\nFROM EMPLEADOS;',
    options: [
      {
        body: 'Devuelve NULL en la segunda columna.',
        feedback: 'Oracle no convierte la división por cero en NULL.',
      },
      { body: 'Devuelve 0 en la segunda columna.', feedback: 'Dividir entre cero no da cero.' },
      {
        body: 'Falla: el divisor es cero.',
        correct: true,
        feedback: 'Oracle detiene la consulta con un error de división por cero.',
      },
      { body: 'Devuelve el mismo salario.', feedback: 'Eso sería dividir entre 1.' },
    ],
    explanation:
      'Una división entre cero en una expresión hace fallar la consulta completa en Oracle; no se devuelve ningún resultado parcial.',
    concept: 'Expresiones aritméticas',
    review: lesson('L06', 'Expresiones aritméticas', 'expresiones'),
    reference: REF.operators,
    checks: [{ kind: 'error', sql: 'SELECT NOMBRE, SALARIO / 0 FROM EMPLEADOS' }],
  },
];

// ---------------------------------------------------------------------------
// Alias y concatenación
// ---------------------------------------------------------------------------

const aliasConcat: Question[] = [
  {
    key: 'S1-ALI-01',
    topic: 'alias-concatenacion',
    subtopic: 'Concatenación',
    type: 'predict_result',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué devuelve la consulta con estas filas?',
    code: "SELECT NOMBRE || ' ' || APELLIDO AS EMPLEADO\nFROM EMPLEADOS;",
    exhibit: { tables: [source([1, 4], ['NOMBRE', 'APELLIDO'])] },
    options: resultOptions(
      "SELECT NOMBRE || ' ' || APELLIDO AS EMPLEADO FROM EMPLEADOS",
      [1, 4],
      {
        body: 'Nombre y apellido unidos por un espacio.',
        feedback: "|| une textos; ' ' es el espacio entre ellos.",
        at: 0,
      },
      [
        {
          body: 'Nombre y apellido sin espacio.',
          rows: [['AnaRojas'], ['JorgeDíaz']],
          feedback: "El texto fijo ' ' añade el espacio.",
        },
        {
          body: 'El texto de la expresión.',
          rows: [["NOMBRE || ' ' || APELLIDO"], ["NOMBRE || ' ' || APELLIDO"]],
          feedback: 'Las columnas sin comillas se reemplazan por sus valores.',
        },
        {
          body: 'Solo los nombres.',
          rows: [['Ana'], ['Jorge']],
          feedback: '|| une todos los textos de la expresión.',
        },
      ],
    ),
    explanation:
      "El operador || concatena: NOMBRE, el texto fijo ' ' y APELLIDO forman un solo valor. AS EMPLEADO le da título a la columna.",
    concept: 'Concatenación con ||',
    review: lesson('L09', 'Textos fijos y concatenación con ||', 'concatenacion'),
    reference: REF.operators,
  },
  {
    key: 'S1-ALI-02',
    topic: 'alias-concatenacion',
    subtopic: 'Alias con espacios',
    type: 'find_error',
    response: 'single',
    difficulty: 3,
    prompt: 'La consulta falla. ¿Cómo se corrige?',
    code: 'SELECT SALARIO * 12 AS SALARIO ANUAL\nFROM EMPLEADOS;',
    options: [
      {
        body: "Escribiendo el alias entre comillas simples: 'SALARIO ANUAL'.",
        feedback: 'Las comillas simples son textos fijos; un alias así también falla.',
      },
      {
        body: 'Escribiendo el alias entre comillas dobles: "SALARIO ANUAL".',
        correct: true,
        feedback:
          'Un alias con espacios (o minúsculas que se quieran conservar) va entre comillas dobles.',
      },
      {
        body: 'Quitando AS: no se puede usar con expresiones.',
        feedback: 'AS funciona con columnas y expresiones; el problema es el espacio.',
      },
      {
        body: 'Poniendo SALARIO * 12 entre paréntesis.',
        feedback: 'La expresión es correcta; el problema está en el alias.',
      },
    ],
    explanation:
      'Sin comillas, un alias es una sola palabra. Con el espacio, Oracle no sabe qué hacer con ANUAL. Las comillas dobles permiten espacios en el alias.',
    concept: 'Alias de columna',
    review: lesson('L08', 'Alias de columna con AS', 'alias'),
    reference: REF.select,
    checks: [
      { kind: 'error', sql: 'SELECT SALARIO * 12 AS SALARIO ANUAL FROM EMPLEADOS' },
      { kind: 'valid', sql: 'SELECT SALARIO * 12 AS "SALARIO ANUAL" FROM EMPLEADOS' },
      { kind: 'error', sql: "SELECT SALARIO * 12 AS 'SALARIO ANUAL' FROM EMPLEADOS" },
    ],
  },
  {
    key: 'S1-ALI-03',
    topic: 'alias-concatenacion',
    subtopic: 'Concatenar con NULL',
    type: 'predict_result',
    response: 'single',
    difficulty: 4,
    prompt: 'Jorge no tiene bono (NULL). ¿Qué devuelve la consulta en Oracle?',
    code: "SELECT NOMBRE || ' - ' || BONO AS DETALLE\nFROM EMPLEADOS;",
    exhibit: { tables: [source([4, 6], ['NOMBRE', 'BONO'])] },
    options: resultOptions(
      "SELECT NOMBRE || ' - ' || BONO AS DETALLE FROM EMPLEADOS",
      [4, 6],
      {
        body: "Jorge conserva su texto: 'Jorge - '.",
        feedback: 'En Oracle, concatenar NULL equivale a concatenar un texto vacío.',
        at: 3,
      },
      [
        {
          body: 'La fila de Jorge queda en NULL.',
          rows: [[null], ['Andrés - 300000']],
          feedback: 'Así se comporta la suma con NULL, no la concatenación en Oracle.',
        },
        {
          body: 'Jorge aparece con un 0.',
          rows: [['Jorge - 0'], ['Andrés - 300000']],
          feedback: 'NULL no es 0: Oracle no inventa un valor.',
        },
        {
          body: 'Jorge no aparece.',
          rows: [['Andrés - 300000']],
          feedback: 'Una expresión no elimina filas; solo WHERE filtra.',
        },
      ],
    ),
    explanation:
      "Oracle trata NULL como un texto vacío al usar ||, así que 'Jorge - ' || NULL es 'Jorge - '. En cambio, cualquier operación aritmética con NULL da NULL.",
    concept: 'NULL en la concatenación (Oracle)',
    review: lesson('L09', 'Textos fijos y concatenación con ||', 'concatenacion'),
    reference: REF.operators,
    tags: ['null', 'oracle'],
  },
  {
    key: 'S1-ALI-04',
    topic: 'alias-concatenacion',
    subtopic: 'Formas de alias',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 2,
    prompt: '¿Cuáles de estos alias son válidos en Oracle para la expresión SALARIO * 12?',
    options: [
      {
        body: 'SELECT SALARIO * 12 AS ANUAL FROM EMPLEADOS;',
        kind: 'code',
        correct: true,
        feedback: 'La forma recomendada.',
      },
      {
        body: 'SELECT SALARIO * 12 ANUAL FROM EMPLEADOS;',
        kind: 'code',
        correct: true,
        feedback: 'AS es opcional en los alias de columna.',
      },
      {
        body: 'SELECT SALARIO * 12 AS "Salario anual" FROM EMPLEADOS;',
        kind: 'code',
        correct: true,
        feedback: 'Con comillas dobles se admiten espacios y minúsculas.',
      },
      {
        body: "SELECT SALARIO * 12 AS 'Salario anual' FROM EMPLEADOS;",
        kind: 'code',
        feedback: 'Las comillas simples son para textos fijos, no para alias.',
      },
    ],
    explanation:
      'Un alias puede escribirse con o sin AS. Si tiene espacios, va entre comillas dobles. Las comillas simples delimitan valores de texto.',
    concept: 'Alias de columna',
    review: lesson('L08', 'Alias de columna con AS', 'alias'),
    reference: REF.select,
    checks: [
      { kind: 'valid', sql: 'SELECT SALARIO * 12 AS ANUAL FROM EMPLEADOS' },
      { kind: 'valid', sql: 'SELECT SALARIO * 12 ANUAL FROM EMPLEADOS' },
      { kind: 'valid', sql: 'SELECT SALARIO * 12 AS "Salario anual" FROM EMPLEADOS' },
      { kind: 'error', sql: "SELECT SALARIO * 12 AS 'Salario anual' FROM EMPLEADOS" },
    ],
  },
];

// ---------------------------------------------------------------------------
// DISTINCT
// ---------------------------------------------------------------------------

const distinct: Question[] = [
  {
    key: 'S1-DIS-01',
    topic: 'distinct',
    subtopic: 'DISTINCT con varias columnas',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta con estas cuatro filas?',
    code: 'SELECT DISTINCT CARGO, CIUDAD\nFROM EMPLEADOS\nORDER BY CIUDAD;',
    exhibit: { tables: [source([6, 7, 8, 13], ['NOMBRE', 'CARGO', 'CIUDAD'])] },
    options: resultOptions(
      'SELECT DISTINCT CARGO, CIUDAD FROM EMPLEADOS ORDER BY CIUDAD',
      [6, 7, 8, 13],
      {
        body: 'Tres combinaciones distintas de cargo y ciudad.',
        feedback: 'Oscar y Camila son la misma combinación (Analista, Cali): queda una.',
        at: 1,
      },
      [
        {
          body: 'Una sola fila: Analista.',
          rows: [['Analista', 'Bogotá']],
          feedback:
            'DISTINCT compara la fila completa (CARGO y CIUDAD), no solo la primera columna.',
        },
        {
          body: 'Las cuatro filas.',
          rows: [
            ['Analista', 'Bogotá'],
            ['Analista', 'Cali'],
            ['Analista', 'Cali'],
            ['Analista', 'Medellín'],
          ],
          feedback: 'DISTINCT elimina la fila repetida (Analista, Cali).',
        },
        {
          body: 'Solo las combinaciones que no se repiten.',
          rows: [
            ['Analista', 'Bogotá'],
            ['Analista', 'Medellín'],
          ],
          feedback: 'DISTINCT conserva una copia de cada fila repetida; no elimina las dos.',
        },
      ],
    ),
    explanation:
      'DISTINCT elimina filas repetidas del resultado considerando todas las columnas de la lista SELECT juntas.',
    concept: 'DISTINCT',
    review: lesson('L10', 'DISTINCT: sin filas repetidas', 'distinct'),
    reference: REF.select,
  },
  {
    key: 'S1-DIS-02',
    topic: 'distinct',
    subtopic: 'Combinaciones',
    type: 'interpret_query',
    response: 'single',
    difficulty: 3,
    prompt:
      'EMPLEADOS tiene 5 departamentos y 2 estados (ACTIVO, INACTIVO). ¿Cuántas filas devuelve la consulta?',
    code: 'SELECT DISTINCT DEPARTAMENTO, ESTADO\nFROM EMPLEADOS;',
    options: [
      {
        body: '5: uno por departamento.',
        feedback: 'DISTINCT considera DEPARTAMENTO y ESTADO juntos.',
      },
      {
        body: '10: todas las combinaciones posibles.',
        feedback: 'Solo aparecen las combinaciones que existen en los datos.',
      },
      {
        body: '8: las combinaciones que existen en la tabla.',
        correct: true,
        feedback:
          'TI, Finanzas y Operaciones tienen activos e inactivos; Ventas y Recursos Humanos, solo activos.',
      },
      { body: '20: una por empleado.', feedback: 'DISTINCT elimina las repetidas.' },
    ],
    explanation:
      'DISTINCT no genera combinaciones: elimina las repetidas de las que existen. Tres departamentos tienen los dos estados y dos solo tienen ACTIVO: 3 × 2 + 2 = 8.',
    concept: 'DISTINCT con varias columnas',
    review: lesson('L10', 'DISTINCT: sin filas repetidas', 'distinct'),
    reference: REF.dataset,
    checks: [{ kind: 'rows', sql: 'SELECT DISTINCT DEPARTAMENTO, ESTADO FROM EMPLEADOS', rows: 8 }],
  },
  {
    key: 'S1-DIS-03',
    topic: 'distinct',
    subtopic: 'DISTINCT y NULL',
    type: 'concept',
    response: 'single',
    difficulty: 4,
    prompt:
      'Jorge, Paula y Ricardo no tienen bono (NULL) y Mario tiene 0. ¿Cuántas filas devuelve la consulta?',
    code: 'SELECT DISTINCT BONO\nFROM EMPLEADOS\nWHERE ID_EMPLEADO IN (4, 7, 10, 12);',
    options: [
      {
        body: '1: el 0, porque DISTINCT descarta los NULL.',
        feedback: 'DISTINCT no descarta NULL: los muestra una vez.',
      },
      {
        body: '2: NULL y 0.',
        correct: true,
        feedback: 'Para DISTINCT, los NULL se consideran repetidos entre sí.',
      },
      {
        body: '4: un NULL nunca es igual a otro NULL.',
        feedback: 'Eso vale para las comparaciones con =, no para DISTINCT.',
      },
      {
        body: '3: los tres NULL cuentan como uno y el 0 como otro, más el total.',
        feedback: 'No hay ninguna fila de total.',
      },
    ],
    explanation:
      'Aunque NULL = NULL no es verdadero en WHERE, DISTINCT agrupa todos los NULL como un solo valor. Resultado: NULL y 0.',
    concept: 'DISTINCT y NULL',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
    tags: ['null'],
    checks: [
      {
        kind: 'rows',
        sql: 'SELECT DISTINCT BONO FROM EMPLEADOS WHERE ID_EMPLEADO IN (4, 7, 10, 12)',
        rows: 2,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// WHERE y comparaciones
// ---------------------------------------------------------------------------

const where: Question[] = [
  {
    key: 'S1-WHE-01',
    topic: 'where',
    subtopic: 'Mayor o igual',
    type: 'predict_result',
    response: 'single',
    difficulty: 1,
    prompt: '¿Qué filas devuelve la consulta?',
    code: 'SELECT NOMBRE, SALARIO\nFROM EMPLEADOS\nWHERE SALARIO >= 5200000;',
    exhibit: { tables: [source([2, 5, 6, 10, 14], ['NOMBRE', 'SALARIO'])] },
    options: resultOptions(
      'SELECT NOMBRE, SALARIO FROM EMPLEADOS WHERE SALARIO >= 5200000',
      [2, 5, 6, 10, 14],
      {
        body: 'Carlos, Laura y Diego.',
        feedback: '>= incluye el valor exacto: Diego gana 5.200.000.',
        at: 2,
      },
      [
        {
          body: 'Carlos y Laura.',
          rows: [
            ['Carlos', 7500000],
            ['Laura', 5800000],
          ],
          feedback: 'Eso sería > 5200000; >= también incluye el valor exacto.',
        },
        {
          body: 'Andrés y Mario.',
          rows: [
            ['Andrés', 4200000],
            ['Mario', 3500000],
          ],
          feedback: 'Son los que NO cumplen la condición.',
        },
        {
          body: 'Las cinco filas.',
          rows: [
            ['Carlos', 7500000],
            ['Laura', 5800000],
            ['Andrés', 4200000],
            ['Mario', 3500000],
            ['Diego', 5200000],
          ],
          feedback: 'WHERE descarta las filas que no cumplen.',
        },
      ],
    ),
    explanation: 'WHERE conserva solo las filas cuya condición es verdadera. >= incluye el límite.',
    concept: 'Operadores de comparación',
    review: lesson('L12', 'Operadores de comparación', 'comparaciones'),
    reference: REF.conditions,
  },
  {
    key: 'S1-WHE-02',
    topic: 'where',
    subtopic: 'Textos entre comillas',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: 'La consulta falla. ¿Por qué?',
    code: 'SELECT NOMBRE\nFROM EMPLEADOS\nWHERE CIUDAD = Bogotá;',
    options: [
      {
        body: 'Debe usarse == para comparar.',
        feedback: 'En SQL la igualdad se escribe con un solo =.',
      },
      {
        body: 'Falta escribir el texto entre comillas simples: Oracle busca una columna llamada Bogotá.',
        correct: true,
        feedback: "Los valores de texto van entre comillas simples: 'Bogotá'.",
      },
      { body: 'WHERE debe ir antes de FROM.', feedback: 'El orden es SELECT, FROM, WHERE.' },
      {
        body: 'Los valores de texto deben escribirse en mayúsculas.',
        feedback: 'El valor debe coincidir con el dato guardado, entre comillas.',
      },
    ],
    explanation:
      "Sin comillas, Bogotá se interpreta como un identificador (una columna) que no existe. Los textos fijos se escriben entre comillas simples: CIUDAD = 'Bogotá'.",
    concept: 'Literales de texto',
    review: lesson('L11', 'WHERE: filtrar filas', 'where'),
    reference: REF.conditions,
    checks: [
      { kind: 'error', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD = Bogotá' },
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD = 'Bogotá'", rows: 7 },
    ],
  },
  {
    key: 'S1-WHE-03',
    topic: 'where',
    subtopic: 'Mayúsculas y tildes',
    type: 'interpret_query',
    response: 'single',
    difficulty: 2,
    prompt: 'En EMPLEADOS hay 7 personas de «Bogotá». ¿Qué devuelve esta consulta?',
    code: "SELECT NOMBRE\nFROM EMPLEADOS\nWHERE CIUDAD = 'bogotá';",
    options: [
      {
        body: 'Las 7 personas de Bogotá.',
        feedback: 'Oracle compara los textos exactamente, letra por letra.',
      },
      {
        body: 'Ninguna fila: el dato guardado es «Bogotá» con mayúscula inicial.',
        correct: true,
        feedback: "'bogotá' y 'Bogotá' son textos distintos para Oracle.",
      },
      {
        body: 'Un error: los textos deben ir en mayúsculas.',
        feedback: 'No es un error; simplemente no coincide.',
      },
      {
        body: 'Las 13 personas que no son de Bogotá.',
        feedback: 'Una condición falsa no invierte el resultado.',
      },
    ],
    explanation:
      'Las comparaciones de texto en Oracle distinguen mayúsculas, minúsculas y tildes. La consulta es válida y no encuentra coincidencias.',
    concept: 'Comparación exacta de textos',
    review: lesson('L12', 'Operadores de comparación', 'comparaciones'),
    reference: REF.conditions,
    checks: [
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD = 'bogotá'", rows: 0 },
    ],
  },
  {
    key: 'S1-WHE-04',
    topic: 'where',
    subtopic: 'Distinto de',
    type: 'choose_query',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué consulta devuelve a los empleados que NO son del departamento Ventas?',
    ...queryOptions("SELECT NOMBRE FROM EMPLEADOS WHERE DEPARTAMENTO <> 'Ventas'", [
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE DEPARTAMENTO != 'ventas';",
        feedback: "'ventas' en minúsculas no coincide con ningún dato: devuelve a todos.",
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE NOT DEPARTAMENTO = Ventas;',
        feedback: 'Sin comillas, Ventas se busca como columna: error.',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE DEPARTAMENTO <> 'Ventas';",
        correct: true,
        feedback: '<> (o !=) significa «distinto de».',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE DEPARTAMENTO = 'Ventas';",
        feedback: 'Devuelve justo los de Ventas.',
      },
    ]),
    explanation:
      "<> y != expresan «distinto de». El valor debe escribirse igual que en los datos: 'Ventas'.",
    concept: 'Operadores de comparación',
    review: lesson('L12', 'Operadores de comparación', 'comparaciones'),
    reference: REF.conditions,
  },
  {
    key: 'S1-WHE-05',
    topic: 'where',
    subtopic: 'Límite incluido',
    type: 'compare_results',
    response: 'single',
    difficulty: 3,
    prompt: 'Compara las dos consultas. ¿Qué es cierto?',
    exhibit: {
      queries: [
        { label: 'A', sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE SALARIO > 4200000;' },
        { label: 'B', sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE SALARIO >= 4200000;' },
      ],
    },
    options: [
      {
        body: 'Devuelven las mismas filas.',
        feedback: 'Hay empleados que ganan exactamente 4.200.000.',
      },
      {
        body: 'B devuelve 2 filas más: Andrés y Paula, que ganan exactamente 4.200.000.',
        correct: true,
        feedback: '>= incluye el límite; > no.',
      },
      { body: 'B devuelve 1 fila más.', feedback: 'Andrés y Paula ganan 4.200.000: son dos.' },
      { body: 'A devuelve más filas que B.', feedback: '>= nunca devuelve menos que >.' },
    ],
    explanation:
      'La única diferencia entre > y >= son las filas iguales al límite. Andrés y Paula ganan exactamente 4.200.000.',
    concept: 'Límites en comparaciones',
    review: lesson('L12', 'Operadores de comparación', 'comparaciones'),
    reference: REF.conditions,
    checks: [
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE SALARIO > 4200000', rows: 9 },
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE SALARIO >= 4200000', rows: 11 },
    ],
  },
];

// ---------------------------------------------------------------------------
// AND, OR y NOT
// ---------------------------------------------------------------------------

const logicos: Question[] = [
  {
    key: 'S1-LOG-01',
    topic: 'logicos',
    subtopic: 'AND antes que OR',
    type: 'interpret_query',
    response: 'single',
    difficulty: 3,
    prompt:
      '¿Cuántas filas devuelve? (7 empleados son de Bogotá; en Medellín, 2 ganan más de 5.000.000).',
    code: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = 'Bogotá' OR CIUDAD = 'Medellín'\n  AND SALARIO > 5000000;",
    options: [
      {
        body: '9: todos los de Bogotá más los de Medellín que ganan más de 5.000.000.',
        correct: true,
        feedback: 'AND se evalúa antes que OR.',
      },
      {
        body: '6: los de Bogotá o Medellín que ganan más de 5.000.000.',
        feedback: 'Eso pasaría con paréntesis alrededor del OR.',
      },
      {
        body: '13: todos los de Bogotá y Medellín.',
        feedback: 'La condición de salario sí afecta a los de Medellín.',
      },
      {
        body: '2: solo los de Medellín que ganan más de 5.000.000.',
        feedback: 'El OR deja pasar a todos los de Bogotá.',
      },
    ],
    explanation:
      "Sin paréntesis, la condición se lee CIUDAD = 'Bogotá' OR (CIUDAD = 'Medellín' AND SALARIO > 5000000).",
    concept: 'Precedencia lógica',
    review: lesson('L14', 'Precedencia lógica y paréntesis', 'parentesis'),
    reference: REF.conditions,
    checks: [
      {
        kind: 'rows',
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD = 'Bogotá' OR CIUDAD = 'Medellín' AND SALARIO > 5000000",
        rows: 9,
      },
      {
        kind: 'rows',
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE (CIUDAD = 'Bogotá' OR CIUDAD = 'Medellín') AND SALARIO > 5000000",
        rows: 6,
      },
    ],
  },
  {
    key: 'S1-LOG-02',
    topic: 'logicos',
    subtopic: 'Paréntesis',
    type: 'choose_query',
    response: 'single',
    difficulty: 3,
    prompt:
      'Se piden los empleados de Bogotá o Medellín que ganan más de 5.000.000. ¿Qué consulta es correcta?',
    ...queryOptions(
      "SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD IN ('Bogotá', 'Medellín') AND SALARIO > 5000000",
      [
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = 'Bogotá' OR CIUDAD = 'Medellín'\n  AND SALARIO > 5000000;",
          feedback: 'Sin paréntesis el salario solo se exige a los de Medellín.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE (CIUDAD = 'Bogotá' OR CIUDAD = 'Medellín')\n  AND SALARIO > 5000000;",
          correct: true,
          feedback: 'Los paréntesis agrupan las dos ciudades antes del AND.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = 'Bogotá' AND CIUDAD = 'Medellín'\n  AND SALARIO > 5000000;",
          feedback: 'Nadie vive en dos ciudades a la vez: no devuelve filas.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = ('Bogotá' OR 'Medellín')\n  AND SALARIO > 5000000;",
          feedback: 'OR une condiciones completas, no valores: error.',
        },
      ],
    ),
    explanation:
      'Cuando se combinan OR y AND, los paréntesis fijan qué se evalúa junto. Aquí la condición de salario debe aplicarse a las dos ciudades.',
    concept: 'Paréntesis en condiciones',
    review: lesson('L14', 'Precedencia lógica y paréntesis', 'parentesis'),
    reference: REF.conditions,
  },
  {
    key: 'S1-LOG-03',
    topic: 'logicos',
    subtopic: 'NOT y distinto',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 3,
    prompt: '¿Qué condiciones devuelven exactamente a los empleados INACTIVO?',
    ...queryOptions("SELECT NOMBRE FROM EMPLEADOS WHERE ESTADO = 'INACTIVO'", [
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE ESTADO = 'INACTIVO';",
        correct: true,
        feedback: 'La forma directa.',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOT ESTADO = 'ACTIVO';",
        correct: true,
        feedback: 'ESTADO solo tiene dos valores y nunca es NULL.',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE ESTADO <> 'ACTIVO';",
        correct: true,
        feedback: 'Equivale a NOT ESTADO = ACTIVO.',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS WHERE ESTADO = 'inactivo';",
        feedback: 'Los datos están en mayúsculas: no coincide ninguno.',
      },
    ]),
    explanation:
      'Como ESTADO solo vale ACTIVO o INACTIVO y no admite NULL, negar ACTIVO equivale a pedir INACTIVO. Con columnas que admiten NULL no siempre es así.',
    concept: 'NOT y operadores de comparación',
    review: lesson('L13', 'AND y OR: combinar condiciones', 'and-or'),
    reference: REF.conditions,
  },
  {
    key: 'S1-LOG-04',
    topic: 'logicos',
    subtopic: 'NOT con NULL',
    type: 'interpret_query',
    response: 'single',
    difficulty: 4,
    prompt:
      '14 empleados tienen bono (7 de ellos de más de 300.000) y 6 no tienen bono (NULL). ¿Cuántas filas devuelve?',
    code: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE NOT BONO > 300000;',
    options: [
      {
        body: '13: los 7 con bono de hasta 300.000 y los 6 sin bono.',
        feedback:
          'Para los NULL, BONO > 300000 es desconocido, y NOT desconocido sigue siendo desconocido.',
      },
      {
        body: '7: solo los que tienen bono de hasta 300.000.',
        correct: true,
        feedback: 'NOT no recupera las filas con NULL.',
      },
      {
        body: '6: los que no tienen bono.',
        feedback: 'Esos son justamente los que la condición no puede evaluar.',
      },
      { body: '20: NOT anula la condición.', feedback: 'NOT invierte el resultado, no lo anula.' },
    ],
    explanation:
      'Con NULL, una comparación no es verdadera ni falsa: es desconocida. NOT de desconocido sigue siendo desconocido, y WHERE solo deja pasar lo verdadero.',
    concept: 'Lógica de tres valores',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
    tags: ['null'],
    checks: [
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE NOT BONO > 300000', rows: 7 },
    ],
  },
];

// ---------------------------------------------------------------------------
// BETWEEN, IN y LIKE
// ---------------------------------------------------------------------------

const betweenInLike: Question[] = [
  {
    key: 'S1-BIL-01',
    topic: 'between-in-like',
    subtopic: 'BETWEEN incluye los extremos',
    type: 'predict_result',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué filas devuelve la consulta?',
    code: 'SELECT NOMBRE, SALARIO\nFROM EMPLEADOS\nWHERE SALARIO BETWEEN 3000000 AND 3500000;',
    exhibit: { tables: [source([9, 10, 11, 12, 13], ['NOMBRE', 'SALARIO'])] },
    options: resultOptions(
      'SELECT NOMBRE, SALARIO FROM EMPLEADOS WHERE SALARIO BETWEEN 3000000 AND 3500000',
      [9, 10, 11, 12, 13],
      {
        body: 'Sofía, Mario y Ricardo.',
        feedback: 'BETWEEN incluye 3.000.000 y 3.500.000.',
        at: 0,
      },
      [
        {
          body: 'Ninguna: los extremos no cuentan.',
          rows: [],
          feedback: 'BETWEEN a AND b incluye a y b.',
        },
        {
          body: 'Sofía, Mario, Ricardo y Valentina.',
          rows: [
            ['Sofía', 3000000],
            ['Mario', 3500000],
            ['Valentina', 2900000],
            ['Ricardo', 3500000],
          ],
          feedback: 'Valentina gana 2.900.000, menos que el mínimo.',
        },
        {
          body: 'Solo Mario y Ricardo.',
          rows: [
            ['Mario', 3500000],
            ['Ricardo', 3500000],
          ],
          feedback: 'El extremo inferior también está incluido: Sofía gana 3.000.000.',
        },
      ],
    ),
    explanation:
      'SALARIO BETWEEN 3000000 AND 3500000 equivale a SALARIO >= 3000000 AND SALARIO <= 3500000.',
    concept: 'BETWEEN',
    review: lesson('L15', 'BETWEEN: rangos', 'between'),
    reference: REF.conditions,
  },
  {
    key: 'S1-BIL-02',
    topic: 'between-in-like',
    subtopic: 'BETWEEN invertido',
    type: 'single_choice',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta?',
    code: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE SALARIO BETWEEN 6000000 AND 3000000;',
    options: [
      {
        body: 'Lo mismo que BETWEEN 3000000 AND 6000000.',
        feedback: 'Oracle no reordena los límites.',
      },
      {
        body: 'Ninguna fila: ningún salario es ≥ 6.000.000 y ≤ 3.000.000 a la vez.',
        correct: true,
        feedback: 'BETWEEN a AND b exige primero el menor.',
      },
      {
        body: 'Un error de sintaxis.',
        feedback: 'La consulta es válida; solo que la condición nunca se cumple.',
      },
      { body: 'Los salarios fuera del rango.', feedback: 'Eso sería NOT BETWEEN.' },
    ],
    explanation:
      'BETWEEN a AND b se traduce en ≥ a AND ≤ b. Si a es mayor que b, ninguna fila puede cumplir las dos condiciones.',
    concept: 'BETWEEN',
    review: lesson('L15', 'BETWEEN: rangos', 'between'),
    reference: REF.conditions,
    checks: [
      {
        kind: 'rows',
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE SALARIO BETWEEN 6000000 AND 3000000',
        rows: 0,
      },
    ],
  },
  {
    key: 'S1-BIL-03',
    topic: 'between-in-like',
    subtopic: 'NOT IN y NULL',
    type: 'interpret_query',
    response: 'single',
    difficulty: 4,
    prompt:
      'Ana y Esteban no tienen jefe (ID_JEFE NULL); 9 empleados tienen como jefe a 1 o a 2. ¿Cuántas filas devuelve?',
    code: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE ID_JEFE NOT IN (1, 2);',
    options: [
      {
        body: '11: todos los que no tienen jefe 1 o 2, incluidos Ana y Esteban.',
        feedback: 'Para un NULL, la condición es desconocida y la fila no pasa.',
      },
      {
        body: '9: los 20 menos los 9 de los jefes 1 y 2, menos los 2 sin jefe.',
        correct: true,
        feedback: 'NOT IN no devuelve las filas con NULL en la columna.',
      },
      {
        body: '18: los 20 menos Ana y Esteban.',
        feedback: 'NOT IN también excluye a quienes tienen jefe 1 o 2.',
      },
      {
        body: '2: solo Ana y Esteban.',
        feedback: 'Precisamente ellos quedan fuera por tener NULL.',
      },
    ],
    explanation:
      'NOT IN (1, 2) es ID_JEFE <> 1 AND ID_JEFE <> 2. Con NULL ambas comparaciones son desconocidas, así que esas filas no aparecen.',
    concept: 'IN y NOT IN',
    review: lesson('L16', 'IN: listas de valores', 'in'),
    reference: REF.conditions,
    tags: ['null'],
    checks: [
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE ID_JEFE NOT IN (1, 2)', rows: 9 },
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE ID_JEFE IN (1, 2)', rows: 9 },
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE ID_JEFE IS NULL', rows: 2 },
    ],
  },
  {
    key: 'S1-BIL-04',
    topic: 'between-in-like',
    subtopic: 'Comodín _',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué nombres devuelve la consulta con estas filas?',
    code: "SELECT NOMBRE\nFROM EMPLEADOS\nWHERE NOMBRE LIKE '_a%';",
    exhibit: { tables: [source([1, 3, 10, 15, 17], ['NOMBRE'])] },
    options: resultOptions(
      "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE LIKE '_a%'",
      [1, 3, 10, 15, 17],
      {
        body: 'Los que tienen una «a» como segunda letra.',
        feedback: '_ ocupa exactamente un carácter y % cualquier cantidad.',
        at: 3,
      },
      [
        {
          body: 'Solo Ana, que empieza por «A».',
          rows: [['Ana']],
          feedback: "Eso sería LIKE 'A%'.",
        },
        {
          body: 'Todos: todos contienen una «a».',
          rows: [['Ana'], ['María'], ['Mario'], ['Daniela'], ['Carolina']],
          feedback: "Eso sería LIKE '%a%'.",
        },
        {
          body: 'Los que terminan en «a».',
          rows: [['Ana'], ['María'], ['Daniela'], ['Carolina']],
          feedback: "Eso sería LIKE '%a'.",
        },
      ],
    ),
    explanation:
      "En LIKE, _ representa un solo carácter cualquiera y % cualquier secuencia (también vacía). '_a%' pide una «a» minúscula en la segunda posición.",
    concept: 'LIKE con _ y %',
    review: lesson('L17', 'LIKE: patrones de texto', 'like'),
    reference: REF.conditions,
  },
  {
    key: 'S1-BIL-05',
    topic: 'between-in-like',
    subtopic: 'Patrones y tildes',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 3,
    prompt: '¿Qué condiciones encuentran a Andrés?',
    options: [
      {
        body: "WHERE NOMBRE LIKE 'And%'",
        kind: 'code',
        correct: true,
        feedback: 'Empieza por «And».',
      },
      {
        body: "WHERE NOMBRE = 'Andres'",
        kind: 'code',
        feedback: 'Sin tilde no coincide: Oracle compara exactamente.',
      },
      {
        body: "WHERE NOMBRE LIKE '%rés'",
        kind: 'code',
        correct: true,
        feedback: 'Termina en «rés», con tilde.',
      },
      {
        body: "WHERE NOMBRE LIKE 'and%'",
        kind: 'code',
        feedback: 'LIKE también distingue mayúsculas.',
      },
    ],
    explanation: 'LIKE compara el patrón con el texto exacto: mayúsculas y tildes cuentan.',
    concept: 'LIKE',
    review: lesson('L17', 'LIKE: patrones de texto', 'like'),
    reference: REF.conditions,
    checks: [
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE LIKE 'And%'", rows: 1 },
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE = 'Andres'", rows: 0 },
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE LIKE '%rés'", rows: 1 },
      { kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE LIKE 'and%'", rows: 0 },
    ],
  },
  {
    key: 'S1-BIL-06',
    topic: 'between-in-like',
    subtopic: 'IN frente a OR',
    type: 'choose_query',
    response: 'single',
    difficulty: 2,
    prompt: '¿Qué consulta devuelve a los empleados de Cali, Medellín o Barranquilla?',
    ...queryOptions(
      "SELECT NOMBRE FROM EMPLEADOS WHERE CIUDAD = 'Cali' OR CIUDAD = 'Medellín' OR CIUDAD = 'Barranquilla'",
      [
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = 'Cali' AND CIUDAD = 'Medellín'\n  AND CIUDAD = 'Barranquilla';",
          feedback: 'Una fila no puede tener tres ciudades: no devuelve nada.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD IN ('Cali', 'Medellín', 'Barranquilla');",
          correct: true,
          feedback: 'IN compara con cada valor de la lista.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD IN ('Cali' AND 'Medellín' AND 'Barranquilla');",
          feedback: 'La lista de IN se separa con comas: error.',
        },
        {
          sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE CIUDAD = 'Cali' OR 'Medellín' OR 'Barranquilla';",
          feedback: 'Cada lado de OR debe ser una condición completa: error.',
        },
      ],
    ),
    explanation:
      "CIUDAD IN ('Cali', 'Medellín', 'Barranquilla') es la forma corta de tres comparaciones unidas con OR.",
    concept: 'IN',
    review: lesson('L16', 'IN: listas de valores', 'in'),
    reference: REF.conditions,
  },
];

// ---------------------------------------------------------------------------
// NULL
// ---------------------------------------------------------------------------

const nulls: Question[] = [
  {
    key: 'S1-NUL-01',
    topic: 'null',
    subtopic: 'NULL en la aritmética',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: 'Jorge no tiene bono (NULL) y Mario tiene 0. ¿Qué devuelve la consulta?',
    code: 'SELECT NOMBRE, SALARIO + BONO AS TOTAL\nFROM EMPLEADOS;',
    exhibit: { tables: [source([4, 6, 10], ['NOMBRE', 'SALARIO', 'BONO'])] },
    options: resultOptions(
      'SELECT NOMBRE, SALARIO + BONO AS TOTAL FROM EMPLEADOS',
      [4, 6, 10],
      {
        body: 'Jorge queda con TOTAL NULL.',
        feedback: 'Cualquier operación aritmética con NULL da NULL.',
        at: 1,
      },
      [
        {
          body: 'Jorge recibe su salario: el NULL cuenta como 0.',
          rows: [
            ['Jorge', 6800000],
            ['Andrés', 4500000],
            ['Mario', 3500000],
          ],
          feedback: 'NULL significa «sin dato», no 0.',
        },
        {
          body: 'Mario queda en NULL porque su bono es 0.',
          rows: [
            ['Jorge', 6800000],
            ['Andrés', 4500000],
            ['Mario', null],
          ],
          feedback: '0 es un valor: 3.500.000 + 0 = 3.500.000.',
        },
        {
          body: 'Jorge no aparece.',
          rows: [
            ['Andrés', 4500000],
            ['Mario', 3500000],
          ],
          feedback: 'Una expresión no elimina filas.',
        },
      ],
    ),
    explanation:
      'NULL representa la ausencia de dato. SALARIO + NULL no se puede calcular y da NULL; 0 sí es un valor.',
    concept: 'NULL en expresiones',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
  },
  {
    key: 'S1-NUL-02',
    topic: 'null',
    subtopic: '= NULL',
    type: 'interpret_query',
    response: 'single',
    difficulty: 2,
    prompt: '6 empleados no tienen bono. ¿Qué devuelve la consulta?',
    code: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE BONO = NULL;',
    options: [
      { body: 'Los 6 empleados sin bono.', feedback: 'Para eso se usa IS NULL.' },
      { body: 'Un error de sintaxis.', feedback: 'Es válida, pero nunca se cumple.' },
      {
        body: 'Ninguna fila: comparar con NULL usando = nunca es verdadero.',
        correct: true,
        feedback: 'La forma correcta es BONO IS NULL.',
      },
      {
        body: 'Los 14 empleados con bono.',
        feedback: 'La condición no es verdadera para ninguna fila.',
      },
    ],
    explanation:
      'Toda comparación con NULL (=, <>, >…) da desconocido. Para preguntar si falta el dato se usa IS NULL.',
    concept: 'IS NULL',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
    checks: [
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO = NULL', rows: 0 },
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO IS NULL', rows: 6 },
    ],
  },
  {
    key: 'S1-NUL-03',
    topic: 'null',
    subtopic: 'NULL frente a 0',
    type: 'compare_results',
    response: 'single',
    difficulty: 3,
    prompt: 'Compara las dos consultas. ¿Qué es cierto?',
    exhibit: {
      queries: [
        { label: 'A', sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE BONO IS NULL;' },
        { label: 'B', sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE BONO = 0;' },
      ],
    },
    options: [
      { body: 'Las dos devuelven las mismas 7 filas.', feedback: 'NULL y 0 son cosas distintas.' },
      {
        body: 'A devuelve 6 filas y B 1 (Mario): «sin bono registrado» no es «bono de 0».',
        correct: true,
        feedback: 'Mario tiene un bono registrado de 0.',
      },
      {
        body: 'A no devuelve filas: NULL no se puede comparar.',
        feedback: 'IS NULL sí funciona; lo que no funciona es = NULL.',
      },
      {
        body: 'B incluye también a los 6 sin bono.',
        feedback: 'Para un NULL, BONO = 0 es desconocido.',
      },
    ],
    explanation:
      'IS NULL busca la ausencia de dato; = 0 busca el valor cero. En EMPLEADOS hay 6 NULL y un 0.',
    concept: 'NULL frente a 0',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
    checks: [
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO IS NULL', rows: 6 },
      { kind: 'rows', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO = 0', rows: 1 },
    ],
  },
  {
    key: 'S1-NUL-04',
    topic: 'null',
    subtopic: 'IS NOT NULL',
    type: 'multiple_choice',
    response: 'multiple',
    difficulty: 3,
    prompt:
      '¿Qué condiciones devuelven a todos los que tienen un bono registrado (incluido un bono de 0)?',
    ...queryOptions('SELECT NOMBRE FROM EMPLEADOS WHERE BONO IS NOT NULL', [
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO IS NOT NULL;',
        correct: true,
        feedback: 'La forma directa.',
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO > 0;',
        feedback: 'Deja fuera a Mario, que tiene bono 0.',
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO >= 0;',
        correct: true,
        feedback: 'Todo bono registrado es ≥ 0, y los NULL no pasan.',
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE BONO <> NULL;',
        feedback: 'Comparar con NULL nunca es verdadero: no devuelve filas.',
      },
    ]),
    explanation:
      'IS NOT NULL pregunta si hay dato. BONO >= 0 da el mismo resultado aquí porque ningún bono es negativo y las comparaciones con NULL no son verdaderas.',
    concept: 'IS NOT NULL',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
  },
  {
    key: 'S1-NUL-05',
    topic: 'null',
    subtopic: 'Sin jefe',
    type: 'short_case',
    response: 'single',
    difficulty: 3,
    prompt:
      'Recursos Humanos necesita la lista de empleados sin jefe asignado (ID_JEFE vacío). ¿Qué consulta usarías?',
    ...queryOptions('SELECT NOMBRE FROM EMPLEADOS WHERE ID_JEFE IS NULL', [
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE ID_JEFE = 0;',
        feedback: 'Ningún empleado tiene 0 como jefe: no hay dato, no un cero.',
      },
      {
        sql: "SELECT NOMBRE FROM EMPLEADOS\nWHERE ID_JEFE = '';",
        feedback: "En Oracle '' es NULL, y = NULL nunca es verdadero.",
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE ID_JEFE = NULL;',
        feedback: 'Comparar con = NULL nunca es verdadero.',
      },
      {
        sql: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE ID_JEFE IS NULL;',
        correct: true,
        feedback: 'Devuelve a Ana y Esteban.',
      },
    ]),
    explanation:
      "La falta de dato se consulta con IS NULL. En Oracle el texto vacío '' también es NULL, así que = '' no sirve.",
    concept: 'IS NULL',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
  },
  {
    key: 'S1-NUL-06',
    topic: 'null',
    subtopic: 'Texto vacío en Oracle',
    type: 'concept',
    response: 'single',
    difficulty: 4,
    prompt: "En Oracle, ¿qué es el texto vacío ('')?",
    options: [
      {
        body: 'Un texto de longitud 0, distinto de NULL.',
        feedback: 'Así lo tratan otros sistemas, no Oracle.',
      },
      { body: 'Un espacio en blanco.', feedback: "Un espacio es ' ', un carácter." },
      {
        body: 'NULL: Oracle guarda y compara el texto vacío como NULL.',
        correct: true,
        feedback: "Por eso WHERE columna = '' nunca es verdadero.",
      },
      { body: 'Un error de sintaxis.', feedback: "'' es un literal válido." },
    ],
    explanation:
      "Oracle no distingue entre texto vacío y NULL. Comparar con '' equivale a comparar con NULL: nunca es verdadero.",
    concept: 'NULL en Oracle',
    review: lesson('L18', 'NULL, IS NULL e IS NOT NULL', 'null'),
    reference: REF.nulls,
    tags: ['oracle'],
    checks: [{ kind: 'rows', sql: "SELECT NOMBRE FROM EMPLEADOS WHERE NOMBRE = ''", rows: 0 }],
  },
];

// ---------------------------------------------------------------------------
// ORDER BY
// ---------------------------------------------------------------------------

const orderBy: Question[] = [
  {
    key: 'S1-ORD-01',
    topic: 'order-by',
    subtopic: 'Varias columnas',
    type: 'predict_result',
    response: 'single',
    difficulty: 2,
    prompt: '¿En qué orden salen las filas?',
    code: 'SELECT NOMBRE, SALARIO\nFROM EMPLEADOS\nORDER BY SALARIO DESC, NOMBRE;',
    exhibit: { tables: [source([4, 6, 7, 13], ['NOMBRE', 'SALARIO'])] },
    options: resultOptions(
      'SELECT NOMBRE, SALARIO FROM EMPLEADOS ORDER BY SALARIO DESC, NOMBRE',
      [4, 6, 7, 13],
      {
        body: 'Jorge, Camila, Andrés, Paula.',
        feedback: 'Andrés y Paula empatan en salario; el nombre decide (ascendente).',
        at: 0,
      },
      [
        {
          body: 'Jorge, Camila, Paula, Andrés.',
          rows: [
            ['Jorge', 6800000],
            ['Camila', 4500000],
            ['Paula', 4200000],
            ['Andrés', 4200000],
          ],
          feedback: 'DESC solo afecta a SALARIO; NOMBRE va ascendente.',
        },
        {
          body: 'Andrés, Paula, Camila, Jorge.',
          rows: [
            ['Andrés', 4200000],
            ['Paula', 4200000],
            ['Camila', 4500000],
            ['Jorge', 6800000],
          ],
          feedback: 'DESC ordena de mayor a menor.',
        },
        {
          body: 'Andrés, Camila, Jorge, Paula.',
          rows: [
            ['Andrés', 4200000],
            ['Camila', 4500000],
            ['Jorge', 6800000],
            ['Paula', 4200000],
          ],
          feedback: 'NOMBRE solo desempata; primero manda SALARIO.',
        },
      ],
    ),
    explanation:
      'ORDER BY ordena por la primera columna y usa la siguiente solo para desempatar. Cada columna tiene su propia dirección (ASC por defecto).',
    concept: 'ORDER BY con varias columnas',
    review: lesson('L19', 'ORDER BY: ordenar el resultado', 'order-by'),
    reference: REF.orderBy,
  },
  {
    key: 'S1-ORD-02',
    topic: 'order-by',
    subtopic: 'NULL al ordenar',
    type: 'predict_result',
    response: 'single',
    difficulty: 4,
    prompt: '¿En qué orden salen las filas en Oracle? (Jorge no tiene bono.)',
    code: 'SELECT NOMBRE, BONO\nFROM EMPLEADOS\nORDER BY BONO;',
    exhibit: { tables: [source([4, 6, 10], ['NOMBRE', 'BONO'])] },
    options: resultOptions(
      'SELECT NOMBRE, BONO FROM EMPLEADOS ORDER BY BONO',
      [4, 6, 10],
      {
        body: 'Mario, Andrés y Jorge al final.',
        feedback: 'En orden ascendente, Oracle pone los NULL al final.',
        at: 2,
      },
      [
        {
          body: 'Jorge primero, luego Mario y Andrés.',
          rows: [
            ['Jorge', null],
            ['Mario', 0],
            ['Andrés', 300000],
          ],
          feedback: 'Eso pasa con DESC (o con NULLS FIRST), no con ASC.',
        },
        {
          body: 'Jorge no aparece.',
          rows: [
            ['Mario', 0],
            ['Andrés', 300000],
          ],
          feedback: 'ORDER BY no elimina filas.',
        },
        {
          body: 'Andrés, Mario y Jorge.',
          rows: [
            ['Andrés', 300000],
            ['Mario', 0],
            ['Jorge', null],
          ],
          feedback: 'ASC va de menor a mayor: 0 antes que 300.000.',
        },
      ],
    ),
    explanation:
      'Oracle considera NULL mayor que cualquier valor al ordenar: va al final con ASC y al principio con DESC, salvo que se indique NULLS FIRST o NULLS LAST.',
    concept: 'ORDER BY y NULL',
    review: lesson('L19', 'ORDER BY: ordenar el resultado', 'order-by'),
    reference: REF.orderBy,
    tags: ['null', 'oracle'],
  },
  {
    key: 'S1-ORD-03',
    topic: 'order-by',
    subtopic: 'Construir la consulta',
    type: 'order_fragments',
    response: 'order',
    difficulty: 2,
    prompt:
      'Ordena los fragmentos para obtener el nombre y el salario de los empleados de Cali, de mayor a menor salario.',
    options: fragments(
      [
        'SELECT NOMBRE, SALARIO',
        'FROM EMPLEADOS',
        "WHERE CIUDAD = 'Cali'",
        'ORDER BY SALARIO DESC;',
      ],
      [
        'Primero, qué columnas.',
        'Después, de qué tabla.',
        'Luego, qué filas.',
        'Al final, el orden.',
      ],
    ),
    explanation: 'Las cláusulas se escriben en este orden: SELECT, FROM, WHERE y ORDER BY.',
    concept: 'Orden de las cláusulas',
    review: lesson('L20', 'La consulta completa, paso a paso', 'consulta-completa'),
    reference: REF.select,
    checks: [
      {
        kind: 'rows',
        sql: "SELECT NOMBRE, SALARIO FROM EMPLEADOS WHERE CIUDAD = 'Cali' ORDER BY SALARIO DESC",
        rows: 5,
      },
    ],
  },
  {
    key: 'S1-ORD-04',
    topic: 'order-by',
    subtopic: 'Alias en ORDER BY',
    type: 'concept',
    response: 'single',
    difficulty: 3,
    prompt: 'En la consulta mostrada, ¿en qué otra cláusula se puede usar el alias ANUAL?',
    code: 'SELECT NOMBRE, SALARIO * 12 AS ANUAL\nFROM EMPLEADOS\n…',
    options: [
      {
        body: 'En WHERE: WHERE ANUAL > 60000000.',
        feedback: 'WHERE se procesa antes que SELECT y todavía no conoce el alias.',
      },
      {
        body: 'En ORDER BY: ORDER BY ANUAL DESC.',
        correct: true,
        feedback: 'ORDER BY se procesa después de SELECT.',
      },
      { body: 'En FROM: FROM ANUAL.', feedback: 'FROM nombra tablas, no columnas.' },
      {
        body: 'En ninguna: los alias solo cambian el título.',
        feedback: 'ORDER BY sí puede usarlos.',
      },
    ],
    explanation:
      'Oracle procesa FROM, WHERE, SELECT y ORDER BY en ese orden lógico. Por eso ORDER BY ve los alias de SELECT y WHERE no.',
    concept: 'Orden lógico y alias',
    review: lesson('L19', 'ORDER BY: ordenar el resultado', 'order-by'),
    reference: REF.orderBy,
    checks: [
      {
        kind: 'valid',
        sql: 'SELECT NOMBRE, SALARIO * 12 AS ANUAL FROM EMPLEADOS ORDER BY ANUAL DESC',
      },
      {
        kind: 'error',
        sql: 'SELECT NOMBRE, SALARIO * 12 AS ANUAL FROM EMPLEADOS WHERE ANUAL > 60000000',
      },
    ],
  },
  {
    key: 'S1-ORD-05',
    topic: 'order-by',
    subtopic: 'Ordenar por posición',
    type: 'interpret_query',
    response: 'single',
    difficulty: 2,
    prompt: '¿Por qué columna ordena esta consulta?',
    code: 'SELECT NOMBRE, SALARIO\nFROM EMPLEADOS\nORDER BY 2;',
    options: [
      {
        body: 'Por NOMBRE, la segunda columna de la tabla.',
        feedback: 'El número se refiere a la lista SELECT, no a la tabla.',
      },
      {
        body: 'Por SALARIO, la segunda columna de la lista SELECT, de menor a mayor.',
        correct: true,
        feedback: 'ORDER BY 2 = ORDER BY SALARIO.',
      },
      { body: 'No ordena: devuelve solo 2 filas.', feedback: 'El número no limita filas.' },
      {
        body: 'Pone primero al empleado con ID 2.',
        feedback: 'No compara con valores de ninguna columna.',
      },
    ],
    explanation:
      'Un número en ORDER BY indica la posición de la columna en la lista SELECT. Es válido, pero un nombre o un alias es más claro.',
    concept: 'ORDER BY por posición',
    review: lesson('L19', 'ORDER BY: ordenar el resultado', 'order-by'),
    reference: REF.orderBy,
    checks: [
      {
        kind: 'same',
        sql: 'SELECT NOMBRE, SALARIO FROM EMPLEADOS ORDER BY 2',
        target: 'SELECT NOMBRE, SALARIO FROM EMPLEADOS ORDER BY SALARIO',
        expected: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Consulta completa y errores frecuentes
// ---------------------------------------------------------------------------

const completa: Question[] = [
  {
    key: 'S1-COM-01',
    topic: 'consulta-completa',
    subtopic: 'Escritura completa',
    type: 'order_fragments',
    response: 'order',
    difficulty: 3,
    prompt:
      'Ordena los fragmentos para obtener, sin repetir y en orden alfabético, las ciudades donde alguien gana al menos 4.000.000.',
    options: fragments([
      'SELECT DISTINCT CIUDAD',
      'FROM EMPLEADOS',
      'WHERE SALARIO >= 4000000',
      'ORDER BY CIUDAD;',
    ]),
    explanation: 'DISTINCT va justo después de SELECT; WHERE filtra antes de ordenar con ORDER BY.',
    concept: 'Consulta completa',
    review: lesson('L20', 'La consulta completa, paso a paso', 'consulta-completa'),
    reference: REF.select,
    checks: [
      {
        kind: 'rows',
        sql: 'SELECT DISTINCT CIUDAD FROM EMPLEADOS WHERE SALARIO >= 4000000 ORDER BY CIUDAD',
        rows: 4,
      },
    ],
  },
  {
    key: 'S1-COM-02',
    topic: 'consulta-completa',
    subtopic: 'Orden lógico de procesamiento',
    type: 'order_fragments',
    response: 'order',
    difficulty: 4,
    prompt:
      'Ordena las cláusulas según el orden lógico en que Oracle las procesa (no en el que se escriben).',
    options: fragments(
      [
        'FROM: toma la tabla',
        'WHERE: filtra filas',
        'SELECT: calcula columnas y alias',
        'ORDER BY: ordena el resultado',
      ],
      [
        'Primero se necesita la tabla.',
        'Luego se descartan filas.',
        'Con las filas que quedan se calculan las columnas.',
        'Por último se ordena (ya existen los alias).',
      ],
    ),
    explanation:
      'Aunque se escribe SELECT primero, lógicamente se procesa FROM → WHERE → SELECT → ORDER BY. Esto explica por qué ORDER BY puede usar alias y WHERE no.',
    concept: 'Orden lógico de evaluación',
    review: lesson('L20', 'La consulta completa, paso a paso', 'consulta-completa'),
    reference: REF.select,
  },
  {
    key: 'S1-COM-03',
    topic: 'consulta-completa',
    subtopic: 'Integración',
    type: 'predict_result',
    response: 'single',
    difficulty: 3,
    prompt: '¿Qué devuelve la consulta sobre la tabla EMPLEADOS completa?',
    code: "SELECT NOMBRE, CIUDAD, SALARIO\nFROM EMPLEADOS\nWHERE ESTADO = 'ACTIVO'\n  AND CIUDAD = 'Bogotá'\n  AND SALARIO BETWEEN 4000000 AND 8000000\nORDER BY SALARIO DESC;",
    exhibit: {
      tables: [
        source(
          [1, 2, 5, 6, 10, 14, 18],
          ['NOMBRE', 'CIUDAD', 'SALARIO', 'ESTADO'],
          'EMPLEADOS de Bogotá',
        ),
      ],
    },
    options: resultOptions(
      "SELECT NOMBRE, CIUDAD, SALARIO FROM EMPLEADOS WHERE ESTADO = 'ACTIVO' AND CIUDAD = 'Bogotá' AND SALARIO BETWEEN 4000000 AND 8000000 ORDER BY SALARIO DESC",
      undefined,
      {
        body: 'Carlos, Laura y Andrés.',
        feedback: 'Cumplen las tres condiciones y salen de mayor a menor salario.',
        at: 1,
      },
      [
        {
          body: 'Carlos, Laura, Diego y Andrés.',
          rows: [
            ['Carlos', 'Bogotá', 7500000],
            ['Laura', 'Bogotá', 5800000],
            ['Diego', 'Bogotá', 5200000],
            ['Andrés', 'Bogotá', 4200000],
          ],
          feedback: 'Diego está INACTIVO.',
        },
        {
          body: 'Ana, Carlos, Laura y Andrés.',
          rows: [
            ['Ana', 'Bogotá', 9000000],
            ['Carlos', 'Bogotá', 7500000],
            ['Laura', 'Bogotá', 5800000],
            ['Andrés', 'Bogotá', 4200000],
          ],
          feedback: 'Ana gana 9.000.000, fuera del rango.',
        },
        {
          body: 'Andrés, Laura y Carlos.',
          rows: [
            ['Andrés', 'Bogotá', 4200000],
            ['Laura', 'Bogotá', 5800000],
            ['Carlos', 'Bogotá', 7500000],
          ],
          feedback: 'DESC ordena de mayor a menor.',
        },
      ],
    ),
    explanation:
      'Las tres condiciones unidas con AND deben cumplirse a la vez: activo, de Bogotá y con salario entre 4 y 8 millones. Después se ordena de mayor a menor.',
    concept: 'Consulta completa',
    review: lesson('L20', 'La consulta completa, paso a paso', 'consulta-completa'),
    reference: REF.select,
  },
  {
    key: 'S1-COM-04',
    topic: 'consulta-completa',
    subtopic: 'DISTINCT en la consulta completa',
    type: 'compare_results',
    response: 'single',
    difficulty: 3,
    prompt: 'Compara las dos consultas. ¿Qué diferencia hay entre sus resultados?',
    exhibit: {
      queries: [
        {
          label: 'A',
          sql: 'SELECT DISTINCT CIUDAD FROM EMPLEADOS\nWHERE SALARIO >= 4000000\nORDER BY CIUDAD;',
        },
        {
          label: 'B',
          sql: 'SELECT CIUDAD FROM EMPLEADOS\nWHERE SALARIO >= 4000000\nORDER BY CIUDAD;',
        },
      ],
    },
    options: [
      {
        body: 'Ninguna: ORDER BY ya agrupa las ciudades iguales.',
        feedback: 'Ordenar no elimina repetidos; los deja juntos.',
      },
      {
        body: 'A tiene 4 filas (una por ciudad) y B 11 (una por empleado que cumple).',
        correct: true,
        feedback: 'DISTINCT elimina las repeticiones.',
      },
      { body: 'A tiene 11 filas y B 4.', feedback: 'Es al revés: DISTINCT reduce filas.' },
      { body: 'B falla porque falta DISTINCT.', feedback: 'DISTINCT es opcional.' },
    ],
    explanation:
      'Las dos consultas filtran las mismas filas; DISTINCT deja una por ciudad y sin DISTINCT aparece una por empleado.',
    concept: 'DISTINCT',
    review: lesson('L10', 'DISTINCT: sin filas repetidas', 'distinct'),
    reference: REF.select,
    checks: [
      {
        kind: 'rows',
        sql: 'SELECT DISTINCT CIUDAD FROM EMPLEADOS WHERE SALARIO >= 4000000 ORDER BY CIUDAD',
        rows: 4,
      },
      {
        kind: 'rows',
        sql: 'SELECT CIUDAD FROM EMPLEADOS WHERE SALARIO >= 4000000 ORDER BY CIUDAD',
        rows: 11,
      },
    ],
  },
  {
    key: 'S1-COM-05',
    topic: 'consulta-completa',
    subtopic: 'Caso de gerencia',
    type: 'short_case',
    response: 'multiple',
    difficulty: 4,
    prompt:
      'Gerencia pide el nombre y el salario anual (salario × 12) de los empleados ACTIVOS del departamento TI, del mayor al menor. ¿Qué consultas cumplen el pedido?',
    ...queryOptions(
      "SELECT NOMBRE, SALARIO * 12 AS ANUAL FROM EMPLEADOS WHERE ESTADO = 'ACTIVO' AND DEPARTAMENTO = 'TI' ORDER BY ANUAL DESC",
      [
        {
          sql: "SELECT NOMBRE, SALARIO * 12 AS ANUAL\nFROM EMPLEADOS\nWHERE ESTADO = 'ACTIVO' AND DEPARTAMENTO = 'TI'\nORDER BY ANUAL DESC;",
          correct: true,
          feedback: 'Cumple todo y ordena por el alias.',
        },
        {
          sql: "SELECT NOMBRE, SALARIO * 12 AS ANUAL\nFROM EMPLEADOS\nWHERE ESTADO = 'ACTIVO' OR DEPARTAMENTO = 'TI'\nORDER BY ANUAL DESC;",
          feedback: 'OR incluye a todos los activos de cualquier departamento.',
        },
        {
          sql: "SELECT NOMBRE, SALARIO * 12 AS ANUAL\nFROM EMPLEADOS\nWHERE ESTADO = 'ACTIVO' AND DEPARTAMENTO = 'TI'\nORDER BY 2 DESC;",
          correct: true,
          feedback: 'ORDER BY 2 ordena por la segunda columna: ANUAL.',
        },
        {
          sql: "SELECT NOMBRE, SALARIO * 12 AS ANUAL\nFROM EMPLEADOS\nWHERE ESTADO = 'ACTIVO' AND DEPARTAMENTO = 'TI'\nORDER BY ANUAL;",
          feedback: 'Sin DESC va de menor a mayor.',
        },
      ],
    ),
    explanation:
      'Las dos condiciones deben cumplirse a la vez (AND) y el orden descendente puede indicarse por alias o por posición.',
    concept: 'Consulta completa',
    review: lesson('L20', 'La consulta completa, paso a paso', 'consulta-completa'),
    reference: REF.select,
  },
  {
    key: 'S1-COM-06',
    topic: 'consulta-completa',
    subtopic: 'Orden de cláusulas',
    type: 'find_error',
    response: 'single',
    difficulty: 2,
    prompt: 'La consulta falla. ¿Cuál es el error?',
    code: "SELECT NOMBRE, SALARIO\nFROM EMPLEADOS\nORDER BY SALARIO DESC\nWHERE CIUDAD = 'Cali';",
    options: [
      {
        body: 'DESC debe ir antes de SALARIO.',
        feedback: 'DESC va después de la columna que ordena.',
      },
      {
        body: 'WHERE debe escribirse antes de ORDER BY.',
        correct: true,
        feedback: 'El orden de escritura es SELECT, FROM, WHERE, ORDER BY.',
      },
      {
        body: 'Falta una coma entre SALARIO y DESC.',
        feedback: 'DESC acompaña a la columna sin coma.',
      },
      {
        body: "'Cali' debe ir sin comillas.",
        feedback: 'Los textos sí van entre comillas simples.',
      },
    ],
    explanation: 'Las cláusulas tienen un orden de escritura fijo; ORDER BY siempre va al final.',
    concept: 'Orden de las cláusulas',
    review: lesson('L21', 'Errores frecuentes', 'errores-frecuentes'),
    reference: REF.select,
    checks: [
      {
        kind: 'error',
        sql: "SELECT NOMBRE, SALARIO FROM EMPLEADOS ORDER BY SALARIO DESC WHERE CIUDAD = 'Cali'",
      },
    ],
  },
  {
    key: 'S1-COM-07',
    topic: 'consulta-completa',
    subtopic: 'Condición incompleta',
    type: 'find_error',
    response: 'single',
    difficulty: 3,
    prompt: 'La consulta falla. ¿Cuál es la corrección?',
    code: 'SELECT NOMBRE FROM EMPLEADOS\nWHERE SALARIO > 4000000 AND < 6000000;',
    options: [
      {
        body: 'Repetir la columna después de AND: SALARIO > 4000000 AND SALARIO < 6000000.',
        correct: true,
        feedback: 'Cada lado de AND es una condición completa.',
      },
      { body: 'Escribir los números entre comillas.', feedback: 'Los números van sin comillas.' },
      {
        body: 'Poner la condición entre paréntesis.',
        feedback: 'Los paréntesis no completan la condición.',
      },
      {
        body: 'Cambiar AND por OR.',
        feedback: 'El problema es la condición incompleta, no el operador.',
      },
    ],
    explanation:
      'AND une dos condiciones completas. «< 6000000» sola no dice qué se compara. También sirve BETWEEN, aunque incluye los extremos.',
    concept: 'Condiciones con AND',
    review: lesson('L21', 'Errores frecuentes', 'errores-frecuentes'),
    reference: REF.conditions,
    checks: [
      { kind: 'error', sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE SALARIO > 4000000 AND < 6000000' },
      {
        kind: 'valid',
        sql: 'SELECT NOMBRE FROM EMPLEADOS WHERE SALARIO > 4000000 AND SALARIO < 6000000',
      },
    ],
  },
];

export const FUNDAMENTOS_SQL_BANK: readonly OfficialQuestion[] = [
  ...fundamentos,
  ...selectFrom,
  ...expresiones,
  ...aliasConcat,
  ...distinct,
  ...where,
  ...logicos,
  ...betweenInLike,
  ...nulls,
  ...orderBy,
  ...completa,
].map((question) => ({ ...question, section: SECTION_1 }));
