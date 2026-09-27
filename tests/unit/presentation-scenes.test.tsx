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
    expect(container.textContent).toContain('3 de 20 filas');
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

describe('cierre pedagógico y mapa de la unidad', () => {
  const scene = (number: number) => render(<>{renderScene(number)}</>).container;

  it('la ruta (02) es un mapa: ocho bloques con letra, objetivo y conceptos', () => {
    const route = scene(2);
    const stages = route.querySelectorAll('.route-map__stage');
    expect(stages).toHaveLength(8);
    for (const stage of stages) {
      expect(stage.querySelector('.route-map__letter')?.textContent).toMatch(/^[A-H]$/);
      expect(stage.querySelector('.route-map__goal')?.textContent?.length).toBeGreaterThan(10);
      expect(stage.querySelector('.route-map__concepts')?.textContent).toBeTruthy();
    }
    expect(route.textContent).toContain('Pasaremos de entender una tabla');
  });

  it('«Qué aprendimos» (25) sintetiza nueve competencias y una consulta integradora', () => {
    const summary = scene(25);
    expect(summary.textContent).toContain('Ahora ya puedes…');
    expect(summary.querySelectorAll('.competency-grid__item')).toHaveLength(9);
    expect(summary.querySelector('pre')?.textContent).toMatch(/SELECT DISTINCT ciudad/);
    expect(summary.querySelectorAll('.name-chips li').length).toBeGreaterThan(1);
  });

  it('«Próximos temas» (28) es una ruta de continuidad marcada como próxima', () => {
    const next = scene(28);
    const topics = next.querySelectorAll('.future-roadmap__item');
    expect(topics).toHaveLength(10);
    for (const topic of topics) expect(topic.textContent).toContain('Próximamente');
    for (const term of [
      'UPPER',
      'COUNT',
      'GROUP BY',
      'INNER JOIN',
      'UNION',
      'INSERT',
      'CREATE TABLE',
    ])
      expect(next.textContent).toContain(term);
    expect(next.textContent).toContain('No forman parte de la evaluación');
  });

  it('el cierre (29) ilustra del dato a la consulta, deja tres ideas y preguntas de salida', () => {
    const closing = scene(29);
    const figure = closing.querySelector('svg[role="img"]');
    expect(figure?.getAttribute('aria-label')).toMatch(/Del dato a la consulta/);
    expect(closing.querySelectorAll('.closing-ideas li')).toHaveLength(3);
    expect(closing.querySelectorAll('.exit-questions li')).toHaveLength(3);
    const links = [...closing.querySelectorAll('.scene-links a')].map((a) =>
      a.getAttribute('href'),
    );
    expect(links).toEqual(['/lab', '/challenge']);
    expect(closing.textContent).toContain('ahora sabes hacerle preguntas');
  });

  it('los errores frecuentes (22) cubren coma, FROM, columna, = NULL, DISTINCT y comillas', () => {
    const titles = [...scene(22).querySelectorAll('.error-card__title')].map((t) => t.textContent);
    expect(titles).toEqual([
      'Falta la coma',
      'Falta FROM',
      'Columna inexistente',
      'NULL con =',
      'DISTINCT mal colocado',
      'Texto sin comillas',
    ]);
  });

  it('SQL (03) define el lenguaje y su vocabulario: tabla, fila, columna y consulta', () => {
    const sql = scene(3);
    expect(sql.querySelector('.concept-intro__use')?.textContent).toContain('mediante SELECT');
    const terms = [...sql.querySelectorAll('.query-glossary dt')].map((dt) => dt.textContent);
    expect(terms).toEqual(['Tabla', 'Fila', 'Columna', 'Consulta']);
  });

  it('las escenas de filtrado dicen para qué sirve cada concepto', () => {
    for (const number of [11, 12, 13, 14, 15, 16, 17, 18, 19]) {
      expect(scene(number).querySelector('.concept-intro__use'), `escena ${number}`).not.toBeNull();
    }
  });
});
