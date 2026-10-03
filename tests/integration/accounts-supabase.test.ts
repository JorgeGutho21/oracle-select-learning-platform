// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Supabase real (Auth + API REST + RLS), como lo haría alguien que salta la interfaz y llama
 * a la API con la clave publicable y su propia sesión. Corre solo con un proyecto de PRUEBA:
 * SUPABASE_TEST_URL, SUPABASE_TEST_PUBLISHABLE_KEY y SUPABASE_TEST_SECRET_KEY (por ejemplo,
 * los de `supabase start`). Sin ellas se omite: no hay secretos en el repositorio.
 */

const URL = process.env.SUPABASE_TEST_URL ?? '';
const PUBLISHABLE = process.env.SUPABASE_TEST_PUBLISHABLE_KEY ?? '';
const SECRET = process.env.SUPABASE_TEST_SECRET_KEY ?? '';
const enabled = Boolean(URL && PUBLISHABLE && SECRET);
const PASSWORD = 'Prueba2026x';
const run = `${Date.now()}-${process.pid}`;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

interface Account {
  readonly id: string;
  readonly email: string;
  readonly client: SupabaseClient;
}

let admin: SupabaseClient;
let anon: SupabaseClient;
let studentA: Account;
let studentB: Account;
let teacher: Account;

async function account(prefix: string): Promise<Account> {
  const email = `${prefix}-${run}@example.com`;
  const created = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: prefix, last_name: 'Prueba', role: 'teacher' },
  });
  if (created.error) throw created.error;
  const client = createClient(URL, PUBLISHABLE, options);
  const signed = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signed.error) throw signed.error;
  return { id: created.data.user.id, email, client };
}

function progress(user: string, item: string, status: string) {
  return {
    user_id: user,
    section_key: 'fundamentos-sql',
    mode_key: 'study',
    item_key: item,
    status,
    progress_percent: status === 'completed' ? 100 : 0,
    last_activity_at: new Date().toISOString(),
  };
}

describe.skipIf(!enabled)('Supabase real · Auth, perfiles, progreso y RLS', () => {
  beforeAll(async () => {
    admin = createClient(URL, SECRET, options);
    anon = createClient(URL, PUBLISHABLE, options);
    [studentA, studentB, teacher] = await Promise.all([
      account('alumno-a'),
      account('alumno-b'),
      account('profesor'),
    ]);
    const role = await admin.rpc('admin_set_role', { p_email: teacher.email, p_role: 'teacher' });
    expect(role.data).toEqual({ status: 'updated' });
  }, 60_000);

  afterAll(async () => {
    if (!enabled) return;
    for (const user of [studentA, studentB, teacher]) {
      if (user) await admin.auth.admin.deleteUser(user.id);
    }
  });

  it('Auth crea el perfil como student aunque el registro pida teacher', async () => {
    const { data } = await studentA.client.from('profiles').select('role, first_name').single();
    expect(data).toEqual({ role: 'student', first_name: 'alumno-a' });
  });

  it('anon no lee perfiles ni progreso', async () => {
    for (const table of ['profiles', 'learning_progress', 'learner_presence']) {
      const { data, error } = await anon.from(table).select('*');
      expect(error?.code ?? (data?.length === 0 ? 'vacío' : 'filas')).toMatch(/42501|vacío/);
    }
  });

  it('A lee y edita lo suyo; no lee ni edita a B', async () => {
    const own = await studentA.client.from('profiles').select('id');
    expect(own.data).toEqual([{ id: studentA.id }]);
    const other = await studentA.client.from('profiles').select('id').eq('id', studentB.id);
    expect(other.data).toEqual([]);
    const rename = await studentA.client
      .from('profiles')
      .update({ first_name: 'Ana' })
      .eq('id', studentA.id)
      .select('first_name');
    expect(rename.data).toEqual([{ first_name: 'Ana' }]);
    const tamper = await studentA.client
      .from('profiles')
      .update({ first_name: 'X' })
      .eq('id', studentB.id)
      .select('id');
    expect(tamper.data).toEqual([]);
  });

  it('nadie se asigna teacher: ni por la tabla, ni por la función, ni por sus metadatos', async () => {
    const byTable = await studentA.client
      .from('profiles')
      .update({ role: 'teacher' })
      .eq('id', studentA.id);
    expect(byTable.error?.code).toBe('42501');
    const byFunction = await studentA.client.rpc('admin_set_role', {
      p_email: studentA.email,
      p_role: 'teacher',
    });
    expect(byFunction.error).not.toBeNull();
    await studentA.client.auth.updateUser({ data: { role: 'teacher' } });
    const { data } = await admin.from('profiles').select('role').eq('id', studentA.id).single();
    expect(data).toEqual({ role: 'student' });
  });

  it('A escribe su progreso; no el de B; una sincronización antigua no lo reduce', async () => {
    const own = await studentA.client
      .from('learning_progress')
      .upsert(progress(studentA.id, 'L03', 'completed'))
      .select('status');
    expect(own.data).toEqual([{ status: 'completed' }]);
    const stale = await studentA.client
      .from('learning_progress')
      .upsert(progress(studentA.id, 'L03', 'in_progress'))
      .select('status, progress_percent');
    expect(stale.data).toEqual([{ status: 'completed', progress_percent: 100 }]);
    const forB = await studentA.client
      .from('learning_progress')
      .insert(progress(studentB.id, 'L03', 'completed'));
    expect(forB.error?.code).toBe('42501');
    const readB = await studentB.client.from('learning_progress').select('user_id');
    expect(readB.data).toEqual([]);
  });

  it('el profesor lee perfiles y progreso del grupo; el estudiante no', async () => {
    const profiles = await teacher.client
      .from('profiles')
      .select('id')
      .in('id', [studentA.id, studentB.id]);
    expect(profiles.data?.map(({ id }) => id).sort()).toEqual([studentA.id, studentB.id].sort());
    const rows = await teacher.client
      .from('learning_progress')
      .select('user_id')
      .eq('user_id', studentA.id);
    expect(rows.data?.length).toBeGreaterThan(0);
    const asStudent = await studentB.client.from('profiles').select('id').eq('id', teacher.id);
    expect(asStudent.data).toEqual([]);
  });

  it('la lista de dominios institucionales solo la administra el proyecto', async () => {
    const insert = await studentA.client
      .from('institutional_domains')
      .insert({ domain: 'gmail.com' });
    expect(insert.error?.code).toBe('42501');
  });
});
