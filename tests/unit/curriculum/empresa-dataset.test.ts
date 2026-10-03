import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import {
  cell,
  EMPRESA_TABLES,
  empresaOracleScript,
  empresaTable,
  SIN_DEPARTAMENTO,
} from '@/domain/dataset/empresa';

/** Dataset empresa-relacional-v1: coherencia interna, claves y script Oracle generado. */

const table = (name: string) => empresaTable(name)!;

describe('Dataset empresa-relacional-v1', () => {
  it('el script versionado coincide con el generado desde la fuente TypeScript', () => {
    expect(readFileSync('oracle/dblab-empresa-v1.sql', 'utf8')).toBe(empresaOracleScript());
  });

  it('tamaños educativos y visualizables', () => {
    expect(table('EMPLEADOS').rows).toHaveLength(20);
    expect(table('DEPARTAMENTOS').rows).toHaveLength(6);
    expect(table('PROYECTOS').rows).toHaveLength(7);
    expect(table('ASIGNACIONES').rows.length).toBeGreaterThanOrEqual(15);
    expect(table('AUDITORIA_SALARIOS').rows).toHaveLength(0);
  });

  it('cada fila tiene tantos valores como columnas y respeta NOT NULL y tipos', () => {
    for (const entry of EMPRESA_TABLES) {
      for (const row of entry.rows) {
        expect(row).toHaveLength(entry.columns.length);
        entry.columns.forEach((column, index) => {
          const value = row[index];
          if (value === null) expect(column.nullable, `${entry.name}.${column.name}`).toBe(true);
          else if (column.type === 'number') expect(typeof value).toBe('number');
          else if (column.type === 'date') expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          else expect(typeof value).toBe('string');
        });
      }
    }
  });

  it('claves primarias únicas y claves foráneas válidas (NULL permitido)', () => {
    for (const entry of EMPRESA_TABLES) {
      const keys = entry.rows.map((row) =>
        entry.primaryKey.columns.map((column) => cell(entry, row, column)).join('|'),
      );
      expect(new Set(keys).size, entry.name).toBe(keys.length);
      for (const key of entry.foreignKeys) {
        const parent = table(key.references);
        const parentKeys = new Set(
          parent.rows.map((row) =>
            key.referencedColumns.map((c) => cell(parent, row, c)).join('|'),
          ),
        );
        for (const row of entry.rows) {
          const values = key.columns.map((column) => cell(entry, row, column));
          if (values.some((value) => value === null)) continue;
          expect(parentKeys.has(values.join('|')), `${entry.name} → ${key.name}`).toBe(true);
        }
      }
    }
  });

  it('reutiliza a las mismas 20 personas de la Sección 1', () => {
    const empleados = table('EMPLEADOS');
    EMPLEADOS_DATASET.rows.forEach((person, index) => {
      const row = empleados.rows[index]!;
      expect(cell(empleados, row, 'ID_EMPLEADO')).toBe(person.ID_EMPLEADO);
      expect(cell(empleados, row, 'NOMBRE')).toBe(person.NOMBRE);
      expect(cell(empleados, row, 'SALARIO')).toBe(person.SALARIO);
      expect(cell(empleados, row, 'BONO')).toBe(person.BONO);
      expect(cell(empleados, row, 'ID_JEFE')).toBe(person.ID_JEFE);
    });
  });

  it('casos deliberados: sin pareja, NULL y grupos con repetidos', () => {
    const empleados = table('EMPLEADOS');
    const sinDepartamento = empleados.rows.filter(
      (row) => cell(empleados, row, 'ID_DEPARTAMENTO') === null,
    );
    expect(sinDepartamento.map((row) => cell(empleados, row, 'ID_EMPLEADO'))).toEqual([
      SIN_DEPARTAMENTO,
    ]);
    const usados = new Set(empleados.rows.map((row) => cell(empleados, row, 'ID_DEPARTAMENTO')));
    const vacios = table('DEPARTAMENTOS').rows.filter((row) => !usados.has(row[0]!));
    expect(vacios.map((row) => row[1])).toEqual(['Investigación']);
    const asignados = new Set(table('ASIGNACIONES').rows.map((row) => row[1]));
    const sinAsignar = table('PROYECTOS').rows.filter((row) => !asignados.has(row[0]!));
    expect(sinAsignar.map((row) => row[0])).toEqual([106]);
  });
});
