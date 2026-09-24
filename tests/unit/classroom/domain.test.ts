// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  liveAnswerSchema,
  nicknameInputSchema,
  roomCodeSchema,
} from '@/features/classroom/application/schemas';
import { sanitizeNickname } from '@/features/classroom/domain/nickname';
import {
  CONNECTED_WINDOW_MS,
  effectiveStatus,
  isTerminal,
  transitionFor,
  type RoomData,
  type RoomRecord,
} from '@/features/classroom/domain/room';
import {
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  roomCodeFromBytes,
} from '@/features/classroom/domain/room-code';
import {
  computeMissionProgress,
  computeStandings,
  computeStatistics,
  rankStandings,
} from '@/features/classroom/domain/standings';

const T0 = Date.UTC(2026, 8, 24, 13);

function roomRecord(overrides: Partial<RoomRecord> = {}): RoomRecord {
  return {
    id: 'sala',
    code: 'AB3K9X',
    status: 'running',
    revision: 1,
    createdAt: T0,
    expiresAt: T0 + 4 * 3_600_000,
    startedAt: T0,
    finishedAt: null,
    ...overrides,
  };
}

describe('código de sala', () => {
  it('normaliza lo que escribe una persona y rechaza caracteres confusos', () => {
    expect(normalizeRoomCode(' ab3 k9x ')).toBe('AB3K9X');
    expect(normalizeRoomCode('ab3-k9x')).toBe('AB3K9X');
    expect(normalizeRoomCode('ＡＢ３Ｋ９Ｘ')).toBe('AB3K9X');
    for (const confusing of ['AB3K9O', 'AB3K90', 'AB3K9I', 'AB3K91', 'AB3K9L']) {
      expect(normalizeRoomCode(confusing)).toBeNull();
    }
    expect(normalizeRoomCode('AB3K9')).toBeNull();
    expect(normalizeRoomCode('AB3K9XY')).toBeNull();
  });

  it('genera códigos de seis caracteres del alfabeto sin ambigüedades', () => {
    const code = roomCodeFromBytes(new Uint8Array([0, 1, 2, 30, 31, 255]));
    expect(code).toHaveLength(6);
    expect([...code].every((char) => ROOM_CODE_ALPHABET.includes(char))).toBe(true);
    expect(() => roomCodeFromBytes(new Uint8Array(5))).toThrow(RangeError);
  });

  it('el esquema Zod transforma y valida', () => {
    expect(roomCodeSchema.parse('ab3k9x')).toBe('AB3K9X');
    expect(roomCodeSchema.safeParse('A'.repeat(40)).success).toBe(false);
    expect(roomCodeSchema.safeParse(123).success).toBe(false);
  });
});

describe('alias del participante', () => {
  it('recorta espacios, conserva tildes y compara sin mayúsculas', () => {
    expect(sanitizeNickname('  José   Peña ')).toEqual({
      ok: true,
      nickname: 'José Peña',
      key: 'josé peña',
    });
    expect(sanitizeNickname('Ana_2.0-b')).toMatchObject({ ok: true });
  });

  it('elimina caracteres invisibles y rechaza marcas, correos y teléfonos', () => {
    expect(sanitizeNickname('An\u200Ba')).toMatchObject({ ok: true, nickname: 'Ana' });
    for (const value of ['a', 'x'.repeat(25), '<b>Ana</b>', 'ana@correo.co', 'Tel 3001234567']) {
      expect(sanitizeNickname(value).ok).toBe(false);
    }
    expect(sanitizeNickname('Ana 2026')).toMatchObject({ ok: true });
  });

  it('acota el tamaño recibido antes del saneado', () => {
    expect(nicknameInputSchema.safeParse('x'.repeat(200)).success).toBe(false);
  });
});

describe('estado de la sala', () => {
  it('caduca las salas abiertas vencidas y no cambia las terminadas', () => {
    const room = roomRecord();
    expect(effectiveStatus(room, T0)).toBe('running');
    expect(effectiveStatus(room, room.expiresAt)).toBe('expired');
    expect(effectiveStatus(roomRecord({ status: 'lobby' }), room.expiresAt + 1)).toBe('expired');
    expect(
      effectiveStatus(roomRecord({ status: 'finished', finishedAt: T0 }), room.expiresAt + 1),
    ).toBe('finished');
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('lobby')).toBe(false);
  });

  it('define las transiciones permitidas', () => {
    expect(transitionFor('start')).toEqual({ from: ['lobby'], to: 'running' });
    expect(transitionFor('finish')).toEqual({ from: ['running'], to: 'finished' });
    expect(transitionFor('cancel')).toEqual({ from: ['lobby', 'running'], to: 'cancelled' });
  });
});

describe('ranking y estadísticas', () => {
  const data: RoomData = {
    room: roomRecord(),
    participants: [
      {
        id: 'a',
        roomId: 'sala',
        nickname: 'Ana',
        joinedAt: T0 - 5_000,
        lastSeenAt: T0 + 50_000,
        leftAt: null,
      },
      {
        id: 'b',
        roomId: 'sala',
        nickname: 'Beto',
        joinedAt: T0 - 4_000,
        lastSeenAt: T0,
        leftAt: null,
      },
      {
        id: 'c',
        roomId: 'sala',
        nickname: 'Carla',
        joinedAt: T0 - 3_000,
        lastSeenAt: null,
        leftAt: null,
      },
      {
        id: 'd',
        roomId: 'sala',
        nickname: 'Dani',
        joinedAt: T0 - 2_000,
        lastSeenAt: T0 + 55_000,
        leftAt: T0 + 56_000,
      },
    ],
    attempts: [
      {
        id: '1',
        participantId: 'a',
        missionId: 'M01',
        attemptNumber: 1,
        correct: true,
        score: 100,
        durationMs: 20_000,
        hintUsed: false,
        createdAt: T0 + 20_000,
      },
      {
        id: '2',
        participantId: 'b',
        missionId: 'M01',
        attemptNumber: 1,
        correct: false,
        score: 0,
        durationMs: 10_000,
        hintUsed: false,
        createdAt: T0 + 10_000,
      },
      {
        id: '3',
        participantId: 'b',
        missionId: 'M01',
        attemptNumber: 2,
        correct: true,
        score: 80,
        durationMs: 10_000,
        hintUsed: false,
        createdAt: T0 + 20_000,
      },
      {
        id: '4',
        participantId: 'b',
        missionId: 'M02',
        attemptNumber: 1,
        correct: true,
        score: 80,
        durationMs: 30_000,
        hintUsed: true,
        createdAt: T0 + 50_000,
      },
      {
        id: '5',
        participantId: 'd',
        missionId: 'M02',
        attemptNumber: 1,
        correct: false,
        score: 0,
        durationMs: 5_000,
        hintUsed: false,
        createdAt: T0 + 5_000,
      },
    ],
    hints: [{ participantId: 'b', missionId: 'M02', usedAt: T0 + 30_000 }],
  };
  const now = T0 + 60_000;

  it('calcula puntos, precisión, tiempo y presencia solo desde intentos registrados', () => {
    const [ana, beto, carla, dani] = computeStandings(data, now);
    expect(ana).toMatchObject({
      score: 100,
      solvedMissions: 1,
      attempts: 1,
      accuracy: 1,
      timeMs: 20_000,
      connected: true,
    });
    expect(beto).toMatchObject({
      score: 160,
      solvedMissions: 2,
      attempts: 3,
      hintsUsed: 1,
      timeMs: 50_000,
      connected: false,
    });
    expect(beto!.accuracy).toBeCloseTo(2 / 3);
    expect(carla).toMatchObject({
      score: 0,
      attempts: 0,
      accuracy: null,
      timeMs: 0,
      connected: false,
    });
    expect(dani).toMatchObject({ left: true, connected: false });
    expect(now - data.participants[0]!.lastSeenAt!).toBeLessThanOrEqual(CONNECTED_WINDOW_MS);
  });

  it('ordena por puntos, misiones resueltas y tiempo; el empate completo comparte puesto', () => {
    const ranked = rankStandings(computeStandings(data, now));
    // Carla y Dani empatan en todo (0 puntos, 0 resueltas, sin tiempo): comparten el 3.
    expect(ranked.map(({ nickname, position }) => [nickname, position])).toEqual([
      ['Beto', 1],
      ['Ana', 2],
      ['Carla', 3],
      ['Dani', 3],
    ]);
  });

  it('las estadísticas del grupo usan el grupo completo y no inventan datos', () => {
    const progress = computeMissionProgress(data);
    // Tasa = personas que acertaron / participantes del grupo (cuatro), GAME_SPEC.
    expect(progress[0]).toMatchObject({
      missionId: 'M01',
      answered: 2,
      solved: 2,
      successRate: 0.5,
    });
    expect(progress[1]).toMatchObject({
      missionId: 'M02',
      answered: 2,
      solved: 1,
      successRate: 0.25,
    });
    expect(progress[2]).toMatchObject({ answered: 0, successRate: null });
    const stats = computeStatistics(computeStandings(data, now), progress);
    expect(stats).toMatchObject({ participants: 4, averageScore: 65 });
    expect(stats.accuracy).toBeCloseTo(3 / 5);
    // Tiempo medio solo de quienes acertaron: Dani falló y no suma tiempo.
    expect(stats.averageTimeMs).toBe(35_000);
    expect(stats.easiest.map(({ missionId }) => missionId)).toEqual(['M01']);
    expect(stats.hardest.map(({ missionId }) => missionId)).toEqual(['M02']);

    const empty = computeStatistics(
      [],
      computeMissionProgress({ ...data, participants: [], attempts: [] }),
    );
    expect(empty).toEqual({
      participants: 0,
      averageScore: null,
      accuracy: null,
      averageTimeMs: null,
      easiest: [],
      hardest: [],
    });
  });
});

describe('fixtures de TEST_PLAN', () => {
  function standing(nickname: string, score: number, solvedMissions: number, timeMs: number) {
    return {
      participantId: nickname,
      nickname,
      joinedAt: T0,
      score,
      solvedMissions,
      answeredMissions: solvedMissions,
      attempts: solvedMissions,
      correctAttempts: solvedMissions,
      hintsUsed: 0,
      accuracy: solvedMissions > 0 ? 1 : null,
      timeMs,
      connected: true,
      left: false,
    };
  }

  it('ranking de competición: 1, 2, 3, 3, 5', () => {
    const ranked = rankStandings([
      standing('Sol-QA', 800, 8, 500_000),
      standing('Luis-QA', 800, 10, 400_000),
      standing('Zoe-QA', 700, 7, 100_000),
      standing('Eva-QA', 800, 8, 500_000),
      standing('Ana-QA', 1000, 10, 300_000),
    ]);
    expect(ranked.map(({ nickname, position }) => [nickname, position])).toEqual([
      ['Ana-QA', 1],
      ['Luis-QA', 2],
      ['Eva-QA', 3],
      ['Sol-QA', 3],
      ['Zoe-QA', 5],
    ]);
  });

  it('estadística de M06 con cuatro inscritos', () => {
    const person = (id: string) => ({
      id,
      roomId: 'sala',
      nickname: id,
      joinedAt: T0 - 1_000,
      lastSeenAt: null,
      leftAt: null,
    });
    const attempt = (
      id: string,
      participantId: string,
      attemptNumber: number,
      correct: boolean,
      score: number,
      at: number,
    ) => ({
      id,
      participantId,
      missionId: 'M06' as const,
      attemptNumber,
      correct,
      score,
      durationMs: 0,
      hintUsed: participantId === 'B',
      createdAt: T0 + at,
    });
    const fixture: RoomData = {
      room: roomRecord(),
      participants: ['A', 'B', 'C', 'D'].map(person),
      attempts: [
        attempt('1', 'A', 1, true, 100, 20_000),
        attempt('2', 'B', 1, false, 0, 30_000),
        attempt('3', 'B', 2, true, 60, 50_000),
        attempt('4', 'C', 1, false, 0, 30_000),
        attempt('5', 'C', 2, false, 0, 40_000),
      ],
      hints: [{ participantId: 'B', missionId: 'M06', usedAt: T0 + 25_000 }],
    };
    const m06 = computeMissionProgress(fixture).find(({ missionId }) => missionId === 'M06')!;
    expect(m06).toMatchObject({ attempts: 5, answered: 3, solved: 2, successRate: 0.5 });
    const standings = computeStandings(fixture, T0 + 60_000);
    const stats = computeStatistics(standings, computeMissionProgress(fixture));
    expect(stats.averageTimeMs).toBe(35_000);
    expect(stats.averageScore).toBe(40);
    expect(standings.reduce((total, { hintsUsed }) => total + hintsUsed, 0)).toBe(1);
    expect(
      standings.filter(({ attempts }) => attempts === 0).map(({ nickname }) => nickname),
    ).toEqual(['D']);
  });
});

describe('respuesta en vivo (Zod)', () => {
  const valid = {
    missionId: 'M01',
    missionVersion: 1,
    requestId: '6f1c2c1e-2f7b-4a44-9b1e-3a4b5c6d7e8f',
    answer: { type: 'drag-column', columns: ['NOMBRE'] },
  };

  it('acepta el formato del Challenge y rechaza lo demás', () => {
    expect(liveAnswerSchema.safeParse(valid).success).toBe(true);
    expect(liveAnswerSchema.safeParse({ ...valid, missionId: 'M11' }).success).toBe(false);
    expect(liveAnswerSchema.safeParse({ ...valid, requestId: 'x' }).success).toBe(false);
    expect(liveAnswerSchema.safeParse({ ...valid, missionVersion: 1.5 }).success).toBe(false);
    expect(liveAnswerSchema.safeParse({ ...valid, answer: { type: 'otro' } }).success).toBe(false);
    expect(
      liveAnswerSchema.safeParse({
        ...valid,
        answer: { type: 'write-query', sql: 'x'.repeat(5000) },
      }).success,
    ).toBe(false);
  });
});
