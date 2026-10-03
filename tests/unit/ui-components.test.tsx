import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  BreakableUrl,
  Button,
  CodeBlock,
  DataTable,
  LoadingState,
  Progress,
  SearchField,
  Tabs,
} from '@/presentation/components/ui';

describe('Contratos accesibles de los componentes de presentación', () => {
  it('impide envíos duplicados y comunica que un botón está ocupado', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button pending pendingLabel="Enviando" onClick={onClick}>
        Enviar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /enviando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asocia etiqueta, ayuda y error con el campo de búsqueda', () => {
    render(
      <SearchField
        hint="Puedes buscar un componente por su nombre."
        error="Introduce al menos dos caracteres."
      />,
    );

    const search = screen.getByRole('searchbox', {
      name: 'Buscar tema o recurso',
    });
    expect(search).toHaveAttribute('aria-invalid', 'true');
    expect(search).toHaveAccessibleDescription(
      /Puedes buscar un componente por su nombre.*Introduce al menos dos caracteres/s,
    );
  });

  it('permite cambiar de pestaña con flechas, Home y End sin aumentar las paradas de Tab', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="Estados del componente"
        items={[
          { id: 'first', label: 'Primero', content: <p>Primer panel</p> },
          { id: 'second', label: 'Segundo', content: <p>Segundo panel</p> },
          { id: 'third', label: 'Tercero', content: <p>Tercer panel</p> },
        ]}
      />,
    );

    const first = screen.getByRole('tab', { name: 'Primero' });
    const second = screen.getByRole('tab', { name: 'Segundo' });
    const third = screen.getByRole('tab', { name: 'Tercero' });
    await user.tab();
    expect(first).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Segundo');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Segundo panel');

    await user.keyboard('{End}');
    expect(third).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(third).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
  });

  it('copia exclusivamente el SQL, conservando espacios y saltos de línea', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const code = 'SELECT nombre, salario\nFROM empleados;';
    render(<CodeBlock code={code} />);

    await user.click(screen.getByRole('button', { name: /copiar/i }));

    expect(writeText).toHaveBeenCalledExactlyOnceWith(code);
  });

  it('ofrece selección manual si el navegador rechaza el portapapeles', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
      new DOMException('Permiso denegado', 'NotAllowedError'),
    );
    const code = 'SELECT nombre FROM empleados;';
    render(<CodeBlock code={code} />);

    await user.click(screen.getByRole('button', { name: /copiar/i }));

    expect(screen.getByRole('status')).toHaveTextContent(
      /No se pudo copiar.*Selecciona el código/s,
    );
    expect(screen.getByLabelText('Ejemplo SQL')).toHaveTextContent(code);
  });

  it('conserva título, encabezados y estado vacío de una tabla sin inventar filas', () => {
    render(
      <DataTable<{ id: string; label: string }>
        caption="Revisión del componente tabla"
        columns={[{ id: 'label', header: 'Componente', cell: (row) => row.label }]}
        rows={[]}
        rowKey={(row) => row.id}
        emptyMessage="No hay elementos para revisar."
      />,
    );

    const table = screen.getByRole('table', {
      name: 'Revisión del componente tabla',
    });
    expect(within(table).getByRole('columnheader')).toHaveTextContent('Componente');
    expect(within(table).getByText('No hay elementos para revisar.')).toBeVisible();
    expect(within(table).getAllByRole('row')).toHaveLength(2);
  });

  it('expone nombre y valores de progreso a tecnologías de asistencia', () => {
    render(<Progress label="Revisión de componentes" value={3} max={8} />);

    const progress = screen.getByRole('progressbar', {
      name: 'Revisión de componentes',
    });
    expect(progress).toHaveAttribute('aria-valuenow', '3');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '8');
  });

  it.each(['spinner', 'skeleton'] as const)(
    'el estado de carga %s comunica el mensaje sin exponer decoración',
    (variant) => {
      render(<LoadingState label="Preparando componentes" variant={variant} />);

      expect(screen.getByRole('status')).toHaveTextContent('Preparando componentes');
      expect(screen.getByRole('status').querySelector('[aria-hidden="true"]')).not.toBeNull();
    },
  );
});

describe('BreakableUrl', () => {
  it('ofrece cortes tras las barras y los puntos sin cambiar el texto', () => {
    const url = 'https://sql-select-lab.vercel.app/join/ABC123';
    const { container } = render(
      <p>
        <BreakableUrl url={url} />
      </p>,
    );
    expect(container.textContent).toBe(url);
    const breaks = container.querySelectorAll('wbr').length;
    expect(breaks).toBe(url.split(/(?<=[/.?&=#-])/).length - 1);
    expect(container.innerHTML).toContain('join/<wbr>ABC123');
  });
});
