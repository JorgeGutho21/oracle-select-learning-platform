import type { ChallengeState } from '../domain/challenge-state';
import type { EvaluationOutcome, MissionAnswer, MissionId } from '../domain/types';

/**
 * Contratos que infraestructura implementa. «Corregir práctica individual» de
 * ARCHITECTURE.md: rúbrica, pista y explicación viven detrás de `MissionEvaluator`.
 */

export interface EvaluationRequest {
  readonly missionId: MissionId;
  readonly missionVersion: number;
  readonly answer: MissionAnswer;
}

export interface MissionEvaluator {
  evaluate(request: EvaluationRequest): Promise<EvaluationOutcome>;
  getHint(missionId: MissionId): Promise<string>;
  /** Solo se solicita cuando la oportunidad puntuada de la misión está cerrada (G15). */
  getExplanation(missionId: MissionId): Promise<string>;
}

/** Resultado de lectura sin interpretar: la validación del contenido es del dominio. */
export type StoredChallenge =
  | { readonly status: 'found'; readonly data: unknown }
  | { readonly status: 'empty' }
  | { readonly status: 'unreadable' }
  | { readonly status: 'unavailable' };

export interface ChallengeRepository {
  load(): Promise<StoredChallenge>;
  /** Devuelve `false` si el almacenamiento no está disponible; la partida sigue en memoria. */
  save(state: ChallengeState): Promise<boolean>;
  clear(): Promise<boolean>;
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  next(): string;
}
