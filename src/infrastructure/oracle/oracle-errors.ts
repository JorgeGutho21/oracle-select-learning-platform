import type { OracleExecutionResult } from '@/application/oracle-executor';

/**
 * Traducción de errores de node-oracledb (LAB_SPEC, errores y mensajes). Un código ORA solo
 * se muestra si Oracle lo devolvió; los fallos de conexión, cola o plazo son de
 * infraestructura, no consumen intentos y nunca exponen detalles de la conexión.
 */

type Failure = Exclude<OracleExecutionResult, { status: 'ok' }>;

export interface ClassifiedError {
  readonly result: Failure;
  /** La sesión pudo quedar a mitad de una llamada: se retira del grupo en lugar de reutilizarla. */
  readonly dropConnection: boolean;
}

const UNREACHABLE =
  'No se pudo conectar con Oracle. La consulta no se ejecutó; inténtalo más tarde.';
const TIMEOUT =
  'Oracle no respondió dentro del plazo de ejecución. La consulta no se ejecutó por completo.';
const BUSY = 'El servicio Oracle está ocupado. Espera unos segundos y vuelve a ejecutar.';

// Errores de SQL o de datos con mensaje pedagógico propio.
const ORACLE_MESSAGES: Readonly<Record<string, string>> = {
  'ORA-00904': 'Oracle no reconoce un identificador (columna o alias) de la consulta.',
  'ORA-01476': 'No se puede dividir entre cero; Oracle no devolvió un resultado parcial.',
  'ORA-01722': 'Oracle encontró un valor que no es un número válido en una operación.',
  'ORA-01426': 'El cálculo produce un número demasiado grande para Oracle.',
  'ORA-00923': 'Oracle esperaba la palabra FROM en esa posición.',
  'ORA-00936': 'Falta una expresión en la consulta.',
  'ORA-00907': 'Falta cerrar un paréntesis.',
  'ORA-00933': 'La consulta no terminó correctamente.',
};

// Conexión, credenciales, cuenta o instancia: problema de infraestructura.
const UNREACHABLE_ORA = new Set([
  'ORA-01017', // usuario o contraseña no válidos
  'ORA-01045', // la cuenta no puede iniciar sesión
  'ORA-28000', // cuenta bloqueada
  'ORA-28001', // contraseña caducada
  'ORA-01033',
  'ORA-01034',
  'ORA-01089',
  'ORA-01109',
  'ORA-03113',
  'ORA-03114',
  'ORA-03135',
]);
const BUSY_ORA = new Set(['ORA-00018', 'ORA-00020', 'ORA-12516', 'ORA-12519', 'ORA-12520']);

function codeOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === 'string' && /^(ORA|NJS)-\d+$/.test(code)) return code;
  const match = typeof message === 'string' ? /^(ORA|NJS)-\d{3,5}/.exec(message) : null;
  return match?.[0] ?? '';
}

export function classifyOracleError(error: unknown): ClassifiedError {
  const code = codeOf(error);
  const unavailable = (
    reason: 'unreachable' | 'busy' | 'timeout' | 'not-configured',
    message: string,
    dropConnection = false,
  ): ClassifiedError => ({ result: { status: 'unavailable', reason, message }, dropConnection });

  // Plazo de la llamada agotado (callTimeout) o cancelación: sesión incierta.
  if (code === 'NJS-123' || code === 'ORA-01013') return unavailable('timeout', TIMEOUT, true);
  // Espera en la cola del grupo agotada o cola llena.
  if (code === 'NJS-040') return unavailable('timeout', TIMEOUT);
  if (code === 'NJS-076' || BUSY_ORA.has(code)) return unavailable('busy', BUSY);
  if (code === 'ORA-00942') {
    return unavailable(
      'not-configured',
      'La tabla EMPLEADOS no está disponible para la cuenta del laboratorio. Revisa la configuración de Oracle.',
    );
  }
  if (code.startsWith('NJS-') || UNREACHABLE_ORA.has(code) || /^ORA-12\d{3}$/.test(code)) {
    return unavailable('unreachable', UNREACHABLE, true);
  }
  if (code.startsWith('ORA-')) {
    return {
      result: {
        status: 'oracle-error',
        code,
        message: ORACLE_MESSAGES[code] ?? 'Oracle rechazó la consulta.',
      },
      dropConnection: false,
    };
  }
  // Errores de red del sistema u otros: sin detalles al estudiante.
  return unavailable('unreachable', UNREACHABLE, true);
}
