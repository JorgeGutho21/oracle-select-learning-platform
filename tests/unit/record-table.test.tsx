import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecordTable } from '@/presentation/components/data/record-table';

describe('Grupos de columnas de registros', () => {
  it('conserva identidad y filas al cambiar de grupo mediante el teclado', () => {
    render(
      <RecordTable
        caption="Resultados"
        columns={['Estudiante', 'Correo', 'Estado', 'Nota', 'Acciones']}
        rows={[
          { key: 'a', cells: ['Ana Ruiz', 'ana@example.com', 'Entregada', '4.2', 'Ver intento'] },
        ]}
      />,
    );
    const group = screen.getByRole('group', { name: 'Resultados' });
    const tabs = within(group).getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    let table = within(group).getByRole('table');
    expect(within(table).getByRole('rowheader')).toHaveTextContent('Ana Ruiz');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Estudiante', 'Correo', 'Estado']);
    fireEvent.keyDown(tabs[0]!, { key: 'End' });
    expect(tabs[1]).toHaveFocus();
    table = within(group).getByRole('table');
    expect(within(table).getByRole('rowheader')).toHaveTextContent('Ana Ruiz');
    expect(within(table).getByRole('cell', { name: '4.2' })).toBeInTheDocument();
    expect(within(group).queryByRole('cell', { name: 'ana@example.com' })).toBeNull();
    fireEvent.keyDown(tabs[1]!, { key: 'Home' });
    expect(tabs[0]).toHaveFocus();
  });
});
