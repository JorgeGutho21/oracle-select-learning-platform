import type { OracleExecutionResult, OracleQueryExecutor } from '@/application/oracle-executor';
import { analyzeSql } from '@/domain/sql/analyzer';
import { renderStatement } from '@/domain/sql/render';

/**
 * Caso de uso «Ejecutar consulta» (ARCHITECTURE): valida con el analizador del subconjunto
 * y solo entonces envía la sentencia canónica al servicio Oracle. Una consulta rechazada
 * nunca llega al motor (LAB_SPEC, SEC01/SEC02).
 */

export type LabExecution =
  OracleExecutionResult | { readonly status: 'rejected'; readonly message: string };

export async function executeOnOracle(
  source: string,
  executor: OracleQueryExecutor,
  requestId?: string,
): Promise<LabExecution> {
  const analysis = analyzeSql(typeof source === 'string' ? source : '');
  const error = analysis.errors[0];
  if (!analysis.ok || !analysis.statement) {
    return {
      status: 'rejected',
      message: error
        ? error.message
        : 'La consulta no es válida dentro del subconjunto de esta unidad.',
    };
  }
  return executor.execute({
    statement: renderStatement(analysis.statement),
    ...(requestId ? { requestId } : {}),
  });
}
