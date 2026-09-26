import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import { EMPLEADOS } from '@/features/laboratory/application/lab-api';
import {
  DataView,
  requiredTableWidth,
  widthBucket,
} from '@/presentation/components/data/data-view';

const columns = EMPLEADOS.columns.map(({ name, type }) => ({ name, type }));
const rows = EMPLEADOS.rows.map((row) =>
  EMPLEADOS.columns.map(({ name }) => row[name as keyof typeof row] ?? null),
);

describe('vista de datos adaptable', () => {
  it('calcula el ancho que necesita la tabla y lo redondea a un umbral CSS', () => {
    const narrow = requiredTableWidth(
      columns.slice(1, 3),
      rows.map((row) => row.slice(1, 3)),
    );
    const wide = requiredTableWidth(columns, rows);
    expect(narrow).toBeLessThan(25);
    expect(wide).toBeGreaterThan(90);
    expect(widthBucket(narrow)).toBeGreaterThanOrEqual(narrow);
    expect(widthBucket(1000)).toBe(120);
  });

  it('renderiza la tabla y las fichas con los mismos datos, sin barra obligatoria', () => {
    const { container } = render(
      <DataView
        caption="EMPLEADOS completa"
        label="Tabla original"
        columns={columns}
        rows={rows}
        schema={EMPLEADOS_VIEW_SCHEMA}
      />,
    );
    const table = screen.getByRole('table', { name: 'EMPLEADOS completa' });
    expect(within(table).getAllByRole('row')).toHaveLength(21);
    const records = container.querySelectorAll('.dv-record');
    expect(records).toHaveLength(20);
    // La ficha muestra nombre y apellido como título, el número y el cargo.
    expect(records[0]!.querySelector('.dv-record__title')?.textContent).toContain('Ana Rojas');
    expect(records[0]!.querySelector('.dv-record__subtitle')?.textContent).toContain(
      'Gerente general',
    );
    // Con 12 campos, las fichas agrupan: IDENTIDAD, ORGANIZACIÓN, COMPENSACIÓN…
    expect(
      [...records[0]!.querySelectorAll('.dv-record__group-title')].map((node) => node.textContent),
    ).toEqual(['Organización', 'Compensación', 'Empleo', 'Contacto']);
    expect(container.querySelector('.dv')?.className).toMatch(/dv--need-\d+/);
  });

  it('en resumen muestra los campos prioritarios y pliega el registro completo', () => {
    const { container } = render(
      <DataView
        caption="EMPLEADOS resumen"
        columns={columns}
        rows={rows.slice(0, 2)}
        schema={EMPLEADOS_VIEW_SCHEMA}
        detail="summary"
      />,
    );
    const headers = within(screen.getByRole('table')).getAllByRole('columnheader');
    expect(headers.map((node) => node.textContent)).toEqual([
      'ID_EMPLEADO',
      'NOMBRE',
      'APELLIDO',
      'CARGO',
      'DEPARTAMENTO',
      'CIUDAD',
      'SALARIO',
      'ESTADO',
    ]);
    const more = container.querySelector('.dv-record__more');
    expect(more?.querySelector('summary')?.textContent).toBe('Ver registro completo');
    expect(more?.textContent).toContain('CORREO');
  });

  it('NULL es una insignia con texto accesible y ESTADO un distintivo con símbolo', () => {
    const { container } = render(
      <DataView
        caption="Bono y estado"
        columns={[
          { name: 'NOMBRE', type: 'text' },
          { name: 'BONO', type: 'number' },
          { name: 'ESTADO', type: 'text' },
        ]}
        rows={[
          ['Jorge', null, 'ACTIVO'],
          ['Oscar', 250000, 'INACTIVO'],
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Bono y estado' });
    expect(table.querySelector('.dv-null')?.textContent).toBe('NULL (valor nulo)');
    expect(table.querySelector('.dv-null .visually-hidden')?.textContent).toBe(' (valor nulo)');
    expect(table.querySelector('.dv-status--on')?.textContent).toContain('ACTIVO');
    expect(table.querySelector('.dv-status--off')?.textContent).toContain('INACTIVO');
    expect(table.textContent).toContain('250.000');
    expect(container.querySelectorAll('.dv-record')).toHaveLength(2);
  });

  it('una columna puede encabezar la fila y otra mostrarse como código', () => {
    render(
      <DataView
        caption="Referencia"
        columns={[
          { name: 'ELEMENTO', type: 'text' },
          { name: 'SINTAXIS', type: 'text' },
        ]}
        rows={[['WHERE', 'WHERE condición']]}
        rowHeader={0}
        codeColumns={['SINTAXIS']}
      />,
    );
    expect(screen.getByRole('rowheader', { name: 'WHERE' })).toBeTruthy();
    expect(screen.getByRole('table').querySelector('code.dv-code')?.textContent).toBe(
      'WHERE condición',
    );
  });
});
