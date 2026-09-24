/**
 * Catálogo académico: la unidad actual (SELECT) y los módulos futuros. Es la única fuente
 * de sus títulos, descripciones y estados; Home, el buscador y `/modules` lo leen de aquí.
 * Los módulos futuros son fichas: no tienen lecciones ni actividades todavía.
 */

export type ModuleStatus = 'AVAILABLE' | 'CURRENT' | 'COMING_SOON';

export interface AcademicModule {
  /** Identificador estable, también usado como ancla (`#modulo-<id>`). */
  readonly id: string;
  readonly number: number;
  readonly title: string;
  /** Sintaxis que identifica el módulo en las tarjetas. */
  readonly keyword: string;
  readonly description: string;
  readonly status: ModuleStatus;
  /** Módulos que conviene dominar antes (por título). */
  readonly prerequisites: readonly string[];
  /** Destino del módulo; solo los disponibles lo tienen. */
  readonly href: string | null;
  /** Términos de búsqueda sin tildes. */
  readonly keywords: readonly string[];
}

export const MODULE_CATALOG: readonly AcademicModule[] = [
  {
    id: 'select',
    number: 1,
    title: 'SELECT en Oracle SQL',
    keyword: 'SELECT … FROM',
    description:
      'Consultar una tabla: elegir columnas, calcular valores, poner alias y quitar filas repetidas con DISTINCT.',
    status: 'CURRENT',
    prerequisites: [],
    href: '/learn',
    keywords: ['select', 'from', 'unidad actual', 'consultas'],
  },
  {
    id: 'where',
    number: 2,
    title: 'WHERE y comparaciones',
    keyword: 'WHERE',
    description: 'Mostrar solo las filas que cumplen una condición, por ejemplo salario > 3000000.',
    status: 'COMING_SOON',
    prerequisites: ['SELECT en Oracle SQL'],
    href: null,
    keywords: ['where', 'filtros', 'comparaciones', 'condiciones', 'futuro'],
  },
  {
    id: 'between',
    number: 3,
    title: 'BETWEEN: rangos',
    keyword: 'BETWEEN',
    description: 'Filtrar valores dentro de un rango; los dos extremos quedan incluidos.',
    status: 'COMING_SOON',
    prerequisites: ['WHERE y comparaciones'],
    href: null,
    keywords: ['between', 'rangos', 'entre', 'futuro'],
  },
  {
    id: 'in',
    number: 4,
    title: 'IN: listas de valores',
    keyword: 'IN',
    description: 'Comprobar si un valor está en una lista, como ciudad IN (…).',
    status: 'COMING_SOON',
    prerequisites: ['WHERE y comparaciones'],
    href: null,
    keywords: ['in', 'listas', 'lista de valores', 'futuro'],
  },
  {
    id: 'like',
    number: 5,
    title: 'LIKE: patrones de texto',
    keyword: 'LIKE',
    description: 'Buscar texto que sigue un patrón: % representa varios caracteres y _ uno solo.',
    status: 'COMING_SOON',
    prerequisites: ['WHERE y comparaciones'],
    href: null,
    keywords: ['like', 'patrones', 'comodines', 'futuro'],
  },
  {
    id: 'join',
    number: 6,
    title: 'JOIN: varias tablas',
    keyword: 'JOIN',
    description: 'Combinar filas de dos tablas relacionadas por una columna común.',
    status: 'COMING_SOON',
    prerequisites: ['SELECT en Oracle SQL', 'WHERE y comparaciones'],
    href: null,
    keywords: ['join', 'uniones', 'relaciones', 'varias tablas', 'futuro'],
  },
  {
    id: 'group-by',
    number: 7,
    title: 'GROUP BY: agrupar',
    keyword: 'GROUP BY',
    description: 'Formar grupos de filas y resumir cada grupo con funciones como COUNT o SUM.',
    status: 'COMING_SOON',
    prerequisites: ['SELECT en Oracle SQL'],
    href: null,
    keywords: ['group by', 'group', 'agrupaciones', 'grupos', 'futuro'],
  },
  {
    id: 'functions',
    number: 8,
    title: 'Funciones',
    keyword: 'UPPER · ROUND',
    description: 'Transformar valores con funciones de texto, número y fecha, como UPPER o ROUND.',
    status: 'COMING_SOON',
    prerequisites: ['SELECT en Oracle SQL'],
    href: null,
    keywords: ['funciones', 'functions', 'upper', 'round', 'count', 'sum', 'futuro'],
  },
];

export function isAvailableModule(entry: AcademicModule): boolean {
  return entry.status !== 'COMING_SOON' && entry.href !== null;
}
