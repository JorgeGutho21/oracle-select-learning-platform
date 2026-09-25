/**
 * Configuración del servicio Oracle desde el entorno del servidor (LAB_SPEC, validación y
 * aislamiento). Solo el servidor la lee; ningún valor llega al navegador.
 *
 * Obligatorias: ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING (cuenta lectora).
 * Opcionales: ORACLE_SCHEMA (propietario de EMPLEADOS si no es la cuenta lectora),
 * ORACLE_POOL_MAX (10), ORACLE_QUEUE_MAX (60) y ORACLE_TIMEOUT_MS (5000).
 * Para mTLS (Autonomous Database con cartera): ORACLE_WALLET_PEM_BASE64 (el `ewallet.pem`
 * de la cartera en base64, en una sola línea) y ORACLE_WALLET_PASSWORD, siempre juntas.
 */

export interface OracleConfig {
  readonly user: string;
  readonly password: string;
  readonly connectString: string;
  /** Esquema propietario de EMPLEADOS; se fija como esquema actual de cada sesión. */
  readonly schema: string | null;
  readonly poolMax: number;
  readonly queueMax: number;
  /** Plazo total desde la recepción, incluida la espera en cola. */
  readonly timeoutMs: number;
  /** LAB_SPEC: límite de 100 filas y 100 KB por respuesta. */
  readonly maxRows: number;
  readonly maxBytes: number;
  /** Cartera para mTLS: contenido PEM (cifrado) y su contraseña; `null` sin cartera. */
  readonly wallet: { readonly content: string; readonly password: string } | null;
}

export type OracleConfigResult =
  | { readonly kind: 'configured'; readonly config: OracleConfig }
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'invalid'; readonly message: string };

// Cuentas administrativas que nunca ejecutan SQL de estudiantes (LAB_SPEC, paso 5). ADMIN
// es la cuenta administrativa de Autonomous Database.
const PRIVILEGED_ACCOUNTS = new Set([
  'SYS',
  'SYSTEM',
  'SYSBACKUP',
  'SYSDG',
  'SYSKM',
  'SYSRAC',
  'ADMIN',
]);
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_$#]{0,127}$/;

function integer(value: string | undefined, fallback: number, min: number, max: number) {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export function oracleConfigFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): OracleConfigResult {
  const user = env.ORACLE_USER?.trim() ?? '';
  const password = env.ORACLE_PASSWORD ?? '';
  const connectString = env.ORACLE_CONNECT_STRING?.trim() ?? '';
  if (!user && !password && !connectString) return { kind: 'unconfigured' };
  if (!user || !password || !connectString) {
    return {
      kind: 'invalid',
      message:
        'Faltan variables de Oracle: se necesitan ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING.',
    };
  }
  if (!IDENTIFIER.test(user) || PRIVILEGED_ACCOUNTS.has(user.toUpperCase())) {
    return {
      kind: 'invalid',
      message:
        'ORACLE_USER debe ser una cuenta lectora propia del laboratorio, no una cuenta administrativa.',
    };
  }
  const schema = env.ORACLE_SCHEMA?.trim() || null;
  if (schema !== null && !IDENTIFIER.test(schema)) {
    return { kind: 'invalid', message: 'ORACLE_SCHEMA no es un nombre de esquema válido.' };
  }
  if (schema !== null && schema.toUpperCase() === user.toUpperCase()) {
    return {
      kind: 'invalid',
      message:
        'La cuenta lectora no debe ser la propietaria de EMPLEADOS: deja ORACLE_SCHEMA vacío o usa otra cuenta.',
    };
  }
  const walletBase64 = env.ORACLE_WALLET_PEM_BASE64?.trim() ?? '';
  const walletPassword = env.ORACLE_WALLET_PASSWORD ?? '';
  let wallet: OracleConfig['wallet'] = null;
  if (walletBase64 || walletPassword) {
    const content = walletBase64 ? Buffer.from(walletBase64, 'base64').toString('utf8') : '';
    if (!walletPassword || !content.includes('-----BEGIN')) {
      return {
        kind: 'invalid',
        message:
          'La cartera de Oracle necesita ORACLE_WALLET_PEM_BASE64 (ewallet.pem en base64) y ORACLE_WALLET_PASSWORD.',
      };
    }
    wallet = { content, password: walletPassword };
  }
  const poolMax = integer(env.ORACLE_POOL_MAX, 10, 1, 50);
  const queueMax = integer(env.ORACLE_QUEUE_MAX, 60, 0, 500);
  const timeoutMs = integer(env.ORACLE_TIMEOUT_MS, 5000, 500, 30_000);
  if (poolMax === null || queueMax === null || timeoutMs === null) {
    return {
      kind: 'invalid',
      message: 'ORACLE_POOL_MAX, ORACLE_QUEUE_MAX u ORACLE_TIMEOUT_MS no tienen un valor válido.',
    };
  }
  return {
    kind: 'configured',
    config: {
      user,
      password,
      connectString,
      schema: schema?.toUpperCase() ?? null,
      poolMax,
      queueMax,
      timeoutMs,
      maxRows: 100,
      maxBytes: 100 * 1024,
      wallet,
    },
  };
}
