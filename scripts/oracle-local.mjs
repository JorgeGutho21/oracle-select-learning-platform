// Oracle Database Free local para desarrollo y pruebas (docs/ORACLE_SETUP.md).
//
//   node scripts/oracle-local.mjs up      crea o inicia el contenedor y espera a la base
//   node scripts/oracle-local.mjs setup   crea las cuentas y EMPLEADOS; escribe .env.local
//   node scripts/oracle-local.mjs status  estado del contenedor
//   node scripts/oracle-local.mjs down    detiene el contenedor (conserva los datos)
//
// Motor de contenedores: Docker si su motor responde; si no, en Windows, Podman dentro de la
// distribución de WSL (ORACLE_LOCAL_WSL_DISTRO, «Ubuntu» por defecto). ORACLE_LOCAL_ENGINE
// fuerza «docker» o «wsl-podman».
//
// Las contraseñas se generan al azar, se guardan solo en archivos ignorados por Git
// (.env.oracle.local y .env.local) y nunca se imprimen ni van en la línea de comandos.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const IMAGE = 'container-registry.oracle.com/database/free:latest-lite';
const CONTAINER = 'sql-select-lab-oracle';
const ADMIN_ENV = '.env.oracle.local';
const APP_ENV = '.env.local';
// 1522 por defecto: no choca con una instalación Oracle nativa que ya use 1521.
const PORT = process.env.ORACLE_LOCAL_PORT || '1522';
const CONNECT_STRING = `127.0.0.1:${PORT}/FREEPDB1`;
const OWNER = 'SQL_LAB_OWNER';
const READER = 'SQL_LAB_READER';
const DISTRO = process.env.ORACLE_LOCAL_WSL_DISTRO || 'Ubuntu';

function works(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30_000 });
  return result.status === 0 && result.stdout.trim() !== '';
}

function detectEngine() {
  const forced = process.env.ORACLE_LOCAL_ENGINE;
  const docker = { name: 'Docker', command: 'docker', prefix: [] };
  const wslPodman = {
    name: `Podman en WSL (${DISTRO})`,
    command: 'wsl',
    prefix: ['-d', DISTRO, '-u', 'root', '--', 'podman'],
  };
  if (forced === 'docker') return docker;
  if (forced === 'wsl-podman') return wslPodman;
  if (works('docker', ['version', '--format', '{{.Server.Version}}'])) return docker;
  if (process.platform === 'win32' && works('wsl', [...wslPodman.prefix, '--version'])) {
    return wslPodman;
  }
  throw new Error(
    'No hay un motor de contenedores disponible: inicia Docker Desktop o instala Podman en WSL (docs/ORACLE_SETUP.md).',
  );
}

let engine = null;
function run(args, { env, inherit = false } = {}) {
  engine ??= detectEngine();
  const result = spawnSync(engine.command, [...engine.prefix, ...args], {
    encoding: 'utf8',
    env: env ? { ...process.env, ...env } : process.env,
    stdio: inherit ? ['ignore', 'inherit', 'inherit'] : ['ignore', 'pipe', 'pipe'],
  });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

function password() {
  // Letras y dígitos, empieza por letra: válido sin comillas especiales en Oracle.
  const body = randomBytes(24)
    .toString('base64url')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 20);
  return `P${body}9x`;
}

function readEnv(path) {
  if (!existsSync(path)) return new Map();
  const entries = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]);
  return new Map(entries);
}

function writeEnv(path, values, header) {
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

function containerState() {
  const result = run(['inspect', '-f', '{{.State.Status}}', CONTAINER]);
  return result.ok ? result.output : null;
}

async function waitUntilReady() {
  const started = Date.now();
  while (Date.now() - started < 20 * 60 * 1000) {
    // La imagen declara un healthcheck: «healthy» cuando la base y FREEPDB1 están abiertas.
    const health = run(['inspect', '-f', '{{.State.Health.Status}}', CONTAINER]).output;
    const { output } = run(['logs', '--tail', '200', CONTAINER]);
    if (health === 'healthy') return;
    if (/DATABASE SETUP WAS NOT SUCCESSFUL/.test(output)) {
      throw new Error(
        'La base del contenedor no pudo crearse; revisa los registros del contenedor.',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('La base no quedó lista en 20 minutos.');
}

async function up() {
  engine ??= detectEngine();
  console.log(`Motor de contenedores: ${engine.name}.`);
  const state = containerState();
  if (state === null) {
    let adminPassword = readEnv(ADMIN_ENV).get('ORACLE_PWD');
    if (!adminPassword) {
      adminPassword = password();
      writeEnv(
        ADMIN_ENV,
        new Map([['ORACLE_PWD', adminPassword]]),
        '# Oracle local: contraseña de administración (no versionar)',
      );
    }
    console.log(`Creando ${CONTAINER} con ${IMAGE} (solo en 127.0.0.1:${PORT})…`);
    // `-e ORACLE_PWD` sin valor toma la variable del entorno; WSLENV la pasa a WSL.
    const created = run(
      ['run', '-d', '--name', CONTAINER, '-p', `127.0.0.1:${PORT}:1521`, '-e', 'ORACLE_PWD', IMAGE],
      { env: { ORACLE_PWD: adminPassword, WSLENV: 'ORACLE_PWD/u' }, inherit: true },
    );
    if (!created.ok) throw new Error('No se pudo crear el contenedor de Oracle.');
  } else if (state !== 'running') {
    if (!run(['start', CONTAINER]).ok) throw new Error('No se pudo iniciar el contenedor.');
  }
  console.log('Esperando a que la base esté lista…');
  await waitUntilReady();
  console.log('Oracle Database Free listo en', CONNECT_STRING);
}

async function setup() {
  const adminPassword = readEnv(ADMIN_ENV).get('ORACLE_PWD');
  if (!adminPassword) throw new Error(`Falta ${ADMIN_ENV}: ejecuta primero «up».`);
  const oracledb = (await import('oracledb')).default;
  // El servicio FREEPDB1 se registra en el listener unos segundos después de «listo».
  let connection = null;
  for (let tries = 0; !connection; tries += 1) {
    try {
      connection = await oracledb.getConnection({
        user: 'SYSTEM',
        password: adminPassword,
        connectString: CONNECT_STRING,
      });
    } catch (error) {
      // Listener sin el servicio todavía o PDB aún cerrada: se reintenta durante dos minutos.
      if (tries >= 24 || !/^(NJS-5\d\d|ORA-01109|ORA-01033)/.test(String(error?.message))) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  const execute = (sql) => connection.execute(sql);
  const exists = async (user) =>
    (await connection.execute('SELECT COUNT(*) FROM dba_users WHERE username = :u', [user]))
      .rows[0][0] > 0;
  try {
    for (const user of [READER, OWNER]) {
      if (await exists(user)) await execute(`DROP USER ${user} CASCADE`);
    }
    // Tablespace permanente por defecto de la base (la imagen «lite» no incluye USERS).
    const tablespace = (
      await connection.execute(
        "SELECT property_value FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE'",
      )
    ).rows[0][0];
    if (!/^[A-Z][A-Z0-9_$#]*$/.test(tablespace))
      throw new Error('Tablespace por defecto no válido.');
    // Propietario sin inicio de sesión: solo contiene la tabla.
    await execute(
      `CREATE USER ${OWNER} NO AUTHENTICATION DEFAULT TABLESPACE ${tablespace} QUOTA 10M ON ${tablespace}`,
    );
    await execute(`ALTER SESSION SET CURRENT_SCHEMA = ${OWNER}`);
    const script = readFileSync('oracle/empleados-select-v1.sql', 'utf8')
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(/;\s*(?:\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of script) await execute(statement);
    await execute('ALTER SESSION SET CURRENT_SCHEMA = SYSTEM');
    // Cuenta lectora: iniciar sesión y leer EMPLEADOS; READ impide bloqueos FOR UPDATE.
    const readerPassword = password();
    await execute(
      `CREATE USER ${READER} IDENTIFIED BY "${readerPassword}" DEFAULT TABLESPACE ${tablespace}`,
    );
    await execute(`GRANT CREATE SESSION TO ${READER}`);
    await execute(`GRANT READ ON ${OWNER}.EMPLEADOS TO ${READER}`);
    writeEnv(
      APP_ENV,
      new Map([
        ['ORACLE_USER', READER],
        ['ORACLE_PASSWORD', readerPassword],
        ['ORACLE_CONNECT_STRING', CONNECT_STRING],
        ['ORACLE_SCHEMA', OWNER],
      ]),
      '# Variables locales (no versionar). Ver .env.example.',
    );
    console.log(
      `Listo: ${OWNER}.EMPLEADOS con 6 filas y ${READER} con CREATE SESSION y READ. Variables en ${APP_ENV}.`,
    );
  } finally {
    await connection.close();
  }
}

const command = process.argv[2];
try {
  if (command === 'up') await up();
  else if (command === 'setup') await setup();
  else if (command === 'status') console.log(containerState() ?? 'no existe');
  else if (command === 'down') run(['stop', CONTAINER]);
  else {
    console.log('Uso: node scripts/oracle-local.mjs up|setup|status|down');
    process.exitCode = 1;
  }
} catch (error) {
  // Sin credenciales en el mensaje: solo la causa.
  console.error(error instanceof Error ? error.message.split('\n')[0] : 'Error inesperado');
  process.exitCode = 1;
}
