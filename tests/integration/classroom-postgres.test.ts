// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, describe, expect, it } from 'vitest';
import {
  SupabaseClassroomRepository,
  type RpcClient,
} from '@/features/classroom/infrastructure/supabase-classroom-repository';
import { classroomContract } from '../support/classroom-contract';

/**
 * Migración de la sala en vivo sobre PostgreSQL real (PGlite, Postgres compilado a WASM).
 * Reproduce los roles y privilegios por defecto de Supabase y llama a las funciones como lo
 * hace PostgREST: una transacción por llamada con `set local role`. No sustituye una prueba
 * contra el proyecto remoto (Realtime, red y conexiones simultáneas reales).
 */

const MIGRATION = readFileSync('supabase/migrations/20260924120000_classroom.sql', 'utf8');
const TABLES = ['rooms', 'participants', 'attempts', 'hints', 'results'] as const;

async function supabaseLikeDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    -- Privilegios por defecto de un proyecto Supabase: la migración debe retirarlos.
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  `);
  await db.exec(MIGRATION);
  return db;
}

type Role = 'anon' | 'authenticated' | 'service_role';

function rpcAs(db: PGlite, role: Role): RpcClient {
  return {
    async rpc(fn, params) {
      if (!/^classroom_[a-z_]+$/.test(fn)) throw new Error(`Función no permitida: ${fn}`);
      const names = Object.keys(params);
      const args = names.map((name, index) => `${name} => $${index + 1}`).join(', ');
      const values = names.map((name) => {
        const value = params[name];
        return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
      });
      try {
        const data = await db.transaction(async (tx) => {
          await tx.exec(`set local role ${role}`);
          const result = await tx.query<{ data: unknown }>(
            `select public.${fn}(${args}) as data`,
            values,
          );
          return result.rows[0]?.data ?? null;
        });
        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message } };
      }
    },
  };
}

async function asRole<T>(db: PGlite, role: Role, sql: string): Promise<T[]> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    return (await tx.query<T>(sql)).rows;
  });
}

const database = supabaseLikeDatabase();
afterAll(async () => {
  await (await database).close();
});

classroomContract(
  'PostgreSQL + migración',
  async () => new SupabaseClassroomRepository(rpcAs(await database, 'service_role')),
);

describe('Sala en vivo · seguridad de la base (RLS y privilegios)', () => {
  it('RLS está activa en todas las tablas y no hay políticas que abran acceso', async () => {
    const db = await database;
    const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relname = any($1)`,
      [TABLES],
    );
    expect(rows.rows).toHaveLength(TABLES.length);
    expect(rows.rows.every(({ relrowsecurity }) => relrowsecurity)).toBe(true);
    const policies = await db.query(`select 1 from pg_policies where schemaname = 'public'`);
    expect(policies.rows).toHaveLength(0);
  });

  for (const role of ['anon', 'authenticated'] as const) {
    it(`${role} no lee ni escribe tablas de la sala`, async () => {
      const db = await database;
      for (const table of TABLES) {
        await expect(asRole(db, role, `select * from public.${table}`)).rejects.toThrow(
          /permission denied/,
        );
      }
      await expect(
        asRole(
          db,
          role,
          `insert into public.rooms (join_code, presenter_token_hash, created_at, expires_at)
           values ('AB3K9X', repeat('a', 64), now(), now() + interval '1 hour')`,
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it(`${role} no puede ejecutar las funciones de la sala`, async () => {
      const db = await database;
      const client = new SupabaseClassroomRepository(rpcAs(db, role));
      await expect(client.findRoomByCode('AB3K9X')).rejects.toThrow(
        'La base de la sala no respondió',
      );
      const direct = await rpcAs(db, role).rpc('classroom_find_room_by_code', {
        p_code: 'AB3K9X',
      });
      expect(direct.error?.message).toMatch(/permission denied for function/);
    });
  }

  it('las restricciones rechazan datos fuera de formato aunque lleguen por el servidor', async () => {
    const db = await database;
    const insertRoom = (code: string, hash: string) =>
      asRole(
        db,
        'service_role',
        `insert into public.rooms (join_code, presenter_token_hash, created_at, expires_at)
         values ('${code}', '${hash}', now(), now() + interval '1 hour')`,
      );
    await expect(insertRoom('AB3K9O', 'a'.repeat(64))).rejects.toThrow(/check constraint/);
    await expect(insertRoom('AB3K9X', 'token-en-claro')).rejects.toThrow(/check constraint/);
  });

  it('el mantenimiento caduca salas vencidas y borra las terminadas hace más de 30 días', async () => {
    const db = await database;
    const repository = new SupabaseClassroomRepository(rpcAs(db, 'service_role'));
    const base = Date.UTC(2026, 0, 1);
    const created = await repository.createRoom({
      code: 'MNT234',
      presenterTokenHash: 'b'.repeat(64),
      now: base,
      expiresAt: base + 60_000,
    });
    if (created === 'code-taken') throw new Error('Código ocupado');
    const maintenance = rpcAs(db, 'service_role');
    const first = await maintenance.rpc('classroom_maintenance', {
      p_now: new Date(base + 120_000).toISOString(),
    });
    expect((first.data as { expired: number }).expired).toBeGreaterThanOrEqual(1);
    expect((await repository.findRoomById(created.id))?.status).toBe('expired');
    await maintenance.rpc('classroom_maintenance', {
      p_now: new Date(base + 31 * 24 * 3_600_000).toISOString(),
    });
    expect(await repository.findRoomById(created.id)).toBeNull();
  });

  it('guarda el resultado final por participante al terminar la sala', async () => {
    const db = await database;
    const rows = await asRole<{ total: number }>(
      db,
      'service_role',
      'select count(*)::int as total from public.results',
    );
    // El contrato ya terminó salas con participantes: sus resultados quedaron registrados.
    expect(rows[0]!.total).toBeGreaterThan(0);
  });
});
