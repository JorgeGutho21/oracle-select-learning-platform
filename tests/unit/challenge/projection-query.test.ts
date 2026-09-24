// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { analyzeProjection, tokenizeSql, tokensFromPieces } from '@/domain/sql/projection-query';

const analyze = (sql: string) => analyzeProjection(tokenizeSql(sql));
const result = (sql: string) => {
  const analysis = analyze(sql);
  if (!analysis.ok) throw new Error(analysis.error.code);
  return analysis.result;
};

describe('Analizador estructural de proyecciones', () => {
  it('tokeniza respetando operadores, puntuación y palabras', () => {
    expect(tokenizeSql('SELECT nombre,salario*12 AS anual FROM empleados;')).toEqual([
      'SELECT',
      'nombre',
      ',',
      'salario',
      '*',
      '12',
      'AS',
      'anual',
      'FROM',
      'empleados',
      ';',
    ]);
    expect(tokensFromPieces(['SELECT', 'salario * 12', 'AS salario_anual'])).toEqual([
      'SELECT',
      'salario',
      '*',
      '12',
      'AS',
      'salario_anual',
    ]);
  });

  it('S01: * devuelve seis columnas del esquema y seis filas', () => {
    const table = result('SELECT * FROM empleados;');
    expect(table.columns).toEqual(['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO']);
    expect(table.rows).toHaveLength(6);
  });

  it('S02 y S11: respeta el orden de columnas y tolera caja y terminador', () => {
    expect(result('select ciudad, nombre from EMPLEADOS').columns).toEqual(['CIUDAD', 'NOMBRE']);
    expect(result('SELECT nombre FROM empleados;')).toEqual(result('select NOMBRE from empleados'));
  });

  it('S03 y S04: conserva multiplicidad salvo DISTINCT sobre la fila completa', () => {
    expect(result('SELECT ciudad FROM empleados').rows).toHaveLength(6);
    expect(result('SELECT DISTINCT ciudad FROM empleados').rows).toHaveLength(3);
    expect(result('SELECT DISTINCT ciudad, depto FROM empleados').rows).toHaveLength(5);
  });

  it('S05 y S07: alias etiquetan la salida y la precedencia se respeta', () => {
    const table = result('SELECT nombre, salario * 12 AS salario_anual FROM empleados');
    expect(table.columns).toEqual(['NOMBRE', 'SALARIO_ANUAL']);
    expect(table.rows[0]).toEqual(['Ana', 36000000]);
    expect(result('SELECT salario + 100000 * 12 AS total FROM empleados').rows[0]).toEqual([
      4200000,
    ]);
    expect(result('SELECT (salario + 100000) * 12 AS total FROM empleados').rows[0]).toEqual([
      37200000,
    ]);
  });

  it('una expresión sin alias usa la propia expresión como encabezado', () => {
    expect(result('SELECT salario * 12 FROM empleados').columns).toEqual(['SALARIO*12']);
  });

  it('S06 (LAB10): sin coma, el segundo identificador es un alias implícito', () => {
    const analysis = analyze('SELECT nombre salario FROM empleados;');
    expect(analysis.ok).toBe(true);
    if (!analysis.ok) return;
    expect(analysis.query.items).toHaveLength(1);
    expect(analysis.query.items[0]).toMatchObject({
      alias: 'salario',
      aliasKind: 'implicit',
      header: 'SALARIO',
    });
    expect(analysis.result.rows[0]).toEqual(['Ana']);
  });

  it.each([
    ['', 'empty'],
    ['nombre FROM empleados', 'missing-select'],
    ['SELECT nombre', 'missing-from'],
    ['SELECT nombre FROM', 'missing-table'],
    ['SELECT nombre FROM usuarios', 'unknown-table'],
    ['SELECT nombre FROM ciudad empleados', 'unknown-table'],
    ['SELECT nombre FROM empleados AS x', 'trailing-tokens'],
    ['SELECT nombre, FROM empleados', 'empty-item'],
    ['SELECT *, nombre FROM empleados', 'star-mixed'],
    ['SELECT nombre, DISTINCT ciudad FROM empleados', 'misplaced-keyword'],
    ['SELECT nombre AS FROM empleados', 'alias-without-name'],
    ['SELECT salario * FROM empleados', 'invalid-expression'],
    ['SELECT sueldo FROM empleados', 'unknown-column'],
    ['SELECT nombre * 2 FROM empleados', 'not-numeric'],
    ['SELECT salario / 0 FROM empleados', 'division-by-zero'],
    ["SELECT 'x' FROM empleados", 'invalid-character'],
  ])('rechaza «%s» con %s', (sql, code) => {
    const analysis = analyze(sql);
    expect(analysis.ok).toBe(false);
    if (!analysis.ok) expect(analysis.error.code).toBe(code);
  });

  it('no altera el dataset al calcular expresiones', () => {
    result('SELECT salario * 12 AS salario FROM empleados');
    expect(result('SELECT salario FROM empleados').rows[0]).toEqual([3000000]);
  });
});
