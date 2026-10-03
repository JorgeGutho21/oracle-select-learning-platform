// @vitest-environment node
import type { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  as,
  createAuthUser,
  errorCode,
  rpc,
  supabaseLikeDatabase,
} from './support/pglite-supabase';

/**
 * Evaluaciones (migración de la Fase 3) sobre PostgreSQL real: banco, publicación con copia
 * congelada, intentos, autoguardado con versiones, calificación 0–5 con pesos, liberación de
 * la retroalimentación, vencimiento por tiempo, supervisión y RLS. Cada llamada se hace como
 * la haría la API de Supabase con la sesión de esa persona.
 */

const T = '30000000-0000-4000-8000-000000000001';
const A = '30000000-0000-4000-8000-0000000000a1';
const B = '30000000-0000-4000-8000-0000000000b2';
const C = '30000000-0000-4000-8000-0000000000c3';
const D = '30000000-0000-4000-8000-0000000000d4';
const I = '30000000-0000-4000-8000-0000000000e5';

type Json = Record<string, unknown>;
interface ViewOption {
  readonly id: string;
  readonly body: string;
  readonly [key: string]: unknown;
}
interface ViewItem {
  readonly position: number;
  readonly prompt: string;
  readonly response: string;
  readonly options: readonly ViewOption[];
  readonly answer: Json | null;
  readonly revision: number;
  readonly [key: string]: unknown;
}

let db: PGlite;

function question(prompt: string, overrides: Json = {}): Json {
  return {
    section: 'fundamentos-sql',
    topic: 'null',
    type: 'single_choice',
    response: 'single',
    prompt,
    difficulty: 1,
    explanation: `Explicación de ${prompt}`,
    concept: 'NULL',
    review: 'Lección 17',
    reference: 'Oracle SQL Language Reference',
    status: 'published',
    options: [
      { body: `${prompt} correcta`, correct: true, feedback: 'Bien.' },
      { body: `${prompt} distractor 1`, feedback: 'Confunde NULL con 0.' },
      { body: `${prompt} distractor 2`, feedback: 'Confunde = con IS.' },
    ],
    ...overrides,
  };
}

const MULTIPLE = question('Q2', {
  type: 'multiple_choice',
  response: 'multiple',
  difficulty: 3,
  options: [
    { body: 'Q2-A', correct: true },
    { body: 'Q2-B', correct: true },
    { body: 'Q2-C' },
    { body: 'Q2-D' },
  ],
});

const ORDER = question('Q3', {
  type: 'order_fragments',
  response: 'order',
  difficulty: 5,
  options: [
    { body: 'SELECT NOMBRE', order: 1 },
    { body: 'FROM EMPLEADOS', order: 2 },
    { body: 'WHERE BONO IS NULL', order: 3 },
  ],
});

async function teacher<R = Json>(call: string, params: unknown[] = []): Promise<R> {
  return rpc<R>(db, 'authenticated', T, call, params);
}

async function view(student: string, attempt: string) {
  return rpc<Json & { items?: ViewItem[] }>(
    db,
    'authenticated',
    student,
    'public.attempt_view($1)',
    [attempt],
  );
}

async function save(student: string, attempt: string, answers: unknown[], position = 1) {
  return rpc<Json>(db, 'authenticated', student, 'public.save_answers($1, $2, $3)', [
    attempt,
    position,
    JSON.stringify(answers),
  ]);
}

function byPrompt(items: readonly ViewItem[], prompt: string): ViewItem {
  const found = items.find((item) => item.prompt === prompt);
  if (!found) throw new Error(`Sin la pregunta ${prompt}`);
  return found;
}

function optionId(item: ViewItem, body: string): string {
  const found = item.options.find((option) => option.body === body);
  if (!found) throw new Error(`Sin la opción ${body}`);
  return found.id;
}

let q1: string;
let assessment: string;
let attemptA: string;

beforeAll(async () => {
  db = await supabaseLikeDatabase();
  await createAuthUser(db, T, 'profesor@example.com', { first_name: 'Ana', last_name: 'Docente' });
  for (const [id, name] of [
    [A, 'alumno-a'],
    [B, 'alumno-b'],
    [C, 'alumno-c'],
    [D, 'alumno-d'],
    [I, 'alumno-i'],
  ] as const) {
    await createAuthUser(db, id, `${name}@example.com`, { first_name: name, last_name: 'Prueba' });
  }
  await db.query(`update public.profiles set role = 'teacher' where id = $1`, [T]);
  await db.query(`update public.profiles set institutional = true where id = $1`, [I]);
}, 60_000);

describe('Banco de preguntas', () => {
  it('solo el profesor crea preguntas; anon ni siquiera puede llamar la función', async () => {
    expect(await rpc(db, 'authenticated', A, 'public.save_question($1)', [question('X')])).toEqual({
      status: 'forbidden',
    });
    expect(
      await errorCode(rpc(db, 'anon', null, 'public.save_question($1)', [question('X')])),
    ).toBe('42501');
    const created = await teacher<{ status: string; id: string; version: number }>(
      'public.save_question($1)',
      [question('Q1')],
    );
    expect(created).toMatchObject({ status: 'created', version: 1 });
    q1 = created.id;
    expect(await teacher('public.save_question($1)', [MULTIPLE])).toMatchObject({
      status: 'created',
    });
    expect(await teacher('public.save_question($1)', [ORDER])).toMatchObject({ status: 'created' });
  });

  it('peso por defecto según la dificultad (1 → 1, 3 → 1,5, 5 → 2)', async () => {
    const rows = await as<{ prompt: string; weight: string }>(
      db,
      'authenticated',
      T,
      `select prompt, weight::text from public.question_bank order by prompt`,
    );
    expect(rows).toEqual([
      { prompt: 'Q1', weight: '1.00' },
      { prompt: 'Q2', weight: '1.50' },
      { prompt: 'Q3', weight: '2.00' },
    ]);
  });

  it('guardar el mismo contenido no cambia la versión; cambiarlo la sube', async () => {
    expect(
      await teacher('public.save_question($1)', [{ ...question('Q1'), id: q1 }]),
    ).toMatchObject({ status: 'unchanged', version: 1 });
    expect(
      await teacher('public.save_question($1)', [
        { ...question('Q1'), id: q1, explanation: 'Mejor explicada' },
      ]),
    ).toMatchObject({ status: 'updated', version: 2 });
  });

  it('rechaza preguntas mal formadas con el motivo', async () => {
    const twoCorrect = question('Mala', {
      options: [
        { body: 'a', correct: true },
        { body: 'b', correct: true },
      ],
    });
    expect(await teacher('public.save_question($1)', [twoCorrect])).toEqual({
      status: 'invalid',
      problems: ['single-correct'],
    });
    const badOrder = {
      ...ORDER,
      options: [
        { body: 'x', order: 1 },
        { body: 'y', order: 1 },
      ],
    };
    expect(await teacher('public.save_question($1)', [badOrder])).toEqual({
      status: 'invalid',
      problems: ['order-permutation'],
    });
    expect(
      await teacher('public.save_question($1)', [question('Tema', { topic: 'Tema Libre' })]),
    ).toEqual({ status: 'invalid', problems: ['data'] });
  });

  it('un estudiante no lee el banco ni las respuestas correctas; anon tampoco', async () => {
    for (const table of ['question_bank', 'question_options']) {
      expect(await as(db, 'authenticated', A, `select * from public.${table}`)).toEqual([]);
      expect(await errorCode(as(db, 'anon', null, `select * from public.${table}`))).toBe('42501');
    }
    expect(
      await errorCode(
        as(db, 'authenticated', T, `update public.question_options set is_correct = true`),
      ),
    ).toBe('42501');
  });

  it('las preguntas oficiales no se editan desde el panel', async () => {
    const synced = await teacher('public.sync_official_questions($1)', [
      JSON.stringify([{ ...question('Oficial'), external_key: 'S1-TEST-01' }]),
    ]);
    expect(synced).toMatchObject({ status: 'synced', created: 1 });
    expect(
      await teacher('public.sync_official_questions($1)', [
        JSON.stringify([{ ...question('Oficial'), external_key: 'S1-TEST-01' }]),
      ]),
    ).toMatchObject({ unchanged: 1, created: 0 });
    const [official] = await as<{ id: string }>(
      db,
      'authenticated',
      T,
      `select id from public.question_bank where external_key = 'S1-TEST-01'`,
    );
    expect(
      await teacher('public.save_question($1)', [{ ...question('Editada'), id: official!.id }]),
    ).toEqual({ status: 'official-readonly' });
    await teacher('public.set_question_status($1, $2)', [official!.id, 'retired']);
  });
});

describe('Evaluación: creación, publicación e intento', () => {
  it('crea un borrador manual que nadie ve hasta publicarlo', async () => {
    const ids = await as<{ id: string }>(
      db,
      'authenticated',
      T,
      `select id from public.question_bank where prompt in ('Q1','Q2','Q3') order by prompt`,
    );
    const saved = await teacher<{ status: string; id: string }>('public.save_assessment($1)', [
      {
        title: 'Parcial NULL',
        section_key: 'fundamentos-sql',
        selection_mode: 'manual',
        question_ids: ids.map(({ id }) => id),
        question_count: 3,
        duration_minutes: 30,
        feedback_mode: 'hidden',
      },
    ]);
    expect(saved.status).toBe('saved');
    assessment = saved.id;
    expect(await rpc(db, 'authenticated', A, 'public.student_assessments()')).toEqual([]);
    expect(await rpc(db, 'authenticated', A, 'public.start_attempt($1)', [assessment])).toEqual({
      status: 'not-found',
    });
    expect(
      await rpc(db, 'authenticated', A, 'public.publish_assessment($1)', [assessment]),
    ).toEqual({ status: 'forbidden' });
  });

  it('al publicar congela la versión: editar el banco después no cambia la evaluación', async () => {
    expect(await teacher('public.publish_assessment($1)', [assessment])).toEqual({
      status: 'published',
    });
    expect(
      await teacher('public.save_assessment($1)', [{ id: assessment, title: 'Otro' }]),
    ).toEqual({ status: 'not-draft' });
    await teacher('public.save_question($1)', [{ ...question('Q1'), id: q1, concept: 'Cambiado' }]);
    const [frozen] = await as<{ version: number; concept: string }>(
      db,
      'authenticated',
      T,
      `select version, snapshot ->> 'concept' as concept from public.assessment_questions
       where assessment_id = $1 and question_id = $2`,
      [assessment, q1],
    );
    expect(frozen).toEqual({ version: 2, concept: 'NULL' });
    expect(
      await errorCode(
        db.query(`update public.assessment_questions set weight = 9 where assessment_id = $1`, [
          assessment,
        ]),
      ),
    ).toBe('42501');
  });

  it('el estudiante la ve, comienza y un segundo clic retoma el mismo intento', async () => {
    const list = await rpc<Json[]>(db, 'authenticated', A, 'public.student_assessments()');
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: 'Parcial NULL', phase: 'active', attempts: [] });
    const started = await rpc<{ status: string; attempt_id: string }>(
      db,
      'authenticated',
      A,
      'public.start_attempt($1)',
      [assessment],
    );
    expect(started.status).toBe('started');
    attemptA = started.attempt_id;
    expect(await rpc(db, 'authenticated', A, 'public.start_attempt($1)', [assessment])).toEqual({
      status: 'resumed',
      attempt_id: attemptA,
    });
    const [{ count }] = (
      await db.query<{ count: number }>(
        `select count(*)::int as count from public.assessment_attempts where student_id = $1`,
        [A],
      )
    ).rows as [{ count: number }];
    expect(count).toBe(1);
  });

  it('durante el intento no viaja la clave: ni correctas, ni orden, ni explicación', async () => {
    const opened = await view(A, attemptA);
    expect(opened.status).toBe('in_progress');
    expect(opened.items).toHaveLength(3);
    for (const item of opened.items ?? []) {
      expect(Object.keys(item).sort()).toEqual(
        [
          'answer',
          'code',
          'exhibit',
          'flagged',
          'options',
          'position',
          'prompt',
          'response',
          'revision',
          'type',
        ].sort(),
      );
      for (const option of item.options) {
        expect(Object.keys(option).sort()).toEqual(['body', 'id', 'kind', 'result']);
      }
    }
    const text = JSON.stringify(opened);
    for (const leak of ['"correct"', 'Explicación', '"feedback"', 'Confunde', 'difficulty']) {
      expect(text).not.toContain(leak);
    }
  });

  it('autoguardado: una revisión atrasada no pisa la nueva; una opción ajena se rechaza', async () => {
    const items = (await view(A, attemptA)).items!;
    const first = byPrompt(items, 'Q1');
    const multiple = byPrompt(items, 'Q2');
    const order = byPrompt(items, 'Q3');
    await save(A, attemptA, [
      { position: first.position, answer: { choice: optionId(first, 'Q1 correcta') }, revision: 1 },
      {
        position: multiple.position,
        answer: { choices: [optionId(multiple, 'Q2-A'), optionId(multiple, 'Q2-B')] },
        revision: 1,
      },
    ]);
    const newer = await save(A, attemptA, [
      {
        position: multiple.position,
        answer: { choices: [optionId(multiple, 'Q2-A'), optionId(multiple, 'Q2-C')] },
        revision: 2,
        flagged: true,
      },
    ]);
    expect(newer).toMatchObject({ status: 'saved', rejected: [] });
    const stale = await save(A, attemptA, [
      {
        position: multiple.position,
        answer: { choices: [optionId(multiple, 'Q2-A'), optionId(multiple, 'Q2-B')] },
        revision: 1,
      },
    ]);
    expect(stale).toMatchObject({ saved: [{ position: multiple.position, revision: 2 }] });
    const foreign = await save(A, attemptA, [
      { position: first.position, answer: { choice: optionId(multiple, 'Q2-A') }, revision: 3 },
    ]);
    expect(foreign).toMatchObject({ rejected: [first.position] });
    await save(A, attemptA, [
      {
        position: order.position,
        answer: {
          order: ['SELECT NOMBRE', 'FROM EMPLEADOS', 'WHERE BONO IS NULL'].map((body) =>
            optionId(order, body),
          ),
        },
        revision: 1,
      },
    ]);
  });

  it('al recargar vuelve el mismo examen, en el mismo orden, con lo guardado', async () => {
    const before = (await view(A, attemptA)).items!;
    const after = (await view(A, attemptA)).items!;
    expect(after.map((item) => [item.prompt, item.options.map((o) => o.id)])).toEqual(
      before.map((item) => [item.prompt, item.options.map((o) => o.id)]),
    );
    const multiple = byPrompt(after, 'Q2');
    expect(multiple.revision).toBe(2);
    expect(multiple.flagged).toBe(true);
    expect((multiple.answer as { choices: string[] }).choices).toHaveLength(2);
  });

  it('nadie más lee ni escribe el intento; nadie se pone nota', async () => {
    expect(await view(B, attemptA)).toEqual({ status: 'not-found' });
    expect(await save(B, attemptA, [])).toEqual({ status: 'not-found' });
    expect(await rpc(db, 'authenticated', B, 'public.submit_attempt($1)', [attemptA])).toEqual({
      status: 'not-found',
    });
    for (const table of ['assessment_attempts', 'assessment_answers', 'assessment_events']) {
      expect(await as(db, 'authenticated', A, `select * from public.${table}`)).toEqual([]);
    }
    expect(
      await errorCode(
        as(
          db,
          'authenticated',
          A,
          `update public.assessment_attempts set grade = 5 where id = $1`,
          [attemptA],
        ),
      ),
    ).toBe('42501');
    expect(
      await errorCode(
        as(
          db,
          'authenticated',
          A,
          `insert into public.assessment_events (attempt_id, assessment_id, student_id, event_type) values ($1, $2, $3, 'online')`,
          [attemptA, assessment, A],
        ),
      ),
    ).toBe('42501');
  });

  it('entrega una vez: calificación ponderada 0–5 en la base; el segundo envío no cambia nada', async () => {
    expect(await rpc(db, 'authenticated', A, 'public.submit_attempt($1)', [attemptA])).toEqual({
      status: 'submitted',
    });
    expect(await rpc(db, 'authenticated', A, 'public.submit_attempt($1)', [attemptA])).toEqual({
      status: 'already-submitted',
    });
    const [graded] = (
      await db.query<Json>(
        `select status, submitted_by, correct_count, score_raw::text, score_possible::text,
                score_percent::text, grade::text
         from public.assessment_attempts where id = $1`,
        [attemptA],
      )
    ).rows;
    // Q1 1 × 1 + Q2 (1 acierto − 1 error) / 2 = 0 × 1,5 + Q3 1 × 2 = 3 de 4,5 → 66,67 % → 3,3.
    expect(graded).toEqual({
      status: 'submitted',
      submitted_by: 'student',
      correct_count: 2,
      score_raw: '3.0000',
      score_possible: '4.5000',
      score_percent: '66.67',
      grade: '3.3',
    });
    expect(await save(A, attemptA, [])).toEqual({ status: 'finished' });
  });

  it('la nota es reproducible: recalcular da exactamente lo mismo', async () => {
    const read = async () =>
      (
        await db.query<Json>(
          `select score_raw, score_percent, grade from public.assessment_attempts where id = $1`,
          [attemptA],
        )
      ).rows[0];
    const before = await read();
    await db.query(`select private.grade_attempt($1)`, [attemptA]);
    expect(await read()).toEqual(before);
  });

  it('retroalimentación: oculta, solo nota, respuestas y explicación completa', async () => {
    const hidden = await view(A, attemptA);
    expect(hidden).toMatchObject({ status: 'finished', release: 'hidden' });
    expect(hidden).not.toHaveProperty('grade');
    expect(
      await rpc(db, 'authenticated', A, 'public.set_feedback_mode($1, $2)', [
        assessment,
        'full_feedback',
      ]),
    ).toEqual({ status: 'forbidden' });

    await teacher('public.set_feedback_mode($1, $2)', [assessment, 'score_only']);
    const scoreOnly = await view(A, attemptA);
    expect(scoreOnly).toMatchObject({ release: 'score_only', grade: 3.3, correct_count: 2 });
    expect(scoreOnly).not.toHaveProperty('items');

    await teacher('public.set_feedback_mode($1, $2)', [assessment, 'answers']);
    const answers = await view(A, attemptA);
    const first = byPrompt(answers.items!, 'Q1');
    expect(first.options.find((o) => o.body === 'Q1 correcta')?.correct).toBe(true);
    expect(first).not.toHaveProperty('explanation');
    expect(first.options[0]?.feedback ?? null).toBeNull();

    await teacher('public.set_feedback_mode($1, $2)', [assessment, 'full_feedback']);
    const full = byPrompt((await view(A, attemptA)).items!, 'Q1');
    // La copia congelada al publicar (versión 2), no la edición posterior del banco.
    expect(full).toMatchObject({ explanation: 'Mejor explicada', concept: 'NULL', credit: 1 });
    expect(full.options.find((o) => o.body === 'Q1 distractor 1')?.feedback).toBe(
      'Confunde NULL con 0.',
    );
  });

  it('crédito parcial en selección múltiple y nada por un orden incorrecto', async () => {
    const { attempt_id } = await rpc<{ attempt_id: string }>(
      db,
      'authenticated',
      B,
      'public.start_attempt($1)',
      [assessment],
    );
    const items = (await view(B, attempt_id)).items!;
    const multiple = byPrompt(items, 'Q2');
    const order = byPrompt(items, 'Q3');
    await save(B, attempt_id, [
      {
        position: multiple.position,
        answer: { choices: [optionId(multiple, 'Q2-A')] },
        revision: 1,
      },
      {
        position: order.position,
        answer: {
          order: ['FROM EMPLEADOS', 'SELECT NOMBRE', 'WHERE BONO IS NULL'].map((body) =>
            optionId(order, body),
          ),
        },
        revision: 1,
      },
    ]);
    await rpc(db, 'authenticated', B, 'public.submit_attempt($1)', [attempt_id]);
    const [graded] = (
      await db.query<Json>(
        `select score_raw::text, grade::text from public.assessment_attempts where id = $1`,
        [attempt_id],
      )
    ).rows;
    // 0 + 0,5 × 1,5 + 0 = 0,75 de 4,5 → 0,8.
    expect(graded).toEqual({ score_raw: '0.7500', grade: '0.8' });
  });

  it('si se acaba el tiempo, la siguiente lectura lo entrega por tiempo (aunque cierre el navegador)', async () => {
    const { attempt_id } = await rpc<{ attempt_id: string }>(
      db,
      'authenticated',
      C,
      'public.start_attempt($1)',
      [assessment],
    );
    expect(
      await rpc(db, 'authenticated', C, 'public.submit_attempt($1, $2)', [attempt_id, 'timer']),
    ).toMatchObject({ status: 'not-expired' });
    await db.query(
      `update public.assessment_attempts
       set started_at = now() - interval '40 minutes', expires_at = now() - interval '10 minutes'
       where id = $1`,
      [attempt_id],
    );
    expect(await save(C, attempt_id, [])).toEqual({ status: 'finished' });
    const [row] = (
      await db.query<Json>(
        `select status, submitted_by, grade::text, duration_seconds,
                submitted_at = expires_at as at_deadline
         from public.assessment_attempts where id = $1`,
        [attempt_id],
      )
    ).rows;
    expect(row).toEqual({
      status: 'auto_submitted',
      submitted_by: 'timer',
      grade: '0.0',
      duration_seconds: 1800,
      at_deadline: true,
    });
    expect(await rpc(db, 'authenticated', C, 'public.start_attempt($1)', [assessment])).toEqual({
      status: 'no-attempts-left',
    });
  });
});

describe('Supervisión y monitor', () => {
  it('solo registra tipos conocidos, con tope por lote, y el profesor ve el recuento', async () => {
    const { attempt_id } = await rpc<{ attempt_id: string }>(
      db,
      'authenticated',
      D,
      'public.start_attempt($1)',
      [assessment],
    );
    const events = [
      { type: 'focus_lost', ago_ms: 4000, position: 2 },
      { type: 'focus_returned', ago_ms: 1000, duration_ms: 3000 },
      { type: 'keylogger', ago_ms: 0 },
      ...Array.from({ length: 50 }, () => ({ type: 'visibility_hidden' })),
    ];
    expect(
      await rpc(db, 'authenticated', D, 'public.log_attempt_events($1, $2, $3)', [
        attempt_id,
        2,
        JSON.stringify(events),
      ]),
    ).toMatchObject({ status: 'ok' });
    const stored = await db.query<{ event_type: string; n: number }>(
      `select event_type, count(*)::int as n from public.assessment_events
       where attempt_id = $1 group by event_type order by event_type`,
      [attempt_id],
    );
    expect(stored.rows).toEqual([
      { event_type: 'focus_lost', n: 1 },
      { event_type: 'focus_returned', n: 1 },
      { event_type: 'started', n: 1 },
      { event_type: 'visibility_hidden', n: 38 },
    ]);
    const monitor = await teacher<{ attempts: Json[] }>('public.assessment_monitor($1)', [
      assessment,
    ]);
    const row = monitor.attempts.find((entry) => entry.attempt_id === attempt_id);
    expect(row).toMatchObject({
      status: 'in_progress',
      current_position: 2,
      answered: 0,
      counts: { focus_lost: 1, visibility_hidden: 38 },
    });
    expect(
      await rpc(db, 'authenticated', D, 'public.assessment_monitor($1)', [assessment]),
    ).toEqual({ status: 'forbidden' });
  });

  it('cerrar nuevos accesos deja seguir a quien ya empezó; finalizar entrega a todos', async () => {
    await teacher('public.close_assessment_entries($1)', [assessment]);
    expect(await rpc(db, 'authenticated', I, 'public.start_attempt($1)', [assessment])).toEqual({
      status: 'closed',
    });
    const list = await rpc<Json[]>(db, 'authenticated', D, 'public.student_assessments()');
    const open = (list[0]!.attempts as Json[])[0]!;
    expect(await save(D, open.id as string, [])).toMatchObject({ status: 'saved' });
    expect(await teacher('public.finalize_assessment($1)', [assessment])).toEqual({
      status: 'updated',
      closed_attempts: 1,
    });
    const [row] = (
      await db.query<Json>(
        `select status, submitted_by from public.assessment_attempts where id = $1`,
        [open.id],
      )
    ).rows;
    expect(row).toEqual({ status: 'auto_submitted', submitted_by: 'teacher' });
  });

  it('auditoría de las acciones del profesor', async () => {
    const actions = await as<{ action: string }>(
      db,
      'authenticated',
      T,
      `select action from public.assessment_audit where assessment_id = $1 order by id`,
      [assessment],
    );
    expect(actions.map(({ action }) => action)).toEqual([
      'assessment_created',
      'assessment_published',
      'feedback_changed',
      'feedback_changed',
      'feedback_changed',
      'entries_closed',
      'assessment_finalized',
    ]);
    expect(await as(db, 'authenticated', A, `select * from public.assessment_audit`)).toEqual([]);
  });

  it('la purga de eventos solo la ejecuta el servidor', async () => {
    expect(
      await errorCode(
        rpc(db, 'authenticated', T, 'public.admin_purge_assessment_events($1)', [90]),
      ),
    ).toBe('42501');
    expect(
      await rpc(db, 'service_role', null, 'public.admin_purge_assessment_events($1)', [90]),
    ).toMatchObject({ status: 'purged' });
  });
});

describe('Audiencia y selección aleatoria', () => {
  it('«solo institucionales» y «estudiantes elegidos» limitan quién la ve', async () => {
    const ids = await as<{ id: string }>(
      db,
      'authenticated',
      T,
      `select id from public.question_bank where prompt in ('Q1','Q2') order by prompt`,
    );
    const base = {
      section_key: 'fundamentos-sql',
      question_ids: ids.map(({ id }) => id),
      question_count: 2,
      duration_minutes: 20,
    };
    const institutional = await teacher<{ id: string }>('public.save_assessment($1)', [
      { ...base, title: 'Solo institucionales', institutional_only: true },
    ]);
    const selected = await teacher<{ id: string }>('public.save_assessment($1)', [
      { ...base, title: 'Para elegidos', audience: 'selected', student_ids: [B] },
    ]);
    expect(
      await teacher('public.save_assessment($1)', [
        { ...base, title: 'Sin elegidos', audience: 'selected', student_ids: [] },
      ]),
    ).toEqual({ status: 'invalid', problems: ['students'] });
    await teacher('public.publish_assessment($1)', [institutional.id]);
    await teacher('public.publish_assessment($1)', [selected.id]);
    expect(
      await rpc(db, 'authenticated', A, 'public.start_attempt($1)', [institutional.id]),
    ).toEqual({ status: 'not-found' });
    expect(
      await rpc(db, 'authenticated', I, 'public.start_attempt($1)', [institutional.id]),
    ).toMatchObject({ status: 'started' });
    expect(await rpc(db, 'authenticated', A, 'public.start_attempt($1)', [selected.id])).toEqual({
      status: 'not-found',
    });
    expect(
      await rpc(db, 'authenticated', B, 'public.start_attempt($1)', [selected.id]),
    ).toMatchObject({
      status: 'started',
    });
    expect(await rpc(db, 'authenticated', T, 'public.start_attempt($1)', [selected.id])).toEqual({
      status: 'not-found',
    });
  });

  it('cada intento aleatorio tiene la misma cantidad y la misma mezcla de dificultades', async () => {
    for (let index = 0; index < 12; index += 1) {
      await teacher('public.save_question($1)', [
        question(`R${index}`, { topic: 'where', difficulty: (index % 3) + 1 }),
      ]);
    }
    const saved = await teacher<{ id: string; available: number }>('public.save_assessment($1)', [
      {
        title: 'Aleatoria WHERE',
        section_key: 'fundamentos-sql',
        selection_mode: 'random',
        topics: ['where'],
        question_count: 6,
        duration_minutes: 15,
        max_attempts: 5,
      },
    ]);
    expect(saved.available).toBe(12);
    await teacher('public.publish_assessment($1)', [saved.id]);
    const draws = new Set<string>();
    for (let round = 0; round < 5; round += 1) {
      const { attempt_id } = await rpc<{ attempt_id: string }>(
        db,
        'authenticated',
        A,
        'public.start_attempt($1)',
        [saved.id],
      );
      const mix = await db.query<{ difficulty: number; n: number }>(
        `select (q.snapshot ->> 'difficulty')::int as difficulty, count(*)::int as n
         from public.assessment_answers a
         join public.assessment_questions q
           on q.assessment_id = a.assessment_id and q.question_id = a.question_id
         where a.attempt_id = $1 group by 1 order by 1`,
        [attempt_id],
      );
      expect(mix.rows).toEqual([
        { difficulty: 1, n: 2 },
        { difficulty: 2, n: 2 },
        { difficulty: 3, n: 2 },
      ]);
      const picked = await db.query<{ question_id: string }>(
        `select question_id from public.assessment_answers where attempt_id = $1 order by question_id`,
        [attempt_id],
      );
      draws.add(picked.rows.map(({ question_id }) => question_id).join());
      await rpc(db, 'authenticated', A, 'public.submit_attempt($1)', [attempt_id]);
    }
    expect(draws.size).toBeGreaterThan(1);
    expect(await rpc(db, 'authenticated', A, 'public.start_attempt($1)', [saved.id])).toEqual({
      status: 'no-attempts-left',
    });
  });

  it('un conjunto insuficiente no se publica', async () => {
    const saved = await teacher<{ id: string }>('public.save_assessment($1)', [
      {
        title: 'Demasiadas',
        section_key: 'plsql',
        selection_mode: 'random',
        question_count: 10,
        duration_minutes: 15,
      },
    ]);
    expect(await teacher('public.publish_assessment($1)', [saved.id])).toEqual({
      status: 'invalid',
      problems: ['pool-too-small'],
      available: 0,
    });
    expect(await teacher('public.delete_draft_assessment($1)', [saved.id])).toEqual({
      status: 'deleted',
    });
  });
});
