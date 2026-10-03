import {
  CHALLENGE_SCHEMA_VERSION,
  elapsedMs,
  type Attempt,
  type ChallengeState,
  type HintUsage,
  type MissionState,
  type MissionStatus,
} from './challenge-state';
import { INTERACTION_TYPES, MISSION_IDS, type MissionAnswer, type MissionId } from './types';

/**
 * Valida una partida guardada antes de reanudarla. Datos manipulados, de otra versión o
 * incompletos se descartan en lugar de mezclarse con la versión vigente.
 */

export interface RestoreExpectations {
  readonly challengeVersion: string;
  readonly datasetId: string;
  readonly scoringPolicyVersion: string;
  readonly missionOrder: readonly MissionId[];
}

export type RestoreOutcome =
  | { readonly ok: true; readonly state: ChallengeState }
  | { readonly ok: false; readonly reason: 'corrupt' | 'incompatible' };

type Json = Record<string, unknown>;

const STATUSES: readonly MissionStatus[] = [
  'not-started',
  'in-progress',
  'solved',
  'failed',
  'skipped',
];

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isTimeOrNull = (value: unknown): value is number | null => value === null || isTime(value);
const isMissionId = (value: unknown): value is MissionId =>
  typeof value === 'string' && (MISSION_IDS as readonly string[]).includes(value);

function isAnswer(value: unknown): value is MissionAnswer {
  return (
    isObject(value) &&
    typeof value.type === 'string' &&
    (INTERACTION_TYPES as readonly string[]).includes(value.type)
  );
}

function isAttempt(value: unknown, missionId: MissionId): value is Attempt {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    value.missionId === missionId &&
    Number.isInteger(value.number) &&
    typeof value.scored === 'boolean' &&
    isAnswer(value.answer) &&
    typeof value.correct === 'boolean' &&
    typeof value.feedback === 'string' &&
    isTime(value.submittedAt) &&
    isTime(value.elapsedMs)
  );
}

function isHint(value: unknown, missionId: MissionId): value is HintUsage | null {
  return (
    value === null ||
    (isObject(value) &&
      value.missionId === missionId &&
      isTime(value.requestedAt) &&
      isTime(value.elapsedMs))
  );
}

function parseMission(value: unknown, missionId: MissionId, savedAt: number): MissionState | null {
  if (!isObject(value) || value.missionId !== missionId) return null;
  const { status, attempts, hint, timer } = value;
  if (typeof status !== 'string' || !(STATUSES as readonly string[]).includes(status)) return null;
  if (!Array.isArray(attempts) || !attempts.every((attempt) => isAttempt(attempt, missionId)))
    return null;
  if (!isHint(hint, missionId)) return null;
  if (!isObject(timer) || !isTime(timer.activeMs) || !isTimeOrNull(timer.runningSince)) return null;
  if (!isTimeOrNull(value.openedAt) || !isTimeOrNull(value.closedAt)) return null;
  // El cronómetro se detiene al salir: se acumula hasta el último guardado y queda en pausa.
  const activeMs = elapsedMs(
    { activeMs: timer.activeMs, runningSince: timer.runningSince },
    savedAt,
  );
  return {
    missionId,
    status: status as MissionStatus,
    attempts,
    hint,
    timer: { activeMs, runningSince: null },
    pendingEvaluation: false,
    openedAt: value.openedAt,
    closedAt: value.closedAt,
  };
}

export function restoreChallengeState(raw: unknown, expected: RestoreExpectations): RestoreOutcome {
  if (!isObject(raw)) return { ok: false, reason: 'corrupt' };
  if (
    raw.schemaVersion !== CHALLENGE_SCHEMA_VERSION ||
    raw.challengeVersion !== expected.challengeVersion ||
    raw.datasetId !== expected.datasetId ||
    raw.scoringPolicyVersion !== expected.scoringPolicyVersion
  ) {
    return { ok: false, reason: 'incompatible' };
  }
  const order = raw.missionOrder;
  if (
    !Array.isArray(order) ||
    order.length !== expected.missionOrder.length ||
    !order.every((id, index) => id === expected.missionOrder[index])
  ) {
    return { ok: false, reason: 'incompatible' };
  }
  if (
    raw.mode !== 'practice' ||
    typeof raw.sessionId !== 'string' ||
    (raw.status !== 'in-progress' && raw.status !== 'finished') ||
    !isTime(raw.startedAt) ||
    !isTimeOrNull(raw.finishedAt) ||
    !isTime(raw.savedAt) ||
    !(raw.currentMissionId === null || isMissionId(raw.currentMissionId)) ||
    !isObject(raw.missions)
  ) {
    return { ok: false, reason: 'corrupt' };
  }
  const savedAt = raw.savedAt;
  const missions: Partial<Record<MissionId, MissionState>> = {};
  for (const id of expected.missionOrder) {
    const mission = parseMission(raw.missions[id], id, savedAt);
    if (!mission) return { ok: false, reason: 'corrupt' };
    missions[id] = mission;
  }
  return {
    ok: true,
    state: {
      schemaVersion: CHALLENGE_SCHEMA_VERSION,
      challengeVersion: expected.challengeVersion,
      datasetId: expected.datasetId,
      scoringPolicyVersion: expected.scoringPolicyVersion,
      mode: 'practice',
      sessionId: raw.sessionId,
      status: raw.status,
      startedAt: raw.startedAt,
      finishedAt: raw.finishedAt,
      savedAt,
      currentMissionId: raw.currentMissionId,
      missionOrder: [...expected.missionOrder],
      missions,
    },
  };
}
