import type {
  CurriculumConcept,
  CurriculumLesson,
  CurriculumScene,
  TopicPlan,
  TopicTable,
} from './types';

/**
 * Contrato pedagógico de un tema (S2_S3_PEDAGOGICAL_RESTRUCTURE.md), derivado del Estudio y
 * la Exposición de la Sección 1: problema → definición → datos → sintaxis leída por partes →
 * microejemplo → ejemplo del dataset → resultado → antes y después → error → comprobación.
 */
export interface PedagogicalTopicContract {
  readonly lesson: string;
  readonly tier: TopicPlan['tier'];
  readonly problem: string;
  readonly definitions: readonly CurriculumConcept[];
  readonly purpose: string;
  /** Lecciones previas que hay que conocer. */
  readonly prerequisites: readonly CurriculumLesson[];
  /** Conocimientos que vienen de secciones anteriores. */
  readonly prior: string | null;
  readonly mentalModel: string;
  readonly tables: readonly TopicTable[];
  readonly syntax: string;
  readonly parts: TopicPlan['parts'];
  readonly reading: string;
  readonly example: string;
  readonly simpleExample: string;
  readonly explanation: readonly string[];
  readonly changed: readonly string[];
  readonly unchanged: readonly string[];
  readonly keyTakeaway: string;
  readonly practice: string;
}

export function topicPlan(lesson: CurriculumLesson): TopicPlan {
  if (!lesson.plan) throw new Error(`Falta el contrato pedagógico: ${lesson.id}`);
  return lesson.plan;
}

export function pedagogicalTopic(
  lesson: CurriculumLesson,
  lessons: readonly CurriculumLesson[],
  concepts: readonly CurriculumConcept[],
): PedagogicalTopicContract {
  const plan = topicPlan(lesson);
  return {
    lesson: lesson.id,
    tier: plan.tier,
    problem: plan.problem,
    definitions: lesson.concepts.map((id) => {
      const concept = concepts.find((item) => item.id === id);
      if (!concept) throw new Error(`Missing definition: ${lesson.id}/${id}`);
      return concept;
    }),
    purpose: lesson.purpose,
    prerequisites: plan.prerequisites.map((id) => {
      const previous = lessons.find((item) => item.id === id);
      if (!previous) throw new Error(`Prerrequisito inexistente: ${lesson.id} → ${id}`);
      return previous;
    }),
    prior: plan.prior ?? null,
    mentalModel: plan.model,
    tables: plan.tables,
    syntax: lesson.syntax,
    parts: plan.parts,
    reading: plan.reading,
    example: lesson.example.example,
    simpleExample: lesson.micro?.example ?? lesson.example.example,
    explanation: lesson.explanation,
    changed: lesson.changed,
    unchanged: plan.unchanged,
    keyTakeaway: lesson.keyIdea,
    practice: lesson.check.id,
  };
}

/** «Necesitas…»: prerrequisitos de la sección o conocimientos previos, en una frase. */
export function prerequisiteLine(topic: PedagogicalTopicContract): string {
  const titles = topic.prerequisites.map((lesson) => `«${lesson.shortTitle}»`);
  if (titles.length > 0) return `Necesitas: ${titles.join(', ')}.`;
  return topic.prior ?? 'No necesitas conocimientos previos de esta sección.';
}

const TIER_LABEL: Readonly<Record<TopicPlan['tier'], string>> = {
  core: 'Núcleo',
  support: 'Apoyo',
  extension: 'Ampliación',
};

export function tierLabel(tier: TopicPlan['tier']): string {
  return TIER_LABEL[tier];
}

/**
 * Guion de clase generado desde las lecciones. Cada escena transmite una idea completa:
 *
 * 1. problema, definición, propósito y prerrequisitos (con el modelo mental);
 * 2. las tablas que el tema usa por primera vez, antes de cualquier código;
 * 3. la sintaxis mínima, parte por parte y leída en español;
 * 4. el microejemplo y los ejemplos con datos (código → visualización → resultado);
 * 5. antes y después: qué cambió y qué no, con el error frecuente;
 * 6. la comprobación.
 *
 * Los temas de ampliación se proyectan más breves: idea, ejemplo, cambio y comprobación.
 * Las escenas de lección curadas (con visualización propia) se conservan.
 */
export function pedagogicalScenes(
  original: readonly CurriculumScene[],
  lessons: readonly CurriculumLesson[],
  concepts: readonly CurriculumConcept[],
): readonly CurriculumScene[] {
  const scenes: CurriculumScene[] = original.filter((scene) =>
    ['cover', 'agenda'].includes(scene.kind),
  );
  const introduced = new Set<string>();
  const presented = new Set<string>();
  for (const lesson of lessons) {
    const topic = pedagogicalTopic(lesson, lessons, concepts);
    const extension = topic.tier === 'extension';
    const base = { block: lesson.block, lesson: lesson.id };
    const definitions = topic.definitions.map((concept) => {
      const first = !introduced.has(concept.id);
      introduced.add(concept.id);
      return first
        ? `${concept.term}: ${concept.definition}`
        : `Recuerda · ${concept.term}: ${concept.definition}`;
    });
    scenes.push({
      ...base,
      id: `intro-${lesson.id}`,
      kind: 'idea',
      intent: 'definition',
      title: lesson.title,
      shortTitle: lesson.shortTitle,
      points: [
        topic.problem,
        ...definitions,
        `Para qué sirve: ${lesson.purpose}`,
        prerequisiteLine(topic),
      ],
      code: topic.mentalModel,
      notes: {
        explain: topic.definitions[0]?.definition ?? lesson.explanation[0]!,
        mistake: topic.definitions[0]?.mistake.why ?? lesson.mistakes[0]!.why,
        question: topic.problem,
        transition: 'Antes de escribir código, veamos con qué datos trabajamos.',
      },
    });
    const tables = topic.tables.filter((table) => !presented.has(table.table));
    for (const table of tables) presented.add(table.table);
    if (tables.length > 0)
      scenes.push({
        ...base,
        id: `tables-${lesson.id}`,
        kind: 'tables',
        title:
          tables.length === 1
            ? `La tabla ${tables[0]!.table}`
            : `Las tablas: ${tables.map((table) => table.table).join(' y ')}`,
        shortTitle: 'Tablas',
        tables,
        points: tables.map((table) => `${table.table}: ${table.role}`),
        notes: {
          explain:
            'Presenta cada tabla antes del código: qué representa una fila, su clave primaria, sus claves foráneas y las columnas que usará el ejemplo.',
          transition: 'Con los datos a la vista, leamos la forma general.',
        },
      });
    if (!extension)
      scenes.push({
        ...base,
        id: `syntax-${lesson.id}`,
        kind: 'idea',
        intent: 'syntax',
        title: `Cómo se escribe: ${topic.definitions[0]?.term ?? lesson.shortTitle}`,
        shortTitle: 'Sintaxis',
        points: [`Se lee así: ${topic.reading}`],
        code: lesson.syntax,
        parts: topic.parts,
        notes: {
          explain: lesson.explanation[0]!,
          transition: 'Probemos la idea con el ejemplo más pequeño posible.',
        },
      });
    const existing = original
      .filter((scene) => scene.lesson === lesson.id && scene.kind === 'lesson')
      .map((scene) => ({ ...scene, block: lesson.block }));
    if (!extension && lesson.micro && lesson.micro.example !== lesson.example.example)
      scenes.push({
        ...base,
        id: `micro-${lesson.id}`,
        kind: 'lesson',
        example: lesson.micro.example,
        title: `${lesson.shortTitle}: empezar con poco`,
        shortTitle: 'Microejemplo',
        notes: { explain: lesson.micro.reading },
      });
    const mainIsShown = existing.some(
      (scene) => !scene.example || scene.example === lesson.example.example,
    );
    if (!mainIsShown)
      scenes.push({
        ...base,
        id: `example-${lesson.id}`,
        kind: 'lesson' as const,
        title: lesson.shortTitle,
        shortTitle: 'Ejemplo con datos',
        notes: { explain: lesson.example.reading },
      });
    scenes.push(...existing);
    scenes.push(
      {
        ...base,
        id: `explain-${lesson.id}`,
        kind: 'idea',
        intent: 'explanation',
        title: `Antes y después: ${lesson.shortTitle}`,
        shortTitle: 'Qué cambió',
        points: [...lesson.changed],
        changed: lesson.changed,
        unchanged: topic.unchanged,
        mistake: lesson.mistakes[0]!,
        keyIdea: lesson.keyIdea,
        notes: { explain: lesson.example.reading, mistake: lesson.mistakes[0]!.why },
      },
      {
        ...base,
        id: `check-${lesson.id}`,
        kind: 'check',
        title: `Comprueba: ${lesson.shortTitle}`,
        shortTitle: 'Comprobación',
        activity: { ...lesson.check, id: `${lesson.check.id}-class` },
        notes: { explain: lesson.check.explanation, mistake: lesson.mistakes[0]!.why },
      },
    );
  }
  scenes.push(...original.filter((scene) => scene.kind === 'closing'));
  return scenes;
}
