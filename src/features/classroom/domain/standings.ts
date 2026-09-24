import { accuracy } from '@/features/challenge/domain/scoring';
import { MISSION_IDS, type MissionId } from '@/features/challenge/domain/types';
import { CONNECTED_WINDOW_MS, type RoomData } from './room';

/**
 * Resultados de la sala calculados solo a partir de intentos registrados por el servidor.
 * Una misma función produce ranking, progreso y estadísticas: no hay copias editables.
 * Orden, empates y denominadores siguen GAME_SPEC («Tiempo y ranking de sala» y
 * «Estadísticas y feedback»); el tiempo de ranking a ritmo propio, REALTIME_SPEC 1.1.
 */

export interface ParticipantStanding {
  readonly participantId: string;
  readonly nickname: string;
  readonly joinedAt: number;
  readonly score: number;
  readonly solvedMissions: number;
  /** Misiones con al menos un intento académico. */
  readonly answeredMissions: number;
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly hintsUsed: number;
  /** Aciertos / intentos puntuados; `null` sin intentos. */
  readonly accuracy: number | null;
  /**
   * Tiempo activo hasta su último acierto, desde el inicio de la sala (o su ingreso, si
   * fue posterior). Cero sin aciertos: no hay tiempo que comparar.
   */
  readonly timeMs: number;
  readonly connected: boolean;
  readonly left: boolean;
}

export interface RankedStanding extends ParticipantStanding {
  /** Ranking de competición: 1, 2, 3, 3, 5. */
  readonly position: number;
}

export interface MissionProgress {
  readonly missionId: MissionId;
  /** Participantes con al menos un intento académico en la misión. */
  readonly answered: number;
  readonly solved: number;
  readonly attempts: number;
  /**
   * Personas que acertaron / participantes del grupo (GAME_SPEC). `null` si nadie la
   * respondió: en una sala a ritmo propio, no llegar a una misión no la hace difícil.
   */
  readonly successRate: number | null;
}

export interface RoomStatistics {
  readonly participants: number;
  readonly averageScore: number | null;
  readonly accuracy: number | null;
  /** Media del tiempo de quienes acertaron al menos una misión; `null` sin aciertos. */
  readonly averageTimeMs: number | null;
  /** Misiones con la mayor tasa de acierto; varias si empatan. */
  readonly easiest: readonly MissionProgress[];
  /** Misiones con la menor tasa; vacío si todas las respondidas tienen la misma. */
  readonly hardest: readonly MissionProgress[];
}

export function computeStandings(data: RoomData, now: number): ParticipantStanding[] {
  const startedAt = data.room.startedAt;
  return data.participants.map((participant) => {
    const own = data.attempts.filter(({ participantId }) => participantId === participant.id);
    const correct = own.filter((attempt) => attempt.correct);
    const hints = data.hints.filter(({ participantId }) => participantId === participant.id);
    const lastCorrectAt = correct.reduce((latest, { createdAt }) => Math.max(latest, createdAt), 0);
    const from = Math.max(startedAt ?? participant.joinedAt, participant.joinedAt);
    return {
      participantId: participant.id,
      nickname: participant.nickname,
      joinedAt: participant.joinedAt,
      score: correct.reduce((total, { score }) => total + score, 0),
      solvedMissions: new Set(correct.map(({ missionId }) => missionId)).size,
      answeredMissions: new Set(own.map(({ missionId }) => missionId)).size,
      attempts: own.length,
      correctAttempts: correct.length,
      hintsUsed: new Set(hints.map(({ missionId }) => missionId)).size,
      accuracy: accuracy(correct.length, own.length),
      timeMs: correct.length > 0 && startedAt !== null ? Math.max(0, lastCorrectAt - from) : 0,
      connected:
        participant.leftAt === null &&
        participant.lastSeenAt !== null &&
        now - participant.lastSeenAt <= CONNECTED_WINDOW_MS,
      left: participant.leftAt !== null,
    };
  });
}

function sameRank(left: ParticipantStanding, right: ParticipantStanding): boolean {
  return (
    left.score === right.score &&
    left.solvedMissions === right.solvedMissions &&
    left.timeMs === right.timeMs
  );
}

/**
 * Puntos descendentes, misiones resueltas descendentes y tiempo ascendente. Si los tres
 * coinciden, comparten posición; el alias solo ordena la lista visualmente.
 */
export function rankStandings(standings: readonly ParticipantStanding[]): RankedStanding[] {
  const sorted = [...standings].sort(
    (left, right) =>
      right.score - left.score ||
      right.solvedMissions - left.solvedMissions ||
      left.timeMs - right.timeMs ||
      left.nickname.localeCompare(right.nickname, 'es'),
  );
  return sorted.map((standing) => ({
    ...standing,
    position: sorted.findIndex((other) => sameRank(other, standing)) + 1,
  }));
}

export function computeMissionProgress(data: RoomData): MissionProgress[] {
  const group = data.participants.length;
  return MISSION_IDS.map((missionId) => {
    const attempts = data.attempts.filter((attempt) => attempt.missionId === missionId);
    const answered = new Set(attempts.map(({ participantId }) => participantId)).size;
    const solved = new Set(
      attempts.filter(({ correct }) => correct).map(({ participantId }) => participantId),
    ).size;
    return {
      missionId,
      answered,
      solved,
      attempts: attempts.length,
      successRate: answered > 0 && group > 0 ? solved / group : null,
    };
  });
}

function average(values: readonly number[]): number | null {
  return values.length > 0
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
}

/** Estadísticas del grupo; sin intentos no se inventan porcentajes (U08). */
export function computeStatistics(
  standings: readonly ParticipantStanding[],
  missions: readonly MissionProgress[],
): RoomStatistics {
  const attempts = standings.reduce((total, standing) => total + standing.attempts, 0);
  const correct = standings.reduce((total, standing) => total + standing.correctAttempts, 0);
  const rated = missions.filter(
    (mission): mission is MissionProgress & { successRate: number } => mission.successRate !== null,
  );
  const rates = rated.map(({ successRate }) => successRate);
  const highest = Math.max(...rates);
  const lowest = Math.min(...rates);
  return {
    participants: standings.length,
    averageScore: average(standings.map(({ score }) => score)),
    accuracy: accuracy(correct, attempts),
    averageTimeMs: average(
      standings.filter(({ solvedMissions }) => solvedMissions > 0).map(({ timeMs }) => timeMs),
    ),
    easiest: rated.filter(({ successRate }) => successRate === highest),
    hardest: lowest < highest ? rated.filter(({ successRate }) => successRate === lowest) : [],
  };
}
