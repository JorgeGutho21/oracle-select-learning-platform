import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  availableModes,
  getSection,
  SECTION_IDS,
  SECTION_LIST,
  sectionNeighbors,
} from '@/features/sections/application/sections-api';
import { CURRICULUM_LEVELS } from '@/features/modules/domain/curriculum';
import { LESSON_COUNT, LESSON_INDEX } from '@/features/study/application/lesson-index';

const app = path.resolve('src/app');

function pageExists(href: string): boolean {
  const [pathname = ''] = href.split(/[#?]/);
  return existsSync(path.join(app, ...pathname.split('/').filter(Boolean), 'page.tsx'));
}

describe('arquitectura de secciones de DB LAB', () => {
  it('ordena tres secciones con número, código y dirección propios', () => {
    expect(SECTION_LIST.map(({ id, number, code, href }) => [id, number, code, href])).toEqual([
      ['fundamentos-sql', 1, '01', '/sections/fundamentos-sql'],
      ['consultas-relacionales', 2, '02', '/sections/consultas-relacionales'],
      ['plsql', 3, '03', '/sections/plsql'],
    ]);
    expect(SECTION_IDS).toHaveLength(new Set(SECTION_IDS).size);
    expect(getSection('no-existe')).toBeUndefined();
  });

  it('la Sección 1 enlaza los modos con las funcionalidades existentes, sin duplicarlas', () => {
    const fundamentals = getSection('fundamentos-sql')!;
    expect(fundamentals.status).toBe('available');
    expect(Object.fromEntries(fundamentals.modes.map(({ id, href }) => [id, href]))).toEqual({
      class: '/presentation',
      study: '/learn',
      practice: '/lab',
      challenge: '/challenge',
      resources: '/resources',
      evaluation: '/evaluations?seccion=fundamentos-sql',
    });
    for (const mode of availableModes(fundamentals)) {
      expect(pageExists(mode.href!), mode.href!).toBe(true);
      expect(mode.action, mode.id).toBeTruthy();
    }
  });

  it('el temario de la Sección 1 sale del Modo Estudio real', () => {
    const fundamentals = getSection('fundamentos-sql')!;
    const available = fundamentals.topicGroups.filter((group) => group.status === 'available');
    expect(available).toHaveLength(8);
    const links = available.flatMap((group) => group.topics.map((topic) => topic.href));
    expect(links).toHaveLength(LESSON_COUNT);
    expect(links).toEqual(LESSON_INDEX.map(({ slug }) => `/learn/${slug}`));
    expect(fundamentals.facts.find((fact) => fact.label === 'lecciones')?.value).toBe(
      String(LESSON_COUNT),
    );
  });

  it('las secciones próximas no tienen modos enlazados ni cifras inventadas', () => {
    for (const id of ['consultas-relacionales', 'plsql']) {
      const section = getSection(id)!;
      expect(section.status, id).toBe('coming-soon');
      expect(availableModes(section), id).toEqual([]);
      expect(section.facts, id).toEqual([]);
      expect(
        section.topicGroups.every((group) =>
          group.topics.every((topic) => topic.href === null && group.status === 'planned'),
        ),
        id,
      ).toBe(true);
      expect(section.prerequisites.length, id).toBeGreaterThan(0);
    }
  });

  it('la Sección 2 prevé los temas de consultas relacionales y la 3, los de PL/SQL', () => {
    const topics = (id: string) =>
      getSection(id)!.topicGroups.flatMap((group) => group.topics.map((topic) => topic.label));
    expect(topics('consultas-relacionales')).toEqual(
      expect.arrayContaining([
        'PK y FK',
        'INNER JOIN',
        'LEFT OUTER JOIN',
        'RIGHT OUTER JOIN',
        'FULL OUTER JOIN',
        'CROSS JOIN',
        'SELF JOIN',
        'COUNT',
        'SUM',
        'AVG',
        'MIN',
        'MAX',
        'GROUP BY',
        'HAVING',
        'WHERE frente a HAVING',
        'UNION',
        'UNION ALL',
        'INTERSECT',
        'MINUS',
      ]),
    );
    expect(topics('plsql')).toEqual(
      expect.arrayContaining([
        'DECLARE, BEGIN, EXCEPTION y END',
        'Tipos, %TYPE y %ROWTYPE',
        'SELECT INTO',
        'DBMS_OUTPUT',
        'Cursores explícitos',
        'Parámetros IN, OUT e IN OUT',
        'Paquetes',
        'FOR EACH ROW',
        ':OLD y :NEW',
      ]),
    );
  });

  it('los enlaces a la ruta de aprendizaje apuntan a niveles que existen', () => {
    for (const section of SECTION_LIST) {
      if (!section.roadmapHref) continue;
      const [, anchor] = section.roadmapHref.split('#');
      expect(
        CURRICULUM_LEVELS.some((level) => `nivel-${level.number}` === anchor),
        section.roadmapHref,
      ).toBe(true);
    }
  });

  it('conoce la sección anterior y la siguiente', () => {
    expect(sectionNeighbors('fundamentos-sql').previous).toBeNull();
    expect(sectionNeighbors('fundamentos-sql').next?.id).toBe('consultas-relacionales');
    expect(sectionNeighbors('plsql').next).toBeNull();
  });
});
