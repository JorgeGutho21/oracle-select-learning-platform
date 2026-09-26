/**
 * Plantilla de una lección del Modo Estudio (CONTENT_REDESIGN_PLAN, 2.4): en una frase,
 * qué hace, para qué sirve, sintaxis, cómo leerla, ejemplo (pregunta → SQL → lectura),
 * tabla de origen, resultado, qué cambió, error frecuente, mini comprobación y laboratorio.
 * Las tablas y los recuentos no se escriben aquí: los calcula el motor educativo.
 */

export interface LessonExample {
  /** Necesidad real que motiva la consulta. */
  readonly question: string;
  readonly sql: string;
  /** La consulta leída en español. */
  readonly reading: string;
}

export interface LessonComparison {
  readonly label: string;
  readonly sql: string;
  readonly note: string;
}

export interface LessonNote {
  readonly title: string;
  readonly text: string;
}

export interface LessonError {
  readonly title: string;
  readonly why: string;
  /** SQL con el error; se puede abrir en el laboratorio para ver el diagnóstico. */
  readonly wrong?: string;
  readonly right?: string;
}

export interface CheckOption {
  readonly text: string;
  /** El texto es SQL y se muestra como código. */
  readonly code?: boolean;
  readonly correct: boolean;
  readonly feedback: string;
}

interface CheckBase {
  readonly prompt: string;
  /** Primera pista, conceptual; segunda, más concreta. Después se muestra la respuesta. */
  readonly hints: readonly [string, string];
  readonly explanation: string;
}

export type MiniCheck =
  | (CheckBase & {
      readonly kind: 'choice';
      readonly sql?: string;
      readonly options: readonly CheckOption[];
    })
  /** Predecir cuántas filas o columnas devuelve `sql`; la respuesta la calcula el motor. */
  | (CheckBase & {
      readonly kind: 'count';
      readonly sql: string;
      readonly measure: 'rows' | 'columns';
    })
  /** Predecir el valor de la primera celda del resultado de `sql`. */
  | (CheckBase & { readonly kind: 'number'; readonly sql: string; readonly label: string })
  /** Ordenar piezas; `pieces` está en el orden correcto y la interfaz las mezcla. */
  | (CheckBase & { readonly kind: 'order'; readonly pieces: readonly string[] });

export interface BuildStep {
  readonly label: string;
  readonly sql: string;
  readonly note: string;
}

export interface LessonContent {
  readonly slug: string;
  /** 1. En una frase. */
  readonly oneLiner: string;
  /** 2. ¿Qué hace? */
  readonly whatItDoes: string;
  /** 3. ¿Para qué sirve? */
  readonly purpose: string;
  /** 4. Sintaxis. */
  readonly syntax: string;
  /** 5. Cómo leerla en español. */
  readonly syntaxReading: string;
  /** 6. Ejemplo. Las partes 7 y 8 (tabla de origen y resultado) salen de su SQL. */
  readonly example: LessonExample;
  /** Columnas de EMPLEADOS que se muestran en la tabla de origen; por defecto, las usadas. */
  readonly sourceColumns?: readonly string[];
  /** 9. Qué cambió en el resultado… */
  readonly changed: readonly string[];
  /** …y qué no cambió. */
  readonly unchanged: readonly string[];
  readonly comparisons?: readonly LessonComparison[];
  readonly notes?: readonly LessonNote[];
  /** Término técnico que se introduce después de entender la idea. */
  readonly terminology?: string;
  /** 10. Error frecuente. */
  readonly error: LessonError;
  /** 11. Mini comprobación. */
  readonly check: MiniCheck;
  /** Construcción paso a paso (lección integradora). */
  readonly steps?: readonly BuildStep[];
  /** Catálogo de errores (lección de errores frecuentes). */
  readonly catalog?: readonly LessonError[];
  /** Muestra el diccionario de columnas de EMPLEADOS. */
  readonly dictionary?: boolean;
  /** El ejemplo muestra las 20 filas (si no, una muestra rotulada de 10). */
  readonly fullTable?: boolean;
}
