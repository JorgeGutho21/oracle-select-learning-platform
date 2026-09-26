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

/** Estado visible de un tema. */
export function topicStatusLabel(topic: Pick<CurriculumTopic, 'status'>): string {
  return topic.status === 'current' ? 'Disponible' : 'Próximamente';
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
