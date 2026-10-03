import type { ResultTable } from '@/domain/results/result-table';

/** Contratos de misión de GAME_SPEC.md. La parte pública nunca incluye rúbrica, pista ni explicación. */

export const INTERACTION_TYPES = [
  'drag-column',
  'reorder-sql',
  'predict-result',
  'expression-builder',
  'alias-builder',
  'distinct-result',
  'hotspot-error',
  'build-query',
  'write-query',
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const MISSION_IDS = [
  'M01',
  'M02',
  'M03',
  'M04',
  'M05',
  'M06',
  'M07',
  'M08',
  'M09',
  'M10',
] as const;
export type MissionId = (typeof MISSION_IDS)[number];

export type Difficulty = 'facil' | 'media' | 'dificil';
/** Lecciones del Modo Estudio (lesson-outline): L00–L21. */
export type LessonId = `L${'0' | '1'}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | 'L20' | 'L21';

export type PieceRole =
  'keyword' | 'column' | 'table' | 'punctuation' | 'expression' | 'alias' | 'operator' | 'number';

export interface Piece {
  readonly id: string;
  readonly text: string;
  readonly role: PieceRole;
}

/* ---------- Datos públicos por tipo de interacción ---------- */

export interface DragColumnData {
  readonly type: 'drag-column';
  readonly datasetId: string;
  readonly availableColumns: readonly string[];
}
export interface ReorderSqlData {
  readonly type: 'reorder-sql';
  /** Orden mezclado de presentación; nunca el orden de la solución. */
  readonly pieces: readonly Piece[];
}
/** Afirmación que el estudiante clasifica como cierta o falsa (qué hace y qué no hace). */
export interface Claim {
  readonly id: string;
  readonly text: string;
}

export interface PredictResultData {
  readonly type: 'predict-result';
  /** Consulta de la misión. `▢` marca la condición que construye el estudiante (M04). */
  readonly query: string;
  readonly headerOptions: readonly string[];
  readonly asks: {
    readonly headers: boolean;
    /** Marcar qué filas de la muestra conserva la consulta. */
    readonly rowSelection: boolean;
    readonly rowCount: boolean;
    /** Indicar cuántas columnas tendrá el resultado. */
    readonly columnCount?: boolean;
    /** Clasificar afirmaciones sobre lo que hace la consulta. */
    readonly claims?: boolean;
    /** Construir con piezas la condición de WHERE. */
    readonly condition?: boolean;
  };
  /** Columnas de EMPLEADOS que se muestran al marcar filas; por defecto, todas. */
  readonly sourceColumns?: readonly string[];
  /**
   * Muestra de trabajo (ID_EMPLEADO) sobre la que se marcan filas: se corrige frente a esas
   * mismas filas, así que la respuesta nunca depende de filas que no se ven.
   */
  readonly sampleIds?: readonly number[];
  readonly claims?: readonly Claim[];
  /** Piezas para construir la condición (algunas sobran). */
  readonly conditionPieces?: readonly Piece[];
}
export interface ExpressionBuilderData {
  readonly type: 'expression-builder';
  readonly query: string;
  /** Piezas reutilizables para construir la expresión. */
  readonly palette: readonly Piece[];
  /** Empleados (ID) cuyo valor calculado se debe predecir. */
  readonly predictionEmployeeIds: readonly number[];
  /**
   * Expresiones cuyo valor se predice para cada empleado indicado (precedencia: con y sin
   * paréntesis). Sin ellas, se predice el valor de la expresión construida.
   */
  readonly comparisons?: readonly string[];
}
export interface AliasBuilderData {
  readonly type: 'alias-builder';
  readonly pieces: readonly Piece[];
}
export interface DistinctResultData {
  readonly type: 'distinct-result';
  /** Consulta con DISTINCT sobre una columna. */
  readonly query: string;
  /** Consulta con DISTINCT sobre un par de columnas (mini reto). */
  readonly pairQuery: string;
  readonly column: string;
  /** Consulta sin DISTINCT que produce las filas de partida (la muestra de trabajo). */
  readonly sourceQuery: string;
  /** Valores entre los que se predice el resultado (algunos no aparecen). */
  readonly options: readonly string[];
}

/** Tipo de error de una consulta (M08): cómo reacciona Oracle ante ella. */
export const ERROR_KINDS = ['sintaxis', 'semantica', 'concepto'] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

/** Una consulta con un error estudiado; M08 presenta una de ellas. */
export interface ErrorVariant {
  readonly id: string;
  /** Pedido que la consulta debía cumplir. */
  readonly request: string;
  /** Consulta con el error, en piezas que se pueden tocar. */
  readonly tokens: readonly string[];
}

export interface HotspotErrorData {
  readonly type: 'hotspot-error';
  readonly variants: readonly ErrorVariant[];
}
export interface BuildQueryData {
  readonly type: 'build-query';
  /** Incluye piezas de distracción y piezas repetidas intercambiables. */
  readonly pieces: readonly Piece[];
}
export interface WriteQueryData {
  readonly type: 'write-query';
  readonly requirement: string;
  readonly requiresOracle: true;
}

export type MissionPublicData =
  | DragColumnData
  | ReorderSqlData
  | PredictResultData
  | ExpressionBuilderData
  | AliasBuilderData
  | DistinctResultData
  | HotspotErrorData
  | BuildQueryData
  | WriteQueryData;

/* ---------- Respuestas ---------- */

export interface Prediction {
  readonly employeeId: number;
  readonly value: number | null;
  /** Expresión cuyo valor se predice (M05 compara dos). */
  readonly expression?: string;
}

export interface ClaimAnswer {
  readonly id: string;
  /** `true`: lo hace; `false`: no lo hace; `null`: sin responder. */
  readonly value: boolean | null;
}

export type MissionAnswer =
  | { readonly type: 'drag-column'; readonly columns: readonly string[] }
  | { readonly type: 'reorder-sql'; readonly pieceIds: readonly string[] }
  | {
      readonly type: 'predict-result';
      readonly headers: readonly string[];
      readonly sourceRowIds: readonly number[];
      readonly rowCount: number | null;
      readonly columnCount?: number | null;
      readonly claims?: readonly ClaimAnswer[];
      readonly conditionPieceIds?: readonly string[];
    }
  | {
      readonly type: 'expression-builder';
      readonly pieceIds: readonly string[];
      readonly predictions: readonly Prediction[];
    }
  | { readonly type: 'alias-builder'; readonly pieceIds: readonly string[] }
  | {
      readonly type: 'distinct-result';
      /** Valores que el estudiante predice en el resultado de DISTINCT. */
      readonly values: readonly string[];
      /** Filas que predice para DISTINCT sobre el par de columnas. */
      readonly pairCount: number | null;
    }
  | {
      readonly type: 'hotspot-error';
      readonly variantId: string;
      readonly kind: ErrorKind | null;
      /** Pieza de la consulta donde está el error. */
      readonly tokenIndex: number | null;
      /** Consulta corregida. */
      readonly sql: string;
    }
  | { readonly type: 'build-query'; readonly pieceIds: readonly string[] }
  | { readonly type: 'write-query'; readonly sql: string };

export type AnswerFor<T extends InteractionType> = Extract<MissionAnswer, { type: T }>;
export type PublicDataFor<T extends InteractionType> = Extract<MissionPublicData, { type: T }>;

/* ---------- Corrección ---------- */

export type TechnicalReason = 'service-unavailable' | 'oracle-unavailable' | 'timeout';

/**
 * Tipo de error de una respuesta incorrecta: orienta la explicación (qué está bien, qué
 * necesita ajuste y pista) sin cambiar la corrección ni la puntuación.
 */
export const FEEDBACK_CATEGORIES = [
  'sintaxis',
  'semantica',
  'concepto',
  'orden',
  'columna',
  'condicion',
  'operador',
  'resultado',
  'alcance',
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/**
 * `incorrect` consume un intento académico. `invalid-input` (respuesta vacía) y
 * `technical` (fallo de servicio) no lo consumen (GAME_SPEC, intentos).
 */
export type EvaluationOutcome =
  | { readonly kind: 'correct'; readonly feedback: string }
  | {
      readonly kind: 'incorrect';
      /** Qué necesita ajuste: el diagnóstico concreto de esta respuesta. */
      readonly feedback: string;
      readonly category?: FeedbackCategory;
      /** Qué parte de la respuesta ya es correcta. */
      readonly good?: string;
      /** Pista progresiva: conceptual en el primer intento, localizada después. */
      readonly guidance?: string;
    }
  | { readonly kind: 'invalid-input'; readonly message: string }
  | { readonly kind: 'technical'; readonly reason: TechnicalReason; readonly message: string };

/* ---------- Definición de misión ---------- */

export interface PublicMission<T extends InteractionType = InteractionType> {
  readonly id: MissionId;
  readonly version: number;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly difficulty: Difficulty;
  readonly interactionType: T;
  readonly learningObjective: string;
  /** Pedido en lenguaje natural que la misión traduce a SQL. */
  readonly request: string;
  readonly lessons: readonly LessonId[];
  readonly instructions: string;
  readonly maxScore: number;
  readonly baseDurationSeconds: number;
  readonly publicData: PublicDataFor<T>;
}

/**
 * Veredicto de una rúbrica. `requires-execution` indica que la estructura y los requisitos
 * se cumplen y que la corrección final exige ejecutar la sentencia canónica en Oracle (M10).
 */
export type RubricVerdict =
  EvaluationOutcome | { readonly kind: 'requires-execution'; readonly statement: string };

export interface MissionRubric<T extends InteractionType = InteractionType> {
  readonly validate: (answer: AnswerFor<T>) => RubricVerdict;
  /** Califica el resultado devuelto por Oracle para las misiones que lo requieren. */
  readonly gradeExecution?: (result: ResultTable) => EvaluationOutcome;
}

/** Contenido privado: permanece en el servicio de corrección hasta cerrar la oportunidad puntuada. */
/**
 * Orientación gratuita tras un error, sin revelar la solución: `concept` recuerda la idea
 * (primer intento) y `locate` señala dónde mirar (segundo intento y práctica). La pista
 * con descuento (`hint`) sigue siendo una ayuda aparte.
 */
export interface MissionGuide {
  readonly concept: string;
  readonly locate: string;
}

export interface MissionPrivate<T extends InteractionType = InteractionType> {
  readonly missionId: MissionId;
  readonly interactionType: T;
  readonly hint: string;
  readonly guide: MissionGuide;
  readonly explanation: string;
  readonly rubric: MissionRubric<T>;
}

export interface MissionDefinition<
  T extends InteractionType = InteractionType,
> extends PublicMission<T> {
  readonly hint: string;
  readonly guide: MissionGuide;
  readonly explanation: string;
  readonly rubric: MissionRubric<T>;
}

export type AnyPublicMission = { [T in InteractionType]: PublicMission<T> }[InteractionType];
export type AnyMissionPrivate = { [T in InteractionType]: MissionPrivate<T> }[InteractionType];
export type AnyMissionDefinition = {
  [T in InteractionType]: MissionDefinition<T>;
}[InteractionType];
