import { MODULE_CATALOG } from '@/features/modules/domain/catalog';
import { LESSON_OUTLINE } from '@/features/study/domain/lesson-outline';

export const searchGroups = ['Conceptos', 'Lecciones', 'Práctica', 'Recursos'] as const;

export type SearchGroup = (typeof searchGroups)[number];

export interface PublicCatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly group: SearchGroup;
  readonly href: string | null;
  readonly aliases: readonly string[];
  readonly available: boolean;
  readonly navigation?: {
    readonly label: string;
    readonly order: number;
    /** Rutas adicionales en las que esta entrada figura como activa. */
    readonly alsoActiveOn?: readonly string[];
  };
}

/** Catálogo público: no contiene rúbricas, soluciones ni datos administrativos. */
export const publicCatalog: readonly PublicCatalogEntry[] = [
  {
    id: 'home',
    title: 'Inicio',
    description: 'Portada de SQL SELECT LAB y accesos a los recorridos.',
    group: 'Recursos',
    href: '/',
    aliases: ['inicio', 'portada', 'home', 'sql select lab'],
    available: true,
    navigation: { label: 'Inicio', order: 1 },
  },
  {
    id: 'learn',
    title: 'Modo Estudio',
    description: 'Recorrido de estudio con las nueve lecciones de esta unidad.',
    group: 'Lecciones',
    href: '/learn',
    aliases: ['aprender', 'estudio', 'modo estudio', 'curso', 'lecciones'],
    available: true,
    navigation: { label: 'Aprender', order: 2, alsoActiveOn: ['/presentation', '/modules'] },
  },
  {
    id: 'presentation',
    title: 'Modo Exposición',
    description: 'Exposición guiada por escenas para trabajar con la clase.',
    group: 'Recursos',
    href: '/presentation',
    aliases: [
      'presentacion',
      'exposicion',
      'modo exposicion',
      'diapositivas',
      'escenas',
      'clase',
      'proyector',
    ],
    available: true,
  },
  {
    id: 'lab',
    title: 'Laboratorio SQL',
    description: 'Escribe consultas del subconjunto SELECT y revisa su análisis.',
    group: 'Práctica',
    href: '/lab',
    aliases: ['laboratorio', 'lab', 'editor', 'oracle', 'ejecutar consulta'],
    available: true,
    navigation: { label: 'Laboratorio', order: 3 },
  },
  {
    id: 'challenge',
    title: 'SQL Oracle Challenge',
    description: 'Diez misiones para practicar los conceptos de la unidad.',
    group: 'Práctica',
    href: '/challenge',
    aliases: ['challenge', 'quiz', 'juego', 'misiones', 'practica'],
    available: true,
    navigation: { label: 'Challenge', order: 4 },
  },
  {
    id: 'live',
    title: 'Sala en vivo',
    description: 'Entrada por código a una actividad guiada en clase.',
    group: 'Práctica',
    href: '/live',
    aliases: ['en vivo', 'sala', 'codigo', 'qr', 'participar'],
    available: true,
    navigation: { label: 'En vivo', order: 5 },
  },
  {
    id: 'results',
    title: 'Resultados de práctica',
    description: 'Resumen local de puntos, misiones y conceptos por repasar.',
    group: 'Práctica',
    href: '/results',
    aliases: ['resultados', 'progreso', 'puntaje', 'puntuacion', 'repaso'],
    available: true,
  },
  {
    id: 'resources',
    title: 'Recursos de estudio',
    description: 'Videos, chuleta, referencia rápida y fuentes de la unidad.',
    group: 'Recursos',
    href: '/resources',
    aliases: ['recursos', 'materiales', 'fuentes', 'chuleta', 'videos'],
    available: true,
    navigation: { label: 'Recursos', order: 6 },
  },
  ...LESSON_OUTLINE.map((lesson): PublicCatalogEntry => ({
    id: `lesson-${lesson.slug}`,
    title: lesson.title,
    description: lesson.summary,
    group: 'Lecciones',
    href: `/learn/${lesson.slug}`,
    aliases: lesson.keywords,
    available: true,
  })),
  {
    id: 'video-introduction',
    title: 'Video introductorio',
    description: 'Introducción breve a tablas, SELECT y FROM.',
    group: 'Recursos',
    href: '/resources#video-introduccion',
    aliases: ['video', 'videos', 'introduccion', 'v01'],
    available: true,
  },
  {
    id: 'video-summary',
    title: 'Video resumen',
    description: 'Repaso de los conceptos principales de la unidad.',
    group: 'Recursos',
    href: '/resources#video-resumen',
    aliases: ['video', 'videos', 'resumen', 'repaso', 'v02'],
    available: true,
  },
  // Conceptos: fichas de la chuleta derivadas del esquema de lecciones.
  ...LESSON_OUTLINE.flatMap((lesson): PublicCatalogEntry[] =>
    lesson.concept
      ? [
          {
            id: `concept-${lesson.slug}`,
            title: lesson.concept.title,
            description: lesson.summary,
            group: 'Conceptos',
            href: `/resources#chuleta-${lesson.slug}`,
            aliases: lesson.concept.keywords,
            available: true,
          },
        ]
      : [],
  ),
  {
    id: 'modules',
    title: 'Catálogo de módulos',
    description: 'La unidad actual y los módulos que llegarán después de SELECT.',
    group: 'Recursos',
    href: '/modules',
    aliases: ['modulos', 'catalogo', 'unidades', 'temario', 'proximos modulos'],
    available: true,
  },
  // Módulos futuros: fichas «Próximamente», sin destino, derivadas del catálogo académico.
  ...MODULE_CATALOG.filter((entry) => entry.status === 'COMING_SOON').map(
    (entry): PublicCatalogEntry => ({
      id: `future-${entry.id}`,
      title: entry.title,
      description: `${entry.description} Llegará en un módulo futuro.`,
      group: 'Conceptos',
      href: null,
      aliases: entry.keywords,
      available: false,
    }),
  ),
];
