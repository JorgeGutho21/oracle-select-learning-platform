// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { OracleQueryExecutor } from '@/application/oracle-executor';
import { executeLabQuery, getLabOracleStatus } from '@/composition/lab/actions';
import { executeOnOracle } from '@/features/laboratory/application/execute-on-oracle';
import { analyzeLabQuery, LAB_EXAMPLES } from '@/features/laboratory/application/lab-api';
import { UnconfiguredOracleExecutor } from '@/infrastructure/oracle/unconfigured-oracle-executor';

const fakeOracle = (): OracleQueryExecutor & { execute: ReturnType<typeof vi.fn> } => ({
  status: vi.fn(),
  execute: vi
    .fn()
    .mockResolvedValue({ status: 'ok', columns: [], rows: [], elapsedMs: 1, engine: 'prueba' }),
});

describe('Análisis educativo del laboratorio', () => {
  it('SELECT nombre, salario: SELECT, FROM, columnas fuente, resultado y traducción', () => {
    const analysis = analyzeLabQuery('SELECT nombre, salario\nFROM empleados;');
    expect(analysis.status).toBe('valid');
    expect(analysis.anatomy.map((part) => part.role)).toEqual([
      'select',
      'column',
      'separator',
      'column',
      'from',
      'table',
      'terminator',
    ]);
    expect(analysis.sourceColumns).toEqual(['NOMBRE', 'SALARIO']);
    expect(analysis.preview?.columns).toEqual([
      { name: 'NOMBRE', type: 'text' },
      { name: 'SALARIO', type: 'number' },
    ]);
    expect(analysis.preview?.rows[0]).toEqual(['Ana', 3000000]);
    expect(analysis.preview?.datasetId).toBe('empleados-select-v1');
    expect(analysis.translation?.summary).toBe(
      'Para cada fila de la tabla EMPLEADOS, muestra la columna NOMBRE y la columna SALARIO.',
    );
    expect(analysis.canonicalSql).toBe('SELECT NOMBRE, SALARIO FROM EMPLEADOS');
  });

  it('SELECT con salario * 12 AS salario_anual: expresión, alias y resultado anual', () => {
    const analysis = analyzeLabQuery(
      'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
    );
    expect(analysis.anatomy.find((part) => part.role === 'expression')?.text).toBe('salario * 12');
    expect(analysis.anatomy.find((part) => part.role === 'alias')?.text).toBe('AS salario_anual');
    expect(analysis.preview?.columns.map(({ name }) => name)).toEqual(['NOMBRE', 'SALARIO_ANUAL']);
    expect(analysis.preview?.rows[0]).toEqual(['Ana', 36000000]);
    expect(analysis.translation?.steps.join(' ')).toContain(
      'calcula SALARIO multiplicado por 12 y lo muestra como SALARIO_ANUAL',
    );
  });

  it('una consulta inválida devuelve diagnósticos con posición y sin vista previa', () => {
    const analysis = analyzeLabQuery('SELECT nombre,\nFROM empleados');
    expect(analysis.status).toBe('invalid');
    expect(analysis.preview).toBeNull();
    expect(analysis.translation).toBeNull();
    expect(analysis.canonicalSql).toBeNull();
    expect(analysis.diagnostics[0]).toMatchObject({
      severity: 'error',
      category: 'syntax',
      line: 1,
      column: 14,
    });
  });

  it('la división entre cero es válida sintácticamente, pero no produce vista previa', () => {
    const analysis = analyzeLabQuery('SELECT salario / 0 FROM empleados');
    expect(analysis.status).toBe('invalid');
    expect(analysis.diagnostics.at(-1)).toMatchObject({ category: 'operation' });
  });

  it('los ejemplos LAB01–LAB10 se analizan sin errores', () => {
    expect(LAB_EXAMPLES.map(({ id }) => id)).toEqual([
      'LAB01',
      'LAB02',
      'LAB03',
      'LAB04',
      'LAB05',
      'LAB06',
      'LAB07',
      'LAB08',
      'LAB09',
      'LAB10',
    ]);
    for (const example of LAB_EXAMPLES)
      expect(analyzeLabQuery(example.sql).status, example.id).toBe('valid');
  });
});

describe('Ejecución en Oracle: separada del análisis y nunca simulada', () => {
  it('una consulta rechazada nunca llega al motor', async () => {
    const oracle = fakeOracle();
    for (const sql of [
      'DELETE FROM empleados',
      'SELECT * FROM empleados; DROP TABLE empleados',
      'SELECT sueldo FROM empleados',
      '',
    ]) {
      await expect(executeOnOracle(sql, oracle)).resolves.toMatchObject({ status: 'rejected' });
    }
    expect(oracle.execute).not.toHaveBeenCalled();
  });

  it('envía solo la sentencia canónica construida desde el árbol', async () => {
    const oracle = fakeOracle();
    await executeOnOracle('select nombre -- comentario\n from empleados;', oracle, 'req-1');
    expect(oracle.execute).toHaveBeenCalledWith({
      statement: 'SELECT NOMBRE FROM EMPLEADOS',
      requestId: 'req-1',
    });
  });

  it('sin Oracle configurado declara indisponibilidad y no devuelve filas', async () => {
    const executor = new UnconfiguredOracleExecutor();
    await expect(executor.status()).resolves.toMatchObject({
      available: false,
      reason: 'not-configured',
    });
    const result = await executeOnOracle('SELECT nombre FROM empleados', executor);
    expect(result).toMatchObject({ status: 'unavailable', reason: 'not-configured' });
    expect(result).not.toHaveProperty('rows');
  });

  it('las Server Functions del laboratorio validan la entrada y no simulan Oracle', async () => {
    await expect(getLabOracleStatus()).resolves.toMatchObject({ available: false });
    await expect(executeLabQuery('SELECT nombre FROM empleados')).resolves.toMatchObject({
      status: 'unavailable',
    });
    await expect(executeLabQuery('DROP TABLE empleados')).resolves.toMatchObject({
      status: 'rejected',
    });
    await expect(executeLabQuery(42 as unknown as string)).resolves.toMatchObject({
      status: 'rejected',
    });
  });
});
