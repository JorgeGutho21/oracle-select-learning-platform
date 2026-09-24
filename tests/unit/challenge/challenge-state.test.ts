// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { computeChallengeResult } from '@/features/challenge/domain/challenge-result';
import {
  applyEvaluation,
  beginEvaluation,
  canRequestHint,
  ChallengeRuleError,
  createChallengeState,
  elapsedMs,
  finishChallenge,
  getMission,
  nextOpenMission,
  openMission,
  pauseCurrent,
  recordHint,
  resumeCurrent,
  skipMission,
  type ChallengeState,
} from '@/features/challenge/domain/challenge-state';
import {
  CHALLENGE_VERSION,
  PUBLIC_MISSIONS,
} from '@/features/challenge/domain/missions/public-catalog';
import {
  MISSION_IDS,
  type EvaluationOutcome,
  type MissionAnswer,
  type MissionId,
} from '@/features/challenge/domain/types';

const answer: MissionAnswer = { type: 'drag-column', columns: ['NOMBRE'] };
const ok: EvaluationOutcome = { kind: 'correct', feedback: 'bien' };
const wrong: EvaluationOutcome = { kind: 'incorrect', feedback: 'no' };
const technical: EvaluationOutcome = {
  kind: 'technical',
  reason: 'service-unavailable',
  message: 'caído',
};
const empty: EvaluationOutcome = { kind: 'invalid-input', message: 'vacía' };

function fresh(now = 1000): ChallengeState {
  return createChallengeState({
    sessionId: 's1',
    challengeVersion: CHALLENGE_VERSION,
    datasetId: 'empleados-select-v1',
    missionOrder: [...MISSION_IDS],
    now,
  });
}

function respond(state: ChallengeState, id: MissionId, outcome: EvaluationOutcome, now: number) {
  return applyEvaluation(beginEvaluation(state, id), id, answer, outcome, now);
}

const result = (state: ChallengeState, now: number) =>
  computeChallengeResult(state, PUBLIC_MISSIONS, now);
const score = (state: ChallengeState, id: MissionId, now = 99_999) =>
  result(state, now).missions.find((mission) => mission.missionId === id)!.score.total;

describe('Transiciones de la partida', () => {
  it('crea diez misiones sin iniciar y sin misión actual', () => {
    const state = fresh();
    expect(state.missionOrder).toEqual([...MISSION_IDS]);
    expect(state.currentMissionId).toBeNull();
    expect(MISSION_IDS.every((id) => getMission(state, id).status === 'not-started')).toBe(true);
    expect(state.mode).toBe('practice');
  });

  it('abrir una misión la inicia y arranca su cronómetro', () => {
    const state = openMission(fresh(), 'M01', 2000);
    expect(getMission(state, 'M01')).toMatchObject({ status: 'in-progress', openedAt: 2000 });
    expect(elapsedMs(getMission(state, 'M01').timer, 5000)).toBe(3000);
  });

  it('cambiar de misión pausa el cronómetro anterior y conserva sus intentos (U05)', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = respond(state, 'M01', wrong, 4000).state;
    state = openMission(state, 'M02', 5000);
    expect(getMission(state, 'M01').timer).toEqual({ activeMs: 5000, runningSince: null });
    state = openMission(state, 'M01', 9000);
    expect(getMission(state, 'M01').attempts).toHaveLength(1);
    expect(elapsedMs(getMission(state, 'M01').timer, 10_000)).toBe(6000);
  });

  it('pausar y reanudar excluye el tiempo en pausa', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = pauseCurrent(state, 1000);
    state = resumeCurrent(state, 61_000);
    expect(elapsedMs(getMission(state, 'M01').timer, 62_000)).toBe(2000);
    expect(pauseCurrent(pauseCurrent(state, 63_000), 70_000)).toEqual(pauseCurrent(state, 63_000));
  });

  it('el primer acierto cierra la misión con 100 y detiene el cronómetro', () => {
    let state = openMission(fresh(), 'M01', 0);
    const applied = respond(state, 'M01', ok, 7000);
    state = applied.state;
    expect(applied.attempt).toMatchObject({
      number: 1,
      scored: true,
      correct: true,
      elapsedMs: 7000,
    });
    expect(getMission(state, 'M01')).toMatchObject({ status: 'solved', closedAt: 7000 });
    expect(getMission(state, 'M01').timer.runningSince).toBeNull();
    expect(score(state, 'M01')).toBe(100);
  });

  it('dos errores cierran con cero y los ensayos posteriores no puntúan', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = respond(state, 'M01', wrong, 1000).state;
    state = respond(state, 'M01', wrong, 2000).state;
    expect(getMission(state, 'M01').status).toBe('failed');
    const practice = respond(state, 'M01', ok, 3000);
    expect(practice.attempt).toMatchObject({ scored: false, correct: true });
    expect(getMission(practice.state, 'M01').status).toBe('failed');
    expect(score(practice.state, 'M01')).toBe(0);
  });

  it('G12: una respuesta correcta no se reemplaza para ganar otro premio', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = respond(state, 'M01', ok, 1000).state;
    state = respond(state, 'M01', ok, 2000).state;
    state = respond(state, 'M01', wrong, 3000).state;
    expect(getMission(state, 'M01').status).toBe('solved');
    expect(score(state, 'M01')).toBe(100);
  });

  it('errores técnicos y respuestas vacías no consumen intento', () => {
    let state = openMission(fresh(), 'M01', 0);
    for (const outcome of [technical, empty, technical]) {
      const applied = respond(state, 'M01', outcome, 1000);
      expect(applied.attempt).toBeNull();
      state = applied.state;
    }
    expect(getMission(state, 'M01')).toMatchObject({ attempts: [], pendingEvaluation: false });
    state = respond(state, 'M01', wrong, 2000).state;
    state = respond(state, 'M01', ok, 3000).state;
    expect(score(state, 'M01')).toBe(80);
  });

  it('solo admite una evaluación pendiente y exige una en curso para aplicarla', () => {
    const state = beginEvaluation(openMission(fresh(), 'M01', 0), 'M01');
    expect(() => beginEvaluation(state, 'M01')).toThrow(ChallengeRuleError);
    expect(() => openMission(state, 'M02', 10)).toThrow(/corrección/);
    expect(() => applyEvaluation(openMission(fresh(), 'M01', 0), 'M01', answer, ok, 5)).toThrow(
      ChallengeRuleError,
    );
    expect(() => beginEvaluation(fresh(), 'M01')).toThrow(ChallengeRuleError);
  });

  it('la pista descuenta una vez, se entrega de nuevo sin duplicar y se bloquea en espera o tras cerrar', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = recordHint(state, 'M01', 1000);
    const again = recordHint(state, 'M01', 2000);
    expect(again).toBe(state);
    expect(getMission(state, 'M01').hint).toEqual({
      missionId: 'M01',
      requestedAt: 1000,
      elapsedMs: 1000,
    });
    expect(canRequestHint(beginEvaluation(state, 'M01'), 'M01')).toBe(false);
    expect(() => recordHint(beginEvaluation(state, 'M01'), 'M01', 3000)).toThrow(
      ChallengeRuleError,
    );
    state = respond(state, 'M01', ok, 4000).state;
    expect(canRequestHint(state, 'M01')).toBe(false);
    expect(score(state, 'M01')).toBe(80);
  });

  it('acierto al segundo intento con pista da 60', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = recordHint(state, 'M01', 10);
    state = respond(state, 'M01', wrong, 20).state;
    state = respond(state, 'M01', ok, 30).state;
    expect(score(state, 'M01')).toBe(60);
  });

  it('omitir cierra con cero, queda pendiente de repaso y no se puede omitir dos veces', () => {
    let state = openMission(fresh(), 'M03', 0);
    state = skipMission(state, 'M03', 500);
    expect(getMission(state, 'M03')).toMatchObject({ status: 'skipped', closedAt: 500 });
    expect(() => skipMission(state, 'M03', 600)).toThrow(ChallengeRuleError);
    const summary = result(state, 600);
    expect(summary.missions.find((mission) => mission.missionId === 'M03')).toMatchObject({
      needsReview: true,
    });
    expect(summary.reviewLessons).toContain('L03');
  });

  it('nextOpenMission recorre en orden circular y omite las cerradas', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = respond(state, 'M01', ok, 1).state;
    state = skipMission(state, 'M02', 2);
    expect(nextOpenMission(state, 'M01')).toBe('M03');
    expect(nextOpenMission(state, 'M10')).toBe('M03');
    expect(nextOpenMission(state, null)).toBe('M03');
    for (const id of MISSION_IDS.slice(2)) state = skipMission(state, id, 3);
    expect(nextOpenMission(state, 'M01')).toBeNull();
  });

  it('terminar cierra las misiones abiertas y bloquea nuevas acciones', () => {
    let state = openMission(fresh(), 'M01', 0);
    state = respond(state, 'M01', ok, 1000).state;
    state = openMission(state, 'M02', 1000);
    state = finishChallenge(state, 5000);
    expect(state).toMatchObject({ status: 'finished', finishedAt: 5000 });
    expect(MISSION_IDS.slice(1).every((id) => getMission(state, id).status === 'skipped')).toBe(
      true,
    );
    expect(getMission(state, 'M02').timer).toEqual({ activeMs: 4000, runningSince: null });
    expect(() => openMission(state, 'M03', 6000)).toThrow(/terminó/);
    expect(() => beginEvaluation(state, 'M01')).toThrow(ChallengeRuleError);
    expect(finishChallenge(state, 9000)).toBe(state);
    expect(() =>
      finishChallenge(beginEvaluation(openMission(fresh(), 'M01', 0), 'M01'), 1),
    ).toThrow(ChallengeRuleError);
  });

  it('las transiciones no mutan el estado recibido', () => {
    const state = openMission(fresh(), 'M01', 0);
    const snapshot = JSON.stringify(state);
    respond(state, 'M01', ok, 10);
    recordHint(state, 'M01', 10);
    skipMission(state, 'M01', 10);
    finishChallenge(state, 10);
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('rechaza misiones ajenas a la partida', () => {
    expect(() => getMission(fresh(), 'M11' as MissionId)).toThrow(ChallengeRuleError);
  });
});

describe('Resultado de la partida', () => {
  it('sin actividad muestra cero, precisión «Sin datos» y progreso nulo', () => {
    const summary = result(fresh(), 0);
    expect(summary).toMatchObject({
      label: 'Práctica',
      totalScore: 0,
      maxScore: 1000,
      solvedCount: 0,
      missionCount: 10,
      accuracy: null,
      progress: { closed: 0, total: 10, ratio: 0 },
      hintsUsed: 0,
    });
  });

  it('G12: diez aciertos iniciales dan 1000, precisión 1 y progreso completo', () => {
    let state = fresh(0);
    let now = 0;
    for (const id of MISSION_IDS) {
      state = openMission(state, id, now);
      now += 1000;
      state = respond(state, id, ok, now).state;
    }
    state = finishChallenge(state, now);
    const summary = result(state, now);
    expect(summary).toMatchObject({
      totalScore: 1000,
      solvedCount: 10,
      accuracy: 1,
      totalTimeMs: 10_000,
    });
    expect(summary.progress.ratio).toBe(1);
    expect(summary.reviewLessons).toEqual([]);
  });

  it('combina aciertos, fallos, pistas y omisiones con desglose por misión', () => {
    let state = openMission(fresh(0), 'M01', 0);
    state = respond(state, 'M01', ok, 1000).state; // 100
    state = openMission(state, 'M02', 1000);
    state = recordHint(state, 'M02', 1500);
    state = respond(state, 'M02', wrong, 2000).state;
    state = respond(state, 'M02', ok, 3000).state; // 60
    state = openMission(state, 'M03', 3000);
    state = respond(state, 'M03', wrong, 4000).state;
    state = respond(state, 'M03', wrong, 5000).state; // 0
    state = finishChallenge(state, 6000);
    const summary = result(state, 6000);
    expect(summary.totalScore).toBe(160);
    expect(summary.solvedCount).toBe(2);
    expect(summary.accuracy).toBeCloseTo(2 / 5);
    expect(summary.hintsUsed).toBe(1);
    expect(summary.missions[1]!.score).toMatchObject({
      attemptPenalty: 20,
      hintPenalty: 20,
      total: 60,
    });
    expect(summary.missions[1]!.timeMs).toBe(2000);
    // M03 fallida y M04–M10 omitidas; M10 abarca L01–L08. Sin duplicados y ordenadas.
    expect(summary.reviewLessons).toEqual(['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08']);
  });
});
