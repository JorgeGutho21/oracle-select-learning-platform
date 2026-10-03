import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURRICULA } from '@/features/curriculum/domain/registry';

/**
 * El índice ligero (`application/outline.json`) coincide con el contenido. Con
 * CURRICULUM_UPDATE=1 se regenera.
 */

const FILE = 'src/features/curriculum/application/outline.json';

function expected() {
  return CURRICULA.map((curriculum) => ({
    section: curriculum.section,
    blocks: curriculum.blocks.map(({ id, number, title }) => ({ id, number, title })),
    lessons: curriculum.lessons.map(({ id, block, slug, title, shortTitle, summary, version }) => ({
      id,
      block,
      slug,
      title,
      shortTitle,
      summary,
      version,
    })),
    practice: curriculum.practice.map(({ id }) => id),
    missions: curriculum.missions.map(({ id, title }) => ({ id, title })),
    scenes: curriculum.scenes.length,
  }));
}

describe('Índice ligero del currículo', () => {
  it('coincide con la fuente curricular', () => {
    const outline = expected();
    if (process.env.CURRICULUM_UPDATE === '1') {
      writeFileSync(FILE, `${JSON.stringify(outline, null, 2)}\n`);
    }
    expect(JSON.parse(readFileSync(FILE, 'utf8'))).toEqual(outline);
  });
});
