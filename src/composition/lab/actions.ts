'use server';

import type { OracleServiceStatus } from '@/application/oracle-executor';
import {
  executeOnOracle,
  type LabExecution,
} from '@/features/laboratory/application/execute-on-oracle';
import { UnconfiguredOracleExecutor } from '@/infrastructure/oracle/unconfigured-oracle-executor';

/**
 * Ejecución real del laboratorio en el servidor. El adaptador vigente declara que Oracle no
 * está conectado (R1 pendiente); se sustituirá por el adaptador node-oracledb sin cambiar
 * la interfaz. Las Server Functions son accesibles por POST directo: se valida la entrada.
 */

const executor = new UnconfiguredOracleExecutor();

export async function executeLabQuery(sql: string): Promise<LabExecution> {
  if (typeof sql !== 'string')
    return { status: 'rejected', message: 'La consulta no tiene un formato válido.' };
  return executeOnOracle(sql, executor);
}

export async function getLabOracleStatus(): Promise<OracleServiceStatus> {
  return executor.status();
}
