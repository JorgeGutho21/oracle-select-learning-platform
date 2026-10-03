import type { MissionId } from '@/features/challenge/domain/types';
import type {
  ClassroomRepository,
  CompletedAttempt,
  JoinResult,
  NewRoom,
  Reservation,
  StoredOutcome,
  TransitionResult,
} from '../application/ports';
import {
  effectiveStatus,
  isTerminal,
  type AttemptRecord,
  type HintRecord,
  type ParticipantRecord,
  type RoomData,
  type RoomRecord,
  type RoomStatus,
} from '../domain/room';
import type { ParticipantStanding } from '../domain/standings';

interface StoredRoom extends RoomRecord {
  readonly presenterTokenHash: string;
}

interface StoredParticipant extends ParticipantRecord {
  readonly nicknameKey: string;
  readonly tokenHash: string;
}

interface StoredAttempt {
  readonly id: string;
  readonly roomId: string;
  readonly participantId: string;
  readonly missionId: MissionId;
  readonly requestId: string;
  readonly payloadHash: string;
  readonly status: 'pending' | 'evaluated' | 'technical_error';
  readonly attemptNumber: number;
  readonly hintUsed: boolean;
  readonly measuredFrom: number;
  readonly createdAt: number;
  readonly correct: boolean;
  readonly score: number;
  readonly durationMs: number;
  readonly outcome: StoredOutcome | null;
  readonly evaluatedAt: number | null;
}

/**
 * Sala en memoria del proceso del servidor. Solo se activa con `CLASSROOM_BACKEND=memory`
 * (desarrollo, pruebas o un aula con un único servidor local): los datos se pierden al
 * reiniciar. Reproduce la semántica atómica de las funciones SQL con bloqueos por clave.
 */
export class MemoryClassroomRepository implements ClassroomRepository {
  private readonly rooms = new Map<string, StoredRoom>();
  private readonly participants = new Map<string, StoredParticipant>();
  private readonly attempts = new Map<string, StoredAttempt>();
  private readonly hints = new Map<string, HintRecord & { readonly roomId: string }>();
  private readonly results = new Map<string, ParticipantStanding & { completedAt: number }>();
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(private readonly newId: () => string) {}

  /** Serializa las operaciones sobre una misma sala o participante. */
  private async withLock<T>(key: string, action: () => T | Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(action);
    this.locks.set(key, run);
    try {
      return await run;
    } finally {
      if (this.locks.get(key) === run) this.locks.delete(key);
    }
  }

  private bump(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) this.rooms.set(roomId, { ...room, revision: room.revision + 1 });
  }

  /** Proyecciones sin huellas de tokens: nunca salen del repositorio. */
  private publicRoom(room: StoredRoom): RoomRecord {
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      revision: room.revision,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
    };
  }

  private publicParticipant(participant: StoredParticipant): ParticipantRecord {
    return {
      id: participant.id,
      roomId: participant.roomId,
      nickname: participant.nickname,
      joinedAt: participant.joinedAt,
      lastSeenAt: participant.lastSeenAt,
      leftAt: participant.leftAt,
    };
  }

  async createRoom(input: NewRoom): Promise<RoomRecord | 'code-taken'> {
    return this.withLock('rooms', () => {
      const taken = [...this.rooms.values()].some(
        (room) => room.code === input.code && !isTerminal(room.status),
      );
      if (taken) return 'code-taken' as const;
      const room: StoredRoom = {
        id: this.newId(),
        code: input.code,
        status: 'lobby',
        revision: 1,
        createdAt: input.now,
        expiresAt: input.expiresAt,
        startedAt: null,
        finishedAt: null,
        presenterTokenHash: input.presenterTokenHash,
      };
      this.rooms.set(room.id, room);
      return this.publicRoom(room);
    });
  }

  async findRoomByCode(code: string): Promise<RoomRecord | null> {
    const room = [...this.rooms.values()]
      .filter((candidate) => candidate.code === code)
      .sort((left, right) => right.createdAt - left.createdAt)[0];
    return room ? this.publicRoom(room) : null;
  }

  async findRoomById(roomId: string): Promise<RoomRecord | null> {
    const room = this.rooms.get(roomId);
    return room ? this.publicRoom(room) : null;
  }

  async getRoomData(roomId: string): Promise<RoomData | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const attempts: AttemptRecord[] = [...this.attempts.values()]
      .filter((attempt) => attempt.roomId === roomId && attempt.status === 'evaluated')
      .map((attempt) => ({
        id: attempt.id,
        participantId: attempt.participantId,
        missionId: attempt.missionId,
        attemptNumber: attempt.attemptNumber,
        correct: attempt.correct,
        score: attempt.score,
        durationMs: attempt.durationMs,
        hintUsed: attempt.hintUsed,
        createdAt: attempt.evaluatedAt ?? attempt.createdAt,
      }))
      .sort((left, right) => left.createdAt - right.createdAt);
    return {
      room: this.publicRoom(room),
      participants: [...this.participants.values()]
        .filter((participant) => participant.roomId === roomId)
        .sort((left, right) => left.joinedAt - right.joinedAt)
        .map((participant) => this.publicParticipant(participant)),
      attempts,
      hints: [...this.hints.values()]
        .filter((hint) => hint.roomId === roomId)
        .map(({ participantId, missionId, usedAt }) => ({ participantId, missionId, usedAt })),
    };
  }

  async verifyPresenter(roomId: string, presenterTokenHash: string): Promise<boolean> {
    return this.rooms.get(roomId)?.presenterTokenHash === presenterTokenHash;
  }

  async joinRoom(input: {
    roomId: string;
    nickname: string;
    nicknameKey: string;
    tokenHash: string;
    capacity: number;
    now: number;
  }): Promise<JoinResult> {
    return this.withLock(`room:${input.roomId}`, () => {
      const room = this.rooms.get(input.roomId);
      if (!room || effectiveStatus(room, input.now) !== 'lobby') {
        return { status: 'closed' as const };
      }
      const members = [...this.participants.values()].filter(
        (participant) => participant.roomId === input.roomId,
      );
      if (members.length >= input.capacity) return { status: 'full' as const };
      if (members.some((participant) => participant.nicknameKey === input.nicknameKey)) {
        return { status: 'nickname-taken' as const };
      }
      const participant: StoredParticipant = {
        id: this.newId(),
        roomId: input.roomId,
        nickname: input.nickname,
        nicknameKey: input.nicknameKey,
        tokenHash: input.tokenHash,
        joinedAt: input.now,
        lastSeenAt: input.now,
        leftAt: null,
      };
      this.participants.set(participant.id, participant);
      this.bump(input.roomId);
      return { status: 'joined' as const, participant: this.publicParticipant(participant) };
    });
  }

  async findParticipant(roomId: string, tokenHash: string): Promise<ParticipantRecord | null> {
    const participant = [...this.participants.values()].find(
      (candidate) => candidate.roomId === roomId && candidate.tokenHash === tokenHash,
    );
    return participant ? this.publicParticipant(participant) : null;
  }

  async touchParticipant(participantId: string, now: number): Promise<void> {
    const participant = this.participants.get(participantId);
    if (participant) this.participants.set(participantId, { ...participant, lastSeenAt: now });
  }

  async leaveRoom(participantId: string, now: number): Promise<void> {
    const participant = this.participants.get(participantId);
    if (!participant) return;
    await this.withLock(`room:${participant.roomId}`, () => {
      const room = this.rooms.get(participant.roomId);
      if (!room) return;
      if (room.status === 'lobby') this.participants.delete(participantId);
      else
        this.participants.set(participantId, { ...participant, leftAt: participant.leftAt ?? now });
      this.bump(room.id);
    });
  }

  async transitionRoom(input: {
    roomId: string;
    from: readonly RoomStatus[];
    to: RoomStatus;
    requireParticipants: boolean;
    now: number;
  }): Promise<TransitionResult> {
    return this.withLock(`room:${input.roomId}`, () => {
      const room = this.rooms.get(input.roomId);
      if (!room) return { status: 'empty' as const };
      if (!input.from.includes(room.status)) {
        return { status: 'conflict' as const, room: this.publicRoom(room) };
      }
      const hasParticipants = [...this.participants.values()].some(
        (participant) => participant.roomId === input.roomId,
      );
      if (input.requireParticipants && !hasParticipants) return { status: 'empty' as const };
      const updated: StoredRoom = {
        ...room,
        status: input.to,
        revision: room.revision + 1,
        startedAt: input.to === 'running' ? input.now : room.startedAt,
        finishedAt: isTerminal(input.to) ? input.now : room.finishedAt,
      };
      this.rooms.set(room.id, updated);
      return { status: 'ok' as const, room: this.publicRoom(updated) };
    });
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
    return this.withLock(`participant:${input.participantId}`, () => {
      const participant = this.participants.get(input.participantId);
      if (!participant) return { status: 'closed' as const };
      const room = this.rooms.get(participant.roomId);
      const own = [...this.attempts.values()].filter(
        (attempt) => attempt.participantId === input.participantId,
      );
      const stale = (attempt: StoredAttempt) =>
        attempt.status === 'pending' && attempt.createdAt <= input.now - input.pendingTimeoutMs;

      const existing = own.find((attempt) => attempt.requestId === input.requestId);
      if (existing) {
        if (existing.payloadHash !== input.payloadHash) return { status: 'conflict' as const };
        if (existing.status === 'evaluated' && existing.outcome) {
          return { status: 'replay' as const, outcome: existing.outcome };
        }
        if (existing.status === 'pending' && !stale(existing)) return { status: 'busy' as const };
        // Fallo técnico o reserva caducada del mismo envío: se reintenta.
        this.attempts.delete(existing.id);
      }
      for (const attempt of own) {
        if (stale(attempt))
          this.attempts.set(attempt.id, { ...attempt, status: 'technical_error' });
      }
      if (
        [...this.attempts.values()].some(
          (attempt) =>
            attempt.participantId === input.participantId && attempt.status === 'pending',
        )
      ) {
        return { status: 'busy' as const };
      }
      const evaluated = own.filter(
        (attempt) => attempt.status === 'evaluated' && attempt.missionId === input.missionId,
      );
      if (evaluated.some(({ correct }) => correct) || evaluated.length >= input.maxAttempts) {
        return { status: 'closed' as const };
      }
      const lastEvaluated = own
        .filter((attempt) => attempt.status === 'evaluated')
        .reduce((latest, attempt) => Math.max(latest, attempt.evaluatedAt ?? 0), 0);
      const measuredFrom = Math.max(
        room?.startedAt ?? participant.joinedAt,
        participant.joinedAt,
        lastEvaluated,
      );
      const hintUsed = this.hints.has(`${input.participantId}:${input.missionId}`);
      const attempt: StoredAttempt = {
        id: this.newId(),
        roomId: participant.roomId,
        participantId: input.participantId,
        missionId: input.missionId,
        requestId: input.requestId,
        payloadHash: input.payloadHash,
        status: 'pending',
        attemptNumber: evaluated.length + 1,
        hintUsed,
        measuredFrom,
        createdAt: input.now,
        correct: false,
        score: 0,
        durationMs: 0,
        outcome: null,
        evaluatedAt: null,
      };
      this.attempts.set(attempt.id, attempt);
      return {
        status: 'reserved' as const,
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        hintUsed,
        measuredFrom,
      };
    });
  }

  async completeAttempt(input: CompletedAttempt): Promise<void> {
    const attempt = this.attempts.get(input.attemptId);
    if (!attempt) return;
    await this.withLock(`participant:${attempt.participantId}`, () => {
      const current = this.attempts.get(input.attemptId);
      if (!current || current.status !== 'pending') return;
      if (!input.academic) {
        this.attempts.set(current.id, {
          ...current,
          status: 'technical_error',
          evaluatedAt: input.now,
        });
        return;
      }
      this.attempts.set(current.id, {
        ...current,
        status: 'evaluated',
        correct: input.correct,
        score: input.score,
        durationMs: input.durationMs,
        outcome: input.outcome,
        evaluatedAt: input.now,
      });
      this.bump(current.roomId);
    });
  }

  async recordHint(participantId: string, missionId: MissionId, now: number): Promise<void> {
    await this.withLock(`participant:${participantId}`, () => {
      const participant = this.participants.get(participantId);
      const key = `${participantId}:${missionId}`;
      if (!participant || this.hints.has(key)) return;
      this.hints.set(key, { roomId: participant.roomId, participantId, missionId, usedAt: now });
      this.bump(participant.roomId);
    });
  }

  async saveResults(
    roomId: string,
    standings: readonly ParticipantStanding[],
    now: number,
  ): Promise<void> {
    for (const standing of standings) {
      if (this.participants.get(standing.participantId)?.roomId !== roomId) continue;
      this.results.set(standing.participantId, { ...standing, completedAt: now });
    }
  }
}
