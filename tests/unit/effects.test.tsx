import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersStaticEffects } from '@/presentation/components/effects/motion';
import { PixelCard } from '@/presentation/components/effects/pixel-card';
import { SpotlightCard } from '@/presentation/components/effects/spotlight-card';
import { StarBorder } from '@/presentation/components/effects/star-border';

function mockMedia(matching: readonly string[]) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: matching.includes(query),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('efectos de React Bits adaptados', () => {
  it('se quedan quietos con movimiento reducido o en pantallas táctiles', () => {
    mockMedia(['(prefers-reduced-motion: reduce)']);
    expect(prefersStaticEffects()).toBe(true);
    mockMedia(['(pointer: coarse)']);
    expect(prefersStaticEffects()).toBe(true);
    mockMedia([]);
    expect(prefersStaticEffects()).toBe(false);
  });

  it('los destellos y lienzos son decorativos: no llegan a las tecnologías de apoyo', () => {
    const { container } = render(
      <>
        <StarBorder>
          <a href="#entrar">Entrar</a>
        </StarBorder>
        <PixelCard>
          <a href="#plan">Ver el plan</a>
        </PixelCard>
      </>,
    );
    for (const element of container.querySelectorAll('.fx-star-border__glow, canvas')) {
      expect(element.getAttribute('aria-hidden')).toBe('true');
    }
    // La tarjeta de píxeles no añade su propia parada de tabulación.
    expect(container.querySelector('.fx-pixel-card')?.hasAttribute('tabindex')).toBe(false);
  });

  it('el foco de luz solo sigue a un ratón', () => {
    const { container } = render(
      <SpotlightCard>
        <p>Contenido</p>
      </SpotlightCard>,
    );
    const card = container.querySelector<HTMLElement>('.fx-spotlight')!;
    fireEvent.pointerMove(card, { pointerType: 'touch', clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue('--spotlight-x')).toBe('');
    fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 30, clientY: 20 });
    expect(card.style.getPropertyValue('--spotlight-x')).toBe('30px');
  });
});
