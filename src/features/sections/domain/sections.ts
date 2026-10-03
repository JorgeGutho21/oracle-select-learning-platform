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

const PENDING_EVALUATION: SectionMode = {
  id: 'evaluation',
  label: 'Evaluación',
  description: 'Llegará con el contenido de la sección y su banco de preguntas.',
  href: null,
  action: null,
};

function plannedModes(practice: string): readonly SectionMode[] {
  return [
    {
      id: 'class',
      label: 'Iniciar clase',
      description: 'Exposición por escenas para el aula.',
      href: null,
      action: null,
    },
    {
      id: 'study',
      label: 'Estudiar',
      description: 'Lecciones con tabla original, consulta, resultado y qué cambió.',
      href: null,
      action: null,
    },
    { id: 'practice', label: 'Practicar', description: practice, href: null, action: null },
    {
      id: 'challenge',
      label: 'Challenge',
      description: 'Misiones propias de la sección.',
      href: null,
      action: null,
    },
    {
      id: 'resources',
      label: 'Recursos',
      description: 'Chuleta, referencia y fuentes oficiales.',
      href: null,
      action: null,
    },
    PENDING_EVALUATION,
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
          'Funciones de texto',
          'Funciones numéricas',
          'Funciones de fecha',
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
      'Consultas sobre tablas relacionadas por PK y FK, con el mismo patrón visual: tablas originales, consulta, resultado y qué cambió.',
    status: 'coming-soon',
    prerequisites: [
      'Sección 1: SELECT, WHERE y ORDER BY.',
      'Sección 1: NULL y su efecto en las comparaciones.',
    ],
    highlights: ['JOIN', 'Agregaciones', 'GROUP BY', 'Subconsultas', 'Operadores de conjuntos'],
    plannedTopics: [
      {
        title: 'Relaciones entre tablas',
        status: 'planned',
        topics: ['PK y FK', 'Alias de tablas', 'ON'],
      },
      {
        title: 'JOIN',
        status: 'planned',
        topics: [
          'INNER JOIN',
          'LEFT OUTER JOIN',
          'RIGHT OUTER JOIN',
          'FULL OUTER JOIN',
          'CROSS JOIN',
          'SELF JOIN',
        ],
      },
      {
        title: 'Funciones de agregación',
        status: 'planned',
        topics: ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'],
      },
      {
        title: 'Grupos',
        status: 'planned',
        topics: ['GROUP BY', 'HAVING', 'WHERE frente a HAVING'],
      },
      {
        title: 'Subconsultas',
        status: 'planned',
        topics: ['De una fila', 'De varias filas', 'Correlacionadas'],
      },
      {
        title: 'Operadores de conjuntos',
        status: 'planned',
        topics: ['UNION', 'UNION ALL', 'INTERSECT', 'MINUS'],
      },
    ],
    modes: plannedModes('Laboratorio con varias tablas relacionadas y ejecución en Oracle.'),
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
      'Bloques PL/SQL ejecutados en un entorno Oracle aislado, con la salida de DBMS_OUTPUT y casos de prueba.',
    status: 'coming-soon',
    prerequisites: [
      'Sección 1 y Sección 2.',
      'INSERT, UPDATE y DELETE (ampliación de la Sección 1).',
    ],
    highlights: [
      'Bloques PL/SQL',
      'Cursores',
      'Procedimientos',
      'Funciones',
      'Paquetes',
      'Triggers',
    ],
    plannedTopics: [
      {
        title: 'Bloques PL/SQL',
        status: 'planned',
        topics: [
          'DECLARE, BEGIN, EXCEPTION y END',
          'Variables y constantes',
          'Tipos, %TYPE y %ROWTYPE',
          'SELECT INTO',
          'DBMS_OUTPUT',
        ],
      },
      {
        title: 'Control de flujo',
        status: 'planned',
        topics: ['IF, ELSIF y ELSE', 'CASE', 'LOOP, WHILE y FOR'],
      },
      {
        title: 'Cursores y excepciones',
        status: 'planned',
        topics: ['Cursores implícitos', 'Cursores explícitos', 'Excepciones'],
      },
      {
        title: 'Subprogramas',
        status: 'planned',
        topics: ['Procedimientos', 'Parámetros IN, OUT e IN OUT', 'Funciones y RETURN', 'Paquetes'],
      },
      {
        title: 'Triggers',
        status: 'planned',
        topics: ['BEFORE y AFTER', 'INSERT, UPDATE y DELETE', 'FOR EACH ROW', ':OLD y :NEW'],
      },
    ],
    modes: plannedModes('Editor PL/SQL con salida de DBMS_OUTPUT en un entorno aislado.'),
    roadmapHref: null,
  },
];

export function findSection(id: string): SectionDefinition | undefined {
  return SECTIONS.find((section) => section.id === id);
}
