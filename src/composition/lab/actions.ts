'use server';

import type { OracleServiceStatus } from '@/application/oracle-executor';
import {
  executeOnOracle,
  type LabExecution,
} from '@/features/laboratory/application/execute-on-oracle';
import { oracleExecutor } from '../oracle/oracle-server';

/**
 * Ejecución real del laboratorio en el servidor con el adaptador que elige el entorno
 * (node-oracledb o «no conectado»). Las Server Functions son accesibles por POST directo:
 * se valida la entrada y el analizador decide qué llega a Oracle.
 */

export async function executeLabQuery(sql: string): Promise<LabExecution> {
  if (typeof sql !== 'string')
    return { status: 'rejected', message: 'La consulta no tiene un formato válido.' };
  return executeOnOracle(sql, oracleExecutor());
}

export async function getLabOracleStatus(): Promise<OracleServiceStatus> {
  return oracleExecutor().status();
}
