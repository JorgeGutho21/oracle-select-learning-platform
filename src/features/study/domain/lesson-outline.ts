/**
 * Esquema de la unidad «SELECT en Oracle SQL» (CONTENT_MAP, nivel actual): ocho bloques y
 * veintidós lecciones. Es la fuente de identificadores, rutas, títulos y palabras de
 * búsqueda; el contenido completo de cada lección está en `lesson-content.ts`. Es ligero a
 * propósito: el buscador lo incluye en el navegador.
 */

export type LessonId =
  | 'L00'
  | 'L01'
  | 'L02'
  | 'L03'
  | 'L04'
  | 'L05'
  | 'L06'
  | 'L07'
  | 'L08'
  | 'L09'
  | 'L10'
  | 'L11'
  | 'L12'
  | 'L13'
  | 'L14'
  | 'L15'
  | 'L16'
  | 'L17'
  | 'L18'
  | 'L19'
  | 'L20'
  | 'L21';

export type BlockId =
  | 'fundamentos'
  | 'primera-consulta'
  | 'duplicados'
  | 'filtrar'
  | 'operadores'
  | 'null'
  | 'ordenar'
  | 'integracion';

export interface StudyBlock {
  readonly id: BlockId;
  readonly letter: string;
  readonly title: string;
  readonly summary: string;
}

export const STUDY_BLOCKS: readonly StudyBlock[] = [
  {
    id: 'fundamentos',
    letter: 'A',
    title: 'Fundamentos',
    summary: 'Qué es una base de datos, qué hace SQL y cómo es la tabla EMPLEADOS.',
  },
  {
    id: 'primera-consulta',
    letter: 'B',
    title: 'Primera consulta',
    summary: 'SELECT, FROM, columnas, cálculos, alias y textos.',
  },
  {
    id: 'duplicados',
    letter: 'C',
    title: 'Duplicados',
    summary: 'Quitar filas repetidas del resultado con DISTINCT.',
  },
  {
    id: 'filtrar',
    letter: 'D',
    title: 'Filtrar filas',
    summary: 'WHERE, comparaciones, AND, OR y paréntesis.',
  },
  {
    id: 'operadores',
    letter: 'E',
    title: 'Operadores de filtro',
    summary: 'Rangos con BETWEEN, listas con IN y patrones con LIKE.',
  },
  {
    id: 'null',
    letter: 'F',
    title: 'NULL',
    summary: 'La ausencia de valor y cómo preguntar por ella.',
  },
  {
    id: 'ordenar',
    letter: 'G',
    title: 'Ordenar resultados',
    summary: 'ORDER BY, ASC, DESC y varias columnas.',
  },
  {
    id: 'integracion',
    letter: 'H',
    title: 'Integración',
    summary: 'Construir una consulta completa y reconocer los errores frecuentes.',
  },
];

/** Ficha de la chuleta imprimible y del buscador («Conceptos»). */
export interface ConceptCard {
  readonly title: string;
  readonly meaning: string;
  readonly pattern: string;
  readonly example: string;
  readonly keywords: readonly string[];
}

export interface LessonOutline {
  readonly id: LessonId;
  readonly slug: string;
  readonly block: BlockId;
  readonly title: string;
  readonly shortTitle: string;
  /** Sintaxis corta que identifica la lección en tarjetas y en la ruta. */
  readonly badge: string;
  /** Una frase: qué se aprende. */
  readonly summary: string;
  /** Términos de búsqueda sin tildes. */
  readonly keywords: readonly string[];
  readonly concept: ConceptCard | null;
}

export const LESSON_OUTLINE: readonly LessonOutline[] = [
  {
    id: 'L00',
    slug: 'introduccion',
    block: 'fundamentos',
    title: 'Bases de datos, tablas y SQL',
    shortTitle: '¿Qué es SQL?',
    badge: 'SQL',
    summary: 'Una base de datos guarda tablas; SQL es el lenguaje para pedirles datos.',
    keywords: [
      'sql',
      'que es sql',
      'base de datos',
      'tabla',
      'fila',
      'columna',
      'registro',
      'consultar',
      'modificar',
      'introduccion',
    ],
    concept: null,
  },
  {
    id: 'L01',
    slug: 'empleados',
    block: 'fundamentos',
    title: 'Nuestra tabla EMPLEADOS',
    shortTitle: 'EMPLEADOS',
    badge: 'EMPLEADOS',
    summary: 'Las 20 filas y 12 columnas que usa toda la unidad.',
    keywords: ['empleados', 'dataset', 'datos', 'esquema', 'tipos', 'number', 'varchar2', 'date'],
    concept: null,
  },
  {
    id: 'L02',
    slug: 'select',
    block: 'primera-consulta',
    title: 'SELECT: qué columnas mostrar',
    shortTitle: 'SELECT',
    badge: 'SELECT',
    summary: 'SELECT indica qué columnas quieres ver en el resultado.',
    keywords: ['select', 'seleccionar', 'mostrar', 'consultar', 'columnas', 'proyeccion'],
    concept: {
      title: 'SELECT',
      meaning: 'Elige qué columnas mostrar.',
      pattern: 'SELECT columna FROM tabla;',
      example: 'SELECT nombre FROM empleados;',
      keywords: ['select', 'seleccionar', 'mostrar columnas'],
    },
  },
  {
    id: 'L03',
    slug: 'from',
    block: 'primera-consulta',
    title: 'FROM: de qué tabla salen los datos',
    shortTitle: 'FROM',
    badge: 'FROM',
    summary: 'FROM indica la tabla de la que salen las filas.',
    keywords: ['from', 'tabla', 'origen', 'de donde'],
    concept: {
      title: 'FROM',
      meaning: 'Indica la tabla de origen.',
      pattern: 'SELECT … FROM tabla;',
      example: 'SELECT cargo FROM empleados;',
      keywords: ['from', 'tabla de origen'],
    },
  },
  {
    id: 'L04',
    slug: 'asterisco',
    block: 'primera-consulta',
    title: 'SELECT *: todas las columnas',
    shortTitle: 'SELECT *',
    badge: '*',
    summary: 'El asterisco pide todas las columnas de la tabla, en su orden.',
    keywords: ['asterisco', 'todas las columnas', 'select *', 'estrella', '*'],
    concept: {
      title: 'SELECT *',
      meaning: 'Todas las columnas, en el orden de la tabla.',
      pattern: 'SELECT * FROM tabla;',
      example: 'SELECT * FROM empleados;',
      keywords: ['asterisco', '*', 'todas las columnas'],
    },
  },
  {
    id: 'L05',
    slug: 'columnas',
    block: 'primera-consulta',
    title: 'Columnas específicas y comas',
    shortTitle: 'Columnas',
    badge: 'a, b',
    summary: 'Pide solo las columnas que necesitas, separadas por comas y en el orden que quieras.',
    keywords: ['columnas', 'lista de columnas', 'coma', 'orden de columnas', 'especificas'],
    concept: {
      title: 'Lista de columnas',
      meaning: 'Columnas separadas por comas, en el orden pedido.',
      pattern: 'SELECT columna1, columna2 FROM tabla;',
      example: 'SELECT nombre, ciudad FROM empleados;',
      keywords: ['coma', 'columnas', 'orden'],
    },
  },
  {
    id: 'L06',
    slug: 'expresiones',
    block: 'primera-consulta',
    title: 'Expresiones aritméticas',
    shortTitle: 'Expresiones',
    badge: '+ - * /',
    summary: 'Calcula valores nuevos en cada fila con + - * /, sin cambiar la tabla.',
    keywords: ['expresiones', 'calculos', 'aritmetica', 'operadores', 'suma', 'multiplicar'],
    concept: {
      title: 'Expresiones',
      meaning: 'Un cálculo por fila; la tabla no cambia.',
      pattern: 'SELECT columna * número FROM tabla;',
      example: 'SELECT nombre, salario * 12 FROM empleados;',
      keywords: ['expresion', 'calculo', 'aritmetica'],
    },
  },
  {
    id: 'L07',
    slug: 'precedencia',
    block: 'primera-consulta',
    title: 'Precedencia y paréntesis',
    shortTitle: 'Precedencia',
    badge: '( )',
    summary: '* y / se calculan antes que + y -; los paréntesis cambian ese orden.',
    keywords: ['precedencia', 'parentesis', 'orden de operaciones', 'prioridad'],
    concept: {
      title: 'Precedencia aritmética',
      meaning: '* y / antes que + y -; los paréntesis mandan.',
      pattern: '(a + b) * c',
      example: 'SELECT (salario + bono) * 12 FROM empleados;',
      keywords: ['precedencia', 'parentesis'],
    },
  },
  {
    id: 'L08',
    slug: 'alias',
    block: 'primera-consulta',
    title: 'Alias de columna con AS',
    shortTitle: 'Alias con AS',
    badge: 'AS',
    summary: 'AS le pone un nombre temporal y más claro a una columna del resultado.',
    keywords: ['alias', 'as', 'encabezado', 'renombrar', 'nombre de columna'],
    concept: {
      title: 'Alias con AS',
      meaning: 'Cambia el encabezado del resultado, no la tabla.',
      pattern: 'SELECT expresión AS alias FROM tabla;',
      example: 'SELECT salario * 12 AS salario_anual FROM empleados;',
      keywords: ['alias', 'as', 'encabezado'],
    },
  },
  {
    id: 'L09',
    slug: 'concatenacion',
    block: 'primera-consulta',
    title: 'Textos fijos y concatenación con ||',
    shortTitle: 'Concatenación',
    badge: '||',
    summary: 'Escribe textos entre comillas simples y únelos con ||.',
    keywords: ['concatenacion', 'concatenar', '||', 'literal', 'texto', 'unir textos', 'comillas'],
    concept: {
      title: 'Concatenación ||',
      meaning: 'Une textos; los textos van entre comillas simples.',
      pattern: "SELECT a || ' ' || b AS alias FROM tabla;",
      example: "SELECT nombre || ' ' || apellido AS nombre_completo FROM empleados;",
      keywords: ['||', 'concatenar', 'literal'],
    },
  },
  {
    id: 'L10',
    slug: 'distinct',
    block: 'duplicados',
    title: 'DISTINCT: sin filas repetidas',
    shortTitle: 'DISTINCT',
    badge: 'DISTINCT',
    summary: 'DISTINCT quita del resultado las filas repetidas.',
    keywords: ['distinct', 'duplicados', 'repetidos', 'unicos', 'sin repetir'],
    concept: {
      title: 'DISTINCT',
      meaning: 'Una sola vez cada fila repetida del resultado.',
      pattern: 'SELECT DISTINCT columna FROM tabla;',
      example: 'SELECT DISTINCT ciudad FROM empleados;',
      keywords: ['distinct', 'sin repetir'],
    },
  },
  {
    id: 'L11',
    slug: 'where',
    block: 'filtrar',
    title: 'WHERE: filtrar filas',
    shortTitle: 'WHERE',
    badge: 'WHERE',
    summary: 'WHERE decide qué filas quieres conservar.',
    keywords: ['where', 'filtrar', 'filtro', 'condicion', 'filas', 'igual', '='],
    concept: {
      title: 'WHERE',
      meaning: 'Conserva solo las filas que cumplen la condición.',
      pattern: 'SELECT … FROM tabla WHERE condición;',
      example: "SELECT nombre FROM empleados WHERE ciudad = 'Cali';",
      keywords: ['where', 'filtrar'],
    },
  },
  {
    id: 'L12',
    slug: 'comparaciones',
    block: 'filtrar',
    title: 'Operadores de comparación',
    shortTitle: 'Comparaciones',
    badge: '= <> > <',
    summary: 'Compara con =, <>, !=, >, >=, < y <=; los textos van entre comillas simples.',
    keywords: [
      'comparaciones',
      'operadores de comparacion',
      'mayor que',
      'menor que',
      'distinto',
      'diferente',
      '<>',
      '!=',
      'comillas',
      'texto',
    ],
    concept: {
      title: 'Comparaciones',
      meaning: '= <> != > >= < <=; textos entre comillas simples.',
      pattern: "columna > valor · columna = 'texto'",
      example: 'SELECT nombre FROM empleados WHERE salario >= 5000000;',
      keywords: ['comparacion', 'mayor', 'menor', 'distinto'],
    },
  },
  {
    id: 'L13',
    slug: 'and-or',
    block: 'filtrar',
    title: 'AND y OR: combinar condiciones',
    shortTitle: 'AND y OR',
    badge: 'AND · OR',
    summary: 'AND exige que se cumplan todas las condiciones; OR, al menos una.',
    keywords: ['and', 'or', 'y', 'o', 'combinar condiciones', 'logica', 'operadores logicos'],
    concept: {
      title: 'AND y OR',
      meaning: 'AND: todas se cumplen. OR: al menos una.',
      pattern: 'WHERE condición1 AND condición2',
      example: "SELECT nombre FROM empleados WHERE ciudad = 'Cali' AND estado = 'ACTIVO';",
      keywords: ['and', 'or'],
    },
  },
  {
    id: 'L14',
    slug: 'parentesis',
    block: 'filtrar',
    title: 'Precedencia lógica y paréntesis',
    shortTitle: 'Paréntesis',
    badge: '( OR ) AND',
    summary: 'AND se evalúa antes que OR: los paréntesis dejan clara la intención. NOT invierte.',
    keywords: ['parentesis', 'precedencia logica', 'and antes que or', 'not', 'negacion'],
    concept: {
      title: 'Paréntesis en condiciones',
      meaning: 'NOT, luego AND, luego OR; los paréntesis agrupan.',
      pattern: 'WHERE (c1 OR c2) AND c3',
      example:
        "SELECT nombre FROM empleados WHERE (ciudad = 'Cali' OR ciudad = 'Bogotá') AND salario > 5000000;",
      keywords: ['parentesis', 'precedencia', 'not'],
    },
  },
  {
    id: 'L15',
    slug: 'between',
    block: 'operadores',
    title: 'BETWEEN: rangos',
    shortTitle: 'BETWEEN',
    badge: 'BETWEEN',
    summary: 'BETWEEN a AND b conserva los valores del rango, con los dos límites incluidos.',
    keywords: ['between', 'rango', 'entre', 'intervalo', 'not between', 'limites'],
    concept: {
      title: 'BETWEEN',
      meaning: 'Entre dos valores, límites incluidos (= >= AND <=).',
      pattern: 'WHERE columna BETWEEN menor AND mayor',
      example: 'SELECT nombre FROM empleados WHERE salario BETWEEN 3000000 AND 6000000;',
      keywords: ['between', 'rango'],
    },
  },
  {
    id: 'L16',
    slug: 'in',
    block: 'operadores',
    title: 'IN: listas de valores',
    shortTitle: 'IN',
    badge: 'IN',
    summary: 'IN compara con una lista de valores: es un atajo de varios OR.',
    keywords: ['in', 'lista', 'lista de valores', 'not in', 'varios valores'],
    concept: {
      title: 'IN',
      meaning: 'Igual a alguno de la lista (atajo de OR).',
      pattern: "WHERE columna IN ('a', 'b')",
      example: "SELECT nombre FROM empleados WHERE ciudad IN ('Bogotá', 'Cali');",
      keywords: ['in', 'lista'],
    },
  },
  {
    id: 'L17',
    slug: 'like',
    block: 'operadores',
    title: 'LIKE: patrones de texto',
    shortTitle: 'LIKE',
    badge: 'LIKE',
    summary: 'LIKE busca textos con un patrón: % es cualquier cantidad de caracteres y _ uno solo.',
    keywords: ['like', 'patron', 'comodin', '%', '_', 'empieza por', 'contiene', 'not like'],
    concept: {
      title: 'LIKE',
      meaning: '% cualquier cantidad de caracteres; _ exactamente uno.',
      pattern: "WHERE columna LIKE 'A%'",
      example: "SELECT nombre FROM empleados WHERE nombre LIKE '%ar%';",
      keywords: ['like', 'comodin', 'patron'],
    },
  },
  {
    id: 'L18',
    slug: 'null',
    block: 'null',
    title: 'NULL, IS NULL e IS NOT NULL',
    shortTitle: 'NULL',
    badge: 'IS NULL',
    summary: 'NULL es la ausencia de valor; se pregunta con IS NULL, nunca con = NULL.',
    keywords: ['null', 'is null', 'is not null', 'nulo', 'vacio', 'sin valor', '= null'],
    concept: {
      title: 'IS NULL',
      meaning: 'NULL no es 0: se pregunta con IS NULL.',
      pattern: 'WHERE columna IS NULL',
      example: 'SELECT nombre FROM empleados WHERE bono IS NULL;',
      keywords: ['null', 'is null'],
    },
  },
  {
    id: 'L19',
    slug: 'order-by',
    block: 'ordenar',
    title: 'ORDER BY: ordenar el resultado',
    shortTitle: 'ORDER BY',
    badge: 'ORDER BY',
    summary: 'ORDER BY ordena las filas del resultado: ASC de menor a mayor y DESC al revés.',
    keywords: ['order by', 'ordenar', 'orden', 'asc', 'desc', 'ascendente', 'descendente'],
    concept: {
      title: 'ORDER BY',
      meaning: 'Ordena el resultado; ASC por defecto, DESC al revés.',
      pattern: 'ORDER BY columna DESC',
      example: 'SELECT nombre, salario FROM empleados ORDER BY salario DESC;',
      keywords: ['order by', 'asc', 'desc'],
    },
  },
  {
    id: 'L20',
    slug: 'consulta-completa',
    block: 'integracion',
    title: 'La consulta completa, paso a paso',
    shortTitle: 'Consulta completa',
    badge: 'SELECT … ORDER BY',
    summary: 'Anatomía, orden de escritura y modelo lógico para pasar de una pregunta a SQL.',
    keywords: [
      'consulta completa',
      'anatomia',
      'orden de escritura',
      'procesamiento logico',
      'paso a paso',
      'integracion',
    ],
    concept: null,
  },
  {
    id: 'L21',
    slug: 'errores-frecuentes',
    block: 'integracion',
    title: 'Errores frecuentes',
    shortTitle: 'Errores frecuentes',
    badge: 'ERROR',
    summary: 'Los errores típicos al empezar: cómo reconocerlos y corregirlos.',
    keywords: ['errores', 'errores frecuentes', 'depurar', 'corregir', 'fallos', 'principiante'],
    concept: null,
  },
];

export function findLessonOutline(slug: string): LessonOutline | undefined {
  return LESSON_OUTLINE.find((lesson) => lesson.slug === slug);
}

export function blockOf(block: BlockId): StudyBlock {
  return STUDY_BLOCKS.find(({ id }) => id === block)!;
}
