import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { MissionEvaluator } from '@/features/challenge/application/ports';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import type { EvaluationOutcome, MissionAnswer } from '@/features/challenge/domain/types';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import {
  ClassroomService,
  type Failure,
  type ParticipantView,
  type PresenterView,
} from '@/features/classroom/application/classroom-service';
import type { ClassroomRepository } from '@/features/classroom/application/ports';
import { ROOM_CODE_ALPHABET } from '@/features/classroom/domain/room-code';
import { EnvPresenterGate, nodeSecrets } from '@/features/classroom/infrastructure/node-secrets';
import { UnconfiguredOracleExecutor } from '@/infrastructure/oracle/unconfigured-oracle-executor';

/**
 * Contrato de la sala en vivo sobre un repositorio concreto: la misma batería se ejecuta
 * con memoria (tests/unit) y con PostgreSQL y las funciones de la migración
 * (tests/integration), para que ambos adaptadores respeten las mismas reglas.
 */

export const ACCESS_CODE = 'clave-profesor-pruebas';
const M01_VERSION = PUBLIC_MISSIONS.find(({ id }) => id === 'M01')!.version;
const M01_OK: MissionAnswer = { type: 'drag-column', columns: ['NOMBRE', 'SALARIO'] };
const M01_WRONG: MissionAnswer = { type: 'drag-column', columns: ['SALARIO', 'NOMBRE'] };
const CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`);

export function answer(answerValue: MissionAnswer = M01_OK, requestId = randomUUID()) {
  return { missionId: 'M01', missionVersion: M01_VERSION, requestId, answer: answerValue };
}

export interface Harness {
  readonly service: ClassroomService;
  readonly clock: { time: number; now(): number };
  readonly notified: Array<[string, number]>;
}

export function harness(
  repository: ClassroomRepository,
  options: {
    capacity?: number;
    accessCode?: string | undefined;
    evaluator?: MissionEvaluator;
  } = {},
): Harness {
  const clock = {
    time: Date.UTC(2026, 8, 24, 13, 0, 0),
    now() {
      return this.time;
    },
  };
  const notified: Array<[string, number]> = [];
  const service = new ClassroomService({
    repository,
    evaluator: options.evaluator ?? new InProcessMissionEvaluator(new UnconfiguredOracleExecutor()),
    notifier: {
      notify: async (roomId, revision) => {
        notified.push([roomId, revision]);
      },
    },
    presenterGate: new EnvPresenterGate('accessCode' in options ? options.accessCode : ACCESS_CODE),
    secrets: nodeSecrets,
    clock,
    ...(options.capacity ? { capacity: options.capacity } : {}),
  });
  return { service, clock, notified };
}

function ok<T>(value: T | Failure): T {
  if (typeof value === 'object' && value !== null && (value as Failure).ok === false) {
    throw new Error(`Se esperaba éxito: ${(value as Failure).reason}`);
  }
  return value as T;
}

async function room(h: Harness) {
  const created = ok(await h.service.createRoom(ACCESS_CODE));
  return { code: created.room.code, presenter: created.presenterToken };
}

async function join(h: Harness, code: string, nickname: string): Promise<string> {
  const joined = await h.service.joinRoom(code, nickname);
  if (!joined.ok) throw new Error(`No entró ${nickname}: ${joined.reason}`);
  return joined.participantToken;
}

function presenter(h: Harness, code: string, token: string): Promise<PresenterView> {
  return h.service.presenterView(code, token).then(ok);
}

function participant(h: Harness, code: string, token: string): Promise<ParticipantView> {
  return h.service.participantView(code, token).then(ok);
}

function kinds(outcomes: readonly EvaluationOutcome[]): string[] {
  return outcomes.map(({ kind }) => kind);
}

export function classroomContract(
  label: string,
  createRepository: () => ClassroomRepository | Promise<ClassroomRepository>,
) {
  const setup = async (options?: Parameters<typeof harness>[1]) =>
    harness(await createRepository(), options);

  describe(`Sala en vivo · contrato (${label})`, () => {
    it('crea salas solo con la clave del profesor y protege la consola', async () => {
      const h = await setup();
      expect(await h.service.createRoom('otra-clave')).toMatchObject({ reason: 'forbidden' });
      const unconfigured = await setup({ accessCode: undefined });
      expect(await unconfigured.service.createRoom(ACCESS_CODE)).toMatchObject({
        reason: 'unconfigured',
      });

      const { code, presenter: token } = await room(h);
      expect(code).toMatch(CODE_PATTERN);
      const view = await presenter(h, code, token);
      expect(view.room).toMatchObject({ code, status: 'lobby', startedAt: null });
      expect(view.participants).toEqual([]);
      expect(await h.service.presenterView(code, 'token-ajeno')).toMatchObject({
        reason: 'forbidden',
      });
      expect(await h.service.presenterView(code, null)).toMatchObject({ reason: 'forbidden' });
      expect(await h.service.command('start', code, 'token-ajeno')).toMatchObject({
        reason: 'forbidden',
      });
      // La vista del profesor no expone huellas ni tokens.
      expect(JSON.stringify(view)).not.toMatch(/[0-9a-f]{64}/);
    });

    it('inscribe con alias saneado y rechaza duplicados, datos de contacto y códigos inválidos', async () => {
      const h = await setup();
      const { code } = await room(h);
      const ana = await join(h, code.toLowerCase(), '  Ana   ');
      const view = await participant(h, code, ana);
      expect(view.me.nickname).toBe('Ana');
      expect(JSON.stringify(view)).not.toContain(ana);

      expect(await h.service.joinRoom(code, 'ANA')).toMatchObject({ reason: 'nickname-taken' });
      expect(await h.service.joinRoom(code, 'a')).toMatchObject({ reason: 'invalid' });
      expect(await h.service.joinRoom(code, 'ana@correo.com')).toMatchObject({
        reason: 'invalid',
      });
      expect(await h.service.joinRoom(code, 'Tel 3001234567')).toMatchObject({
        reason: 'invalid',
      });
      expect(await h.service.joinRoom(code, '<script>')).toMatchObject({ reason: 'invalid' });
      expect(await h.service.joinRoom('AB', 'Beto')).toMatchObject({ reason: 'invalid' });
      expect(await h.service.joinRoom(12, 'Beto')).toMatchObject({ reason: 'invalid' });
      expect(await h.service.checkCode('ZZZZZZ')).toMatchObject({ reason: 'not-found' });
      expect(await h.service.participantView(code, 'token-ajeno')).toMatchObject({
        reason: 'forbidden',
      });
    });

    it('respeta el cupo de la sala', async () => {
      const h = await setup({ capacity: 3 });
      const { code } = await room(h);
      for (const name of ['Ana', 'Beto', 'Carla']) await join(h, code, name);
      expect(await h.service.joinRoom(code, 'Dani')).toMatchObject({ reason: 'full' });
    });

    it('aplica las transiciones de la sala y cierra la inscripción al iniciar', async () => {
      const h = await setup();
      const { code, presenter: token } = await room(h);
      expect(await h.service.command('start', code, token)).toMatchObject({ reason: 'empty' });
      const ana = await join(h, code, 'Ana');
      expect(await h.service.submitAnswer(code, ana, answer())).toMatchObject({
        kind: 'technical',
        message: 'La actividad aún no comenzó.',
      });

      const started = ok(await h.service.command('start', code, token));
      expect(started.room.status).toBe('running');
      expect(started.room.startedAt).toBe(h.clock.time);
      expect(await h.service.command('start', code, token)).toMatchObject({ reason: 'conflict' });
      expect(await h.service.joinRoom(code, 'Tardío')).toMatchObject({ reason: 'closed' });
      expect(await h.service.checkCode(code)).toMatchObject({ ok: true, status: 'running' });

      h.clock.time += 60_000;
      const finished = ok(await h.service.command('finish', code, token));
      expect(finished.room).toMatchObject({ status: 'finished', finishedAt: h.clock.time });
      expect(await h.service.command('finish', code, token)).toMatchObject({ reason: 'conflict' });
      expect(await h.service.command('cancel', code, token)).toMatchObject({ reason: 'conflict' });
      expect(await h.service.submitAnswer(code, ana, answer())).toMatchObject({
        kind: 'technical',
        message: 'La sala terminó: ya no se registran respuestas.',
      });

      const other = await room(h);
      const cancelled = ok(await h.service.command('cancel', other.code, other.presenter));
      expect(cancelled.room.status).toBe('cancelled');
    });

    it('puntúa en el servidor: intentos, pistas, idempotencia y práctica tras cerrar', async () => {
      const h = await setup();
      const { code, presenter: token } = await room(h);
      const ana = await join(h, code, 'Ana');
      const beto = await join(h, code, 'Beto');
      const carla = await join(h, code, 'Carla');
      ok(await h.service.command('start', code, token));
      h.clock.time += 10_000;

      const first = answer(M01_WRONG);
      expect(await h.service.submitAnswer(code, ana, first)).toMatchObject({ kind: 'incorrect' });
      // El mismo envío repetido devuelve la misma corrección sin gastar otro intento.
      expect(await h.service.submitAnswer(code, ana, first)).toMatchObject({ kind: 'incorrect' });
      expect(await h.service.submitAnswer(code, ana, { ...first, answer: M01_OK })).toMatchObject({
        kind: 'technical',
      });
      expect((await participant(h, code, ana)).me.attempts).toBe(1);
      expect(await h.service.submitAnswer(code, ana, answer())).toMatchObject({ kind: 'correct' });
      // Oportunidad puntuada cerrada: se corrige como práctica y no cambia el puntaje.
      expect(await h.service.submitAnswer(code, ana, answer())).toMatchObject({ kind: 'correct' });
      const anaView = await participant(h, code, ana);
      expect(anaView.me).toMatchObject({ score: 80, attempts: 2, solvedMissions: 1 });

      expect(typeof (await h.service.hint(code, beto, 'M01'))).toBe('string');
      await h.service.hint(code, beto, 'M01');
      expect(await h.service.submitAnswer(code, beto, answer())).toMatchObject({ kind: 'correct' });
      expect((await participant(h, code, beto)).me).toMatchObject({ score: 80, hintsUsed: 1 });

      expect(await h.service.submitAnswer(code, carla, answer(M01_WRONG))).toMatchObject({
        kind: 'incorrect',
      });
      expect(await h.service.submitAnswer(code, carla, answer(M01_WRONG))).toMatchObject({
        kind: 'incorrect',
      });
      expect(await h.service.submitAnswer(code, carla, answer())).toMatchObject({
        kind: 'correct',
      });
      expect((await participant(h, code, carla)).me).toMatchObject({
        score: 0,
        attempts: 2,
        solvedMissions: 0,
        accuracy: 0,
      });

      expect(await h.service.submitAnswer(code, ana, { missionId: 'M99' })).toMatchObject({
        kind: 'invalid-input',
      });
      expect(
        await h.service.submitAnswer(code, ana, { ...answer(), requestId: 'no-es-uuid' }),
      ).toMatchObject({ kind: 'invalid-input' });
      expect(await h.service.submitAnswer(code, 'token-ajeno', answer())).toMatchObject({
        kind: 'technical',
      });
      await expect(h.service.hint(code, ana, 'M99')).rejects.toThrow();

      const view = await presenter(h, code, token);
      expect(view.responded).toBe(3);
      expect(view.missions[0]).toMatchObject({ missionId: 'M01', answered: 3, solved: 2 });
      expect(view.missions[0]!.successRate).toBeCloseTo(2 / 3);

      ok(await h.service.command('finish', code, token));
      const final = await presenter(h, code, token);
      expect(final.statistics).toMatchObject({ participants: 3, averageScore: 160 / 3 });
      expect(final.statistics.accuracy).toBeCloseTo(2 / 5);
      expect(final.statistics.easiest.map(({ missionId }) => missionId)).toEqual(['M01']);
      // Una sola misión respondida: no hay «más difícil» que comparar.
      expect(final.statistics.hardest).toEqual([]);
      expect(final.participants.at(-1)).toMatchObject({ nickname: 'Carla', position: 3 });
      const carlaFinal = await participant(h, code, carla);
      expect(carlaFinal.ranking).toHaveLength(3);
      expect(carlaFinal.ranking.filter(({ isMe }) => isMe)).toHaveLength(1);
    });

    it('marca la presencia con la consulta del participante y registra la salida', async () => {
      const h = await setup();
      const { code, presenter: token } = await room(h);
      const ana = await join(h, code, 'Ana');
      const beto = await join(h, code, 'Beto');
      expect((await presenter(h, code, token)).connected).toBe(2);
      h.clock.time += 16_000;
      await participant(h, code, ana);
      expect((await presenter(h, code, token)).connected).toBe(1);

      // En espera, salir elimina la inscripción y libera el alias.
      expect(await h.service.leaveRoom(code, beto)).toEqual({ ok: true });
      expect((await presenter(h, code, token)).participants).toHaveLength(1);
      await join(h, code, 'Beto');

      // Iniciada, la salida se conserva para el ranking.
      ok(await h.service.command('start', code, token));
      await h.service.leaveRoom(code, ana);
      const view = await presenter(h, code, token);
      expect(view.participants.find(({ nickname }) => nickname === 'Ana')).toMatchObject({
        left: true,
      });
    });

    it('caduca las salas abiertas tras su vigencia', async () => {
      const h = await setup();
      const lobby = await room(h);
      const running = await room(h);
      const ana = await join(h, running.code, 'Ana');
      ok(await h.service.command('start', running.code, running.presenter));
      h.clock.time += 4 * 60 * 60 * 1000 + 1;
      expect(await h.service.joinRoom(lobby.code, 'Beto')).toMatchObject({ reason: 'expired' });
      expect((await participant(h, running.code, ana)).room.status).toBe('expired');
      expect(await h.service.submitAnswer(running.code, ana, answer())).toMatchObject({
        kind: 'technical',
      });
      expect(await h.service.command('finish', running.code, running.presenter)).toMatchObject({
        reason: 'expired',
      });
      expect((await presenter(h, running.code, running.presenter)).room.status).toBe('expired');
    });

    it('avisa cada cambio con una revisión creciente', async () => {
      const h = await setup();
      const { code, presenter: token } = await room(h);
      const ana = await join(h, code, 'Ana');
      ok(await h.service.command('start', code, token));
      await h.service.submitAnswer(code, ana, answer());
      const revisions = h.notified.map(([, revision]) => revision);
      expect(revisions.length).toBeGreaterThanOrEqual(3);
      expect(revisions).toEqual([...revisions].sort((a, b) => a - b));
      expect(new Set(h.notified.map(([roomId]) => roomId)).size).toBe(1);
      expect((await presenter(h, code, token)).room.revision).toBe(revisions.at(-1));
    });

    it('una corrección pendiente bloquea otro envío y caduca a los 30 s', async () => {
      const gate: { release: (() => void) | null } = { release: null };
      const base = new InProcessMissionEvaluator(new UnconfiguredOracleExecutor());
      const slow: MissionEvaluator = {
        evaluate: async (request) => {
          await new Promise<void>((resolve) => {
            gate.release = resolve;
          });
          return base.evaluate(request);
        },
        getHint: (id) => base.getHint(id),
        getExplanation: (id) => base.getExplanation(id),
      };
      const repository = await createRepository();
      const h = harness(repository, { evaluator: slow });
      const { code, presenter: token } = await room(h);
      const ana = await join(h, code, 'Ana');
      ok(await h.service.command('start', code, token));

      const pending = h.service.submitAnswer(code, ana, answer());
      await expect.poll(() => gate.release !== null).toBe(true);
      expect(await h.service.submitAnswer(code, ana, answer(M01_WRONG))).toMatchObject({
        kind: 'technical',
        message: 'Tu respuesta anterior aún se está corrigiendo.',
      });
      gate.release!();
      expect(await pending).toMatchObject({ kind: 'correct' });

      // Una reserva abandonada (servidor caído a mitad) no bloquea para siempre.
      const view = await participant(h, code, ana);
      const now = h.clock.time;
      const stale = await repository.reserveAttempt({
        participantId: view.me.participantId,
        missionId: 'M02',
        requestId: randomUUID(),
        payloadHash: nodeSecrets.hash('a'),
        maxAttempts: 2,
        pendingTimeoutMs: 30_000,
        now,
      });
      expect(stale.status).toBe('reserved');
      const blocked = await repository.reserveAttempt({
        participantId: view.me.participantId,
        missionId: 'M02',
        requestId: randomUUID(),
        payloadHash: nodeSecrets.hash('b'),
        maxAttempts: 2,
        pendingTimeoutMs: 30_000,
        now: now + 1_000,
      });
      expect(blocked.status).toBe('busy');
      const later = await repository.reserveAttempt({
        participantId: view.me.participantId,
        missionId: 'M02',
        requestId: randomUUID(),
        payloadHash: nodeSecrets.hash('c'),
        maxAttempts: 2,
        pendingTimeoutMs: 30_000,
        now: now + 31_000,
      });
      expect(later).toMatchObject({ status: 'reserved', attemptNumber: 1 });
    });

    describe('concurrencia (aula de ~50 estudiantes)', () => {
      it('50 estudiantes entran a la vez y cada uno responde una vez', async () => {
        const h = await setup();
        const { code, presenter: token } = await room(h);
        const names = Array.from({ length: 50 }, (_, index) => `Estudiante ${index + 1}`);
        const tokens = await Promise.all(names.map((name) => join(h, code, name)));
        expect(new Set(tokens).size).toBe(50);
        expect((await presenter(h, code, token)).participants).toHaveLength(50);

        ok(await h.service.command('start', code, token));
        h.clock.time += 5_000;
        const outcomes = await Promise.all(
          tokens.map((participantToken) =>
            h.service.submitAnswer(code, participantToken, answer()),
          ),
        );
        expect(kinds(outcomes).every((kind) => kind === 'correct')).toBe(true);
        const view = await presenter(h, code, token);
        expect(
          view.participants.every(({ score, attempts }) => score === 100 && attempts === 1),
        ).toBe(true);
        expect(view.responded).toBe(50);
        expect(view.statistics.accuracy).toBe(1);
      });

      it('61 entradas simultáneas con cupo 60: entran exactamente 60', async () => {
        const h = await setup();
        const { code } = await room(h);
        const results = await Promise.all(
          Array.from({ length: 61 }, (_, index) => h.service.joinRoom(code, `Alias ${index + 1}`)),
        );
        expect(results.filter((result) => result.ok)).toHaveLength(60);
        expect(results.filter((result) => !result.ok)).toEqual([
          expect.objectContaining({ reason: 'full' }),
        ]);
      });

      it('el mismo alias enviado a la vez desde dos móviles entra una sola vez', async () => {
        const h = await setup();
        const { code } = await room(h);
        const results = await Promise.all(
          Array.from({ length: 5 }, () => h.service.joinRoom(code, 'Ana')),
        );
        expect(results.filter((result) => result.ok)).toHaveLength(1);
      });

      it('10 envíos simultáneos con el mismo requestId cuentan como un intento', async () => {
        const h = await setup();
        const { code, presenter: token } = await room(h);
        const ana = await join(h, code, 'Ana');
        ok(await h.service.command('start', code, token));
        const request = answer();
        const outcomes = await Promise.all(
          Array.from({ length: 10 }, () => h.service.submitAnswer(code, ana, request)),
        );
        expect(kinds(outcomes)).toContain('correct');
        expect(kinds(outcomes).every((kind) => kind === 'correct' || kind === 'technical')).toBe(
          true,
        );
        expect(await h.service.submitAnswer(code, ana, request)).toMatchObject({ kind: 'correct' });
        expect((await participant(h, code, ana)).me).toMatchObject({ attempts: 1, score: 100 });
      });

      it('dos pestañas con envíos distintos a la vez nunca superan el máximo de intentos', async () => {
        const h = await setup();
        const { code, presenter: token } = await room(h);
        const ana = await join(h, code, 'Ana');
        ok(await h.service.command('start', code, token));
        const outcomes = await Promise.all(
          Array.from({ length: 6 }, () => h.service.submitAnswer(code, ana, answer(M01_WRONG))),
        );
        expect(kinds(outcomes)).toContain('incorrect');
        const me = (await participant(h, code, ana)).me;
        // Tras dos intentos puntuados, un envío más se corrige como práctica sin registrarse.
        expect(me.attempts).toBeGreaterThanOrEqual(1);
        expect(me.attempts).toBeLessThanOrEqual(2);
        expect(me.score).toBe(0);
      });
    });
  });
}
