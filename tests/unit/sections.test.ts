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
import {
  CURRICULUM_OUTLINE,
  extensionOf,
  outlineOf,
} from '@/features/curriculum/application/outline';
import { CURRICULUM_LEVELS } from '@/features/modules/domain/curriculum';
import { LESSON_COUNT, LESSON_INDEX } from '@/features/study/application/lesson-index';

const app = path.resolve('src/app');

function pageExists(href: string): boolean {
  const [pathname = ''] = href.split(/[#?]/);
  const parts = pathname.split('/').filter(Boolean);
  if (existsSync(path.join(app, ...parts, 'page.tsx'))) return true;
  // Rutas de sección: /sections/{id}/… usa el segmento dinámico [section].
  return (
    parts[0] === 'sections' &&
    existsSync(path.join(app, 'sections', '[section]', ...parts.slice(2), 'page.tsx'))
  );
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
    // Ocho bloques del Modo Estudio más la ampliación «Funciones de una fila» (Fase 4).
    expect(available).toHaveLength(9);
    const links = available.flatMap((group) => group.topics.map((topic) => topic.href));
    const extension = extensionOf('fundamentos-sql')!;
    expect(links).toEqual([
      ...LESSON_INDEX.map(({ slug }) => `/learn/${slug}`),
      ...extension.lessons.map(({ slug }) => `/sections/fundamentos-sql/study/${slug}`),
    ]);
    expect(fundamentals.facts.find((fact) => fact.label === 'lecciones')?.value).toBe(
      String(LESSON_COUNT + extension.lessons.length),
    );
  });

  it('las secciones próximas no tienen modos enlazados ni cifras inventadas', () => {
    const upcoming = ['consultas-relacionales', 'plsql'].filter((id) => !outlineOf(id));
    for (const id of upcoming) {
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

  it('las secciones publicadas en la fuente curricular muestran su temario real', () => {
    for (const outline of CURRICULUM_OUTLINE) {
      const section = getSection(outline.section)!;
      expect(section.status).toBe('available');
      const lessons = section.topicGroups
        .filter((group) => group.status === 'available')
        .flatMap((group) => group.topics);
      expect(lessons.map((topic) => topic.label)).toEqual(
        outline.lessons.map((lesson) => lesson.shortTitle),
      );
      for (const topic of lessons) {
        expect(topic.href).toMatch(new RegExp(`^/sections/${outline.section}/study/`));
      }
      expect(section.facts.find((fact) => fact.label === 'lecciones')?.value).toBe(
        String(outline.lessons.length),
      );
      for (const mode of availableModes(section)) {
        expect(pageExists(mode.href!), mode.href!).toBe(true);
      }
      expect(availableModes(section)).toHaveLength(6);
    }
  });

  it('la Sección 3, mientras no esté publicada, prevé los temas de PL/SQL', () => {
    if (outlineOf('plsql')) return;
    const topics = getSection('plsql')!.topicGroups.flatMap((group) =>
      group.topics.map((topic) => topic.label),
    );
    expect(topics).toEqual(
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
