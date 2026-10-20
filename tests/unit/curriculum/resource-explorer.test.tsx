import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ResourceExplorer,
  ResourceSearchBlock,
  ResourceSearchItem,
} from '@/features/curriculum/presentation/resource-explorer';

describe('Búsqueda de recursos curriculares', () => {
  it('espera a la hidratación antes de permitir buscar o filtrar', () => {
    const markup = renderToString(
      <ResourceExplorer>
        <ResourceSearchItem text="%ROWTYPE">
          <p>Ficha %ROWTYPE</p>
        </ResourceSearchItem>
      </ResourceExplorer>,
    );
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('input[type="search"]')!.hasAttribute('disabled')).toBe(true);
    for (const button of document.querySelectorAll('.db-resource-filter button')) {
      expect(button.hasAttribute('disabled')).toBe(true);
    }
    render(
      <ResourceExplorer>
        <ResourceSearchItem text="%ROWTYPE">
          <p>Ficha %ROWTYPE</p>
        </ResourceSearchItem>
      </ResourceExplorer>,
    );
    expect(screen.getByRole('searchbox', { name: '¿Qué necesitas recordar?' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Conceptos' })).toBeEnabled();
  });

  it('busca sin tildes, abre el bloque cerrado y permite recuperar todas las fichas', async () => {
    const user = userEvent.setup();
    render(
      <ResourceExplorer>
        <ResourceSearchBlock label="Funciones" defaultOpen={false}>
          <ResourceSearchItem text="Proyección SELECT">
            <p>Ficha SELECT</p>
          </ResourceSearchItem>
          <ResourceSearchItem text="Filtrado WHERE">
            <p>Ficha WHERE</p>
          </ResourceSearchItem>
        </ResourceSearchBlock>
      </ResourceExplorer>,
    );
    const search = screen.getByRole('searchbox', { name: '¿Qué necesitas recordar?' });
    await user.type(search, 'PROYECCION');
    expect(screen.getByText('Ficha SELECT').closest('.db-resource-item')).not.toHaveAttribute(
      'hidden',
    );
    expect(screen.getByText('Ficha WHERE').closest('.db-resource-item')).toHaveAttribute('hidden');
    expect(screen.getByText('Funciones').closest('details')).toHaveAttribute('open');
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('Ficha WHERE').closest('.db-resource-item')).not.toHaveAttribute(
      'hidden',
    );
    await user.click(screen.getByRole('button', { name: 'Sintaxis' }));
    expect(screen.getByRole('button', { name: 'Sintaxis' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
