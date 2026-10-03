// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Cuentas, progreso y presencia (migración de la Fase 2) sobre PostgreSQL real (PGlite).
 * Reproduce lo que Supabase pone alrededor: el esquema `auth` con `auth.users` y
 * `auth.uid()`, los roles anon/authenticated/service_role y sus privilegios por defecto.
 * Cada consulta corre como lo haría PostgREST: `set local role` y el `sub` del JWT. Así se
 * prueba que RLS y los privilegios impiden lo que una petición fabricada intentaría,
 * sin pasar por la interfaz. La prueba contra Supabase real (Auth + API) está en
 * accounts-supabase.test.ts.
 */

const MIGRATIONS = [
  'supabase/migrations/20260924120000_classroom.sql',
  'supabase/migrations/20261002120000_learner_accounts.sql',
].map((path) => readFileSync(path, 'utf8'));

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const T = '33333333-3333-4333-8333-333333333333';

async function supabaseLikeDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    create schema auth;
    grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users (
      id uuid primary key,
      email text,
      email_confirmed_at timestamptz,
      raw_app_meta_data jsonb,
      raw_user_meta_data jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  for (const migration of MIGRATIONS) await db.exec(migration);
  return db;
}

type Role = 'anon' | 'authenticated' | 'service_role';

async function as<T>(
  db: PGlite,
  role: Role,
  sub: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return db.transaction(async (tx: Transaction) => {
    await tx.exec(`set local role ${role}`);
    if (sub) await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sub]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

async function createAuthUser(
  db: PGlite,
  id: string,
  email: string,
  meta: Record<string, unknown> = {},
  provider = 'email',
  confirmed = true,
) {
  await db.query(
    `insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
     values ($1, $2, $3, $4, $5)`,
    [id, email, confirmed ? new Date().toISOString() : null, { provider }, meta],
  );
}

function progressRow(user: string, item: string, status: string, at: string) {
  return {
    sql: `insert into public.learning_progress
            (user_id, section_key, mode_key, item_key, status, progress_percent, last_activity_at)
          values ($1, 'fundamentos-sql', 'study', $2, $3, 0, $4)
          on conflict (user_id, section_key, mode_key, item_key) do update set
            status = excluded.status, progress_percent = excluded.progress_percent,
            last_activity_at = excluded.last_activity_at, state = excluded.state
          returning status, progress_percent`,
    params: [user, item, status, at],
  };
}

const database = supabaseLikeDatabase();
beforeAll(async () => {
  const db = await database;
  await createAuthUser(db, A, 'Ana@Example.com', {
    first_name: 'Ana',
    last_name: 'Ruiz',
    role: 'teacher',
  });
  await createAuthUser(db, B, 'beto@example.com', { first_name: 'Beto', last_name: 'Gil' });
  await createAuthUser(db, T, 'profe@example.com', { full_name: 'Amílcar Sierra Romano' }, 'azure');
  await db.query(`select public.admin_set_role('profe@example.com', 'teacher')`);
}, 60_000);
afterAll(async () => {
  await (await database).close();
});

describe('Cuentas · perfiles creados por Auth', () => {
  it('el perfil se crea con el rol student aunque el registro pida otro', async () => {
    const db = await database;
    const [profile] = await as<Record<string, unknown>>(
      db,
      'authenticated',
      A,
      `select first_name, last_name, email, role, auth_method, institutional from public.profiles where id = $1`,
      [A],
    );
    expect(profile).toEqual({
      first_name: 'Ana',
      last_name: 'Ruiz',
      email: 'ana@example.com',
      role: 'student',
      auth_method: 'email',
      institutional: false,
    });
  });

  it('Microsoft: nombre desde el proveedor y método de acceso verificado', async () => {
    const db = await database;
    const [profile] = await as<Record<string, unknown>>(
      db,
      'authenticated',
      T,
      `select first_name, last_name, auth_method, role from public.profiles where id = $1`,
      [T],
    );
    expect(profile).toEqual({
      first_name: 'Amílcar',
      last_name: 'Sierra Romano',
      auth_method: 'microsoft',
      role: 'teacher',
    });
  });
});

describe('Cuentas · RLS de perfiles', () => {
  it('anon no lee perfiles ni progreso', async () => {
    const db = await database;
    for (const table of [
      'profiles',
      'learning_progress',
      'learner_presence',
      'institutional_domains',
    ]) {
      await expect(as(db, 'anon', null, `select * from public.${table}`)).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it('estudiante A lee su perfil y no el de B', async () => {
    const db = await database;
    const rows = await as<{ id: string }>(db, 'authenticated', A, `select id from public.profiles`);
    expect(rows.map(({ id }) => id)).toEqual([A]);
    const other = await as(db, 'authenticated', A, `select * from public.profiles where id = $1`, [
      B,
    ]);
    expect(other).toEqual([]);
  });

  it('estudiante A cambia su nombre, pero no el de B', async () => {
    const db = await database;
    const own = await as(
      db,
      'authenticated',
      A,
      `update public.profiles set first_name = 'Ana María' where id = $1 returning first_name`,
      [A],
    );
    expect(own).toEqual([{ first_name: 'Ana María' }]);
    const other = await as(
      db,
      'authenticated',
      A,
      `update public.profiles set first_name = 'Hackeado' where id = $1 returning id`,
      [B],
    );
    expect(other).toEqual([]);
    const [beto] = await db
      .query<{ first_name: string }>(`select first_name from public.profiles where id = $1`, [B])
      .then((result) => result.rows);
    expect(beto?.first_name).toBe('Beto');
  });

  it('nadie se asigna el rol teacher ni cambia datos verificados', async () => {
    const db = await database;
    for (const column of [
      "role = 'teacher'",
      "email = 'otro@x.com'",
      'institutional = true',
      "auth_method = 'microsoft'",
    ]) {
      await expect(
        as(db, 'authenticated', A, `update public.profiles set ${column} where id = $1`, [A]),
      ).rejects.toThrow(/permission denied/);
    }
    await expect(
      as(
        db,
        'authenticated',
        A,
        `insert into public.profiles (id, email, role) values ($1, 'x@x.com', 'teacher')`,
        ['44444444-4444-4444-8444-444444444444'],
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, 'authenticated', A, `select public.admin_set_role('ana@example.com', 'teacher')`),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, 'anon', null, `select public.admin_set_role('ana@example.com', 'teacher')`),
    ).rejects.toThrow(/permission denied/);
    const [ana] = await db
      .query<{ role: string }>(`select role from public.profiles where id = $1`, [A])
      .then((result) => result.rows);
    expect(ana?.role).toBe('student');
  });

  it('el disparador frena un cambio de rol aunque alguien conceda la columna por error', async () => {
    const db = await database;
    await db.exec(`grant update (role) on public.profiles to authenticated`);
    try {
      await expect(
        as(db, 'authenticated', A, `update public.profiles set role = 'teacher' where id = $1`, [
          A,
        ]),
      ).rejects.toThrow(/Solo se pueden cambiar el nombre y el apellido/);
    } finally {
      await db.exec(`revoke update (role) on public.profiles from authenticated`);
    }
  });

  it('el profesor lee todos los perfiles; el estudiante no', async () => {
    const db = await database;
    const teacher = await as<{ id: string }>(
      db,
      'authenticated',
      T,
      `select id from public.profiles order by id`,
    );
    expect(teacher.map(({ id }) => id)).toEqual([A, B, T]);
    const student = await as(db, 'authenticated', B, `select id from public.profiles`);
    expect(student).toEqual([{ id: B }]);
  });
});

describe('Progreso · RLS y fusión monótona en la base', () => {
  it('A escribe y lee su progreso; no lee ni escribe el de B', async () => {
    const db = await database;
    const insert = progressRow(A, 'L05', 'completed', '2026-10-01T10:00:00Z');
    expect(await as(db, 'authenticated', A, insert.sql, insert.params)).toEqual([
      { status: 'completed', progress_percent: 100 },
    ]);
    const forB = progressRow(B, 'L05', 'completed', '2026-10-01T10:00:00Z');
    await expect(as(db, 'authenticated', A, forB.sql, forB.params)).rejects.toThrow(
      /row-level security/,
    );
    const bOwn = progressRow(B, 'L01', 'in_progress', '2026-10-01T10:00:00Z');
    await as(db, 'authenticated', B, bOwn.sql, bOwn.params);
    const seenByA = await as<{ user_id: string }>(
      db,
      'authenticated',
      A,
      `select user_id from public.learning_progress`,
    );
    expect(seenByA.every(({ user_id }) => user_id === A)).toBe(true);
    const tamper = await as(
      db,
      'authenticated',
      A,
      `update public.learning_progress set status = 'completed' where user_id = $1 returning 1`,
      [B],
    );
    expect(tamper).toEqual([]);
    // Mover filas a otra cuenta no cambia su dueño: el disparador conserva user_id.
    const moved = await as<{ user_id: string }>(
      db,
      'authenticated',
      A,
      `update public.learning_progress set user_id = $1 where user_id = $2 returning user_id`,
      [B, A],
    );
    expect(moved.length).toBeGreaterThan(0);
    expect(moved.every(({ user_id }) => user_id === A)).toBe(true);
    const deleteOther = await as(
      db,
      'authenticated',
      A,
      `delete from public.learning_progress where user_id = $1 returning 1`,
      [B],
    );
    expect(deleteOther).toEqual([]);
  });

  it('completado nunca vuelve a en curso por una sincronización antigua', async () => {
    const db = await database;
    const stale = progressRow(A, 'L05', 'in_progress', '2020-01-01T00:00:00Z');
    expect(await as(db, 'authenticated', A, stale.sql, stale.params)).toEqual([
      { status: 'completed', progress_percent: 100 },
    ]);
    const regress = progressRow(A, 'L05', 'not_started', '2030-01-01T00:00:00Z');
    expect(await as(db, 'authenticated', A, regress.sql, regress.params)).toEqual([
      { status: 'completed', progress_percent: 100 },
    ]);
  });

  it('la actividad futura se acota al presente y la posición antigua no pisa la reciente', async () => {
    const db = await database;
    await as(
      db,
      'authenticated',
      A,
      `insert into public.learning_progress (user_id, section_key, mode_key, item_key, status, progress_percent, state, last_activity_at)
       values ($1, 'fundamentos-sql', 'class', 'scenes', 'in_progress', 40, '{"scene": 12}', now() + interval '10 years')`,
      [A],
    );
    await as(
      db,
      'authenticated',
      A,
      `update public.learning_progress set state = '{"scene": 3}', progress_percent = 10,
         last_activity_at = '2020-01-01' where user_id = $1 and mode_key = 'class'`,
      [A],
    );
    const [row] = await as<{ state: { scene: number }; progress_percent: number; future: boolean }>(
      db,
      'authenticated',
      A,
      `select state, progress_percent, last_activity_at > now() as future
       from public.learning_progress where user_id = $1 and mode_key = 'class'`,
      [A],
    );
    expect(row).toEqual({ state: { scene: 12 }, progress_percent: 40, future: false });
  });

  it('las restricciones rechazan claves, secciones y estados inventados', async () => {
    const db = await database;
    for (const [section, mode, item, status] of [
      ['otra-seccion', 'study', 'L01', 'completed'],
      ['fundamentos-sql', 'examen', 'L01', 'completed'],
      ['fundamentos-sql', 'study', '../etc', 'completed'],
      ['fundamentos-sql', 'study', 'L01', 'aprobado'],
    ] as const) {
      await expect(
        as(
          db,
          'authenticated',
          A,
          `insert into public.learning_progress (user_id, section_key, mode_key, item_key, status)
           values ($1, $2, $3, $4, $5)`,
          [A, section, mode, item, status],
        ),
      ).rejects.toThrow(/violates check constraint/);
    }
  });

  it('el profesor lee el progreso de todos pero no lo modifica', async () => {
    const db = await database;
    const rows = await as<{ user_id: string }>(
      db,
      'authenticated',
      T,
      `select distinct user_id from public.learning_progress order by user_id`,
    );
    expect(rows.map(({ user_id }) => user_id)).toEqual([A, B]);
    const tamper = await as(
      db,
      'authenticated',
      T,
      `update public.learning_progress set progress_percent = 0 where user_id = $1 returning 1`,
      [A],
    );
    expect(tamper).toEqual([]);
  });
});

describe('Presencia y estado institucional', () => {
  it('cada uno informa su presencia; solo el profesor ve la de otros', async () => {
    const db = await database;
    await as(
      db,
      'authenticated',
      A,
      `insert into public.learner_presence (user_id, area, seen_at) values ($1, 'fundamentos-sql/study', '2000-01-01')
       on conflict (user_id) do update set area = excluded.area`,
      [A],
    );
    await expect(
      as(
        db,
        'authenticated',
        A,
        `insert into public.learner_presence (user_id, area) values ($1, 'x')`,
        [B],
      ),
    ).rejects.toThrow(/row-level security/);
    const own = await as<{ recent: boolean }>(
      db,
      'authenticated',
      A,
      `select seen_at > now() - interval '1 minute' as recent from public.learner_presence`,
    );
    expect(own).toEqual([{ recent: true }]);
    expect(await as(db, 'authenticated', B, `select * from public.learner_presence`)).toEqual([]);
    expect(
      await as<{ user_id: string }>(
        db,
        'authenticated',
        T,
        `select user_id from public.learner_presence`,
      ),
    ).toEqual([{ user_id: A }]);
  });

  it('institucional solo con correo confirmado de un dominio configurado', async () => {
    const db = await database;
    const C = '55555555-5555-4555-8555-555555555555';
    const D = '66666666-6666-4666-8666-666666666666';
    await createAuthUser(db, C, 'carla@sistemas.universidad.edu.co', { institutional: true });
    await createAuthUser(db, D, 'dani@universidad.edu.co', {}, 'email', false);
    const status = async (id: string) =>
      (
        await db.query<{ institutional: boolean }>(
          `select institutional from public.profiles where id = $1`,
          [id],
        )
      ).rows[0]?.institutional;
    expect(await status(C)).toBe(false);
    await db.query(
      `insert into public.institutional_domains (domain) values ('universidad.edu.co')`,
    );
    expect(await status(C)).toBe(true);
    expect(await status(D)).toBe(false);
    await db.query(`update auth.users set email_confirmed_at = now() where id = $1`, [D]);
    expect(await status(D)).toBe(true);
    await expect(
      as(
        db,
        'authenticated',
        A,
        `insert into public.institutional_domains (domain) values ('gmail.com')`,
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it('las tablas de la sala en vivo siguen cerradas a anon y authenticated', async () => {
    const db = await database;
    for (const role of ['anon', 'authenticated'] as const) {
      await expect(as(db, role, A, `select * from public.rooms`)).rejects.toThrow(
        /permission denied/,
      );
    }
  });
});
