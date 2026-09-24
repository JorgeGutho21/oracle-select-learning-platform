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

type Rows = readonly (readonly string[])[];

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
  readonly optionalPieceIds: readonly string[];
}
export interface PredictResultData {
  readonly type: 'predict-result';
  readonly query: string;
  readonly headerOptions: readonly string[];
  /** Fichas repetibles para construir filas; vacía si solo se piden encabezados. */
  readonly valueOptions: readonly string[];
  readonly asks: { readonly headers: boolean; readonly rows: boolean; readonly rowCount: boolean };
}
export interface ExpressionBuilderData {
  readonly type: 'expression-builder';
  /** Piezas reutilizables para construir la expresión. */
  readonly palette: readonly Piece[];
  readonly targetEmployee: string;
}
export interface AliasBuilderData {
  readonly type: 'alias-builder';
  readonly pieces: readonly Piece[];
  readonly previewColumns: readonly string[];
}
export interface DistinctResultData {
  readonly type: 'distinct-result';
  readonly query: string;
  readonly columns: readonly string[];
  /** Proyección sin DISTINCT, con repeticiones, de la que se construye el resultado. */
  readonly candidateRows: Rows;
}
export interface HotspotErrorData {
  readonly type: 'hotspot-error';
  readonly tokens: readonly string[];
  readonly requirement: string;
}
export interface BuildQueryData {
  readonly type: 'build-query';
  readonly pieces: readonly Piece[];
  readonly optionalPieceIds: readonly string[];
  readonly asksRowCount: true;
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

export type MissionAnswer =
  | { readonly type: 'drag-column'; readonly columns: readonly string[] }
  | { readonly type: 'reorder-sql'; readonly pieceIds: readonly string[] }
  | {
      readonly type: 'predict-result';
      readonly headers: readonly string[];
      readonly rows: Rows;
      readonly rowCount: number | null;
    }
  | {
      readonly type: 'expression-builder';
      readonly pieceIds: readonly string[];
      readonly value: number | null;
    }
  | {
      readonly type: 'alias-builder';
      readonly pieceIds: readonly string[];
      readonly labeledColumnIndex: number | null;
    }
  | { readonly type: 'distinct-result'; readonly rows: Rows }
  | {
      readonly type: 'hotspot-error';
      readonly selectedTokenIndex: number | null;
      readonly repairedTokens: readonly string[];
    }
  | {
      readonly type: 'build-query';
      readonly pieceIds: readonly string[];
      readonly rowCount: number | null;
    }
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
  readonly lessons: readonly LessonId[];
  readonly instructions: string;
  readonly maxScore: number;
  readonly baseDurationSeconds: number;
  readonly publicData: PublicDataFor<T>;
}

export interface MissionRubric<T extends InteractionType = InteractionType> {
  readonly validate: (answer: AnswerFor<T>) => EvaluationOutcome;
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
