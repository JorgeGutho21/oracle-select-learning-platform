import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { analyzeProjection, tokensFromPieces } from '@/domain/sql/projection-query';
import { GAME_SPEC_SCORING_POLICY } from '../domain/scoring';

/**
 * Superficie pública del Challenge para presentación: tipos, lectura del estado y
 * ayudas visuales sin rúbricas. Presentación no importa dominio ni infraestructura.
 */

export type { ChallengeResult, MissionResult } from '../domain/challenge-result';
export type {
  Attempt,
  ChallengeState,
  HintUsage,
  MissionState,
  MissionStatus,
} from '../domain/challenge-state';
export type { ScoreBreakdown } from '../domain/scoring';
export type {
  AnswerFor,
  AnyPublicMission,
  Difficulty,
  EvaluationOutcome,
  InteractionType,
  MissionAnswer,
  MissionId,
  Piece,
  Prediction,
  PublicDataFor,
  PublicMission,
} from '../domain/types';
export type {
  ChallengeEngine,
  HintResult,
  PersistenceStatus,
  RestoreStatus,
  SubmitResult,
} from './challenge-engine';
export type { EmpleadoRow, EmpleadosColumn } from '@/domain/dataset/empleados';
export { elapsedMs, getMission, isClosed, scoredAttempts } from '../domain/challenge-state';

export const EMPLEADOS = EMPLEADOS_DATASET;

export const PRACTICE_RULES = Object.freeze({
  maxScoredAttempts: GAME_SPEC_SCORING_POLICY.maxScoredAttempts,
  hintPenalty: GAME_SPEC_SCORING_POLICY.hintPenalty,
  attemptPenalty: GAME_SPEC_SCORING_POLICY.attemptPenalty,
  maxScorePerMission: GAME_SPEC_SCORING_POLICY.maxScorePerMission,
});

/**
 * Encabezados que mostraría una consulta armada con piezas, o `null` si aún no forma
 * una consulta válida. Solo describe la forma; la corrección la hace el evaluador.
 */
export function previewHeaders(pieceTexts: readonly string[]): readonly string[] | null {
  const analysis = analyzeProjection(tokensFromPieces(pieceTexts));
  return analysis.ok ? analysis.result.columns : null;
}
