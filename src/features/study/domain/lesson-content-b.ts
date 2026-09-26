import type { LessonContent } from './lesson-types';

/**
 * Contenido de los bloques D–H (filtros, operadores, NULL, orden e integración). Redacción
 * propia a partir de Oracle Database 19c SQL Language Reference; los resultados y
 * recuentos los calcula el motor sobre `empleados-select-v2`.
 */

const INTEGRATED = `SELECT nombre, departamento, salario
FROM empleados
WHERE estado = 'ACTIVO'
  AND ciudad = 'Bogotá'
  AND salario BETWEEN 3000000 AND 6000000
ORDER BY salario DESC;`;

export const LESSON_CONTENT_B: readonly LessonContent[] = [
  {
    slug: 'where',
    oneLiner: 'WHERE decide qué filas quieres conservar.',
    whatItDoes:
      'WHERE va después de FROM y lleva una condición. Oracle la comprueba en cada fila: las que la cumplen pasan al resultado y las demás se descartan.',
    purpose:
      'Responder preguntas sobre una parte de los datos: los empleados de Cali, los activos o los que ganan más de cierto valor.',
    syntax: 'SELECT columnas\nFROM tabla\nWHERE condición;',
    syntaxReading:
      '«Muéstrame estas columnas de la tabla, solo de las filas en las que se cumpla la condición».',
    example: {
      question: '¿Quiénes trabajan en Cali?',
      sql: "SELECT nombre, cargo, ciudad\nFROM empleados\nWHERE ciudad = 'Cali';",
      reading: 'Muéstrame el nombre, el cargo y la ciudad de los empleados cuya ciudad es Cali.',
    },
    sourceColumns: ['NOMBRE', 'CARGO', 'CIUDAD', 'SALARIO'],
    changed: ['Solo quedan las filas de Cali: las demás se descartan.'],
    unchanged: [
      'Las columnas del resultado siguen siendo las de SELECT.',
      'Las filas descartadas siguen en la tabla.',
    ],
    terminology:
      'En álgebra relacional, quedarse con ciertas filas se llama selección (no confundir con SELECT, que elige columnas).',
    notes: [
      {
        title: '= compara',
        text: 'En una condición, = pregunta si dos valores son iguales; no asigna nada. En SQL se escribe con un solo signo.',
      },
    ],
    error: {
      title: 'Olvidar las comillas del texto',
      wrong: 'SELECT nombre\nFROM empleados\nWHERE ciudad = Cali;',
      why: 'Sin comillas, Oracle busca una columna llamada CALI. Los textos van entre comillas simples.',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';",
    },
    check: {
      kind: 'count',
      prompt: '¿Cuántas filas sobreviven a esta condición?',
      sql: "SELECT nombre\nFROM empleados\nWHERE estado = 'INACTIVO';",
      measure: 'rows',
      hints: [
        'WHERE conserva solo las filas que cumplen la condición.',
        'Busca en la columna ESTADO cuántas veces aparece INACTIVO.',
      ],
      explanation: 'Oscar Vega, Diego Ortiz y Alicia Paz están inactivos: 3 filas.',
    },
  },
  {
    slug: 'comparaciones',
    oneLiner:
      'Los operadores de comparación preguntan si un valor es igual, distinto, mayor o menor que otro.',
    whatItDoes:
      '= igual · <> y != distinto (Oracle también acepta ^=) · > mayor · >= mayor o igual · < menor · <= menor o igual. Los números se escriben sin comillas ni separadores; los textos, entre comillas simples y tal como están en la tabla.',
    purpose: "Filtrar por umbrales (salario > 5000000) o excluir un valor (ciudad <> 'Bogotá').",
    syntax: "WHERE columna >= valor\nWHERE columna <> 'texto'",
    syntaxReading: '«donde el salario sea mayor o igual que…», «donde la ciudad no sea…».',
    example: {
      question: '¿Quiénes ganan 5.000.000 o más?',
      sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario >= 5000000;',
      reading:
        'Muéstrame el nombre y el salario de los empleados cuyo salario es mayor o igual que 5.000.000.',
    },
    sourceColumns: ['NOMBRE', 'CIUDAD', 'SALARIO'],
    changed: [
      'Solo quedan quienes cumplen la comparación; con >= el propio límite también cumple.',
    ],
    unchanged: ['El número se escribe 5000000: sin puntos de miles ni símbolo de moneda.'],
    comparisons: [
      {
        label: 'Distinto de',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad <> 'Bogotá';",
        note: '<> y != significan lo mismo: quedan quienes no están en Bogotá.',
      },
      {
        label: 'Con fechas',
        sql: "SELECT nombre, fecha_ingreso\nFROM empleados\nWHERE fecha_ingreso >= DATE '2022-01-01';",
        note: "Las fechas se comparan con un literal DATE 'AAAA-MM-DD'. Otros formatos requieren TO_DATE (Nivel 2).",
      },
    ],
    notes: [
      {
        title: 'Textos exactos',
        text: "Oracle compara los textos letra por letra: 'bogota' no es igual a 'Bogotá'. Las mayúsculas y las tildes cuentan.",
      },
    ],
    error: {
      title: 'Comillas dobles para un texto',
      wrong: 'SELECT nombre\nFROM empleados\nWHERE ciudad = "Medellín";',
      why: 'Las comillas dobles nombran columnas o alias; los textos van entre comillas simples.',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Medellín';",
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué condición encuentra a los empleados de Medellín?',
      options: [
        {
          text: "ciudad = 'Medellín'",
          code: true,
          correct: true,
          feedback: 'Sí: texto entre comillas simples y escrito como en la tabla.',
        },
        {
          text: 'ciudad = Medellín',
          code: true,
          correct: false,
          feedback: 'Sin comillas, Oracle busca una columna llamada MEDELLÍN.',
        },
        {
          text: 'ciudad = "Medellín"',
          code: true,
          correct: false,
          feedback: 'Las comillas dobles son para nombres de columnas o alias.',
        },
        {
          text: "ciudad == 'Medellín'",
          code: true,
          correct: false,
          feedback: 'En SQL la igualdad se escribe con un solo =.',
        },
      ],
      hints: [
        'Piensa en cómo se escribe un texto en SQL.',
        'Los textos van entre comillas simples y la igualdad es un solo =.',
      ],
      explanation: "ciudad = 'Medellín' — comillas simples y un solo signo igual.",
    },
  },
  {
    slug: 'and-or',
    oneLiner: 'AND exige que se cumplan todas las condiciones; OR, que se cumpla al menos una.',
    whatItDoes:
      'AND y OR unen condiciones completas. Con AND, una fila pasa solo si cumple las dos. Con OR, pasa si cumple una, la otra o ambas. NOT, delante de una condición, la invierte.',
    purpose:
      'Hacer preguntas más precisas: empleados de Bogotá y con salario alto (AND), o empleados de Cali o de Barranquilla (OR).',
    syntax: 'WHERE condición1 AND condición2\nWHERE condición1 OR condición2',
    syntaxReading: 'AND se lee «y además»; OR, «o bien».',
    example: {
      question: '¿Qué empleados de Bogotá ganan más de 5.000.000?',
      sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá'\n  AND salario > 5000000;",
      reading:
        'Muéstrame el nombre, la ciudad y el salario de los empleados cuya ciudad es Bogotá y cuyo salario es mayor que 5.000.000.',
    },
    changed: ['Con AND quedan menos filas que con cada condición por separado.'],
    unchanged: ['Cada lado de AND u OR es una condición completa, con su propia comparación.'],
    comparisons: [
      {
        label: 'Con OR',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali'\n   OR ciudad = 'Barranquilla';",
        note: 'Pasan las filas de cualquiera de las dos ciudades.',
      },
      {
        label: 'AND imposible',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali'\n  AND ciudad = 'Barranquilla';",
        note: 'Nadie trabaja en dos ciudades a la vez: con AND no queda ninguna fila. Aquí se necesitaba OR.',
      },
      {
        label: 'Con NOT',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE NOT ciudad = 'Bogotá';",
        note: 'NOT invierte la condición: quedan los empleados que no trabajan en Bogotá.',
      },
    ],
    error: {
      title: 'Condición incompleta después de OR',
      wrong: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali' OR 'Bogotá';",
      why: 'Cada lado de OR debe ser una condición completa: falta repetir ciudad =.',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali' OR ciudad = 'Bogotá';",
    },
    check: {
      kind: 'count',
      prompt: '¿Cuántas filas devuelve esta consulta?',
      sql: "SELECT nombre\nFROM empleados\nWHERE departamento = 'TI'\n  AND estado = 'ACTIVO';",
      measure: 'rows',
      hints: [
        'Con AND, la fila tiene que cumplir las dos condiciones.',
        'Busca a los empleados de TI y descarta a los inactivos.',
      ],
      explanation: 'TI tiene 5 empleados y Oscar Vega está inactivo: quedan 4.',
    },
  },
  {
    slug: 'parentesis',
    oneLiner: 'Oracle evalúa AND antes que OR; los paréntesis dejan clara la intención.',
    whatItDoes:
      'En una condición se aplica primero NOT, luego AND y al final OR, igual que la multiplicación va antes que la suma. Lo que está entre paréntesis se evalúa primero. NOT invierte la condición que le sigue.',
    purpose:
      'Evitar resultados sorpresa: dos condiciones que parecen iguales pueden devolver filas distintas.',
    syntax: 'WHERE (condición1 OR condición2)\n  AND condición3',
    syntaxReading: '«donde se cumpla la 1 o la 2 y, además, la 3».',
    example: {
      question: '¿Qué empleados de Bogotá o de Medellín ganan más de 5.000.000?',
      sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
      reading:
        'Muéstrame el nombre, la ciudad y el salario de los empleados de Bogotá o Medellín cuyo salario es mayor que 5.000.000.',
    },
    changed: ['Con paréntesis, el filtro de salario se aplica a las dos ciudades.'],
    unchanged: ['Las condiciones son las mismas: solo cambia cómo se agrupan.'],
    comparisons: [
      {
        label: 'Sin paréntesis',
        sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá' OR ciudad = 'Medellín'\n  AND salario > 5000000;",
        note: "Oracle lo lee como ciudad = 'Bogotá' OR (ciudad = 'Medellín' AND salario > 5000000): entran todos los de Bogotá, ganen lo que ganen.",
      },
      {
        label: 'NOT',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE NOT (ciudad = 'Bogotá' OR ciudad = 'Medellín');",
        note: 'NOT invierte la condición completa: quedan los empleados de las otras ciudades.',
      },
    ],
    error: {
      title: 'Olvidar los paréntesis al mezclar AND y OR',
      wrong:
        "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Bogotá' OR ciudad = 'Medellín'\n  AND salario > 5000000;",
      why: 'AND se aplica antes que OR: el filtro de salario solo afecta a Medellín. El laboratorio lo advierte.',
      right:
        "SELECT nombre\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
    },
    check: {
      kind: 'choice',
      prompt:
        '¿Qué condición devuelve a los empleados de TI o de Ventas que ganan más de 4.000.000?',
      options: [
        {
          text: "(departamento = 'TI' OR departamento = 'Ventas') AND salario > 4000000",
          code: true,
          correct: true,
          feedback: 'Sí: los paréntesis hacen que el salario se exija en los dos departamentos.',
        },
        {
          text: "departamento = 'TI' OR departamento = 'Ventas' AND salario > 4000000",
          code: true,
          correct: false,
          feedback: 'Sin paréntesis, AND va primero: entrarían todos los de TI.',
        },
        {
          text: "departamento = 'TI' AND departamento = 'Ventas' AND salario > 4000000",
          code: true,
          correct: false,
          feedback: 'Nadie está en dos departamentos a la vez: no devuelve filas.',
        },
      ],
      hints: [
        'Primero decide cómo unir los dos departamentos y después añade el salario.',
        'AND se evalúa antes que OR: agrupa el OR con paréntesis.',
      ],
      explanation:
        'Los paréntesis agrupan el OR; después, AND exige el salario a ambos departamentos.',
    },
  },
  {
    slug: 'between',
    oneLiner: 'BETWEEN conserva los valores de un rango, con los dos límites incluidos.',
    whatItDoes:
      'columna BETWEEN a AND b equivale a columna >= a AND columna <= b. El primer límite es el menor. NOT BETWEEN deja los valores que quedan fuera del rango.',
    purpose:
      'Filtrar rangos de salarios, de fechas o de identificadores con una sola condición fácil de leer.',
    syntax: 'WHERE columna BETWEEN menor AND mayor',
    syntaxReading: '«donde el valor esté entre menor y mayor, los dos incluidos».',
    example: {
      question: '¿Quiénes ganan entre 3.000.000 y 6.000.000?',
      sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
      reading:
        'Muéstrame el nombre y el salario de los empleados cuyo salario está entre 3.000.000 y 6.000.000, ambos incluidos.',
    },
    sourceColumns: ['NOMBRE', 'APELLIDO', 'SALARIO'],
    changed: [
      'Sofía López (3.000.000) y María Ruiz (6.000.000) están justo en los límites y sí aparecen.',
    ],
    unchanged: ['Valentina Ríos (2.900.000) y Daniela Suárez (6.100.000) quedan fuera por poco.'],
    comparisons: [
      {
        label: 'Equivalente con >= y <=',
        sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario >= 3000000\n  AND salario <= 6000000;',
        note: 'Mismo resultado: BETWEEN es la forma corta.',
      },
      {
        label: 'NOT BETWEEN',
        sql: 'SELECT nombre, salario\nFROM empleados\nWHERE salario NOT BETWEEN 3000000 AND 6000000;',
        note: 'Quedan los empleados de fuera del rango.',
      },
      {
        label: 'Con fechas',
        sql: "SELECT nombre, fecha_ingreso\nFROM empleados\nWHERE fecha_ingreso BETWEEN DATE '2020-01-01' AND DATE '2021-12-31';",
        note: 'El mismo operador con literales DATE. Los formatos de fecha con TO_DATE llegan en el Nivel 2.',
      },
    ],
    error: {
      title: 'Escribir los límites al revés',
      wrong: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;',
      why: 'El primer límite debe ser el menor. Con los límites al revés ninguna fila cumple, y Oracle no da error: devuelve un resultado vacío.',
      right: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
    },
    check: {
      kind: 'count',
      prompt: '¿Cuántos empleados cumplen esta condición?',
      sql: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 4000000 AND 5000000;',
      measure: 'rows',
      hints: [
        'Los dos límites cuentan: 4.000.000 y 5.000.000 están incluidos.',
        'Busca los salarios de 4.000.000 a 5.000.000 en la columna SALARIO.',
      ],
      explanation: 'Andrés y Paula (4.200.000), Camila (4.500.000) y Alicia (4.800.000): 4 filas.',
    },
  },
  {
    slug: 'in',
    oneLiner: 'IN comprueba si un valor está en una lista: es un atajo de varios OR.',
    whatItDoes:
      'columna IN (v1, v2, v3) equivale a columna = v1 OR columna = v2 OR columna = v3. La lista va entre paréntesis y separada por comas. NOT IN deja las filas cuyo valor no está en la lista.',
    purpose:
      'Filtrar por varias categorías sin repetir la columna: varias ciudades o varios departamentos.',
    syntax: 'WHERE columna IN (valor1, valor2, valor3)',
    syntaxReading: '«donde la ciudad sea alguna de estas».',
    example: {
      question: '¿Quiénes trabajan en Bogotá, Medellín o Cali?',
      sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Medellín', 'Cali');",
      reading:
        'Muéstrame el nombre y la ciudad de los empleados cuya ciudad es Bogotá, Medellín o Cali.',
    },
    changed: ['Quedan las filas de las tres ciudades de la lista.'],
    unchanged: ['Barranquilla y Valledupar no están en la lista y quedan fuera.'],
    comparisons: [
      {
        label: 'La misma condición con OR',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Bogotá'\n   OR ciudad = 'Medellín'\n   OR ciudad = 'Cali';",
        note: 'Mismo resultado, más largo de escribir.',
      },
      {
        label: 'NOT IN',
        sql: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad NOT IN ('Bogotá', 'Medellín', 'Cali');",
        note: 'Quedan los empleados de Barranquilla y Valledupar.',
      },
    ],
    notes: [
      {
        title: 'NOT IN y NULL',
        text: 'Si la columna es NULL en una fila, NOT IN no la incluye. Y si la lista contiene un NULL, NOT IN no devuelve ninguna fila: con un valor ausente nunca se puede afirmar «no está en la lista».',
      },
    ],
    error: {
      title: 'Olvidar los paréntesis de la lista',
      wrong: "SELECT nombre\nFROM empleados\nWHERE ciudad IN 'Bogotá', 'Cali';",
      why: 'La lista de IN siempre va entre paréntesis.',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Cali');",
    },
    check: {
      kind: 'choice',
      prompt: "¿Qué condición equivale a departamento = 'TI' OR departamento = 'Finanzas'?",
      options: [
        {
          text: "departamento IN ('TI', 'Finanzas')",
          code: true,
          correct: true,
          feedback: 'Sí: IN resume la cadena de OR.',
        },
        {
          text: "departamento IN 'TI', 'Finanzas'",
          code: true,
          correct: false,
          feedback: 'A la lista le faltan los paréntesis.',
        },
        {
          text: "departamento = ('TI', 'Finanzas')",
          code: true,
          correct: false,
          feedback: '= compara con un solo valor; para una lista se usa IN.',
        },
        {
          text: "departamento BETWEEN 'TI' AND 'Finanzas'",
          code: true,
          correct: false,
          feedback: 'BETWEEN es un rango, no una lista.',
        },
      ],
      hints: [
        'Busca el operador que compara con una lista.',
        'La lista va entre paréntesis y separada por comas.',
      ],
      explanation: "departamento IN ('TI', 'Finanzas') es la forma corta de los dos OR.",
    },
  },
  {
    slug: 'like',
    oneLiner:
      'LIKE busca textos que siguen un patrón: % es cualquier cantidad de caracteres y _ exactamente uno.',
    whatItDoes:
      "El patrón es un texto entre comillas simples con comodines. 'A%' empieza por A; '%a' termina en a; '%ar%' contiene ar; '_o%' tiene una o en la segunda posición. LIKE distingue mayúsculas, minúsculas y tildes. NOT LIKE deja lo que no sigue el patrón.",
    purpose:
      'Buscar por una parte del texto: nombres que empiezan por una letra, correos de un dominio o apellidos con cierta forma.',
    syntax: "WHERE columna LIKE 'patrón'",
    syntaxReading: '«donde el nombre se parezca a este patrón».',
    example: {
      question: '¿Qué empleados tienen «ar» en su nombre?',
      sql: "SELECT nombre, apellido\nFROM empleados\nWHERE nombre LIKE '%ar%';",
      reading: 'Muéstrame el nombre y el apellido de los empleados cuyo nombre contiene «ar».',
    },
    sourceColumns: ['NOMBRE', 'APELLIDO', 'CIUDAD'],
    changed: ['Cada nombre que aparece tiene «ar» en alguna posición; la tabla lo marca.'],
    unchanged: ['LIKE no cambia los textos: solo decide qué filas pasan.'],
    comparisons: [
      {
        label: 'Empieza por A',
        sql: "SELECT nombre, apellido\nFROM empleados\nWHERE nombre LIKE 'A%';",
        note: 'El % puede representar muchos caracteres, uno o ninguno.',
      },
      {
        label: 'Termina en a',
        sql: "SELECT nombre, apellido\nFROM empleados\nWHERE nombre LIKE '%a';",
        note: 'El comodín va al principio: cualquier comienzo y una a al final.',
      },
      {
        label: 'Un carácter exacto con _',
        sql: "SELECT nombre, apellido\nFROM empleados\nWHERE apellido LIKE 'R___';",
        note: "Cada _ es exactamente un carácter: Ruiz y Ríos tienen 4 letras. Rojas tiene 5 y queda fuera; con 'R%' entraría.",
      },
      {
        label: 'NOT LIKE',
        sql: "SELECT nombre, apellido\nFROM empleados\nWHERE nombre NOT LIKE 'A%';",
        note: 'Todos menos los nombres que empiezan por A.',
      },
    ],
    notes: [
      {
        title: 'Mayúsculas y tildes',
        text: "LIKE 'a%' no encuentra a Ana, porque su A es mayúscula. Y '_o%' no encuentra a Gómez: su segunda letra es ó, no o. Las funciones UPPER y LOWER (Nivel 2) permiten buscar sin distinguir mayúsculas.",
      },
    ],
    error: {
      title: 'Olvidar las comillas del patrón',
      wrong: 'SELECT nombre\nFROM empleados\nWHERE nombre LIKE A%;',
      why: 'El patrón es un texto: va entre comillas simples.',
      right: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';",
    },
    check: {
      kind: 'choice',
      prompt: "¿Qué nombres encuentra nombre LIKE '_a%'?",
      options: [
        {
          text: 'Los que tienen una a en la segunda posición, como Laura o María',
          correct: true,
          feedback: 'Sí: _ ocupa la primera posición y después va la a.',
        },
        {
          text: 'Los que empiezan por a',
          correct: false,
          feedback: '_ ocupa la primera posición con cualquier carácter.',
        },
        {
          text: 'Los que terminan en a',
          correct: false,
          feedback: 'Para terminar en a, el patrón sería %a.',
        },
      ],
      hints: [
        '_ representa exactamente un carácter.',
        'Lee el patrón de izquierda a derecha: un carácter cualquiera, una a y después lo que sea.',
      ],
      explanation: "'_a%' = un carácter, una a y cualquier resto: Laura, María, Mario, Camila…",
    },
  },
  {
    slug: 'null',
    oneLiner: 'NULL significa que no hay valor; se pregunta por él con IS NULL.',
    whatItDoes:
      'NULL no es 0, ni un texto con espacios, ni la palabra «desconocido»: es la ausencia de valor. Cualquier comparación con NULL (=, <>, >…) da un resultado desconocido, que WHERE trata como no cumplido. Para preguntar si falta un valor se usa IS NULL, y para lo contrario, IS NOT NULL.',
    purpose:
      'Encontrar datos incompletos, como los empleados sin bono asignado, o excluirlos de un listado.',
    syntax: 'WHERE columna IS NULL\nWHERE columna IS NOT NULL',
    syntaxReading: '«donde el bono esté vacío» y «donde el bono tenga valor».',
    example: {
      question: '¿Qué empleados no tienen bono asignado?',
      sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;',
      reading: 'Muéstrame el nombre y el bono de los empleados cuyo bono está vacío (es NULL).',
    },
    sourceColumns: ['NOMBRE', 'APELLIDO', 'BONO', 'ID_JEFE'],
    changed: ['Quedan los empleados cuyo BONO es NULL.'],
    unchanged: ['Las celdas NULL siguen vacías: la consulta no les pone ningún valor.'],
    comparisons: [
      {
        label: 'El error clásico: = NULL',
        sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono = NULL;',
        note: 'Es SQL válido, pero la condición nunca se cumple: no devuelve ninguna fila.',
      },
      {
        label: '0 no es NULL',
        sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono = 0;',
        note: 'Mario Soto tiene bono 0: es un valor, no una ausencia.',
      },
      {
        label: 'IS NOT NULL',
        sql: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NOT NULL;',
        note: 'Los que sí tienen bono, incluido el 0 de Mario.',
      },
    ],
    notes: [
      {
        title: 'En Oracle, el texto vacío es NULL',
        text: "Oracle trata un texto vacío '' como NULL, así que WHERE correo = '' tampoco encuentra nada. La documentación de Oracle recomienda no depender de esa equivalencia.",
      },
      {
        title: 'NULL en cálculos',
        text: 'Un cálculo con NULL da NULL: salario + bono no tiene valor para quien no tiene bono. NVL y COALESCE (Nivel 2) permiten reemplazarlo.',
      },
    ],
    error: {
      title: 'Comparar con = NULL',
      wrong: 'SELECT nombre\nFROM empleados\nWHERE bono = NULL;',
      why: 'Una comparación con NULL nunca es verdadera: la consulta no devuelve filas. El laboratorio lo advierte.',
      right: 'SELECT nombre\nFROM empleados\nWHERE bono IS NULL;',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué condición muestra a los empleados sin bono asignado?',
      options: [
        {
          text: 'bono IS NULL',
          code: true,
          correct: true,
          feedback: 'Sí: IS NULL pregunta por la ausencia de valor.',
        },
        {
          text: 'bono = NULL',
          code: true,
          correct: false,
          feedback: 'Una comparación con NULL nunca es verdadera: devolvería 0 filas.',
        },
        {
          text: 'bono = 0',
          code: true,
          correct: false,
          feedback: '0 es un valor: encontraría solo a Mario Soto.',
        },
        {
          text: "bono = ''",
          code: true,
          correct: false,
          feedback: "En Oracle, '' es NULL: la comparación tampoco es verdadera.",
        },
      ],
      hints: [
        'NULL no se compara con =.',
        'Hay una forma especial de preguntar si algo es NULL: con IS.',
      ],
      explanation: 'bono IS NULL encuentra los 6 empleados sin bono asignado.',
    },
  },
  {
    slug: 'order-by',
    oneLiner: 'ORDER BY ordena las filas del resultado.',
    whatItDoes:
      'Va al final de la consulta. ASC ordena de menor a mayor (A→Z, fechas antiguas primero) y es el valor por defecto; DESC ordena al revés. Con varias columnas, la segunda solo decide cuando la primera empata.',
    purpose:
      'Presentar rankings y listados legibles: salarios de mayor a menor o empleados agrupados por departamento.',
    syntax: 'ORDER BY columna1 ASC, columna2 DESC',
    syntaxReading:
      '«ordenados por columna1 de menor a mayor y, cuando empaten, por columna2 de mayor a menor».',
    example: {
      question: '¿Cuál es el salario de cada empleado, del más alto al más bajo?',
      sql: 'SELECT nombre, departamento, salario\nFROM empleados\nORDER BY salario DESC;',
      reading:
        'Muéstrame el nombre, el departamento y el salario de todos los empleados, ordenados por salario de mayor a menor.',
    },
    changed: ['Las filas cambian de posición: el salario más alto queda arriba.'],
    unchanged: ['ORDER BY no filtra: siguen las 20 filas con los mismos valores.'],
    comparisons: [
      {
        label: 'Varias columnas',
        sql: 'SELECT departamento, nombre, salario\nFROM empleados\nORDER BY departamento ASC, salario DESC;',
        note: 'Primero por departamento (A→Z) y, dentro de cada uno, por salario de mayor a menor.',
      },
      {
        label: 'Por un alias',
        sql: 'SELECT nombre, salario * 12 AS salario_anual\nFROM empleados\nORDER BY salario_anual DESC;',
        note: 'ORDER BY sí puede usar los alias de SELECT.',
      },
      {
        label: 'DISTINCT no es ORDER BY',
        sql: 'SELECT DISTINCT ciudad\nFROM empleados\nORDER BY ciudad;',
        note: 'DISTINCT quita repetidas y ORDER BY ordena: son operaciones distintas y se pueden combinar.',
      },
    ],
    notes: [
      {
        title: 'Empates y NULL',
        text: 'Si dos filas empatan (Andrés y Paula ganan 4.200.000), su orden relativo no está garantizado: añade otra columna para desempatar. En Oracle, los NULL van al final con ASC y al principio con DESC; NULLS FIRST y NULLS LAST lo cambian.',
      },
      {
        title: 'Orden de los textos',
        text: 'El orden de los textos depende de la configuración de idioma de la sesión (NLS_SORT). Este laboratorio usa el orden binario: las mayúsculas van antes que las minúsculas y las letras con tilde después (Mario antes que María).',
      },
      {
        title: 'Sin ORDER BY',
        text: 'Sin ORDER BY, Oracle no promete ningún orden, aunque el resultado parezca ordenado.',
      },
    ],
    error: {
      title: 'Escribir ORDER BY antes de WHERE',
      wrong:
        "SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC\nWHERE estado = 'ACTIVO';",
      why: 'ORDER BY va al final: primero se eligen las filas con WHERE y después se ordenan.',
      right:
        "SELECT nombre, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\nORDER BY salario DESC;",
    },
    check: {
      kind: 'order',
      prompt: 'Ordena las piezas para listar nombre y salario, del salario más alto al más bajo.',
      pieces: ['SELECT nombre, salario', 'FROM empleados', 'ORDER BY salario', 'DESC'],
      hints: [
        'ORDER BY va al final de la consulta.',
        'La dirección (DESC) se escribe después de la columna por la que se ordena.',
      ],
      explanation: 'SELECT nombre, salario FROM empleados ORDER BY salario DESC;',
    },
  },
  {
    slug: 'consulta-completa',
    oneLiner:
      'Una consulta completa se escribe en un orden fijo y se entiende mejor con el modelo lógico.',
    whatItDoes:
      'Orden de escritura: SELECT, FROM, WHERE, ORDER BY. Para entenderla conviene leerla en orden lógico: FROM (de dónde), WHERE (qué filas), SELECT (qué columnas y cálculos), DISTINCT (sin repetidas) y ORDER BY (en qué orden). Es un modelo mental: el optimizador de Oracle puede ejecutarla con otro plan y obtiene el mismo resultado.',
    purpose: 'Pasar de una pregunta en español a una consulta correcta, cláusula a cláusula.',
    syntax: 'SELECT columnas\nFROM tabla\nWHERE condición\nORDER BY columna;',
    syntaxReading: 'Cada cláusula responde una pregunta: qué, de dónde, qué filas y en qué orden.',
    example: {
      question:
        'Quiero ver nombre, departamento y salario de los empleados activos de Bogotá con salario entre 3.000.000 y 6.000.000, del mayor al menor salario.',
      sql: INTEGRATED,
      reading:
        'Muéstrame el nombre, el departamento y el salario de los empleados activos de Bogotá con salario de 3.000.000 a 6.000.000, ordenados por salario de mayor a menor.',
    },
    sourceColumns: ['NOMBRE', 'DEPARTAMENTO', 'CIUDAD', 'SALARIO', 'ESTADO'],
    steps: [
      {
        label: 'Paso 1 · FROM',
        sql: 'SELECT *\nFROM empleados;',
        note: 'Partimos de la tabla completa.',
      },
      {
        label: 'Paso 2 · SELECT',
        sql: 'SELECT nombre, departamento, salario\nFROM empleados;',
        note: 'Elegimos las columnas de la pregunta.',
      },
      {
        label: 'Paso 3 · WHERE',
        sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO';",
        note: 'Solo los empleados activos.',
      },
      {
        label: 'Paso 4 · AND',
        sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá';",
        note: 'Además, de Bogotá.',
      },
      {
        label: 'Paso 5 · BETWEEN',
        sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 3000000 AND 6000000;",
        note: 'Además, con salario en el rango. Diego Ortiz queda fuera por estar inactivo.',
      },
      {
        label: 'Paso 6 · ORDER BY',
        sql: INTEGRATED,
        note: 'Por último, del mayor al menor salario.',
      },
    ],
    changed: ['De 20 filas quedan 3, con 3 columnas y ordenadas de mayor a menor salario.'],
    unchanged: ['La tabla EMPLEADOS no cambia en ningún paso.'],
    notes: [
      {
        title: 'Orden de escritura y orden lógico',
        text: 'Se escribe SELECT → FROM → WHERE → ORDER BY, pero se entiende FROM → WHERE → SELECT → DISTINCT → ORDER BY. Por eso WHERE no puede usar un alias de SELECT (todavía no existe) y ORDER BY sí.',
      },
    ],
    error: {
      title: 'Cláusulas fuera de orden',
      wrong: "SELECT nombre, departamento, salario\nWHERE estado = 'ACTIVO'\nFROM empleados;",
      why: 'WHERE va después de FROM: el orden de escritura es SELECT, FROM, WHERE y ORDER BY.',
      right: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO';",
    },
    check: {
      kind: 'order',
      prompt: 'Arrastra las cláusulas al orden en que se escriben.',
      pieces: ['SELECT nombre', 'FROM empleados', "WHERE ciudad = 'Cali'", 'ORDER BY nombre'],
      hints: [
        'La consulta empieza diciendo qué mostrar.',
        'Después de la tabla van el filtro y, al final, el orden.',
      ],
      explanation: "SELECT nombre FROM empleados WHERE ciudad = 'Cali' ORDER BY nombre;",
    },
  },
  {
    slug: 'errores-frecuentes',
    oneLiner: 'Reconocer un error a tiempo es tan importante como escribir bien la consulta.',
    whatItDoes:
      'Algunos errores impiden ejecutar la consulta (sintaxis). Otros la dejan ejecutarse, pero con un resultado que no responde la pregunta: una coma olvidada o un = NULL. El laboratorio distingue los dos casos y muestra dónde está el problema.',
    purpose: 'Leer los mensajes del laboratorio y corregir rápido, sin adivinar.',
    syntax: 'SELECT … FROM … WHERE … ORDER BY …;',
    syntaxReading:
      'Si algo falla, revisa en este orden: cláusulas, comas, comillas, operadores y NULL.',
    example: {
      question: '¿Por qué esta consulta muestra una sola columna?',
      sql: 'SELECT nombre salario\nFROM empleados;',
      reading: 'Sin coma, Oracle entiende «muéstrame el nombre con el encabezado SALARIO».',
    },
    sourceColumns: ['NOMBRE', 'SALARIO'],
    changed: ['El resultado tiene una sola columna, llamada SALARIO, con los nombres.'],
    unchanged: ['No hay error de sintaxis: por eso el laboratorio lo muestra como advertencia.'],
    catalog: [
      {
        title: 'Olvidar FROM',
        wrong: 'SELECT nombre, salario;',
        why: 'Sin FROM, la consulta no dice de qué tabla salen los datos.',
        right: 'SELECT nombre, salario\nFROM empleados;',
      },
      {
        title: 'Olvidar una coma',
        wrong: 'SELECT nombre salario\nFROM empleados;',
        why: 'La segunda columna se lee como alias de la primera.',
        right: 'SELECT nombre, salario\nFROM empleados;',
      },
      {
        title: 'Usar mal las comillas',
        wrong: 'SELECT nombre\nFROM empleados\nWHERE ciudad = "Cali";',
        why: 'Los textos van entre comillas simples; las dobles son para nombres de columnas o alias.',
        right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';",
      },
      {
        title: 'Escribir = NULL',
        wrong: 'SELECT nombre\nFROM empleados\nWHERE bono = NULL;',
        why: 'Una comparación con NULL nunca es verdadera.',
        right: 'SELECT nombre\nFROM empleados\nWHERE bono IS NULL;',
      },
      {
        title: 'Alias con espacios sin comillas',
        wrong: 'SELECT salario * 12 AS salario anual\nFROM empleados;',
        why: 'Un alias con espacios va entre comillas dobles; o se une con guion bajo.',
        right: 'SELECT salario * 12 AS salario_anual\nFROM empleados;',
      },
      {
        title: 'Confundir AND con OR',
        wrong: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali' AND ciudad = 'Bogotá';",
        why: 'Nadie trabaja en dos ciudades a la vez: con AND no queda ninguna fila.',
        right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali' OR ciudad = 'Bogotá';",
      },
      {
        title: 'Olvidar los paréntesis al mezclar AND y OR',
        wrong:
          "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali' OR ciudad = 'Bogotá' AND salario > 5000000;",
        why: 'AND va antes que OR: el filtro de salario solo afecta a Bogotá.',
        right:
          "SELECT nombre\nFROM empleados\nWHERE (ciudad = 'Cali' OR ciudad = 'Bogotá')\n  AND salario > 5000000;",
      },
      {
        title: 'BETWEEN al revés',
        wrong: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;',
        why: 'El primer límite es el menor; al revés no devuelve filas.',
        right: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
      },
      {
        title: 'IN sin paréntesis',
        wrong: "SELECT nombre\nFROM empleados\nWHERE ciudad IN 'Bogotá', 'Cali';",
        why: 'La lista de IN va entre paréntesis.',
        right: "SELECT nombre\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Cali');",
      },
      {
        title: 'Patrón de LIKE incorrecto',
        wrong: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'a%';",
        why: 'LIKE distingue mayúsculas: ningún nombre empieza por a minúscula.',
        right: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';",
      },
      {
        title: 'Usar un alias en WHERE',
        wrong: 'SELECT nombre, salario * 12 AS anual\nFROM empleados\nWHERE anual > 60000000;',
        why: 'WHERE se aplica antes de que exista el alias (Oracle da ORA-00904).',
        right:
          'SELECT nombre, salario * 12 AS anual\nFROM empleados\nWHERE salario * 12 > 60000000;',
      },
      {
        title: 'Confundir DISTINCT con ORDER BY',
        wrong: 'SELECT DISTINCT salario\nFROM empleados;',
        why: 'DISTINCT no ordena: quita repetidas. Para un ranking se usa ORDER BY.',
        right: 'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;',
      },
    ],
    error: {
      title: 'Leer solo la primera línea del mensaje',
      why: 'El diagnóstico indica la línea, la columna y el fragmento donde está el problema, y a menudo propone una corrección. Léelo completo antes de cambiar la consulta.',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué está mal en esta consulta?',
      sql: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;',
      options: [
        {
          text: 'Los límites están al revés: el menor va primero',
          correct: true,
          feedback: 'Exacto: así no hay ningún valor que cumpla la condición.',
        },
        {
          text: 'BETWEEN no existe en Oracle',
          correct: false,
          feedback: 'BETWEEN es SQL válido en Oracle; el problema son los límites.',
        },
        {
          text: 'Los números necesitan comillas',
          correct: false,
          feedback: 'Los números se escriben sin comillas.',
        },
      ],
      hints: [
        'La consulta se ejecuta, pero no devuelve filas.',
        '¿Qué número puede ser a la vez mayor que 6.000.000 y menor que 3.000.000?',
      ],
      explanation: 'BETWEEN 3000000 AND 6000000: el primer límite siempre es el menor.',
    },
  },
];
