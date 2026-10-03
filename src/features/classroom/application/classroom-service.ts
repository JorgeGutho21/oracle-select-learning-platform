import type { MissionEvaluator } from '@/features/challenge/application/ports';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import {
  GAME_SPEC_SCORING_POLICY,
  scoreMission,
  type ScoringPolicy,
} from '@/features/challenge/domain/scoring';
import type { EvaluationOutcome, MissionId } from '@/features/challenge/domain/types';
import { sanitizeNickname } from '../domain/nickname';
import { roomCodeFromBytes } from '../domain/room-code';
import {
  effectiveStatus,
  PENDING_ATTEMPT_TIMEOUT_MS,
  ROOM_CAPACITY,
  ROOM_TTL_MS,
  transitionFor,
  type RoomCommand,
  type RoomData,
  type RoomRecord,
  type RoomStatus,
} from '../domain/room';
import {
  computeMissionProgress,
  computeStandings,
  computeStatistics,
  rankStandings,
  type MissionProgress,
  type RankedStanding,
  type RoomStatistics,
} from '../domain/standings';
import type {
  ClassroomClock,
  ClassroomRepository,
  ClassroomSecrets,
  PresenterGate,
  RoomNotifier,
  StoredOutcome,
} from './ports';
import { liveAnswerSchema, missionIdSchema, nicknameInputSchema, roomCodeSchema } from './schemas';

export type FailureReason =
  | 'invalid'
  | 'unconfigured'
  | 'forbidden'
  | 'not-found'
  | 'expired'
  | 'closed'
  | 'full'
  | 'nickname-taken'
  | 'empty'
  | 'conflict';

export interface Failure {
  readonly ok: false;
  readonly reason: FailureReason;
  readonly message: string;
}

const MESSAGES: Readonly<Record<FailureReason, string>> = {
  invalid: 'Los datos enviados no son válidos.',
  unconfigured: 'La sala en vivo no está configurada en este servidor.',
  forbidden: 'No tienes permiso para esta sala.',
  'not-found': 'No existe una sala con ese código.',
  expired: 'La sala caducó. Pide al profesor un código nuevo.',
  closed: 'La actividad ya comenzó o terminó: no admite participantes nuevos.',
  full: 'La sala está completa.',
  'nickname-taken': 'Ese alias ya está en uso en la sala. Elige otro.',
  empty: 'Se necesita al menos un participante para iniciar.',
  conflict: 'La sala cambió mientras tanto. Se actualizó su estado.',
};

function fail(reason: FailureReason, message = MESSAGES[reason]): Failure {
  return { ok: false, reason, message };
}

export interface RoomSummary {
  readonly id: string;
  readonly code: string;
  readonly status: RoomStatus;
  readonly revision: number;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
  /** Hora del servidor al preparar la vista, para calcular tiempos sin el reloj local. */
  readonly serverNow: number;
}

export interface MissionProgressView extends MissionProgress {
  readonly order: number;
  readonly title: string;
}

export interface PresenterView {
  readonly room: RoomSummary;
  /** En orden de ranking. */
  readonly participants: readonly RankedStanding[];
  readonly connected: number;
  readonly responded: number;
  readonly missions: readonly MissionProgressView[];
  readonly statistics: RoomStatistics;
}

export interface PublicRankEntry {
  readonly position: number;
  readonly nickname: string;
  readonly score: number;
  readonly timeMs: number;
  readonly isMe: boolean;
}

export interface ParticipantView {
  readonly room: RoomSummary;
  readonly me: RankedStanding;
  readonly participants: number;
  /** Top cinco en curso; la lista completa al terminar (REALTIME_SPEC, privacidad). */
  readonly ranking: readonly PublicRankEntry[];
  readonly missionCount: number;
}

export interface ClassroomDeps {
  readonly repository: ClassroomRepository;
  readonly evaluator: MissionEvaluator;
  readonly notifier: RoomNotifier;
  readonly presenterGate: PresenterGate;
  readonly secrets: ClassroomSecrets;
  readonly clock: ClassroomClock;
  readonly policy?: ScoringPolicy;
  readonly capacity?: number;
}

const MISSION_META = new Map(PUBLIC_MISSIONS.map((mission) => [mission.id, mission]));

function summary(room: RoomRecord, now: number): RoomSummary {
  return {
    id: room.id,
    code: room.code,
    status: effectiveStatus(room, now),
    revision: room.revision,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    serverNow: now,
  };
}

function technical(message: string): EvaluationOutcome {
  return { kind: 'technical', reason: 'service-unavailable', message };
}

/**
 * Casos de uso de la sala en vivo. Toda regla (puntos, intentos, tiempos y ranking) se
 * aplica aquí o en el dominio con la hora del servidor; el navegador no aporta puntos.
 */
export class ClassroomService {
  private readonly policy: ScoringPolicy;
  private readonly capacity: number;

  constructor(private readonly deps: ClassroomDeps) {
    this.policy = deps.policy ?? GAME_SPEC_SCORING_POLICY;
    this.capacity = deps.capacity ?? ROOM_CAPACITY;
  }

  get presenterAccessConfigured(): boolean {
    return this.deps.presenterGate.configured;
  }

  async createRoom(
    accessCode: string,
  ): Promise<{ ok: true; room: RoomSummary; presenterToken: string } | Failure> {
    const gate = this.deps.presenterGate;
    if (!gate.configured) return fail('unconfigured', 'Falta configurar la clave del profesor.');
    if (typeof accessCode !== 'string' || !gate.verify(accessCode)) {
      return fail('forbidden', 'La clave del profesor no es correcta.');
    }
    const presenterToken = this.deps.secrets.randomToken();
    const now = this.deps.clock.now();
    for (let tries = 0; tries < 8; tries += 1) {
      const created = await this.deps.repository.createRoom({
        code: roomCodeFromBytes(this.deps.secrets.randomBytes(6)),
        presenterTokenHash: this.deps.secrets.hash(presenterToken),
        now,
        expiresAt: now + ROOM_TTL_MS,
      });
      if (created !== 'code-taken') {
        return { ok: true, room: summary(created, now), presenterToken };
      }
    }
    return fail('conflict', 'No se pudo generar un código libre. Inténtalo de nuevo.');
  }

  /** Validación limitada del código antes de pedir el alias (DATABASE_SCHEMA, permisos). */
  async checkCode(
    codeInput: unknown,
  ): Promise<{ ok: true; code: string; status: RoomStatus } | Failure> {
    const parsed = roomCodeSchema.safeParse(codeInput);
    if (!parsed.success) return fail('invalid', 'El código tiene seis letras o números.');
    const room = await this.deps.repository.findRoomByCode(parsed.data);
    if (!room) return fail('not-found');
    return { ok: true, code: room.code, status: effectiveStatus(room, this.deps.clock.now()) };
  }

  async joinRoom(
    codeInput: unknown,
    nicknameInput: unknown,
  ): Promise<{ ok: true; code: string; participantToken: string } | Failure> {
    const code = roomCodeSchema.safeParse(codeInput);
    const rawNickname = nicknameInputSchema.safeParse(nicknameInput);
    if (!code.success || !rawNickname.success) return fail('invalid');
    const nickname = sanitizeNickname(rawNickname.data);
    if (!nickname.ok) return fail('invalid', nickname.message);
    const room = await this.deps.repository.findRoomByCode(code.data);
    if (!room) return fail('not-found');
    const now = this.deps.clock.now();
    const status = effectiveStatus(room, now);
    if (status === 'expired') return fail('expired');
    if (status !== 'lobby') return fail('closed');
    const participantToken = this.deps.secrets.randomToken();
    const joined = await this.deps.repository.joinRoom({
      roomId: room.id,
      nickname: nickname.nickname,
      nicknameKey: nickname.key,
      tokenHash: this.deps.secrets.hash(participantToken),
      capacity: this.capacity,
      now,
    });
    if (joined.status !== 'joined') return fail(joined.status);
    await this.notify(room.id);
    return { ok: true, code: room.code, participantToken };
  }

  async presenterView(
    codeInput: unknown,
    presenterToken: unknown,
  ): Promise<PresenterView | Failure> {
    const access = await this.presenterRoom(codeInput, presenterToken);
    if ('ok' in access) return access;
    return this.buildPresenterView(access.id);
  }

  async participantView(
    codeInput: unknown,
    participantToken: unknown,
  ): Promise<ParticipantView | Failure> {
    const access = await this.participant(codeInput, participantToken);
    if ('ok' in access) return access;
    const now = this.deps.clock.now();
    // Consultar la sala es la señal de presencia: nunca prueba inscripción ni avance.
    await this.deps.repository.touchParticipant(access.participant.id, now);
    const data = await this.deps.repository.getRoomData(access.room.id);
    if (!data) return fail('not-found');
    const status = effectiveStatus(data.room, now);
    const ranked = rankStandings(computeStandings(data, now));
    const me = ranked.find(({ participantId }) => participantId === access.participant.id);
    if (!me) return fail('forbidden');
    const visible = status === 'finished' ? ranked : ranked.slice(0, 5);
    return {
      room: summary(data.room, now),
      me,
      participants: ranked.length,
      ranking: visible.map((entry) => ({
        position: entry.position,
        nickname: entry.nickname,
        score: entry.score,
        timeMs: entry.timeMs,
        isMe: entry.participantId === me.participantId,
      })),
      missionCount: PUBLIC_MISSIONS.length,
    };
  }

  async command(
    command: RoomCommand,
    codeInput: unknown,
    presenterToken: unknown,
  ): Promise<PresenterView | Failure> {
    const access = await this.presenterRoom(codeInput, presenterToken);
    if ('ok' in access) return access;
    const now = this.deps.clock.now();
    if (effectiveStatus(access, now) === 'expired') {
      await this.expire(access);
      return fail('expired');
    }
    const { from, to } = transitionFor(command);
    const result = await this.deps.repository.transitionRoom({
      roomId: access.id,
      from,
      to,
      requireParticipants: command === 'start',
      now,
    });
    if (result.status === 'empty') return fail('empty');
    if (result.status === 'conflict') return fail('conflict');
    if (command === 'finish') {
      const data = await this.deps.repository.getRoomData(access.id);
      if (data) await this.deps.repository.saveResults(access.id, computeStandings(data, now), now);
    }
    await this.deps.notifier.notify(access.id, result.room.revision).catch(() => undefined);
    return this.buildPresenterView(access.id);
  }

  async leaveRoom(codeInput: unknown, participantToken: unknown): Promise<{ ok: true } | Failure> {
    const access = await this.participant(codeInput, participantToken);
    if ('ok' in access) return access;
    await this.deps.repository.leaveRoom(access.participant.id, this.deps.clock.now());
    await this.notify(access.room.id);
    return { ok: true };
  }

  /**
   * Corrige una respuesta en vivo. Devuelve siempre un resultado que el Challenge sabe
   * mostrar: los fallos de sala o de red son técnicos y no consumen intento.
   */
  async submitAnswer(
    codeInput: unknown,
    participantToken: unknown,
    input: unknown,
  ): Promise<EvaluationOutcome> {
    const parsed = liveAnswerSchema.safeParse(input);
    if (!parsed.success)
      return { kind: 'invalid-input', message: 'La respuesta no tiene un formato válido.' };
    const access = await this.participant(codeInput, participantToken);
    if ('ok' in access) return technical(access.message);
    const now = this.deps.clock.now();
    const status = effectiveStatus(access.room, now);
    if (status !== 'running') {
      return technical(
        status === 'lobby'
          ? 'La actividad aún no comenzó.'
          : 'La sala terminó: ya no se registran respuestas.',
      );
    }
    const { missionId, missionVersion, requestId, answer } = parsed.data;
    const reservation = await this.deps.repository.reserveAttempt({
      participantId: access.participant.id,
      missionId,
      requestId,
      payloadHash: this.deps.secrets.hash(JSON.stringify({ missionId, missionVersion, answer })),
      maxAttempts: this.policy.maxScoredAttempts,
      pendingTimeoutMs: PENDING_ATTEMPT_TIMEOUT_MS,
      now,
    });
    switch (reservation.status) {
      case 'replay':
        return reservation.outcome;
      case 'conflict':
        return technical('Esta respuesta ya se envió con otro contenido. Vuelve a intentarlo.');
      case 'busy':
        return technical('Tu respuesta anterior aún se está corrigiendo.');
      case 'closed':
        // Oportunidad puntuada cerrada: se corrige como práctica, sin registrar puntos.
        return this.evaluate(missionId, missionVersion, answer);
    }
    const outcome = await this.evaluate(missionId, missionVersion, answer);
    const academic = outcome.kind === 'correct' || outcome.kind === 'incorrect';
    const correct = outcome.kind === 'correct';
    const meta = MISSION_META.get(missionId);
    const completedAt = this.deps.clock.now();
    const score = correct
      ? scoreMission(
          {
            solved: true,
            solvedOnAttempt: reservation.attemptNumber,
            hintsUsed: reservation.hintUsed ? 1 : 0,
            elapsedMs: completedAt - reservation.measuredFrom,
            baseDurationMs: (meta?.baseDurationSeconds ?? 0) * 1000,
          },
          this.policy,
        ).total
      : 0;
    await this.deps.repository.completeAttempt({
      attemptId: reservation.attemptId,
      academic,
      correct,
      score,
      durationMs: Math.max(0, completedAt - reservation.measuredFrom),
      outcome: academic ? (outcome as StoredOutcome) : null,
      now: completedAt,
    });
    if (academic) await this.notify(access.room.id);
    return outcome;
  }

  async hint(
    codeInput: unknown,
    participantToken: unknown,
    missionInput: unknown,
  ): Promise<string> {
    const missionId = missionIdSchema.parse(missionInput);
    const access = await this.participant(codeInput, participantToken);
    if ('ok' in access) throw new Error(access.message);
    const now = this.deps.clock.now();
    if (effectiveStatus(access.room, now) !== 'running') {
      throw new Error('La sala no está en curso.');
    }
    await this.deps.repository.recordHint(access.participant.id, missionId, now);
    await this.notify(access.room.id);
    return this.deps.evaluator.getHint(missionId);
  }

  async explanation(
    codeInput: unknown,
    participantToken: unknown,
    missionInput: unknown,
  ): Promise<string> {
    const missionId = missionIdSchema.parse(missionInput);
    const access = await this.participant(codeInput, participantToken);
    if ('ok' in access) throw new Error(access.message);
    return this.deps.evaluator.getExplanation(missionId);
  }

  private async evaluate(
    missionId: MissionId,
    missionVersion: number,
    answer: unknown,
  ): Promise<EvaluationOutcome> {
    try {
      return await this.deps.evaluator.evaluate({
        missionId,
        missionVersion,
        answer: answer as Parameters<MissionEvaluator['evaluate']>[0]['answer'],
      });
    } catch {
      // Una respuesta con campos malformados no llega a ser un intento académico.
      return { kind: 'invalid-input', message: 'La respuesta no tiene un formato válido.' };
    }
  }

  private async buildPresenterView(roomId: string): Promise<PresenterView | Failure> {
    const data = await this.deps.repository.getRoomData(roomId);
    if (!data) return fail('not-found');
    const now = this.deps.clock.now();
    return presenterViewFrom(data, now);
  }

  private async presenterRoom(codeInput: unknown, token: unknown): Promise<RoomRecord | Failure> {
    const code = roomCodeSchema.safeParse(codeInput);
    if (!code.success || typeof token !== 'string' || token.length === 0) return fail('forbidden');
    const room = await this.deps.repository.findRoomByCode(code.data);
    if (!room) return fail('not-found');
    const allowed = await this.deps.repository.verifyPresenter(
      room.id,
      this.deps.secrets.hash(token),
    );
    return allowed ? room : fail('forbidden');
  }

  private async participant(codeInput: unknown, token: unknown) {
    const code = roomCodeSchema.safeParse(codeInput);
    if (!code.success || typeof token !== 'string' || token.length === 0) return fail('forbidden');
    const room = await this.deps.repository.findRoomByCode(code.data);
    if (!room) return fail('not-found');
    const participant = await this.deps.repository.findParticipant(
      room.id,
      this.deps.secrets.hash(token),
    );
    if (!participant) return fail('forbidden');
    return { room, participant };
  }

  private async expire(room: RoomRecord): Promise<void> {
    const result = await this.deps.repository.transitionRoom({
      roomId: room.id,
      from: ['lobby', 'running'],
      to: 'expired',
      requireParticipants: false,
      now: this.deps.clock.now(),
    });
    if (result.status === 'ok') {
      await this.deps.notifier.notify(room.id, result.room.revision).catch(() => undefined);
    }
  }

  private async notify(roomId: string): Promise<void> {
    const room = await this.deps.repository.findRoomById(roomId);
    if (room) await this.deps.notifier.notify(roomId, room.revision).catch(() => undefined);
  }
}

/** Vista del profesor: ranking completo, progreso por misión y estadísticas del grupo. */
export function presenterViewFrom(data: RoomData, now: number): PresenterView {
  const standings = computeStandings(data, now);
  const progress = computeMissionProgress(data);
  return {
    room: summary(data.room, now),
    participants: rankStandings(standings),
    connected: standings.filter(({ connected }) => connected).length,
    responded: standings.filter(({ attempts }) => attempts > 0).length,
    missions: progress.map((mission) => {
      const meta = MISSION_META.get(mission.missionId);
      return { ...mission, order: meta?.order ?? 0, title: meta?.title ?? mission.missionId };
    }),
    statistics: computeStatistics(standings, progress),
  };
}
