import type { EvaluationOutcome, MissionId } from '@/features/challenge/domain/types';
import type { ParticipantStanding } from '../domain/standings';
import type { ParticipantRecord, RoomData, RoomRecord, RoomStatus } from '../domain/room';

/**
 * Contratos de la sala en vivo. Infraestructura los implementa con Supabase (PostgreSQL)
 * o, solo si se activa expresamente, con memoria del servidor para desarrollo y pruebas.
 * Cada operación que cambia datos es atómica y aumenta la revisión de la sala.
 */

export interface NewRoom {
  readonly code: string;
  readonly presenterTokenHash: string;
  readonly now: number;
  readonly expiresAt: number;
}

export type JoinResult =
  | { readonly status: 'joined'; readonly participant: ParticipantRecord }
  | { readonly status: 'nickname-taken' | 'full' | 'closed' };

export type TransitionResult =
  | { readonly status: 'ok'; readonly room: RoomRecord }
  | { readonly status: 'conflict'; readonly room: RoomRecord }
  | { readonly status: 'empty' };

/** Evaluación ya registrada, devuelta tal cual al repetir el mismo `requestId`. */
export type StoredOutcome = Extract<EvaluationOutcome, { kind: 'correct' | 'incorrect' }>;

export type Reservation =
  | {
      readonly status: 'reserved';
      readonly attemptId: string;
      /** Número de intento académico que tendrá si la evaluación es académica (1 o 2). */
      readonly attemptNumber: number;
      readonly hintUsed: boolean;
      /** Desde cuándo se mide la duración de este intento. */
      readonly measuredFrom: number;
    }
  | { readonly status: 'replay'; readonly outcome: StoredOutcome }
  | { readonly status: 'conflict' | 'busy' | 'closed' };

export interface CompletedAttempt {
  readonly attemptId: string;
  /** `false` para fallos técnicos: la reserva se libera sin consumir intento. */
  readonly academic: boolean;
  readonly correct: boolean;
  readonly score: number;
  readonly durationMs: number;
  readonly outcome: StoredOutcome | null;
  readonly now: number;
}

export interface ClassroomRepository {
  /** `code-taken` si otra sala vigente usa el código. */
  createRoom(input: NewRoom): Promise<RoomRecord | 'code-taken'>;
  findRoomByCode(code: string): Promise<RoomRecord | null>;
  findRoomById(roomId: string): Promise<RoomRecord | null>;
  getRoomData(roomId: string): Promise<RoomData | null>;
  verifyPresenter(roomId: string, presenterTokenHash: string): Promise<boolean>;
  /** Comprueba estado lobby, cupo y alias único en la misma transacción. */
  joinRoom(input: {
    readonly roomId: string;
    readonly nickname: string;
    readonly nicknameKey: string;
    readonly tokenHash: string;
    readonly capacity: number;
    readonly now: number;
  }): Promise<JoinResult>;
  findParticipant(roomId: string, tokenHash: string): Promise<ParticipantRecord | null>;
  touchParticipant(participantId: string, now: number): Promise<void>;
  /** En espera se elimina la inscripción; iniciada, queda marcada como salida. */
  leaveRoom(participantId: string, now: number): Promise<void>;
  transitionRoom(input: {
    readonly roomId: string;
    readonly from: readonly RoomStatus[];
    readonly to: RoomStatus;
    readonly requireParticipants: boolean;
    readonly now: number;
  }): Promise<TransitionResult>;
  /** Serializa por participante: idempotencia, un solo pendiente y máximo de intentos. */
  reserveAttempt(input: {
    readonly participantId: string;
    readonly missionId: MissionId;
    readonly requestId: string;
    readonly payloadHash: string;
    readonly maxAttempts: number;
    /** Una reserva pendiente más antigua se da por fallo técnico y no bloquea. */
    readonly pendingTimeoutMs: number;
    readonly now: number;
  }): Promise<Reservation>;
  completeAttempt(input: CompletedAttempt): Promise<void>;
  /** Registra la primera pista de la misión; repetirla no cambia nada. */
  recordHint(participantId: string, missionId: MissionId, now: number): Promise<void>;
  /** Guarda el resultado final calculado por el dominio al terminar la sala. */
  saveResults(
    roomId: string,
    standings: readonly ParticipantStanding[],
    now: number,
  ): Promise<void>;
}

/** Aviso de cambio: solo transporta sala y revisión, nunca datos privados. */
export interface RoomNotifier {
  notify(roomId: string, revision: number): Promise<void>;
}

/** Acceso del profesor para crear salas; la clave vive solo en el servidor. */
export interface PresenterGate {
  readonly configured: boolean;
  verify(accessCode: string): boolean;
}

export interface ClassroomSecrets {
  /** Token aleatorio de 256 bits en base64url. */
  randomToken(): string;
  /** Huella SHA-256 en hexadecimal. */
  hash(value: string): string;
  randomBytes(size: number): Uint8Array;
}

export interface ClassroomClock {
  now(): number;
}
