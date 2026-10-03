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

  it('JOIN y ON, GROUP BY y HAVING y las funciones tienen papel propio', () => {
    const { container } = render(
      <SqlLines
        sql={
          'SELECT e.departamento, COUNT(*) AS total\nFROM empleados e\nINNER JOIN departamentos d ON d.departamento = e.departamento\nGROUP BY e.departamento\nHAVING COUNT(*) >= 4\nORDER BY total DESC;'
        }
      />,
    );
    const tokens = [...container.querySelectorAll('.sql-token')];
    const classOf = (text: string, index = 0) =>
      tokens.filter((token) => token.textContent === text)[index]?.className ?? '';
    for (const word of ['INNER', 'JOIN', 'ON']) {
      expect(classOf(word), word).toContain('sql-token--join');
    }
    expect(classOf('GROUP')).toContain('sql-token--group');
    // BY toma el papel de la cláusula que acompaña: agrupación u orden.
    expect(classOf('BY', 0)).toContain('sql-token--group');
    expect(classOf('BY', 1)).toContain('sql-token--order');
    expect(classOf('HAVING')).toContain('sql-token--group');
    expect(classOf('COUNT')).toContain('sql-token--function');
  });

  it('solo marca funciones conocidas seguidas de paréntesis', () => {
    const { container } = render(
      <SqlLines sql={"INSERT INTO empleados (id_empleado, nombre) VALUES (99, 'Max');"} />,
    );
    const functions = [...container.querySelectorAll('.sql-token--function')];
    expect(functions).toHaveLength(0);
    expect(sqlRole('GROUP BY')).toBe('group');
    expect(sqlRole('BY', 'GROUP')).toBe('group');
    expect(sqlRole('BY', 'ORDER')).toBe('order');
    expect(sqlRole('LEFT')).toBe('join');
  });
});
