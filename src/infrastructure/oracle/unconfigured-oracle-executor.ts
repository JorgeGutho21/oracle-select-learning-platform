import type {
  OracleExecutionResult,
  OracleQueryExecutor,
  OracleServiceStatus,
} from '@/application/oracle-executor';

/**
 * Adaptador vigente mientras no exista una instancia Oracle conectada (hito R1). Declara
 * la indisponibilidad de forma explícita: no ejecuta, no simula y no devuelve filas.
 * El adaptador real (node-oracledb, cuenta lectora, grupo de conexiones) lo reemplazará
 * en la composición del servidor sin cambiar el contrato.
 */
export class UnconfiguredOracleExecutor implements OracleQueryExecutor {
  static readonly message =
    'El laboratorio todavía no está conectado a una instancia de Oracle. No se ejecutó la consulta y no se muestran resultados simulados.';

  async status(): Promise<OracleServiceStatus> {
    return {
      available: false,
      reason: 'not-configured',
      message: UnconfiguredOracleExecutor.message,
    };
  }

  async execute(): Promise<OracleExecutionResult> {
    return {
      status: 'unavailable',
      reason: 'not-configured',
      message: UnconfiguredOracleExecutor.message,
    };
  }
}
