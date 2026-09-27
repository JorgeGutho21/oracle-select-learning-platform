import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { analyzeLabQuery, EMPLEADOS } from '@/features/laboratory/application/lab-api';
import { ResultPanel } from '@/features/laboratory/presentation/lab-panels';
import { formatCell } from '@/presentation/components/data/cell-format';

/**
 * El panel de resultados del laboratorio: la vista previa educativa y la ejecución en Oracle
 * usan el mismo componente de tabla, con rótulos distintos, y la tabla muestra exactamente
 * los datos del resultado, sin tocarlos.
 */

const SQL = 'SELECT *\nFROM empleados;';

function renderPanel() {
  const analysis = analyzeLabQuery(SQL);
  const preview = analysis.preview!;
  return render(
    <ResultPanel
      analysis={analysis}
      stale={false}
      oracleStatus={{ available: true, message: 'Conectado' } as never}
      executing={false}
      execution={{
        sql: SQL,
        result: {
          status: 'ok',
          columns: preview.columns,
          rows: preview.rows,
          elapsedMs: 12,
          engine: 'Oracle Database 19c',
        },
      }}
    />,
  );
}

describe('resultado del laboratorio', () => {
  it('vista previa y Oracle comparten el mismo renderer de tabla, con rótulos distintos', () => {
    const { container } = renderPanel();
    const views = container.querySelectorAll('.dv');
    expect(views).toHaveLength(2);
    for (const view of views) {
      expect(view.className).toContain('dv--compact');
      expect(view.className).toContain('dv--result');
      expect(view.className).toContain('dv--tabular');
    }
    expect(container.textContent).toContain('No es una ejecución en Oracle');
    expect(container.textContent).toContain('Resultado · vista educativa');
    expect(container.textContent).toContain('Resultado Oracle');
  });

  it('SELECT * es una tabla de 12 columnas y 20 filas, sin fichas por empleado', () => {
    const { container } = renderPanel();
    const table = screen.getByRole('table', { name: /^Vista previa: 20 filas, 12 columnas$/ });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(EMPLEADOS.columns.map(({ name }) => name));
    expect(table.querySelectorAll('tbody tr')).toHaveLength(20);
    expect(container.querySelectorAll('.dv-record')).toHaveLength(0);
    expect(container.textContent).not.toContain('Ver registro completo');
    expect(container.textContent).toContain('20 filas · 12 columnas');
  });

  it('la tabla muestra los datos tal como están en EMPLEADOS', () => {
    renderPanel();
    const table = screen.getByRole('table', { name: /^Vista previa: 20 filas, 12 columnas$/ });
    const rows = [...table.querySelectorAll('tbody tr')];
    rows.forEach((row, index) => {
      const source = EMPLEADOS.rows[index]!;
      const cells = [...row.children].map((cell) => cell.textContent);
      const expected = EMPLEADOS.columns.map(({ name }) => {
        const value = source[name as keyof typeof source];
        return value === null ? 'NULL (valor nulo)' : formatCell(value);
      });
      // ESTADO lleva un símbolo decorativo delante del valor.
      expect(cells.map((text) => text?.replace(/^[●○] /, ''))).toEqual(expected);
    });
  });
});
