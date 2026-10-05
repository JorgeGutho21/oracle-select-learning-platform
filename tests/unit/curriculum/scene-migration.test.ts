import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_OUTLINE,
  curriculumScenePosition,
} from '@/features/curriculum/application/outline';
import { CurriculumProgressStore } from '@/features/curriculum/application/curriculum-progress';
import type { ProgressRecord } from '@/features/progress/domain/progress';

describe.each(CURRICULUM_OUTLINE)('Class resume migration: $section', (outline) => {
  it('resolves every previous position and preserves completed progress', () => {
    for (const [index, mapped] of outline.legacyScenePositions.entries()) {
      const record: ProgressRecord = {
        section: outline.section,
        mode: 'class',
        item: 'scenes',
        status: 'completed',
        percent: 100,
        contentVersion: null,
        state: { scene: index + 1 },
        lastActivityAt: 1,
      };
      const store = new CurriculumProgressStore({
        load: () => [record],
        save: () => true,
        clear: () => {},
      });
      expect(store.lastScene(outline.section)).toBe(mapped);
      expect(mapped).toBeGreaterThan(0);
      expect(mapped).toBeLessThanOrEqual(outline.scenes);
      expect(store.getSnapshot()[0]).toEqual(record);
      store.scene(outline.section, mapped, outline.scenes);
      expect(store.getSnapshot()[0]?.status).toBe('completed');
      expect(store.getSnapshot()[0]?.percent).toBe(100);
      expect(store.lastScene(outline.section)).toBe(mapped);
    }
  });
  it('uses the stable identity ahead of stale numeric positions', () => {
    for (const [sceneId, position] of Object.entries(outline.scenePositions))
      expect(curriculumScenePosition(outline.section, { scene: 1, sceneId })).toBe(position);
    expect(
      curriculumScenePosition(outline.section, { scene: 1, sceneId: 'not-a-scene' }),
    ).toBeNull();
    expect(curriculumScenePosition(outline.section, { scene: -1 })).toBeNull();
    expect(curriculumScenePosition(outline.section, { scene: 1.2 })).toBeNull();
  });
});
