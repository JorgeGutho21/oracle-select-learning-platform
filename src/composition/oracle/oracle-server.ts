import 'server-only';
import type { OracleQueryExecutor } from '@/application/oracle-executor';
import { oracleConfigFromEnv } from '@/infrastructure/oracle/oracle-config';
import { loadOracledb } from '@/infrastructure/oracle/oracledb-driver';
import { OracledbQueryExecutor } from '@/infrastructure/oracle/oracledb-query-executor';
import { UnconfiguredOracleExecutor } from '@/infrastructure/oracle/unconfigured-oracle-executor';

/**
 * Raíz de composición del servicio Oracle (solo servidor). Con ORACLE_USER,
 * ORACLE_PASSWORD y ORACLE_CONNECT_STRING usa el adaptador real; sin ellas, el adaptador
 * que declara «no conectado». Laboratorio, Challenge y sala comparten el mismo grupo.
 */

const store = globalThis as typeof globalThis & { __sqlSelectLabOracle?: OracleQueryExecutor };

function createExecutor(): OracleQueryExecutor {
  const configuration = oracleConfigFromEnv(process.env);
  switch (configuration.kind) {
    case 'configured':
      return new OracledbQueryExecutor(configuration.config, loadOracledb);
    case 'invalid':
      // La causa exacta queda en el registro del servidor; al estudiante, un aviso general.
      console.error(`[oracle] ${configuration.message}`);
      return new UnconfiguredOracleExecutor(
        'La conexión con Oracle no está bien configurada en el servidor. No se ejecutó la consulta.',
      );
    case 'unconfigured':
      return new UnconfiguredOracleExecutor();
  }
}

export function oracleExecutor(): OracleQueryExecutor {
  store.__sqlSelectLabOracle ??= createExecutor();
  return store.__sqlSelectLabOracle;
}
