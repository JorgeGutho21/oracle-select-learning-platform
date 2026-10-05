import type { OracleServiceStatus } from '../application/lab-api';

/** Lectura cancelable al abandonar el laboratorio; la ejecución permanece en el servidor. */
export async function loadOracleStatus(signal?: AbortSignal): Promise<OracleServiceStatus> {
  const response = await fetch('/api/oracle/status', { cache: 'no-store', signal: signal ?? null });
  if (!response.ok) throw new Error('No se pudo comprobar la conexión con Oracle.');
  const status: unknown = await response.json();
  if (
    typeof status !== 'object' ||
    status === null ||
    !('available' in status) ||
    typeof status.available !== 'boolean' ||
    !('message' in status) ||
    typeof status.message !== 'string' ||
    !('reason' in status) ||
    ![null, 'not-configured', 'unreachable', 'busy', 'timeout', 'too-large'].includes(
      status.reason as string | null,
    )
  )
    throw new Error('El servicio no devolvió un estado de Oracle válido.');
  return status as OracleServiceStatus;
}
