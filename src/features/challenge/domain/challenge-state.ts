import { GAME_SPEC_SCORING_POLICY, type ScoringPolicy } from './scoring';
import type { EvaluationOutcome, MissionAnswer, MissionId } from './types';

/**
 * Estado de una partida individual de práctica (UX_FLOWS, Flujo E) y sus transiciones.
 * Funciones puras: reciben el estado y el instante `now` y devuelven un estado nuevo.
 */

export const CHALLENGE_SCHEMA_VERSION = 1;

export type MissionStatus = 'not-started' | 'in-progress' | 'solved' | 'failed' | 'skipped';
export const CLOSED_STATUSES: readonly MissionStatus[] = ['solved', 'failed', 'skipped'];

export interface Attempt {
  readonly id: string;
  readonly missionId: MissionId;
  /** Ordinal dentro de la misión, contando intentos puntuados y de práctica. */
  readonly number: number;
  /** Falso para ensayos posteriores al cierre de la oportunidad puntuada. */
  readonly scored: boolean;
  readonly answer: MissionAnswer;
  readonly correct: boolean;
  readonly feedback: string;
  readonly submittedAt: number;
  readonly elapsedMs: number;
}

export interface HintUsage {
  readonly missionId: MissionId;
  readonly requestedAt: number;
  readonly elapsedMs: number;
}

export interface MissionTimer {
  readonly activeMs: number;
  readonly runningSince: number | null;
}

export interface MissionState {
  readonly missionId: MissionId;
  readonly status: MissionStatus;
  readonly attempts: readonly Attempt[];
  readonly hint: HintUsage | null;
  readonly timer: MissionTimer;
  readonly pendingEvaluation: boolean;
  readonly openedAt: number | null;
  readonly closedAt: number | null;
}

export interface ChallengeState {
  readonly schemaVersion: typeof CHALLENGE_SCHEMA_VERSION;
  readonly challengeVersion: string;
  readonly datasetId: string;
  readonly scoringPolicyVersion: string;
  readonly mode: 'practice';
  readonly sessionId: string;
  readonly status: 'in-progress' | 'finished';
  readonly startedAt: number;
  readonly finishedAt: number | null;
  readonly savedAt: number;
  readonly currentMissionId: MissionId | null;
  readonly missionOrder: readonly MissionId[];
  readonly missions: Readonly<Partial<Record<MissionId, MissionState>>>;
}

export type ChallengeErrorCode =
  | 'unknown-mission'
  | 'challenge-finished'
  | 'evaluation-pending'
  | 'no-evaluation-pending'
  | 'mission-closed'
  | 'hint-unavailable'
  | 'explanation-locked'
  | 'no-active-challenge';

export class ChallengeRuleError extends Error {
  constructor(
    readonly code: ChallengeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ChallengeRuleError';
  }
}

export interface CreateChallengeInput {
  readonly sessionId: string;
  readonly challengeVersion: string;
  readonly datasetId: string;
  readonly missionOrder: readonly MissionId[];
  readonly now: number;
  readonly policy?: ScoringPolicy;
}

/* ---------- Consultas ---------- */

export function isClosed(mission: MissionState): boolean {
  return CLOSED_STATUSES.includes(mission.status);
}

export function elapsedMs(timer: MissionTimer, now: number): number {
  return timer.activeMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince));
}

export function getMission(state: ChallengeState, id: MissionId): MissionState {
  const mission = state.missions[id];
  if (!mission)
    throw new ChallengeRuleError(
      'unknown-mission',
      `La misión ${id} no forma parte de la partida.`,
    );
  return mission;
}

export function scoredAttempts(mission: MissionState): readonly Attempt[] {
  return mission.attempts.filter((attempt) => attempt.scored);
}

export function canRequestHint(
  state: ChallengeState,
  id: MissionId,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): boolean {
  const mission = getMission(state, id);
  return (
    state.status === 'in-progress' &&
    !isClosed(mission) &&
    !mission.pendingEvaluation &&
    (mission.hint === null ? policy.maxHintsPerMission > 0 : true)
  );
}

export function nextOpenMission(state: ChallengeState, after: MissionId | null): MissionId | null {
  const start = after === null ? 0 : state.missionOrder.indexOf(after) + 1;
  const candidates = [...state.missionOrder.slice(start), ...state.missionOrder.slice(0, start)];
  return candidates.find((id) => !isClosed(getMission(state, id))) ?? null;
}

/* ---------- Transiciones ---------- */

function emptyMission(missionId: MissionId): MissionState {
  return {
    missionId,
    status: 'not-started',
    attempts: [],
    hint: null,
    timer: { activeMs: 0, runningSince: null },
    pendingEvaluation: false,
    openedAt: null,
    closedAt: null,
  };
}

export function createChallengeState(input: CreateChallengeInput): ChallengeState {
  const missions: Partial<Record<MissionId, MissionState>> = {};
  for (const id of input.missionOrder) missions[id] = emptyMission(id);
  return {
    schemaVersion: CHALLENGE_SCHEMA_VERSION,
    challengeVersion: input.challengeVersion,
    datasetId: input.datasetId,
    scoringPolicyVersion: (input.policy ?? GAME_SPEC_SCORING_POLICY).version,
    mode: 'practice',
    sessionId: input.sessionId,
    status: 'in-progress',
    startedAt: input.now,
    finishedAt: null,
    savedAt: input.now,
    currentMissionId: null,
    missionOrder: [...input.missionOrder],
    missions,
  };
}

function updateMission(state: ChallengeState, mission: MissionState): ChallengeState {
  return { ...state, missions: { ...state.missions, [mission.missionId]: mission } };
}

function pausedTimer(timer: MissionTimer, now: number): MissionTimer {
  return timer.runningSince === null
    ? timer
    : { activeMs: elapsedMs(timer, now), runningSince: null };
}

function assertPlayable(state: ChallengeState): void {
  if (state.status === 'finished')
    throw new ChallengeRuleError('challenge-finished', 'La partida ya terminó.');
}

/** Pausa el cronómetro de la misión actual (salir, ocultar pestaña o cambiar de misión). */
export function pauseCurrent(state: ChallengeState, now: number): ChallengeState {
  if (state.currentMissionId === null) return state;
  const mission = getMission(state, state.currentMissionId);
  if (mission.timer.runningSince === null) return state;
  return updateMission(state, { ...mission, timer: pausedTimer(mission.timer, now) });
}

/** Reanuda el cronómetro de la misión actual si su oportunidad puntuada sigue abierta. */
export function resumeCurrent(state: ChallengeState, now: number): ChallengeState {
  if (state.status === 'finished' || state.currentMissionId === null) return state;
  const mission = getMission(state, state.currentMissionId);
  if (isClosed(mission) || mission.timer.runningSince !== null) return state;
  return updateMission(state, { ...mission, timer: { ...mission.timer, runningSince: now } });
}

/** Abre una misión del mapa. Volver a una misión no reinicia sus intentos (U05). */
export function openMission(state: ChallengeState, id: MissionId, now: number): ChallengeState {
  assertPlayable(state);
  const target = getMission(state, id);
  if (state.currentMissionId !== null && state.currentMissionId !== id) {
    const current = getMission(state, state.currentMissionId);
    if (current.pendingEvaluation) {
      throw new ChallengeRuleError(
        'evaluation-pending',
        'Espera la corrección antes de cambiar de misión.',
      );
    }
  }
  const paused = pauseCurrent(state, now);
  const opened: MissionState =
    target.status === 'not-started' ? { ...target, status: 'in-progress', openedAt: now } : target;
  return resumeCurrent(updateMission({ ...paused, currentMissionId: id }, opened), now);
}

export function beginEvaluation(state: ChallengeState, id: MissionId): ChallengeState {
  assertPlayable(state);
  const mission = getMission(state, id);
  if (mission.status === 'not-started') {
    throw new ChallengeRuleError('unknown-mission', `Abre la misión ${id} antes de responder.`);
  }
  if (mission.pendingEvaluation) {
    throw new ChallengeRuleError('evaluation-pending', 'Ya hay una respuesta en corrección.');
  }
  return updateMission(state, { ...mission, pendingEvaluation: true });
}

/**
 * Aplica la corrección recibida. Solo `correct` e `incorrect` registran intento; los
 * fallos técnicos y las respuestas vacías liberan la evaluación sin consumirlo.
 */
export function applyEvaluation(
  state: ChallengeState,
  id: MissionId,
  answer: MissionAnswer,
  outcome: EvaluationOutcome,
  now: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): { readonly state: ChallengeState; readonly attempt: Attempt | null } {
  const mission = getMission(state, id);
  if (!mission.pendingEvaluation) {
    throw new ChallengeRuleError('no-evaluation-pending', 'No hay una respuesta en corrección.');
  }
  const released: MissionState = { ...mission, pendingEvaluation: false };
  if (outcome.kind === 'technical' || outcome.kind === 'invalid-input') {
    return { state: updateMission(state, released), attempt: null };
  }

  const scored = !isClosed(mission);
  const elapsed = elapsedMs(mission.timer, now);
  const attempt: Attempt = {
    id: `${id}-${mission.attempts.length + 1}`,
    missionId: id,
    number: mission.attempts.length + 1,
    scored,
    answer,
    correct: outcome.kind === 'correct',
    feedback: outcome.feedback,
    submittedAt: now,
    elapsedMs: elapsed,
  };
  const attempts = [...mission.attempts, attempt];
  let next: MissionState = { ...released, attempts };
  if (scored) {
    const exhausted = attempts.filter((item) => item.scored).length >= policy.maxScoredAttempts;
    if (attempt.correct || exhausted) {
      next = {
        ...next,
        status: attempt.correct ? 'solved' : 'failed',
        closedAt: now,
        timer: pausedTimer(mission.timer, now),
      };
    }
  }
  return { state: updateMission(state, next), attempt };
}

/** Registra la pista entregada. Pedirla de nuevo no duplica el descuento. */
export function recordHint(
  state: ChallengeState,
  id: MissionId,
  now: number,
  policy: ScoringPolicy = GAME_SPEC_SCORING_POLICY,
): ChallengeState {
  if (!canRequestHint(state, id, policy)) {
    throw new ChallengeRuleError(
      'hint-unavailable',
      'La pista no está disponible en este momento.',
    );
  }
  const mission = getMission(state, id);
  if (mission.hint !== null) return state;
  return updateMission(state, {
    ...mission,
    hint: { missionId: id, requestedAt: now, elapsedMs: elapsedMs(mission.timer, now) },
  });
}

/** Omitir cierra la oportunidad con cero puntos y deja la misión pendiente de repaso. */
export function skipMission(state: ChallengeState, id: MissionId, now: number): ChallengeState {
  assertPlayable(state);
  const mission = getMission(state, id);
  if (isClosed(mission))
    throw new ChallengeRuleError('mission-closed', 'La misión ya está cerrada.');
  if (mission.pendingEvaluation) {
    throw new ChallengeRuleError(
      'evaluation-pending',
      'Espera la corrección antes de omitir la misión.',
    );
  }
  return updateMission(state, {
    ...mission,
    status: 'skipped',
    openedAt: mission.openedAt ?? now,
    closedAt: now,
    timer: pausedTimer(mission.timer, now),
  });
}

/** Termina la partida: las misiones abiertas se cierran como omitidas. */
export function finishChallenge(state: ChallengeState, now: number): ChallengeState {
  if (state.status === 'finished') return state;
  const pending = state.missionOrder.find((id) => getMission(state, id).pendingEvaluation);
  if (pending)
    throw new ChallengeRuleError('evaluation-pending', 'Espera la corrección antes de terminar.');
  let next = pauseCurrent(state, now);
  for (const id of next.missionOrder) {
    const mission = getMission(next, id);
    if (!isClosed(mission)) next = skipMission(next, id, now);
  }
  return { ...next, status: 'finished', finishedAt: now };
}

export function markSaved(state: ChallengeState, now: number): ChallengeState {
  return { ...state, savedAt: now };
}
