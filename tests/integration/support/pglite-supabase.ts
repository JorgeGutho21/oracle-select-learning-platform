import { readFileSync } from 'node:fs';
import { PGlite, type Transaction } from '@electric-sql/pglite';

/**
 * PostgreSQL real (PGlite) con lo que Supabase pone alrededor de las migraciones: roles
 * anon/authenticated/service_role con sus privilegios por defecto, `auth.users` y
 * `auth.uid()`. Cada consulta de `as` corre como lo haría PostgREST (`set local role` y el
 * `sub` del JWT), así RLS y los privilegios se prueban como ante una petición fabricada.
 */

export const MIGRATIONS = [
  'supabase/migrations/20260924120000_classroom.sql',
  'supabase/migrations/20261002120000_learner_accounts.sql',
  'supabase/migrations/20261003120000_assessments.sql',
];

export async function supabaseLikeDatabase(files: readonly string[] = MIGRATIONS): Promise<PGlite> {
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
  for (const file of files) await db.exec(readFileSync(file, 'utf8'));
  return db;
}

export type Role = 'anon' | 'authenticated' | 'service_role';

export async function as<T>(
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

/** Llamada a una función de la API (RPC) como `role`; devuelve su jsonb. */
export async function rpc<T = Record<string, unknown>>(
  db: PGlite,
  role: Role,
  sub: string | null,
  call: string,
  params: unknown[] = [],
): Promise<T> {
  const rows = await as<{ result: T }>(db, role, sub, `select ${call} as result`, params);
  return rows[0]!.result;
}

export async function createAuthUser(
  db: PGlite,
  id: string,
  email: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await db.query(
    `insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
     values ($1, $2, now(), $3, $4)`,
    [id, email, { provider: 'email' }, meta],
  );
}

/** Código SQLSTATE del error de una promesa (o `null` si no falla). */
export async function errorCode(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? 'error';
  }
}
