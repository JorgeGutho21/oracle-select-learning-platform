import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  SequenceBuilder,
  type BuilderPiece,
} from '@/presentation/components/interaction/sequence-builder';

const pieces: BuilderPiece[] = [
  { id: 'select', text: 'SELECT', role: 'keyword' },
  { id: 'nombre', text: 'nombre', role: 'column' },
  { id: 'from', text: 'FROM', role: 'keyword' },
];

function Harness({
  reusable = false,
  onChange,
}: {
  reusable?: boolean;
  onChange?: (value: string[]) => void;
}) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <SequenceBuilder
      label="Tu consulta"
      paletteLabel="Piezas"
      pieces={pieces}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      reusable={reusable}
      emptyText="Vacío"
    />
  );
}

describe('SequenceBuilder: alternativas sin arrastre (D02, G14)', () => {
  it('añade piezas al pulsarlas y las retira de la paleta', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Añadir SELECT' }));
    await userEvent.click(screen.getByRole('button', { name: 'Añadir nombre' }));
    expect(onChange).toHaveBeenLastCalledWith(['select', 'nombre']);
    expect(screen.queryByRole('button', { name: 'Añadir SELECT' })).toBeNull();
    expect(screen.getByRole('button', { name: 'nombre, posición 2' })).toBeInTheDocument();
  });

  it('mueve y quita piezas con la barra de acciones y lo anuncia', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    for (const name of ['Añadir SELECT', 'Añadir nombre', 'Añadir FROM']) {
      await userEvent.click(screen.getByRole('button', { name }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'FROM, posición 3' }));
    expect(screen.getByRole('button', { name: 'FROM, posición 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /Mover antes/ }));
    expect(onChange).toHaveBeenLastCalledWith(['select', 'from', 'nombre']);
    expect(screen.getByText('FROM movida a la posición 2.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(onChange).toHaveBeenLastCalledWith(['select', 'nombre']);
    expect(screen.getByRole('button', { name: 'Añadir FROM' })).toBeInTheDocument();
  });

  it('funciona con teclado: Enter añade y los límites deshabilitan movimientos imposibles', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    screen.getByRole('button', { name: 'Añadir SELECT' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['select']);
    await userEvent.click(screen.getByRole('button', { name: 'SELECT, posición 1' }));
    expect(screen.getByRole('button', { name: /Mover antes/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Mover después/ })).toBeDisabled();
  });

  it('las piezas reutilizables permanecen disponibles', async () => {
    const onChange = vi.fn();
    render(<Harness reusable onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Añadir nombre' }));
    await userEvent.click(screen.getByRole('button', { name: 'Añadir nombre' }));
    expect(onChange).toHaveBeenLastCalledWith(['nombre', 'nombre']);
    expect(screen.getByRole('button', { name: 'nombre, posición 2' })).toBeInTheDocument();
  });

  it('deshabilita todas las piezas cuando la misión está cerrada', () => {
    render(
      <SequenceBuilder
        label="Tu consulta"
        paletteLabel="Piezas"
        pieces={pieces}
        value={['select']}
        onChange={() => {}}
        disabled
        emptyText="Vacío"
      />,
    );
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });
});
