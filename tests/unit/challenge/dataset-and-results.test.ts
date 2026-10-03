// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  datasetFingerprint,
  EMPLEADOS_COLUMNS,
  EMPLEADOS_DATASET,
  isEmpleadosColumn,
  rowValues,
} from '@/domain/dataset/empleados';
import {
  compareResults,
  distinctRows,
  isSortedBy,
  normalizeIdentifier,
  projectRows,
  sameRowMultiset,
} from '@/domain/results/result-table';

const rows = EMPLEADOS_DATASET.rows;
const count = (predicate: (row: (typeof rows)[number]) => boolean) => rows.filter(predicate).length;

describe('Dataset empleados-select-v2 (DATABASE_SCHEMA.md)', () => {
  it('tiene 12 columnas en el orden del esquema y 20 filas', () => {
    expect(EMPLEADOS_DATASET.id).toBe('empleados-select-v2');
    expect(EMPLEADOS_DATASET.columns.map(({ name }) => name)).toEqual([...EMPLEADOS_COLUMNS]);
    expect(EMPLEADOS_COLUMNS).toEqual([
      'ID_EMPLEADO',
      'NOMBRE',
      'APELLIDO',
      'CARGO',
      'DEPARTAMENTO',
      'CIUDAD',
      'SALARIO',
      'BONO',
      'FECHA_INGRESO',
      'ESTADO',
      'CORREO',
      'ID_JEFE',
    ]);
    expect(rows).toHaveLength(20);
    expect(rows.every((row) => Object.keys(row).length === 12)).toBe(true);
  });

  it('usa tipos de Oracle coherentes y solo BONO e ID_JEFE admiten NULL', () => {
    const types = Object.fromEntries(
      EMPLEADOS_DATASET.columns.map(({ name, type }) => [name, type]),
    );
    expect(types).toMatchObject({
      ID_EMPLEADO: 'number',
      SALARIO: 'number',
      FECHA_INGRESO: 'date',
    });
    expect(
      EMPLEADOS_DATASET.columns.filter(({ nullable }) => nullable).map(({ name }) => name),
    ).toEqual(['BONO', 'ID_JEFE']);
    for (const column of EMPLEADOS_DATASET.columns) {
      for (const value of rows.map((row) => row[column.name])) {
        if (value === null) {
          expect(column.nullable).toBe(true);
          continue;
        }
        if (column.type === 'number') expect(typeof value).toBe('number');
        if (column.type === 'text') expect(typeof value).toBe('string');
        if (column.type === 'date') expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('identificadores y correos únicos; cada jefe es un empleado anterior', () => {
    const ids = rows.map((row) => row.ID_EMPLEADO);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    const mails = rows.map((row) => row.CORREO);
    expect(new Set(mails).size).toBe(mails.length);
    expect(mails.every((mail) => /^[a-z]+\.[a-z]+@empresa\.example$/.test(mail))).toBe(true);
    for (const row of rows) {
      if (row.ID_JEFE !== null) expect(row.ID_JEFE).toBeLessThan(row.ID_EMPLEADO);
    }
  });

  it('está diseñado para cada concepto de la unidad', () => {
    // Ciudades y departamentos repetidos para WHERE, IN y DISTINCT.
    expect(count((row) => row.CIUDAD === 'Bogotá')).toBeGreaterThanOrEqual(5);
    expect(count((row) => row.CIUDAD === 'Medellín')).toBeGreaterThanOrEqual(3);
    expect(count((row) => row.CIUDAD === 'Cali')).toBeGreaterThanOrEqual(3);
    const departments = new Set(rows.map((row) => row.DEPARTAMENTO));
    expect(departments.size).toBeGreaterThanOrEqual(4);
    for (const department of departments) {
      expect(count((row) => row.DEPARTAMENTO === department)).toBeGreaterThanOrEqual(3);
    }
    // Límites exactos y valores justo fuera de BETWEEN 3000000 AND 6000000.
    const salaries = rows.map((row) => row.SALARIO);
    expect(salaries).toContain(3000000);
    expect(salaries).toContain(6000000);
    expect(salaries).toContain(2900000);
    expect(salaries).toContain(6100000);
    // Empates para ORDER BY.
    expect(new Set(salaries).size).toBeLessThan(salaries.length);
    // NULL frente a 0.
    expect(count((row) => row.BONO === null)).toBeGreaterThanOrEqual(3);
    expect(count((row) => row.BONO === 0)).toBe(1);
    expect(count((row) => row.ID_JEFE === null)).toBeGreaterThanOrEqual(2);
    // LIKE: nombres que empiezan por A y que contienen «ar».
    expect(count((row) => row.NOMBRE.startsWith('A'))).toBeGreaterThanOrEqual(2);
    expect(count((row) => row.NOMBRE.includes('ar'))).toBeGreaterThanOrEqual(3);
    // Estados y fechas en distintos años.
    expect(new Set(rows.map((row) => row.ESTADO))).toEqual(new Set(['ACTIVO', 'INACTIVO']));
    expect(new Set(rows.map((row) => row.FECHA_INGRESO.slice(0, 4))).size).toBeGreaterThanOrEqual(
      8,
    );
    // Cargos repetidos.
    expect(new Set(rows.map((row) => row.CARGO)).size).toBeLessThan(rows.length / 2);
  });

  it('la consulta integradora tiene un caso descartado por cada condición', () => {
    const bogota = rows.filter((row) => row.CIUDAD === 'Bogotá');
    const inRange = bogota.filter((row) => row.SALARIO >= 3000000 && row.SALARIO <= 6000000);
    expect(inRange.some((row) => row.ESTADO === 'INACTIVO')).toBe(true);
    expect(inRange.filter((row) => row.ESTADO === 'ACTIVO').map((row) => row.NOMBRE)).toEqual([
      'Laura',
      'Andrés',
      'Mario',
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
      rows: rows.map((row) => (row.NOMBRE === 'María' ? { ...row, BONO: 1 } : row)),
    };
    expect(datasetFingerprint(altered)).not.toBe(fingerprint);
  });

  it('reconoce solo las columnas del esquema', () => {
    expect(isEmpleadosColumn('SALARIO')).toBe(true);
    expect(isEmpleadosColumn('SUELDO')).toBe(false);
    expect(isEmpleadosColumn('salario')).toBe(false);
    expect(rowValues(EMPLEADOS_DATASET, rows[0]!)).toHaveLength(12);
  });
});

describe('Comparación de resultados tabulares (LAB_SPEC, S02–S09)', () => {
  it('S03: proyectar CIUDAD conserva las 20 filas con repeticiones', () => {
    const cities = projectRows(rows, ['CIUDAD']);
    expect(cities.rows).toHaveLength(20);
    expect(distinctRows(cities).rows).toHaveLength(5);
  });

  it('S04: DISTINCT sobre CIUDAD y DEPARTAMENTO compara el par completo', () => {
    const pairs = distinctRows(projectRows(rows, ['CIUDAD', 'DEPARTAMENTO'])).rows;
    expect(pairs).toHaveLength(16);
    expect(pairs).toContainEqual(['Bogotá', 'TI']);
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

  it('NULL se compara como un valor más en los multiconjuntos', () => {
    expect(sameRowMultiset([[null], [1]], [[1], [null]])).toBe(true);
    expect(sameRowMultiset([[null]], [['']])).toBe(false);
  });

  it('isSortedBy admite empates en cualquier orden y aplica NULLS LAST/FIRST', () => {
    const tied = [
      ['Andrés', 4200000],
      ['Paula', 4200000],
      ['Oscar', 3800000],
    ];
    expect(isSortedBy(tied, [{ column: 1, direction: 'DESC' }])).toBe(true);
    expect(isSortedBy([tied[1]!, tied[0]!, tied[2]!], [{ column: 1, direction: 'DESC' }])).toBe(
      true,
    );
    expect(isSortedBy([...tied].reverse(), [{ column: 1, direction: 'DESC' }])).toBe(false);
    expect(isSortedBy([[1], [2], [null]], [{ column: 0, direction: 'ASC' }])).toBe(true);
    expect(isSortedBy([[null], [2], [1]], [{ column: 0, direction: 'DESC' }])).toBe(true);
    expect(isSortedBy([[null], [1]], [{ column: 0, direction: 'ASC' }])).toBe(false);
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
