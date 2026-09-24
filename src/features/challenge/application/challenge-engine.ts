import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { computeChallengeResult, type ChallengeResult } from '../domain/challenge-result';
import {
  applyEvaluation,
  beginEvaluation,
  canRequestHint,
  ChallengeRuleError,
  createChallengeState,
  finishChallenge,
  getMission,
  isClosed,
  markSaved,
  nextOpenMission,
  openMission,
  pauseCurrent,
  recordHint,
  resumeCurrent,
  skipMission,
  type Attempt,
  type ChallengeState,
  type MissionState,
} from '../domain/challenge-state';
import { CHALLENGE_VERSION, PUBLIC_MISSIONS } from '../domain/missions/public-catalog';
import { restoreChallengeState } from '../domain/restore-state';
import { GAME_SPEC_SCORING_POLICY, type ScoringPolicy } from '../domain/scoring';
import type {
  AnyPublicMission,
  EvaluationOutcome,
  MissionAnswer,
  MissionId,
} from '../domain/types';
import type { ChallengeRepository, Clock, IdGenerator, MissionEvaluator } from './ports';

/**
 * Motor de la práctica individual del Challenge. Orquesta reglas de dominio, corrección,
 * reloj y persistencia mediante puertos; no conoce React, almacenamiento ni rúbricas.
 */

export interface ChallengeEngineDeps {
  readonly evaluator: MissionEvaluator;
  readonly repository: ChallengeRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly missions?: readonly AnyPublicMission[];
  readonly policy?: ScoringPolicy;
}

export type PersistenceStatus = 'not-saved' | 'saved' | 'unavailable';
export type RestoreStatus = 'restored' | 'empty' | 'discarded' | 'unavailable';

export interface SubmitResult {
  readonly outcome: EvaluationOutcome;
  readonly attempt: Attempt | null;
  readonly mission: MissionState;
  /** Verdadero cuando esta respuesta cerró la oportunidad puntuada. */
  readonly closedNow: boolean;
}

export type HintResult =
  | { readonly status: 'delivered'; readonly hint: string; readonly penaltyApplied: boolean }
  | { readonly status: 'unavailable'; readonly message: string };

const TECHNICAL_FAILURE: EvaluationOutcome = {
  kind: 'technical',
  reason: 'service-unavailable',
  message: 'No se pudo corregir la respuesta. No se consumió ningún intento.',
};

export class ChallengeEngine {
  readonly missions: readonly AnyPublicMission[];
  private readonly policy: ScoringPolicy;
  private state: ChallengeState | null = null;
  private persistence: PersistenceStatus = 'not-saved';
  private readonly listeners = new Set<() => void>();

  constructor(private readonly deps: ChallengeEngineDeps) {
    this.missions = deps.missions ?? PUBLIC_MISSIONS;
    this.policy = deps.policy ?? GAME_SPEC_SCORING_POLICY;
  }

  /* ---------- Lectura ---------- */

  getState(): ChallengeState | null {
    return this.state;
  }

  getPersistenceStatus(): PersistenceStatus {
    return this.persistence;
  }

  getResult(): ChallengeResult | null {
    return this.state
      ? computeChallengeResult(this.state, this.missions, this.deps.clock.now(), this.policy)
      : null;
  }

  getMission(id: MissionId): AnyPublicMission {
    const mission = this.missions.find((item) => item.id === id);
    if (!mission) throw new ChallengeRuleError('unknown-mission', `Misión desconocida: ${id}`);
    return mission;
  }

  /** Compatible con `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /* ---------- Ciclo de partida ---------- */

  async start(): Promise<ChallengeState> {
    const now = this.deps.clock.now();
    const created = createChallengeState({
      sessionId: this.deps.ids.next(),
      challengeVersion: CHALLENGE_VERSION,
      datasetId: EMPLEADOS_DATASET.id,
      missionOrder: this.orderedIds(),
      now,
      policy: this.policy,
    });
    const first = created.missionOrder[0];
    return this.commit(first ? openMission(created, first, now) : created);
  }

  async restore(): Promise<RestoreStatus> {
    const stored = await this.deps.repository.load();
    if (stored.status === 'empty') return 'empty';
    if (stored.status === 'unavailable') {
      this.persistence = 'unavailable';
      return 'unavailable';
    }
    if (stored.status === 'unreadable') return 'discarded';
    const restored = restoreChallengeState(stored.data, {
      challengeVersion: CHALLENGE_VERSION,
      datasetId: EMPLEADOS_DATASET.id,
      scoringPolicyVersion: this.policy.version,
      missionOrder: this.orderedIds(),
    });
    if (!restored.ok) return 'discarded';
    this.state = restored.state;
    this.persistence = 'saved';
    this.notify();
    return 'restored';
  }

  /** Nueva partida desde cero; descarta la práctica guardada. */
  async reset(): Promise<ChallengeState> {
    await this.deps.repository.clear();
    this.state = null;
    return this.start();
  }

  async finish(): Promise<ChallengeResult> {
    const state = this.requireState();
    await this.commit(finishChallenge(state, this.deps.clock.now()));
    return this.getResult() as ChallengeResult;
  }

  /* ---------- Navegación y tiempo ---------- */

  async openMission(id: MissionId): Promise<ChallengeState> {
    return this.commit(openMission(this.requireState(), id, this.deps.clock.now()));
  }

  /** Abre la siguiente misión no cerrada; `null` si todas están cerradas. */
  async advance(): Promise<MissionId | null> {
    const state = this.requireState();
    const next = nextOpenMission(state, state.currentMissionId);
    if (next === null) {
      await this.commit(pauseCurrent(state, this.deps.clock.now()));
      return null;
    }
    await this.openMission(next);
    return next;
  }

  async skip(): Promise<ChallengeState> {
    const state = this.requireState();
    return this.commit(skipMission(state, this.requireCurrent(state), this.deps.clock.now()));
  }

  /** Para salir u ocultar la pestaña; guarda el tiempo acumulado. */
  async pause(): Promise<void> {
    if (this.state) await this.commit(pauseCurrent(this.state, this.deps.clock.now()));
  }

  async resume(): Promise<void> {
    if (this.state) await this.commit(resumeCurrent(this.state, this.deps.clock.now()));
  }

  /* ---------- Respuestas y pistas ---------- */

  async submit(answer: MissionAnswer): Promise<SubmitResult> {
    const initial = this.requireState();
    const id = this.requireCurrent(initial);
    const mission = this.getMission(id);
    const wasClosed = isClosed(getMission(initial, id));
    this.state = beginEvaluation(initial, id);
    this.notify();

    let outcome: EvaluationOutcome;
    try {
      outcome = await this.deps.evaluator.evaluate({
        missionId: id,
        missionVersion: mission.version,
        answer,
      });
    } catch {
      outcome = TECHNICAL_FAILURE;
    }

    const current = this.state;
    if (
      !current ||
      current.sessionId !== initial.sessionId ||
      !getMission(current, id).pendingEvaluation
    ) {
      // La partida se reinició durante la corrección: la respuesta ya no pertenece a ella.
      return {
        outcome: TECHNICAL_FAILURE,
        attempt: null,
        mission: getMission(initial, id),
        closedNow: false,
      };
    }
    const applied = applyEvaluation(
      current,
      id,
      answer,
      outcome,
      this.deps.clock.now(),
      this.policy,
    );
    await this.commit(applied.state);
    const updated = getMission(applied.state, id);
    return {
      outcome,
      attempt: applied.attempt,
      mission: updated,
      closedNow: !wasClosed && isClosed(updated),
    };
  }

  async requestHint(): Promise<HintResult> {
    const state = this.requireState();
    const id = this.requireCurrent(state);
    if (!canRequestHint(state, id, this.policy)) {
      return { status: 'unavailable', message: 'La pista no está disponible en este momento.' };
    }
    let hint: string;
    try {
      hint = await this.deps.evaluator.getHint(id);
    } catch {
      return {
        status: 'unavailable',
        message: 'No se pudo obtener la pista. No se aplicó ningún descuento.',
      };
    }
    const latest = this.requireState();
    if (!canRequestHint(latest, id, this.policy)) {
      return { status: 'unavailable', message: 'La pista no está disponible en este momento.' };
    }
    const penaltyApplied = getMission(latest, id).hint === null;
    await this.commit(recordHint(latest, id, this.deps.clock.now(), this.policy));
    return { status: 'delivered', hint, penaltyApplied };
  }

  /** La explicación completa solo se entrega con la oportunidad puntuada cerrada (G15). */
  async getExplanation(id: MissionId): Promise<string> {
    const mission = getMission(this.requireState(), id);
    if (!isClosed(mission)) {
      throw new ChallengeRuleError(
        'explanation-locked',
        'La explicación se muestra al cerrar la misión.',
      );
    }
    return this.deps.evaluator.getExplanation(id);
  }

  /* ---------- Internos ---------- */

  private orderedIds(): MissionId[] {
    return [...this.missions]
      .sort((left, right) => left.order - right.order)
      .map((mission) => mission.id);
  }

  private requireState(): ChallengeState {
    if (!this.state)
      throw new ChallengeRuleError('no-active-challenge', 'No hay una partida iniciada.');
    return this.state;
  }

  private requireCurrent(state: ChallengeState): MissionId {
    if (state.currentMissionId === null) {
      throw new ChallengeRuleError('no-active-challenge', 'No hay una misión abierta.');
    }
    return state.currentMissionId;
  }

  private async commit(next: ChallengeState): Promise<ChallengeState> {
    const saved = markSaved(next, this.deps.clock.now());
    this.state = saved;
    this.notify();
    const ok = await this.deps.repository.save(saved).catch(() => false);
    this.persistence = ok ? 'saved' : 'unavailable';
    this.notify();
    return saved;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
