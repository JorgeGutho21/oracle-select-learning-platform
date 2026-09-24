import { describe, expect, it } from 'vitest';

import {
  getPlatformNavigation,
  searchPublicCatalog,
} from '@/features/search/application/search-index';

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

  it.each(['WHERE', 'BETWEEN', 'IN', 'LIKE', 'JOIN', 'GROUP BY', 'funciones'])(
    'declara %s como contenido futuro sin destino engañoso',
    (query) => {
      const results = searchPublicCatalog(query);
      expect(results).not.toHaveLength(0);
      expect(results.every(({ href, status }) => href === null && status === 'Próximamente')).toBe(
        true,
      );
    },
  );

  it('deriva toda la navegación del mismo catálogo público', () => {
    expect(getPlatformNavigation()).toEqual([
      { href: '/', label: 'Inicio' },
      { href: '/learn', label: 'Aprender' },
      { href: '/presentation', label: 'Presentación' },
      { href: '/lab', label: 'Laboratorio' },
      { href: '/challenge', label: 'Challenge' },
      { href: '/live', label: 'En vivo' },
      { href: '/results', label: 'Resultados' },
      { href: '/resources', label: 'Recursos' },
    ]);
  });

  it('no devuelve resultados para una consulta vacía o desconocida', () => {
    expect(searchPublicCatalog('')).toEqual([]);
    expect(searchPublicCatalog('procedimiento inexistente')).toEqual([]);
  });
});
