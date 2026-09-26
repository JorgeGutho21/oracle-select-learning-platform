// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';
import type { OracleExecutionResult } from '@/application/oracle-executor';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { compareResults, isSortedBy } from '@/domain/results/result-table';
import { runEducational } from '@/domain/sql/educational-run';
import { evaluateExpression } from '@/domain/sql/evaluator';
import { resolveOrderBy } from '@/domain/sql/order';
import { EMPLEADOS_SCHEMA } from '@/domain/sql/schema';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { executeOnOracle } from '@/features/laboratory/application/execute-on-oracle';
import { LAB_EXAMPLES } from '@/features/laboratory/domain/examples';
import { LESSON_CONTENT } from '@/features/study/domain/lesson-content';
import { oracleConfigFromEnv } from '@/infrastructure/oracle/oracle-config';
import { loadOracledb } from '@/infrastructure/oracle/oracledb-driver';
import { OracledbQueryExecutor } from '@/infrastructure/oracle/oracledb-query-executor';

/**
 * Ejecución real en Oracle del dataset empleados-select-v2. Solo corre si el entorno tiene la
 * cuenta lectora (ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING y, con cartera,
 * ORACLE_WALLET_*), por ejemplo en `.env.local` tras `npm run oracle:setup`. Sin esas
 * variables se omite: no hay secretos en el repositorio.
 *
 * El motor educativo es la referencia de la Exposición, el Estudio, el Laboratorio y el
 * Challenge; aquí se comprueba que Oracle devuelve exactamente lo mismo: encabezados, tipos,
 * filas y orden (entre empates, cualquier orden es válido, como en Oracle).
 */

// Se lee .env.local sin modificar process.env: otras suites del mismo proceso no deben ver Oracle.
const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
const configuration = oracleConfigFromEnv({ ...local, ...process.env });
const configured = configuration.kind === 'configured';

type OkExecution = Extract<OracleExecutionResult, { status: 'ok' }>;

/** Una consulta por concepto de la unidad, además de los ejemplos del contenido. */
const CONCEPT_QUERIES: readonly (readonly [concept: string, sql: string])[] = [
  ['SELECT básico', 'SELECT * FROM empleados'],
  ['columnas específicas', 'SELECT nombre, apellido, cargo FROM empleados'],
  ['expresión sin alias', 'SELECT nombre, salario * 12 FROM empleados'],
  ['suma con NULL', 'SELECT nombre, salario + bono FROM empleados'],
  ['resta y división', 'SELECT nombre, salario - 100000, salario / 2 FROM empleados'],
  ['precedencia', 'SELECT nombre, salario + 100000 * 12 AS total FROM empleados'],
  ['paréntesis', 'SELECT nombre, (salario + 100000) * 12 AS total FROM empleados'],
  ['división con decimales', 'SELECT nombre, bono / salario AS proporcion FROM empleados'],
  ['alias con AS', 'SELECT nombre AS empleado, salario * 12 AS salario_anual FROM empleados'],
  ['alias sin AS', 'SELECT nombre empleado FROM empleados'],
  ['alias entre comillas', 'SELECT nombre AS "Nombre empleado" FROM empleados'],
  ['concatenación con alias', "SELECT nombre || ' ' || apellido AS nombre_completo FROM empleados"],
  ['concatenación sin alias', "SELECT nombre || ' ' || apellido FROM empleados"],
  ['concatenación con NULL', 'SELECT nombre || bono AS texto FROM empleados'],
  ['DISTINCT', 'SELECT DISTINCT departamento FROM empleados'],
  ['DISTINCT con NULL', 'SELECT DISTINCT bono FROM empleados'],
  ['DISTINCT de dos columnas', 'SELECT DISTINCT ciudad, departamento FROM empleados'],
  ['WHERE =', "SELECT nombre FROM empleados WHERE departamento = 'TI'"],
  ['WHERE <>', "SELECT nombre FROM empleados WHERE departamento <> 'TI'"],
  ['WHERE !=', "SELECT nombre FROM empleados WHERE departamento != 'TI'"],
  ['WHERE >', 'SELECT nombre, salario FROM empleados WHERE salario > 6000000'],
  ['WHERE >= (límite incluido)', 'SELECT nombre, salario FROM empleados WHERE salario >= 6000000'],
  ['WHERE <', 'SELECT nombre, salario FROM empleados WHERE salario < 3000000'],
  ['WHERE <= (límite incluido)', 'SELECT nombre, salario FROM empleados WHERE salario <= 3000000'],
  ['comparación de texto', "SELECT nombre FROM empleados WHERE nombre > 'M'"],
  ['texto con mayúsculas distintas', "SELECT nombre FROM empleados WHERE ciudad = 'bogotá'"],
  ['bono en cero no es NULL', 'SELECT nombre, bono FROM empleados WHERE bono = 0'],
  ['fecha', "SELECT nombre, fecha_ingreso FROM empleados WHERE fecha_ingreso < DATE '2015-01-01'"],
  ['AND', "SELECT nombre, salario FROM empleados WHERE departamento = 'TI' AND salario > 4000000"],
  ['OR', "SELECT nombre, ciudad FROM empleados WHERE ciudad = 'Cali' OR ciudad = 'Valledupar'"],
  ['NOT', "SELECT nombre, ciudad FROM empleados WHERE NOT ciudad = 'Bogotá'"],
  ['NOT con NULL', 'SELECT nombre FROM empleados WHERE NOT bono > 300000'],
  [
    'AND antes que OR',
    "SELECT nombre FROM empleados WHERE estado = 'ACTIVO' OR departamento = 'TI' AND salario > 5000000",
  ],
  [
    'paréntesis lógicos',
    "SELECT nombre FROM empleados WHERE (estado = 'ACTIVO' OR departamento = 'TI') AND salario > 5000000",
  ],
  ['BETWEEN', 'SELECT nombre, salario FROM empleados WHERE salario BETWEEN 3000000 AND 6000000'],
  ['BETWEEN al revés', 'SELECT nombre FROM empleados WHERE salario BETWEEN 6000000 AND 3000000'],
  ['NOT BETWEEN', 'SELECT nombre FROM empleados WHERE salario NOT BETWEEN 3000000 AND 6000000'],
  [
    'BETWEEN con fechas',
    "SELECT nombre FROM empleados WHERE fecha_ingreso BETWEEN DATE '2019-01-01' AND DATE '2020-12-31'",
  ],
  ['IN', "SELECT nombre, ciudad FROM empleados WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')"],
  ['NOT IN', "SELECT nombre, ciudad FROM empleados WHERE ciudad NOT IN ('Bogotá', 'Cali')"],
  ['NOT IN con NULL en la columna', 'SELECT nombre FROM empleados WHERE bono NOT IN (0, 300000)'],
  ['LIKE que empieza', "SELECT nombre FROM empleados WHERE nombre LIKE 'A%'"],
  ['LIKE que termina', "SELECT nombre FROM empleados WHERE nombre LIKE '%a'"],
  ['LIKE que contiene', "SELECT nombre FROM empleados WHERE nombre LIKE '%ar%'"],
  ['LIKE con _', "SELECT apellido FROM empleados WHERE apellido LIKE '_o%'"],
  ['NOT LIKE', "SELECT nombre FROM empleados WHERE nombre NOT LIKE '%a'"],
  ['LIKE distingue mayúsculas', "SELECT nombre FROM empleados WHERE nombre LIKE 'a%'"],
  ['IS NULL', 'SELECT nombre, bono FROM empleados WHERE bono IS NULL'],
  ['IS NOT NULL', 'SELECT nombre, bono FROM empleados WHERE bono IS NOT NULL'],
  ['jefe NULL', 'SELECT nombre FROM empleados WHERE id_jefe IS NULL'],
  ['= NULL no devuelve filas', 'SELECT nombre FROM empleados WHERE bono = NULL'],
  ['comparación con NULL desconocida', 'SELECT nombre FROM empleados WHERE bono > 300000'],
  ['ORDER BY ASC por defecto', 'SELECT nombre, salario FROM empleados ORDER BY salario'],
  ['ORDER BY DESC', 'SELECT nombre, salario FROM empleados ORDER BY salario DESC'],
  ['NULL al final en ASC', 'SELECT nombre, bono FROM empleados ORDER BY bono'],
  ['NULL al principio en DESC', 'SELECT nombre, bono FROM empleados ORDER BY bono DESC'],
  ['ORDER BY texto binario', 'SELECT apellido FROM empleados ORDER BY apellido'],
  ['ORDER BY fecha', 'SELECT nombre, fecha_ingreso FROM empleados ORDER BY fecha_ingreso DESC'],
  [
    'ORDER BY dos columnas',
    'SELECT departamento, nombre, salario FROM empleados ORDER BY departamento, salario DESC',
  ],
  ['ORDER BY posición', 'SELECT nombre, salario FROM empleados ORDER BY 2 DESC, 1'],
  [
    'ORDER BY alias',
    'SELECT nombre, salario * 12 AS anual FROM empleados ORDER BY anual DESC, nombre',
  ],
  [
    'ORDER BY columna no seleccionada',
    'SELECT nombre FROM empleados ORDER BY salario DESC, nombre',
  ],
  [
    'ORDER BY alias que coincide con una columna',
    'SELECT nombre, bono AS salario FROM empleados ORDER BY salario, nombre',
  ],
  [
    'consulta completa',
    "SELECT nombre, departamento, salario FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' AND salario BETWEEN 3000000 AND 6000000 ORDER BY salario DESC",
  ],
];

/** Todas las consultas del Estudio: ejemplo, comparaciones, forma correcta, comprobación y pasos. */
function studyQueries(): (readonly [string, string])[] {
  const found: (readonly [string, string])[] = [];
  for (const lesson of LESSON_CONTENT) {
    const add = (label: string, sql: string | undefined) => {
      if (sql) found.push([`${lesson.slug} · ${label}`, sql]);
    };
    add('ejemplo', lesson.example.sql);
    lesson.comparisons?.forEach((entry) => add(entry.label, entry.sql));
    add('forma correcta', lesson.error.right);
    add('comprobación', 'sql' in lesson.check ? lesson.check.sql : undefined);
    lesson.steps?.forEach((step) => add(`paso ${step.label}`, step.sql));
    lesson.catalog?.forEach((entry) => add(`catálogo ${entry.title}`, entry.right));
  }
  return found;
}

/** Consultas de la Exposición: todo literal SQL de las escenas que empiece por SELECT. */
function sceneQueries(): (readonly [string, string])[] {
  const source = readFileSync(
    'src/features/presentation/presentation/presentation-scenes.tsx',
    'utf8',
  );
  const literals = [
    ...source.matchAll(/'(SELECT\b(?:\\.|[^'\\])*)'/g),
    ...source.matchAll(/"(SELECT\b(?:\\.|[^"\\])*)"/g),
  ].map((match) => match[1]!.replaceAll('\\n', '\n').replaceAll("\\'", "'").replaceAll('\\"', '"'));
  return (
    [...new Set(literals)]
      // Las consultas completas; «SELECT … FROM» es un patrón de sintaxis, no una consulta.
      .filter((sql) => /\bFROM\b/i.test(sql) && !sql.includes('…'))
      .map((sql, index) => [`escena ${index + 1}`, sql] as const)
  );
}

/**
 * Oracle y el motor coinciden fila a fila salvo el orden entre filas empatadas: se agrupan las
 * filas del motor en tramos con la misma clave de ORDER BY y cada tramo debe coincidir.
 */
function expectSameOrder(sql: string, oracleRows: OkExecution['rows']) {
  const run = runEducational(sql);
  const statement = run.analysis.statement!;
  const result = run.result!;
  if (!statement.orderBy) return;
  const { targets } = resolveOrderBy(statement, EMPLEADOS_SCHEMA, sql);
  const keyOf = (position: number) =>
    JSON.stringify(
      statement.orderBy!.items.map((item, index) => {
        const slot = targets[index]?.slot;
        if (slot !== null && slot !== undefined) return result.table.rows[position]![slot];
        const source = EMPLEADOS_DATASET.rows[result.trace.resultRows[position]!]!;
        const value = evaluateExpression(item.expression, source);
        return value.ok ? value.value : 'error';
      }),
    );
  let start = 0;
  for (let index = 1; index <= result.table.rows.length; index++) {
    if (index < result.table.rows.length && keyOf(index) === keyOf(start)) continue;
    const segment = (rows: readonly (readonly unknown[])[]) =>
      rows
        .slice(start, index)
        .map((row) => JSON.stringify(row))
        .sort();
    expect(segment(oracleRows), `${sql} · filas ${start + 1}–${index}`).toEqual(
      segment(result.table.rows),
    );
    start = index;
  }
}

describe.skipIf(!configured)('Oracle real (empleados-select-v2)', () => {
  if (configuration.kind !== 'configured') return;
  const executor = new OracledbQueryExecutor(configuration.config, loadOracledb);
  afterAll(() => executor.close());

  const run = async (sql: string): Promise<OkExecution> => {
    const execution = await executeOnOracle(sql, executor);
    if (execution.status !== 'ok') throw new Error(`No se ejecutó: ${JSON.stringify(execution)}`);
    return execution;
  };

  /** Oracle devuelve exactamente lo que calcula el motor educativo para la misma consulta. */
  const expectSameAsEngine = async (sql: string) => {
    const educational = runEducational(sql);
    expect(educational.analysis.errors, sql).toEqual([]);
    expect(educational.result, sql).not.toBeNull();
    const execution = await run(sql);
    const expected = educational.result!;
    expect(
      execution.columns.map(({ name }) => name),
      sql,
    ).toEqual(expected.columns.map(({ name }) => name));
    expect(
      execution.columns.map(({ type }) => type),
      sql,
    ).toEqual(expected.columns.map(({ type }) => type));
    // Un decimal periódico no cabe en un número de JavaScript: el adaptador conserva los 40
    // dígitos de Oracle como texto y el motor usa el número más cercano; se comparan por valor.
    const numeric = execution.columns.map(({ type }) => type === 'number');
    const rows = execution.rows.map((row) =>
      row.map((value, index) =>
        numeric[index] && typeof value === 'string' ? Number(value) : value,
      ),
    );
    expect(compareResults({ columns: expected.table.columns, rows }, expected.table), sql).toEqual({
      equal: true,
    });
    expectSameOrder(sql, rows);
    return execution;
  };

  it('la salud comprueba el dataset v2 fila a fila y una cuenta solo lectora', async () => {
    const status = await executor.status();
    expect(status).toMatchObject({ available: true, reason: null });
    expect(status.message).toContain('empleados-select-v2');
  });

  it('EMPLEADOS tiene las 12 columnas, los tipos y los valores del dataset canónico', async () => {
    const execution = await run('SELECT * FROM empleados ORDER BY id_empleado');
    expect(execution.columns).toEqual(
      EMPLEADOS_DATASET.columns.map(({ name, type }) => ({ name, type })),
    );
    expect(execution.rows).toEqual(
      EMPLEADOS_DATASET.rows.map((row) => EMPLEADOS_DATASET.columns.map(({ name }) => row[name])),
    );
    expect(execution.engine).toMatch(/^Oracle Database \d+/);
  });

  it.each(CONCEPT_QUERIES)('concepto «%s»: Oracle coincide con el motor', async (_concept, sql) => {
    await expectSameAsEngine(sql);
  });

  it.each(LAB_EXAMPLES.map((example) => [example.id, example.sql] as const))(
    '%s: Oracle coincide con el laboratorio o no llega a Oracle si es un error',
    async (_id, sql) => {
      if (runEducational(sql).analysis.ok) await expectSameAsEngine(sql);
      else expect((await executeOnOracle(sql, executor)).status).toBe('rejected');
    },
  );

  it('Estudio: cada consulta válida de las 22 lecciones da el mismo resultado en Oracle', async () => {
    const queries = studyQueries().filter(([, sql]) => runEducational(sql).analysis.ok);
    expect(queries.length).toBeGreaterThan(40);
    for (const [, sql] of queries) await expectSameAsEngine(sql);
  }, 120_000);

  it('Exposición: cada consulta de las escenas da el mismo resultado en Oracle', async () => {
    const queries = sceneQueries();
    expect(queries.length).toBeGreaterThan(20);
    for (const [, sql] of queries) await expectSameAsEngine(sql);
  }, 120_000);

  it('valores exactos que el contenido cita (recuentos del diseño del dataset)', async () => {
    const count = async (sql: string) => (await run(sql)).rows.length;
    expect(
      await count('SELECT nombre FROM empleados WHERE salario BETWEEN 3000000 AND 6000000'),
    ).toBe(12);
    expect(
      await count("SELECT nombre FROM empleados WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')"),
    ).toBe(17);
    expect(await count("SELECT nombre FROM empleados WHERE nombre LIKE '%ar%'")).toBe(6);
    expect(await count('SELECT nombre FROM empleados WHERE bono IS NULL')).toBe(6);
    expect(await count('SELECT DISTINCT ciudad, departamento FROM empleados')).toBe(16);
    expect(
      (await run("SELECT apellido FROM empleados WHERE apellido LIKE '_o%' ORDER BY apellido"))
        .rows,
    ).toEqual([['Mora'], ['Rojas'], ['Soto'], ['Torres']]);
    const lab03 = await run('SELECT nombre, salario * 12 AS salario_anual FROM empleados');
    expect(lab03.columns).toEqual([
      { name: 'NOMBRE', type: 'text' },
      { name: 'SALARIO_ANUAL', type: 'number' },
    ]);
    expect(lab03.rows).toContainEqual(['Ana', 108000000]);
    expect((await run('SELECT salario * 12 FROM empleados')).columns[0]!.name).toBe('SALARIO*12');
    const precedence = await run(
      'SELECT salario + 100000 * 12 AS total FROM empleados WHERE id_empleado = 1',
    );
    expect(precedence.rows).toEqual([[10200000]]);
    const grouped = await run(
      'SELECT (salario + 100000) * 12 AS total FROM empleados WHERE id_empleado = 1',
    );
    expect(grouped.rows).toEqual([[109200000]]);
    // Sin paréntesis AND se evalúa primero: 9 filas; con paréntesis, 6.
    expect(
      await count(
        "SELECT nombre FROM empleados WHERE ciudad = 'Bogotá' OR ciudad = 'Medellín' AND salario > 5000000",
      ),
    ).toBe(9);
    expect(
      await count(
        "SELECT nombre FROM empleados WHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín') AND salario > 5000000",
      ),
    ).toBe(6);
    const nulls = await run('SELECT nombre, bono FROM empleados ORDER BY bono DESC, nombre');
    expect(nulls.rows.slice(0, 6).every(([, bono]) => bono === null)).toBe(true);
    expect(isSortedBy(nulls.rows, [{ column: 1, direction: 'DESC' }])).toBe(true);
  });

  it('espacios, mayúsculas, comentarios y terminador no cambian el resultado', async () => {
    const reference = await run("SELECT nombre, ciudad FROM empleados WHERE ciudad = 'Cali'");
    for (const variant of [
      "select   NOMBRE ,ciudad\n\tfrom Empleados where CIUDAD = 'Cali' ;",
      "-- pedido\nSELECT nombre, ciudad -- columnas\nFROM empleados\nWHERE ciudad = 'Cali'",
    ]) {
      const execution = await run(variant);
      expect(
        compareResults(
          { columns: execution.columns.map(({ name }) => name), rows: execution.rows },
          { columns: reference.columns.map(({ name }) => name), rows: reference.rows },
        ),
      ).toEqual({ equal: true });
    }
  });

  it('lo rechazado no llega a Oracle; dividir entre cero es un error ORA real', async () => {
    for (const sql of [
      'DELETE FROM empleados',
      'SELECT * FROM empleados; DROP TABLE empleados',
      'SELECT * FROM usuarios',
      'SELECT nombre FROM empleados WHERE edad > 20',
      'SELECT UPPER(nombre) FROM empleados',
      'SELECT departamento, COUNT(*) FROM empleados GROUP BY departamento',
    ]) {
      expect((await executeOnOracle(sql, executor)).status, sql).toBe('rejected');
    }
    expect(await executeOnOracle('SELECT salario / 0 FROM empleados', executor)).toMatchObject({
      status: 'oracle-error',
      code: 'ORA-01476',
    });
    expect((await run('SELECT * FROM empleados')).rows).toHaveLength(20);
  });

  it('la cuenta lectora no puede escribir aunque se salte el analizador', async () => {
    const direct = await executor.execute({ statement: "UPDATE EMPLEADOS SET NOMBRE = 'X'" });
    expect(direct).toMatchObject({ status: 'oracle-error' });
    expect((direct as { code: string }).code).toMatch(/^ORA-(01031|41900)$/);
    expect((await run('SELECT nombre FROM empleados WHERE id_empleado = 1')).rows).toEqual([
      ['Ana'],
    ]);
  });

  it('un plazo agotado no agota el grupo de conexiones', async () => {
    if (configuration.kind !== 'configured') return;
    const impatient = new OracledbQueryExecutor(
      { ...configuration.config, timeoutMs: 800, poolMax: 1 },
      loadOracledb,
    );
    try {
      // Consulta costosa enviada directamente para forzar el plazo (no pasa por el analizador).
      const slow = await impatient.execute({
        statement: 'SELECT COUNT(*) FROM all_objects a, all_objects b, all_objects c',
      });
      expect(slow).toMatchObject({ status: 'unavailable', reason: 'timeout' });
      for (let index = 0; index < 3; index += 1) {
        expect(
          await impatient.execute({ statement: 'SELECT COUNT(*) FROM EMPLEADOS' }),
        ).toMatchObject({ status: 'ok', rows: [[20]] });
      }
    } finally {
      await impatient.close();
    }
  });

  it('el mismo contenido en otro orden de filas es equivalente', async () => {
    const execution = await run('SELECT DISTINCT ciudad, departamento FROM empleados');
    const one = { columns: execution.columns.map(({ name }) => name), rows: execution.rows };
    expect(one.rows).toHaveLength(16);
    const reversed = { columns: one.columns, rows: [...one.rows].reverse() };
    expect(compareResults(reversed, one)).toEqual({ equal: true });
    expect(compareResults({ columns: one.columns, rows: one.rows.slice(1) }, one)).toMatchObject({
      equal: false,
    });
  });

  describe('M10 — Final Boss: Query Master, calificada con Oracle', () => {
    const evaluator = new InProcessMissionEvaluator(executor);
    const version = PUBLIC_MISSIONS.find(({ id }) => id === 'M10')!.version;
    const evaluate = (sql: string) =>
      evaluator.evaluate({
        missionId: 'M10',
        missionVersion: version,
        answer: { type: 'write-query', sql },
      });
    const REFERENCE =
      "SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual\nFROM empleados\nWHERE estado = 'ACTIVO' AND ciudad = 'Bogotá'\nORDER BY proyeccion_anual DESC;";

    it('la solución de referencia es correcta al ejecutarse en Oracle', async () => {
      expect(await evaluate(REFERENCE)).toMatchObject({ kind: 'correct' });
      const execution = await run(REFERENCE);
      expect(execution.rows).toHaveLength(6);
      expect(execution.rows[0]).toEqual(['Ana', 'Gerente general', 109200000]);
      expect(execution.rows.at(-1)).toEqual(['Felipe', 'Asistente', 26400000]);
    });

    it('acepta formas equivalentes: no se compara la cadena', async () => {
      for (const sql of [
        "select NOMBRE, Cargo, 12 * (100000 + salario) AS Proyeccion_Anual from EMPLEADOS where ciudad = 'Bogotá' and estado = 'ACTIVO' order by 3 desc",
        "SELECT nombre, cargo, salario * 12 + 1200000 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad IN ('Bogotá') ORDER BY salario DESC",
        "-- reto final\nSELECT nombre,\n       cargo,\n       (salario + 100000) * 12 AS proyeccion_anual\nFROM empleados\nWHERE (estado = 'ACTIVO')\n  AND ciudad = 'Bogotá'\nORDER BY proyeccion_anual DESC",
      ]) {
        expect(await evaluate(sql), sql).toMatchObject({ kind: 'correct' });
      }
    });

    it('otros valores, otras filas u otro orden son incorrectos según la salida de Oracle', async () => {
      expect(
        await evaluate(
          "SELECT nombre, cargo, salario * 12 + 100000 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY proyeccion_anual DESC",
        ),
      ).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining('valores') });
      expect(
        await evaluate(
          "SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' OR ciudad = 'Bogotá' ORDER BY proyeccion_anual DESC",
        ),
      ).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining('filas') });
      expect(
        await evaluate(
          "SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY proyeccion_anual",
        ),
      ).toMatchObject({ kind: 'incorrect' });
    });

    it('los requisitos del pedido se comprueban antes de ejecutar (AS explícito, tres columnas)', async () => {
      expect(
        await evaluate(
          "SELECT nombre, cargo, (salario + 100000) * 12 proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY 3 DESC",
        ),
      ).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining('AS') });
      expect(await evaluate('SELECT * FROM empleados')).toMatchObject({ kind: 'incorrect' });
    });
  });
});
