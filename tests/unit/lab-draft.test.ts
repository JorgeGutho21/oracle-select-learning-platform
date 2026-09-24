import { describe, expect, it } from 'vitest';
import { incomingLabSql, safeLabReturn } from '@/features/laboratory/application/lab-draft';

describe('transición de una lección o escena al laboratorio', () => {
  it('acepta SQL completo sin normalizar el borrador ni ejecutarlo', () => {
    const sql = 'SELECT nombre,\n salario * 12 AS anual FROM empleados;';
    expect(incomingLabSql(sql)).toBe(sql);
    expect(incomingLabSql(' ')).toBeNull();
    expect(incomingLabSql(['SELECT * FROM empleados'])).toBeNull();
    expect(incomingLabSql('a'.repeat(4001))).toBeNull();
  });
  it('conserva únicamente destinos públicos internos del recorrido', () => {
    expect(safeLabReturn('/presentation?scene=8')).toBe('/presentation?scene=8');
    expect(safeLabReturn('/learn/alias')).toBe('/learn/alias');
    for (const value of [
      'https://example.com',
      '//example.com',
      'javascript:alert(1)',
      '/presentation?scene=99',
      '/learn/../admin',
      '/presentation?scene=8&redirect=x',
    ])
      expect(safeLabReturn(value)).toBeNull();
  });
});
