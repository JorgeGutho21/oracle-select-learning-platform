import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { empresaStatements, EMPRESA_TABLES } from '@/domain/dataset/empresa';
import type {
  CurriculumExample,
  PlsqlExample,
  QueryExample,
} from '@/features/curriculum/domain/types';
import type {
  VerifiedResult,
  VerifiedTable,
} from '@/features/curriculum/application/verified-results';
import { exampleHash } from '@/features/curriculum/application/verified-results';

/**
 * Ejecuta los ejemplos del currículo en Oracle real y devuelve lo que Oracle respondió:
 * columnas, filas, salida de DBMS_OUTPUT y errores ORA-/PLS- tal como los da el motor.
 *
 * - Las consultas de la Sección 1 (empleados-v2) corren con la cuenta lectora del
 *   laboratorio (ORACLE_USER…, esquema ORACLE_SCHEMA).
 * - Las de las secciones 2 y 3 corren en el esquema de verificación DBLAB_CURRICULO
 *   (ORACLE_CURRICULUM_USER y ORACLE_CURRICULUM_PASSWORD, creado por
 *   `npm run oracle:setup`), que se recarga antes de cada ejemplo PL/SQL.
 *
 * Sin esas variables las pruebas se omiten: ORACLE REAL = NOT TESTED.
 */

const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
const env: Record<string, string | undefined> = { ...local, ...process.env };

export const ORACLE_CURRICULUM_CONFIGURED = Boolean(
  env.ORACLE_CURRICULUM_USER &&
  env.ORACLE_CURRICULUM_PASSWORD &&
  env.ORACLE_CONNECT_STRING &&
  env.ORACLE_USER &&
  env.ORACLE_PASSWORD,
);

interface Connection {
  oracleServerVersionString?: string;
  execute(
    sql: string,
    binds?: unknown,
    options?: Record<string, unknown>,
  ): Promise<{
    metaData?: { name: string; dbTypeName?: string }[];
    rows?: unknown[][];
    warning?: { message: string };
    outBinds?: Record<string, unknown>;
  }>;
  close(): Promise<void>;
}

interface Driver {
  getConnection(options: Record<string, unknown>): Promise<Connection>;
  OUT_FORMAT_ARRAY: number;
  STRING: unknown;
  NUMBER: unknown;
  BIND_OUT: number;
  DB_TYPE_NUMBER: unknown;
}

const NLS =
  "ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD' NLS_NUMERIC_CHARACTERS = '.,' NLS_SORT = BINARY NLS_COMP = BINARY";

async function driver(): Promise<Driver> {
  const loaded = (await import('oracledb')) as unknown as { default: Driver };
  return loaded.default;
}

export class OracleCurriculumRunner {
  private constructor(
    private readonly db: Driver,
    private readonly sandbox: Connection,
    private readonly reader: Connection,
  ) {}

  /**
   * `resetDataset: false` deja intacto el esquema de verificación: para quien solo consulta
   * `empleados-select-v2` con la cuenta lectora (el banco de la Sección 1). Así puede correr
   * en paralelo con `curriculum-oracle.test.ts`, que borra y recrea ese esquema.
   */
  static async open({ resetDataset = true } = {}): Promise<OracleCurriculumRunner> {
    const db = await driver();
    const connectString = env.ORACLE_CONNECT_STRING;
    const sandbox = await db.getConnection({
      user: env.ORACLE_CURRICULUM_USER,
      password: env.ORACLE_CURRICULUM_PASSWORD,
      connectString,
    });
    const reader = await db.getConnection({
      user: env.ORACLE_USER,
      password: env.ORACLE_PASSWORD,
      connectString,
    });
    await sandbox.execute(NLS);
    await reader.execute(NLS);
    if (env.ORACLE_SCHEMA && /^[A-Z][A-Z0-9_$#]*$/.test(env.ORACLE_SCHEMA)) {
      await reader.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${env.ORACLE_SCHEMA}`);
    }
    const runner = new OracleCurriculumRunner(db, sandbox, reader);
    if (resetDataset) await runner.resetDataset();
    return runner;
  }

  get engine(): string {
    return `Oracle Database ${this.sandbox.oracleServerVersionString ?? ''}`.trim();
  }

  async close(): Promise<void> {
    await this.sandbox.close();
    await this.reader.close();
  }

  /** Borra todos los objetos del esquema de verificación y vuelve a cargar el dataset. */
  async resetDataset(): Promise<void> {
    await this.sandbox.execute('ROLLBACK');
    const objects = await this.sandbox.execute(
      "SELECT object_type, object_name FROM user_objects WHERE object_type IN ('TRIGGER', 'PROCEDURE', 'FUNCTION', 'PACKAGE', 'SEQUENCE', 'VIEW') AND object_name NOT LIKE 'ISEQ$$%' ORDER BY object_type",
    );
    for (const [type, name] of (objects.rows ?? []) as [string, string][]) {
      await this.sandbox.execute(`DROP ${type} ${name}`);
    }
    const tables = await this.sandbox.execute('SELECT table_name FROM user_tables');
    for (const [name] of (tables.rows ?? []) as [string][]) {
      await this.sandbox.execute(`DROP TABLE ${name} CASCADE CONSTRAINTS PURGE`);
    }
    for (const statement of empresaStatements('oracle')) await this.sandbox.execute(statement);
    await this.sandbox.execute('COMMIT');
  }

  private async table(connection: Connection, sql: string): Promise<VerifiedTable> {
    const result = await connection.execute(strip(sql), [], {
      outFormat: this.db.OUT_FORMAT_ARRAY,
      // NUMBER como texto decimal: no pasa por el redondeo binario del driver.
      fetchTypeHandler: (meta: { dbType: unknown }) =>
        meta.dbType === this.db.DB_TYPE_NUMBER ? { type: this.db.STRING } : undefined,
    });
    const columns = (result.metaData ?? []).map((column) => ({
      name: column.name,
      type: columnType(column.dbTypeName),
    }));
    const rows = (result.rows ?? []).map((row) =>
      row.map((value, index) => cellValue(value, columns[index]!.type)),
    );
    return { columns, rows };
  }

  async runQuery(example: QueryExample): Promise<VerifiedResult> {
    const connection = example.dataset === 'empleados-v2' ? this.reader : this.sandbox;
    const hash = exampleHash(example);
    try {
      return { kind: 'query', hash, table: await this.table(connection, example.sql) };
    } catch (error) {
      return { kind: 'query-error', hash, ...oracleError(error) };
    }
  }

  private async output(): Promise<string[]> {
    const lines: string[] = [];
    for (;;) {
      const result = await this.sandbox.execute(
        'BEGIN DBMS_OUTPUT.GET_LINE(:line, :status); END;',
        {
          line: { dir: this.db.BIND_OUT, type: this.db.STRING, maxSize: 32767 },
          status: { dir: this.db.BIND_OUT, type: this.db.NUMBER },
        },
      );
      const binds = result.outBinds as { line: string | null; status: number };
      if (binds.status !== 0) return lines;
      lines.push(binds.line ?? '');
    }
  }

  /** Ejecuta una sentencia PL/SQL o DDL; los errores de compilación salen de USER_ERRORS. */
  private async plsql(statement: string): Promise<void> {
    const result = await this.sandbox.execute(strip(statement));
    if (!result.warning) return;
    const name = /\b(?:PROCEDURE|FUNCTION|PACKAGE(?:\s+BODY)?|TRIGGER)\s+(\w+)/i.exec(statement);
    const errors = await this.sandbox.execute(
      "SELECT line, position, text FROM user_errors WHERE name = :name AND attribute = 'ERROR' ORDER BY sequence",
      { name: (name?.[1] ?? '').toUpperCase() },
    );
    // Mismo formato que SHOW ERRORS de SQL*Plus: LÍNEA/COLUMNA y el mensaje PLS de Oracle.
    const lines = ((errors.rows ?? []) as [number, number, string][]).map(
      ([line, column, text]) => `${line}/${column} ${text.trim()}`,
    );
    throw new Error(lines.length ? lines.join('\n') : result.warning.message);
  }

  async runPlsql(example: PlsqlExample): Promise<VerifiedResult> {
    await this.resetDataset();
    const hash = exampleHash(example);
    for (const statement of example.setup ?? []) {
      try {
        await this.plsql(statement);
      } catch (error) {
        throw new Error(
          `${example.id}: la preparación no compila en Oracle: ${oracleError(error).message}`,
        );
      }
    }
    const before = [];
    for (const query of example.before ?? []) before.push(await this.table(this.sandbox, query));
    await this.sandbox.execute('BEGIN DBMS_OUTPUT.ENABLE(NULL); END;');
    let error: { code: string; message: string } | null = null;
    try {
      await this.plsql(example.code);
    } catch (caught) {
      error = oracleError(caught);
    }
    const output = await this.output();
    await this.sandbox.execute('BEGIN DBMS_OUTPUT.DISABLE; END;');
    const after = [];
    for (const query of example.after ?? []) after.push(await this.table(this.sandbox, query));
    await this.sandbox.execute('ROLLBACK');
    return { kind: 'plsql', hash, output, before, after, error };
  }

  async run(example: CurriculumExample): Promise<VerifiedResult> {
    return example.kind === 'query' ? this.runQuery(example) : this.runPlsql(example);
  }
}

function strip(sql: string): string {
  const trimmed = sql.trim();
  // Un bloque PL/SQL termina en «END;» (el punto y coma es parte del bloque); una sentencia
  // SQL no lleva el punto y coma final.
  if (/\bEND(?:\s+\w+)?\s*;$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/;\s*$/, '');
}

function columnType(dbTypeName: string | undefined): 'number' | 'text' | 'date' {
  const name = (dbTypeName ?? '').toUpperCase();
  if (name === 'NUMBER' || name.startsWith('BINARY')) return 'number';
  if (name === 'DATE' || name.startsWith('TIMESTAMP')) return 'date';
  return 'text';
}

const pad = (value: number) => String(value).padStart(2, '0');

function cellValue(value: unknown, type: 'number' | 'text' | 'date'): string | number | null {
  if (value === null || value === undefined) return null;
  // DATE llega como Date en la zona local del proceso: sus componentes locales son la fecha
  // escrita en Oracle (mismo criterio que el adaptador del laboratorio).
  if (value instanceof Date) {
    const day = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    const time = [value.getHours(), value.getMinutes(), value.getSeconds()];
    return time.some(Boolean) ? `${day} ${time.map(pad).join(':')}` : day;
  }
  if (type === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? number : String(value);
  }
  return String(value);
}

function oracleError(error: unknown): { code: string; message: string } {
  const message = (error instanceof Error ? error.message : String(error))
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('Help:'))
    .join('\n');
  const code =
    /\bPLS-\d{5}/.exec(message)?.[0] ?? /\bORA-\d{5}/.exec(message)?.[0] ?? 'DESCONOCIDO';
  return { code, message: message.split('\n').slice(0, 4).join('\n').trim() };
}

export { EMPRESA_TABLES };
