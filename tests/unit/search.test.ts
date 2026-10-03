import { describe, expect, it } from 'vitest';

import {
  getPlatformNavigation,
  isNavigationItemActive,
  searchPublicCatalog,
} from '@/features/search/application/search-index';
import { LESSONS } from '@/features/study/application/study-api';
import { LESSON_OUTLINE } from '@/features/study/domain/lesson-outline';

describe('Índice público de búsqueda', () => {
  it.each([
    ['AS', '/learn/alias'],
    ['alias', '/learn/alias'],
    ['*', '/learn/asterisco'],
    ['ASTERISCO', '/learn/asterisco'],
    ['expresión', '/learn/expresiones'],
    ['quiz', '/challenge'],
    ['vídeo', '/resources#video-introduccion'],
  ])('resuelve %s sin depender de caja ni tildes', (query, expectedHref) => {
    expect(searchPublicCatalog(query).map(({ href }) => href)).toContain(expectedHref);
  });

  it.each([
    ['alias', '/learn/alias'],
    ['as', '/learn/alias'],
    ['distinct', '/learn/distinct'],
    ['where', '/learn/where'],
    ['between', '/learn/between'],
    ['in', '/learn/in'],
    ['like', '/learn/like'],
    ['null', '/learn/null'],
    ['is null', '/learn/null'],
    ['order by', '/learn/order-by'],
    ['desc', '/learn/order-by'],
    ['concatenar', '/learn/concatenacion'],
    ['paréntesis', '/learn/parentesis'],
  ])('encuentra el tema actual %s en su lección', (query, href) => {
    const results = searchPublicCatalog(query);
    const lesson = results.find((result) => result.href === href);
    expect(lesson?.status, query).toBe('Disponible');
  });

  // Desde la Fase 4, los temas que ya enseña una lección llevan a esa lección.
  it.each([
    ['upper', '/sections/fundamentos-sql/study/funciones-de-texto'],
    ['round', '/sections/fundamentos-sql/study/funciones-numericas'],
    ['group by', '/sections/consultas-relacionales/study/group-by'],
    ['join', '/sections/consultas-relacionales/study/inner-join'],
    ['insert', '/sections/plsql/study/dml-en-plsql'],
    ['having', '/sections/consultas-relacionales/study/having'],
    ['commit', '/sections/plsql/study/dml-en-plsql'],
  ])('lleva %s a la lección que ya lo enseña', (query, href) => {
    const result = searchPublicCatalog(query).find((entry) => entry.href === href);
    expect(result?.status, query).toBe('Disponible');
  });

  it.each([
    ['to_char', '/modules#tema-to-char'],
    ['create table', '/modules#tema-create-table'],
    ['funciones', '/modules#nivel-2'],
  ])('marca %s como Próximamente con destino real en la ruta', (query, href) => {
    const results = searchPublicCatalog(query);
    const future = results.find((result) => result.href === href);
    expect(future?.status, query).toBe('Próximamente');
    expect(future?.group, query).toBe('Próximamente');
  });

  it('las lecciones de las secciones 2 y 3 se encuentran por su título', () => {
    expect(
      searchPublicCatalog('trigger').some(({ href }) => href?.startsWith('/sections/plsql/study/')),
    ).toBe(true);
    expect(
      searchPublicCatalog('left outer join').some(
        ({ href }) => href === '/sections/consultas-relacionales/study/left-outer-join',
      ),
    ).toBe(true);
  });

  it('ningún resultado futuro apunta a una lección ni a una ruta inexistente', () => {
    for (const query of ['join', 'insert', 'group', 'nvl', 'subconsulta', 'create table']) {
      for (const result of searchPublicCatalog(query).filter(
        ({ status }) => status === 'Próximamente',
      )) {
        // Lo próximo lleva a su ficha de la ruta o al plan publicado de su sección.
        expect(result.href, query).toMatch(/^\/(modules#(tema|nivel)-|sections\/[a-z-]+$)/);
      }
    }
  });

  it('deriva toda la navegación del mismo catálogo público', () => {
    expect(getPlatformNavigation()).toEqual([
      { href: '/', label: 'Inicio', alsoActiveOn: [] },
      {
        href: '/sections',
        label: 'Secciones',
        alsoActiveOn: ['/learn', '/presentation', '/modules'],
      },
      { href: '/lab', label: 'Laboratorio', alsoActiveOn: [] },
      { href: '/challenge', label: 'Challenge', alsoActiveOn: [] },
      { href: '/live', label: 'En vivo', alsoActiveOn: [] },
      { href: '/resources', label: 'Recursos', alsoActiveOn: [] },
    ]);
  });

  it('marca «Secciones» en secciones, Estudio y Exposición, e «Inicio» solo en la portada', () => {
    const [home, sections] = getPlatformNavigation();
    expect(isNavigationItemActive(home!, '/')).toBe(true);
    expect(isNavigationItemActive(home!, '/learn')).toBe(false);
    for (const path of [
      '/sections',
      '/sections/plsql',
      '/learn',
      '/learn/alias',
      '/presentation',
    ]) {
      expect(isNavigationItemActive(sections!, path)).toBe(true);
    }
    expect(isNavigationItemActive(sections!, '/lab')).toBe(false);
    expect(isNavigationItemActive(sections!, '/learning')).toBe(false);
  });

  it('toma los títulos de las lecciones del mismo esquema que el Modo Estudio', () => {
    expect(LESSONS.map(({ slug, title }) => ({ href: `/learn/${slug}`, title }))).toEqual(
      LESSON_OUTLINE.map(({ slug, title }) => ({ href: `/learn/${slug}`, title })),
    );
    for (const lesson of LESSONS) {
      expect(searchPublicCatalog(lesson.title).map(({ href }) => href)).toContain(
        `/learn/${lesson.slug}`,
      );
    }
  });

  it.each([
    ['SELECT', '/resources#chuleta-select'],
    ['FROM', '/resources#chuleta-from'],
    ['SELECT *', '/resources#chuleta-asterisco'],
    ['expresiones', '/resources#chuleta-expresiones'],
    ['AS', '/resources#chuleta-alias'],
    ['DISTINCT', '/resources#chuleta-distinct'],
    ['WHERE', '/resources#chuleta-where'],
    ['BETWEEN', '/resources#chuleta-between'],
    ['LIKE', '/resources#chuleta-like'],
    ['ORDER BY', '/resources#chuleta-order-by'],
  ])('ofrece el concepto %s en el grupo Conceptos', (query, href) => {
    const concept = searchPublicCatalog(query).find((result) => result.href === href);
    expect(concept?.group).toBe('Conceptos');
    expect(concept?.status).toBe('Disponible');
  });

  it.each([
    ['estudio', '/learn'],
    ['exposición', '/presentation'],
    ['laboratorio', '/lab'],
    ['challenge', '/challenge'],
    ['recursos', '/resources'],
    ['videos', '/resources#video-resumen'],
  ])('encuentra %s como destino directo', (query, href) => {
    expect(searchPublicCatalog(query).map((result) => result.href)).toContain(href);
  });

  it('no confunde un término con palabras cortas de otras fichas («e», «de»)', () => {
    expect(searchPublicCatalog('exposicion').map(({ id }) => id)).toEqual(['presentation']);
    expect(searchPublicCatalog('expresión').map(({ href }) => href)).toContain(
      '/learn/expresiones',
    );
  });

  it('agrupa cada resultado en Conceptos, Lecciones, Práctica, Recursos o Próximamente', () => {
    for (const result of searchPublicCatalog('select')) {
      expect(['Conceptos', 'Lecciones', 'Práctica', 'Recursos', 'Próximamente']).toContain(
        result.group,
      );
    }
  });

  it('no devuelve resultados para una consulta vacía o desconocida', () => {
    expect(searchPublicCatalog('')).toEqual([]);
    expect(searchPublicCatalog('procedimiento inexistente')).toEqual([]);
  });
});
