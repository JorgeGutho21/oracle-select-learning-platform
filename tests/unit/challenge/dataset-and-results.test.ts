// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  datasetFingerprint,
  EMPLEADOS_COLUMNS,
  EMPLEADOS_DATASET,
  isEmpleadosColumn,
} from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  normalizeIdentifier,
  projectRows,
  sameRowMultiset,
} from '@/domain/results/result-table';

const rows = EMPLEADOS_DATASET.rows;

describe('Dataset empleados-select-v1 (DATABASE_SCHEMA.md)', () => {
  it('tiene seis columnas en el orden del esquema y seis filas', () => {
    expect(EMPLEADOS_DATASET.id).toBe('empleados-select-v1');
    expect(EMPLEADOS_DATASET.columns.map(({ name }) => name)).toEqual([...EMPLEADOS_COLUMNS]);
    expect(EMPLEADOS_COLUMNS).toEqual(['ID', 'NOMBRE', 'EDAD', 'CIUDAD', 'SALARIO', 'DEPTO']);
    expect(rows).toHaveLength(6);
  });

  it('usa la reconciliación F1: María 30 y Jorge 22 en Sistemas, sin TELEFONO', () => {
    const maria = rows.find((row) => row.NOMBRE === 'María');
    const jorge = rows.find((row) => row.NOMBRE === 'Jorge');
    expect(maria?.EDAD).toBe(30);
    expect(jorge).toMatchObject({ EDAD: 22, DEPTO: 'Sistemas', CIUDAD: 'Bogotá' });
    expect(rows.every((row) => Object.keys(row).length === 6 && !('TELEFONO' in row))).toBe(true);
  });

  it('conserva los valores exactos de las seis filas', () => {
    expect(rows.map((row) => [row.ID, row.NOMBRE, row.SALARIO])).toEqual([
      [1, 'Ana', 3000000],
      [2, 'Carlos', 5000000],
      [3, 'Laura', 4200000],
      [4, 'Pedro', 1800000],
      [5, 'María', 3700000],
      [6, 'Jorge', 2800000],
    ]);
  });

  it('es inmutable en profundidad', () => {
    expect(Object.isFrozen(EMPLEADOS_DATASET)).toBe(true);
    expect(Object.isFrozen(EMPLEADOS_DATASET.rows)).toBe(true);
    expect(Object.isFrozen(rows[0])).toBe(true);
    expect(() => {
      (rows[0] as { SALARIO: number }).SALARIO = 1;
    }).toThrow(TypeError);
  });

  it('produce una huella estable que cambia si cambia un valor', () => {
    const fingerprint = datasetFingerprint(EMPLEADOS_DATASET);
    expect(fingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(datasetFingerprint(EMPLEADOS_DATASET)).toBe(fingerprint);
    const altered = {
      ...EMPLEADOS_DATASET,
      rows: rows.map((row) => (row.NOMBRE === 'María' ? { ...row, EDAD: 31 } : row)),
    };
    expect(datasetFingerprint(altered)).not.toBe(fingerprint);
  });

  it('reconoce solo las columnas del esquema', () => {
    expect(isEmpleadosColumn('SALARIO')).toBe(true);
    expect(isEmpleadosColumn('SUELDO')).toBe(false);
    expect(isEmpleadosColumn('salario')).toBe(false);
  });
});

describe('Comparación de resultados tabulares (LAB_SPEC, S02–S09)', () => {
  it('S03: proyectar CIUDAD conserva las seis filas con repeticiones', () => {
    const cities = projectRows(rows, ['CIUDAD']);
    expect(cities.rows).toHaveLength(6);
    expect(distinctRows(cities).rows).toEqual([['Bogotá'], ['Cali'], ['Medellín']]);
  });

  it('S04: DISTINCT sobre CIUDAD y DEPTO deja cinco pares', () => {
    const pairs = distinctRows(projectRows(rows, ['CIUDAD', 'DEPTO'])).rows;
    expect(pairs).toHaveLength(5);
    expect(pairs).toContainEqual(['Bogotá', 'Sistemas']);
    expect(pairs).toContainEqual(['Bogotá', 'Ventas']);
  });

  it('S02: el orden de columnas forma parte de la salida', () => {
    const left = projectRows(rows, ['CIUDAD', 'NOMBRE']);
    const right = projectRows(rows, ['NOMBRE', 'CIUDAD']);
    expect(compareResults(left, right)).toEqual({ equal: false, difference: 'columns' });
  });

  it('S09: permutar filas conserva la igualdad y quitar una repetición la rompe', () => {
    const table = projectRows(rows, ['CIUDAD']);
    const reversed = { columns: table.columns, rows: [...table.rows].reverse() };
    expect(compareResults(reversed, table)).toEqual({ equal: true });
    expect(compareResults(distinctRows(table), table)).toEqual({
      equal: false,
      difference: 'row-count',
    });
    expect(sameRowMultiset([['a'], ['a'], ['b']], [['a'], ['b'], ['b']])).toBe(false);
  });

  it('normaliza identificadores no entrecomillados a mayúsculas', () => {
    expect(normalizeIdentifier('  salario_anual ')).toBe('SALARIO_ANUAL');
    expect(
      compareResults(
        { columns: ['nombre'], rows: [['Ana']] },
        { columns: ['NOMBRE'], rows: [['Ana']] },
      ),
    ).toEqual({ equal: true });
  });

  it('no quita tildes de los datos al comparar', () => {
    expect(sameRowMultiset([['Bogota']], [['Bogotá']])).toBe(false);
  });
});
