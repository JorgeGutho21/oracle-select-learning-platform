import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { analyzeSql, conditionColumns } from '@/domain/sql/analyzer';
import { runEducational } from '@/domain/sql/educational-run';
import { PUBLIC_MISSIONS } from '../domain/missions/public-catalog';
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
  FeedbackCategory,
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

/** Resultado de una consulta pública sobre EMPLEADOS, limitado a sus primeras filas. */
export interface ResultPreview {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly (string | number | null)[])[];
  readonly total: number;
}

/**
 * Vista previa del resultado de una consulta que la misión ya muestra (por ejemplo, la
 * consulta con error de M08). Describe lo que devuelve; no corrige nada.
 */
export function previewResult(sql: string, limit: number): ResultPreview | null {
  const table = runEducational(sql).result?.table;
  if (!table) return null;
  return { columns: table.columns, rows: table.rows.slice(0, limit), total: table.rows.length };
}

/**
 * Filas de EMPLEADOS (ID_EMPLEADO) que conserva la consulta de la misión y columnas que usa
 * su condición. Solo se muestra cuando la misión ya está cerrada, para explicar el porqué.
 */
export function queryTrace(sql: string): {
  readonly keptIds: readonly number[];
  readonly whereColumns: readonly string[];
} {
  const run = runEducational(sql);
  const statement = run.analysis.statement;
  return {
    keptIds: (run.result?.trace.keptRows ?? []).map(
      (index) => EMPLEADOS_DATASET.rows[index]!.ID_EMPLEADO,
    ),
    whereColumns: statement ? [...new Set(conditionColumns(statement))] : [],
  };
}

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

/** Recorrido público de las diez misiones (identificador, título y dificultad), sin rúbricas. */
export const MISSION_OVERVIEW: readonly {
  readonly id: string;
  readonly title: string;
  readonly difficulty: 'facil' | 'media' | 'dificil';
}[] = PUBLIC_MISSIONS.map(({ id, title, difficulty }) => ({ id, title, difficulty }));
