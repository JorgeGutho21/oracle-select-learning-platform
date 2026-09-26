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
import { createLabSchema, OWNER, password, READER, readEnv, writeEnv } from './oracle-common.mjs';

const IMAGE = 'container-registry.oracle.com/database/free:latest-lite';
const CONTAINER = 'sql-select-lab-oracle';
const ADMIN_ENV = '.env.oracle.local';
const APP_ENV = '.env.local';
// 1522 por defecto: no choca con una instalación Oracle nativa que ya use 1521.
const PORT = process.env.ORACLE_LOCAL_PORT || '1522';
const CONNECT_STRING = `127.0.0.1:${PORT}/FREEPDB1`;
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
  try {
    const readerPassword = await createLabSchema(connection, { adminSchema: 'SYSTEM' });
    // La cuenta de una versión anterior del dataset se conserva con otro nombre para volver atrás.
    const env = readEnv(APP_ENV);
    const previous = env.get('ORACLE_USER');
    const kept =
      previous && previous !== READER
        ? [
            ['ORACLE_PREVIOUS_USER', previous],
            ['ORACLE_PREVIOUS_PASSWORD', env.get('ORACLE_PASSWORD') ?? ''],
            ['ORACLE_PREVIOUS_SCHEMA', env.get('ORACLE_SCHEMA') ?? ''],
          ]
        : [];
    writeEnv(
      APP_ENV,
      new Map([
        ...kept,
        ['ORACLE_USER', READER],
        ['ORACLE_PASSWORD', readerPassword],
        ['ORACLE_CONNECT_STRING', CONNECT_STRING],
        ['ORACLE_SCHEMA', OWNER],
      ]),
      '# Variables locales (no versionar). Ver .env.example.',
    );
    console.log(
      `Listo: ${OWNER}.EMPLEADOS con 20 filas y ${READER} con CREATE SESSION y READ. Variables en ${APP_ENV}.`,
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
