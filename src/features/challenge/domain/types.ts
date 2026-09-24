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
export type LessonId = 'L00' | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06' | 'L07' | 'L08';

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
export interface PredictResultData {
  readonly type: 'predict-result';
  readonly query: string;
  readonly headerOptions: readonly string[];
  readonly asks: {
    readonly headers: boolean;
    /** Marcar qué filas de EMPLEADOS aparecen en el resultado. */
    readonly rowSelection: boolean;
    readonly rowCount: boolean;
  };
}
export interface ExpressionBuilderData {
  readonly type: 'expression-builder';
  readonly query: string;
  /** Piezas reutilizables para construir la expresión. */
  readonly palette: readonly Piece[];
  /** Empleados (ID) cuyo valor calculado se debe predecir. */
  readonly predictionEmployeeIds: readonly number[];
}
export interface AliasBuilderData {
  readonly type: 'alias-builder';
  readonly pieces: readonly Piece[];
}
export interface DistinctResultData {
  readonly type: 'distinct-result';
  readonly query: string;
  readonly column: string;
  /** Proyección sin DISTINCT, con repeticiones, de la que se retiran duplicados. */
  readonly candidateValues: readonly string[];
}
export interface HotspotErrorData {
  readonly type: 'hotspot-error';
  readonly tokens: readonly string[];
  readonly requirement: string;
  /** Símbolo que se inserta en el hueco elegido. */
  readonly insertToken: string;
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
}

export type MissionAnswer =
  | { readonly type: 'drag-column'; readonly columns: readonly string[] }
  | { readonly type: 'reorder-sql'; readonly pieceIds: readonly string[] }
  | {
      readonly type: 'predict-result';
      readonly headers: readonly string[];
      readonly sourceRowIds: readonly number[];
      readonly rowCount: number | null;
    }
  | {
      readonly type: 'expression-builder';
      readonly pieceIds: readonly string[];
      readonly predictions: readonly Prediction[];
    }
  | { readonly type: 'alias-builder'; readonly pieceIds: readonly string[] }
  | { readonly type: 'distinct-result'; readonly keptIndexes: readonly number[] }
  | { readonly type: 'hotspot-error'; readonly gapIndex: number | null }
  | { readonly type: 'build-query'; readonly pieceIds: readonly string[] }
  | { readonly type: 'write-query'; readonly sql: string };

export type AnswerFor<T extends InteractionType> = Extract<MissionAnswer, { type: T }>;
export type PublicDataFor<T extends InteractionType> = Extract<MissionPublicData, { type: T }>;

/* ---------- Corrección ---------- */

export type TechnicalReason = 'service-unavailable' | 'oracle-unavailable' | 'timeout';

/**
 * `incorrect` consume un intento académico. `invalid-input` (respuesta vacía) y
 * `technical` (fallo de servicio) no lo consumen (GAME_SPEC, intentos).
 */
export type EvaluationOutcome =
  | { readonly kind: 'correct'; readonly feedback: string }
  | { readonly kind: 'incorrect'; readonly feedback: string }
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
export interface MissionPrivate<T extends InteractionType = InteractionType> {
  readonly missionId: MissionId;
  readonly interactionType: T;
  readonly hint: string;
  readonly explanation: string;
  readonly rubric: MissionRubric<T>;
}

export interface MissionDefinition<
  T extends InteractionType = InteractionType,
> extends PublicMission<T> {
  readonly hint: string;
  readonly explanation: string;
  readonly rubric: MissionRubric<T>;
}

export type AnyPublicMission = { [T in InteractionType]: PublicMission<T> }[InteractionType];
export type AnyMissionPrivate = { [T in InteractionType]: MissionPrivate<T> }[InteractionType];
export type AnyMissionDefinition = {
  [T in InteractionType]: MissionDefinition<T>;
}[InteractionType];
