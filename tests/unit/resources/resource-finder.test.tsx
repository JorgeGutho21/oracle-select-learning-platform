import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResourceFinder } from '@/features/resources/presentation/resource-finder';

const entries = [
  {
    id: 'projection',
    title: 'Proyección',
    terms: 'SELECT columnas',
    children: <p>Ficha SELECT</p>,
  },
  { id: 'filter', title: 'Filtrar', terms: 'WHERE condición', children: <p>Ficha WHERE</p> },
];

describe('Chuleta: disponibilidad tras hidratación', () => {
  it('no permite perder una búsqueda o selección antes de conectar eventos', async () => {
    const markup = renderToString(<ResourceFinder entries={entries} />);
    const document = new DOMParser().parseFromString(markup, 'text/html');
    expect(document.querySelector('input[type="search"]')!.hasAttribute('disabled')).toBe(true);
    for (const button of document.querySelectorAll('button'))
      expect(button.hasAttribute('disabled')).toBe(true);
    render(<ResourceFinder entries={entries} />);
    const search = screen.getByRole('searchbox', { name: 'Buscar en la chuleta' });
    expect(search).toBeEnabled();
    const user = userEvent.setup();
    await user.type(search, 'WHERE');
    expect(screen.getByText('Ficha SELECT').parentElement).toHaveAttribute('hidden');
    expect(screen.getByText('Ficha WHERE').parentElement).not.toHaveAttribute('hidden');
    await user.clear(search);
    await user.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(screen.getByRole('button', { name: 'Filtrar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Ficha SELECT').parentElement).toHaveAttribute('hidden');
    expect(screen.getByText('Ficha WHERE').parentElement).not.toHaveAttribute('hidden');
  });
});
