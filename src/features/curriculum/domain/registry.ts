import type { SectionId } from '@/features/sections/domain/sections';
import type {
  Activity,
  CurriculumConcept,
  CurriculumExample,
  CurriculumExtension,
  CurriculumUnit,
  CurriculumLesson,
  LessonExample,
  SectionCurriculum,
} from './types';
import { S1_FUNCTIONS } from './sections/s1';
import { S2_CURRICULUM } from './sections/s2';
import { S2_ASSESSMENT_EXAMPLES } from './sections/s2/assessment';
import { S3_ASSESSMENT_EXAMPLES } from './sections/s3/assessment';
import { S3_CURRICULUM } from './sections/s3';

/**
 * Registro de la fuente curricular. Cada sección aparece una vez; los modos buscan aquí sus
 * lecciones, ejemplos y actividades por identificador.
 */

export const CURRICULA: readonly SectionCurriculum[] = [S2_CURRICULUM, S3_CURRICULUM];

/** Ampliaciones de secciones con modos propios (la Sección 1). */
export const EXTENSIONS: readonly CurriculumExtension[] = [S1_FUNCTIONS];

/** Secciones completas y ampliaciones: todo lo que tiene lecciones de la fuente curricular. */
export const UNITS: readonly CurriculumUnit[] = [...CURRICULA, ...EXTENSIONS];

/**
 * Consultas y bloques propios del banco de evaluación (S2-B-*, S3-B-*): no se estudian, pero
 * se verifican en Oracle igual que el resto y el banco toma de ellos sus resultados.
 */
export const ASSESSMENT_EXAMPLES: readonly CurriculumExample[] = [
  ...S2_ASSESSMENT_EXAMPLES,
  ...S3_ASSESSMENT_EXAMPLES,
];

export const ALL_EXAMPLES: readonly CurriculumExample[] = [
  ...UNITS.flatMap((unit) => unit.examples),
  ...ASSESSMENT_EXAMPLES,
];

/** Sección completa o ampliación con lecciones de la fuente curricular. */
export function unitOf(section: string): CurriculumUnit | undefined {
  return UNITS.find((unit) => unit.section === section);
}

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
  for (const unit of UNITS) {
    const lesson = unit.lessons.find((entry) => entry.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}

export function conceptById(curriculum: CurriculumUnit, id: string): CurriculumConcept | undefined {
  return curriculum.concepts.find((concept) => concept.id === id);
}

/** Ejemplo principal y adicionales de una lección, en orden. */
export function lessonExamples(lesson: CurriculumLesson): readonly LessonExample[] {
  return [lesson.example, ...(lesson.more ?? [])];
}

/** Todas las actividades de una sección: comprobaciones, práctica, misiones y escenas. */
export function sectionActivities(curriculum: CurriculumUnit): readonly Activity[] {
  const full = 'missions' in curriculum ? (curriculum as SectionCurriculum) : null;
  return [
    ...curriculum.lessons.map((lesson) => lesson.check),
    ...curriculum.practice,
    ...(full?.missions.flatMap((mission) => mission.steps) ?? []),
    ...(full?.scenes.flatMap((scene) => (scene.activity ? [scene.activity] : [])) ?? []),
  ];
}
