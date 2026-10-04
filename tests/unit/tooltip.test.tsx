import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tooltip } from '@/presentation/components/ui/tooltip';

function renderHelp() {
  render(<Tooltip label="Ayuda contextual">Ayuda</Tooltip>);
  const trigger = screen.getByRole('button', { name: 'Ayuda' });
  let top = 200;
  vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => new DOMRect(40, top, 44, 44));
  return { trigger, moveTo: (next: number) => (top = next) };
}

describe('Persistencia de la ayuda al desplazarse el foco', () => {
  it('mantiene y reposiciona la ayuda enfocada, y no la reabre después de Escape', async () => {
    const user = userEvent.setup();
    const { trigger, moveTo } = renderHelp();
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '252px' });
    moveTo(100);
    fireEvent.scroll(window);
    expect(screen.getByRole('tooltip')).toHaveStyle({ top: '152px' });
    expect(trigger).toHaveAccessibleDescription('Ayuda contextual');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.scroll(window);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('retira la ayuda si el activador enfocado sale del viewport', async () => {
    const user = userEvent.setup();
    const { moveTo } = renderHelp();
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeVisible();
    moveTo(-100);
    fireEvent.scroll(window);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('retira la ayuda de puntero cuando se desplaza la página sin foco en el activador', async () => {
    const user = userEvent.setup();
    const { trigger } = renderHelp();
    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toBeVisible();
    expect(trigger).not.toHaveFocus();
    fireEvent.scroll(window);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
