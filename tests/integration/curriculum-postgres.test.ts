// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EMPLEADOS_DATASET, rowValues } from '@/domain/dataset/empleados';
import { EMPRESA_TABLES, empresaStatements } from '@/domain/dataset/empresa';
import { VERIFIED } from '@/features/curriculum/application/verified-results';
import { ALL_EXAMPLES } from '@/features/curriculum/domain/registry';
import type { QueryExample, SourceView } from '@/features/curriculum/domain/types';

/**
 * Comprobación cruzada sin Oracle (siempre corre): cada consulta del currículo se ejecuta en
 * PostgreSQL (PGlite) sobre los mismos datos y debe devolver lo mismo que Oracle devolvió
 * (`application/oracle-results.json`). Además comprueba que las filas de origen que muestra la
 * interfaz bastan para obtener ese resultado: lo que se ve antes explica lo que se ve después.
 *
 * Es una red de seguridad, no un sustituto de Oracle: las construcciones propias de Oracle
 * (NVL2, SYSDATE, concatenación con NULL…) se omiten aquí y solo las valida Oracle real.
 */

const ORACLE_ONLY = /\b(NVL2|SYSDATE|DUAL|ROWNUM|DECODE|TO_CHAR|MONTHS_BETWEEN|ADD_MONTHS)\b|\|\|/i;

const queries = ALL_EXAMPLES.filter(
  (example): example is QueryExample => example.kind === 'query' && !ORACLE_ONLY.test(example.sql),
);

/** Oracle → PostgreSQL para el subconjunto del currículo. */
function postgresSql(sql: string): string {
  return sql
    .trim()
    .replace(/;$/, '')
    .replace(/\bMINUS\b/gi, 'EXCEPT')
    .replace(/\bNVL\s*\(/gi, 'COALESCE(');
}

function normalizeCell(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return Number(value.toPrecision(12));
  const text = String(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(Number(text).toPrecision(12));
  return text;
}

function normalizeRows(rows: readonly (readonly unknown[])[]): (string | number | null)[][] {
  return rows.map((row) => row.map(normalizeCell));
}

const EMPLEADOS_V2_DDL = `CREATE TABLE empleados (${EMPLEADOS_DATASET.columns
  .map(
    ({ name, type }) =>
      `${name} ${type === 'number' ? 'numeric' : type === 'date' ? 'date' : 'varchar(60)'}`,
  )
  .join(', ')})`;

function literal(value: string | number | null, type: string): string {
  if (value === null) return 'NULL';
  if (type === 'number') return String(value);
  if (type === 'date') return `DATE '${value}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function loadRestricted(db: PGlite, schema: string, sources: readonly SourceView[]) {
  await db.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`);
  for (const table of EMPRESA_TABLES) {
    // LIKE copia columnas y NOT NULL, sin claves foráneas: un subconjunto puede no tenerlas.
    await db.exec(`CREATE TABLE ${schema}.${table.name} (LIKE public.${table.name})`);
    const view = sources.find((entry) => entry.table === table.name);
    const keys = view?.keys ? new Set(view.keys) : null;
    const rows = keys ? table.rows.filter((row) => keys.has(row[0] as number)) : table.rows;
    for (const row of rows) {
      await db.exec(
        `INSERT INTO ${schema}.${table.name} VALUES (${row
          .map((value, index) => literal(value, table.columns[index]!.type))
          .join(', ')})`,
      );
    }
  }
}

async function loadRestrictedEmpleados(db: PGlite, sources: readonly SourceView[]) {
  await db.exec('DROP SCHEMA IF EXISTS rv2 CASCADE; CREATE SCHEMA rv2;');
  await db.exec(EMPLEADOS_V2_DDL.replace('CREATE TABLE empleados', 'CREATE TABLE rv2.empleados'));
  const keys = sources[0]?.keys ? new Set(sources[0].keys) : null;
  for (const row of EMPLEADOS_DATASET.rows) {
    if (keys && !keys.has(row.ID_EMPLEADO)) continue;
    const values = rowValues(EMPLEADOS_DATASET, row);
    await db.exec(
      `INSERT INTO rv2.empleados VALUES (${values
        .map((value, index) => literal(value, EMPLEADOS_DATASET.columns[index]!.type))
        .join(', ')})`,
    );
  }
}

describe('PostgreSQL (PGlite) · currículo frente a los resultados de Oracle', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    for (const statement of empresaStatements('postgres')) await db.exec(statement);
    await db.exec('CREATE SCHEMA v2');
    await db.exec(EMPLEADOS_V2_DDL.replace('CREATE TABLE empleados', 'CREATE TABLE v2.empleados'));
    for (const row of EMPLEADOS_DATASET.rows) {
      const values = rowValues(EMPLEADOS_DATASET, row);
      await db.exec(
        `INSERT INTO v2.empleados VALUES (${values
          .map((value, index) => literal(value, EMPLEADOS_DATASET.columns[index]!.type))
          .join(', ')})`,
      );
    }
  }, 60_000);

  afterAll(async () => {
    await db?.close();
  });

  async function run(sql: string, searchPath: string) {
    await db.exec(`SET search_path TO ${searchPath}`);
    const result = await db.query<Record<string, unknown>>(postgresSql(sql), [], {
      rowMode: 'array',
    });
    return normalizeRows(result.rows as unknown as unknown[][]);
  }

  it.each(queries.map((example) => [example.id, example] as const))(
    '%s',
    async (_id, example) => {
      const oracle = VERIFIED.results[example.id];
      const base = example.dataset === 'empleados-v2' ? 'v2' : 'public';
      if (example.expectError) {
        await expect(
          run(example.sql, base),
          `${example.id} también falla en PostgreSQL`,
        ).rejects.toThrow();
        return;
      }
      expect(oracle?.kind).toBe('query');
      if (oracle?.kind !== 'query') return;
      const expected = normalizeRows(oracle.table.rows);
      const sort = (rows: unknown[][]) =>
        example.unordered ? [...rows].map((row) => JSON.stringify(row)).sort() : rows;
      expect(sort(await run(example.sql, base)), 'mismo resultado que Oracle').toEqual(
        sort(expected),
      );
      if (example.sources.some((view) => view.keys)) {
        if (example.dataset === 'empleados-v2') {
          await loadRestrictedEmpleados(db, example.sources);
          expect(sort(await run(example.sql, 'rv2')), 'las filas mostradas bastan').toEqual(
            sort(expected),
          );
        } else {
          await loadRestricted(db, 'r', example.sources);
          expect(sort(await run(example.sql, 'r')), 'las filas mostradas bastan').toEqual(
            sort(expected),
          );
        }
      }
    },
    20_000,
  );
});
