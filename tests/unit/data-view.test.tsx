import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import { EMPLEADOS } from '@/features/laboratory/application/lab-api';
import {
  anchorIndexes,
  columnUnits,
  DataView,
  planGroups,
  planParts,
  requiredTableWidth,
  widthBucket,
} from '@/presentation/components/data/data-view';

const columns = EMPLEADOS.columns.map(({ name, type }) => ({ name, type }));
const rows = EMPLEADOS.rows.map((row) =>
  EMPLEADOS.columns.map(({ name }) => row[name as keyof typeof row] ?? null),
);
const names = (indexes: readonly number[], source = columns) =>
  indexes.map((index) => source[index]!.name);

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

  it('en pantallas estrechas reparte 12 columnas en cinco grupos de cuatro, nunca en fichas', () => {
    const plan = planGroups(columns, rows, { schema: EMPLEADOS_VIEW_SCHEMA })!;
    expect(names(plan.anchors)).toEqual(['ID_EMPLEADO', 'NOMBRE']);
    expect(plan.parts.map((part) => part.label)).toEqual([
      'Identidad',
      'Organización',
      'Compensación',
      'Empleo',
      'Contacto y jefe',
    ]);
    // Cada grupo: la identidad y dos columnas; entre todos, las doce, en el orden de la tabla.
    expect(plan.parts.every((part) => part.indexes.length === 2)).toBe(true);
    expect(names(plan.parts.flatMap((part) => part.indexes))).toEqual(
      names(columns.map((_, index) => index).slice(2)),
    );

    const { container } = render(
      <DataView caption="EMPLEADOS" columns={columns} rows={rows} schema={EMPLEADOS_VIEW_SCHEMA} />,
    );
    expect(container.querySelectorAll('.dv-record')).toHaveLength(0);
    const groups = container.querySelector('.dv__groups--narrow')!;
    // El último recurso no se oculta por falta de espacio.
    expect(groups.className).not.toMatch(/dv-fit-/);
    expect(
      within(groups as HTMLElement)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(plan.parts.map((part) => part.label));
    for (const panel of groups.querySelectorAll('[role="tabpanel"]')) {
      const headers = [...panel.querySelectorAll('thead th')].map((th) => th.textContent);
      expect(headers.slice(0, 2)).toEqual(['ID_EMPLEADO', 'NOMBRE']);
      expect(headers.length).toBeLessThanOrEqual(4);
      expect(panel.querySelectorAll('tbody tr')).toHaveLength(20);
      // El número de empleado encabeza cada fila: la misma persona en todos los grupos.
      expect(panel.querySelector('tbody th[scope="row"]')?.textContent).toBe('1');
    }
    expect(groups.textContent).toContain('ID_EMPLEADO y NOMBRE se repiten');
  });

  it('las pestañas se recorren con las flechas y muestran un grupo a la vez', () => {
    const { container } = render(
      <DataView caption="EMPLEADOS" columns={columns} rows={rows} schema={EMPLEADOS_VIEW_SCHEMA} />,
    );
    const groups = container.querySelector('.dv__groups--narrow') as HTMLElement;
    const tabs = within(groups).getAllByRole('tab');
    const panels = groups.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect([...panels].filter((panel) => !panel.hidden)).toHaveLength(1);
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]!.hidden).toBe(false);
    expect(panels[0]!.hidden).toBe(true);
    fireEvent.keyDown(tabs[1]!, { key: 'End' });
    expect(tabs.at(-1)!.getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tabs[2]!);
    expect(panels[2]!.hidden).toBe(false);
    expect(panels[2]!.getAttribute('aria-labelledby')).toBe(tabs[2]!.id);
  });

  it('en tableta reúne los grupos en dos partes con las mismas filas', () => {
    const plan = planParts(columns, rows, 2, { schema: EMPLEADOS_VIEW_SCHEMA })!;
    expect(plan.parts).toHaveLength(2);
    expect(plan.need).toBeLessThan(requiredTableWidth(columns, rows));
    expect(names(plan.parts.flatMap((part) => part.indexes))).toEqual(
      names(columns.map((_, index) => index).slice(2)),
    );
    // Partes nombradas con sus grupos: «Identidad, organización y compensación».
    expect(plan.parts[0]!.label).toMatch(/^Identidad, organización/);
    const { container } = render(
      <DataView caption="EMPLEADOS" columns={columns} rows={rows} schema={EMPLEADOS_VIEW_SCHEMA} />,
    );
    const parts = container.querySelector('.dv__groups--parts')!;
    expect(parts.className).toMatch(/dv-fit-\d+/);
    expect(parts.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it('con pocas filas las partes pueden apilarse en bandas', () => {
    const { container } = render(
      <DataView
        caption="EMPLEADOS"
        columns={columns}
        rows={rows.slice(0, 2)}
        schema={EMPLEADOS_VIEW_SCHEMA}
        fallback="bands"
      />,
    );
    const bands = container.querySelector('.dv__bands--2')!;
    expect(bands.textContent).toContain('ID_EMPLEADO y NOMBRE se repiten');
    for (const table of bands.querySelectorAll('table')) {
      expect(table.querySelector('thead th')?.textContent).toBe('ID_EMPLEADO');
      expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    }
    // En el móvil, los grupos siguen en pestañas.
    expect(container.querySelector('.dv__groups--narrow')).not.toBeNull();
  });

  it('una tabla de hasta cuatro columnas es siempre la misma tabla', () => {
    const { container } = render(
      <DataView
        caption="Nombre y ciudad"
        columns={columns.slice(1, 3)}
        rows={rows.map((row) => row.slice(1, 3))}
        schema={EMPLEADOS_VIEW_SCHEMA}
      />,
    );
    expect(container.querySelector('.dv__groups')).toBeNull();
    expect(container.querySelector('.dv__table')!.className).not.toMatch(/dv-fit-/);
  });

  it('un resultado parcial agrupa por grupo semántico y nombra lo incompleto por sus columnas', () => {
    const pick = ['NOMBRE', 'CIUDAD', 'SALARIO', 'BONO', 'ESTADO'];
    const partial = columns.filter((column) => pick.includes(column.name));
    const anchors = anchorIndexes(partial, EMPLEADOS_VIEW_SCHEMA);
    expect(names(anchors, partial)).toEqual(['NOMBRE']);
    const units = columnUnits(partial, anchors, 3, EMPLEADOS_VIEW_SCHEMA.tabGroups);
    expect(units.map((unit) => unit.label)).toEqual(['CIUDAD', 'Compensación', 'ESTADO']);
    // Sin columnas de identidad, la primera columna identifica la fila.
    expect(anchorIndexes(columns.slice(5, 8))).toEqual([0]);
  });

  it('un resultado SQL no se convierte en fichas ni ofrece «Ver registro completo»', () => {
    const { container } = render(
      <DataView
        caption="Resultado"
        columns={columns}
        rows={rows}
        schema={EMPLEADOS_VIEW_SCHEMA}
        size="compact"
      />,
    );
    expect(container.querySelectorAll('.dv-record')).toHaveLength(0);
    expect(container.textContent).not.toContain('Ver registro completo');
    expect(
      screen.getByRole('table', { name: 'Resultado' }).querySelectorAll('tbody tr'),
    ).toHaveLength(20);
    expect(container.querySelector('.dv')?.className).toContain('dv--compact');
  });

  it('las fichas solo existen para tablas de referencia que las piden', () => {
    const { container } = render(
      <DataView
        caption="Misiones"
        columns={[
          { name: 'MISIÓN', type: 'text' },
          { name: 'ESTADO', type: 'text' },
          { name: 'PUNTOS', type: 'number' },
        ]}
        rows={[
          ['Columnas a la vista', 'Resuelta', 100],
          ['El orden de SQL', 'Omitida', 0],
        ]}
        schema={{ titleColumns: ['MISIÓN'] }}
        fallback="records"
      />,
    );
    expect(container.querySelectorAll('.dv-record')).toHaveLength(2);
    expect(container.querySelector('.dv__groups')).toBeNull();
  });

  it('NULL es una insignia con texto accesible y ESTADO un distintivo con símbolo', () => {
    render(
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
