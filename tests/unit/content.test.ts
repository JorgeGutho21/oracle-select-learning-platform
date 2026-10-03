// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { publicCatalog } from '@/features/search/domain/public-catalog';
import {
  CURRICULUM_LEVELS,
  FUTURE_TOPICS,
  topicAnchor,
} from '@/features/modules/application/modules-api';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { LESSONS } from '@/features/study/application/study-api';

const app = path.resolve('src/app');
const resourcesPage = readFileSync(
  path.resolve('src/features/resources/presentation/resources-page.tsx'),
  'utf8',
);

/** Anclas que existen en cada ruta con secciones enlazables. */
const ANCHORS: Readonly<Record<string, ReadonlySet<string>>> = {
  '/resources': new Set([
    'chuleta',
    'referencia',
    'ejemplos',
    'videos',
    'fuentes',
    'video-introduccion',
    'video-resumen',
    ...LESSONS.filter(({ concept }) => concept).map(({ slug }) => `chuleta-${slug}`),
  ]),
  '/modules': new Set([
    ...FUTURE_TOPICS.map((topic) => topicAnchor(topic)),
    ...CURRICULUM_LEVELS.map(({ number }) => `nivel-${number}`),
  ]),
};

function routeExists(pathname: string): boolean {
  if (pathname === '/') return existsSync(path.join(app, 'page.tsx'));
  const lesson = /^\/learn\/([^/]+)$/.exec(pathname);
  if (lesson) return LESSON_INDEX.some(({ slug }) => slug === lesson[1]);
  return existsSync(path.join(app, ...pathname.split('/').filter(Boolean), 'page.tsx'));
}

describe('destinos del buscador y de la ruta', () => {
  it('toda entrada navegable apunta a una ruta y un ancla que existen', () => {
    for (const entry of publicCatalog) {
      if (!entry.href) continue;
      const [pathname = '', anchor] = entry.href.split('#');
      expect(routeExists(pathname), entry.href).toBe(true);
      if (anchor) expect(ANCHORS[pathname]?.has(anchor), entry.href).toBe(true);
    }
  });

  it('las secciones de Recursos que usa el buscador están en la página', () => {
    for (const id of ['chuleta', 'referencia', 'ejemplos', 'videos', 'fuentes']) {
      expect(resourcesPage, id).toContain(`id="${id}"`);
    }
    expect(resourcesPage).toContain('id="video-introduccion"');
    expect(resourcesPage).toContain('id="video-resumen"');
    expect(resourcesPage).toContain('id={`chuleta-${lesson.slug}`}');
  });

  it('los temas futuros no reutilizan rutas de lecciones actuales ni se anuncian como disponibles', () => {
    const lessons = new Set(LESSON_INDEX.map(({ slug }) => slug));
    for (const topic of FUTURE_TOPICS) expect(lessons.has(topic.slug), topic.slug).toBe(false);
    for (const entry of publicCatalog.filter(({ id }) => id.startsWith('future-'))) {
      expect(entry.available, entry.id).toBe(false);
      expect(entry.group, entry.id).toBe('Próximamente');
    }
  });

  it('cada lección actual aparece en el buscador con su ruta', () => {
    for (const lesson of LESSON_INDEX) {
      expect(
        publicCatalog.some((entry) => entry.href === `/learn/${lesson.slug}`),
        lesson.slug,
      ).toBe(true);
    }
  });
});
