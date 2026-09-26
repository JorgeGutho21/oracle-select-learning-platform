import type { LessonContent } from './lesson-types';

/**
 * Contenido de los bloques A–C (fundamentos, primera consulta y duplicados). Redacción
 * propia a partir de Oracle Database 19c SQL Language Reference; los resultados y
 * recuentos los calcula el motor sobre `empleados-select-v2`.
 */
export const LESSON_CONTENT_A: readonly LessonContent[] = [
  {
    slug: 'introduccion',
    oneLiner: 'SQL es el lenguaje con el que se le piden datos a una base de datos.',
    whatItDoes:
      'Una base de datos guarda la información en tablas. Cada tabla tiene filas (un registro: por ejemplo, un empleado) y columnas (un mismo dato de todos: por ejemplo, la ciudad). Con SQL describes qué datos quieres y la base de datos te los devuelve como una tabla de resultado.',
    purpose:
      'Sirve para responder preguntas sobre datos guardados: quién trabaja en Cali, cuánto gana cada persona, quién ingresó primero. SQL también puede crear tablas y modificar datos, pero esta unidad se dedica a consultar: SELECT solo lee.',
    syntax: 'SELECT columnas\nFROM tabla;',
    syntaxReading:
      '«Muéstrame estas columnas de esta tabla». Las palabras clave, como SELECT y FROM, están en inglés y Oracle no distingue si las escribes en mayúsculas o minúsculas.',
    example: {
      question: '¿Cómo se llaman los empleados de la empresa?',
      sql: 'SELECT nombre\nFROM empleados;',
      reading: 'Muéstrame el nombre de todos los empleados.',
    },
    sourceColumns: ['ID_EMPLEADO', 'NOMBRE', 'APELLIDO', 'CIUDAD'],
    changed: ['El resultado es una tabla nueva y temporal: solo tiene la columna NOMBRE.'],
    unchanged: ['La tabla EMPLEADOS sigue igual: consultar no modifica ningún dato.'],
    notes: [
      {
        title: 'Consultar y modificar',
        text: 'SQL tiene sentencias para consultar (SELECT), para modificar datos (INSERT, UPDATE y DELETE) y para crear estructuras (CREATE TABLE). Las de modificación se estudian en los niveles 6 y 7; el laboratorio de esta unidad nunca las ejecuta.',
      },
    ],
    terminology:
      'En el modelo relacional, a las filas también se les llama registros o tuplas, y a las columnas, atributos.',
    error: {
      title: 'Creer que SELECT cambia la tabla',
      why: 'SELECT solo lee: cada consulta produce un resultado nuevo y la tabla queda intacta. Para cambiar datos existen otras sentencias, que llegan en el Nivel 6.',
    },
    check: {
      kind: 'choice',
      prompt: 'En la tabla EMPLEADOS, ¿qué es una fila?',
      options: [
        {
          text: 'Un empleado con todos sus datos',
          correct: true,
          feedback: 'Exacto: cada fila es un registro, un empleado.',
        },
        {
          text: 'Un mismo dato de todos los empleados, como la ciudad',
          correct: false,
          feedback: 'Eso es una columna: reúne un dato de todos los empleados.',
        },
        {
          text: 'El nombre de la tabla',
          correct: false,
          feedback: 'EMPLEADOS es el nombre de la tabla; las filas son su contenido.',
        },
      ],
      hints: [
        'Piensa en una persona de la empresa: ¿dónde están todos sus datos juntos?',
        'Una columna reúne un dato de todos; una fila reúne todos los datos de uno.',
      ],
      explanation:
        'Fila = un registro (un empleado). Columna = un dato de todos (por ejemplo, CIUDAD).',
    },
  },
  {
    slug: 'empleados',
    oneLiner:
      'EMPLEADOS es la única tabla de la unidad: 20 empleados ficticios descritos por 12 columnas.',
    whatItDoes:
      'Cada columna tiene un tipo de dato de Oracle: NUMBER para números, VARCHAR2 para textos y DATE para fechas. El tipo decide qué puedes hacer: calcular con números, comparar textos entre comillas simples o comparar fechas con un literal DATE.',
    purpose:
      'Conocer la tabla antes de consultarla evita errores: saber que SALARIO es mensual, que BONO puede faltar o que ESTADO solo vale ACTIVO o INACTIVO.',
    syntax: 'SELECT *\nFROM empleados;',
    syntaxReading:
      '«Muéstrame todo lo que guarda EMPLEADOS»: la forma rápida de explorar una tabla.',
    example: {
      question: '¿Qué datos guarda la empresa de cada empleado?',
      sql: 'SELECT *\nFROM empleados;',
      reading: 'Muéstrame todas las columnas de todos los empleados.',
    },
    dictionary: true,
    fullTable: true,
    changed: ['Nada se transforma: el resultado muestra las 12 columnas y las 20 filas.'],
    unchanged: ['Las columnas conservan el orden en que se definieron en la tabla.'],
    notes: [
      {
        title: 'Datos pensados para aprender',
        text: 'Nombres, correos (en el dominio reservado empresa.example) y salarios son inventados. Están diseñados para practicar: hay salarios justo en los límites de un rango, bonos que faltan, un bono en 0 y nombres para buscar patrones.',
      },
      {
        title: 'Valores mensuales',
        text: 'SALARIO y BONO son mensuales, en pesos colombianos, y se escriben sin separadores: 3000000. Por eso el salario anual es salario * 12.',
      },
    ],
    error: {
      title: 'Confundir un valor vacío con cero',
      why: 'Un BONO en NULL significa que no hay bono asignado; el 0 de Mario Soto sí es un valor. El bloque F explica la diferencia.',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué columnas de EMPLEADOS pueden quedar sin valor (NULL)?',
      options: [
        {
          text: 'BONO e ID_JEFE',
          correct: true,
          feedback: 'Son las únicas que admiten NULL: bonos sin asignar y empleados sin jefe.',
        },
        {
          text: 'SALARIO y BONO',
          correct: false,
          feedback: 'SALARIO siempre tiene valor; revisa la columna ID_JEFE.',
        },
        { text: 'Todas', correct: false, feedback: 'La mayoría son obligatorias (NOT NULL).' },
        {
          text: 'Ninguna',
          correct: false,
          feedback: 'Busca las celdas que dicen NULL en la tabla.',
        },
      ],
      hints: [
        'Busca en la tabla las celdas que dicen NULL.',
        'Mira el diccionario de columnas: la columna «admite NULL».',
      ],
      explanation: 'BONO e ID_JEFE admiten NULL; las otras diez columnas son obligatorias.',
    },
  },
  {
    slug: 'select',
    oneLiner: 'SELECT indica qué columnas quieres ver en el resultado.',
    whatItDoes:
      'Después de SELECT escribes los nombres de las columnas. Oracle arma un resultado con esas columnas, en ese orden, y con todas las filas de la tabla mientras no haya un filtro.',
    purpose:
      'Ver solo los datos que necesitas: para una lista de contactos bastan el nombre y el correo.',
    syntax: 'SELECT columna1, columna2\nFROM tabla;',
    syntaxReading: '«Selecciona columna1 y columna2 de la tabla».',
    example: {
      question: '¿Cuál es el nombre y el correo de cada empleado?',
      sql: 'SELECT nombre, correo\nFROM empleados;',
      reading: 'Muéstrame el nombre y el correo de todos los empleados.',
    },
    sourceColumns: ['ID_EMPLEADO', 'NOMBRE', 'APELLIDO', 'CIUDAD', 'CORREO'],
    changed: [
      'El resultado solo tiene las columnas NOMBRE y CORREO.',
      'Se conservan las 20 filas: elegir columnas no elimina empleados.',
    ],
    unchanged: ['Las demás columnas siguen en la tabla; solo no se muestran.'],
    terminology: 'En álgebra relacional, elegir columnas se llama proyección.',
    error: {
      title: 'Poner la tabla en la lista de columnas',
      wrong: 'SELECT empleados\nFROM empleados;',
      why: 'EMPLEADOS es la tabla y va después de FROM. Después de SELECT se escriben columnas.',
      right: 'SELECT nombre\nFROM empleados;',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué encabezados tendrá el resultado?',
      sql: 'SELECT apellido, cargo\nFROM empleados;',
      options: [
        {
          text: 'APELLIDO y CARGO, en ese orden',
          correct: true,
          feedback: 'Sí: el resultado tiene las columnas escritas, en el orden escrito.',
        },
        {
          text: 'CARGO y APELLIDO',
          correct: false,
          feedback: 'El resultado respeta el orden en que se escriben las columnas.',
        },
        {
          text: 'Las 12 columnas de EMPLEADOS',
          correct: false,
          feedback: 'Solo aparecen las columnas que escribes después de SELECT.',
        },
      ],
      hints: [
        'SELECT decide qué columnas aparecen.',
        'Lee la lista de SELECT de izquierda a derecha.',
      ],
      explanation: 'El resultado tiene APELLIDO y CARGO, en ese orden, para los 20 empleados.',
    },
  },
  {
    slug: 'from',
    oneLiner: 'FROM indica de qué tabla salen los datos.',
    whatItDoes:
      'FROM va después de la lista de columnas y nombra la tabla de origen. Sin FROM, Oracle no sabe dónde buscar las columnas.',
    purpose:
      'Una base de datos real tiene muchas tablas y FROM elige cuál consultar. En esta unidad siempre es EMPLEADOS; combinar varias tablas es el tema de JOIN (Nivel 4).',
    syntax: 'SELECT columnas\nFROM tabla;',
    syntaxReading:
      'Primero qué (SELECT) y después de dónde (FROM). El punto y coma marca el final de la sentencia; en el laboratorio es opcional.',
    example: {
      question: '¿Qué cargo tiene cada empleado?',
      sql: 'SELECT nombre, cargo\nFROM empleados;',
      reading: 'Muéstrame el nombre y el cargo de todos los empleados.',
    },
    sourceColumns: ['ID_EMPLEADO', 'NOMBRE', 'CARGO', 'DEPARTAMENTO'],
    changed: ['Cada fila del resultado sale de una fila de EMPLEADOS: una por empleado.'],
    unchanged: ['FROM no filtra ni cambia nada: solo indica el origen.'],
    error: {
      title: 'Olvidar el nombre de la tabla',
      wrong: 'SELECT nombre, cargo\nFROM;',
      why: 'Después de FROM falta el nombre de la tabla.',
      right: 'SELECT nombre, cargo\nFROM empleados;',
    },
    check: {
      kind: 'order',
      prompt: 'Ordena las piezas para pedir el cargo de cada empleado.',
      pieces: ['SELECT', 'cargo', 'FROM', 'empleados', ';'],
      hints: [
        'Primero se dice qué mostrar y después de dónde sale.',
        'La consulta empieza con SELECT y la tabla va justo después de FROM.',
      ],
      explanation:
        'SELECT cargo FROM empleados; — qué, después de dónde, y el punto y coma al final.',
    },
  },
  {
    slug: 'asterisco',
    oneLiner: 'SELECT * pide todas las columnas de la tabla, en el orden en que están definidas.',
    whatItDoes:
      'Oracle reemplaza el asterisco por la lista completa de columnas: en EMPLEADOS, las 12. En esta posición * no multiplica: significa «todas».',
    purpose:
      'Es cómodo para explorar una tabla que no conoces. En una consulta definitiva conviene nombrar las columnas: pides solo lo necesario, el resultado es más claro y no cambia si alguien añade columnas a la tabla.',
    syntax: 'SELECT *\nFROM tabla;',
    syntaxReading: '«Muéstrame todas las columnas de la tabla».',
    example: {
      question: '¿Qué información completa hay de cada empleado?',
      sql: 'SELECT *\nFROM empleados;',
      reading: 'Muéstrame todas las columnas de todos los empleados.',
    },
    changed: ['El resultado tiene las 12 columnas de EMPLEADOS, en su orden.'],
    unchanged: ['La tabla no cambia y el orden de las columnas es el de la tabla.'],
    notes: [
      {
        title: 'En Oracle',
        text: 'El asterisco sin indicar la tabla no se combina con otras columnas: SELECT *, nombre da error. La forma empleados.* aparece con JOIN.',
      },
    ],
    error: {
      title: 'Mezclar * con otras columnas',
      wrong: 'SELECT *, nombre\nFROM empleados;',
      why: 'El asterisco ya incluye NOMBRE, y Oracle no permite mezclar * sin calificar con otras columnas.',
      right: 'SELECT nombre, cargo\nFROM empleados;',
    },
    check: {
      kind: 'count',
      prompt: '¿Cuántas columnas devuelve esta consulta?',
      sql: 'SELECT *\nFROM empleados;',
      measure: 'columns',
      hints: [
        'El asterisco representa todas las columnas de la tabla.',
        'Cuenta los encabezados de la tabla EMPLEADOS.',
      ],
      explanation: 'SELECT * devuelve las 12 columnas de EMPLEADOS.',
    },
  },
  {
    slug: 'columnas',
    oneLiner:
      'Escribe las columnas que necesitas separadas por comas: el resultado respeta ese orden.',
    whatItDoes:
      'Cada coma separa un elemento de la lista. El orden en que escribes las columnas es el orden de las columnas del resultado, aunque en la tabla estén en otro.',
    purpose:
      'Presentar la información en el orden que tiene sentido para quien la lee: primero la ciudad y después el nombre, por ejemplo.',
    syntax: 'SELECT columna1, columna2, columna3\nFROM tabla;',
    syntaxReading: 'Cada coma se lee «y»: «muéstrame la ciudad, el nombre y el cargo».',
    example: {
      question: '¿En qué ciudad trabaja cada empleado? Primero la ciudad.',
      sql: 'SELECT ciudad, nombre, cargo\nFROM empleados;',
      reading: 'Muéstrame la ciudad, el nombre y el cargo de todos los empleados.',
    },
    changed: ['CIUDAD aparece primero porque se escribió primero.'],
    unchanged: [
      'La tabla conserva su orden de columnas.',
      'Elegir columnas no quita filas repetidas: Bogotá aparece siete veces.',
    ],
    comparisons: [
      {
        label: 'Mismas columnas, otro orden',
        sql: 'SELECT nombre, ciudad\nFROM empleados;',
        note: 'Las mismas dos columnas en orden inverso: el orden lo decides tú.',
      },
    ],
    error: {
      title: 'Olvidar una coma',
      wrong: 'SELECT nombre ciudad\nFROM empleados;',
      why: 'Sin coma, Oracle lee ciudad como un alias de nombre: el resultado tiene una sola columna llamada CIUDAD con los nombres. No hay error, pero no es lo que se pedía.',
      right: 'SELECT nombre, ciudad\nFROM empleados;',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué le falta a esta consulta para mostrar dos columnas?',
      sql: 'SELECT nombre ciudad\nFROM empleados;',
      options: [
        {
          text: 'Una coma entre nombre y ciudad',
          correct: true,
          feedback: 'Sí: la coma separa las dos columnas.',
        },
        {
          text: 'Un punto y coma al final',
          correct: false,
          feedback: 'Ya lo tiene, y además es opcional en el laboratorio.',
        },
        {
          text: 'Comillas alrededor de ciudad',
          correct: false,
          feedback: 'Los nombres de columna se escriben sin comillas.',
        },
      ],
      hints: [
        'Cuenta cuántas columnas pide y cuántos separadores hay.',
        'Sin separador, la segunda palabra se lee como alias de la primera.',
      ],
      explanation: 'SELECT nombre, ciudad FROM empleados; — la coma separa las columnas.',
    },
  },
  {
    slug: 'expresiones',
    oneLiner: 'Una expresión calcula un valor nuevo en cada fila, sin cambiar la tabla.',
    whatItDoes:
      'Puedes operar columnas numéricas con + (suma), - (resta), * (multiplicación) y / (división), y combinarlas con números. Oracle calcula fila por fila y muestra el resultado como una columna más.',
    purpose:
      'Obtener datos derivados sin guardarlos: el salario anual, la mitad del salario o el salario más el bono.',
    syntax: 'SELECT columna * número\nFROM tabla;',
    syntaxReading: '«Muéstrame el salario multiplicado por 12», fila por fila.',
    example: {
      question: '¿Cuánto gana al año cada empleado?',
      sql: 'SELECT nombre, salario, salario * 12\nFROM empleados;',
      reading:
        'Muéstrame el nombre, el salario y el salario multiplicado por 12 de todos los empleados.',
    },
    changed: [
      'Aparece una columna calculada. Sin alias, su encabezado es la propia expresión: SALARIO*12.',
      'Ana Rojas: 9.000.000 × 12 = 108.000.000.',
    ],
    unchanged: ['La columna SALARIO de la tabla conserva su valor mensual.'],
    notes: [
      {
        title: 'Solo con números',
        text: 'Los cálculos usan columnas numéricas: SALARIO, BONO, ID_EMPLEADO o ID_JEFE. Un texto como NOMBRE no se multiplica; para unir textos existe ||.',
      },
      {
        title: 'NULL en un cálculo',
        text: 'Si uno de los valores es NULL, el cálculo también da NULL: salario + bono no tiene valor para quien no tiene bono.',
      },
      {
        title: 'Números sin formato',
        text: 'En SQL los números se escriben sin puntos de miles ni símbolo de moneda: 3000000. La plataforma los muestra con separadores solo para leerlos mejor.',
      },
    ],
    error: {
      title: 'Calcular con un texto',
      wrong: 'SELECT nombre * 12\nFROM empleados;',
      why: 'NOMBRE es texto: no admite operaciones aritméticas.',
      right: 'SELECT nombre, salario * 12\nFROM empleados;',
    },
    check: {
      kind: 'number',
      prompt: '¿Qué valor muestra salario * 12 para Sofía López?',
      sql: "SELECT salario * 12\nFROM empleados\nWHERE nombre = 'Sofía';",
      label: 'Salario anual de Sofía',
      hints: [
        'Busca en la tabla el salario mensual de Sofía López.',
        'Sofía gana 3.000.000 al mes; multiplícalo por los 12 meses.',
      ],
      explanation: '3.000.000 × 12 = 36.000.000. Escríbelo sin puntos: 36000000.',
    },
  },
  {
    slug: 'precedencia',
    oneLiner:
      'Oracle multiplica y divide antes de sumar y restar; los paréntesis cambian ese orden.',
    whatItDoes:
      'En una expresión con varios operadores, * y / se calculan primero, y + y - después, de izquierda a derecha. Lo que está entre paréntesis se calcula antes que todo lo demás.',
    purpose:
      'Escribir el cálculo que realmente quieres: el total anual de salario y bono no es lo mismo que el salario más doce bonos.',
    syntax: '(a + b) * c',
    syntaxReading:
      'Sin paréntesis, a + b * c se lee «a más (b por c)». Con paréntesis, (a + b) * c se lee «(a más b) por c».',
    example: {
      question: '¿Cuánto recibe al año cada empleado entre salario y bono?',
      sql: 'SELECT nombre, salario, bono,\n       (salario + bono) * 12 AS total_anual\nFROM empleados;',
      reading:
        'Muéstrame el nombre, el salario, el bono y (salario más bono) multiplicado por 12 como TOTAL_ANUAL.',
    },
    changed: [
      'Con paréntesis, primero se suma salario + bono y después se multiplica por 12.',
      'Ana Rojas: (9.000.000 + 900.000) × 12 = 118.800.000.',
    ],
    unchanged: [
      'Si BONO es NULL, el total también es NULL. NVL, en el Nivel 2, permite tratarlo como 0.',
    ],
    comparisons: [
      {
        label: 'Sin paréntesis',
        sql: 'SELECT nombre, salario, bono,\n       salario + bono * 12 AS total\nFROM empleados;',
        note: 'Solo el bono se multiplica: para Ana, 9.000.000 + 10.800.000 = 19.800.000.',
      },
    ],
    error: {
      title: 'Olvidar los paréntesis',
      wrong: 'SELECT salario + bono * 12 AS total_anual\nFROM empleados;',
      why: 'Sin paréntesis, solo el bono se multiplica por 12.',
      right: 'SELECT (salario + bono) * 12 AS total_anual\nFROM empleados;',
    },
    check: {
      kind: 'choice',
      prompt: '¿Qué expresión calcula el total anual de salario más bono?',
      options: [
        {
          text: '(salario + bono) * 12',
          code: true,
          correct: true,
          feedback: 'Sí: los paréntesis hacen que la suma vaya primero.',
        },
        {
          text: 'salario + bono * 12',
          code: true,
          correct: false,
          feedback: 'La multiplicación va antes: solo el bono se multiplica por 12.',
        },
        {
          text: 'salario * 12 + bono',
          code: true,
          correct: false,
          feedback: 'Suma un solo bono mensual al salario anual.',
        },
      ],
      hints: [
        'Primero hay que sumar los dos valores mensuales.',
        'La multiplicación se calcula antes que la suma, salvo que haya paréntesis.',
      ],
      explanation:
        '(salario + bono) * 12: la suma entre paréntesis se calcula antes de multiplicar.',
    },
  },
  {
    slug: 'alias',
    oneLiner:
      'Un alias es un nombre temporal para una columna o expresión del resultado; AS es la palabra que lo asigna.',
    whatItDoes:
      'Alias: nombre temporal para una columna o expresión dentro del resultado. AS: palabra opcional que hace explícita esa asignación. AS no renombra la columna, no modifica la tabla ni sus datos: solo cambia cómo aparece el encabezado en esa consulta.',
    purpose:
      'Hacer legible el resultado: SALARIO_ANUAL se entiende mejor que SALARIO*12. El alias también sirve para ordenar por esa columna con ORDER BY.',
    syntax: 'SELECT columna_o_expresión AS alias\nFROM tabla;',
    syntaxReading: '«Muestra la columna o la expresión con el encabezado alias».',
    terminology: 'Este nombre temporal se llama alias de columna (column alias).',
    example: {
      question: '¿Cuál es el salario anual de cada empleado, con un encabezado claro?',
      sql: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
      reading:
        'Muéstrame el nombre y el salario multiplicado por 12, con el encabezado SALARIO_ANUAL.',
    },
    changed: ['Antes, el encabezado era SALARIO*12. Después, SALARIO_ANUAL.'],
    unchanged: [
      'La columna SALARIO de EMPLEADOS no se renombra.',
      'Los datos de la tabla no se modifican.',
      'Los valores son los mismos: el alias no cambia el cálculo.',
    ],
    comparisons: [
      {
        label: 'Sin alias',
        sql: 'SELECT nombre,\n       salario * 12\nFROM empleados;',
        note: 'El encabezado es la expresión sin espacios: SALARIO*12.',
      },
      {
        label: 'Alias entre comillas dobles',
        sql: 'SELECT nombre AS "Nombre del empleado"\nFROM empleados;',
        note: 'Entre comillas dobles, el alias conserva mayúsculas, espacios y tildes.',
      },
    ],
    notes: [
      {
        title: 'Reglas del alias en Oracle',
        text: 'Sin comillas, el alias empieza por una letra, usa letras sin tilde, números y guion bajo, y Oracle lo muestra en mayúsculas. AS es opcional (salario * 12 salario_anual también funciona), pero escribirlo evita confusiones con una coma olvidada.',
      },
      {
        title: 'Dónde se puede usar',
        text: 'El alias se puede usar en ORDER BY, pero no en WHERE: en el modelo lógico, WHERE se aplica antes de que existan los encabezados.',
      },
    ],
    error: {
      title: 'Pensar que AS modifica la tabla',
      wrong: 'SELECT salario_anual\nFROM empleados;',
      why: 'SALARIO_ANUAL no es una columna de la tabla: el alias solo existe en el resultado de la consulta que lo define.',
      right: 'SELECT salario * 12 AS salario_anual\nFROM empleados;',
    },
    check: {
      kind: 'choice',
      prompt: 'Después de esta consulta, ¿qué pasa con la columna SALARIO de la tabla?',
      sql: 'SELECT salario * 12 AS salario_anual\nFROM empleados;',
      options: [
        {
          text: 'Sigue llamándose SALARIO: el alias solo cambia el encabezado del resultado',
          correct: true,
          feedback: 'Exacto: el alias es temporal y solo afecta al resultado.',
        },
        {
          text: 'Pasa a llamarse SALARIO_ANUAL',
          correct: false,
          feedback: 'Una consulta no renombra columnas; eso lo haría ALTER TABLE (Nivel 7).',
        },
        {
          text: 'Sus valores se multiplican por 12 en la tabla',
          correct: false,
          feedback: 'El cálculo solo aparece en el resultado; la tabla no cambia.',
        },
      ],
      hints: [
        '¿SELECT lee o escribe datos?',
        'AS nombra una columna del resultado, no de la tabla.',
      ],
      explanation: 'La tabla no cambia: SALARIO_ANUAL solo existe en el resultado de esa consulta.',
    },
  },
  {
    slug: 'concatenacion',
    oneLiner: 'Los textos se escriben entre comillas simples y se unen con ||.',
    whatItDoes:
      "Un literal es un valor fijo escrito en la consulta: un número como 12 o un texto como 'Empleado'. El operador || une dos textos en uno; si uno de los lados es un número, Oracle lo convierte en texto.",
    purpose:
      'Armar resultados listos para leer: el nombre completo o una frase como «Ana trabaja en Bogotá».',
    syntax: "SELECT columna1 || ' ' || columna2 AS alias\nFROM tabla;",
    syntaxReading: '«Une la primera columna, un espacio y la segunda columna».',
    example: {
      question: '¿Cuál es el nombre completo de cada empleado?',
      sql: "SELECT nombre || ' ' || apellido AS nombre_completo,\n       cargo\nFROM empleados;",
      reading:
        'Muéstrame el nombre, un espacio y el apellido unidos como NOMBRE_COMPLETO, y el cargo de todos los empleados.',
    },
    sourceColumns: ['NOMBRE', 'APELLIDO', 'CARGO'],
    changed: ['Una sola columna, NOMBRE_COMPLETO, reúne dos datos.'],
    unchanged: ['NOMBRE y APELLIDO siguen separados en la tabla.'],
    comparisons: [
      {
        label: 'Un texto fijo',
        sql: "SELECT nombre,\n       'trabaja en' AS relacion,\n       ciudad\nFROM empleados;",
        note: "El literal 'trabaja en' se repite igual en todas las filas.",
      },
    ],
    notes: [
      {
        title: 'Comillas simples y dobles',
        text: "Las comillas simples encierran textos: 'Bogotá'. Las comillas dobles encierran nombres de columnas o alias: \"Nombre completo\". Para escribir un apóstrofo dentro de un texto se duplica: 'O''Neil'.",
      },
      {
        title: 'NULL al concatenar',
        text: "En Oracle, unir con NULL es como unir con un texto vacío: nombre || bono devuelve solo el nombre cuando no hay bono. Y un texto vacío '' se trata como NULL.",
      },
    ],
    error: {
      title: 'Unir textos con +',
      wrong: "SELECT nombre + ' ' + apellido\nFROM empleados;",
      why: 'En Oracle, + solo suma números; para unir textos se usa ||.',
      right: "SELECT nombre || ' ' || apellido AS nombre_completo\nFROM empleados;",
    },
    check: {
      kind: 'choice',
      prompt: "¿Qué muestra nombre || ' ' || apellido para Ana Rojas?",
      options: [
        { text: 'Ana Rojas', correct: true, feedback: "Sí: el literal ' ' añade el espacio." },
        {
          text: 'AnaRojas',
          correct: false,
          feedback: "El texto ' ' que va en el medio es un espacio.",
        },
        {
          text: 'nombre apellido',
          correct: false,
          feedback: 'Sin comillas, nombre y apellido son columnas: se usan sus valores.',
        },
      ],
      hints: [
        '|| pega los valores en el orden escrito.',
        "Entre nombre y apellido va el texto ' ', que es un espacio.",
      ],
      explanation: "Ana || ' ' || Rojas = «Ana Rojas».",
    },
  },
  {
    slug: 'distinct',
    fullTable: true,
    oneLiner: 'DISTINCT quita del resultado las filas repetidas.',
    whatItDoes:
      'Va justo después de SELECT. Oracle compara las filas completas del resultado y deja una sola de cada combinación repetida. Con varias columnas, dos filas son repetidas solo si coinciden en todas.',
    purpose:
      'Responder «¿qué valores distintos hay?»: en qué ciudades hay empleados o qué combinaciones de ciudad y departamento existen.',
    syntax: 'SELECT DISTINCT columna\nFROM tabla;',
    syntaxReading: '«Muéstrame la ciudad, sin repetir filas».',
    example: {
      question: '¿En qué ciudades hay empleados?',
      sql: 'SELECT DISTINCT ciudad\nFROM empleados;',
      reading: 'Muéstrame la ciudad de todos los empleados, sin repetir filas.',
    },
    sourceColumns: ['NOMBRE', 'CIUDAD', 'DEPARTAMENTO'],
    changed: ['De 20 filas quedan 5: una por ciudad.'],
    unchanged: [
      'DISTINCT no borra registros de la tabla: solo afecta al resultado.',
      'DISTINCT no ordena: sin ORDER BY, el orden de las filas no está garantizado.',
    ],
    comparisons: [
      {
        label: 'Sin DISTINCT',
        sql: 'SELECT ciudad\nFROM empleados;',
        note: 'Una fila por empleado: Bogotá aparece siete veces.',
      },
      {
        label: 'Con dos columnas',
        sql: 'SELECT DISTINCT ciudad, departamento\nFROM empleados;',
        note: 'Se compara el par completo: Bogotá–TI y Bogotá–Ventas son filas distintas.',
      },
    ],
    notes: [
      {
        title: 'DISTINCT y NULL',
        text: 'Para DISTINCT, dos NULL cuentan como iguales: SELECT DISTINCT bono deja un solo NULL.',
      },
    ],
    error: {
      title: 'Esperar que DISTINCT ordene',
      wrong: 'SELECT DISTINCT ciudad\nFROM empleados;\n-- esperando un orden alfabético',
      why: 'DISTINCT solo quita repetidas. Si necesitas un orden, pídelo con ORDER BY.',
      right: 'SELECT DISTINCT ciudad\nFROM empleados\nORDER BY ciudad;',
    },
    check: {
      kind: 'count',
      prompt: '¿Cuántas filas devuelve esta consulta?',
      sql: 'SELECT DISTINCT departamento\nFROM empleados;',
      measure: 'rows',
      hints: [
        'DISTINCT deja una fila por cada valor distinto.',
        'Cuenta los departamentos diferentes de la tabla.',
      ],
      explanation:
        'Hay 5 departamentos distintos: Finanzas, Operaciones, Recursos Humanos, TI y Ventas.',
    },
  },
];
