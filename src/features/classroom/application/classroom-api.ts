import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { ROOM_CODE_LENGTH } from '../domain/room-code';

/**
 * Superficie pública de la sala en vivo para presentación: tipos y ayudas de formato.
 * Presentación no importa dominio ni infraestructura.
 */

export type { RoomCommand, RoomStatus } from '../domain/room';
export type { MissionProgress, RankedStanding, RoomStatistics } from '../domain/standings';
export type {
  Failure,
  FailureReason,
  MissionProgressView,
  ParticipantView,
  PresenterView,
  PublicRankEntry,
  RoomSummary,
} from './classroom-service';
export { NICKNAME_MAX, NICKNAME_MIN } from '../domain/nickname';
export { normalizeRoomCode } from '../domain/room-code';

export const ROOM_CODE_SIZE = ROOM_CODE_LENGTH;

/** «03 · Título» de una misión del catálogo público, o `null` si no existe. */
export function missionLabel(missionId: string): string | null {
  const index = PUBLIC_MISSIONS.findIndex(({ id }) => id === missionId);
  const mission = PUBLIC_MISSIONS[index];
  return mission ? `${String(index + 1).padStart(2, '0')} · ${mission.title}` : null;
}
