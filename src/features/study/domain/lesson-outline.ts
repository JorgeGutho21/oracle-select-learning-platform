/**
 * Esquema público de las nueve lecciones (CONTENT_MAP, L00–L08). Es la única fuente de
 * identificadores, rutas y títulos: Estudio, Exposición y el buscador lo leen de aquí.
 * No depende del motor SQL, para que el buscador global no lo cargue en cada página.
 */

export type LessonId = 'L00' | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06' | 'L07' | 'L08';

export interface LessonOutline {
  readonly id: LessonId;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  /** Fragmento de sintaxis que identifica la lección en temarios y tarjetas. */
  readonly badge: string;
  /** Descripción breve y pública para el buscador y el temario. */
  readonly summary: string;
  /** Términos de búsqueda sin tildes; nunca soluciones de actividades. */
  readonly keywords: readonly string[];
  /** Ficha de la chuleta, para las lecciones que enseñan una pieza de SELECT. */
  readonly concept?: { readonly title: string; readonly keywords: readonly string[] };
}

export const LESSON_OUTLINE: readonly LessonOutline[] = [
  {
    id: 'L00',
    slug: 'introduccion',
    title: '¿Qué es SQL?',
    shortTitle: '¿Qué es SQL?',
    badge: 'SQL',
    summary: 'Tabla, fila y columna: lo necesario antes de escribir la primera consulta.',
    keywords: ['introduccion', 'sql', 'tabla', 'fila', 'columna', 'base de datos', 'l00'],
  },
  {
    id: 'L01',
    slug: 'select',
    title: 'SELECT: elige qué mostrar',
    shortTitle: 'SELECT',
    badge: 'SELECT',
    summary: 'Elige las columnas que aparecerán en el resultado.',
    keywords: ['select', 'proyeccion', 'elegir datos', 'l01'],
    concept: { title: 'SELECT', keywords: ['select', 'seleccionar', 'mostrar', 'proyeccion'] },
  },
  {
    id: 'L02',
    slug: 'from',
    title: 'FROM: de dónde vienen los datos',
    shortTitle: 'FROM',
    badge: 'FROM',
    summary: 'Indica la tabla de la que salen los datos.',
    keywords: ['from', 'origen', 'tabla empleados', 'l02'],
    concept: { title: 'FROM', keywords: ['from', 'origen', 'tabla'] },
  },
  {
    id: 'L03',
    slug: 'asterisco',
    title: 'SELECT *: todas las columnas',
    shortTitle: 'SELECT *',
    badge: 'SELECT *',
    summary: 'Muestra todas las columnas de la tabla, en su orden.',
    keywords: ['*', 'asterisco', 'select *', 'todas las columnas', 'l03'],
    concept: { title: 'SELECT *', keywords: ['*', 'select *', 'asterisco', 'todas las columnas'] },
  },
  {
    id: 'L04',
    slug: 'columnas',
    title: 'Columnas específicas y su orden',
    shortTitle: 'Columnas específicas',
    badge: 'ciudad, nombre',
    summary: 'Muestra solo las columnas pedidas, separadas por comas y en el orden escrito.',
    keywords: ['columnas', 'lista', 'coma', 'orden', 'proyeccion', 'l04'],
    concept: {
      title: 'Lista de columnas',
      keywords: ['columnas', 'coma', 'lista', 'orden de columnas'],
    },
  },
  {
    id: 'L05',
    slug: 'expresiones',
    title: 'Expresiones y cálculos',
    shortTitle: 'Expresiones y cálculos',
    badge: 'salario * 12',
    summary: 'Calcula valores nuevos con +, -, *, / y paréntesis, sin cambiar la tabla.',
    keywords: ['expresiones', 'calculos', 'aritmetica', 'salario anual', 'l05'],
    concept: {
      title: 'Expresiones aritméticas',
      keywords: ['expresiones', 'calculos', 'operadores', 'parentesis', 'precedencia'],
    },
  },
  {
    id: 'L06',
    slug: 'alias',
    title: 'Alias con AS',
    shortTitle: 'Alias AS',
    badge: 'AS',
    summary: 'Da un encabezado claro a una columna del resultado; la tabla no cambia.',
    keywords: ['as', 'alias', 'encabezado', 'nombre de columna', 'l06'],
    concept: {
      title: 'AS · alias de columna',
      keywords: ['as', 'alias', 'encabezado', 'renombrar columna'],
    },
  },
  {
    id: 'L07',
    slug: 'distinct',
    title: 'DISTINCT: sin filas repetidas',
    shortTitle: 'DISTINCT',
    badge: 'DISTINCT',
    summary: 'Quita las filas repetidas de las columnas mostradas.',
    keywords: ['distinct', 'unicos', 'sin repetir', 'duplicados', 'l07'],
    concept: { title: 'DISTINCT', keywords: ['distinct', 'unicos', 'sin repetir', 'duplicados'] },
  },
  {
    id: 'L08',
    slug: 'consulta-completa',
    title: 'Consulta completa',
    shortTitle: 'Consulta completa',
    badge: 'SELECT … FROM',
    summary: 'Integra SELECT, FROM, expresiones y alias en un pedido completo.',
    keywords: ['consulta completa', 'select from', 'integracion', 'l08'],
  },
];

export function lessonOutline(id: LessonId): LessonOutline {
  const lesson = LESSON_OUTLINE.find((item) => item.id === id);
  if (!lesson) throw new Error(`No existe la lección ${id}.`);
  return lesson;
}
