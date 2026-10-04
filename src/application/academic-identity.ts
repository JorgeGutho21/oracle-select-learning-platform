/**
 * Identidad del producto. DB LAB es la plataforma; cada sección tiene su propio título.
 * Única fuente del nombre visible: no escribirlo a mano en componentes ni páginas.
 */
export const PRODUCT_IDENTITY = {
  name: 'DB LAB',
  subtitle: 'Plataforma interactiva de Bases de Datos con Oracle',
  /** Promesa de la portada y descripción de los metadatos. */
  pitch: 'Aprende SQL, consultas relacionales y PL/SQL mediante teoría, práctica y ejecución real.',
  /** Aviso que acompaña a la marca: el proyecto no es oficial de Oracle ni de la universidad. */
  disclaimer:
    'Proyecto académico. No es un producto oficial de Oracle ni de la Universidad Popular del Cesar. Oracle y Oracle Database son marcas registradas de Oracle Corporation y sus filiales.',
} as const;

/**
 * Identidad académica confirmada por el responsable del proyecto (23 de septiembre de 2026;
 * nombres completos actualizados el 3 de octubre de 2026).
 */
export const ACADEMIC_IDENTITY = {
  institution: 'Universidad Popular del Cesar',
  program: 'Ingeniería de Sistemas',
  /** Asignatura o contexto académico. */
  course: 'Bases de Datos',
  /** Tema de la Sección 1 en el Modo Exposición; no es el nombre de la plataforma. */
  unitTitle: 'SELECT en Oracle SQL',
  author: 'Jorge Gutiérrez Thomas',
  teacher: 'Amilkar Sierra Romano',
  logo: '/identity/universidad-popular-del-cesar.png',
} as const;

/** Tecnologías que la plataforma usa de verdad; el pie las enumera sin logotipos. */
export const PLATFORM_TECHNOLOGIES = [
  'Next.js',
  'React',
  'TypeScript',
  'Oracle Database',
  'Supabase',
  'Vercel',
] as const;
