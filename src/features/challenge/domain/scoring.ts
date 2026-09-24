/**
 * Puntuación de GAME_SPEC.md: puntos = 100 − 20 × (intento − 1) − 20 × pistas, solo al
 * primer acierto. La política normativa no concede bonificación por rapidez; el componente
 * `timeBonus` existe en el desglose y queda en cero mientras GAME_SPEC no lo cambie.
 */

export interface ScoringPolicy {
  readonly version: string;
  readonly maxScorePerMission: number;
  readonly maxScoredAttempts: number;
  readonly attemptPenalty: number;
  readonly hintPenalty: number;
  readonly maxHintsPerMission: number;
  /** Puntos máximos por rapidez, incluidos dentro de `maxScorePerMission`. */
  readonly maxTimeBonus: number;
}

export const GAME_SPEC_SCORING_POLICY: ScoringPolicy = Object.freeze({
  version: 'game-spec-v1',
  maxScorePerMission: 100,
  maxScoredAttempts: 2,
  attemptPenalty: 20,
  hintPenalty: 20,
  maxHintsPerMission: 1,
  maxTimeBonus: 0,
});

export interface ScoreBreakdown {
  readonly base: number;
  readonly attemptPenalty: number;
  readonly hintPenalty: number;
  readonly timeBonus: number;
  readonly total: number;
  readonly max: number;
}

export interface MissionScoreInput {
  readonly solved: boolean;
  /** Intento puntuado que obtuvo el acierto (1 o 2). */
  readonly solvedOnAttempt: number | null;
  readonly hintsUsed: number;
  readonly elapsedMs: number;
  readonly baseDurationMs: number;
}

export function baseScore(policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY): number {
  return policy.maxScorePerMission - policy.maxTimeBonus;
}

export function attemptPenalty(
  attemptNumber: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): number {
  if (
    !Number.isInteger(attemptNumber) ||
    attemptNumber < 1 ||
    attemptNumber > policy.maxScoredAttempts
  ) {
    throw new RangeError(`Intento puntuado fuera de rango: ${attemptNumber}`);
  }
  return policy.attemptPenalty * (attemptNumber - 1);
}

export function hintPenalty(
  hintsUsed: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): number {
  return (
    policy.hintPenalty * Math.min(Math.max(0, Math.trunc(hintsUsed)), policy.maxHintsPerMission)
  );
}

/** Bonificación lineal decreciente hasta la duración base; cero con la política normativa. */
export function timeBonus(
  elapsedMs: number,
  baseDurationMs: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): number {
  if (policy.maxTimeBonus <= 0 || baseDurationMs <= 0) return 0;
  const remaining = Math.min(Math.max(1 - Math.max(0, elapsedMs) / baseDurationMs, 0), 1);
  return Math.floor(policy.maxTimeBonus * remaining);
}

export function scoreMission(
  input: MissionScoreInput,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): ScoreBreakdown {
  const max = policy.maxScorePerMission;
  if (!input.solved || input.solvedOnAttempt === null) {
    return { base: 0, attemptPenalty: 0, hintPenalty: 0, timeBonus: 0, total: 0, max };
  }
  const base = baseScore(policy);
  const attempt = attemptPenalty(input.solvedOnAttempt, policy);
  const hint = hintPenalty(input.hintsUsed, policy);
  const bonus = timeBonus(input.elapsedMs, input.baseDurationMs, policy);
  const total = Math.min(Math.max(base - attempt - hint + bonus, 0), max);
  return { base, attemptPenalty: attempt, hintPenalty: hint, timeBonus: bonus, total, max };
}

/** Precisión = aciertos / intentos académicos puntuados; `null` sin intentos («Sin datos»). */
export function accuracy(correctAttempts: number, scoredAttempts: number): number | null {
  if (scoredAttempts <= 0) return null;
  return correctAttempts / scoredAttempts;
}

export interface Progress {
  readonly closed: number;
  readonly total: number;
  readonly ratio: number;
}

export function progress(closed: number, total: number): Progress {
  return { closed, total, ratio: total > 0 ? closed / total : 0 };
}
