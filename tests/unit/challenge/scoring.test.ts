// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  accuracy,
  attemptPenalty,
  baseScore,
  GAME_SPEC_SCORING_POLICY,
  hintPenalty,
  progress,
  scoreMission,
  timeBonus,
  type ScoringPolicy,
} from '@/features/challenge/domain/scoring';

const solved = (solvedOnAttempt: number, hintsUsed: number, elapsedMs = 10_000) =>
  scoreMission({ solved: true, solvedOnAttempt, hintsUsed, elapsedMs, baseDurationMs: 60_000 });

describe('Puntuación normativa de GAME_SPEC (G11)', () => {
  it.each([
    [1, 0, 100],
    [2, 0, 80],
    [1, 1, 80],
    [2, 1, 60],
  ])('acierto en intento %i con %i pistas da %i puntos', (attempt, hints, expected) => {
    expect(solved(attempt, hints).total).toBe(expected);
  });

  it('sin acierto da cero con desglose vacío', () => {
    expect(
      scoreMission({
        solved: false,
        solvedOnAttempt: null,
        hintsUsed: 1,
        elapsedMs: 0,
        baseDurationMs: 45_000,
      }),
    ).toEqual({ base: 0, attemptPenalty: 0, hintPenalty: 0, timeBonus: 0, total: 0, max: 100 });
  });

  it('desglosa base, penalizaciones y bonificación', () => {
    expect(solved(2, 1)).toEqual({
      base: 100,
      attemptPenalty: 20,
      hintPenalty: 20,
      timeBonus: 0,
      total: 60,
      max: 100,
    });
  });

  it('no concede bonificación por rapidez con la política normativa', () => {
    expect(GAME_SPEC_SCORING_POLICY.maxTimeBonus).toBe(0);
    expect(timeBonus(0, 45_000)).toBe(0);
    expect(solved(1, 0, 1).total).toBe(100);
  });

  it('G12: diez aciertos iniciales suman exactamente 1000', () => {
    const total = Array.from({ length: 10 }, () => solved(1, 0).total).reduce((a, b) => a + b, 0);
    expect(total).toBe(1000);
  });

  it('limita pistas al máximo por misión y rechaza intentos fuera de rango', () => {
    expect(hintPenalty(3)).toBe(20);
    expect(hintPenalty(-1)).toBe(0);
    expect(attemptPenalty(1)).toBe(0);
    expect(() => attemptPenalty(3)).toThrow(RangeError);
    expect(() => attemptPenalty(0)).toThrow(RangeError);
    expect(() => attemptPenalty(1.5)).toThrow(RangeError);
  });

  it('una política alternativa con bonificación la incluye dentro del máximo', () => {
    const policy: ScoringPolicy = {
      ...GAME_SPEC_SCORING_POLICY,
      version: 'test',
      maxTimeBonus: 20,
    };
    expect(baseScore(policy)).toBe(80);
    expect(timeBonus(0, 60_000, policy)).toBe(20);
    expect(timeBonus(30_000, 60_000, policy)).toBe(10);
    expect(timeBonus(90_000, 60_000, policy)).toBe(0);
    const fast = scoreMission(
      { solved: true, solvedOnAttempt: 1, hintsUsed: 0, elapsedMs: 0, baseDurationMs: 60_000 },
      policy,
    );
    expect(fast.total).toBe(100);
    const slowWithHint = scoreMission(
      {
        solved: true,
        solvedOnAttempt: 2,
        hintsUsed: 1,
        elapsedMs: 120_000,
        baseDurationMs: 60_000,
      },
      policy,
    );
    expect(slowWithHint.total).toBe(40);
  });
});

describe('Precisión y progreso', () => {
  it('precisión es aciertos entre intentos puntuados y «Sin datos» sin intentos', () => {
    expect(accuracy(3, 4)).toBe(0.75);
    expect(accuracy(0, 0)).toBeNull();
  });

  it('progreso evita divisiones por cero', () => {
    expect(progress(4, 10)).toEqual({ closed: 4, total: 10, ratio: 0.4 });
    expect(progress(0, 0).ratio).toBe(0);
  });
});
