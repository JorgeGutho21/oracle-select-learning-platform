import { describe, expect, it } from 'vitest';
import { CURRICULA } from '@/features/curriculum/domain/registry';
import { pedagogicalTopic } from '@/features/curriculum/domain/pedagogy';
import { VERIFIED } from '@/features/curriculum/application/verified-results';
import { explainOracleError } from '@/features/curriculum/domain/oracle-errors';
import { searchPublicCatalog } from '@/features/search/application/search-index';
import { ROUTE_VISUAL_PROFILE, visualKind } from '@/presentation/layouts/route-visual-profile';

describe.each(CURRICULA)('Beginner content gate: $section', (curriculum) => {
  it('every topic defines its concepts before its first class example', () => {
    const introduced = new Set<string>();
    for (const scene of curriculum.scenes) {
      if (scene.intent === 'definition') {
        const concept = curriculum.concepts.find((entry) => scene.id === `define-${entry.id}`);
        expect(concept, scene.id).toBeDefined();
        expect(scene.points).toContain(concept!.definition);
        introduced.add(concept!.id);
      }
      if (scene.kind === 'lesson') {
        const lesson = curriculum.lessons.find((entry) => entry.id === scene.lesson)!;
        for (const concept of lesson.concepts)
          expect(introduced.has(concept), `${scene.id}: ${concept}`).toBe(true);
      }
    }
    expect([...introduced].sort()).toEqual(curriculum.concepts.map((entry) => entry.id).sort());
  });

  it('every major topic has purpose, prerequisites, model, syntax, verified result and practice', () => {
    for (const lesson of curriculum.lessons) {
      const topic = pedagogicalTopic(lesson, curriculum.lessons, curriculum.concepts);
      for (const field of [
        'purpose',
        'prerequisite',
        'mentalModel',
        'syntax',
        'keyTakeaway',
      ] as const)
        expect(topic[field].trim().length, `${lesson.id}/${field}`).toBeGreaterThan(8);
      expect(topic.explanation.length, lesson.id).toBeGreaterThan(0);
      expect(topic.changed.length, lesson.id).toBeGreaterThan(0);
      expect(VERIFIED.results[topic.example], `${lesson.id}: Oracle result`).toBeDefined();
      expect(
        VERIFIED.results[topic.simpleExample],
        `${lesson.id}: small example executed in Oracle`,
      ).toBeDefined();
      expect(
        lesson.micro?.reading.trim().length,
        `${lesson.id}: line-by-line reading`,
      ).toBeGreaterThan(40);
      expect(topic.practice).toBe(lesson.check.id);
      const check = curriculum.scenes.find((scene) => scene.id === `check-${lesson.id}`);
      expect(check?.activity?.lesson).toBe(lesson.id);
      expect(check?.activity?.explanation.trim()).not.toBe('');
      for (const concept of topic.definitions) {
        expect(concept.definition.trim().length, concept.id).toBeGreaterThan(15);
        expect(concept.purpose.trim(), concept.id).not.toBe('');
        expect(VERIFIED.results[concept.example], concept.id).toBeDefined();
      }
    }
  });

  it('no educational scene is only a title or unexplained code', () => {
    for (const scene of curriculum.scenes) {
      if (scene.kind === 'idea') expect(scene.points?.length, scene.id).toBeGreaterThan(0);
      expect(scene.notes.explain.trim().length, scene.id).toBeGreaterThan(15);
      if (scene.code) expect(scene.points?.length, scene.id).toBeGreaterThan(0);
    }
  });
});

it('dataset comes before the first relational example', () => {
  const scenes = CURRICULA[0]!.scenes;
  expect(scenes.findIndex((scene) => scene.kind === 'dataset')).toBeLessThan(
    scenes.findIndex((scene) => scene.kind === 'lesson'),
  );
});

it('PL/SQL starts with a three-line anonymous block instead of SELECT INTO plus IF', () => {
  expect(CURRICULA[1]!.lessons[0]!.example.example).toBe('S3-E-SOLO-BEGIN');
});

it('every intentionally rejected Oracle example has a human explanation and correction', () => {
  const codes = Object.values(VERIFIED.results).flatMap((result) =>
    result.kind === 'query-error'
      ? [result.code]
      : result.kind === 'plsql' && result.error
        ? [result.error.code]
        : [],
  );
  for (const code of new Set(codes)) {
    const explanation = explainOracleError(code);
    expect(explanation, code).not.toBeNull();
    expect(explanation?.correction.length, code).toBeGreaterThan(20);
  }
  expect(explainOracleError('NETWORK_CONNECTION_FAILED')).toBeNull();
});

it.each(['JOIN', 'cursor'])(
  'search connects %s to study, class, practice, Challenge and resources',
  (query) => {
    const results = searchPublicCatalog(query).filter((entry) => entry.status === 'Disponible');
    for (const mode of ['study', 'class', 'practice', 'challenge', 'resources'])
      expect(
        results.some((entry) => entry.href?.includes(`/${mode}`)),
        `${query}/${mode}`,
      ).toBe(true);
  },
);

it('exams and teacher routes have zero decorative motion budget', () => {
  for (const route of ['/teacher', '/teacher/assessments/new', '/evaluations/id/attempt'])
    expect(ROUTE_VISUAL_PROFILE[visualKind(route)].motion).toBe(0);
  expect(visualKind('/sections/plsql/class')).toBe('class');
  expect(visualKind('/sections/consultas-relacionales/study/inner-join')).toBe('study');
});
