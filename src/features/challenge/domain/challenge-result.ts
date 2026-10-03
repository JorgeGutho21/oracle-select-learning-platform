import {
  elapsedMs,
  getMission,
  isClosed,
  scoredAttempts,
  type ChallengeState,
  type MissionStatus,
} from './challenge-state';
import {
  accuracy,
  GAME_SPEC_SCORING_POLICY,
  progress,
  scoreMission,
  type Progress,
  type ScoreBreakdown,
  type ScoringPolicy,
} from './scoring';
import type { LessonId, MissionId, PublicMission } from './types';

export interface MissionResult {
  readonly missionId: MissionId;
  readonly order: number;
  readonly title: string;
  readonly status: MissionStatus;
  readonly solved: boolean;
  readonly scoredAttempts: number;
  readonly practiceAttempts: number;
  readonly hintUsed: boolean;
  readonly timeMs: number;
  readonly score: ScoreBreakdown;
  readonly needsReview: boolean;
  readonly lessons: readonly LessonId[];
}

/** Resultado local e informativo, rotulado «Práctica»; nunca alimenta una sala. */
export interface ChallengeResult {
  readonly label: 'Práctica';
  readonly sessionId: string;
  readonly challengeVersion: string;
  readonly datasetId: string;
  readonly scoringPolicyVersion: string;
  readonly status: ChallengeState['status'];
  readonly totalScore: number;
  readonly maxScore: number;
  readonly solvedCount: number;
  readonly missionCount: number;
  /** Aciertos / intentos puntuados; `null` sin intentos. */
  readonly accuracy: number | null;
  readonly progress: Progress;
  readonly totalTimeMs: number;
  readonly hintsUsed: number;
  readonly missions: readonly MissionResult[];
  readonly reviewLessons: readonly LessonId[];
}

type MissionMeta = Pick<
  PublicMission,
  'id' | 'order' | 'title' | 'lessons' | 'baseDurationSeconds'
>;

export function computeMissionResult(
  state: ChallengeState,
  meta: MissionMeta,
  now: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): MissionResult {
  const mission = getMission(state, meta.id);
  const scored = scoredAttempts(mission);
  const winning = scored.find((attempt) => attempt.correct) ?? null;
  const solved = mission.status === 'solved' && winning !== null;
  const timeMs = winning ? winning.elapsedMs : elapsedMs(mission.timer, now);
  const score = scoreMission(
    {
      solved,
      solvedOnAttempt: winning ? scored.indexOf(winning) + 1 : null,
      hintsUsed: mission.hint ? 1 : 0,
      elapsedMs: timeMs,
      baseDurationMs: meta.baseDurationSeconds * 1000,
    },
    policy,
  );
  return {
    missionId: meta.id,
    order: meta.order,
    title: meta.title,
    status: mission.status,
    solved,
    scoredAttempts: scored.length,
    practiceAttempts: mission.attempts.length - scored.length,
    hintUsed: mission.hint !== null,
    timeMs,
    score,
    needsReview: !solved,
    lessons: meta.lessons,
  };
}

export function computeChallengeResult(
  state: ChallengeState,
  missions: readonly MissionMeta[],
  now: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): ChallengeResult {
  const byId = new Map(missions.map((mission) => [mission.id, mission]));
  const results = state.missionOrder.map((id) => {
    const meta = byId.get(id);
    if (!meta) throw new Error(`Falta la definición pública de ${id}.`);
    return computeMissionResult(state, meta, now, policy);
  });
  const attempts = results.reduce((sum, result) => sum + result.scoredAttempts, 0);
  const solvedCount = results.filter((result) => result.solved).length;
  const closed = state.missionOrder.filter((id) => isClosed(getMission(state, id))).length;
  const reviewLessons = [
    ...new Set(results.filter((result) => result.needsReview).flatMap((result) => result.lessons)),
  ].sort();
  return {
    label: 'Práctica',
    sessionId: state.sessionId,
    challengeVersion: state.challengeVersion,
    datasetId: state.datasetId,
    scoringPolicyVersion: state.scoringPolicyVersion,
    status: state.status,
    totalScore: results.reduce((sum, result) => sum + result.score.total, 0),
    maxScore: results.reduce((sum, result) => sum + result.score.max, 0),
    solvedCount,
    missionCount: results.length,
    accuracy: accuracy(solvedCount, attempts),
    progress: progress(closed, results.length),
    totalTimeMs: results.reduce((sum, result) => sum + result.timeMs, 0),
    hintsUsed: results.filter((result) => result.hintUsed).length,
    missions: results,
    reviewLessons,
  };
}
