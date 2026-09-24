// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';

// DATABASE_SCHEMA: una única definición versionada origina la carga de Oracle y la copia
// visual. El script de carga debe coincidir fila a fila con el módulo del dataset.
const SQL = readFileSync('oracle/empleados-select-v1.sql', 'utf8');

function parseInsert(line: string): (string | number)[] {
  const values = /VALUES \((.*)\);$/.exec(line)?.[1];
  if (!values) throw new Error(`INSERT no reconocido: ${line}`);
  return values
    .split(/,\s*/)
    .map((value) =>
      value.startsWith("'") ? value.slice(1, -1).replaceAll("''", "'") : Number(value),
    );
}

describe('carga Oracle del dataset empleados-select-v1', () => {
  it('inserta exactamente las seis filas del módulo del dataset', () => {
    const rows = SQL.split(/\r?\n/)
      .filter((line) => line.startsWith('INSERT INTO EMPLEADOS'))
      .map(parseInsert);
    const expected = EMPLEADOS_DATASET.rows.map((row) =>
      EMPLEADOS_DATASET.columns.map(({ name }) => row[name]),
    );
    expect(rows).toEqual(expected);
  });

  it('crea las seis columnas en el orden y con los tipos de DATABASE_SCHEMA', () => {
    const table = /CREATE TABLE EMPLEADOS \(([\s\S]*?)\n\);/.exec(SQL)?.[1] ?? '';
    const columns = table
      .split('\n')
      .map((line) => /^\s*(\w+)\s+(NUMBER\(\d+, \d+\)|VARCHAR2\(\d+ CHAR\))/.exec(line))
      .filter((match) => match !== null)
      .map((match) => `${match[1]} ${match[2]}`);
    expect(columns).toEqual([
      'ID NUMBER(4, 0)',
      'NOMBRE VARCHAR2(40 CHAR)',
      'EDAD NUMBER(3, 0)',
      'CIUDAD VARCHAR2(50 CHAR)',
      'SALARIO NUMBER(12, 2)',
      'DEPTO VARCHAR2(40 CHAR)',
    ]);
    expect(EMPLEADOS_DATASET.columns.map(({ name }) => name)).toEqual([
      'ID',
      'NOMBRE',
      'EDAD',
      'CIUDAD',
      'SALARIO',
      'DEPTO',
    ]);
    expect(SQL).toMatch(/COMMIT;/);
  });

  it('no contiene cuentas, contraseñas ni privilegios: eso lo crea el script de instalación', () => {
    expect(SQL).not.toMatch(/IDENTIFIED BY|GRANT|CREATE USER|PASSWORD/i);
  });
});
