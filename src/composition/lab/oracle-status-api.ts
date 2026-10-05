import 'server-only';
import type { OracleQueryExecutor, OracleServiceStatus } from '@/application/oracle-executor';
import { oracleExecutor } from '../oracle/oracle-server';

/** Lectura pública del estado real: no ejecuta SQL del usuario ni revela configuración. */
export async function publicOracleStatus(
  executor: OracleQueryExecutor = oracleExecutor(),
): Promise<{ status: OracleServiceStatus; httpStatus: 200 | 503 }> {
  try {
    const { available, reason, message } = await executor.status();
    return { status: { available, reason, message }, httpStatus: 200 };
  } catch {
    const status: OracleServiceStatus = {
      available: false,
      reason: 'unreachable',
      message: 'No se pudo comprobar la conexión con Oracle.',
    };
    return { status, httpStatus: 503 };
  }
}

export async function oracleStatusResponse(
  executor: OracleQueryExecutor = oracleExecutor(),
): Promise<Response> {
  const snapshot = await publicOracleStatus(executor);
  return Response.json(snapshot.status, {
    status: snapshot.httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
