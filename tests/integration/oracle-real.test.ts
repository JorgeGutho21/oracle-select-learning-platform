// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';
import type { OracleExecutionResult } from '@/application/oracle-executor';
import { compareResults } from '@/domain/results/result-table';
import { runEducational } from '@/domain/sql/educational-run';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';
import { PUBLIC_MISSIONS } from '@/features/challenge/domain/missions/public-catalog';
import { executeOnOracle } from '@/features/laboratory/application/execute-on-oracle';
import { LAB_EXAMPLES } from '@/features/laboratory/domain/examples';
import { oracleConfigFromEnv } from '@/infrastructure/oracle/oracle-config';
import { loadOracledb } from '@/infrastructure/oracle/oracledb-driver';
import { OracledbQueryExecutor } from '@/infrastructure/oracle/oracledb-query-executor';

/**
 * Ejecución real en Oracle (LAB11–LAB16 y G10). Solo corre si el entorno tiene la cuenta
 * lectora (ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING), por ejemplo en `.env.local`
 * tras `npm run oracle:setup`. Sin esas variables se omite: no hay secretos en el repositorio.
 */

// Se lee .env.local sin modificar process.env: otras suites del mismo proceso no deben ver Oracle.
const local = existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')) : {};
const configuration = oracleConfigFromEnv({ ...local, ...process.env });
const configured = configuration.kind === 'configured';

describe.skipIf(!configured)('Oracle real', () => {
  if (configuration.kind !== 'configured') return;
  const executor = new OracledbQueryExecutor(configuration.config, loadOracledb);
  afterAll(() => executor.close());

  const run = async (sql: string) => {
    const execution = await executeOnOracle(sql, executor);
    if (execution.status !== 'ok') throw new Error(`No se ejecutó: ${JSON.stringify(execution)}`);
    return execution;
  };
  const table = (execution: Extract<OracleExecutionResult, { status: 'ok' }>) => ({
    columns: execution.columns.map(({ name }) => name),
    rows: execution.rows,
  });

  it('la salud comprueba el dataset versionado y una cuenta solo lectora', async () => {
    const status = await executor.status();
    expect(status).toMatchObject({ available: true, reason: null });
    expect(status.message).toContain('empleados-select-v1');
  });

  it.each(LAB_EXAMPLES.map((example) => [example.id, example.sql] as const))(
    'LAB11 %s: Oracle devuelve lo mismo que el análisis educativo, con tipos',
    async (_id, sql) => {
      const execution = await run(sql);
      const educational = runEducational(sql).result;
      expect(educational).not.toBeNull();
      expect(compareResults(table(execution), educational!.table)).toEqual({ equal: true });
      expect(execution.columns.map(({ type }) => type)).toEqual(
        educational!.columns.map(({ type }) => type),
      );
      expect(execution.engine).toMatch(/^Oracle Database \d+/);
    },
  );

  it('LAB03 y LAB06–LAB08: valores exactos pedidos por LAB_SPEC', async () => {
    const lab03 = await run('SELECT nombre, salario * 12 AS salario_anual FROM empleados;');
    expect(lab03.rows).toEqual(
      expect.arrayContaining([
        ['Ana', 36000000],
        ['Carlos', 60000000],
      ]),
    );
    const lab06 = await run('SELECT nombre, salario + 100000 * 12 AS total FROM empleados');
    expect(lab06.rows).toContainEqual(['Ana', 4200000]);
    const lab07 = await run('SELECT nombre, (salario + 100000) * 12 AS total FROM empleados');
    expect(lab07.rows).toContainEqual(['Ana', 37200000]);
    const lab09 = await run('SELECT nombre AS "Nombre empleado" FROM empleados;');
    expect(lab09.columns).toEqual([{ name: 'Nombre empleado', type: 'text' }]);
    const lab10 = await run('SELECT nombre salario FROM empleados;');
    expect(lab10.columns).toEqual([{ name: 'SALARIO', type: 'text' }]);
    expect(lab10.rows).toContainEqual(['María']);
  });

  it('LAB12: espacios, mayúsculas, comentarios y terminador no cambian el resultado', async () => {
    const reference = table(await run('SELECT nombre, ciudad FROM empleados'));
    for (const variant of [
      'select   NOMBRE ,ciudad\n\tfrom Empleados ;',
      '-- pedido\nSELECT nombre, ciudad -- columnas\nFROM empleados',
    ]) {
      expect(compareResults(table(await run(variant)), reference)).toEqual({ equal: true });
    }
  });

  it('LAB13/LAB14: lo rechazado no llega a Oracle; dividir entre cero es un error ORA real', async () => {
    for (const sql of [
      'DELETE FROM empleados',
      'SELECT * FROM empleados; DROP TABLE empleados',
      'SELECT * FROM usuarios',
      'SELECT nombre FROM empleados WHERE edad > 20',
    ]) {
      expect((await executeOnOracle(sql, executor)).status).toBe('rejected');
    }
    expect(await executeOnOracle('SELECT salario / 0 FROM empleados', executor)).toMatchObject({
      status: 'oracle-error',
      code: 'ORA-01476',
    });
    // Los datos siguen intactos.
    expect((await run('SELECT * FROM empleados')).rows).toHaveLength(6);
  });

  it('LAB13: la cuenta lectora no puede escribir aunque se salte el analizador', async () => {
    const direct = await executor.execute({ statement: "UPDATE EMPLEADOS SET NOMBRE = 'X'" });
    expect(direct).toMatchObject({ status: 'oracle-error' });
    expect((direct as { code: string }).code).toMatch(/^ORA-(01031|41900)$/);
    expect((await run('SELECT nombre FROM empleados')).rows).toContainEqual(['Ana']);
  });

  it('LAB14: un plazo agotado no agota el grupo de conexiones', async () => {
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
        ).toMatchObject({
          status: 'ok',
          rows: [[6]],
        });
      }
    } finally {
      await impatient.close();
    }
  });

  it('LAB15: el mismo contenido en otro orden de filas es equivalente', async () => {
    const one = table(await run('SELECT DISTINCT ciudad, depto FROM empleados'));
    expect(one.rows).toHaveLength(5);
    const reversed = { columns: one.columns, rows: [...one.rows].reverse() };
    expect(compareResults(reversed, one)).toEqual({ equal: true });
    expect(compareResults({ columns: one.columns, rows: one.rows.slice(1) }, one)).toMatchObject({
      equal: false,
    });
  });

  describe('M10 — Final Boss: Query Master (G10)', () => {
    const evaluator = new InProcessMissionEvaluator(executor);
    const version = PUBLIC_MISSIONS.find(({ id }) => id === 'M10')!.version;
    const evaluate = (sql: string) =>
      evaluator.evaluate({
        missionId: 'M10',
        missionVersion: version,
        answer: { type: 'write-query', sql },
      });

    it('la solución de referencia es correcta al ejecutarse en Oracle', async () => {
      expect(
        await evaluate(
          'SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados;',
        ),
      ).toMatchObject({ kind: 'correct' });
    });

    it('acepta expresiones equivalentes: no se compara la cadena', async () => {
      for (const sql of [
        'select NOMBRE, Ciudad, 12 * (100000 + salario) AS Proyeccion_Anual from EMPLEADOS',
        'SELECT nombre, ciudad, salario * 12 + 1200000 AS proyeccion_anual FROM empleados',
        '-- reto final\nSELECT nombre,\n       ciudad,\n       (salario + 100000) * 12 AS proyeccion_anual\nFROM empleados',
      ]) {
        expect(await evaluate(sql)).toMatchObject({ kind: 'correct' });
      }
    });

    it('un cálculo con otros valores es incorrecto según la salida real de Oracle', async () => {
      expect(
        await evaluate(
          'SELECT nombre, ciudad, salario * 12 + 100000 AS proyeccion_anual FROM empleados',
        ),
      ).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining('valores') });
      expect(
        await evaluate('SELECT nombre, ciudad, salario * 12 AS proyeccion_anual FROM empleados'),
      ).toMatchObject({ kind: 'incorrect' });
    });

    it('los requisitos del pedido se comprueban antes de ejecutar (AS explícito, tres columnas)', async () => {
      expect(
        await evaluate(
          'SELECT nombre, ciudad, (salario + 100000) * 12 proyeccion_anual FROM empleados',
        ),
      ).toMatchObject({ kind: 'incorrect', feedback: expect.stringContaining('AS') });
      expect(await evaluate('SELECT * FROM empleados')).toMatchObject({ kind: 'incorrect' });
    });
  });
});
