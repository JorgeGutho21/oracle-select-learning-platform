import { z } from 'zod';
import { MISSION_IDS, type MissionId } from '@/features/challenge/domain/types';
import type {
  ClassroomRepository,
  CompletedAttempt,
  JoinResult,
  NewRoom,
  Reservation,
  TransitionResult,
} from '../application/ports';
import type { ParticipantRecord, RoomData, RoomRecord, RoomStatus } from '../domain/room';
import type { ParticipantStanding } from '../domain/standings';

/**
 * Subconjunto de `@supabase/supabase-js` que usa el repositorio: solo llamadas RPC a las
 * funciones de `supabase/migrations`. Las pruebas lo implementan sobre PostgreSQL embebido.
 */
export interface RpcClient {
  rpc(
    fn: string,
    params: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

const statusSchema = z.enum(['lobby', 'running', 'finished', 'cancelled', 'expired']);
const epoch = z.number().int();
const roomSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: statusSchema,
  revision: z.number().int(),
  createdAt: epoch,
  expiresAt: epoch,
  startedAt: epoch.nullable(),
  finishedAt: epoch.nullable(),
});
const participantSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  nickname: z.string(),
  joinedAt: epoch,
  lastSeenAt: epoch.nullable(),
  leftAt: epoch.nullable(),
});
const outcomeSchema = z.object({
  kind: z.enum(['correct', 'incorrect']),
  feedback: z.string(),
});
const dataSchema = z.object({
  room: roomSchema,
  participants: z.array(participantSchema),
  attempts: z.array(
    z.object({
      id: z.string(),
      participantId: z.string(),
      missionId: z.enum(MISSION_IDS),
      attemptNumber: z.number().int(),
      correct: z.boolean(),
      score: z.number().int(),
      durationMs: z.number().int(),
      hintUsed: z.boolean(),
      createdAt: epoch,
    }),
  ),
  hints: z.array(
    z.object({ participantId: z.string(), missionId: z.enum(MISSION_IDS), usedAt: epoch }),
  ),
});
const reservationSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('reserved'),
    attemptId: z.string(),
    attemptNumber: z.number().int(),
    hintUsed: z.boolean(),
    measuredFrom: epoch,
  }),
  z.object({ status: z.literal('replay'), outcome: outcomeSchema }),
  z.object({ status: z.enum(['conflict', 'busy', 'closed']) }),
]);

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

export class SupabaseClassroomRepository implements ClassroomRepository {
  constructor(private readonly client: RpcClient) {}

  private async call(fn: string, params: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await this.client.rpc(fn, params);
    // El mensaje de la base no llega al estudiante: solo se registra el nombre de la función.
    if (error) throw new Error(`La base de la sala no respondió (${fn}).`);
    return data;
  }

  async createRoom(input: NewRoom): Promise<RoomRecord | 'code-taken'> {
    const data = await this.call('classroom_create_room', {
      p_code: input.code,
      p_presenter_token_hash: input.presenterTokenHash,
      p_now: iso(input.now),
      p_expires_at: iso(input.expiresAt),
    });
    return data === null ? 'code-taken' : roomSchema.parse(data);
  }

  async findRoomByCode(code: string): Promise<RoomRecord | null> {
    const data = await this.call('classroom_find_room_by_code', { p_code: code });
    return data === null ? null : roomSchema.parse(data);
  }

  async findRoomById(roomId: string): Promise<RoomRecord | null> {
    const data = await this.call('classroom_find_room', { p_room_id: roomId });
    return data === null ? null : roomSchema.parse(data);
  }

  async getRoomData(roomId: string): Promise<RoomData | null> {
    const data = await this.call('classroom_room_data', { p_room_id: roomId });
    return data === null ? null : dataSchema.parse(data);
  }

  async verifyPresenter(roomId: string, presenterTokenHash: string): Promise<boolean> {
    return (
      (await this.call('classroom_verify_presenter', {
        p_room_id: roomId,
        p_token_hash: presenterTokenHash,
      })) === true
    );
  }

  async joinRoom(input: {
    roomId: string;
    nickname: string;
    nicknameKey: string;
    tokenHash: string;
    capacity: number;
    now: number;
  }): Promise<JoinResult> {
    const data = z
      .discriminatedUnion('status', [
        z.object({ status: z.literal('joined'), participant: participantSchema }),
        z.object({ status: z.enum(['nickname-taken', 'full', 'closed']) }),
      ])
      .parse(
        await this.call('classroom_join', {
          p_room_id: input.roomId,
          p_nickname: input.nickname,
          p_nickname_key: input.nicknameKey,
          p_token_hash: input.tokenHash,
          p_capacity: input.capacity,
          p_now: iso(input.now),
        }),
      );
    return data;
  }

  async findParticipant(roomId: string, tokenHash: string): Promise<ParticipantRecord | null> {
    const data = await this.call('classroom_find_participant', {
      p_room_id: roomId,
      p_token_hash: tokenHash,
    });
    return data === null ? null : participantSchema.parse(data);
  }

  async touchParticipant(participantId: string, now: number): Promise<void> {
    await this.call('classroom_touch', { p_participant_id: participantId, p_now: iso(now) });
  }

  async leaveRoom(participantId: string, now: number): Promise<void> {
    await this.call('classroom_leave', { p_participant_id: participantId, p_now: iso(now) });
  }

  async transitionRoom(input: {
    roomId: string;
    from: readonly RoomStatus[];
    to: RoomStatus;
    requireParticipants: boolean;
    now: number;
  }): Promise<TransitionResult> {
    return z
      .discriminatedUnion('status', [
        z.object({ status: z.literal('ok'), room: roomSchema }),
        z.object({ status: z.literal('conflict'), room: roomSchema }),
        z.object({ status: z.literal('empty') }),
      ])
      .parse(
        await this.call('classroom_transition', {
          p_room_id: input.roomId,
          p_from: input.from,
          p_to: input.to,
          p_require_participants: input.requireParticipants,
          p_now: iso(input.now),
        }),
      );
  }

  async reserveAttempt(input: {
    participantId: string;
    missionId: MissionId;
    requestId: string;
    payloadHash: string;
    maxAttempts: number;
    pendingTimeoutMs: number;
    now: number;
  }): Promise<Reservation> {
    return reservationSchema.parse(
      await this.call('classroom_reserve_attempt', {
        p_participant_id: input.participantId,
        p_mission_id: input.missionId,
        p_request_id: input.requestId,
        p_payload_hash: input.payloadHash,
        p_max_attempts: input.maxAttempts,
        p_pending_timeout_ms: input.pendingTimeoutMs,
        p_now: iso(input.now),
      }),
    );
  }

  async completeAttempt(input: CompletedAttempt): Promise<void> {
    await this.call('classroom_complete_attempt', {
      p_attempt_id: input.attemptId,
      p_academic: input.academic,
      p_correct: input.correct,
      p_score: input.score,
      p_duration_ms: Math.round(input.durationMs),
      p_outcome: input.outcome,
      p_now: iso(input.now),
    });
  }

  async recordHint(participantId: string, missionId: MissionId, now: number): Promise<void> {
    await this.call('classroom_record_hint', {
      p_participant_id: participantId,
      p_mission_id: missionId,
      p_now: iso(now),
    });
  }

  async saveResults(
    roomId: string,
    standings: readonly ParticipantStanding[],
    now: number,
  ): Promise<void> {
    await this.call('classroom_save_results', {
      p_room_id: roomId,
      p_results: standings.map((standing) => ({
        participantId: standing.participantId,
        score: standing.score,
        timeMs: Math.round(standing.timeMs),
        accuracy: standing.accuracy,
        solvedMissions: standing.solvedMissions,
        attempts: standing.attempts,
        hintsUsed: standing.hintsUsed,
      })),
      p_now: iso(now),
    });
  }
}
