// Oracle Autonomous Database (Oracle Cloud) para el despliegue (docs/ORACLE_SETUP.md, opción C).
//
//   node scripts/oracle-cloud.mjs check   comprueba la contraseña de la cartera y la de ADMIN
//   node scripts/oracle-cloud.mjs setup   crea SQL_LAB_V2_OWNER.EMPLEADOS y SQL_LAB_V2_READER
//   node scripts/oracle-cloud.mjs verify  consulta EMPLEADOS con la cuenta lectora
//
// Lee la cartera (ZIP de .secrets/) sin descomprimirla y las contraseñas de
// .env.oracle.local (ORACLE_CLOUD_ADMIN_PASSWORD y ORACLE_CLOUD_WALLET_PASSWORD). Escribe en
// ese mismo archivo las variables de la cuenta lectora (ORACLE_CLOUD_*). Nunca imprime
// contraseñas, cadenas de conexión completas ni el contenido de la cartera.

import { createPrivateKey } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { createLabSchema, OWNER, READER, readEnv, writeEnv } from './oracle-common.mjs';

const SECRETS_ENV = '.env.oracle.local';
const SERVICE_SUFFIX = '_tp'; // Transaction Processing: consultas cortas y concurrentes.

/** Lee un archivo del ZIP de la cartera en memoria (directorio central + deflate). */
function zipEntry(zip, name) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  for (let index = 0; index < count; index += 1) {
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const entryName = zip.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (entryName === name) {
      const method = zip.readUInt16LE(offset + 10);
      const size = zip.readUInt32LE(offset + 20);
      const local = zip.readUInt32LE(offset + 42);
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const data = zip.subarray(start, start + size);
      return method === 8 ? inflateRawSync(data) : data;
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`La cartera no contiene ${name}.`);
}

function wallet() {
  // La cartera más reciente: al descargar otra, la anterior puede seguir en la carpeta.
  const file = readdirSync('.secrets')
    .filter((name) => /^Wallet_.*\.zip$/i.test(name))
    .sort((a, b) => statSync(`.secrets/${b}`).mtimeMs - statSync(`.secrets/${a}`).mtimeMs)[0];
  if (!file) throw new Error('No hay ninguna cartera Wallet_*.zip en .secrets/.');
  const zip = readFileSync(`.secrets/${file}`);
  const pem = zipEntry(zip, 'ewallet.pem').toString('utf8');
  const tns = zipEntry(zip, 'tnsnames.ora').toString('utf8');
  // Descriptor del servicio _tp en una sola línea.
  const match = tns.match(new RegExp(`^(\\w+${SERVICE_SUFFIX})\\s*=\\s*(\\(.+\\))\\s*$`, 'im'));
  if (!match) throw new Error(`tnsnames.ora no tiene un servicio ${SERVICE_SUFFIX}.`);
  return { pem, service: match[1], descriptor: match[2].replace(/\s+/g, '') };
}

function secrets() {
  const env = readEnv(SECRETS_ENV);
  const admin = env.get('ORACLE_CLOUD_ADMIN_PASSWORD')?.trim();
  const walletPassword = env.get('ORACLE_CLOUD_WALLET_PASSWORD')?.trim();
  if (!admin || !walletPassword) {
    throw new Error(
      `Faltan ORACLE_CLOUD_ADMIN_PASSWORD u ORACLE_CLOUD_WALLET_PASSWORD en ${SECRETS_ENV}.`,
    );
  }
  return { admin, walletPassword, env };
}

/** La contraseña de la cartera descifra la clave privada de ewallet.pem. */
function walletPasswordWorks(pem, candidate) {
  const key = pem.match(
    /-----BEGIN ENCRYPTED PRIVATE KEY-----[\s\S]+?-----END ENCRYPTED PRIVATE KEY-----/,
  );
  if (!key) return true; // Cartera sin cifrar.
  try {
    createPrivateKey({ key: key[0], format: 'pem', passphrase: candidate });
    return true;
  } catch {
    return false;
  }
}

async function connect(user, userPassword, w, walletPassword) {
  const oracledb = (await import('oracledb')).default;
  return oracledb.getConnection({
    user,
    password: userPassword,
    connectString: w.descriptor,
    walletContent: w.pem,
    walletPassword,
  });
}

/** Mensaje de error de Oracle sin datos de conexión. */
function describe(error) {
  const text = String(error?.message ?? error);
  return text.split('\n')[0].replace(/\(description=.*$/i, '(descriptor oculto)');
}

async function check() {
  const w = wallet();
  const { admin, walletPassword } = secrets();
  const walletOk = walletPasswordWorks(w.pem, walletPassword);
  // Si la contraseña de la cartera no sirve, se prueba la de ADMIN por si se usó la misma.
  const adminAsWallet = !walletOk && walletPasswordWorks(w.pem, admin);
  console.log(
    `Cartera: ${walletOk ? 'ORACLE_CLOUD_WALLET_PASSWORD descifra ewallet.pem' : adminAsWallet ? 'la contraseña de la cartera es la de ADMIN' : 'ninguna de las dos contraseñas descifra ewallet.pem'}.`,
  );
  if (!walletOk && !adminAsWallet) process.exit(2);
  const effectiveWallet = walletOk ? walletPassword : admin;
  try {
    const connection = await connect('ADMIN', admin, w, effectiveWallet);
    const version = (await connection.execute('SELECT version_full FROM product_component_version'))
      .rows[0][0];
    console.log(`ADMIN: conexión correcta a ${w.service} (Oracle Database ${version}).`);
    await connection.close();
  } catch (error) {
    console.log(`ADMIN: la conexión falló: ${describe(error)}`);
    process.exit(3);
  }
}

async function setup() {
  const w = wallet();
  const { admin, walletPassword } = secrets();
  const effectiveWallet = walletPasswordWorks(w.pem, walletPassword) ? walletPassword : admin;
  const connection = await connect('ADMIN', admin, w, effectiveWallet);
  try {
    const readerPassword = await createLabSchema(connection, { adminSchema: 'ADMIN' });
    // La cuenta de una versión anterior del dataset se conserva con otro nombre: la
    // producción anterior la sigue usando y así se puede volver atrás.
    const env = readEnv(SECRETS_ENV);
    const previous = env.get('ORACLE_CLOUD_USER');
    const kept =
      previous && previous !== READER
        ? [
            ['ORACLE_CLOUD_PREVIOUS_USER', previous],
            ['ORACLE_CLOUD_PREVIOUS_PASSWORD', env.get('ORACLE_CLOUD_PASSWORD') ?? ''],
            ['ORACLE_CLOUD_PREVIOUS_SCHEMA', env.get('ORACLE_CLOUD_SCHEMA') ?? ''],
          ]
        : [];
    writeEnv(
      SECRETS_ENV,
      new Map([
        ...kept,
        ['ORACLE_CLOUD_USER', READER],
        ['ORACLE_CLOUD_PASSWORD', readerPassword],
        ['ORACLE_CLOUD_SCHEMA', OWNER],
        ['ORACLE_CLOUD_CONNECT_STRING', w.descriptor],
        ['ORACLE_CLOUD_WALLET_PEM_BASE64', Buffer.from(w.pem).toString('base64')],
        ['ORACLE_CLOUD_WALLET_PASSWORD', effectiveWallet],
      ]),
      '# Oracle (no versionar).',
    );
    console.log(
      `Listo en ${w.service}: ${OWNER}.EMPLEADOS con 20 filas y ${READER} con CREATE SESSION y READ. Variables ORACLE_CLOUD_* en ${SECRETS_ENV}.`,
    );
  } finally {
    await connection.close();
  }
}

async function verify() {
  const env = readEnv(SECRETS_ENV);
  const w = wallet();
  const connection = await connect(
    env.get('ORACLE_CLOUD_USER'),
    env.get('ORACLE_CLOUD_PASSWORD'),
    w,
    env.get('ORACLE_CLOUD_WALLET_PASSWORD'),
  );
  try {
    await connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${OWNER}`);
    const rows = (await connection.execute('SELECT COUNT(*), SUM(salario) FROM empleados')).rows[0];
    const privileges = (await connection.execute('SELECT privilege FROM session_privs')).rows.map(
      (row) => row[0],
    );
    console.log(
      `${READER}: EMPLEADOS tiene ${rows[0]} filas (suma de salarios ${rows[1]}); privilegios de sistema: ${privileges.join(', ')}.`,
    );
  } finally {
    await connection.close();
  }
}

const command = process.argv[2];
try {
  if (command === 'check') await check();
  else if (command === 'setup') await setup();
  else if (command === 'verify') await verify();
  else {
    console.log('Uso: node scripts/oracle-cloud.mjs check|setup|verify');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(describe(error));
  process.exitCode = 1;
}
