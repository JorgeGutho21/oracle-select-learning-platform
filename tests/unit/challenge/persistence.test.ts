// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEvaluation,
  beginEvaluation,
  createChallengeState,
  openMission,
  recordHint,
  type ChallengeState,
} from '@/features/challenge/domain/challenge-state';
import { CHALLENGE_VERSION } from '@/features/challenge/domain/missions/public-catalog';
import { restoreChallengeState } from '@/features/challenge/domain/restore-state';
import { MISSION_IDS } from '@/features/challenge/domain/types';
import {
  BrowserChallengeRepository,
  CHALLENGE_STORAGE_KEY,
  type StorageLike,
} from '@/features/challenge/infrastructure/browser-challenge-repository';

const expectations = {
  challengeVersion: CHALLENGE_VERSION,
  datasetId: 'empleados-select-v1',
  scoringPolicyVersion: 'game-spec-v1',
  missionOrder: [...MISSION_IDS],
};

function played(): ChallengeState {
  let state = createChallengeState({
    sessionId: 's',
    challengeVersion: CHALLENGE_VERSION,
    datasetId: 'empleados-select-v1',
    missionOrder: [...MISSION_IDS],
    now: 0,
  });
  state = openMission(state, 'M01', 0);
  state = recordHint(state, 'M01', 100);
  state = applyEvaluation(
    beginEvaluation(state, 'M01'),
    'M01',
    { type: 'drag-column', columns: ['ID'] },
    { kind: 'incorrect', feedback: 'no' },
    200,
  ).state;
  return { ...state, savedAt: 500 };
}

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

describe('Restauración validada del estado', () => {
  it('restaura una partida válida y congela el cronómetro al último guardado', () => {
    const outcome = restoreChallengeState(roundTrip(played()), expectations);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const mission = outcome.state.missions.M01!;
    expect(mission.attempts).toHaveLength(1);
    expect(mission.hint).toMatchObject({ requestedAt: 100 });
    expect(mission.timer).toEqual({ activeMs: 500, runningSince: null });
  });

  it('libera una evaluación que quedó pendiente al cerrar la pestaña', () => {
    const raw = roundTrip(beginEvaluation(played(), 'M01'));
    const outcome = restoreChallengeState(raw, expectations);
    expect(outcome.ok && outcome.state.missions.M01!.pendingEvaluation).toBe(false);
  });

  it.each([
    ['otra versión de esquema', { schemaVersion: 2 }],
    ['otra versión del Challenge', { challengeVersion: 'select-challenge-v0' }],
    ['otro dataset', { datasetId: 'empleados-select-v2' }],
    ['otra política de puntuación', { scoringPolicyVersion: 'con-bonus' }],
    ['otras misiones', { missionOrder: ['M01'] }],
  ])('marca como incompatible una partida con %s', (_label, patch) => {
    expect(restoreChallengeState({ ...roundTrip(played()), ...patch }, expectations)).toEqual({
      ok: false,
      reason: 'incompatible',
    });
  });

  it.each([
    ['un valor no objeto', null],
    ['un estado desconocido', { status: 'won' }],
    ['una misión ausente', { missions: {} }],
    ['un modo de sala', { mode: 'room' }],
    ['una misión actual inválida', { currentMissionId: 'M99' }],
  ])('marca como corrupta una partida con %s', (_label, patch) => {
    const raw = patch === null ? null : { ...roundTrip(played()), ...patch };
    expect(restoreChallengeState(raw, expectations)).toEqual({ ok: false, reason: 'corrupt' });
  });

  it('rechaza intentos o pistas manipulados', () => {
    const base = roundTrip(played());
    const missions = base.missions as Record<string, Record<string, unknown>>;
    const withBadAttempt = {
      ...base,
      missions: { ...missions, M01: { ...missions.M01, attempts: [{ id: 'x', scored: 'sí' }] } },
    };
    expect(restoreChallengeState(withBadAttempt, expectations)).toEqual({
      ok: false,
      reason: 'corrupt',
    });
    const withBadHint = {
      ...base,
      missions: {
        ...missions,
        M01: { ...missions.M01, hint: { missionId: 'M02', requestedAt: 1, elapsedMs: 1 } },
      },
    };
    expect(restoreChallengeState(withBadHint, expectations)).toEqual({
      ok: false,
      reason: 'corrupt',
    });
    const negativeTimer = {
      ...base,
      missions: {
        ...missions,
        M01: { ...missions.M01, timer: { activeMs: -5, runningSince: null } },
      },
    };
    expect(restoreChallengeState(negativeTimer, expectations)).toEqual({
      ok: false,
      reason: 'corrupt',
    });
  });
});

describe('Repositorio local del navegador', () => {
  const failing = (operation: keyof StorageLike): StorageLike => ({
    getItem: () => {
      if (operation === 'getItem') throw new Error('SecurityError');
      return null;
    },
    setItem: () => {
      if (operation === 'setItem') throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      if (operation === 'removeItem') throw new Error('bloqueado');
    },
  });

  it('guarda, lee y borra bajo su clave versionada', async () => {
    const data = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
    };
    const repository = new BrowserChallengeRepository(() => storage);
    expect(await repository.load()).toEqual({ status: 'empty' });
    expect(await repository.save(played())).toBe(true);
    expect([...data.keys()]).toEqual([CHALLENGE_STORAGE_KEY]);
    expect(await repository.load()).toEqual({ status: 'found', data: roundTrip(played()) });
    expect(await repository.clear()).toBe(true);
    expect(data.size).toBe(0);
  });

  it('informa indisponibilidad sin lanzar si el almacenamiento falla o no existe', async () => {
    expect(await new BrowserChallengeRepository(() => null).load()).toEqual({
      status: 'unavailable',
    });
    expect(await new BrowserChallengeRepository(() => null).save(played())).toBe(false);
    expect(await new BrowserChallengeRepository(() => null).clear()).toBe(false);
    expect(await new BrowserChallengeRepository(() => failing('getItem')).load()).toEqual({
      status: 'unavailable',
    });
    expect(await new BrowserChallengeRepository(() => failing('setItem')).save(played())).toBe(
      false,
    );
    expect(await new BrowserChallengeRepository(() => failing('removeItem')).clear()).toBe(false);
  });

  it('distingue contenido ilegible de ausencia de datos', async () => {
    const storage: StorageLike = {
      getItem: () => '{roto',
      setItem: () => {},
      removeItem: () => {},
    };
    expect(await new BrowserChallengeRepository(() => storage).load()).toEqual({
      status: 'unreadable',
    });
  });
});

describe('Aislamiento de rúbricas y almacenamiento (G15, ARCHITECTURE)', () => {
  const root = path.resolve('src');
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
  const sources = files(root).filter((file) => /\.(ts|tsx)$/.test(file));

  it('solo infraestructura importa las rúbricas o las definiciones completas', () => {
    const importers = sources.filter((file) =>
      /missions\/(rubrics|definitions)['"]/.test(readFileSync(file, 'utf8')),
    );
    const allowed = importers.every((file) => {
      const relative = path.relative(root, file).replaceAll('\\', '/');
      return (
        relative.startsWith('features/challenge/infrastructure/') ||
        relative.startsWith('features/challenge/domain/missions/')
      );
    });
    expect(importers.length).toBeGreaterThan(0);
    expect(allowed).toBe(true);
  });

  it('solo infraestructura accede a localStorage', () => {
    const users = sources
      .filter((file) => /localStorage/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(root, file).replaceAll('\\', '/'));
    expect(users.every((file) => file.includes('/infrastructure/'))).toBe(true);
  });

  it('los registros del dataset solo se definen en su módulo de dominio', () => {
    const owners = sources
      .filter((file) => /3700000/.test(readFileSync(file, 'utf8')))
      .map((file) => path.relative(root, file).replaceAll('\\', '/'));
    expect(owners).toEqual(['domain/dataset/empleados.ts']);
  });
});
