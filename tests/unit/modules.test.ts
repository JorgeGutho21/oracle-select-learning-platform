import { describe, expect, it } from 'vitest';
import {
  currentModule,
  isAvailableModule,
  MODULE_CATALOG,
  MODULE_STATUS_LABEL,
  moduleAnchor,
  upcomingModules,
} from '@/features/modules/application/modules-api';
import { searchPublicCatalog } from '@/features/search/application/search-index';

describe('catálogo académico de módulos', () => {
  it('numera SELECT y los siete módulos futuros en orden', () => {
    expect(MODULE_CATALOG.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(MODULE_CATALOG.map(({ keyword }) => keyword)).toEqual([
      'SELECT … FROM',
      'WHERE',
      'BETWEEN',
      'IN',
      'LIKE',
      'JOIN',
      'GROUP BY',
      'UPPER · ROUND',
    ]);
    expect(new Set(MODULE_CATALOG.map(({ id }) => id)).size).toBe(MODULE_CATALOG.length);
  });

  it('SELECT es la unidad actual y lleva a la experiencia educativa', () => {
    const current = currentModule();
    expect(current.id).toBe('select');
    expect(current.status).toBe('CURRENT');
    expect(current.href).toBe('/learn');
    expect(isAvailableModule(current)).toBe(true);
    expect(MODULE_STATUS_LABEL[current.status]).toBe('Unidad actual');
  });

  it('los módulos futuros son fichas «Próximamente» sin destino ni progreso', () => {
    const upcoming = upcomingModules();
    expect(upcoming).toHaveLength(7);
    for (const entry of upcoming) {
      expect(entry.status).toBe('COMING_SOON');
      expect(entry.href).toBeNull();
      expect(isAvailableModule(entry)).toBe(false);
      expect(entry.prerequisites.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(20);
    }
    expect(MODULE_STATUS_LABEL.COMING_SOON).toBe('Próximamente');
  });

  it('cada prerrequisito nombra un módulo del mismo catálogo', () => {
    const titles = new Set(MODULE_CATALOG.map(({ title }) => title));
    for (const entry of MODULE_CATALOG) {
      for (const prerequisite of entry.prerequisites) expect(titles).toContain(prerequisite);
    }
  });

  it('genera anclas estables para cada tarjeta', () => {
    expect(moduleAnchor({ id: 'group-by' })).toBe('modulo-group-by');
  });

  it('el buscador deriva sus fichas futuras y el acceso al catálogo de la misma fuente', () => {
    for (const entry of upcomingModules()) {
      const result = searchPublicCatalog(entry.title).find(({ id }) => id === `future-${entry.id}`);
      expect(result?.status).toBe('Próximamente');
      expect(result?.href).toBeNull();
    }
    expect(searchPublicCatalog('catalogo').map(({ href }) => href)).toContain('/modules');
  });
});
