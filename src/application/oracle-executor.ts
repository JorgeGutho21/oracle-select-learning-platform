import type { CellValue } from '@/domain/dataset/empleados';

/**
 * Contrato del servicio de ejecución Oracle (ARCHITECTURE: servicio Oracle separado,
 * cuenta lectora y resultados limitados). Recibe solo sentencias canónicas construidas
 * desde un árbol validado; nunca el texto original del usuario.
 */

export interface OracleExecutionRequest {
  /** Sentencia canónica producida por `renderStatement`. */
  readonly statement: string;
  readonly requestId?: string;
}

export interface OracleColumn {
  readonly name: string;
  readonly type: 'number' | 'text';
}

export type OracleUnavailableReason =
  | 'not-configured'
  | 'unreachable'
  | 'busy'
  | 'timeout'
  /** El resultado supera 100 filas o 100 KB: no se muestra ni se califica (LAB_SPEC). */
  | 'too-large';

export type OracleExecutionResult =
  | {
      readonly status: 'ok';
      readonly columns: readonly OracleColumn[];
      readonly rows: readonly (readonly CellValue[])[];
      readonly elapsedMs: number;
      /** Versión informada por el motor, por ejemplo «Oracle Database 19c». */
      readonly engine: string;
    }
  /** Error devuelto realmente por Oracle, con su código ORA. */
  | { readonly status: 'oracle-error'; readonly code: string; readonly message: string }
  | {
      readonly status: 'unavailable';
      readonly reason: OracleUnavailableReason;
      readonly message: string;
    };

export interface OracleServiceStatus {
  readonly available: boolean;
  readonly reason: OracleUnavailableReason | null;
  readonly message: string;
}

export interface OracleQueryExecutor {
  status(): Promise<OracleServiceStatus>;
  execute(request: OracleExecutionRequest): Promise<OracleExecutionResult>;
}
