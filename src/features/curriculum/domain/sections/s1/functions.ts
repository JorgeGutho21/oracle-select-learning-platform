import { lines, query, source, sqlRef } from '../../builders';
import type {
  CurriculumBlock,
  CurriculumConcept,
  CurriculumExample,
  CurriculumLesson,
} from '../../types';

/**
 * Sección 1, ampliación «Funciones de una fila» (auditoría de la Fase 4, SECTION_1_AUDIT):
 * UPPER, LOWER, INITCAP, LENGTH, SUBSTR, ROUND, TRUNC, MOD, aritmética de fechas, SYSDATE y
 * NVL. Usa el mismo dataset de la Sección 1 (empleados-select-v2). El motor educativo de la
 * Sección 1 no ejecuta funciones, así que estos resultados salen de Oracle real.
 */

const V2 = { dataset: 'empleados-v2' } as const;
const TI = [2, 6, 7, 8, 20];
const VENTAS = [3, 9, 10, 11, 12];
const FINANZAS = [4, 13, 14, 15];

export const FUNCTIONS_BLOCK: CurriculumBlock = {
  id: 'funciones',
  number: 9,
  title: 'Funciones de una fila',
  summary: 'Transformar textos, números y fechas, y reemplazar NULL, fila por fila.',
};

export const FUNCTION_EXAMPLES: readonly CurriculumExample[] = [
  query(
    'S1-E-TEXTO',
    lines(
      'SELECT nombre,',
      '       UPPER(apellido) AS apellido_mayus,',
      '       LOWER(cargo)    AS cargo_minus,',
      '       LENGTH(nombre)  AS letras',
      'FROM empleados',
      "WHERE departamento = 'TI'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'APELLIDO', 'CARGO', 'DEPARTAMENTO'], TI)],
    V2,
  ),
  query(
    'S1-E-SUBSTR',
    lines(
      'SELECT nombre,',
      '       SUBSTR(nombre, 1, 3) AS inicio,',
      '       INITCAP(LOWER(cargo)) AS cargo',
      'FROM empleados',
      "WHERE departamento = 'Ventas'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'DEPARTAMENTO'], VENTAS)],
    V2,
  ),
  query(
    'S1-E-UPPER-WHERE',
    lines(
      'SELECT nombre, ciudad',
      'FROM empleados',
      "WHERE UPPER(ciudad) = 'BOGOTÁ'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'CIUDAD'])],
    V2,
  ),
  query(
    'S1-E-REDONDEO',
    lines(
      'SELECT nombre, salario,',
      '       ROUND(salario / 30) AS diario_redondeado,',
      '       TRUNC(salario / 30) AS diario_truncado',
      'FROM empleados',
      'WHERE id_empleado IN (1, 4, 11, 18)',
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'SALARIO'], [1, 4, 11, 18])],
    V2,
  ),
  query(
    'S1-E-ROUND-MILLONES',
    lines(
      'SELECT nombre, salario,',
      '       ROUND(salario, -6) AS millones',
      'FROM empleados',
      "WHERE departamento = 'Finanzas'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'DEPARTAMENTO', 'SALARIO'], FINANZAS)],
    V2,
  ),
  query(
    'S1-E-MOD',
    lines(
      'SELECT id_empleado, nombre,',
      '       MOD(id_empleado, 2) AS resto',
      'FROM empleados',
      "WHERE departamento = 'Ventas'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'DEPARTAMENTO'], VENTAS)],
    V2,
  ),
  query(
    'S1-E-FECHAS',
    lines(
      'SELECT nombre, fecha_ingreso,',
      '       fecha_ingreso + 90 AS fin_prueba,',
      "       TRUNC((DATE '2026-10-01' - fecha_ingreso) / 365) AS anios",
      'FROM empleados',
      "WHERE fecha_ingreso >= DATE '2024-01-01'",
      'ORDER BY fecha_ingreso;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'FECHA_INGRESO'], [16, 18, 20])],
    V2,
  ),
  query(
    'S1-E-NVL',
    lines(
      'SELECT nombre, salario, bono,',
      '       salario + bono         AS sin_nvl,',
      '       salario + NVL(bono, 0) AS con_nvl',
      'FROM empleados',
      "WHERE departamento = 'TI'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'DEPARTAMENTO', 'SALARIO', 'BONO'], TI)],
    V2,
  ),
  query(
    'S1-E-NVL-TEXTO',
    lines(
      "SELECT nombre, NVL(TO_CHAR(bono), 'sin bono') AS bono",
      'FROM empleados',
      "WHERE departamento = 'TI'",
      'ORDER BY id_empleado;',
    ),
    [source('EMPLEADOS', ['ID_EMPLEADO', 'NOMBRE', 'DEPARTAMENTO', 'BONO'], TI)],
    V2,
  ),
];

export const FUNCTION_CONCEPTS: readonly CurriculumConcept[] = [
  {
    id: 'case-functions',
    term: 'UPPER, LOWER e INITCAP',
    category: 'Función de texto',
    definition:
      'Devuelven el texto en mayúsculas (UPPER), en minúsculas (LOWER) o con la primera letra de cada palabra en mayúscula (INITCAP).',
    purpose: 'Presentar textos de forma uniforme y comparar sin depender de mayúsculas.',
    syntax: "UPPER(apellido) · LOWER(cargo) · INITCAP('ana rojas')",
    example: 'S1-E-TEXTO',
    mistake: {
      title: 'Creer que cambian la tabla',
      why: 'La función transforma el valor en el resultado; el dato guardado no cambia.',
    },
    keyIdea: 'Transforman el texto mostrado, no el guardado.',
    reference: sqlRef('Character Functions Returning Character Values'),
  },
  {
    id: 'length',
    term: 'LENGTH',
    category: 'Función de texto',
    definition: 'Devuelve cuántos caracteres tiene un texto, contando espacios.',
    purpose: 'Validar longitudes o encontrar textos demasiado cortos o largos.',
    syntax: 'LENGTH(nombre)',
    example: 'S1-E-TEXTO',
    mistake: {
      title: 'Esperar 0 para un texto vacío',
      why: "En Oracle '' es NULL, así que LENGTH('') devuelve NULL.",
    },
    keyIdea: 'LENGTH cuenta caracteres.',
    reference: sqlRef('Character Functions Returning Number Values'),
  },
  {
    id: 'substr',
    term: 'SUBSTR',
    category: 'Función de texto',
    definition:
      'Extrae parte de un texto: SUBSTR(texto, inicio, cantidad). La primera posición es 1.',
    purpose: 'Obtener iniciales, prefijos o códigos dentro de un texto.',
    syntax: 'SUBSTR(nombre, 1, 3)',
    example: 'S1-E-SUBSTR',
    mistake: {
      title: 'Empezar a contar en 0',
      why: 'En Oracle la primera posición es 1: SUBSTR(nombre, 1, 3) toma las tres primeras letras.',
    },
    keyIdea: 'Desde la posición inicio, toma cantidad caracteres.',
    reference: sqlRef('SUBSTR'),
  },
  {
    id: 'round',
    term: 'ROUND',
    category: 'Función numérica',
    definition:
      'Redondea un número a los decimales indicados; con un valor negativo redondea a decenas, miles o millones.',
    purpose: 'Presentar cifras legibles, como un salario diario sin decimales.',
    syntax: 'ROUND(salario / 30) · ROUND(salario, -6)',
    example: 'S1-E-REDONDEO',
    mistake: {
      title: 'Confundir ROUND con TRUNC',
      why: 'ROUND sube cuando la parte descartada es 5 o más; TRUNC siempre corta.',
    },
    keyIdea: 'ROUND redondea; el segundo argumento dice dónde.',
    reference: sqlRef('ROUND (number)'),
  },
  {
    id: 'trunc',
    term: 'TRUNC',
    category: 'Función numérica',
    definition: 'Corta un número en los decimales indicados, sin redondear.',
    purpose: 'Quedarse con la parte entera, como los años completos trabajados.',
    syntax: 'TRUNC(salario / 30)',
    example: 'S1-E-REDONDEO',
    mistake: {
      title: 'Esperar que redondee',
      why: 'TRUNC(96666.67) es 96666: descarta los decimales sin mirarlos.',
    },
    keyIdea: 'TRUNC corta; nunca sube.',
    reference: sqlRef('TRUNC (number)'),
  },
  {
    id: 'mod',
    term: 'MOD',
    category: 'Función numérica',
    definition: 'Devuelve el resto de una división entera: MOD(10, 3) es 1.',
    purpose: 'Saber si un número es par, repartir en turnos o grupos.',
    syntax: 'MOD(id_empleado, 2)',
    example: 'S1-E-MOD',
    mistake: {
      title: 'Confundir resto con cociente',
      why: 'MOD(10, 3) es 1 (lo que sobra), no 3.',
    },
    keyIdea: 'MOD = lo que sobra al dividir.',
    reference: sqlRef('MOD'),
  },
  {
    id: 'date-arithmetic',
    term: 'Aritmética de fechas',
    category: 'Fechas',
    definition: 'Una fecha más un número suma días; una fecha menos otra da los días entre ambas.',
    purpose: 'Calcular vencimientos, antigüedad o plazos.',
    syntax: "fecha_ingreso + 90 · DATE '2026-10-01' - fecha_ingreso",
    example: 'S1-E-FECHAS',
    mistake: {
      title: 'Escribir la fecha como texto',
      why: "'2026-10-01' es un texto; DATE '2026-10-01' es una fecha.",
    },
    keyIdea: 'Fecha ± número = días.',
    reference: sqlRef('Datetime/Interval Arithmetic'),
  },
  {
    id: 'sysdate',
    term: 'SYSDATE',
    category: 'Fechas',
    definition:
      'Devuelve la fecha y la hora actuales del servidor de la base de datos; cambia en cada ejecución.',
    purpose: 'Calcular con respecto a hoy: antigüedad, días de retraso, vencimientos.',
    syntax: 'SYSDATE - fecha_ingreso',
    example: 'S1-E-FECHAS',
    mistake: {
      title: 'Esperar el mismo resultado siempre',
      why: 'SYSDATE cambia cada día; por eso los ejemplos usan una fecha fija.',
    },
    keyIdea: 'SYSDATE = ahora, según el servidor.',
    reference: sqlRef('SYSDATE'),
  },
  {
    id: 'nvl',
    term: 'NVL',
    category: 'Función de NULL',
    definition:
      'NVL(valor, reemplazo) devuelve el valor si no es NULL y el reemplazo si lo es; ambos deben ser de tipos compatibles.',
    purpose: 'Calcular sin que un NULL anule el resultado: salario + NVL(bono, 0).',
    syntax: 'NVL(bono, 0)',
    example: 'S1-E-NVL',
    mistake: {
      title: 'Reemplazar un número por texto',
      why: "NVL(bono, 'sin bono') mezcla número y texto: convierte antes con TO_CHAR(bono).",
    },
    keyIdea: 'NVL pone un valor donde falta el dato.',
    reference: sqlRef('NVL'),
  },
];

export const FUNCTION_LESSONS: readonly CurriculumLesson[] = [
  {
    id: 'S1-L22',
    block: 'funciones',
    slug: 'funciones-de-texto',
    title: 'Funciones de texto: UPPER, LOWER, INITCAP, LENGTH y SUBSTR',
    shortTitle: 'Funciones de texto',
    summary:
      'Una función de una fila recibe un valor de cada fila y devuelve otro: cambia mayúsculas, mide o recorta textos.',
    concepts: ['case-functions', 'length', 'substr'],
    purpose: 'Presentar textos de forma uniforme y comparar sin depender de cómo se escribieron.',
    syntax: lines(
      'UPPER(texto)   LOWER(texto)   INITCAP(texto)',
      'LENGTH(texto)',
      'SUBSTR(texto, inicio, cantidad)',
    ),
    explanation: [
      'Una función de una fila se calcula en cada fila por separado y devuelve un valor para esa fila. Puede ir en SELECT, en WHERE y en ORDER BY.',
      'La función no modifica la tabla: APELLIDO sigue guardado igual; solo cambia cómo se muestra en el resultado.',
      'Las funciones se pueden anidar: INITCAP(LOWER(cargo)) primero pasa a minúsculas y después pone mayúscula inicial.',
    ],
    example: {
      question: '¿Cómo se ven los datos de TI en mayúsculas, minúsculas y con su longitud?',
      example: 'S1-E-TEXTO',
      reading:
        'Para cada persona de TI: el apellido en mayúsculas, el cargo en minúsculas y cuántas letras tiene su nombre.',
    },
    more: [
      {
        question: '¿Cuáles son las tres primeras letras de cada nombre de Ventas?',
        example: 'S1-E-SUBSTR',
        reading:
          'SUBSTR(nombre, 1, 3) toma tres caracteres desde la posición 1. INITCAP(LOWER(cargo)) pone mayúscula inicial en cada palabra, también en las cortas: «Líder De Área».',
      },
      {
        question: 'Una función en WHERE: comparar sin depender de mayúsculas.',
        example: 'S1-E-UPPER-WHERE',
        reading:
          'UPPER(ciudad) convierte «Bogotá» en «BOGOTÁ» antes de comparar: la condición encuentra a las 7 personas aunque el dato guardado combine mayúsculas y minúsculas.',
      },
    ],
    changed: [
      'Aparecen columnas calculadas con alias: APELLIDO_MAYUS, CARGO_MINUS y LETRAS.',
      'Los datos guardados no cambian.',
    ],
    mistakes: [
      {
        title: 'Esperar que UPPER corrija la tabla',
        why: 'Solo transforma el resultado. Para cambiar el dato guardado haría falta un UPDATE.',
      },
      {
        title: 'Contar posiciones desde 0',
        why: 'En SUBSTR la primera posición es 1.',
      },
    ],
    check: {
      id: 'S1-L22-C',
      kind: 'choice',
      lesson: 'S1-L22',
      prompt: "¿Qué devuelve SUBSTR('Valentina', 1, 4)?",
      options: [
        {
          text: "'Vale'",
          code: true,
          correct: true,
          feedback: 'Correcto: cuatro caracteres desde la posición 1.',
        },
        {
          text: "'Valen'",
          code: true,
          correct: false,
          feedback: 'El tercer argumento es la cantidad, no la posición final + 1.',
        },
        { text: "'alen'", code: true, correct: false, feedback: 'La primera posición es 1, no 0.' },
        { text: "'tina'", code: true, correct: false, feedback: 'Eso serían los cuatro últimos.' },
      ],
      hints: [
        'El segundo argumento es la posición inicial.',
        'El tercero, cuántos caracteres tomar.',
      ],
      explanation: "SUBSTR('Valentina', 1, 4) toma V, a, l, e: 'Vale'.",
    },
    keyIdea: 'Una función de una fila transforma cada valor; la tabla no cambia.',
    topic: 'funciones',
    version: 1,
  },
  {
    id: 'S1-L23',
    block: 'funciones',
    slug: 'funciones-numericas',
    title: 'Funciones numéricas: ROUND, TRUNC y MOD',
    shortTitle: 'Funciones numéricas',
    summary: 'ROUND redondea, TRUNC corta y MOD devuelve el resto de una división.',
    concepts: ['round', 'trunc', 'mod'],
    purpose:
      'Presentar cálculos con cifras legibles y resolver preguntas de restos, como par o impar.',
    syntax: lines(
      'ROUND(número [, decimales])',
      'TRUNC(número [, decimales])',
      'MOD(dividendo, divisor)',
    ),
    explanation: [
      'ROUND redondea: si lo que se descarta es 5 o más, sube. TRUNC corta sin mirar lo descartado.',
      'El segundo argumento indica dónde redondear o cortar: 2 son dos decimales, 0 (o nada) la unidad y -6 los millones.',
      'MOD(a, b) devuelve el resto de dividir a entre b: MOD(id_empleado, 2) es 0 para los pares y 1 para los impares.',
    ],
    example: {
      question: '¿Cuánto gana cada persona por día, redondeado y truncado?',
      example: 'S1-E-REDONDEO',
      reading:
        'Divide el salario entre 30. Jorge da 226.666,67: ROUND sube a 226.667 y TRUNC deja 226.666. Ana y Felipe dan resultados exactos y las dos funciones coinciden.',
    },
    more: [
      {
        question: 'ROUND con un segundo argumento negativo: salarios de Finanzas en millones.',
        example: 'S1-E-ROUND-MILLONES',
        reading:
          'ROUND(salario, -6) redondea al millón más cercano: Camila (4.500.000) sube a 5.000.000 porque está justo en la mitad.',
      },
      {
        question: '¿Qué resto deja cada ID de Ventas al dividirlo entre 2?',
        example: 'S1-E-MOD',
        reading: 'Resto 0 = ID par; resto 1 = ID impar.',
      },
    ],
    changed: ['Aparecen dos columnas calculadas; SALARIO conserva su valor.'],
    mistakes: [
      { title: 'Usar TRUNC esperando redondear', why: 'TRUNC(96.666,67) es 96.666: nunca sube.' },
      {
        title: 'Olvidar que -6 redondea a millones',
        why: 'ROUND(4500000, -6) es 5.000.000: 500.000 es la mitad y sube.',
      },
    ],
    check: {
      id: 'S1-L23-C',
      kind: 'choice',
      lesson: 'S1-L23',
      prompt: '¿Qué devuelven ROUND(96666.67) y TRUNC(96666.67)?',
      options: [
        {
          text: '96667 y 96666',
          correct: true,
          feedback: 'Correcto: ROUND sube con ,67; TRUNC corta.',
        },
        { text: '96666 y 96667', correct: false, feedback: 'Es al revés: TRUNC nunca sube.' },
        { text: '96667 y 96667', correct: false, feedback: 'TRUNC no redondea.' },
        {
          text: '96666 y 96666',
          correct: false,
          feedback: 'ROUND sube cuando lo descartado es 5 o más.',
        },
      ],
      hints: [',67 es más que la mitad.', 'Una de las dos funciones no mira los decimales.'],
      explanation: 'ROUND(96666.67) = 96667 porque ,67 ≥ ,5; TRUNC(96666.67) = 96666.',
    },
    keyIdea: 'ROUND redondea, TRUNC corta, MOD da el resto.',
    topic: 'funciones',
    version: 1,
  },
  {
    id: 'S1-L24',
    block: 'funciones',
    slug: 'fechas-y-nvl',
    title: 'Fechas, SYSDATE y NVL',
    shortTitle: 'Fechas y NVL',
    summary:
      'Sumar días a una fecha, calcular antigüedad con SYSDATE y reemplazar NULL con NVL para que un cálculo no se pierda.',
    concepts: ['date-arithmetic', 'sysdate', 'nvl'],
    purpose: 'Calcular plazos y antigüedad, y evitar que un NULL anule una suma.',
    syntax: lines(
      'fecha + número        -- suma días',
      'fecha1 - fecha2       -- días entre fechas',
      'SYSDATE               -- fecha y hora actuales',
      'NVL(valor, reemplazo)',
    ),
    explanation: [
      'En Oracle, sumar un número a una fecha suma días, y restar dos fechas da los días que hay entre ellas. Dividir entre 365 y truncar da años completos aproximados.',
      "SYSDATE devuelve la fecha y hora actuales del servidor: SYSDATE - fecha_ingreso son los días trabajados hasta hoy. Como cambia cada día, los ejemplos verificados usan la fecha fija DATE '2026-10-01'.",
      'NVL(bono, 0) devuelve el bono si existe y 0 si es NULL. Así, salario + NVL(bono, 0) tiene valor para todos.',
    ],
    example: {
      question:
        '¿Cuándo termina el periodo de prueba de quienes ingresaron desde 2024 y cuántos años llevan?',
      example: 'S1-E-FECHAS',
      reading:
        'Suma 90 días a la fecha de ingreso y calcula los años completos hasta el 1 de octubre de 2026 (con SYSDATE sería hasta hoy).',
    },
    more: [
      {
        question: 'salario + bono frente a salario + NVL(bono, 0)',
        example: 'S1-E-NVL',
        reading:
          'Paula y Esteban no tienen bono: sin NVL su total es NULL; con NVL, su total es el salario.',
      },
      {
        question: 'NVL con texto: convertir antes de reemplazar.',
        example: 'S1-E-NVL-TEXTO',
        reading:
          "BONO es un número: TO_CHAR lo convierte en texto para poder reemplazar el NULL por 'sin bono'.",
      },
    ],
    changed: [
      'Aparecen FIN_PRUEBA (una fecha) y ANIOS (un número).',
      'Con NVL, ningún total queda en NULL.',
    ],
    mistakes: [
      {
        title: 'Restar fechas escritas como texto',
        why: "Usa DATE '2026-10-01' o SYSDATE: un texto no es una fecha.",
      },
      {
        title: 'NVL con tipos distintos',
        why: "NVL(bono, 'sin bono') falla porque BONO es número: usa NVL(TO_CHAR(bono), 'sin bono').",
      },
    ],
    check: {
      id: 'S1-L24-C',
      kind: 'choice',
      lesson: 'S1-L24',
      prompt: 'Paula gana 4.200.000 y no tiene bono (NULL). ¿Qué da salario + NVL(bono, 0)?',
      options: [
        {
          text: '4200000',
          code: true,
          correct: true,
          feedback: 'Correcto: NVL cambia el NULL por 0.',
        },
        { text: 'NULL', code: true, correct: false, feedback: 'Eso da salario + bono, sin NVL.' },
        {
          text: '0',
          code: true,
          correct: false,
          feedback: 'NVL reemplaza solo el bono, no toda la suma.',
        },
        {
          text: 'Un error',
          correct: false,
          feedback: 'NVL(bono, 0) es válido: los dos son números.',
        },
      ],
      hints: ['¿Qué devuelve NVL(NULL, 0)?', 'Después se suma al salario.'],
      explanation: 'NVL(NULL, 0) = 0, así que el total es 4.200.000 + 0.',
    },
    keyIdea: 'Fecha ± número = días; NVL pone un valor donde falta el dato.',
    topic: 'funciones',
    version: 1,
  },
];
