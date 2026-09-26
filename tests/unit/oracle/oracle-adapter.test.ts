// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { EMPLEADOS_DATASET, rowValues } from '@/domain/dataset/empleados';
import { analyzeSql } from '@/domain/sql/analyzer';
import { renderStatement } from '@/domain/sql/render';
import { oracleConfigFromEnv, type OracleConfig } from '@/infrastructure/oracle/oracle-config';
import { classifyOracleError } from '@/infrastructure/oracle/oracle-errors';
import {
  OracledbQueryExecutor,
  SESSION_NLS,
  type OracleConnectionLike,
  type OracleDriver,
} from '@/infrastructure/oracle/oracledb-query-executor';

// Doble del driver: sin red, sin Oracle y sin credenciales reales.
const DB_TYPE_NUMBER = { name: 'DB_TYPE_NUMBER' };
const STRING = 'STRING';

type Reply =
  { rows: unknown[][]; metaData: { name: string; dbTypeName: string; dbType?: unknown }[] } | Error;

function oracleError(code: string, message = `${code}: detalle interno de Oracle`) {
  return Object.assign(new Error(message), { code, errorNum: Number(code.slice(4)) });
}

function fakeDriver(replies: (sql: string) => Reply) {
  const closed: { drop: boolean }[] = [];
  const executed: string[] = [];
  const callTimeouts: number[] = [];
  const poolAttributes: Record<string, unknown>[] = [];
  let connectionError: Error | null = null;
  const connection = (): OracleConnectionLike => ({
    callTimeout: 0,
    oracleServerVersionString: '23.9.0.25.07',
    async execute(sql, _binds, options) {
      executed.push(sql);
      callTimeouts.push(this.callTimeout);
      // Las sentencias de sesión (NLS y esquema) siempre funcionan, como en Oracle.
      if (sql.startsWith('ALTER SESSION')) return { metaData: [], rows: [] };
      const reply = replies(sql);
      if (reply instanceof Error) throw reply;
      const handler = options.fetchTypeHandler as
        ((metadata: { dbType?: unknown }) => { type: unknown } | undefined) | undefined;
      const asText = reply.metaData.map((column) => handler?.(column)?.type === STRING);
      const maxRows = options.maxRows as number;
      return {
        metaData: reply.metaData,
        rows: reply.rows
          .slice(0, maxRows)
          .map((row) =>
            row.map((value, index) => (asText[index] && value !== null ? String(value) : value)),
          ),
      };
    },
    // Igual que node-oracledb: con un argumento, debe ser un objeto (NJS-005 si no).
    async close(...args: [{ drop?: boolean }?]) {
      if (args.length === 1 && (typeof args[0] !== 'object' || args[0] === null)) {
        throw Object.assign(new Error('NJS-005: invalid value for parameter 1'), {
          code: 'NJS-005',
        });
      }
      closed.push({ drop: args[0]?.drop === true });
    },
  });
  const driver: OracleDriver = {
    OUT_FORMAT_ARRAY: 4001,
    DB_TYPE_NUMBER,
    STRING,
    async createPool(attributes) {
      poolAttributes.push(attributes);
      return {
        async getConnection() {
          if (connectionError) throw connectionError;
          const created = connection();
          const callback = attributes.sessionCallback as
            | ((c: OracleConnectionLike, tag: string, done: (error?: unknown) => void) => void)
            | undefined;
          if (callback)
            await new Promise<void>((resolve, reject) =>
              callback(created, '', (e) => (e ? reject(e) : resolve())),
            );
          return created;
        },
        async close() {},
      };
    },
  };
  return {
    driver,
    closed,
    executed,
    callTimeouts,
    poolAttributes,
    failConnections(error: Error | null) {
      connectionError = error;
    },
  };
}

const number = (name: string) => ({ name, dbTypeName: 'NUMBER', dbType: DB_TYPE_NUMBER });
const text = (name: string) => ({ name, dbTypeName: 'VARCHAR2' });

const CONFIG: OracleConfig = {
  user: 'SQL_LAB_READER',
  password: 'no-es-secreto',
  connectString: 'localhost:1521/FREEPDB1',
  schema: 'SQL_LAB_OWNER',
  poolMax: 10,
  queueMax: 60,
  timeoutMs: 5000,
  maxRows: 100,
  maxBytes: 100 * 1024,
  wallet: null,
};

function canonical(sql: string): string {
  const analysis = analyzeSql(sql);
  if (!analysis.statement) throw new Error('consulta inválida');
  return renderStatement(analysis.statement);
}

const date = (name: string) => ({ name, dbTypeName: 'DATE' });

const DATASET_ROWS = EMPLEADOS_DATASET.rows.map((row) => rowValues(EMPLEADOS_DATASET, row));
const DATASET_META = EMPLEADOS_DATASET.columns.map(({ name, type }) =>
  type === 'number' ? number(name) : type === 'date' ? date(name) : text(name),
);

function healthyReplies(sql: string): Reply {
  if (sql.includes('session_privs'))
    return { rows: [['CREATE SESSION']], metaData: [text('PRIVILEGE')] };
  if (sql.includes('user_tables')) return { rows: [[0]], metaData: [number('COUNT(*)')] };
  if (sql.includes('user_tab_privs_recd'))
    return { rows: [['READ']], metaData: [text('PRIVILEGE')] };
  if (sql.includes('ORDER BY ID')) {
    return { rows: DATASET_ROWS, metaData: DATASET_META };
  }
  return { rows: [], metaData: [] };
}

describe('configuración de Oracle desde el entorno', () => {
  it('sin variables no hay Oracle; con las tres obligatorias, sí', () => {
    expect(oracleConfigFromEnv({})).toEqual({ kind: 'unconfigured' });
    const configured = oracleConfigFromEnv({
      ORACLE_USER: 'sql_lab_reader',
      ORACLE_PASSWORD: 'x',
      ORACLE_CONNECT_STRING: 'db:1521/FREEPDB1',
      ORACLE_SCHEMA: 'sql_lab_owner',
    });
    expect(configured).toMatchObject({
      kind: 'configured',
      config: { schema: 'SQL_LAB_OWNER', poolMax: 10, queueMax: 60, timeoutMs: 5000, maxRows: 100 },
    });
  });

  it('la cartera mTLS llega en base64 con su contraseña, siempre juntas', () => {
    const pem = [
      '-----BEGIN ENCRYPTED PRIVATE KEY-----',
      'AAAA',
      '-----END ENCRYPTED PRIVATE KEY-----',
      '',
    ].join('\n');
    const base = {
      ORACLE_USER: 'sql_lab_reader',
      ORACLE_PASSWORD: 'x',
      ORACLE_CONNECT_STRING:
        '(description=(address=(protocol=tcps)(port=1522)(host=adb.example.com)))',
    };
    expect(
      oracleConfigFromEnv({
        ...base,
        ORACLE_WALLET_PEM_BASE64: Buffer.from(pem).toString('base64'),
        ORACLE_WALLET_PASSWORD: 'clave-de-prueba',
      }),
    ).toMatchObject({
      kind: 'configured',
      config: { wallet: { content: pem, password: 'clave-de-prueba' } },
    });
    expect(oracleConfigFromEnv(base)).toMatchObject({ config: { wallet: null } });
    expect(
      oracleConfigFromEnv({
        ...base,
        ORACLE_WALLET_PEM_BASE64: Buffer.from(pem).toString('base64'),
      }).kind,
    ).toBe('invalid');
    expect(oracleConfigFromEnv({ ...base, ORACLE_WALLET_PASSWORD: 'x' }).kind).toBe('invalid');
    expect(
      oracleConfigFromEnv({
        ...base,
        ORACLE_WALLET_PEM_BASE64: Buffer.from('no es un PEM').toString('base64'),
        ORACLE_WALLET_PASSWORD: 'x',
      }).kind,
    ).toBe('invalid');
  });

  it('rechaza cuentas administrativas, la propietaria y valores incompletos o fuera de rango', () => {
    const base = { ORACLE_PASSWORD: 'x', ORACLE_CONNECT_STRING: 'db/FREEPDB1' };
    for (const user of ['SYS', 'system', 'SysBackup', 'ADMIN', 'admin']) {
      expect(oracleConfigFromEnv({ ...base, ORACLE_USER: user }).kind).toBe('invalid');
    }
    expect(oracleConfigFromEnv({ ORACLE_USER: 'lector' }).kind).toBe('invalid');
    expect(
      oracleConfigFromEnv({ ...base, ORACLE_USER: 'lector', ORACLE_SCHEMA: 'LECTOR' }).kind,
    ).toBe('invalid');
    expect(
      oracleConfigFromEnv({ ...base, ORACLE_USER: 'lector', ORACLE_SCHEMA: 'x; DROP' }).kind,
    ).toBe('invalid');
    expect(
      oracleConfigFromEnv({ ...base, ORACLE_USER: 'lector', ORACLE_TIMEOUT_MS: '99999999' }).kind,
    ).toBe('invalid');
  });
});

describe('clasificación de errores de Oracle', () => {
  it('los errores de SQL conservan su código ORA con un mensaje pedagógico, sin detalles internos', () => {
    expect(classifyOracleError(oracleError('ORA-01476'))).toEqual({
      result: {
        status: 'oracle-error',
        code: 'ORA-01476',
        message: 'No se puede dividir entre cero; Oracle no devolvió un resultado parcial.',
      },
      dropConnection: false,
    });
    const unknown = classifyOracleError(
      oracleError('ORA-00604', 'ORA-00604: error en SQL recursivo nivel 1 SCHEMA.X'),
    );
    expect(unknown.result).toEqual({
      status: 'oracle-error',
      code: 'ORA-00604',
      message: 'Oracle rechazó la consulta.',
    });
  });

  it('conexión, credenciales, cola y plazo son de infraestructura y no filtran detalles', () => {
    const cases: [string, string, boolean][] = [
      ['ORA-01017', 'unreachable', true],
      ['ORA-12541', 'unreachable', true],
      ['NJS-511', 'unreachable', true],
      ['NJS-123', 'timeout', true],
      ['ORA-01013', 'timeout', true],
      ['NJS-040', 'timeout', false],
      ['NJS-076', 'busy', false],
      ['ORA-00942', 'not-configured', false],
    ];
    for (const [code, reason, drop] of cases) {
      const classified = classifyOracleError(
        oracleError(code, `${code}: host secreto db.interno:1521`),
      );
      expect(classified.result).toMatchObject({ status: 'unavailable', reason });
      expect(classified.dropConnection).toBe(drop);
      expect(JSON.stringify(classified.result)).not.toContain('secreto');
    }
    expect(classifyOracleError(new Error('ECONNREFUSED 10.0.0.1:1521')).result).toMatchObject({
      reason: 'unreachable',
    });
  });
});

describe('adaptador node-oracledb', () => {
  it('con cartera mTLS, el grupo recibe su contenido y su contraseña', async () => {
    const fake = fakeDriver(() => ({ rows: [['Ana']], metaData: [text('NOMBRE')] }));
    const wallet = {
      content: '-----BEGIN ENCRYPTED PRIVATE KEY-----',
      password: 'clave-de-prueba',
    };
    const executor = new OracledbQueryExecutor({ ...CONFIG, wallet }, async () => fake.driver);
    await executor.execute({ statement: canonical('select nombre from empleados;') });
    expect(fake.poolAttributes[0]).toMatchObject({
      walletContent: wallet.content,
      walletPassword: wallet.password,
    });
  });

  it('ejecuta la sentencia canónica con plazo, filas como arreglos y tipos de columna', async () => {
    const fake = fakeDriver((sql) =>
      sql.startsWith('ALTER SESSION')
        ? { rows: [], metaData: [] }
        : {
            rows: [
              ['Ana', 36000000],
              ['Carlos', 60000000],
            ],
            metaData: [text('NOMBRE'), number('SALARIO_ANUAL')],
          },
    );
    const executor = new OracledbQueryExecutor(CONFIG, async () => fake.driver);
    const statement = canonical('select nombre, salario * 12 as salario_anual from empleados;');
    const result = await executor.execute({ statement });
    expect(result).toMatchObject({
      status: 'ok',
      columns: [
        { name: 'NOMBRE', type: 'text' },
        { name: 'SALARIO_ANUAL', type: 'number' },
      ],
      rows: [
        ['Ana', 36000000],
        ['Carlos', 60000000],
      ],
      engine: 'Oracle Database 23 (23.9.0.25.07)',
    });
    expect(fake.executed).toEqual([
      SESSION_NLS,
      'ALTER SESSION SET CURRENT_SCHEMA = SQL_LAB_OWNER',
      'SELECT NOMBRE, SALARIO * 12 AS SALARIO_ANUAL FROM EMPLEADOS',
    ]);
    expect(fake.callTimeouts.at(-1)).toBeGreaterThan(0);
    expect(fake.callTimeouts.at(-1)).toBeLessThanOrEqual(5000);
    expect(fake.poolAttributes[0]).toMatchObject({
      poolMax: 10,
      queueMax: 60,
      queueTimeout: 5000,
      poolMin: 0,
    });
    expect(fake.poolAttributes[0]).not.toHaveProperty('walletContent');
    expect(fake.closed).toEqual([{ drop: false }]);
  });

  it('lee DATE como AAAA-MM-DD, NULL como null y fija NLS en cada sesión nueva', async () => {
    const fake = fakeDriver((sql) =>
      sql.startsWith('ALTER SESSION')
        ? { rows: [], metaData: [] }
        : {
            rows: [
              ['Ana', new Date(2012, 1, 1), null],
              ['Jorge', new Date(2016, 8, 12), '0'],
            ],
            metaData: [text('NOMBRE'), date('FECHA_INGRESO'), number('BONO')],
          },
    );
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    const result = await executor.execute({
      statement: 'SELECT NOMBRE, FECHA_INGRESO, BONO FROM EMPLEADOS',
    });
    expect(result).toMatchObject({
      status: 'ok',
      columns: [
        { name: 'NOMBRE', type: 'text' },
        { name: 'FECHA_INGRESO', type: 'date' },
        { name: 'BONO', type: 'number' },
      ],
      rows: [
        ['Ana', '2012-02-01', null],
        ['Jorge', '2016-09-12', 0],
      ],
    });
    expect(fake.executed[0]).toBe(SESSION_NLS);
    expect(SESSION_NLS).toContain("NLS_DATE_FORMAT = 'YYYY-MM-DD'");
    expect(SESSION_NLS).toContain('NLS_SORT = BINARY');
  });

  it('conserva la precisión decimal: número exacto si cabe, texto decimal si no', async () => {
    const fake = fakeDriver(() => ({
      rows: [
        ['1500000'],
        ['0.1'],
        ['.1'],
        ['-.5'],
        ['.0833333333333333333333333333333333333333'],
        ['1000000.33333333333333333333333333333333'],
      ],
      metaData: [number('MITAD')],
    }));
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    const result = await executor.execute({
      statement: 'SELECT SALARIO / 2 AS MITAD FROM EMPLEADOS',
    });
    expect(result).toMatchObject({
      status: 'ok',
      rows: [
        [1500000],
        [0.1],
        [0.1],
        [-0.5],
        ['.0833333333333333333333333333333333333333'],
        ['1000000.33333333333333333333333333333333'],
      ],
    });
  });

  it('un error de Oracle devuelve su código y libera la conexión', async () => {
    const fake = fakeDriver(() => oracleError('ORA-01476'));
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    expect(
      await executor.execute({ statement: 'SELECT SALARIO / 0 FROM EMPLEADOS' }),
    ).toMatchObject({
      status: 'oracle-error',
      code: 'ORA-01476',
    });
    expect(fake.closed).toEqual([{ drop: false }]);
  });

  it('un plazo agotado retira la sesión del grupo y la siguiente consulta funciona', async () => {
    let slow = true;
    const fake = fakeDriver(() =>
      slow
        ? oracleError('NJS-123', 'NJS-123: call timeout of 5000 ms exceeded')
        : { rows: [[6]], metaData: [number('N')] },
    );
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    expect(await executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' })).toMatchObject({
      status: 'unavailable',
      reason: 'timeout',
    });
    slow = false;
    expect(await executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' })).toMatchObject({
      status: 'ok',
    });
    expect(fake.closed).toEqual([{ drop: true }, { drop: false }]);
  });

  it('sin conexión posible informa indisponibilidad y vuelve a intentarlo después', async () => {
    const fake = fakeDriver(() => ({ rows: [[1]], metaData: [number('ID')] }));
    fake.failConnections(oracleError('NJS-511', 'NJS-511: connection refused 10.1.1.1'));
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    expect(await executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' })).toMatchObject({
      status: 'unavailable',
      reason: 'unreachable',
    });
    fake.failConnections(null);
    expect(await executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' })).toMatchObject({
      status: 'ok',
    });
  });

  it('no muestra ni califica un resultado de más de 100 filas', async () => {
    const fake = fakeDriver(() => ({
      rows: Array.from({ length: 150 }, (_, index) => [index]),
      metaData: [number('ID')],
    }));
    const executor = new OracledbQueryExecutor(
      { ...CONFIG, schema: null },
      async () => fake.driver,
    );
    expect(await executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' })).toMatchObject({
      status: 'unavailable',
      reason: 'too-large',
    });
  });

  it('la salud exige el dataset versionado y una cuenta solo lectora', async () => {
    const healthy = fakeDriver(healthyReplies);
    const executor = new OracledbQueryExecutor(CONFIG, async () => healthy.driver);
    expect(await executor.status()).toMatchObject({ available: true, reason: null });
    // La salud se guarda unos segundos: no consulta en cada carga de página.
    const queries = healthy.executed.length;
    await executor.status();
    expect(healthy.executed.length).toBe(queries);

    const writer = fakeDriver((sql) =>
      sql.includes('session_privs')
        ? { rows: [['CREATE SESSION'], ['INSERT ANY TABLE']], metaData: [text('PRIVILEGE')] }
        : healthyReplies(sql),
    );
    const risky = await new OracledbQueryExecutor(CONFIG, async () => writer.driver).status();
    expect(risky).toMatchObject({ available: false, reason: 'not-configured' });
    expect(risky.message).toContain('más permisos');

    const changed = fakeDriver((sql) =>
      sql.includes('ORDER BY ID')
        ? {
            rows: DATASET_ROWS.map((row, index) =>
              index === 4 ? [...row.slice(0, 7), 1, ...row.slice(8)] : row,
            ),
            metaData: DATASET_META,
          }
        : healthyReplies(sql),
    );
    const mismatch = await new OracledbQueryExecutor(CONFIG, async () => changed.driver).status();
    expect(mismatch).toMatchObject({ available: false, reason: 'not-configured' });
    expect(mismatch.message).toContain('empleados-select-v2');
  });

  it('el driver se carga una sola vez y solo al usarse', async () => {
    const fake = fakeDriver(() => ({ rows: [[1]], metaData: [number('ID')] }));
    const load = vi.fn(async () => fake.driver);
    const executor = new OracledbQueryExecutor({ ...CONFIG, schema: null }, load);
    expect(load).not.toHaveBeenCalled();
    await Promise.all([
      executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' }),
      executor.execute({ statement: 'SELECT ID FROM EMPLEADOS' }),
    ]);
    expect(fake.poolAttributes).toHaveLength(1);
  });
});

describe('sentencia canónica para Oracle', () => {
  it('un doble signo menos nunca se convierte en un comentario «--»', () => {
    expect(canonical('SELECT - -salario AS doble FROM empleados')).toBe(
      'SELECT - -SALARIO AS DOBLE FROM EMPLEADOS',
    );
    expect(canonical('SELECT -(-salario) FROM empleados')).toBe(
      'SELECT -(-SALARIO) FROM EMPLEADOS',
    );
    expect(canonical('SELECT salario - -1 FROM empleados')).toBe(
      'SELECT SALARIO - -1 FROM EMPLEADOS',
    );
  });

  it('las etiquetas entrecomilladas se serializan escapadas y el texto original nunca se reenvía', () => {
    expect(canonical('select nombre AS "Nombre empleado" from empleados; -- comentario')).toBe(
      'SELECT NOMBRE AS "Nombre empleado" FROM EMPLEADOS',
    );
  });
});
