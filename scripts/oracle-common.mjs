// Utilidades compartidas por scripts/oracle-local.mjs y scripts/oracle-cloud.mjs: archivos
// .env ignorados por Git, contraseñas aleatorias y el esquema del laboratorio. Nada de lo
// que se lee o genera aquí se imprime.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Dataset v2 en esquemas propios: el esquema v1 (SQL_LAB_OWNER / SQL_LAB_READER) sigue
// intacto mientras la producción anterior lo use.
export const DATASET_FILE = 'oracle/empleados-select-v2.sql';
export const OWNER = 'SQL_LAB_V2_OWNER';
export const READER = 'SQL_LAB_V2_READER';

/** Letras y dígitos, con mayúscula, minúscula y número: válida sin comillas en Oracle. */
export function password() {
  const body = randomBytes(24)
    .toString('base64url')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 20);
  return `P${body}9x`;
}

export function readEnv(path) {
  if (!existsSync(path)) return new Map();
  const entries = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]);
  return new Map(entries);
}

/** Sustituye o añade las variables dadas y conserva el resto del archivo. */
export function writeEnv(path, values, header) {
  const current = existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/) : [];
  const kept = current.filter(
    (line) => !values.has(line.slice(0, line.indexOf('='))) && line.trim() !== '',
  );
  const lines = [
    ...(kept.length ? kept : [header]),
    ...[...values].map(([key, value]) => `${key}=${value}`),
  ];
  writeFileSync(path, `${lines.join('\n')}\n`, { mode: 0o600 });
}

/** Sentencias del script del dataset vigente, sin comentarios. */
export function datasetStatements() {
  return readFileSync(DATASET_FILE, 'utf8')
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

/**
 * Crea desde cero el esquema del laboratorio con una conexión administrativa:
 * - OWNER sin inicio de sesión, dueño de EMPLEADOS (dataset versionado);
 * - READER con solo CREATE SESSION y READ sobre EMPLEADOS (READ impide
 *   SELECT … FOR UPDATE).
 * Devuelve la contraseña nueva de la cuenta lectora.
 */
export async function createLabSchema(connection, { adminSchema }) {
  const execute = (sql) => connection.execute(sql);
  const exists = async (user) =>
    (await connection.execute('SELECT COUNT(*) FROM dba_users WHERE username = :u', [user]))
      .rows[0][0] > 0;
  for (const user of [READER, OWNER]) {
    if (await exists(user)) await execute(`DROP USER ${user} CASCADE`);
  }
  // Tablespace permanente por defecto (la imagen «lite» no incluye USERS; Autonomous usa DATA).
  const tablespace = (
    await connection.execute(
      "SELECT property_value FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE'",
    )
  ).rows[0][0];
  if (!/^[A-Z][A-Z0-9_$#]*$/.test(tablespace)) throw new Error('Tablespace por defecto no válido.');
  await execute(
    `CREATE USER ${OWNER} NO AUTHENTICATION DEFAULT TABLESPACE ${tablespace} QUOTA 10M ON ${tablespace}`,
  );
  await execute(`ALTER SESSION SET CURRENT_SCHEMA = ${OWNER}`);
  for (const statement of datasetStatements()) await execute(statement);
  await execute(`ALTER SESSION SET CURRENT_SCHEMA = ${adminSchema}`);
  const readerPassword = password();
  await execute(
    `CREATE USER ${READER} IDENTIFIED BY "${readerPassword}" DEFAULT TABLESPACE ${tablespace}`,
  );
  await execute(`GRANT CREATE SESSION TO ${READER}`);
  await execute(`GRANT READ ON ${OWNER}.EMPLEADOS TO ${READER}`);
  return readerPassword;
}

// Esquema de verificación del currículo (secciones 2 y 3): solo para desarrollo y pruebas.
// Puede crear tablas, procedimientos y triggers en su propio esquema; las pruebas cargan y
// reinician ahí el dataset empresa-relacional-v1. La aplicación desplegada no lo usa.
export const CURRICULUM_USER = 'DBLAB_CURRICULO';

/** Crea desde cero la cuenta de verificación del currículo. Devuelve su contraseña. */
export async function createCurriculumSandbox(connection) {
  const exists =
    (
      await connection.execute('SELECT COUNT(*) FROM dba_users WHERE username = :u', [
        CURRICULUM_USER,
      ])
    ).rows[0][0] > 0;
  if (exists) await connection.execute(`DROP USER ${CURRICULUM_USER} CASCADE`);
  const tablespace = (
    await connection.execute(
      "SELECT property_value FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE'",
    )
  ).rows[0][0];
  if (!/^[A-Z][A-Z0-9_$#]*$/.test(tablespace)) throw new Error('Tablespace por defecto no válido.');
  const secret = password();
  await connection.execute(
    `CREATE USER ${CURRICULUM_USER} IDENTIFIED BY "${secret}" DEFAULT TABLESPACE ${tablespace} QUOTA 20M ON ${tablespace}`,
  );
  await connection.execute(
    `GRANT CREATE SESSION, CREATE TABLE, CREATE PROCEDURE, CREATE TRIGGER, CREATE SEQUENCE, CREATE VIEW TO ${CURRICULUM_USER}`,
  );
  return secret;
}
