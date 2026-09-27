/**
 * Fuente conceptual única de la unidad «SELECT en Oracle SQL». Cada concepto tiene una sola
 * definición, revisada contra la documentación de Oracle Database 19c (SQL Language
 * Reference) y redactada en español sencillo. La Exposición, el Estudio, los Recursos y el
 * buscador la presentan de formas distintas, pero nunca la reescriben.
 *
 * Reglas de redacción:
 * - `definition`: una frase, 25 palabras como máximo, sin términos que no se hayan definido.
 * - `keyTakeaway`: una línea que el alumno debería recordar.
 * - `example`: SQL válido del subconjunto de la unidad sobre EMPLEADOS (lo comprueban las
 *   pruebas con el motor educativo) y `humanReading` es su lectura en español.
 */

export type ConceptCategory =
  | 'language'
  | 'structure'
  | 'clause'
  | 'select-list'
  | 'keyword'
  | 'wildcard-select'
  | 'expression'
  | 'rule'
  | 'alias'
  | 'alias-keyword'
  | 'concat-operator'
  | 'comparison-operator'
  | 'logical-operator'
  | 'condition'
  | 'wildcard-like'
  | 'value'
  | 'sort-option'
  | 'statement'
  | 'separator'
  | 'grouping';

/** Nombre de cada categoría: SELECT es una cláusula, AND un operador lógico, `%` un comodín. */
export const CONCEPT_CATEGORY_LABEL: Readonly<Record<ConceptCategory, string>> = {
  language: 'Lenguaje',
  structure: 'Estructura de los datos',
  clause: 'Cláusula',
  'select-list': 'Lista de SELECT',
  keyword: 'Palabra clave',
  'wildcard-select': 'Comodín en SELECT',
  expression: 'Expresión',
  rule: 'Regla de evaluación',
  alias: 'Alias de columna',
  'alias-keyword': 'Palabra clave de alias',
  'concat-operator': 'Operador de concatenación',
  'comparison-operator': 'Operadores de comparación',
  'logical-operator': 'Operador lógico',
  condition: 'Condición',
  'wildcard-like': 'Comodín en LIKE',
  value: 'Valor especial',
  'sort-option': 'Opción de ordenamiento',
  statement: 'Sentencia',
  separator: 'Separador',
  grouping: 'Signo de agrupación',
};

export interface ConceptMistake {
  /** SQL con el error; se puede abrir en el laboratorio para ver su diagnóstico. */
  readonly wrong: string;
  readonly right: string;
  /** Causa en una frase. */
  readonly why: string;
}

export interface SqlConcept {
  readonly id: ConceptId;
  /** Cómo se escribe o se nombra: «WHERE», «%», «Alias». */
  readonly title: string;
  /** Nombre completo para rótulos: «Cláusula WHERE». */
  readonly name: string;
  readonly category: ConceptCategory;
  /** Nivel de la ruta de aprendizaje. Todos los conceptos de este archivo son del nivel 1. */
  readonly level: 1;
  readonly definition: string;
  /**
   * Glosa de pocas palabras para «En esta consulta»: qué hace este elemento dentro de una
   * consulta concreta («elige qué columnas mostrar»).
   */
  readonly gloss: string;
  /** Qué hace, en una o dos líneas. */
  readonly whatItDoes: string;
  /** Para qué sirve en una tarea real. */
  readonly whyItMatters: string;
  /** Sintaxis mínima. */
  readonly syntax: string;
  readonly example: string;
  /** El ejemplo leído en español. */
  readonly humanReading: string;
  readonly keyTakeaway: string;
  readonly mistake?: ConceptMistake;
  /** Matiz propio de Oracle que conviene saber. */
  readonly oracleNote?: string;
  /** Lección del Modo Estudio que lo desarrolla. */
  readonly lesson: string;
  /** Términos de búsqueda sin tildes. */
  readonly keywords: readonly string[];
}

export type ConceptId =
  | 'sql'
  | 'table'
  | 'row'
  | 'column'
  | 'query'
  | 'data-type'
  | 'select'
  | 'from'
  | 'star'
  | 'column-list'
  | 'comma'
  | 'expression'
  | 'arithmetic-precedence'
  | 'parentheses'
  | 'alias'
  | 'as'
  | 'concat'
  | 'distinct'
  | 'where'
  | 'comparison'
  | 'and'
  | 'or'
  | 'not'
  | 'logical-precedence'
  | 'between'
  | 'in'
  | 'like'
  | 'percent'
  | 'underscore'
  | 'null'
  | 'is-null'
  | 'is-not-null'
  | 'order-by'
  | 'asc'
  | 'desc';

type ConceptInput = Omit<SqlConcept, 'id' | 'level'>;

const DEFINITIONS: Readonly<Record<ConceptId, ConceptInput>> = {
  sql: {
    title: 'SQL',
    name: 'SQL · Structured Query Language',
    category: 'language',
    definition:
      'SQL (Structured Query Language) es el lenguaje utilizado para consultar y trabajar con datos almacenados en bases de datos relacionales.',
    gloss: 'lenguaje para consultar bases de datos',
    whatItDoes:
      'En esta unidad lo utilizaremos principalmente para hacer preguntas a la base de datos mediante SELECT.',
    whyItMatters:
      'Casi toda aplicación guarda sus datos en tablas; SQL es la forma de pedírselos a la base de datos.',
    syntax: 'SELECT … FROM …;',
    example: 'SELECT nombre\nFROM empleados;',
    humanReading: 'Muéstrame el nombre de cada empleado.',
    keyTakeaway: 'En esta unidad, SQL sirve para consultar: leer datos sin modificarlos.',
    lesson: 'introduccion',
    keywords: ['sql', 'structured query language', 'lenguaje', 'base de datos'],
  },
  table: {
    title: 'Tabla',
    name: 'Tabla',
    category: 'structure',
    definition:
      'Una tabla es un conjunto organizado de datos en filas y columnas; la de esta unidad es EMPLEADOS.',
    gloss: 'datos organizados en filas y columnas',
    whatItDoes:
      'Guarda un tipo de cosa: cada fila es un empleado y cada columna, uno de sus datos.',
    whyItMatters: 'Toda consulta empieza por saber qué tabla contiene la respuesta.',
    syntax: 'FROM empleados',
    example: 'SELECT *\nFROM empleados;',
    humanReading: 'Muéstrame todo lo que guarda la tabla EMPLEADOS.',
    keyTakeaway: 'Tabla = filas × columnas.',
    lesson: 'introduccion',
    keywords: ['tabla', 'relacion'],
  },
  row: {
    title: 'Fila',
    name: 'Fila o registro',
    category: 'structure',
    definition: 'Una fila es un registro: todos los datos de un mismo empleado.',
    gloss: 'un registro: un empleado',
    whatItDoes: 'WHERE conserva o descarta filas enteras.',
    whyItMatters: 'Contar filas es la forma de comprobar qué hizo un filtro.',
    syntax: 'WHERE condición',
    example: 'SELECT *\nFROM empleados\nWHERE id_empleado = 1;',
    humanReading: 'Muéstrame la fila del empleado 1.',
    keyTakeaway: 'Una fila = un empleado.',
    lesson: 'introduccion',
    keywords: ['fila', 'registro', 'tupla'],
  },
  column: {
    title: 'Columna',
    name: 'Columna o atributo',
    category: 'structure',
    definition:
      'Una columna es una característica que tienen todas las filas, como CIUDAD o SALARIO.',
    gloss: 'una característica de todas las filas',
    whatItDoes: 'SELECT elige qué columnas aparecen en el resultado.',
    whyItMatters: 'Pedir solo las columnas necesarias hace el resultado más claro.',
    syntax: 'SELECT columna',
    example: 'SELECT ciudad\nFROM empleados;',
    humanReading: 'Muéstrame la ciudad de cada empleado.',
    keyTakeaway: 'Una columna = un dato de todos los empleados.',
    mistake: {
      wrong: 'SELECT nombre, sueldo\nFROM empleados;',
      right: 'SELECT nombre, salario\nFROM empleados;',
      why: 'EMPLEADOS no tiene la columna SUELDO. ¿Querías decir SALARIO?',
    },
    lesson: 'introduccion',
    keywords: ['columna', 'campo', 'atributo'],
  },
  query: {
    title: 'Consulta',
    name: 'Consulta SQL',
    category: 'statement',
    definition:
      'Una consulta es una pregunta escrita en SQL; con SELECT pide datos a una tabla sin modificarlos.',
    gloss: 'pregunta escrita en SQL',
    whatItDoes:
      'Oracle la lee, busca los datos en la tabla y devuelve el resultado en forma de tabla.',
    whyItMatters:
      'Cada pregunta sobre los datos, como «¿quiénes trabajan en Cali?», se convierte en una consulta.',
    syntax: 'SELECT columnas FROM tabla;',
    example: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';",
    humanReading: '¿Quiénes trabajan en Cali?',
    keyTakeaway: 'Una consulta pregunta; el resultado es otra tabla y la original no cambia.',
    lesson: 'introduccion',
    keywords: ['consulta', 'query', 'pregunta', 'sentencia'],
  },
  'data-type': {
    title: 'Tipo de dato',
    name: 'Tipo de dato de Oracle',
    category: 'structure',
    definition:
      'El tipo de dato dice qué valores admite una columna: NUMBER para números, VARCHAR2 para textos y DATE para fechas.',
    gloss: 'clase de valor que guarda una columna',
    whatItDoes: 'Decide cómo se compara, se ordena y se calcula cada columna.',
    whyItMatters: 'Los números se comparan sin comillas; los textos y las fechas, con ellas.',
    syntax: 'NUMBER · VARCHAR2 · DATE',
    example:
      "SELECT nombre, fecha_ingreso\nFROM empleados\nWHERE fecha_ingreso >= DATE '2020-01-01';",
    humanReading: 'Muéstrame quién ingresó desde el 1 de enero de 2020.',
    keyTakeaway: 'El tipo decide si un valor va con comillas o sin ellas.',
    lesson: 'empleados',
    keywords: ['tipo', 'number', 'varchar2', 'date', 'fecha'],
  },
  select: {
    title: 'SELECT',
    name: 'Cláusula SELECT',
    category: 'clause',
    definition: 'SELECT indica qué columnas o expresiones quieres mostrar en el resultado.',
    gloss: 'elige qué columnas mostrar',
    whatItDoes:
      'Después de SELECT se escriben, separadas por comas, las columnas o cálculos que tendrá el resultado.',
    whyItMatters: 'Ves solo los datos que necesitas, en el orden que eliges.',
    syntax: 'SELECT columna1, columna2',
    example: 'SELECT nombre, salario\nFROM empleados;',
    humanReading: 'Muéstrame el nombre y el salario de cada empleado.',
    keyTakeaway: 'SELECT decide las columnas; no quita filas.',
    mistake: {
      wrong: 'SELECT nombre salario\nFROM empleados;',
      right: 'SELECT nombre, salario\nFROM empleados;',
      why: 'Sin la coma, Oracle toma «salario» como alias de NOMBRE.',
    },
    lesson: 'select',
    keywords: ['select', 'seleccionar', 'mostrar columnas'],
  },
  from: {
    title: 'FROM',
    name: 'Cláusula FROM',
    category: 'clause',
    definition: 'FROM indica de qué tabla provienen los datos que quieres consultar.',
    gloss: 'indica de qué tabla vienen los datos',
    whatItDoes: 'Nombra la tabla de origen; las columnas de SELECT deben existir en ella.',
    whyItMatters: 'Sin FROM, Oracle no sabe de dónde leer: en Oracle 19c es obligatorio.',
    syntax: 'FROM tabla',
    example: 'SELECT cargo\nFROM empleados;',
    humanReading: 'Muéstrame el cargo de cada fila de EMPLEADOS.',
    keyTakeaway: 'SELECT dice qué; FROM dice de dónde.',
    mistake: {
      wrong: 'SELECT nombre, salario;',
      right: 'SELECT nombre, salario\nFROM empleados;',
      why: 'Sin FROM, Oracle no sabe de qué tabla leer.',
    },
    lesson: 'from',
    keywords: ['from', 'tabla de origen', 'de donde'],
  },
  star: {
    title: '*',
    name: 'Asterisco en SELECT',
    category: 'wildcard-select',
    definition:
      'En SELECT, el asterisco (*) indica que queremos recuperar todas las columnas de la tabla.',
    gloss: 'todas las columnas de la tabla',
    whatItDoes: 'Oracle lo expande a las 12 columnas de EMPLEADOS, en el orden en que se crearon.',
    whyItMatters: 'Sirve para explorar una tabla que todavía no conoces.',
    syntax: 'SELECT *',
    example: 'SELECT *\nFROM empleados;',
    humanReading: 'Muéstrame todas las columnas de todos los empleados.',
    keyTakeaway: 'Explora con *; en una consulta final, pide solo lo necesario.',
    lesson: 'asterisco',
    keywords: ['asterisco', 'todas las columnas', 'select *', '*'],
  },
  'column-list': {
    title: 'Columnas específicas',
    name: 'Lista de columnas',
    category: 'select-list',
    definition:
      'La lista de SELECT nombra las columnas que quieres, separadas por comas y en el orden en que aparecerán.',
    gloss: 'columnas elegidas, en su orden',
    whatItDoes: 'El resultado respeta el orden escrito, no el orden de la tabla.',
    whyItMatters: 'Presentas los datos en el orden que tiene sentido para tu pregunta.',
    syntax: 'SELECT columna1, columna2',
    example: 'SELECT ciudad, nombre\nFROM empleados;',
    humanReading: 'Muéstrame la ciudad y después el nombre de cada empleado.',
    keyTakeaway: 'Mismos datos, distinto orden: tú decides el orden de las columnas.',
    mistake: {
      wrong: 'SELECT nombre, , ciudad\nFROM empleados;',
      right: 'SELECT nombre, ciudad\nFROM empleados;',
      why: 'Cada coma separa dos columnas; no puede quedar vacía.',
    },
    lesson: 'columnas',
    keywords: ['columnas', 'lista', 'coma', 'orden de columnas'],
  },
  comma: {
    title: ',',
    name: 'La coma',
    category: 'separator',
    definition:
      'La coma separa los elementos de una lista: las columnas de SELECT o los valores de IN.',
    gloss: 'separa columnas o valores de una lista',
    whatItDoes: 'Cada coma marca dónde termina un elemento y dónde empieza el siguiente.',
    whyItMatters: 'Sin ella, Oracle lee dos nombres seguidos como una columna y su alias.',
    syntax: 'SELECT columna1, columna2',
    example: 'SELECT nombre, ciudad, salario\nFROM empleados;',
    humanReading: 'Muéstrame el nombre, la ciudad y el salario de cada empleado.',
    keyTakeaway: 'Una coma entre cada par de columnas; nunca después de la última.',
    mistake: {
      wrong: 'SELECT nombre, ciudad,\nFROM empleados;',
      right: 'SELECT nombre, ciudad\nFROM empleados;',
      why: 'Después de la última columna no va coma: Oracle esperaría otra columna.',
    },
    lesson: 'columnas',
    keywords: ['coma', 'separador', 'lista', ','],
  },
  expression: {
    title: 'Expresión',
    name: 'Expresión',
    category: 'expression',
    definition:
      'Una expresión combina valores, columnas y operadores para calcular un resultado sin modificar los datos almacenados.',
    gloss: 'calcula un valor nuevo en cada fila',
    whatItDoes: 'Oracle la calcula en cada fila y la muestra como una columna nueva del resultado.',
    whyItMatters: 'Obtienes datos derivados, como el salario de un año, sin guardarlos.',
    syntax: 'SELECT columna * número',
    example: 'SELECT nombre,\n       salario * 12\nFROM empleados;',
    humanReading: 'Muéstrame el nombre y el salario de un año de cada empleado.',
    keyTakeaway: 'Calcular no cambia la tabla: SALARIO sigue igual.',
    oracleNote: 'Si un operando es NULL, el cálculo da NULL: salario + NULL es NULL.',
    lesson: 'expresiones',
    keywords: ['expresion', 'calculo', 'aritmetica', 'operador', 'multiplicar'],
  },
  'arithmetic-precedence': {
    title: '( )',
    name: 'Precedencia aritmética',
    category: 'rule',
    definition:
      'La precedencia decide qué se calcula primero: * y / antes que + y -; los paréntesis cambian ese orden.',
    gloss: 'multiplicar y dividir antes que sumar',
    whatItDoes: 'salario + bono * 12 multiplica primero; (salario + bono) * 12 suma primero.',
    whyItMatters: 'La misma fórmula sin paréntesis puede dar otro número.',
    syntax: '(a + b) * c',
    example: 'SELECT nombre,\n       (salario + bono) * 12\nFROM empleados;',
    humanReading: 'Suma salario y bono de cada empleado y multiplica el total por 12.',
    keyTakeaway: 'Ante la duda, escribe los paréntesis.',
    lesson: 'precedencia',
    keywords: ['precedencia', 'parentesis', 'orden de operaciones'],
  },
  parentheses: {
    title: '( )',
    name: 'Paréntesis',
    category: 'grouping',
    definition:
      'Los paréntesis agrupan una parte de una expresión o condición para que Oracle la evalúe primero.',
    gloss: 'agrupan lo que se evalúa primero',
    whatItDoes: 'Cambian el orden normal de evaluación: primero lo de dentro, después lo de fuera.',
    whyItMatters:
      'Sin ellos, * se calcula antes que + y AND antes que OR, y el resultado puede cambiar.',
    syntax: '(expresión) · (condición)',
    example: 'SELECT nombre,\n       (salario + bono) * 12 AS total_anual\nFROM empleados;',
    humanReading: 'Muéstrame el nombre y lo que gana al año cada empleado sumando salario y bono.',
    keyTakeaway: 'Ante la duda, usa paréntesis: dejan explícito qué se evalúa primero.',
    mistake: {
      wrong: 'SELECT nombre, (salario + bono * 12\nFROM empleados;',
      right: 'SELECT nombre, (salario + bono) * 12\nFROM empleados;',
      why: 'Cada paréntesis que se abre debe cerrarse.',
    },
    lesson: 'precedencia',
    keywords: ['parentesis', 'agrupar', 'precedencia', '( )'],
  },
  alias: {
    title: 'Alias',
    name: 'Alias de columna',
    category: 'alias',
    definition:
      'Un alias es un nombre temporal que hace más claro el encabezado de una columna o expresión.',
    gloss: 'nombre temporal de una columna del resultado',
    whatItDoes: 'Cambia el encabezado del resultado; la columna guardada conserva su nombre.',
    whyItMatters: 'SALARIO_ANUAL se entiende mejor que SALARIO*12.',
    syntax: 'expresión AS alias',
    example: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    humanReading: 'Muéstrame el nombre y el salario de un año, con el encabezado SALARIO_ANUAL.',
    keyTakeaway: 'El alias no cambia la tabla ni sus datos.',
    mistake: {
      wrong:
        'SELECT salario * 12 AS salario_anual\nFROM empleados\nWHERE salario_anual > 60000000;',
      right: 'SELECT salario * 12 AS salario_anual\nFROM empleados\nWHERE salario * 12 > 60000000;',
      why: 'WHERE se evalúa antes que SELECT: todavía no conoce el alias.',
    },
    oracleNote: 'Sin comillas, Oracle muestra el alias en mayúsculas.',
    lesson: 'alias',
    keywords: ['alias', 'encabezado', 'renombrar columna'],
  },
  as: {
    title: 'AS',
    name: 'Palabra clave AS',
    category: 'alias-keyword',
    definition: 'AS permite escribir explícitamente el alias de una columna o expresión.',
    gloss: 'asigna el alias de forma explícita',
    whatItDoes: 'Es opcional: salario * 12 salario_anual también funciona, pero AS se lee mejor.',
    whyItMatters: 'Hace evidente que la palabra siguiente es un nombre nuevo, no otra columna.',
    syntax: 'columna AS alias',
    example: 'SELECT nombre AS empleado\nFROM empleados;',
    humanReading: 'Muéstrame el nombre con el encabezado EMPLEADO.',
    keyTakeaway: 'AS es opcional en columnas, pero deja clara la intención.',
    lesson: 'alias',
    keywords: ['as', 'alias'],
  },
  concat: {
    title: '||',
    name: 'Operador de concatenación',
    category: 'concat-operator',
    definition:
      '|| une dos textos en uno solo; los textos fijos se escriben entre comillas simples.',
    gloss: 'une varios textos en uno',
    whatItDoes: "nombre || ' ' || apellido crea un texto nuevo por fila.",
    whyItMatters: 'Sirve para mostrar un nombre completo o una frase con datos.',
    syntax: "texto || ' ' || texto",
    example: "SELECT nombre || ' ' || apellido AS nombre_completo\nFROM empleados;",
    humanReading: 'Muéstrame el nombre y el apellido unidos con un espacio.',
    keyTakeaway: 'Oracle usa || para unir textos, no +.',
    lesson: 'concatenacion',
    keywords: ['concatenar', 'concatenacion', 'unir textos', '||', 'comillas'],
  },
  distinct: {
    title: 'DISTINCT',
    name: 'Palabra clave DISTINCT',
    category: 'keyword',
    definition:
      'DISTINCT elimina las filas repetidas del resultado sin borrar registros de la tabla.',
    gloss: 'quita repeticiones del resultado',
    whatItDoes: 'Compara las filas completas del resultado y deja una sola copia de cada una.',
    whyItMatters: 'Responde «¿qué valores distintos hay?», como las ciudades con empleados.',
    syntax: 'SELECT DISTINCT columna',
    example: 'SELECT DISTINCT ciudad\nFROM empleados;',
    humanReading: 'Muéstrame cada ciudad una sola vez.',
    keyTakeaway: 'DISTINCT no ordena ni borra datos.',
    mistake: {
      wrong: 'SELECT nombre, DISTINCT ciudad\nFROM empleados;',
      right: 'SELECT DISTINCT ciudad\nFROM empleados;',
      why: 'DISTINCT forma parte de la selección: va justo después de SELECT.',
    },
    lesson: 'distinct',
    keywords: ['distinct', 'repetidos', 'duplicados', 'unicos'],
  },
  where: {
    title: 'WHERE',
    name: 'Cláusula WHERE',
    category: 'clause',
    definition: 'WHERE conserva únicamente las filas que cumplen una condición.',
    gloss: 'decide qué filas cumplen la condición',
    whatItDoes:
      'Evalúa la condición en cada fila: si es verdadera, la fila pasa; si es falsa o desconocida, se descarta.',
    whyItMatters: 'Responde preguntas concretas: solo Cali, solo activos, solo salarios altos.',
    syntax: 'WHERE condición',
    example: "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali';",
    humanReading: 'Muéstrame el nombre y la ciudad de los empleados de Cali.',
    keyTakeaway: 'WHERE decide las filas; SELECT, las columnas.',
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE ciudad = Cali;',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';",
      why: 'Sin comillas, Oracle busca una columna llamada CALI.',
    },
    lesson: 'where',
    keywords: ['where', 'filtrar', 'condicion', 'filas'],
  },
  comparison: {
    title: '= <> > <',
    name: 'Operadores de comparación',
    category: 'comparison-operator',
    definition:
      'Un operador de comparación compara dos valores: igual, distinto, mayor, menor o mayor y menor o igual.',
    gloss: 'compara dos valores',
    whatItDoes:
      '= igual · <> o != distinto · > mayor · >= mayor o igual · < menor · <= menor o igual.',
    whyItMatters: 'Es la pieza con la que se escriben casi todas las condiciones.',
    syntax: "columna >= valor · columna = 'texto'",
    example: 'SELECT nombre, salario\nFROM empleados\nWHERE salario >= 5000000;',
    humanReading: 'Muéstrame los empleados que ganan 5.000.000 o más.',
    keyTakeaway: "Los textos se comparan entre comillas simples: 'Cali'.",
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE ciudad = "Cali";',
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';",
      why: 'Las comillas dobles nombran columnas; los textos van entre comillas simples.',
    },
    lesson: 'comparaciones',
    keywords: ['comparacion', 'mayor', 'menor', 'igual', 'distinto', '<>', '!=', '>='],
  },
  and: {
    title: 'AND',
    name: 'Operador lógico AND',
    category: 'logical-operator',
    definition: 'AND exige que todas las condiciones conectadas sean verdaderas.',
    gloss: 'deben cumplirse ambas condiciones',
    whatItDoes: 'La fila pasa solo si cumple la primera condición y también la segunda.',
    whyItMatters: 'Cada AND añade un requisito y hace el filtro más exigente.',
    syntax: 'condición1 AND condición2',
    example: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Bogotá'\n  AND salario > 5000000;",
    humanReading: 'Muéstrame los empleados de Bogotá que además ganan más de 5.000.000.',
    keyTakeaway: 'AND: se cumplen todas.',
    lesson: 'and-or',
    keywords: ['and', 'y', 'todas las condiciones'],
  },
  or: {
    title: 'OR',
    name: 'Operador lógico OR',
    category: 'logical-operator',
    definition: 'OR acepta una fila cuando al menos una de las condiciones es verdadera.',
    gloss: 'basta con que se cumpla una',
    whatItDoes: 'La fila pasa si cumple la primera condición, la segunda o ambas.',
    whyItMatters: 'Cada OR abre un camino más y amplía el resultado.',
    syntax: 'condición1 OR condición2',
    example: "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali'\n   OR ciudad = 'Barranquilla';",
    humanReading: 'Muéstrame los empleados de Cali o de Barranquilla.',
    keyTakeaway: 'OR: basta con una.',
    lesson: 'and-or',
    keywords: ['or', 'o', 'alguna condicion'],
  },
  not: {
    title: 'NOT',
    name: 'Operador lógico NOT',
    category: 'logical-operator',
    definition: 'NOT invierte el resultado lógico de una condición.',
    gloss: 'invierte una condición',
    whatItDoes:
      'Lo verdadero pasa a falso y lo falso a verdadero; si la condición es desconocida por NULL, sigue desconocida.',
    whyItMatters: 'Permite pedir «todos menos…» sin enumerar cada caso.',
    syntax: 'NOT condición',
    example: "SELECT nombre, ciudad\nFROM empleados\nWHERE NOT ciudad = 'Bogotá';",
    humanReading: 'Muéstrame los empleados que no son de Bogotá.',
    keyTakeaway: 'También se escribe dentro de otras condiciones: NOT IN, IS NOT NULL.',
    lesson: 'and-or',
    keywords: ['not', 'negar', 'excepto', 'no'],
  },
  'logical-precedence': {
    title: 'NOT · AND · OR',
    name: 'Precedencia lógica',
    category: 'rule',
    definition:
      'Oracle evalúa primero NOT, después AND y al final OR; los paréntesis imponen el orden que tú quieres.',
    gloss: 'AND se evalúa antes que OR',
    whatItDoes: 'a OR b AND c se lee a OR (b AND c).',
    whyItMatters: 'Sin paréntesis, una condición puede dejar pasar filas que no esperabas.',
    syntax: 'WHERE (c1 OR c2) AND c3',
    example:
      "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
    humanReading: 'Muéstrame los empleados de Bogotá o Medellín que ganan más de 5.000.000.',
    keyTakeaway: 'Si mezclas AND y OR, usa paréntesis.',
    lesson: 'parentesis',
    keywords: ['parentesis', 'precedencia logica', 'and antes que or'],
  },
  between: {
    title: 'BETWEEN',
    name: 'Condición BETWEEN',
    category: 'condition',
    definition:
      'BETWEEN comprueba si un valor se encuentra dentro de un rango, incluyendo ambos extremos.',
    gloss: 'valor dentro de un intervalo, extremos incluidos',
    whatItDoes: 'Equivale a valor >= menor AND valor <= mayor; el menor se escribe primero.',
    whyItMatters: 'Expresa rangos de salarios o fechas en una sola condición legible.',
    syntax: 'columna BETWEEN menor AND mayor',
    example: 'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
    humanReading: 'Muéstrame los empleados que ganan entre 3 y 6 millones, ambos incluidos.',
    keyTakeaway: 'Los dos límites cuentan.',
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 6000000 AND 3000000;',
      right: 'SELECT nombre\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
      why: 'Con el mayor primero, ningún valor cumple.',
    },
    lesson: 'between',
    keywords: ['between', 'rango', 'entre', 'limites'],
  },
  in: {
    title: 'IN',
    name: 'Condición IN',
    category: 'condition',
    definition: 'IN comprueba si un valor pertenece a una lista de opciones.',
    gloss: 'valor dentro de una lista',
    whatItDoes: 'Equivale a varias comparaciones con = unidas por OR, pero más corta.',
    whyItMatters: 'Una lista se lee y se amplía mejor que una cadena de OR.',
    syntax: "columna IN ('a', 'b', 'c')",
    example:
      "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Medellín', 'Cali');",
    humanReading: 'Muéstrame los empleados de Bogotá, Medellín o Cali.',
    keyTakeaway: 'La lista va entre paréntesis, separada por comas.',
    mistake: {
      wrong: "SELECT nombre\nFROM empleados\nWHERE ciudad IN 'Bogotá', 'Cali';",
      right: "SELECT nombre\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Cali');",
      why: 'Sin paréntesis, Oracle no reconoce la lista.',
    },
    lesson: 'in',
    keywords: ['in', 'lista', 'varios valores'],
  },
  like: {
    title: 'LIKE',
    name: 'Condición LIKE',
    category: 'condition',
    definition: 'LIKE busca texto mediante patrones en lugar de exigir una coincidencia exacta.',
    gloss: 'texto que sigue un patrón',
    whatItDoes:
      'Compara el texto con un patrón; % y _ ocupan el lugar de caracteres que no conoces.',
    whyItMatters: 'Encuentra nombres que empiezan, terminan o contienen algo.',
    syntax: "columna LIKE 'patrón'",
    example: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';",
    humanReading: 'Muéstrame los empleados cuyo nombre empieza por A.',
    keyTakeaway: "LIKE distingue mayúsculas: 'a%' no encuentra «Ana».",
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE nombre LIKE A%;',
      right: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';",
      why: 'El patrón es un texto: va entre comillas simples.',
    },
    lesson: 'like',
    keywords: ['like', 'patron', 'contiene', 'empieza', 'termina', 'comodin'],
  },
  percent: {
    title: '%',
    name: 'Comodín %',
    category: 'wildcard-like',
    definition: '% representa cero o más caracteres dentro de un patrón LIKE.',
    gloss: 'cero o más caracteres',
    whatItDoes: "'A%' empieza por A · '%a' termina en a · '%ar%' contiene ar.",
    whyItMatters: 'Permite buscar por una parte del texto.',
    syntax: "LIKE 'A%'",
    example: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE '%ar%';",
    humanReading: 'Muéstrame los nombres que contienen «ar».',
    keyTakeaway: '% puede ocupar cero caracteres: «Ana» cumple A%.',
    lesson: 'like',
    keywords: ['%', 'porcentaje', 'comodin'],
  },
  underscore: {
    title: '_',
    name: 'Comodín _',
    category: 'wildcard-like',
    definition: '_ representa exactamente un carácter dentro de un patrón LIKE.',
    gloss: 'exactamente un carácter',
    whatItDoes: "'_a%' exige cualquier letra y después una a en la segunda posición.",
    whyItMatters: 'Sirve cuando importa la posición exacta de una letra.',
    syntax: "LIKE '_a%'",
    example: "SELECT nombre\nFROM empleados\nWHERE nombre LIKE '_a%';",
    humanReading: 'Muéstrame los nombres cuya segunda letra es a.',
    keyTakeaway: '_ ocupa un carácter, ni más ni menos.',
    lesson: 'like',
    keywords: ['_', 'guion bajo', 'un caracter'],
  },
  null: {
    title: 'NULL',
    name: 'Valor NULL',
    category: 'value',
    definition: 'NULL representa la ausencia de un valor: no es cero ni el texto «NULL».',
    gloss: 'ausencia de valor',
    whatItDoes:
      'Cualquier comparación con NULL da un resultado desconocido, así que = NULL nunca encuentra filas.',
    whyItMatters: 'Los datos incompletos son normales: un empleado puede no tener bono.',
    syntax: 'columna IS NULL',
    example: 'SELECT nombre, bono\nFROM empleados;',
    humanReading: 'Muéstrame el bono de cada empleado, también de quienes no tienen.',
    keyTakeaway: 'NULL no se compara con =: se pregunta con IS NULL.',
    oracleNote:
      "Oracle guarda el texto vacío ('') como NULL, así que '' tampoco sirve para buscarlo.",
    lesson: 'null',
    keywords: ['null', 'nulo', 'vacio', 'sin valor'],
  },
  'is-null': {
    title: 'IS NULL',
    name: 'Condición IS NULL',
    category: 'condition',
    definition: 'IS NULL comprueba si una columna no tiene valor, es decir, si es NULL.',
    gloss: 'la columna no tiene valor',
    whatItDoes: 'Es la única forma correcta de preguntar por NULL en una condición.',
    whyItMatters: 'Encuentra los datos que faltan, como los empleados sin bono.',
    syntax: 'columna IS NULL · columna IS NOT NULL',
    example: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;',
    humanReading: 'Muéstrame los empleados que no tienen bono.',
    keyTakeaway: 'bono = NULL devuelve 0 filas; bono IS NULL, las que buscas.',
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE bono = NULL;',
      right: 'SELECT nombre\nFROM empleados\nWHERE bono IS NULL;',
      why: 'Comparar con = NULL nunca es verdadero.',
    },
    lesson: 'null',
    keywords: ['is null', 'is not null', 'sin bono'],
  },
  'is-not-null': {
    title: 'IS NOT NULL',
    name: 'Condición IS NOT NULL',
    category: 'condition',
    definition: 'IS NOT NULL comprueba si una columna tiene un valor, es decir, si no es NULL.',
    gloss: 'la columna sí tiene valor',
    whatItDoes: 'Conserva las filas en las que la columna tiene cualquier valor, incluido 0.',
    whyItMatters: 'Permite trabajar solo con los empleados que sí tienen un bono asignado.',
    syntax: 'columna IS NOT NULL',
    example: 'SELECT nombre, bono\nFROM empleados\nWHERE bono IS NOT NULL;',
    humanReading: 'Muéstrame el nombre y el bono de los empleados que tienen bono.',
    keyTakeaway: 'Para preguntar si hay valor: IS NOT NULL, nunca <> NULL.',
    mistake: {
      wrong: 'SELECT nombre\nFROM empleados\nWHERE bono <> NULL;',
      right: 'SELECT nombre\nFROM empleados\nWHERE bono IS NOT NULL;',
      why: 'Comparar con <> NULL tampoco es nunca verdadero.',
    },
    lesson: 'null',
    keywords: ['is not null', 'con valor', 'no nulo'],
  },
  'order-by': {
    title: 'ORDER BY',
    name: 'Cláusula ORDER BY',
    category: 'clause',
    definition: 'ORDER BY organiza las filas del resultado según uno o varios criterios.',
    gloss: 'ordena las filas del resultado',
    whatItDoes:
      'Ordena por la primera columna; la segunda solo desempata filas iguales en la primera.',
    whyItMatters: 'Responde «del mayor al menor» o «alfabéticamente».',
    syntax: 'ORDER BY columna ASC | DESC',
    example: 'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;',
    humanReading: 'Muéstrame los empleados del salario más alto al más bajo.',
    keyTakeaway: 'Sin ORDER BY, Oracle no garantiza ningún orden.',
    lesson: 'order-by',
    keywords: ['order by', 'ordenar', 'orden'],
  },
  asc: {
    title: 'ASC',
    name: 'Orden ascendente',
    category: 'sort-option',
    definition: 'ASC ordena de menor a mayor o de A a Z.',
    gloss: 'de menor a mayor',
    whatItDoes: 'Es el orden por defecto; en Oracle, los NULL quedan al final.',
    whyItMatters: 'Listas alfabéticas y valores de menor a mayor.',
    syntax: 'ORDER BY columna ASC',
    example: 'SELECT nombre\nFROM empleados\nORDER BY nombre ASC;',
    humanReading: 'Muéstrame los nombres en orden alfabético.',
    keyTakeaway: 'Si no escribes nada, el orden es ASC.',
    lesson: 'order-by',
    keywords: ['asc', 'ascendente', 'menor a mayor', 'alfabetico'],
  },
  desc: {
    title: 'DESC',
    name: 'Orden descendente',
    category: 'sort-option',
    definition: 'DESC ordena de mayor a menor o de Z a A.',
    gloss: 'de mayor a menor',
    whatItDoes: 'Invierte el orden; en Oracle, los NULL quedan al principio.',
    whyItMatters: 'Rankings: el salario más alto primero.',
    syntax: 'ORDER BY columna DESC',
    example: 'SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;',
    humanReading: 'Muéstrame los salarios del más alto al más bajo.',
    keyTakeaway: 'DESC se escribe después de cada columna que quieres invertir.',
    lesson: 'order-by',
    keywords: ['desc', 'descendente', 'mayor a menor'],
  },
};

export const SQL_CONCEPTS: Readonly<Record<ConceptId, SqlConcept>> = Object.freeze(
  Object.fromEntries(
    Object.entries(DEFINITIONS).map(([id, concept]) => [
      id,
      Object.freeze({ ...concept, id: id as ConceptId, level: 1 as const }),
    ]),
  ) as Record<ConceptId, SqlConcept>,
);

export const CONCEPT_IDS = Object.keys(SQL_CONCEPTS) as ConceptId[];

export function concept(id: ConceptId): SqlConcept {
  return SQL_CONCEPTS[id];
}

export function conceptCategoryLabel(id: ConceptId): string {
  return CONCEPT_CATEGORY_LABEL[SQL_CONCEPTS[id].category];
}

/** Conceptos que desarrolla una lección, en el orden en que se enseñan. */
export function conceptsOfLesson(slug: string): readonly SqlConcept[] {
  return CONCEPT_IDS.map((id) => SQL_CONCEPTS[id]).filter((entry) => entry.lesson === slug);
}
