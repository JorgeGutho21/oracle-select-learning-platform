import {
  CURRICULUM_LEVELS,
  FUTURE_TOPICS,
  findFutureTopic,
  levelOf,
  topicAnchor,
  topicsOfLevel,
  type CurriculumLevel,
  type CurriculumTopic,
  type LevelStage,
} from '../domain/curriculum';

import {
  CURRICULUM_OUTLINE,
  EXTENSION_OUTLINE,
  curriculumLessonHref,
} from '@/features/curriculum/application/outline';
import { findSection } from '@/features/sections/domain/sections';

export type { CurriculumLevel, CurriculumTopic, LevelStage } from '../domain/curriculum';
export {
  CURRICULUM_LEVELS,
  FUTURE_TOPICS,
  findFutureTopic,
  levelOf,
  topicAnchor,
  topicsOfLevel,
} from '../domain/curriculum';

export const STAGE_LABEL: Readonly<Record<LevelStage, string>> = {
  AHORA: 'Ahora',
  'SIGUIENTE NIVEL': 'Siguiente nivel',
  'MÁS ADELANTE': 'Más adelante',
};

/**
 * Temas de la ruta que ya enseña una lección de la fuente curricular (Fase 4): la ampliación
 * de funciones de la Sección 1, la Sección 2 y el DML dentro de PL/SQL de la Sección 3. Los
 * temas que no aparecen aquí siguen «Próximamente».
 */
const TAUGHT_IN: Readonly<Record<string, string>> = {
  upper: 'S1-L22',
  lower: 'S1-L22',
  initcap: 'S1-L22',
  length: 'S1-L22',
  substr: 'S1-L22',
  round: 'S1-L23',
  trunc: 'S1-L23',
  mod: 'S1-L23',
  sysdate: 'S1-L24',
  'operaciones-fecha': 'S1-L24',
  nvl: 'S1-L24',
  count: 'S2-L13',
  sum: 'S2-L12',
  avg: 'S2-L12',
  'min-max': 'S2-L12',
  'group-by': 'S2-L14',
  having: 'S2-L16',
  'relacionar-tablas': 'S2-L01',
  'inner-join': 'S2-L04',
  'left-join': 'S2-L08',
  'right-join': 'S2-L09',
  'full-join': 'S2-L09',
  'cross-join': 'S2-L11',
  'on-using': 'S2-L11',
  'subconsulta-simple': 'S2-L20',
  'subconsulta-where': 'S2-L20',
  'in-subconsulta': 'S2-L21',
  'subconsulta-escalar': 'S2-L20',
  insert: 'S3-L08',
  update: 'S3-L08',
  delete: 'S3-L08',
  'commit-rollback': 'S3-L08',
  'primary-key': 'S2-L01',
  'foreign-key': 'S2-L01',
};

export interface TopicLessonLink {
  readonly label: string;
  readonly href: string;
}

const LESSON_LINKS: ReadonlyMap<string, TopicLessonLink> = new Map(
  [...CURRICULUM_OUTLINE, ...EXTENSION_OUTLINE].flatMap((outline) => {
    const number = findSection(outline.section)?.number ?? 0;
    return outline.lessons.map(
      (lesson) =>
        [
          lesson.id,
          {
            label: `Sección ${number} · ${lesson.shortTitle}`,
            href: curriculumLessonHref(outline.section, lesson.slug),
          },
        ] as const,
    );
  }),
);

/** Lección que ya enseña un tema de la ruta, o `null` si sigue pendiente. */
export function topicLesson(topic: Pick<CurriculumTopic, 'id'>): TopicLessonLink | null {
  const lesson = TAUGHT_IN[topic.id];
  return lesson ? (LESSON_LINKS.get(lesson) ?? null) : null;
}

/** Estado visible de un tema. */
export function topicStatusLabel(topic: Pick<CurriculumTopic, 'id' | 'status'>): string {
  return topic.status === 'current' || topicLesson(topic) ? 'Disponible' : 'Próximamente';
}

/** Destino real de un tema futuro: su ficha en `/modules`. */
export function futureTopicHref(slug: string): string | null {
  const topic = findFutureTopic(slug);
  return topic ? `/modules#${topicAnchor(topic)}` : null;
}

export function currentLevel(): CurriculumLevel {
  return levelOf(1);
}

/** Niveles futuros con sus temas, en orden. */
export function upcomingLevels(): readonly (CurriculumLevel & {
  readonly topics: readonly CurriculumTopic[];
})[] {
  return CURRICULUM_LEVELS.filter((level) => level.stage !== 'AHORA').map((level) => ({
    ...level,
    topics: topicsOfLevel(level.number),
  }));
}

export function levelAnchor(level: Pick<CurriculumLevel, 'number'>): string {
  return `nivel-${level.number}`;
}

export const FUTURE_TOPIC_COUNT = FUTURE_TOPICS.length;
