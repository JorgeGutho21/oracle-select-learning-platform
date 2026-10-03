import type { MissionId } from '@/features/challenge/domain/types';

/**
 * Sala en vivo v1 (REALTIME_SPEC 1.1): cada participante avanza a su ritmo por las diez
 * misiones mientras la sala está en curso. El servidor fija todos los instantes.
 */

export type RoomStatus = 'lobby' | 'running' | 'finished' | 'cancelled' | 'expired';

export const ROOM_CAPACITY = 60;
export const ROOM_TTL_MS = 4 * 60 * 60 * 1000;
/** Una persona figura «conectada» si su pantalla consultó la sala en este intervalo. */
export const CONNECTED_WINDOW_MS = 15_000;
/** Una corrección pendiente que supera este plazo se marca como fallo técnico. */
export const PENDING_ATTEMPT_TIMEOUT_MS = 30_000;

export interface RoomRecord {
  readonly id: string;
  readonly code: string;
  readonly status: RoomStatus;
  /** Aumenta con cada cambio confirmado; los avisos en tiempo real solo la transportan. */
  readonly revision: number;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
}

export interface ParticipantRecord {
  readonly id: string;
  readonly roomId: string;
  readonly nickname: string;
  readonly joinedAt: number;
  readonly lastSeenAt: number | null;
  readonly leftAt: number | null;
}

/** Intento académico evaluado; los fallos técnicos no se guardan como intento. */
export interface AttemptRecord {
  readonly id: string;
  readonly participantId: string;
  readonly missionId: MissionId;
  readonly attemptNumber: number;
  readonly correct: boolean;
  readonly score: number;
  readonly durationMs: number;
  readonly hintUsed: boolean;
  readonly createdAt: number;
}

export interface HintRecord {
  readonly participantId: string;
  readonly missionId: MissionId;
  readonly usedAt: number;
}

export interface RoomData {
  readonly room: RoomRecord;
  readonly participants: readonly ParticipantRecord[];
  readonly attempts: readonly AttemptRecord[];
  readonly hints: readonly HintRecord[];
}

const TERMINAL: readonly RoomStatus[] = ['finished', 'cancelled', 'expired'];

export function isTerminal(status: RoomStatus): boolean {
  return TERMINAL.includes(status);
}

/** Estado vigente: una sala abierta que superó su caducidad se considera caducada. */
export function effectiveStatus(room: RoomRecord, now: number): RoomStatus {
  if (!isTerminal(room.status) && now >= room.expiresAt) return 'expired';
  return room.status;
}

export type RoomCommand = 'start' | 'finish' | 'cancel';

const TRANSITIONS: Readonly<Record<RoomCommand, { from: RoomStatus[]; to: RoomStatus }>> = {
  start: { from: ['lobby'], to: 'running' },
  finish: { from: ['running'], to: 'finished' },
  cancel: { from: ['lobby', 'running'], to: 'cancelled' },
};

export function transitionFor(command: RoomCommand): { from: RoomStatus[]; to: RoomStatus } {
  return TRANSITIONS[command];
}
