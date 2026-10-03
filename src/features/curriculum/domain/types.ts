import type { SectionId } from '@/features/sections/domain/sections';

/**
 * Fuente curricular única de DB LAB (CURRICULUM_ARCHITECTURE.md). Una sección se describe
 * una sola vez —conceptos, lecciones, ejemplos, actividades, misiones y escenas— y cada
 * modo la presenta a su manera: Estudiar muestra las lecciones, Iniciar clase proyecta las
 * escenas (que remiten a las lecciones), Practicar y Challenge usan las actividades,
 * Recursos resume los conceptos y el banco de evaluación remite a las mismas lecciones.
 *
 * Ningún resultado se escribe a mano: cada ejemplo es SQL o PL/SQL que se ejecuta en Oracle
 * y su salida queda en `application/oracle-results.json` (pruebas en `tests/`).
 */

/** Dataset sobre el que corre un ejemplo. */
export type DatasetRef = 'empleados-v2' | 'empresa-v1';

/** Tabla de origen que se muestra junto a una consulta, con las columnas que importan. */
export interface SourceView {
  readonly table: string;
  readonly columns: readonly string[];
  /**
   * Filas mostradas, por el valor de la primera columna de la clave primaria. Si se omite,
   * todas. Las filas mostradas deben bastar para obtener el resultado (lo comprueba una
   * prueba): lo que se ve antes explica lo que se ve después.
   */
  readonly keys?: readonly number[];
}

export interface QueryExample {
  readonly id: string;
  readonly kind: 'query';
  readonly dataset: DatasetRef;
  readonly sql: string;
  readonly sources: readonly SourceView[];
  /** Ejemplo de error: Oracle debe rechazar la consulta con este código. */
  readonly expectError?: string;
  /** Sin ORDER BY a propósito: el resultado se compara sin orden. */
  readonly unordered?: boolean;
}

/** Un paso del recorrido de un bloque PL/SQL (vista paso a paso). */
export interface TraceStep {
  /** Línea del código (1 = primera) que se ejecuta. */
  readonly line: number;
  readonly note: string;
  /** Valores de las variables después del paso. */
  readonly vars?: Readonly<Record<string, string>>;
  /** Línea que DBMS_OUTPUT escribe en este paso (debe coincidir con la salida de Oracle). */
  readonly output?: string;
  /** Fila del resultado del cursor que se procesa en este paso (1 = primera). */
  readonly row?: number;
}

export interface PlsqlExample {
  readonly id: string;
  readonly kind: 'plsql';
  /** Objetos que el ejemplo crea antes (procedimiento, función, paquete, trigger). */
  readonly setup?: readonly string[];
  /** Código que se muestra y se ejecuta: un bloque anónimo, un CREATE o una sentencia DML. */
  readonly code: string;
  /** Consultas que muestran el estado antes y después. */
  readonly before?: readonly string[];
  readonly after?: readonly string[];
  /** Error esperado de Oracle (ORA-xxxxx o PLS-xxxxx). */
  readonly expectError?: string;
  readonly trace?: readonly TraceStep[];
}

export type CurriculumExample = QueryExample | PlsqlExample;

/* ---------- Conceptos ---------- */

export interface OfficialReference {
  /** Documento oficial (Oracle Database SQL Language Reference 19c, PL/SQL…). */
  readonly document: string;
  readonly topic: string;
  readonly url: string;
}

export interface Mistake {
  readonly title: string;
  readonly why: string;
  readonly wrong?: string;
  readonly right?: string;
}

/** Ficha conceptual: la única definición del concepto en toda la plataforma. */
export interface CurriculumConcept {
  readonly id: string;
  readonly term: string;
  readonly category: string;
  /** Una frase de 30 palabras como máximo. */
  readonly definition: string;
  readonly purpose: string;
  readonly syntax: string;
  /** Ejemplo breve (id de un ejemplo verificado). */
  readonly example: string;
  readonly mistake: Mistake;
  readonly keyIdea: string;
  readonly reference: OfficialReference;
}

/* ---------- Visualizaciones ---------- */

export type JoinKind = 'inner' | 'left' | 'right' | 'full';

/**
 * Qué representación didáctica acompaña a un ejemplo. Los datos salen siempre del dataset
 * y del resultado verificado; la visualización solo decide cómo se señalan.
 */
export type ExampleVisual =
  /** Tabla original → consulta → resultado (patrón general). */
  | { readonly kind: 'transform' }
  /** Dos tablas, su condición ON y qué filas encuentran pareja. */
  | {
      readonly kind: 'join';
      readonly join: JoinKind;
      readonly left: string;
      readonly right: string;
      readonly leftKey: string;
      readonly rightKey: string;
    }
  /** Filas reunidas en grupos por una o varias columnas, y su resumen. */
  | { readonly kind: 'group'; readonly table: string; readonly by: readonly string[] }
  /** Etapas de la consulta (WHERE → GROUP BY → HAVING…) con un ejemplo por etapa. */
  | {
      readonly kind: 'pipeline';
      readonly stages: readonly { readonly label: string; readonly example: string }[];
    }
  /** Dos consultas con resultado distinto, lado a lado. */
  | { readonly kind: 'compare'; readonly other: string; readonly labels: readonly [string, string] }
  /** Recorrido de un bloque PL/SQL línea a línea. */
  | { readonly kind: 'flow' }
  /** Un cursor que avanza fila a fila (usa el recorrido del ejemplo). */
  | { readonly kind: 'cursor'; readonly query: string }
  /** Evento → trigger → acción, con las tablas antes y después. */
  | { readonly kind: 'trigger'; readonly event: string; readonly timing: string };

export interface LessonExample {
  /** Necesidad que motiva el ejemplo. */
  readonly question: string;
  readonly example: string;
  /** Qué hace, leído en español. */
  readonly reading: string;
  readonly visual?: ExampleVisual;
}

/* ---------- Actividades (Practicar, Challenge y comprobaciones) ---------- */

export interface ActivityOption {
  readonly text: string;
  /** El texto es código y se muestra como tal. */
  readonly code?: boolean;
  readonly correct: boolean;
  /** Qué error representa (o por qué es correcta). */
  readonly feedback: string;
}

interface ActivityBase {
  readonly id: string;
  /** Lección que hay que revisar si falla. */
  readonly lesson: string;
  readonly prompt: string;
  /** Material: un ejemplo (código y tablas de origen) o código suelto. */
  readonly context?: {
    readonly example?: string;
    readonly code?: string;
    /** Muestra también el resultado verificado del ejemplo. */
    readonly showResult?: boolean;
  };
  /** Primera pista conceptual; segunda, más concreta. Nunca la respuesta. */
  readonly hints: readonly [string, string];
  /** Explicación al acertar (o al rendirse). */
  readonly explanation: string;
}

export type Activity =
  | (ActivityBase & { readonly kind: 'choice'; readonly options: readonly ActivityOption[] })
  | (ActivityBase & { readonly kind: 'multi'; readonly options: readonly ActivityOption[] })
  /** Ordenar fragmentos; `pieces` está en el orden correcto y la interfaz los mezcla. */
  | (ActivityBase & { readonly kind: 'order'; readonly pieces: readonly string[] })
  /**
   * Predecir un número del ejemplo del contexto (la respuesta sale de Oracle): cuántas filas
   * devuelve (`rows`, por defecto) o el valor de su primera celda (`value`).
   */
  | (ActivityBase & { readonly kind: 'count'; readonly measure?: 'rows' | 'value' })
  /**
   * Elegir el resultado correcto del ejemplo del contexto entre los de otras consultas
   * plausibles (`distractors`, ids de ejemplos verificados).
   */
  | (ActivityBase & {
      readonly kind: 'result';
      readonly distractors: readonly { readonly example: string; readonly feedback: string }[];
    });

export type ActivityKind = Activity['kind'];

/* ---------- Lecciones, bloques, misiones y escenas ---------- */

export interface CurriculumBlock {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly summary: string;
}

export interface CurriculumLesson {
  readonly id: string;
  readonly block: string;
  readonly slug: string;
  readonly title: string;
  readonly shortTitle: string;
  /** Qué se aprende, en una frase. */
  readonly summary: string;
  /** Conceptos que la lección define (sus fichas). */
  readonly concepts: readonly string[];
  readonly purpose: string;
  readonly syntax: string;
  /** Cómo funciona, en dos o tres párrafos breves. */
  readonly explanation: readonly string[];
  readonly example: LessonExample;
  /** Ejemplos o comparaciones adicionales. */
  readonly more?: readonly LessonExample[];
  /** Qué cambió del origen al resultado. */
  readonly changed: readonly string[];
  readonly mistakes: readonly Mistake[];
  /** Mini predicción antes de seguir. */
  readonly check: Activity;
  readonly keyIdea: string;
  /** Tema del banco de evaluación al que pertenece. */
  readonly topic: string;
  /** Sube cuando el contenido cambia de forma que invalida lo completado. */
  readonly version: number;
}

export interface Mission {
  readonly id: string;
  readonly title: string;
  /** Habilidad que demuestra. */
  readonly skill: string;
  /** Situación de trabajo que plantea la misión. */
  readonly scenario: string;
  readonly steps: readonly Activity[];
}

export interface SceneNotes {
  readonly explain: string;
  readonly mistake?: string;
  readonly question?: string;
  readonly transition?: string;
}

export type CurriculumSceneKind =
  /** Portada de la clase. */
  | 'cover'
  /** Mapa de bloques. */
  | 'agenda'
  /** Idea o modelo mental en pocas líneas, opcionalmente con un ejemplo. */
  | 'idea'
  /** El ejemplo principal de una lección con su visualización. */
  | 'lesson'
  /** Pregunta rápida para la clase. */
  | 'check'
  /** Cierre con las ideas clave. */
  | 'closing';

export interface CurriculumScene {
  readonly id: string;
  readonly block: string;
  readonly kind: CurriculumSceneKind;
  readonly title: string;
  readonly shortTitle: string;
  /** Lección que la escena proyecta o amplía. */
  readonly lesson?: string;
  /** Ejemplo de la lección que se proyecta (por defecto, el principal). */
  readonly example?: string;
  /** Líneas breves de una escena de idea (tres como máximo). */
  readonly points?: readonly string[];
  /** Código o esquema que acompaña a una escena de idea. */
  readonly code?: string;
  readonly activity?: Activity;
  readonly keyIdea?: string;
  readonly notes: SceneNotes;
}

/** Lo común a una sección completa y a una ampliación: bloques, lecciones y ejemplos. */
export interface CurriculumUnit {
  readonly section: SectionId;
  readonly dataset: DatasetRef;
  readonly blocks: readonly CurriculumBlock[];
  readonly concepts: readonly CurriculumConcept[];
  readonly lessons: readonly CurriculumLesson[];
  readonly examples: readonly CurriculumExample[];
  /** Actividades de Practicar (cada una remite a su lección). */
  readonly practice: readonly Activity[];
}

/** Sección descrita por completo en la fuente curricular, con sus seis modos. */
export interface SectionCurriculum extends CurriculumUnit {
  readonly missions: readonly Mission[];
  readonly scenes: readonly CurriculumScene[];
}

/**
 * Ampliación de una sección que conserva sus propios modos (la Sección 1): aporta lecciones
 * con ejemplos verificados en Oracle que se integran en su modo Estudiar.
 */
export interface CurriculumExtension extends CurriculumUnit {
  readonly kind: 'extension';
  /** Lecciones que la sección ya tiene antes de la ampliación (para numerar las nuevas). */
  readonly lessonOffset: number;
}
