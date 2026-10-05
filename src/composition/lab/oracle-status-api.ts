import 'server-only';
import type { OracleQueryExecutor, OracleServiceStatus } from '@/application/oracle-executor';
import { oracleExecutor } from '../oracle/oracle-server';

/** Lectura pública del estado real: no ejecuta SQL del usuario ni revela configuración. */
export async function oracleStatusResponse(
  executor: OracleQueryExecutor = oracleExecutor(),
): Promise<Response> {
  try {
    return Response.json(await executor.status(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    const status: OracleServiceStatus = {
      available: false,
      reason: 'unreachable',
      message: 'No se pudo comprobar la conexión con Oracle.',
    };
    return Response.json(status, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
