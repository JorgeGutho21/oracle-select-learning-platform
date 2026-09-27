import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SqlLines } from '@/presentation/components/data/sql-code';
import { sqlRole } from '@/presentation/components/data/sql-semantics';

describe('color semántico del SQL', () => {
  it('cada cláusula y operador lleva su papel: proyección, fuente, filtro, orden y operador', () => {
    const { container } = render(
      <SqlLines
        sql={
          "SELECT nombre, salario * 12\nFROM empleados\nWHERE ciudad = 'Cali'\nORDER BY salario DESC;"
        }
      />,
    );
    const role = (text: string) =>
      [...container.querySelectorAll('.sql-token')].find((token) => token.textContent === text)
        ?.className;
    expect(role('SELECT')).toContain('sql-token--select');
    expect(role('FROM')).toContain('sql-token--from');
    expect(role('WHERE')).toContain('sql-token--filter');
    expect(role('ORDER')).toContain('sql-token--order');
    expect(role('DESC')).toContain('sql-token--order');
    expect(role('*')).toContain('sql-token--operator');
    expect(role('=')).toContain('sql-token--operator');
  });

  it('el asterisco tras SELECT es el comodín de columnas, no una multiplicación', () => {
    const { container } = render(<SqlLines sql={'SELECT *\nFROM empleados;'} />);
    expect(container.querySelector('.sql-token--star')?.textContent).toBe('*');
  });

  it('las piezas del Challenge usan el mismo papel semántico', () => {
    expect(sqlRole('SELECT')).toBe('select');
    expect(sqlRole('FROM')).toBe('from');
    expect(sqlRole('WHERE')).toBe('filter');
    expect(sqlRole('ORDER BY')).toBe('order');
    expect(sqlRole('AS salario_anual')).toBe('select');
    expect(sqlRole('*')).toBe('operator');
    expect(sqlRole('nombre')).toBeNull();
  });
});
