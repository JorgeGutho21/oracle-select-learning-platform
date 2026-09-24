import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { analyzeSql } from '@/domain/sql/analyzer';
import { runEducational } from '@/domain/sql/educational-run';
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
  return runEducational(pieceTexts.join(' ')).result?.table.columns ?? null;
}

export interface SqlCheckItem {
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly hint: string | null;
  readonly line: number;
  readonly column: number;
  readonly from: number;
  readonly to: number;
}

/** Revisión sin puntuar de una consulta escrita (M10) con el motor SQL compartido. */
export function checkSql(sql: string): {
  readonly valid: boolean;
  readonly items: readonly SqlCheckItem[];
} {
  const analysis = analyzeSql(sql);
  return {
    valid: analysis.ok,
    items: analysis.diagnostics.map((item) => ({
      severity: item.severity,
      message: item.message,
      hint: item.hint,
      line: item.line,
      column: item.column,
      from: item.span.start,
      to: item.span.end,
    })),
  };
}
