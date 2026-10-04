// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { questionRpcPayload } from '@/features/assessments/application/assessment-forms';
import { OFFICIAL_BANK } from '@/features/assessments/application/official-bank';

/**
 * Evaluaciones en Supabase real (API REST + RLS + funciones), con concurrencia ligera: 40
 * estudiantes comienzan, responden y entregan a la vez (dos veces cada uno). Corre solo con
 * un proyecto de PRUEBA: SUPABASE_TEST_URL, SUPABASE_TEST_PUBLISHABLE_KEY y
 * SUPABASE_TEST_SECRET_KEY (por ejemplo, los de `supabase start`).
 */

const URL = process.env.SUPABASE_TEST_URL ?? '';
const PUBLISHABLE = process.env.SUPABASE_TEST_PUBLISHABLE_KEY ?? '';
const SECRET = process.env.SUPABASE_TEST_SECRET_KEY ?? '';
const enabled = Boolean(URL && PUBLISHABLE && SECRET);
if (
  enabled &&
  !['127.0.0.1', 'localhost'].includes(new globalThis.URL(URL).hostname) &&
  process.env.SUPABASE_TEST_ALLOW_REMOTE !== 'staging'
) {
  throw new Error('The 40-student suite requires local Supabase or explicitly confirmed staging.');
}
const PASSWORD = 'Prueba2026x';
const run = `${Date.now()}-${process.pid}`;
const STUDENTS = 40;
const options = { auth: { persistSession: false, autoRefreshToken: false } };

interface Account {
  readonly id: string;
  readonly email: string;
  readonly client: SupabaseClient;
}

let admin: SupabaseClient;
let teacher: Account;
let students: Account[] = [];
let assessment = '';
const gradingAssessments: string[] = [];
const gradingQuestions: string[] = [];

async function account(prefix: string): Promise<Account> {
  const email = `${prefix}-${run}@example.com`;
  const created = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: prefix, last_name: 'Prueba' },
  });
  if (created.error) throw created.error;
  const client = createClient(URL, PUBLISHABLE, options);
  const signed = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signed.error) throw signed.error;
  return { id: created.data.user.id, email, client };
}

async function rpc<T = Record<string, unknown>>(client: SupabaseClient, name: string, args = {}) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data as T;
}

interface ViewItem {
  readonly position: number;
  readonly response: 'single' | 'multiple' | 'order';
  readonly options: readonly { readonly id: string }[];
}

function firstAnswer(item: ViewItem) {
  if (item.response === 'order') return { order: item.options.map((option) => option.id) };
  if (item.response === 'multiple') return { choices: [item.options[0]!.id] };
  return { choice: item.options[0]!.id };
}

describe.skipIf(!enabled)('Supabase real · evaluaciones, RLS y concurrencia', () => {
  beforeAll(async () => {
    admin = createClient(URL, SECRET, options);
    teacher = await account('docente');
    const role = await admin.rpc('admin_set_role', { p_email: teacher.email, p_role: 'teacher' });
    expect(role.data).toEqual({ status: 'updated' });
    students = [];
    for (let index = 0; index < STUDENTS; index += 8) {
      students.push(
        ...(await Promise.all(
          Array.from({ length: Math.min(8, STUDENTS - index) }, (_, offset) =>
            account(`est${index + offset}`),
          ),
        )),
      );
    }
  }, 180_000);

  afterAll(async () => {
    if (!enabled) return;
    for (const id of [assessment, ...gradingAssessments].filter(Boolean)) {
      await admin.from('assessments').delete().eq('id', id);
    }
    for (const id of gradingQuestions) await admin.from('question_bank').delete().eq('id', id);
    for (const user of [teacher, ...students]) {
      if (user) await admin.auth.admin.deleteUser(user.id);
    }
  }, 120_000);

  it('40 sesiones se autentican simultáneamente sin errores', async () => {
    const timings: number[] = [];
    const start = performance.now();
    await Promise.all(
      students.map(async (student) => {
        const began = performance.now();
        const signed = await student.client.auth.signInWithPassword({
          email: student.email,
          password: PASSWORD,
        });
        expect(signed.error).toBeNull();
        expect(signed.data.user?.id).toBe(student.id);
        timings.push(performance.now() - began);
      }),
    );
    timings.sort((a, b) => a - b);
    mkdirSync('output/playwright/phase5', { recursive: true });
    writeFileSync(
      'output/playwright/phase5/concurrency-auth.json',
      JSON.stringify(
        {
          clients: STUDENTS,
          elapsedMs: Math.round(performance.now() - start),
          p50Ms: Math.round(timings[19]!),
          p95Ms: Math.round(timings[37]!),
          isolatedLocal: true,
        },
        null,
        2,
      ),
    );
  }, 60_000);

  it('el profesor sincroniza el banco oficial y publica; los estudiantes no ven el banco', async () => {
    // Las tres secciones (Fase 4): 150 preguntas que la base acepta sin ninguna inválida.
    const payload = Object.values(OFFICIAL_BANK)
      .flat()
      .map((question) => questionRpcPayload(question));
    expect(payload).toHaveLength(150);
    const synced = await rpc(teacher.client, 'sync_official_questions', { p_questions: payload });
    expect(synced).toMatchObject({ status: 'synced', invalid: 0 });
    const saved = await rpc<{ status: string; id: string; available: number }>(
      teacher.client,
      'save_assessment',
      {
        p: {
          title: `Concurrencia ${run}`,
          section_key: 'fundamentos-sql',
          selection_mode: 'random',
          topics: ['null', 'where', 'logicos'],
          question_count: 8,
          duration_minutes: 30,
          feedback_mode: 'score_only',
        },
      },
    );
    expect(saved.status).toBe('saved');
    expect(saved.available).toBeGreaterThanOrEqual(8);
    assessment = saved.id;
    expect(await rpc(teacher.client, 'publish_assessment', { p_assessment: assessment })).toEqual({
      status: 'published',
    });
    const anon = createClient(URL, PUBLISHABLE, options);
    for (const table of [
      'question_bank',
      'question_options',
      'assessments',
      'assessment_attempts',
    ]) {
      const asStudent = await students[0]!.client.from(table).select('*').limit(5);
      expect(asStudent.data ?? []).toEqual([]);
      const asAnon = await anon.from(table).select('*').limit(5);
      expect(asAnon.error?.code ?? 'vacío').toMatch(/42501|vacío/);
    }
    const anonCall = await anon.rpc('student_assessments');
    expect(anonCall.error).not.toBeNull();
  });

  it('doble clic y pestañas: seis inicios simultáneos crean un solo intento', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        rpc<{ status: string; attempt_id: string }>(students[0]!.client, 'start_attempt', {
          p_assessment: assessment,
        }),
      ),
    );
    const ids = new Set(results.map((result) => result.attempt_id));
    expect(ids.size).toBe(1);
    expect(results.filter((result) => result.status === 'started')).toHaveLength(1);
    const { count } = await admin
      .from('assessment_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('assessment_id', assessment)
      .eq('student_id', students[0]!.id);
    expect(count).toBe(1);
  });

  it('revisiones fuera de orden: gana la más alta aunque llegue antes', async () => {
    const { attempt_id } = await rpc<{ attempt_id: string }>(students[0]!.client, 'start_attempt', {
      p_assessment: assessment,
    });
    const view = await rpc<{ items: ViewItem[] }>(students[0]!.client, 'attempt_view', {
      p_attempt: attempt_id,
    });
    const item = view.items.find((entry) => entry.response === 'single')!;
    await Promise.all(
      [3, 1, 5, 2, 4].map((revision) =>
        rpc(students[0]!.client, 'save_answers', {
          p_attempt: attempt_id,
          p_position: item.position,
          p_answers: [
            {
              position: item.position,
              answer: { choice: item.options[revision % item.options.length]!.id },
              flagged: false,
              revision,
            },
          ],
        }),
      ),
    );
    const { data } = await admin
      .from('assessment_answers')
      .select('revision, response')
      .eq('attempt_id', attempt_id)
      .eq('position', item.position)
      .single();
    expect(data).toEqual({
      revision: 5,
      response: { choice: item.options[5 % item.options.length]!.id },
    });
  });

  it(`${STUDENTS} estudiantes a la vez: respuestas propias, una sola nota por intento`, async () => {
    const outcomes = await Promise.all(
      students.map(async (student) => {
        const started = await rpc<{ attempt_id: string }>(student.client, 'start_attempt', {
          p_assessment: assessment,
        });
        const view = await rpc<{ items: ViewItem[] }>(student.client, 'attempt_view', {
          p_attempt: started.attempt_id,
        });
        const saved = await rpc<{ status: string; rejected: number[] }>(
          student.client,
          'save_answers',
          {
            p_attempt: started.attempt_id,
            p_position: 1,
            p_answers: view.items.map((item) => ({
              position: item.position,
              answer: firstAnswer(item),
              flagged: false,
              revision: 10,
            })),
          },
        );
        expect(saved).toMatchObject({ status: 'saved', rejected: [] });
        await rpc(student.client, 'log_attempt_events', {
          p_attempt: started.attempt_id,
          p_position: 2,
          p_events: [{ type: 'focus_lost', ago_ms: 1000 }],
        });
        // Doble envío simultáneo: uno califica, el otro no cambia nada.
        const submits = await Promise.all([
          rpc<{ status: string }>(student.client, 'submit_attempt', {
            p_attempt: started.attempt_id,
          }),
          rpc<{ status: string }>(student.client, 'submit_attempt', {
            p_attempt: started.attempt_id,
          }),
        ]);
        expect(submits.map((entry) => entry.status).sort()).toEqual([
          'already-submitted',
          'submitted',
        ]);
        return { attempt: started.attempt_id, items: view.items };
      }),
    );
    const attemptIds = outcomes.map((outcome) => outcome.attempt);
    expect(new Set(attemptIds).size).toBe(STUDENTS);

    const { data: attempts } = await admin
      .from('assessment_attempts')
      .select('id, status, grade, question_total')
      .in('id', attemptIds);
    expect(attempts).toHaveLength(STUDENTS);
    for (const row of attempts ?? []) {
      expect(row.status).toBe('submitted');
      expect(Number(row.grade)).toBeGreaterThanOrEqual(0);
      expect(Number(row.grade)).toBeLessThanOrEqual(5);
      expect(row.question_total).toBe(8);
    }

    const { data: submitted } = await admin
      .from('assessment_events')
      .select('attempt_id')
      .in('attempt_id', attemptIds)
      .eq('event_type', 'submitted');
    expect(submitted).toHaveLength(STUDENTS);

    // Ninguna respuesta se mezcló con la de otro intento: cada opción es del propio examen.
    const { data: answers } = await admin
      .from('assessment_answers')
      .select('attempt_id, position, response, option_order')
      .in('attempt_id', attemptIds);
    expect(answers).toHaveLength(STUDENTS * 8);
    for (const row of answers ?? []) {
      const chosen = row.response as { choice?: string; choices?: string[]; order?: string[] };
      const ids = chosen.choice ? [chosen.choice] : (chosen.choices ?? chosen.order ?? []);
      for (const id of ids) expect(row.option_order).toContain(id);
    }

    // La nota que ve cada estudiante (liberada como «solo nota») es la suya.
    const own = await rpc<{ release: string; grade: number }>(students[3]!.client, 'attempt_view', {
      p_attempt: outcomes[3]!.attempt,
    });
    const match = attempts?.find((row) => row.id === outcomes[3]!.attempt);
    expect(own.release).toBe('score_only');
    expect(own.grade).toBe(Number(match?.grade));
    expect(own).not.toHaveProperty('items');
    const foreign = await rpc(students[4]!.client, 'attempt_view', {
      p_attempt: outcomes[3]!.attempt,
    });
    expect(foreign).toEqual({ status: 'not-found' });
  }, 120_000);

  it('el monitor del profesor ve a todos; un estudiante no', async () => {
    const monitor = await rpc<{ attempts: unknown[] }>(teacher.client, 'assessment_monitor', {
      p_assessment: assessment,
    });
    expect(monitor.attempts).toHaveLength(STUDENTS);
    expect(
      await rpc(students[1]!.client, 'assessment_monitor', { p_assessment: assessment }),
    ).toEqual({
      status: 'forbidden',
    });
  });

  it('40 cuentas sincronizan progreso de las tres secciones y presencia sin mezclar datos', async () => {
    const start = performance.now();
    const timings = await Promise.all(
      students.map(async (student) => {
        const began = performance.now();
        const records = [
          { section_key: 'fundamentos-sql', item_key: 'L10' },
          { section_key: 'consultas-relacionales', item_key: 'S2-L08' },
          { section_key: 'plsql', item_key: 'S3-L01' },
        ].map((record) => ({
          ...record,
          user_id: student.id,
          mode_key: 'study',
          status: 'completed',
          progress_percent: 100,
        }));
        expect((await student.client.from('learning_progress').upsert(records)).error).toBeNull();
        expect(
          (
            await student.client
              .from('learner_presence')
              .upsert({ user_id: student.id, area: 'plsql/study' })
          ).error,
        ).toBeNull();
        const own = await student.client.from('learning_progress').select('user_id,section_key');
        expect(own.error).toBeNull();
        expect(own.data).toHaveLength(3);
        expect(own.data?.every((row) => row.user_id === student.id)).toBe(true);
        return performance.now() - began;
      }),
    );
    timings.sort((a, b) => a - b);
    mkdirSync('output/playwright/phase5', { recursive: true });
    writeFileSync(
      'output/playwright/phase5/concurrency-progress.json',
      JSON.stringify(
        {
          clients: STUDENTS,
          records: STUDENTS * 3,
          elapsedMs: Math.round(performance.now() - start),
          p50Ms: Math.round(timings[19]!),
          p95Ms: Math.round(timings[37]!),
          isolatedLocal: new globalThis.URL(URL).hostname === '127.0.0.1',
        },
        null,
        2,
      ),
    );
  }, 60_000);

  it.each([0, 20, 50, 60, 80, 100])(
    'califica %i %% en la base, con escala 0.0–5.0',
    async (percent) => {
      // Disposable local fixtures with equal weights isolate the grading scale from difficulty.
      if (gradingQuestions.length === 0) {
        for (let index = 0; index < 10; index += 1) {
          const saved = await rpc<{ id: string }>(teacher.client, 'save_question', {
            p: {
              section: 'fundamentos-sql',
              topic: 'null',
              type: 'single_choice',
              response: 'single',
              prompt: `QA de calificación ${run} ${index}`,
              difficulty: 1,
              weight: 1,
              status: 'published',
              options: [{ body: 'Correcta', correct: true }, { body: 'Distractor' }],
            },
          });
          expect(saved.id).toBeTruthy();
          gradingQuestions.push(saved.id);
        }
      }
      const saved = await rpc<{ id: string; status: string }>(teacher.client, 'save_assessment', {
        p: {
          title: `QA escala ${percent} ${run}`,
          section_key: 'fundamentos-sql',
          selection_mode: 'manual',
          question_ids: gradingQuestions,
          question_count: 10,
          duration_minutes: 5,
          audience: 'selected',
          student_ids: [students[0]!.id],
          feedback_mode: 'score_only',
        },
      });
      expect(saved.status).toBe('saved');
      gradingAssessments.push(saved.id);
      expect(await rpc(teacher.client, 'publish_assessment', { p_assessment: saved.id })).toEqual({
        status: 'published',
      });
      const started = await rpc<{ attempt_id: string }>(students[0]!.client, 'start_attempt', {
        p_assessment: saved.id,
      });
      const view = await rpc<{
        items: (Omit<ViewItem, 'options'> & { options: { id: string; body: string }[] })[];
      }>(students[0]!.client, 'attempt_view', { p_attempt: started.attempt_id });
      expect(view.items).toHaveLength(10);
      await rpc(students[0]!.client, 'save_answers', {
        p_attempt: started.attempt_id,
        p_position: 1,
        p_answers: view.items.map((item, index) => ({
          position: item.position,
          revision: 1,
          flagged: false,
          answer: {
            choice: item.options.find(
              (option) => option.body === (index < percent / 10 ? 'Correcta' : 'Distractor'),
            )!.id,
          },
        })),
      });
      await rpc(students[0]!.client, 'submit_attempt', {
        p_attempt: started.attempt_id,
        p_reason: 'student',
      });
      const result = await rpc<{ grade: number }>(students[0]!.client, 'attempt_view', {
        p_attempt: started.attempt_id,
      });
      expect(result.grade).toBe(percent / 20);
    },
  );
});
