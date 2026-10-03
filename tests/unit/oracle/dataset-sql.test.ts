// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_DATASET, rowValues } from '@/domain/dataset/empleados';

// DATABASE_SCHEMA: una única definición versionada origina la carga de Oracle y la copia
// visual. El script de carga debe coincidir fila a fila con el módulo del dataset.
const SQL = readFileSync('oracle/empleados-select-v2.sql', 'utf8');

/** Valores de un INSERT: textos, números, NULL y literales DATE 'AAAA-MM-DD'. */
function parseInsert(line: string): (string | number | null)[] {
  const values = /VALUES \((.*)\);$/.exec(line)?.[1];
  if (!values) throw new Error(`INSERT no reconocido: ${line}`);
  const tokens = values.match(/DATE '[^']*'|'(?:[^']|'')*'|[^,\s][^,]*/g) ?? [];
  return tokens.map((token) => {
    const value = token.trim();
    if (value === 'NULL') return null;
    if (value.startsWith('DATE ')) return value.slice(6, -1);
    if (value.startsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
    return Number(value);
  });
}

describe('carga Oracle del dataset empleados-select-v2', () => {
  it('inserta exactamente las 20 filas del módulo del dataset', () => {
    const rows = SQL.split(/\r?\n/)
      .filter((line) => line.startsWith('INSERT INTO EMPLEADOS'))
      .map(parseInsert);
    const expected = EMPLEADOS_DATASET.rows.map((row) => rowValues(EMPLEADOS_DATASET, row));
    expect(rows).toEqual(expected);
  });

  it('crea las 12 columnas en el orden y con los tipos de DATABASE_SCHEMA', () => {
    const table = /CREATE TABLE EMPLEADOS \(([\s\S]*?)\n\);/.exec(SQL)?.[1] ?? '';
    const columns = table
      .split('\n')
      .map((line) => /^\s*(\w+)\s+(NUMBER\(\d+\)|VARCHAR2\(\d+ CHAR\)|DATE)/.exec(line))
      .filter((match) => match !== null)
      .map((match) => `${match[1]} ${match[2]}`);
    expect(columns).toEqual(
      EMPLEADOS_DATASET.columns.map(({ name, oracleType }) => `${name} ${oracleType}`),
    );
    expect(SQL).toMatch(/COMMIT;/);
  });

  it('declara las restricciones que enseña el nivel 7: PK, FK, UNIQUE, CHECK y NOT NULL', () => {
    expect(SQL).toMatch(/PRIMARY KEY/);
    expect(SQL).toMatch(/REFERENCES EMPLEADOS \(ID_EMPLEADO\)/);
    expect(SQL).toMatch(/UNIQUE/);
    expect(SQL).toMatch(/CHECK \(ESTADO IN \('ACTIVO', 'INACTIVO'\)\)/);
    const nullable = EMPLEADOS_DATASET.columns
      .filter(({ nullable }) => nullable)
      .map(({ name }) => name);
    for (const column of EMPLEADOS_DATASET.columns) {
      const line =
        SQL.split('\n').find((entry) => entry.trim().startsWith(`${column.name} `)) ?? '';
      expect(/NOT NULL|PRIMARY KEY/.test(line)).toBe(!nullable.includes(column.name));
    }
  });

  it('las fechas usan literales DATE: no dependen del formato de la sesión', () => {
    expect(SQL).not.toMatch(/TO_DATE/);
    expect(SQL.match(/DATE '\d{4}-\d{2}-\d{2}'/g)).toHaveLength(20);
  });

  it('no contiene cuentas, contraseñas ni privilegios: eso lo crea el script de instalación', () => {
    expect(SQL).not.toMatch(/IDENTIFIED BY|GRANT|CREATE USER|PASSWORD/i);
  });
});
