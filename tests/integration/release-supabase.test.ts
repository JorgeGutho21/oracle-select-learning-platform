// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OFFICIAL_BANK } from '@/features/assessments/application/official-bank';
import { questionRpcPayload } from '@/features/assessments/application/assessment-forms';

// Explicit release smoke: three disposable users, no load test and selected audiences only.
const URL = process.env.SUPABASE_RELEASE_QA_URL ?? '';
const key = process.env.SUPABASE_RELEASE_QA_PUBLISHABLE_KEY ?? '';
const secret = process.env.SUPABASE_RELEASE_QA_SECRET_KEY ?? '';
const enabled = process.env.SUPABASE_RELEASE_QA === '1' && Boolean(URL && key && secret);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const ownedUsers: string[] = [];
const ownedAssessments: string[] = [];
let admin: SupabaseClient;
let anon: SupabaseClient;
let teacher: SupabaseClient;
let a: SupabaseClient;
let b: SupabaseClient;
let studentId: string;

async function rpc<T>(client: SupabaseClient, name: string, args: Record<string, unknown> = {}) {
  const result = await client.rpc(name, args);
  if (result.error) throw new Error(`${name}: ${result.error.code}`);
  return result.data as T;
}

describe.skipIf(!enabled)('Supabase remoto: humo de release aislado', () => {
  beforeAll(async () => {
    admin = createClient(URL, secret, options);
    anon = createClient(URL, key, options);
    const clients: SupabaseClient[] = [];
    for (const role of ['teacher', 'a', 'b']) {
      const email = `dblab-release-${role}-${randomUUID()}@example.com`;
      const password = `Qa${randomUUID()}9`;
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: 'QA', last_name: 'Release' },
      });
      if (created.error) throw new Error(`QA create: ${created.error.code}`);
      ownedUsers.push(created.data.user.id);
      if (role === 'a') studentId = created.data.user.id;
      if (role === 'teacher')
        expect(await rpc(admin, 'admin_set_role', { p_email: email, p_role: 'teacher' })).toEqual({
          status: 'updated',
        });
      const client = createClient(URL, key, options);
      const signed = await client.auth.signInWithPassword({ email, password });
      expect(signed.error).toBeNull();
      clients.push(client);
    }
    [teacher, a, b] = clients as [SupabaseClient, SupabaseClient, SupabaseClient];
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const id of ownedAssessments) {
      expect(
        (await admin.from('assessment_audit').delete().eq('assessment_id', id)).error,
      ).toBeNull();
      expect((await admin.from('assessments').delete().eq('id', id)).error).toBeNull();
    }
    for (const id of ownedUsers) expect((await admin.auth.admin.deleteUser(id)).error).toBeNull();
  }, 60_000);

  it('anon no lee ninguna tabla de plataforma, ni A las tablas de evaluaciones', async () => {
    const tables = [
      'rooms',
      'participants',
      'attempts',
      'hints',
      'results',
      'profiles',
      'learning_progress',
      'learner_presence',
      'institutional_domains',
      'question_bank',
      'question_options',
      'assessments',
      'assessment_questions',
      'assessment_assignments',
      'assessment_attempts',
      'assessment_answers',
      'assessment_events',
      'assessment_audit',
    ];
    for (const table of tables) {
      const result = await anon.from(table).select('*').limit(1);
      expect(result.data ?? [], table).toEqual([]);
      if (table.startsWith('assessment') || table.startsWith('question')) {
        expect((await a.from(table).select('*').limit(1)).data ?? [], table).toEqual([]);
      }
    }
  });

  it('sincroniza idempotentemente el banco académico de 50 + 50 + 50', async () => {
    const payload = Object.values(OFFICIAL_BANK).flat().map(questionRpcPayload);
    expect(await rpc(teacher, 'sync_official_questions', { p_questions: payload })).toMatchObject({
      status: 'synced',
      invalid: 0,
    });
    expect(await rpc(teacher, 'sync_official_questions', { p_questions: payload })).toMatchObject({
      status: 'synced',
      invalid: 0,
    });
    for (const section of Object.keys(OFFICIAL_BANK)) {
      const result = await teacher
        .from('question_bank')
        .select('id', { count: 'exact', head: true })
        .eq('section_key', section)
        .eq('origin', 'dblab');
      expect(result.error).toBeNull();
      expect(result.count).toBe(50);
    }
  });

  it.each(['fundamentos-sql', 'consultas-relacionales', 'plsql'])(
    '%s: intento propio, autoguardado, entrega y retroalimentación con RLS',
    async (section) => {
      const saved = await rpc<{ status: string; id: string }>(teacher, 'save_assessment', {
        p: {
          title: `QA release ${section} ${randomUUID().slice(0, 8)}`,
          section_key: section,
          selection_mode: 'random',
          question_count: 1,
          duration_minutes: 5,
          audience: 'selected',
          student_ids: [studentId],
          feedback_mode: 'hidden',
        },
      });
      expect(saved.status).toBe('saved');
      ownedAssessments.push(saved.id);
      expect(await rpc(teacher, 'publish_assessment', { p_assessment: saved.id })).toEqual({
        status: 'published',
      });
      const started = await rpc<{ status: string; attempt_id: string }>(a, 'start_attempt', {
        p_assessment: saved.id,
      });
      expect(started.status).toBe('started');
      const view = await rpc<{
        items: { position: number; response: string; options: { id: string }[] }[];
      }>(a, 'attempt_view', { p_attempt: started.attempt_id });
      expect(JSON.stringify(view)).not.toMatch(/"(?:correct|is_correct|explanation|feedback)":/);
      const item = view.items[0]!;
      const answer =
        item.response === 'order'
          ? { order: item.options.map((option) => option.id) }
          : item.response === 'multiple'
            ? { choices: [item.options[0]!.id] }
            : { choice: item.options[0]!.id };
      expect(
        await rpc(a, 'save_answers', {
          p_attempt: started.attempt_id,
          p_position: 1,
          p_answers: [{ position: item.position, answer, revision: 2, flagged: false }],
        }),
      ).toMatchObject({ status: 'saved' });
      expect(await rpc(b, 'attempt_view', { p_attempt: started.attempt_id })).toEqual({
        status: 'not-found',
      });
      expect(
        await rpc(b, 'save_answers', {
          p_attempt: started.attempt_id,
          p_position: 1,
          p_answers: [],
        }),
      ).toEqual({ status: 'not-found' });
      expect(await rpc(b, 'assessment_monitor', { p_assessment: saved.id })).toEqual({
        status: 'forbidden',
      });
      await rpc(a, 'submit_attempt', { p_attempt: started.attempt_id, p_reason: 'student' });
      expect(await rpc(a, 'attempt_view', { p_attempt: started.attempt_id })).not.toHaveProperty(
        'grade',
      );
      expect(
        await rpc(teacher, 'set_feedback_mode', {
          p_assessment: saved.id,
          p_mode: 'full_feedback',
        }),
      ).toMatchObject({ status: 'updated' });
      const result = await rpc<{ grade: number; release: string }>(a, 'attempt_view', {
        p_attempt: started.attempt_id,
      });
      expect(result.release).toBe('full_feedback');
      expect(result.grade).toBeGreaterThanOrEqual(0);
      expect(result.grade).toBeLessThanOrEqual(5);
    },
  );
});
