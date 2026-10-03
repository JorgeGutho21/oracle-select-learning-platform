import { describe, expect, it } from 'vitest';
import { EMPLEADOS_DATASET } from '@/domain/dataset/empleados';
import { EMPRESA_TABLES, empresaTable } from '@/domain/dataset/empresa';
import { ASSESSMENT_TOPICS } from '@/features/assessments/domain/topics';
import {
  exampleHash,
  VERIFIED,
  type VerifiedResult,
} from '@/features/curriculum/application/verified-results';
import {
  ALL_EXAMPLES,
  CURRICULA,
  EXTENSIONS,
  exampleById,
  lessonById,
  lessonExamples,
  sectionActivities,
} from '@/features/curriculum/domain/registry';
import type {
  Activity,
  CurriculumExample,
  ExampleVisual,
  CurriculumUnit,
  QueryExample,
  SectionCurriculum,
} from '@/features/curriculum/domain/types';

/**
 * Integridad de la fuente curricular (PHASE4_QA.md): identificadores únicos, referencias
 * entre lecciones, ejemplos, actividades, misiones y escenas, respuestas bien formadas,
 * tablas de origen que existen y resultados verificados en Oracle al día.
 */

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function tableColumns(dataset: string, table: string): readonly string[] | undefined {
  if (dataset === 'empleados-v2') {
    return table === 'EMPLEADOS' ? EMPLEADOS_DATASET.columns.map(({ name }) => name) : undefined;
  }
  return empresaTable(table)?.columns.map(({ name }) => name);
}

const TABLE_NAMES = [...EMPRESA_TABLES.map(({ name }) => name)];

/** Tablas que menciona una consulta (los nombres de tabla no coinciden con columnas). */
function referencedTables(sql: string): string[] {
  return TABLE_NAMES.filter((name) =>
    new RegExp(`(?<!\\bAS\\s{1,20})\\b${name}\\b`, 'i').test(sql),
  );
}

function examplesUsedBy(curriculum: CurriculumUnit): Set<string> {
  const used = new Set<string>();
  const visit = (visual?: ExampleVisual) => {
    if (!visual) return;
    if (visual.kind === 'compare') used.add(visual.other);
    if (visual.kind === 'pipeline') visual.stages.forEach((stage) => used.add(stage.example));
    if (visual.kind === 'cursor') used.add(visual.query);
  };
  for (const lesson of curriculum.lessons) {
    for (const entry of lessonExamples(lesson)) {
      used.add(entry.example);
      visit(entry.visual);
    }
  }
  for (const concept of curriculum.concepts) used.add(concept.example);
  for (const activity of sectionActivities(curriculum)) {
    if (activity.context?.example) used.add(activity.context.example);
    if (activity.kind === 'result') activity.distractors.forEach((d) => used.add(d.example));
  }
  return used;
}

function resultOf(id: string): VerifiedResult | undefined {
  return VERIFIED.results[id];
}

// Secciones completas y ampliaciones (la Sección 1 suma «Funciones de una fila»): las
// escenas y las misiones solo se exigen a las secciones completas.
describe.each(
  [...CURRICULA, ...EXTENSIONS].map(
    (curriculum) =>
      [`${curriculum.section}${'kind' in curriculum ? ' (ampliación)' : ''}`, curriculum] as const,
  ),
)('Currículo %s', (_section, unit: CurriculumUnit) => {
  const curriculum = unit as SectionCurriculum;
  const full = 'missions' in unit;
  const lessonIds = new Set(curriculum.lessons.map(({ id }) => id));
  const exampleIds = new Set(curriculum.examples.map(({ id }) => id));

  it('identificadores y rutas únicos', () => {
    expect(duplicates(curriculum.lessons.map(({ id }) => id))).toEqual([]);
    expect(duplicates(curriculum.lessons.map(({ slug }) => slug))).toEqual([]);
    expect(duplicates(curriculum.blocks.map(({ id }) => id))).toEqual([]);
    expect(duplicates(curriculum.concepts.map(({ id }) => id))).toEqual([]);
    if (full) {
      expect(duplicates(curriculum.scenes.map(({ id }) => id))).toEqual([]);
      expect(duplicates(curriculum.missions.map(({ id }) => id))).toEqual([]);
    }
    expect(duplicates(sectionActivities(curriculum).map(({ id }) => id))).toEqual([]);
    for (const lesson of curriculum.lessons) {
      expect(lesson.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('cada bloque tiene lecciones y cada lección un bloque, conceptos y tema válidos', () => {
    const blocks = new Set(curriculum.blocks.map(({ id }) => id));
    const concepts = new Set(curriculum.concepts.map(({ id }) => id));
    const topics = new Set(ASSESSMENT_TOPICS[curriculum.section].map(({ key }) => key));
    for (const block of curriculum.blocks) {
      expect(
        curriculum.lessons.some((lesson) => lesson.block === block.id),
        block.id,
      ).toBe(true);
    }
    for (const lesson of curriculum.lessons) {
      expect(blocks.has(lesson.block), `${lesson.id}: bloque`).toBe(true);
      expect(lesson.concepts.length, `${lesson.id}: conceptos`).toBeGreaterThan(0);
      for (const concept of lesson.concepts) {
        expect(concepts.has(concept), `${lesson.id}: concepto ${concept}`).toBe(true);
      }
      expect(topics.has(lesson.topic), `${lesson.id}: tema ${lesson.topic}`).toBe(true);
      expect(lesson.explanation.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.changed.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.mistakes.length, `${lesson.id}: errores frecuentes`).toBeGreaterThan(0);
      expect(lesson.keyIdea.trim(), lesson.id).not.toBe('');
    }
  });

  it('los ejemplos de lecciones, visualizaciones y conceptos existen', () => {
    for (const lesson of curriculum.lessons) {
      for (const entry of lessonExamples(lesson)) {
        expect(exampleIds.has(entry.example), `${lesson.id}: ${entry.example}`).toBe(true);
        const visual = entry.visual;
        if (visual?.kind === 'compare')
          expect(exampleIds.has(visual.other), visual.other).toBe(true);
        if (visual?.kind === 'pipeline') {
          for (const stage of visual.stages) expect(exampleIds.has(stage.example)).toBe(true);
        }
        if (visual?.kind === 'join') {
          const example = exampleById(entry.example) as QueryExample;
          expect(example.kind, entry.example).toBe('query');
          expect(empresaTable(visual.left)?.columns.some((c) => c.name === visual.leftKey)).toBe(
            true,
          );
          expect(empresaTable(visual.right)?.columns.some((c) => c.name === visual.rightKey)).toBe(
            true,
          );
          const shown = example.sources.map(({ table }) => table);
          expect(shown, `${entry.example}: tablas del JOIN visibles`).toContain(visual.left);
          expect(shown).toContain(visual.right);
        }
        if (visual?.kind === 'cursor') {
          // El cursor recorre exactamente las filas de una consulta verificada.
          expect(exampleById(visual.query)?.kind, `${entry.example}: ${visual.query}`).toBe(
            'query',
          );
          expect(exampleById(entry.example)?.kind).toBe('plsql');
        }
        if (visual?.kind === 'group') {
          const example = exampleById(entry.example) as QueryExample;
          const source = example.sources.find(({ table }) => table === visual.table);
          expect(source, `${entry.example}: tabla agrupada visible`).toBeDefined();
          for (const column of visual.by) expect(source!.columns).toContain(column);
        }
      }
    }
    for (const concept of curriculum.concepts) {
      expect(exampleIds.has(concept.example), `${concept.id}: ${concept.example}`).toBe(true);
      expect(concept.definition.split(/\s+/).length, concept.id).toBeLessThanOrEqual(30);
      expect(concept.reference.url).toMatch(/^https:\/\/docs\.oracle\.com\//);
    }
  });

  it('cada ejemplo se usa y no hay ejemplos huérfanos', () => {
    const used = examplesUsedBy(curriculum);
    const orphans = curriculum.examples.map(({ id }) => id).filter((id) => !used.has(id));
    expect(orphans, orphans.join(', ')).toEqual([]);
  });

  it.runIf(full)('las escenas remiten a lecciones, bloques y ejemplos existentes', () => {
    const blocks = new Set(curriculum.blocks.map(({ id }) => id));
    expect(curriculum.scenes.length).toBeGreaterThanOrEqual(20);
    for (const scene of curriculum.scenes) {
      expect(blocks.has(scene.block), `${scene.id}: bloque`).toBe(true);
      if (scene.kind === 'lesson') {
        const lesson = lessonById(scene.lesson ?? '');
        expect(lesson, `${scene.id}: lección`).toBeDefined();
        if (scene.example) {
          const own = lessonExamples(lesson!).map(({ example }) => example);
          expect(own, `${scene.id}: ejemplo de su lección`).toContain(scene.example);
        }
      }
      if (scene.lesson) expect(lessonIds.has(scene.lesson), scene.id).toBe(true);
      if (scene.kind === 'check') expect(scene.activity, scene.id).toBeDefined();
      expect(scene.notes.explain.trim(), scene.id).not.toBe('');
    }
    expect(curriculum.scenes[0]?.kind).toBe('cover');
    expect(curriculum.scenes.at(-1)?.kind).toBe('closing');
  });

  it.runIf(full)('diez misiones con pasos válidos', () => {
    expect(curriculum.missions).toHaveLength(10);
    for (const mission of curriculum.missions) {
      expect(mission.steps.length, mission.id).toBeGreaterThanOrEqual(1);
      expect(mission.steps.length, mission.id).toBeLessThanOrEqual(3);
    }
  });

  it.each(sectionActivities(curriculum).map((activity) => [activity.id, activity] as const))(
    'actividad %s bien formada',
    (_id, activity: Activity) => {
      expect(lessonIds.has(activity.lesson), `${activity.id}: lección ${activity.lesson}`).toBe(
        true,
      );
      expect(activity.prompt.trim()).not.toBe('');
      expect(activity.hints[0].trim()).not.toBe('');
      expect(activity.hints[1].trim()).not.toBe('');
      expect(activity.explanation.trim()).not.toBe('');
      if (activity.context?.example) {
        expect(exampleIds.has(activity.context.example), activity.context.example).toBe(true);
      }
      if (activity.kind === 'choice' || activity.kind === 'multi') {
        const correct = activity.options.filter((option) => option.correct).length;
        expect(activity.options.length).toBeGreaterThanOrEqual(3);
        if (activity.kind === 'choice') expect(correct, 'una sola correcta').toBe(1);
        else expect(correct, 'al menos dos correctas').toBeGreaterThanOrEqual(2);
        expect(activity.options.length - correct, 'al menos una incorrecta').toBeGreaterThan(0);
        expect(duplicates(activity.options.map(({ text }) => text))).toEqual([]);
        for (const option of activity.options) expect(option.feedback.trim()).not.toBe('');
      }
      if (activity.kind === 'order') {
        expect(activity.pieces.length).toBeGreaterThanOrEqual(3);
        expect(duplicates([...activity.pieces])).toEqual([]);
      }
      if (
        activity.kind === 'count' &&
        exampleById(activity.context?.example ?? '')?.kind === 'plsql'
      ) {
        const result = resultOf(activity.context!.example!);
        expect(result?.kind, `${activity.id}: salida verificada`).toBe('plsql');
      } else if (activity.kind === 'count' || activity.kind === 'result') {
        const id = activity.context?.example ?? '';
        const result = resultOf(id);
        expect(result?.kind, `${activity.id}: resultado verificado de ${id}`).toBe('query');
        if (activity.kind === 'count' && activity.measure === 'value') {
          const value = result?.kind === 'query' ? result.table.rows[0]?.[0] : undefined;
          expect(typeof value, `${activity.id}: primera celda numérica`).toBe('number');
        }
      }
      if (activity.kind === 'result') {
        const correct = JSON.stringify(resultOf(activity.context?.example ?? ''));
        const seen = new Set([correct.replace(/"hash":"\w+",/, '')]);
        expect(activity.distractors.length).toBeGreaterThan(0);
        for (const distractor of activity.distractors) {
          const result = resultOf(distractor.example);
          expect(result?.kind, distractor.example).toBe('query');
          const key = JSON.stringify(result).replace(/"hash":"\w+",/, '');
          expect(seen.has(key), `${distractor.example} debe dar un resultado distinto`).toBe(false);
          seen.add(key);
        }
      }
    },
  );
});

describe('Ejemplos del currículo', () => {
  it('identificadores únicos en todas las secciones', () => {
    expect(duplicates(ALL_EXAMPLES.map(({ id }) => id))).toEqual([]);
  });

  it.each(ALL_EXAMPLES.map((example) => [example.id, example] as const))(
    '%s está verificado en Oracle con su código actual',
    (_id, example: CurriculumExample) => {
      const result = VERIFIED.results[example.id];
      expect(result, `${example.id}: sin resultado de Oracle`).toBeDefined();
      expect(result!.hash, `${example.id}: el código cambió; volver a verificar en Oracle`).toBe(
        exampleHash(example),
      );
      if (example.kind === 'query') {
        const tables = referencedTables(example.sql);
        const shown = example.sources.map(({ table }) => table);
        for (const table of tables) {
          expect(shown, `${example.id}: ${table} debe mostrarse como tabla de origen`).toContain(
            table,
          );
        }
        for (const view of example.sources) {
          const columns = tableColumns(example.dataset, view.table);
          expect(columns, `${example.id}: tabla ${view.table}`).toBeDefined();
          for (const column of view.columns) expect(columns).toContain(column);
        }
        if (example.expectError) expect(result!.kind).toBe('query-error');
        else expect(result!.kind).toBe('query');
        if (result!.kind === 'query' && result!.table.rows.length > 1 && !example.unordered) {
          expect(example.sql, `${example.id}: varias filas sin ORDER BY`).toMatch(/ORDER BY/i);
        }
      }
    },
  );

  it('no quedan resultados de ejemplos que ya no existen', () => {
    const ids = new Set(ALL_EXAMPLES.map(({ id }) => id));
    expect(Object.keys(VERIFIED.results).filter((id) => !ids.has(id))).toEqual([]);
  });
});
