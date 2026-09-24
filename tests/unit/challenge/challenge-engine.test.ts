// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { ChallengeEngine } from '@/features/challenge/application/challenge-engine';
import type { MissionEvaluator } from '@/features/challenge/application/ports';
import { getMission } from '@/features/challenge/domain/challenge-state';
import {
  BrowserChallengeRepository,
  type StorageLike,
} from '@/features/challenge/infrastructure/browser-challenge-repository';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import type { MissionAnswer } from '@/features/challenge/domain/types';

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function setup(options: { storage?: StorageLike | null; evaluator?: MissionEvaluator } = {}) {
  const storage = options.storage === undefined ? new MemoryStorage() : options.storage;
  const clock = {
    time: 1_000,
    now() {
      return this.time;
    },
  };
  let counter = 0;
  const create = () =>
    new ChallengeEngine({
      evaluator: options.evaluator ?? new InProcessMissionEvaluator(),
      repository: new BrowserChallengeRepository(() => storage),
      clock,
      ids: { next: () => `session-${++counter}` },
    });
  return { engine: create(), create, clock, storage };
}

const M01_OK: MissionAnswer = { type: 'drag-column', columns: ['NOMBRE', 'SALARIO'] };
const M01_WRONG: MissionAnswer = { type: 'drag-column', columns: ['SALARIO', 'NOMBRE'] };

describe('Motor de partida individual', () => {
  it('iniciar crea una sesión, abre M01 y la guarda localmente', async () => {
    const { engine, storage } = setup();
    const state = await engine.start();
    expect(state).toMatchObject({
      sessionId: 'session-1',
      currentMissionId: 'M01',
      status: 'in-progress',
    });
    expect(engine.getPersistenceStatus()).toBe('saved');
    expect((storage as MemoryStorage).data.size).toBe(1);
  });

  it('responder registra intentos, cierra al acertar y avanza a la siguiente misión', async () => {
    const { engine, clock } = setup();
    await engine.start();
    clock.time += 5_000;
    const first = await engine.submit(M01_WRONG);
    expect(first).toMatchObject({ outcome: { kind: 'incorrect' }, closedNow: false });
    expect(first.attempt).toMatchObject({ number: 1, scored: true, elapsedMs: 5_000 });
    const second = await engine.submit(M01_OK);
    expect(second).toMatchObject({ outcome: { kind: 'correct' }, closedNow: true });
    expect(second.mission.status).toBe('solved');
    expect(await engine.advance()).toBe('M02');
    expect(engine.getResult()?.totalScore).toBe(80);
  });

  it('entrega la pista una vez con descuento y la repite sin descontar', async () => {
    const { engine } = setup();
    await engine.start();
    const hint = await engine.requestHint();
    expect(hint).toMatchObject({ status: 'delivered', penaltyApplied: true });
    expect(await engine.requestHint()).toMatchObject({
      status: 'delivered',
      penaltyApplied: false,
    });
    await engine.submit(M01_OK);
    expect(engine.getResult()?.totalScore).toBe(80);
    expect(await engine.requestHint()).toMatchObject({ status: 'unavailable' });
  });

  it('un fallo del servicio de pistas no aplica descuento', async () => {
    const base = new InProcessMissionEvaluator();
    const evaluator: MissionEvaluator = {
      evaluate: (request) => base.evaluate(request),
      getHint: vi.fn().mockRejectedValue(new Error('red')),
      getExplanation: (id) => base.getExplanation(id),
    };
    const { engine } = setup({ evaluator });
    await engine.start();
    expect(await engine.requestHint()).toMatchObject({ status: 'unavailable' });
    expect(getMission(engine.getState()!, 'M01').hint).toBeNull();
  });

  it('un fallo del evaluador es técnico y no consume intento', async () => {
    const evaluator: MissionEvaluator = {
      evaluate: vi.fn().mockRejectedValue(new Error('caída')),
      getHint: async () => '',
      getExplanation: async () => '',
    };
    const { engine } = setup({ evaluator });
    await engine.start();
    const result = await engine.submit(M01_OK);
    expect(result).toMatchObject({ outcome: { kind: 'technical' }, attempt: null });
    expect(getMission(engine.getState()!, 'M01')).toMatchObject({
      attempts: [],
      pendingEvaluation: false,
    });
  });

  it('rechaza un segundo envío mientras el primero se corrige', async () => {
    let release: () => void = () => {};
    const base = new InProcessMissionEvaluator();
    const evaluator: MissionEvaluator = {
      evaluate: (request) =>
        new Promise((resolve) => {
          release = () => resolve(base.evaluate(request));
        }),
      getHint: (id) => base.getHint(id),
      getExplanation: (id) => base.getExplanation(id),
    };
    const { engine } = setup({ evaluator });
    await engine.start();
    const pending = engine.submit(M01_WRONG);
    await expect(engine.submit(M01_OK)).rejects.toMatchObject({ code: 'evaluation-pending' });
    expect(await engine.requestHint()).toMatchObject({ status: 'unavailable' });
    release();
    await pending;
    expect(getMission(engine.getState()!, 'M01').attempts).toHaveLength(1);
  });

  it('descarta una corrección que llega después de reiniciar la partida', async () => {
    let release: () => void = () => {};
    const base = new InProcessMissionEvaluator();
    const evaluator: MissionEvaluator = {
      evaluate: (request) =>
        new Promise((resolve) => {
          release = () => resolve(base.evaluate(request));
        }),
      getHint: (id) => base.getHint(id),
      getExplanation: (id) => base.getExplanation(id),
    };
    const { engine } = setup({ evaluator });
    await engine.start();
    const pending = engine.submit(M01_OK);
    await engine.reset();
    release();
    expect(await pending).toMatchObject({ attempt: null, outcome: { kind: 'technical' } });
    expect(engine.getState()?.sessionId).toBe('session-2');
    expect(getMission(engine.getState()!, 'M01').attempts).toHaveLength(0);
  });

  it('la explicación solo se entrega con la misión cerrada (G15)', async () => {
    const { engine } = setup();
    await engine.start();
    await expect(engine.getExplanation('M01')).rejects.toMatchObject({
      code: 'explanation-locked',
    });
    await engine.skip();
    await expect(engine.getExplanation('M01')).resolves.toContain('SELECT nombre, salario');
  });

  it('M10 sin Oracle informa indisponibilidad sin consumir intento', async () => {
    const { engine } = setup();
    await engine.start();
    await engine.openMission('M10');
    const result = await engine.submit({
      type: 'write-query',
      sql: 'SELECT nombre FROM empleados',
    });
    expect(result.outcome).toMatchObject({ kind: 'technical', reason: 'oracle-unavailable' });
    expect(result.mission.attempts).toHaveLength(0);
  });

  it('restaura la partida tras recargar con cronómetro en pausa y sin puntos extra (U07)', async () => {
    const { engine, create, clock } = setup();
    await engine.start();
    await engine.submit(M01_OK);
    await engine.advance();
    clock.time += 3_000;
    await engine.pause();
    clock.time += 60_000;

    const reloaded = create();
    expect(await reloaded.restore()).toBe('restored');
    const state = reloaded.getState()!;
    expect(state.currentMissionId).toBe('M02');
    expect(getMission(state, 'M02').timer).toEqual({ activeMs: 3_000, runningSince: null });
    expect(reloaded.getResult()?.totalScore).toBe(100);
    await reloaded.resume();
    clock.time += 1_000;
    expect(reloaded.getResult()?.missions[1]?.timeMs).toBe(4_000);
  });

  it('reiniciar comienza en cero con una sesión nueva', async () => {
    const { engine } = setup();
    await engine.start();
    await engine.submit(M01_OK);
    const state = await engine.reset();
    expect(state.sessionId).toBe('session-2');
    expect(engine.getResult()?.totalScore).toBe(0);
  });

  it('terminar devuelve el resultado rotulado como práctica', async () => {
    const { engine } = setup();
    await engine.start();
    await engine.submit(M01_OK);
    const result = await engine.finish();
    expect(result).toMatchObject({
      label: 'Práctica',
      status: 'finished',
      totalScore: 100,
      solvedCount: 1,
    });
    expect(result.progress).toEqual({ closed: 10, total: 10, ratio: 1 });
    await expect(engine.submit(M01_OK)).rejects.toMatchObject({ code: 'challenge-finished' });
  });

  it('sin almacenamiento la partida sigue en memoria y lo informa', async () => {
    const { engine } = setup({ storage: null });
    expect(await engine.restore()).toBe('unavailable');
    await engine.start();
    expect(engine.getPersistenceStatus()).toBe('unavailable');
    expect((await engine.submit(M01_OK)).outcome.kind).toBe('correct');
  });

  it('descarta partidas guardadas corruptas o de otra versión', async () => {
    const storage = new MemoryStorage();
    const { create } = setup({ storage });
    storage.setItem('sql-select-lab:challenge:practice', '{no es json');
    expect(await create().restore()).toBe('discarded');
    storage.setItem('sql-select-lab:challenge:practice', JSON.stringify({ schemaVersion: 99 }));
    expect(await create().restore()).toBe('discarded');
    storage.removeItem('sql-select-lab:challenge:practice');
    expect(await create().restore()).toBe('empty');
  });

  it('exige una partida iniciada y notifica a los suscriptores', async () => {
    const { engine } = setup();
    await expect(engine.submit(M01_OK)).rejects.toMatchObject({ code: 'no-active-challenge' });
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    await engine.start();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    await engine.pause();
    expect(listener).not.toHaveBeenCalled();
  });

  it('advance devuelve null cuando todas las misiones están cerradas', async () => {
    const { engine } = setup();
    await engine.start();
    for (let index = 0; index < 10; index++) {
      await engine.skip();
      await engine.advance();
    }
    expect(await engine.advance()).toBeNull();
  });
});
