import type {
  OracleColumn,
  OracleExecutionRequest,
  OracleExecutionResult,
  OracleQueryExecutor,
  OracleServiceStatus,
} from '@/application/oracle-executor';
import { EMPLEADOS_DATASET, type CellValue } from '@/domain/dataset/empleados';
import type { OracleConfig } from './oracle-config';
import { classifyOracleError } from './oracle-errors';

/**
 * Adaptador Oracle real con node-oracledb en modo Thin (sin Oracle Client). Grupo de
 * conexiones con cuenta lectora, cola acotada y plazo total que incluye la espera; la
 * sesión que se interrumpe a mitad de una llamada se retira del grupo (LAB_SPEC, paso 7).
 * Recibe solo sentencias canónicas construidas desde el árbol validado.
 */

export interface OracleColumnMetadata {
  readonly name: string;
  readonly dbTypeName?: string;
  readonly dbType?: unknown;
}

export interface OracleConnectionLike {
  callTimeout: number;
  readonly oracleServerVersionString?: string;
  execute(
    sql: string,
    binds: readonly unknown[],
    options: Record<string, unknown>,
  ): Promise<{
    readonly metaData?: readonly OracleColumnMetadata[];
    readonly rows?: readonly (readonly unknown[])[];
  }>;
  close(options?: { drop?: boolean }): Promise<void>;
}

export interface OraclePoolLike {
  getConnection(): Promise<OracleConnectionLike>;
  close(drainTime?: number): Promise<void>;
}

/** Parte de `oracledb` que usa el adaptador; las pruebas la sustituyen sin credenciales. */
export interface OracleDriver {
  createPool(attributes: Record<string, unknown>): Promise<OraclePoolLike>;
  readonly OUT_FORMAT_ARRAY: number;
  readonly DB_TYPE_NUMBER: unknown;
  readonly STRING: unknown;
}

const NUMERIC_TYPES = new Set([
  'NUMBER',
  'FLOAT',
  'BINARY_FLOAT',
  'BINARY_DOUBLE',
  'BINARY_INTEGER',
]);
const HEALTH_OK_MS = 30_000;
const HEALTH_RETRY_MS = 5_000;
// Privilegios de sistema que puede tener la cuenta lectora; cualquier otro la invalida.
const ALLOWED_SYSTEM_PRIVILEGES = new Set(['CREATE SESSION']);
const ALLOWED_TABLE_PRIVILEGES = new Set(['SELECT', 'READ']);

/** Texto decimal de Oracle a número de JavaScript solo si no pierde precisión. */
function decimalCell(text: string): CellValue {
  const value = Number(text);
  if (!Number.isFinite(value)) return text;
  const canonical = (raw: string) => {
    const negative = raw.startsWith('-');
    let digits = raw.replace(/^[-+]/, '');
    if (digits.includes('.')) digits = digits.replace(/0+$/, '').replace(/\.$/, '');
    digits = digits.replace(/^0+(?=\d)/, '');
    return `${negative && digits !== '0' ? '-' : ''}${digits}`;
  };
  const roundTrip = /e/i.test(String(value)) ? null : String(value);
  return roundTrip !== null && canonical(roundTrip) === canonical(text) ? value : text;
}

function toCell(value: unknown, numeric: boolean): CellValue {
  if (value === null || value === undefined) return '';
  if (numeric && typeof value === 'string') return decimalCell(value);
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

function engineName(version: string | undefined): string {
  const major = version?.split('.')[0];
  return major ? `Oracle Database ${major} (${version})` : 'Oracle Database';
}

export class OracledbQueryExecutor implements OracleQueryExecutor {
  private pool: Promise<OraclePoolLike> | null = null;
  private health: { readonly at: number; readonly status: OracleServiceStatus } | null = null;

  constructor(
    private readonly config: OracleConfig,
    private readonly loadDriver: () => Promise<OracleDriver>,
    private readonly now: () => number = () => Date.now(),
  ) {}

  private getPool(): Promise<OraclePoolLike> {
    this.pool ??= this.loadDriver()
      .then((driver) =>
        driver.createPool({
          user: this.config.user,
          password: this.config.password,
          connectString: this.config.connectString,
          poolMin: 0,
          poolMax: this.config.poolMax,
          poolIncrement: 1,
          queueMax: this.config.queueMax,
          queueTimeout: this.config.timeoutMs,
          poolTimeout: 60,
          poolPingInterval: 60,
          stmtCacheSize: 30,
          // mTLS de Autonomous Database: la cartera llega como texto, sin archivos en disco.
          ...(this.config.wallet
            ? {
                walletContent: this.config.wallet.content,
                walletPassword: this.config.wallet.password,
              }
            : {}),
          ...(this.config.schema
            ? {
                sessionCallback: (
                  connection: OracleConnectionLike,
                  _tag: string,
                  done: (error?: unknown) => void,
                ) => {
                  // El nombre se validó como identificador en la configuración.
                  connection
                    .execute(`ALTER SESSION SET CURRENT_SCHEMA = ${this.config.schema}`, [], {})
                    .then(() => done(), done);
                },
              }
            : {}),
        }),
      )
      .catch((error: unknown) => {
        // Sin grupo no hay nada que reutilizar: el próximo intento vuelve a crearlo.
        this.pool = null;
        throw error;
      });
    return this.pool;
  }

  private async withConnection<T>(
    deadline: number,
    work: (connection: OracleConnectionLike, driver: OracleDriver) => Promise<T>,
  ): Promise<T> {
    const driver = await this.loadDriver();
    const pool = await this.getPool();
    const connection = await pool.getConnection();
    let drop = false;
    try {
      const remaining = deadline - this.now();
      if (remaining <= 0) {
        drop = false;
        throw Object.assign(new Error('NJS-040: plazo agotado en la cola'), { code: 'NJS-040' });
      }
      connection.callTimeout = remaining;
      return await work(connection, driver);
    } catch (error) {
      drop = classifyOracleError(error).dropConnection;
      throw error;
    } finally {
      // node-oracledb rechaza `close(undefined)`: sin argumento, la conexión vuelve al grupo.
      await (drop ? connection.close({ drop: true }) : connection.close()).catch(() => undefined);
    }
  }

  private async query(
    connection: OracleConnectionLike,
    driver: OracleDriver,
    statement: string,
    maxRows: number,
  ) {
    const result = await connection.execute(statement, [], {
      outFormat: driver.OUT_FORMAT_ARRAY,
      // Una fila más que el límite para saber si la respuesta se truncaría.
      maxRows: maxRows + 1,
      // NUMBER como texto decimal: no pasa por el redondeo binario del driver.
      fetchTypeHandler: (metadata: OracleColumnMetadata) =>
        metadata.dbType === driver.DB_TYPE_NUMBER ? { type: driver.STRING } : undefined,
    });
    const columns: OracleColumn[] = (result.metaData ?? []).map((column) => ({
      name: column.name,
      type: NUMERIC_TYPES.has((column.dbTypeName ?? '').toUpperCase()) ? 'number' : 'text',
    }));
    const numeric = columns.map(({ type }) => type === 'number');
    const rows = (result.rows ?? []).map((row) =>
      row.map((value, index) => toCell(value, numeric[index] ?? false)),
    );
    return { columns, rows };
  }

  async execute(request: OracleExecutionRequest): Promise<OracleExecutionResult> {
    const started = this.now();
    const deadline = started + this.config.timeoutMs;
    try {
      return await this.withConnection(deadline, async (connection, driver) => {
        const { columns, rows } = await this.query(
          connection,
          driver,
          request.statement,
          this.config.maxRows,
        );
        if (
          rows.length > this.config.maxRows ||
          JSON.stringify(rows).length > this.config.maxBytes
        ) {
          return {
            status: 'unavailable',
            reason: 'too-large',
            message: `El resultado supera el límite de ${this.config.maxRows} filas o 100 KB: no se muestra ni se califica.`,
          } as const;
        }
        return {
          status: 'ok',
          columns,
          rows,
          elapsedMs: Math.max(0, Math.round(this.now() - started)),
          engine: engineName(connection.oracleServerVersionString),
        } as const;
      });
    } catch (error) {
      return classifyOracleError(error).result;
    }
  }

  /**
   * Salud real (ARCHITECTURE): leer EMPLEADOS, comprobar que coincide con el dataset
   * versionado y que la cuenta solo tiene permisos de lectura. Se guarda unos segundos.
   */
  async status(): Promise<OracleServiceStatus> {
    const now = this.now();
    if (
      this.health &&
      now - this.health.at < (this.health.status.available ? HEALTH_OK_MS : HEALTH_RETRY_MS)
    ) {
      return this.health.status;
    }
    const status = await this.checkHealth(now + this.config.timeoutMs);
    this.health = { at: this.now(), status };
    return status;
  }

  private async checkHealth(deadline: number): Promise<OracleServiceStatus> {
    try {
      return await this.withConnection(deadline, async (connection, driver) => {
        const privileges = await this.query(
          connection,
          driver,
          'SELECT privilege FROM session_privs',
          200,
        );
        const extra = privileges.rows
          .map(([privilege]) => String(privilege))
          .filter((privilege) => !ALLOWED_SYSTEM_PRIVILEGES.has(privilege));
        const owned = await this.query(connection, driver, 'SELECT COUNT(*) FROM user_tables', 1);
        const tablePrivileges = await this.query(
          connection,
          driver,
          "SELECT privilege FROM user_tab_privs_recd WHERE table_name = 'EMPLEADOS'",
          20,
        );
        const extraOnTable = tablePrivileges.rows
          .map(([privilege]) => String(privilege))
          .filter((privilege) => !ALLOWED_TABLE_PRIVILEGES.has(privilege));
        if (extra.length > 0 || Number(owned.rows[0]?.[0] ?? 0) > 0 || extraOnTable.length > 0) {
          return {
            available: false,
            reason: 'not-configured',
            message:
              'La cuenta de Oracle del laboratorio tiene más permisos que la lectura de EMPLEADOS. Por seguridad no se ejecutan consultas.',
          };
        }
        const table = await this.query(
          connection,
          driver,
          'SELECT ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO FROM EMPLEADOS ORDER BY ID',
          EMPLEADOS_DATASET.rows.length + 1,
        );
        const expected = EMPLEADOS_DATASET.rows.map((row) => [
          row.ID,
          row.NOMBRE,
          row.EDAD,
          row.CIUDAD,
          row.SALARIO,
          row.DEPTO,
        ]);
        if (JSON.stringify(table.rows) !== JSON.stringify(expected)) {
          return {
            available: false,
            reason: 'not-configured',
            message: `La tabla EMPLEADOS de Oracle no coincide con el dataset ${EMPLEADOS_DATASET.id}.`,
          };
        }
        return {
          available: true,
          reason: null,
          message: `${engineName(connection.oracleServerVersionString)} conectado con el dataset ${EMPLEADOS_DATASET.id}.`,
        };
      });
    } catch (error) {
      const { result } = classifyOracleError(error);
      return result.status === 'unavailable'
        ? { available: false, reason: result.reason, message: result.message }
        : { available: false, reason: 'unreachable', message: result.message };
    }
  }

  /** Cierra el grupo (fin del proceso o pruebas). */
  async close(): Promise<void> {
    const pool = this.pool;
    this.pool = null;
    if (pool) await (await pool).close(0).catch(() => undefined);
  }
}
