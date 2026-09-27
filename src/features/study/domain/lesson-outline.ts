/**
 * Esquema de la unidad «SELECT en Oracle SQL» (CONTENT_MAP, nivel actual): ocho bloques y
 * veintidós lecciones. Es la fuente de identificadores, rutas, títulos y palabras de
 * búsqueda; el contenido completo de cada lección está en `lesson-content.ts`. Es ligero a
 * propósito: el buscador lo incluye en el navegador.
 */

import { SQL_CONCEPTS, type ConceptId } from '@/domain/concepts/sql-concepts';

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

/**
 * Ficha de la chuleta y del buscador («Conceptos»). Las definiciones, la sintaxis y los
 * ejemplos no se escriben aquí: salen de la fuente conceptual única (`sql-concepts`).
 */
export interface ConceptCard {
  readonly title: string;
  /** Conceptos de la ficha: el primero la define y los demás se explican dentro. */
  readonly concepts: readonly [ConceptId, ...ConceptId[]];
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
  /** Una frase: qué se aprende. En las lecciones con concepto es su definición canónica. */
  readonly summary: string;
  /** Términos de búsqueda sin tildes. */
  readonly keywords: readonly string[];
  readonly concept: ConceptCard | null;
}

/** Las lecciones con concepto no escriben su resumen: lo toman de la definición. */
type LessonOutlineInput = Omit<LessonOutline, 'summary'> & { readonly summary?: string };

const OUTLINE: readonly LessonOutlineInput[] = [
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
    keywords: ['select', 'seleccionar', 'mostrar', 'consultar', 'columnas', 'proyeccion'],
    concept: {
      title: 'SELECT',
      concepts: ['select'],
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
    keywords: ['from', 'tabla', 'origen', 'de donde'],
    concept: {
      title: 'FROM',
      concepts: ['from'],
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
    keywords: ['asterisco', 'todas las columnas', 'select *', 'estrella', '*'],
    concept: {
      title: 'SELECT *',
      concepts: ['star'],
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
    keywords: ['columnas', 'lista de columnas', 'coma', 'orden de columnas', 'especificas'],
    concept: {
      title: 'Lista de columnas',
      concepts: ['column-list', 'comma'],
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
    keywords: ['expresiones', 'calculos', 'aritmetica', 'operadores', 'suma', 'multiplicar'],
    concept: {
      title: 'Expresiones',
      concepts: ['expression'],
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
    keywords: ['precedencia', 'parentesis', 'orden de operaciones', 'prioridad'],
    concept: {
      title: 'Precedencia aritmética',
      concepts: ['arithmetic-precedence', 'parentheses'],
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
    keywords: ['alias', 'as', 'encabezado', 'renombrar', 'nombre de columna'],
    concept: {
      title: 'Alias con AS',
      concepts: ['alias', 'as'],
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
    keywords: ['concatenacion', 'concatenar', '||', 'literal', 'texto', 'unir textos', 'comillas'],
    concept: {
      title: 'Concatenación ||',
      concepts: ['concat'],
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
    keywords: ['distinct', 'duplicados', 'repetidos', 'unicos', 'sin repetir'],
    concept: {
      title: 'DISTINCT',
      concepts: ['distinct'],
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
    keywords: ['where', 'filtrar', 'filtro', 'condicion', 'filas', 'igual', '='],
    concept: {
      title: 'WHERE',
      concepts: ['where'],
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
      concepts: ['comparison'],
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
    keywords: ['and', 'or', 'y', 'o', 'combinar condiciones', 'logica', 'operadores logicos'],
    concept: {
      title: 'AND y OR',
      concepts: ['and', 'or', 'not'],
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
    keywords: ['parentesis', 'precedencia logica', 'and antes que or', 'not', 'negacion'],
    concept: {
      title: 'Paréntesis en condiciones',
      concepts: ['logical-precedence'],
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
    keywords: ['between', 'rango', 'entre', 'intervalo', 'not between', 'limites'],
    concept: {
      title: 'BETWEEN',
      concepts: ['between'],
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
    keywords: ['in', 'lista', 'lista de valores', 'not in', 'varios valores'],
    concept: {
      title: 'IN',
      concepts: ['in'],
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
    keywords: ['like', 'patron', 'comodin', '%', '_', 'empieza por', 'contiene', 'not like'],
    concept: {
      title: 'LIKE',
      concepts: ['like', 'percent', 'underscore'],
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
    keywords: ['null', 'is null', 'is not null', 'nulo', 'vacio', 'sin valor', '= null'],
    concept: {
      title: 'IS NULL',
      concepts: ['null', 'is-null', 'is-not-null'],
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
    keywords: ['order by', 'ordenar', 'orden', 'asc', 'desc', 'ascendente', 'descendente'],
    concept: {
      title: 'ORDER BY',
      concepts: ['order-by', 'asc', 'desc'],
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

export const LESSON_OUTLINE: readonly LessonOutline[] = OUTLINE.map((lesson) => ({
  ...lesson,
  summary: lesson.concept
    ? SQL_CONCEPTS[lesson.concept.concepts[0]].definition
    : (lesson.summary ?? lesson.title),
}));

export function findLessonOutline(slug: string): LessonOutline | undefined {
  return LESSON_OUTLINE.find((lesson) => lesson.slug === slug);
}

export function blockOf(block: BlockId): StudyBlock {
  return STUDY_BLOCKS.find(({ id }) => id === block)!;
}
