import type { SectionId } from '@/features/sections/domain/sections';
import type {
  Activity,
  CurriculumConcept,
  CurriculumExample,
  CurriculumLesson,
  LessonExample,
  SectionCurriculum,
} from './types';
import { S2_CURRICULUM } from './sections/s2';
import { S3_CURRICULUM } from './sections/s3';

/**
 * Registro de la fuente curricular. Cada sección aparece una vez; los modos buscan aquí sus
 * lecciones, ejemplos y actividades por identificador.
 */

export const CURRICULA: readonly SectionCurriculum[] = [S2_CURRICULUM, S3_CURRICULUM];

export const ALL_EXAMPLES: readonly CurriculumExample[] = CURRICULA.flatMap(
  (curriculum) => curriculum.examples,
);

export function curriculumOf(section: string): SectionCurriculum | undefined {
  return CURRICULA.find((curriculum) => curriculum.section === section);
}

export function hasCurriculum(section: SectionId): boolean {
  return curriculumOf(section) !== undefined;
}

const EXAMPLES = new Map(ALL_EXAMPLES.map((example) => [example.id, example]));

export function exampleById(id: string): CurriculumExample | undefined {
  return EXAMPLES.get(id);
}

export function lessonById(id: string): CurriculumLesson | undefined {
  for (const curriculum of CURRICULA) {
    const lesson = curriculum.lessons.find((entry) => entry.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}

export function conceptById(
  curriculum: SectionCurriculum,
  id: string,
): CurriculumConcept | undefined {
  return curriculum.concepts.find((concept) => concept.id === id);
}

/** Ejemplo principal y adicionales de una lección, en orden. */
export function lessonExamples(lesson: CurriculumLesson): readonly LessonExample[] {
  return [lesson.example, ...(lesson.more ?? [])];
}

/** Todas las actividades de una sección: comprobaciones, práctica, misiones y escenas. */
export function sectionActivities(curriculum: SectionCurriculum): readonly Activity[] {
  return [
    ...curriculum.lessons.map((lesson) => lesson.check),
    ...curriculum.practice,
    ...curriculum.missions.flatMap((mission) => mission.steps),
    ...curriculum.scenes.flatMap((scene) => (scene.activity ? [scene.activity] : [])),
  ];
}
