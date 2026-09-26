import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SCENES } from '@/features/presentation/application/presentation-api';
import {
  RENDERED_SCENES,
  renderScene,
} from '@/features/presentation/presentation/presentation-scenes';

/** Palabras explicativas visibles: sin tablas, código, controles ni textos ocultos. */
function explanatoryWords(element: HTMLElement): number {
  const copy = element.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll(
      'table, pre, code, .visually-hidden, .scene__header, figure.video-player, .scene-qr, button, .scene-columns, .scene-blocks__badges',
    )
    .forEach((node) => node.remove());
  return (copy.textContent ?? '').split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
}

describe('escenas del Modo Exposición', () => {
  it('todas las escenas del guion tienen contenido', () => {
    expect([...RENDERED_SCENES].sort()).toEqual(SCENES.map(({ id }) => id).sort());
  });

  it.each(SCENES.map((scene) => [scene.number, scene.id] as const))(
    'la escena %i (%s) se renderiza con su título y sin saturar de texto',
    (number, id) => {
      const { container, unmount } = render(<>{renderScene(number)}</>);
      const scene = container.querySelector<HTMLElement>(`[data-scene-id="${id}"]`);
      expect(scene).not.toBeNull();
      expect(scene!.querySelector('h1')?.textContent?.trim().length).toBeGreaterThan(0);
      expect(explanatoryWords(scene!), id).toBeLessThanOrEqual(95);
      unmount();
    },
  );

  it('las tablas de las escenas muestran como máximo 8 filas y anuncian el total', () => {
    for (const scene of SCENES) {
      const { container, unmount } = render(<>{renderScene(scene.number)}</>);
      for (const table of container.querySelectorAll('.hl-table tbody')) {
        expect(table.querySelectorAll('tr').length, scene.id).toBeLessThanOrEqual(8);
      }
      unmount();
    }
    const { container } = render(<>{renderScene(4)}</>);
    expect(container.textContent).toContain('8 de 20 filas');
  });

  it('BETWEEN muestra los límites incluidos y los valores justo fuera', () => {
    const { container } = render(<>{renderScene(15)}</>);
    const text = container.textContent ?? '';
    for (const name of ['Sofía', 'María', 'Valentina', 'Daniela']) expect(text).toContain(name);
    expect(container.querySelectorAll('tr.is-discarded').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tr.is-kept').length).toBeGreaterThan(0);
  });

  it('LIKE marca la parte coincidente de cada nombre', () => {
    const { container } = render(<>{renderScene(17)}</>);
    expect(container.querySelectorAll('.hl-like__literal').length).toBeGreaterThan(0);
  });

  it('ORDER BY indica el sentido del orden en el encabezado', () => {
    const { container } = render(<>{renderScene(19)}</>);
    expect(container.querySelectorAll('th[aria-sort="descending"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('th[aria-sort="ascending"]').length).toBeGreaterThan(0);
  });
});
