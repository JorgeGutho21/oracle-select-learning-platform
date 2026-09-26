import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SQL_CONCEPTS } from '@/application/sql-concepts';
import {
  SCENE_BLOCKS,
  SCENES,
  scenesOfBlock,
} from '@/features/presentation/application/presentation-api';
import {
  RENDERED_SCENES,
  renderScene,
} from '@/features/presentation/presentation/presentation-scenes';

/** Palabras explicativas visibles: sin tablas, código, controles ni textos ocultos. */
function explanatoryWords(element: HTMLElement): number {
  const copy = element.cloneNode(true) as HTMLElement;
  copy
    .querySelectorAll(
      'table, pre, code, .visually-hidden, .scene__header, figure.video-player, .scene-qr, button, .column-grid, .route-map__concepts, .dv__records, .schema-cards, .name-chips, .mission-path, .level-roadmap__examples',
    )
    .forEach((node) => node.remove());
  return (copy.textContent ?? '').split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
}

describe('escenas del Modo Exposición', () => {
  it('todas las escenas del guion tienen contenido', () => {
    expect([...RENDERED_SCENES].sort()).toEqual(SCENES.map(({ id }) => id).sort());
  });

  it.each(SCENES.map((scene) => [scene.number, scene.id] as const))(
    'la escena %i (%s) tiene título, definición o propósito y no satura de texto',
    (number, id) => {
      const { container, unmount } = render(<>{renderScene(number)}</>);
      const scene = container.querySelector<HTMLElement>(`[data-scene-id="${id}"]`);
      expect(scene).not.toBeNull();
      expect(scene!.querySelector('h1')?.textContent?.trim().length).toBeGreaterThan(0);
      // Toda escena dice qué define o para qué sirve, en un bloque visible bajo el título.
      const intro = scene!.querySelector('.concept-intro');
      expect(intro, id).not.toBeNull();
      expect(intro!.querySelector('.concept-intro__label')?.textContent).toMatch(
        /^(Definición|Propósito)$/,
      );
      expect(explanatoryWords(scene!), id).toBeLessThanOrEqual(95);
      unmount();
    },
  );

  it('las definiciones de las escenas son las de la fuente conceptual única', () => {
    const { container } = render(<>{renderScene(11)}</>);
    expect(container.querySelector('.concept-intro__text')?.textContent).toBe(
      SQL_CONCEPTS.where.definition,
    );
    const inScene = render(<>{renderScene(16)}</>).container;
    expect(inScene.querySelector('.concept-intro__text')?.textContent).toBe(
      SQL_CONCEPTS.in.definition,
    );
    // La categoría correcta: IN es una condición; AND, un operador lógico.
    expect(inScene.querySelector('.scene__category')?.textContent).toBe('Condición');
    const andOr = render(<>{renderScene(13)}</>).container;
    expect(andOr.querySelector('.scene__category')?.textContent).toBe('Operador lógico');
  });

  it('las tablas de las escenas muestran como máximo 8 filas y anuncian el total', () => {
    for (const scene of SCENES) {
      const { container, unmount } = render(<>{renderScene(scene.number)}</>);
      for (const table of container.querySelectorAll('.dv__table tbody')) {
        expect(table.querySelectorAll('tr').length, scene.id).toBeLessThanOrEqual(8);
      }
      unmount();
    }
    const { container } = render(<>{renderScene(4)}</>);
    expect(container.textContent).toContain('4 de 20 filas');
    // EMPLEADOS presenta sus 12 campos agrupados, no solo una tabla.
    expect(container.querySelectorAll('.schema-group li')).toHaveLength(12);
  });

  it('BETWEEN muestra los límites incluidos, los valores justo fuera y el rango', () => {
    const { container } = render(<>{renderScene(15)}</>);
    const text = container.textContent ?? '';
    for (const name of ['Sofía', 'María', 'Valentina', 'Daniela']) expect(text).toContain(name);
    expect(container.querySelectorAll('tr.is-discarded').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tr.is-kept').length).toBeGreaterThan(0);
    expect(container.querySelector('.range-line svg')?.getAttribute('aria-label')).toMatch(
      /12 están entre 3\.000\.000 y 6\.000\.000/,
    );
  });

  it('LIKE marca la parte coincidente de cada nombre', () => {
    const { container } = render(<>{renderScene(17)}</>);
    expect(container.querySelectorAll('.dv-like__literal').length).toBeGreaterThan(0);
  });

  it('ORDER BY compara el orden original con el ordenado e indica el sentido', () => {
    const { container } = render(<>{renderScene(19)}</>);
    expect(container.querySelectorAll('th[aria-sort="descending"]').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Antes · sin ORDER BY');
    expect(container.textContent).toContain('ASC menor a mayor');
  });

  it('IN se define antes de compararlo con OR', () => {
    const { container } = render(<>{renderScene(16)}</>);
    const text = container.textContent ?? '';
    expect(text.indexOf(SQL_CONCEPTS.in.definition)).toBeLessThan(text.indexOf('Con OR'));
  });
});

describe('estructura de la exposición', () => {
  it('cinco bloques cubren las 29 escenas en orden', () => {
    expect(SCENE_BLOCKS.map(({ title }) => title)).toEqual([
      'Fundamentos',
      'Consulta',
      'Filtrado',
      'Orden e integración',
      'Práctica y cierre',
    ]);
    const numbers = SCENE_BLOCKS.flatMap(({ id }) => scenesOfBlock(id).map(({ number }) => number));
    expect(numbers).toEqual(SCENES.map(({ number }) => number));
  });

  it('cada escena tiene notas del expositor y los pasos son coherentes', () => {
    for (const scene of SCENES) {
      expect(scene.notes.explain.length, scene.id).toBeGreaterThan(20);
      expect(scene.shortTitle.length, scene.id).toBeLessThanOrEqual(14);
      expect(scene.steps, scene.id).toBeGreaterThanOrEqual(1);
    }
    expect(SCENES.filter(({ steps }) => steps > 1).map(({ id }) => id)).toEqual([
      'select-from',
      'distinct',
      'where',
      'order-by',
    ]);
  });
});
