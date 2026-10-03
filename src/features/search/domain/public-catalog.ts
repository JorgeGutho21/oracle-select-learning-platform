import {
  CURRICULUM_LEVELS,
  FUTURE_TOPICS,
  topicAnchor,
} from '@/features/modules/domain/curriculum';
import { SECTIONS } from '@/features/sections/domain/sections';
import { LESSON_OUTLINE } from '@/features/study/domain/lesson-outline';

export const searchGroups = [
  'Conceptos',
  'Lecciones',
  'Práctica',
  'Recursos',
  'Próximamente',
] as const;

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
    description: 'Portada de DB LAB: la ruta de secciones y cómo se aprende en la plataforma.',
    group: 'Recursos',
    href: '/',
    aliases: ['inicio', 'portada', 'home', 'db lab', 'sql select lab'],
    available: true,
    navigation: { label: 'Inicio', order: 1 },
  },
  {
    id: 'sections',
    title: 'Secciones de DB LAB',
    description:
      'Ruta académica: Fundamentos SQL, Consultas relacionales y análisis, y PL/SQL y automatización.',
    group: 'Lecciones',
    href: '/sections',
    aliases: ['secciones', 'seccion', 'ruta', 'mi aprendizaje', 'progreso', 'avance'],
    available: true,
    navigation: {
      label: 'Secciones',
      order: 2,
      alsoActiveOn: ['/learn', '/presentation', '/modules'],
    },
  },
  {
    id: 'learn',
    title: 'Modo Estudio',
    description: 'Recorrido de estudio de la unidad: 22 lecciones en 8 bloques.',
    group: 'Lecciones',
    href: '/learn',
    aliases: ['aprender', 'estudio', 'modo estudio', 'curso', 'lecciones'],
    available: true,
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
    description:
      'Escribe consultas SELECT con WHERE y ORDER BY, revisa su diagnóstico y ejecútalas en Oracle.',
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
  // Secciones: la disponible enlaza con su página; las próximas, con su plan publicado.
  ...SECTIONS.map((section): PublicCatalogEntry => ({
    id: `section-${section.id}`,
    title: `Sección ${section.number}: ${section.title}`,
    description: section.summary,
    group: section.status === 'available' ? 'Lecciones' : 'Próximamente',
    href: `/sections/${section.id}`,
    aliases: [section.title, `seccion ${section.number}`, ...section.highlights],
    available: section.status === 'available',
  })),
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
    title: 'Ruta de aprendizaje',
    description:
      'El nivel actual y los niveles que llegan después: funciones, agrupación, JOIN y más.',
    group: 'Recursos',
    href: '/modules',
    aliases: ['modulos', 'catalogo', 'ruta', 'roadmap', 'temario', 'proximamente', 'niveles'],
    available: true,
  },
  // Niveles futuros y sus temas: fichas «Próximamente» con destino en la ruta (/modules).
  ...CURRICULUM_LEVELS.filter((level) => level.stage !== 'AHORA').map(
    (level): PublicCatalogEntry => ({
      id: `level-${level.id}`,
      title: `Nivel ${level.number}: ${level.title}`,
      description: level.summary,
      group: 'Próximamente',
      href: `/modules#nivel-${level.number}`,
      aliases: [level.id, level.title, 'nivel', `nivel ${level.number}`],
      available: false,
    }),
  ),
  ...FUTURE_TOPICS.map((topic): PublicCatalogEntry => ({
    id: `future-${topic.id}`,
    title: topic.title,
    description: `Nivel ${topic.level} · ${topic.shortDefinition}`,
    group: 'Próximamente',
    href: `/modules#${topicAnchor(topic)}`,
    aliases: topic.keywords,
    available: false,
  })),
];
