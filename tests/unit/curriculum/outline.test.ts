import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURRICULA, EXTENSIONS } from '@/features/curriculum/domain/registry';
import type { CurriculumUnit } from '@/features/curriculum/domain/types';
import legacyScenes from '@/features/curriculum/application/legacy-scenes.json';
import releaseScenes from '@/features/curriculum/application/release-scenes-20261004.json';
import type { CurriculumScene } from '@/features/curriculum/domain/types';

type PreviousScene = { readonly id: string; readonly block: string; readonly lesson?: string };

/** Posición vigente de una escena anterior: la misma escena o la primera de su lección o bloque. */
function migrated(scenes: readonly CurriculumScene[], previous: PreviousScene): number {
  const exact = scenes.findIndex((scene) => scene.id === previous.id);
  if (exact >= 0) return exact + 1;
  const related = scenes.findIndex((scene) =>
    previous.lesson ? scene.lesson === previous.lesson : scene.block === previous.block,
  );
  return related >= 0 ? related + 1 : 1;
}

/**
 * El índice ligero (`application/outline.json`) coincide con el contenido. Con
 * CURRICULUM_UPDATE=1 se regenera.
 */

const FILE = 'src/features/curriculum/application/outline.json';

function lessonsOf(unit: CurriculumUnit) {
  return {
    section: unit.section,
    blocks: unit.blocks.map(({ id, number, title }) => ({ id, number, title })),
    lessons: unit.lessons.map(({ id, block, slug, title, shortTitle, summary, version }) => ({
      id,
      block,
      slug,
      title,
      shortTitle,
      summary,
      version,
    })),
  };
}

function expected() {
  return {
    sections: CURRICULA.map((curriculum) => ({
      ...lessonsOf(curriculum),
      practice: curriculum.practice.map(({ id }) => id),
      missions: curriculum.missions.map(({ id, title }) => ({ id, title })),
      scenes: curriculum.scenes.length,
      scenePositions: Object.fromEntries(
        curriculum.scenes.map((scene, index) => [scene.id, index + 1]),
      ),
      legacyScenePositions: (
        legacyScenes[curriculum.section as keyof typeof legacyScenes] as readonly PreviousScene[]
      ).map((previous) => migrated(curriculum.scenes, previous)),
      releaseScenePositions: (
        releaseScenes[curriculum.section as keyof typeof releaseScenes] as readonly PreviousScene[]
      ).map((previous) => migrated(curriculum.scenes, previous)),
      retiredScenePositions: Object.fromEntries(
        (
          releaseScenes[
            curriculum.section as keyof typeof releaseScenes
          ] as readonly PreviousScene[]
        )
          .filter((previous) => !curriculum.scenes.some((scene) => scene.id === previous.id))
          .map((previous) => [previous.id, migrated(curriculum.scenes, previous)]),
      ),
      classLessonScenes: Object.fromEntries(
        curriculum.lessons.map((lesson) => [
          lesson.id,
          curriculum.scenes.findIndex((scene) => scene.lesson === lesson.id) + 1,
        ]),
      ),
    })),
    extensions: EXTENSIONS.map(lessonsOf),
  };
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
