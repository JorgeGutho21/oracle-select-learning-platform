import type {
  OracleExecutionResult,
  OracleQueryExecutor,
  OracleServiceStatus,
} from '@/application/oracle-executor';

/**
 * Adaptador cuando no hay una instancia Oracle configurada (o la configuración no es
 * válida). Declara la indisponibilidad de forma explícita: no ejecuta, no simula y no
 * devuelve filas. El adaptador real es `OracledbQueryExecutor`.
 */
export class UnconfiguredOracleExecutor implements OracleQueryExecutor {
  static readonly message =
    'El laboratorio todavía no está conectado a una instancia de Oracle. No se ejecutó la consulta y no se muestran resultados simulados.';

  constructor(private readonly message: string = UnconfiguredOracleExecutor.message) {}

  async status(): Promise<OracleServiceStatus> {
    return { available: false, reason: 'not-configured', message: this.message };
  }

  async execute(): Promise<OracleExecutionResult> {
    return { status: 'unavailable', reason: 'not-configured', message: this.message };
  }
}
