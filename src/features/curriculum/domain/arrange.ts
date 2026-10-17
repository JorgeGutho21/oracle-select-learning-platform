import type { CurriculumBlock, CurriculumLesson, TopicPlan } from './types';

export type PlannedTopic = TopicPlan & { readonly block: string };

/**
 * Ordena las lecciones de una sección según su plan (S2_S3_PEDAGOGICAL_RESTRUCTURE.md) y
 * adjunta a cada una su contrato pedagógico. El plan es el orden de estudio, de clase y de
 * práctica; cada lección conserva su identificador y su ruta, así que el progreso guardado
 * sigue siendo válido.
 */
export function arrangeLessons(
  lessons: readonly CurriculumLesson[],
  plan: readonly PlannedTopic[],
  blocks: readonly CurriculumBlock[],
): readonly CurriculumLesson[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  if (
    plan.length !== lessons.length ||
    new Set(plan.map(({ lesson }) => lesson)).size !== plan.length
  )
    throw new Error('El plan debe incluir cada lección una sola vez.');
  let previousBlock = -1;
  return plan.map(({ block, ...topic }) => {
    const lesson = byId.get(topic.lesson);
    if (!lesson) throw new Error(`Lección sin contenido: ${topic.lesson}`);
    if (lesson.block !== block)
      throw new Error(
        `${lesson.id}: el bloque de la lección (${lesson.block}) no es el del plan (${block}).`,
      );
    const number = blocks.findIndex((entry) => entry.id === block);
    if (number < 0) throw new Error(`${lesson.id}: bloque inexistente ${block}.`);
    if (number < previousBlock) throw new Error(`${lesson.id}: los bloques deben seguir su orden.`);
    previousBlock = number;
    return { ...lesson, plan: topic };
  });
}
