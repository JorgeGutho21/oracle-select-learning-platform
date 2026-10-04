/**
 * Arquitectura académica de DB LAB: tres secciones con los mismos modos de trabajo. Las
 * secciones envuelven las funcionalidades existentes; no las duplican. Un modo sin destino
 * (`href: null`) se muestra como «Próximamente» y nunca como enlace.
 */

export const SECTION_IDS = ['fundamentos-sql', 'consultas-relacionales', 'plsql'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export type SectionStatus = 'available' | 'coming-soon';

export const SECTION_MODE_IDS = [
  'class',
  'study',
  'practice',
  'challenge',
  'resources',
  'evaluation',
] as const;
export type SectionModeId = (typeof SECTION_MODE_IDS)[number];

export interface SectionMode {
  readonly id: SectionModeId;
  readonly label: string;
  readonly description: string;
  /** Ruta existente del modo; `null` mientras el modo no exista en esta sección. */
  readonly href: string | null;
  /** Texto del enlace: dice adónde lleva, no «ver más». */
  readonly action: string | null;
}

export interface SectionTopicGroup {
  readonly title: string;
  readonly status: 'available' | 'planned';
  readonly topics: readonly string[];
}

export interface SectionDefinition {
  readonly id: SectionId;
  readonly number: 1 | 2 | 3;
  readonly title: string;
  /** Qué se aprende, en una frase. */
  readonly summary: string;
  readonly objective: string;
  /** Tipo de práctica (real o prevista según el estado). */
  readonly practice: string;
  readonly status: SectionStatus;
  readonly prerequisites: readonly string[];
  /** Temas principales para tarjetas y fichas. */
  readonly highlights: readonly string[];
  /** Temas previstos; los disponibles de la Sección 1 salen del temario real. */
  readonly plannedTopics: readonly SectionTopicGroup[];
  readonly modes: readonly SectionMode[];
  /** Fichas relacionadas de la ruta de aprendizaje (`/modules`), si existen. */
  readonly roadmapHref: string | null;
}

/**
 * Modos de una sección descrita en la fuente curricular (features/curriculum): todos viven
 * bajo `/sections/{id}/…` y la evaluación usa el motor de la Fase 3.
 */
function curriculumModes(id: SectionId, practice: string): readonly SectionMode[] {
  const base = `/sections/${id}`;
  return [
    {
      id: 'class',
      label: 'Iniciar clase',
      description: 'Exposición por escenas para proyectar, con notas del profesor y paso a paso.',
      href: `${base}/class`,
      action: 'Abrir la clase',
    },
    {
      id: 'study',
      label: 'Estudiar',
      description: 'Lecciones a tu ritmo: tablas originales, código, resultado y qué cambió.',
      href: `${base}/study`,
      action: 'Abrir el temario',
    },
    {
      id: 'practice',
      label: 'Practicar',
      description: practice,
      href: `${base}/practice`,
      action: 'Abrir las prácticas',
    },
    {
      id: 'challenge',
      label: 'Challenge',
      description: 'Diez misiones de dificultad creciente, con pistas y retroalimentación.',
      href: `${base}/challenge`,
      action: 'Empezar las misiones',
    },
    {
      id: 'resources',
      label: 'Recursos',
      description:
        'Referencia condensada: qué es, para qué sirve, sintaxis, ejemplo y error frecuente.',
      href: `${base}/resources`,
      action: 'Abrir los recursos',
    },
    {
      id: 'evaluation',
      label: 'Evaluación',
      description: 'Evaluaciones calificadas de 0.0 a 5.0 que publica el profesor.',
      href: `/evaluations?seccion=${id}`,
      action: 'Ver mis evaluaciones',
    },
  ];
}

export const SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'fundamentos-sql',
    number: 1,
    title: 'Fundamentos SQL',
    summary:
      'Consultar una tabla con SELECT: elegir columnas, calcular, filtrar filas, tratar NULL y ordenar el resultado.',
    objective:
      'Escribir y leer consultas SELECT en Oracle, prever su resultado y explicar qué cambia en cada paso.',
    practice:
      'Laboratorio con diagnóstico y ejecución en Oracle, más las misiones del SQL Challenge.',
    status: 'available',
    prerequisites: ['Ninguno: empieza desde cero.'],
    highlights: ['SELECT', 'WHERE', 'IS NULL', 'ORDER BY'],
    plannedTopics: [
      {
        title: 'Próximas ampliaciones',
        status: 'planned',
        topics: [
          'Conversión: TO_CHAR, TO_DATE y TO_NUMBER',
          'NVL2, NULLIF y COALESCE',
          'DECODE',
          'INSERT',
          'UPDATE',
          'DELETE',
        ],
      },
    ],
    modes: [
      {
        id: 'class',
        label: 'Iniciar clase',
        description: 'Exposición por escenas para proyectar, con vista del presentador.',
        href: '/presentation',
        action: 'Abrir el Modo Exposición',
      },
      {
        id: 'study',
        label: 'Estudiar',
        description: 'Lecciones a tu ritmo: tabla original, consulta, resultado y qué cambió.',
        href: '/learn',
        action: 'Abrir el temario',
      },
      {
        id: 'practice',
        label: 'Practicar SQL',
        description: 'Laboratorio con diagnóstico, vista educativa y ejecución en Oracle.',
        href: '/lab',
        action: 'Abrir el laboratorio',
      },
      {
        id: 'challenge',
        label: 'Challenge',
        description: 'Misiones para demostrar lo aprendido, solo o en una sala en vivo.',
        href: '/challenge',
        action: 'Empezar las misiones',
      },
      {
        id: 'resources',
        label: 'Recursos',
        description: 'Chuleta, referencia rápida, videos y fuentes oficiales.',
        href: '/resources',
        action: 'Abrir los recursos',
      },
      {
        id: 'evaluation',
        label: 'Evaluación',
        description: 'Evaluaciones calificadas de 0.0 a 5.0 que publica el profesor.',
        href: '/evaluations?seccion=fundamentos-sql',
        action: 'Ver mis evaluaciones',
      },
    ],
    roadmapHref: '/modules#nivel-1',
  },
  {
    id: 'consultas-relacionales',
    number: 2,
    title: 'Consultas relacionales y análisis',
    summary:
      'Combinar tablas relacionadas y resumir datos: JOIN, funciones de agregación, GROUP BY, HAVING, subconsultas y operadores de conjuntos.',
    objective:
      'Responder preguntas que necesitan varias tablas o resúmenes por grupo, y elegir entre JOIN, subconsulta u operador de conjuntos.',
    practice:
      'Prácticas guiadas sobre cuatro tablas relacionadas: completar JOIN, predecir filas, construir agregaciones y corregir consultas, con resultados verificados en Oracle.',
    status: 'available',
    prerequisites: [
      'Sección 1: SELECT, WHERE y ORDER BY.',
      'Sección 1: NULL y su efecto en las comparaciones.',
    ],
    highlights: ['JOIN', 'Agregaciones', 'GROUP BY', 'Subconsultas', 'Operadores de conjuntos'],
    plannedTopics: [
      {
        title: 'Ampliación futura',
        status: 'planned',
        topics: ['ROLLUP y CUBE', 'Consultas jerárquicas', 'Funciones analíticas', 'Vistas'],
      },
    ],
    modes: curriculumModes(
      'consultas-relacionales',
      'Actividades guiadas: completar JOIN, elegir la condición ON, predecir filas, GROUP BY, HAVING, subconsultas y conjuntos.',
    ),
    roadmapHref: '/modules#nivel-4',
  },
  {
    id: 'plsql',
    number: 3,
    title: 'PL/SQL y automatización',
    summary:
      'Programar la base de datos con bloques PL/SQL: variables, control de flujo, cursores, excepciones, procedimientos, funciones, paquetes y triggers.',
    objective:
      'Escribir bloques, subprogramas y disparadores que automaticen reglas sobre los datos, y leer su salida y sus errores.',
    practice:
      'Prácticas guiadas sobre el mismo dataset relacional: ordenar bloques, predecir la salida de DBMS_OUTPUT, elegir manejadores de errores y razonar sobre triggers, con resultados obtenidos al ejecutar el código en Oracle.',
    status: 'available',
    prerequisites: [
      'Sección 1: SELECT, WHERE, NULL y ORDER BY.',
      'Sección 2: JOIN y funciones de grupo.',
      'INSERT, UPDATE y DELETE se presentan dentro de los bloques (lección «DML en PL/SQL»).',
    ],
    highlights: [
      'Bloques PL/SQL',
      'Cursores',
      'Excepciones',
      'Procedimientos y funciones',
      'Paquetes',
      'Triggers',
    ],
    plannedTopics: [
      {
        title: 'Ampliación futura',
        status: 'planned',
        topics: [
          'Registros y colecciones',
          'SQL dinámico (EXECUTE IMMEDIATE)',
          'BULK COLLECT y FORALL',
          'Triggers INSTEAD OF y compuestos',
        ],
      },
    ],
    modes: curriculumModes(
      'plsql',
      'Actividades guiadas: ordenar bloques, predecir la salida, elegir el manejador de errores, recorrer cursores y razonar sobre triggers.',
    ),
    roadmapHref: null,
  },
];

export function findSection(id: string): SectionDefinition | undefined {
  return SECTIONS.find((section) => section.id === id);
}
