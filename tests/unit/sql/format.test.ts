// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SQL_CONCEPTS, CONCEPT_IDS } from '@/application/sql-concepts';
import { formatSql } from '@/application/sql-format';
import { lex } from '@/domain/sql/lexer';
import { analyzeLabQuery, LAB_EXAMPLES } from '@/features/laboratory/application/lab-api';
import { LESSONS } from '@/features/study/application/study-api';

/** Tokens significativos: el formateador solo puede cambiar espacios y saltos de línea. */
function tokens(sql: string): string[] {
  return lex(sql)
    .tokens.filter((token) => token.kind !== 'eof')
    .map((token) => `${token.kind}:${token.text}`);
}

const QUERIES = [
  ...LAB_EXAMPLES.map(({ sql }) => sql),
  ...LESSONS.flatMap(({ content }) => [
    content.example.sql,
    ...(content.comparisons ?? []).map(({ sql }) => sql),
    ...(content.steps ?? []).map(({ sql }) => sql),
  ]),
  ...CONCEPT_IDS.map((id) => SQL_CONCEPTS[id].example),
];

describe('formateador SQL', () => {
  it('parte cada cláusula en su línea y una lista IN larga en un valor por línea', () => {
    expect(
      formatSql("SELECT nombre FROM empleados WHERE ciudad IN ('Bogotá','Cali','Medellín');"),
    ).toBe(
      "SELECT nombre\nFROM empleados\nWHERE ciudad IN (\n    'Bogotá',\n    'Cali',\n    'Medellín'\n);",
    );
  });

  it('alinea AND y OR bajo WHERE sin separar el AND de BETWEEN', () => {
    expect(
      formatSql(
        "SELECT nombre FROM empleados WHERE estado = 'ACTIVO' AND salario BETWEEN 3000000 AND 6000000 OR ciudad = 'Cali';",
      ),
    ).toBe(
      "SELECT nombre\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND salario BETWEEN 3000000 AND 6000000\n   OR ciudad = 'Cali';",
    );
  });

  it('una lista de SELECT larga pone una columna por línea', () => {
    expect(
      formatSql(
        'SELECT nombre, salario * 12 AS salario_anual, (salario + bono) * 12 AS total FROM empleados;',
      ),
    ).toBe(
      'SELECT nombre,\n       salario * 12 AS salario_anual,\n       (salario + bono) * 12 AS total\nFROM empleados;',
    );
  });

  it('no cambia el significado: mismos tokens y mismo resultado en todas las consultas', () => {
    expect(QUERIES.length).toBeGreaterThan(60);
    for (const sql of QUERIES) {
      const formatted = formatSql(sql);
      expect(tokens(formatted), sql).toEqual(tokens(sql));
      const before = analyzeLabQuery(sql).preview;
      const after = analyzeLabQuery(formatted).preview;
      expect(after?.rows, sql).toEqual(before?.rows);
      // Idempotente: formatear dos veces da lo mismo.
      expect(formatSql(formatted), sql).toBe(formatted);
    }
  });

  it('deja intactas las consultas con comentarios o que no son SELECT', () => {
    const commented = 'SELECT nombre -- el nombre\nFROM empleados;';
    expect(formatSql(commented)).toBe(commented);
    expect(formatSql('DELETE FROM empleados')).toBe('DELETE FROM empleados');
    expect(formatSql("SELECT 'sin cerrar FROM empleados")).toBe(
      "SELECT 'sin cerrar FROM empleados",
    );
  });

  it('respeta el ancho pedido', () => {
    for (const sql of QUERIES) {
      for (const line of formatSql(sql).split('\n')) {
        // Solo una lista o condición indivisible puede pasar del ancho.
        if (line.length > 44) expect(line, sql).not.toMatch(/^(FROM|ORDER BY) .*,/);
      }
    }
  });
});
