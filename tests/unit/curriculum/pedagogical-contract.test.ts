import { describe, expect, it } from 'vitest';
import { CURRICULA, exampleById, lessonExamples } from '@/features/curriculum/domain/registry';
import { pedagogicalTopic } from '@/features/curriculum/domain/pedagogy';
import { constructsIn } from '@/features/curriculum/domain/construct-map';
import { VERIFIED } from '@/features/curriculum/application/verified-results';
import { explainOracleError } from '@/features/curriculum/domain/oracle-errors';
import { correctExampleId, ERROR_LESSONS } from '@/features/curriculum/domain/error-lessons';
import { ALL_EXAMPLES } from '@/features/curriculum/domain/registry';
import { EMPRESA_TABLES } from '@/domain/dataset/empresa';
import type {
  Activity,
  CurriculumExample,
  CurriculumLesson,
  SectionCurriculum,
} from '@/features/curriculum/domain/types';
import { searchPublicCatalog } from '@/features/search/application/search-index';
import { ROUTE_VISUAL_PROFILE, visualKind } from '@/presentation/layouts/route-visual-profile';

/**
 * Gates de aceptación de la reestructuración pedagógica de S2 y S3
 * (docs/S2_S3_PEDAGOGICAL_RESTRUCTURE.md). Cada tema cumple el contrato derivado de la
 * Sección 1 y la ruta respeta los prerrequisitos.
 */

const [S2, S3] = CURRICULA as readonly [SectionCurriculum, SectionCurriculum];
const sectionKey = (curriculum: SectionCurriculum) => (curriculum === S2 ? 'S2' : 'S3');

/** Piezas de código de un ejemplo, cada una por separado (preparación, bloque y consultas). */
function exampleParts(example: CurriculumExample): readonly string[] {
  return example.kind === 'query'
    ? [example.sql]
    : [...(example.setup ?? []), example.code, ...(example.before ?? []), ...(example.after ?? [])];
}

const exampleCode = (example: CurriculumExample) => exampleParts(example).join('\n');

function tablesIn(example: CurriculumExample): readonly string[] {
  const code = exampleCode(example);
  const named = EMPRESA_TABLES.filter((table) =>
    new RegExp(`\\b${table.name}\\b`, 'i').test(code),
  ).map((table) => table.name);
  return example.kind === 'query' && example.dataset === 'empresa-v1'
    ? [...new Set([...named, ...example.sources.map((source) => source.table)])]
    : named;
}

function activityParts(activity: Activity): readonly string[] {
  const example = activity.context?.example ? exampleById(activity.context.example) : undefined;
  return [...(example ? exampleParts(example) : []), activity.context?.code ?? ''];
}

/** Construcciones usadas antes de su lección y no marcadas como avance en la lección. */
function unmetConstructs(
  curriculum: SectionCurriculum,
  lesson: CurriculumLesson,
  pieces: readonly string[],
): readonly string[] {
  const position = curriculum.lessons.indexOf(lesson);
  const previews = (lesson.plan?.previews ?? []).map(({ term }) => term.toLowerCase());
  const used = new Map(
    pieces
      .flatMap((piece) => constructsIn(sectionKey(curriculum), piece))
      .map((item) => [item.id, item]),
  );
  return [...used.values()]
    .filter((construct) => {
      const taught =
        construct.lesson !== null &&
        curriculum.lessons.findIndex((entry) => entry.id === construct.lesson) <= position;
      const marked = previews.some(
        (term) =>
          term.includes(construct.term.toLowerCase()) ||
          construct.term.toLowerCase().includes(term),
      );
      return !taught && !marked;
    })
    .map((construct) => construct.term);
}

describe.each(CURRICULA)('Contrato pedagógico de cada tema: $section', (curriculum) => {
  it('el 100 % de los temas tiene problema, definición, propósito y prerrequisitos anteriores', () => {
    for (const [index, lesson] of curriculum.lessons.entries()) {
      const topic = pedagogicalTopic(lesson, curriculum.lessons, curriculum.concepts);
      expect(topic.problem.trim().length, `${lesson.id}: problema`).toBeGreaterThan(30);
      expect(topic.definitions.length, `${lesson.id}: definición`).toBeGreaterThan(0);
      for (const concept of topic.definitions)
        expect(concept.definition.trim().length, concept.id).toBeGreaterThan(15);
      expect(topic.purpose.trim().length, `${lesson.id}: propósito`).toBeGreaterThan(15);
      expect(
        topic.prerequisites.length > 0 || topic.prior !== null,
        `${lesson.id}: prerrequisitos`,
      ).toBe(true);
      for (const previous of topic.prerequisites)
        expect(curriculum.lessons.indexOf(previous), `${lesson.id} → ${previous.id}`).toBeLessThan(
          index,
        );
      expect(topic.mentalModel.trim().length, `${lesson.id}: modelo`).toBeGreaterThan(20);
    }
  });

  it('cada sintaxis nueva se explica parte por parte y se lee en español', () => {
    for (const lesson of curriculum.lessons) {
      const topic = pedagogicalTopic(lesson, curriculum.lessons, curriculum.concepts);
      expect(topic.parts.length, `${lesson.id}: partes`).toBeGreaterThan(0);
      for (const part of topic.parts)
        expect(part.meaning.trim().length, `${lesson.id}: ${part.code}`).toBeGreaterThan(8);
      expect(topic.reading.trim().length, `${lesson.id}: lectura`).toBeGreaterThan(30);
    }
  });

  it('cada tema tiene microejemplo, ejemplo con el dataset, resultado de Oracle, antes y después, idea clave y comprobación', () => {
    for (const lesson of curriculum.lessons) {
      const topic = pedagogicalTopic(lesson, curriculum.lessons, curriculum.concepts);
      expect(VERIFIED.results[topic.example], `${lesson.id}: resultado del ejemplo`).toBeDefined();
      expect(
        VERIFIED.results[topic.simpleExample],
        `${lesson.id}: microejemplo ejecutado`,
      ).toBeDefined();
      expect(
        lesson.micro?.reading.trim().length,
        `${lesson.id}: lectura del microejemplo`,
      ).toBeGreaterThan(40);
      expect(topic.changed.length, `${lesson.id}: qué cambió`).toBeGreaterThan(0);
      expect(topic.unchanged.length, `${lesson.id}: qué no cambió`).toBeGreaterThan(0);
      expect(topic.keyTakeaway.trim().length, `${lesson.id}: idea clave`).toBeGreaterThan(8);
      expect(lesson.mistakes.length, `${lesson.id}: error frecuente`).toBeGreaterThan(0);
      expect(lesson.check.lesson).toBe(lesson.id);
      expect(lesson.check.explanation.trim()).not.toBe('');
    }
  });

  it('toda tabla se presenta antes de que un ejemplo la use', () => {
    const presented = new Set<string>();
    for (const lesson of curriculum.lessons) {
      for (const table of lesson.plan!.tables) {
        expect(
          EMPRESA_TABLES.some(({ name }) => name === table.table),
          table.table,
        ).toBe(true);
        presented.add(table.table);
      }
      for (const entry of lessonExamples(lesson)) {
        const example = exampleById(entry.example)!;
        for (const table of tablesIn(example))
          expect(
            presented.has(table),
            `${lesson.id}/${example.id} usa ${table} sin presentarla`,
          ).toBe(true);
      }
    }
  });

  it('ningún ejemplo usa una construcción antes de su lección sin marcarla y explicarla', () => {
    for (const lesson of curriculum.lessons) {
      for (const entry of lessonExamples(lesson)) {
        const example = exampleById(entry.example)!;
        expect(
          unmetConstructs(curriculum, lesson, exampleParts(example)),
          `${lesson.id}/${example.id}`,
        ).toEqual([]);
      }
      expect(
        unmetConstructs(curriculum, lesson, [lesson.syntax]),
        `${lesson.id}: sintaxis`,
      ).toEqual([]);
      for (const preview of lesson.plan!.previews ?? [])
        expect(preview.explanation.trim().length, `${lesson.id}: ${preview.term}`).toBeGreaterThan(
          30,
        );
    }
  });

  it('la práctica, el Challenge y las comprobaciones solo piden lo ya enseñado', () => {
    const activities = [
      ...curriculum.practice,
      ...curriculum.missions.flatMap((mission) => mission.steps),
      ...curriculum.lessons.map((lesson) => lesson.check),
    ];
    for (const activity of activities) {
      const lesson = curriculum.lessons.find((entry) => entry.id === activity.lesson)!;
      expect(unmetConstructs(curriculum, lesson, activityParts(activity)), activity.id).toEqual([]);
    }
  });

  it('las escenas presentan cada concepto antes de su primer ejemplo y ninguna está vacía', () => {
    const introduced = new Set<string>();
    for (const scene of curriculum.scenes) {
      expect(scene.notes.explain.trim().length, scene.id).toBeGreaterThan(15);
      if (scene.kind === 'idea') expect(scene.points?.length, scene.id).toBeGreaterThan(0);
      if (scene.code) expect(scene.points?.length, scene.id).toBeGreaterThan(0);
      if (scene.kind === 'tables') expect(scene.tables?.length, scene.id).toBeGreaterThan(0);
      if (scene.intent === 'syntax') expect(scene.parts?.length, scene.id).toBeGreaterThan(0);
      if (scene.intent === 'explanation')
        expect(scene.unchanged?.length, scene.id).toBeGreaterThan(0);
      const lesson = curriculum.lessons.find((entry) => entry.id === scene.lesson);
      if (scene.intent === 'definition' && lesson) {
        for (const id of lesson.concepts) {
          const concept = curriculum.concepts.find((entry) => entry.id === id)!;
          expect(
            scene.points!.some((point) => point.includes(concept.definition)),
            `${scene.id}/${id}`,
          ).toBe(true);
          introduced.add(id);
        }
      }
      if (scene.kind === 'lesson' && lesson)
        for (const id of lesson.concepts)
          expect(introduced.has(id), `${scene.id}: ${id}`).toBe(true);
    }
    expect([...introduced].sort()).toEqual(curriculum.concepts.map((entry) => entry.id).sort());
  });

  it('cada tema de clase sigue el orden problema → datos → sintaxis → ejemplo → cambio → comprobación', () => {
    for (const lesson of curriculum.lessons) {
      const ids = curriculum.scenes
        .filter((scene) => scene.lesson === lesson.id)
        .map((scene) => scene.id);
      const at = (prefix: string) => ids.findIndex((id) => id.startsWith(prefix));
      expect(at('intro-'), lesson.id).toBe(0);
      expect(at('explain-'), lesson.id).toBe(ids.length - 2);
      expect(at('check-'), lesson.id).toBe(ids.length - 1);
      if (lesson.plan!.tier !== 'extension') expect(at('syntax-'), lesson.id).toBeGreaterThan(0);
    }
  });
});

describe('Sección 2: INNER JOIN y agregaciones son el núcleo', () => {
  const core = S2.lessons.filter((lesson) => lesson.plan!.tier === 'core');
  it('el núcleo son exactamente INNER JOIN, joins de varias tablas, funciones de grupo, GROUP BY, HAVING y JOIN + agregaciones', () => {
    expect([...new Set(core.map((lesson) => lesson.block))]).toEqual([
      'inner-join',
      'joins-multiples',
      'funciones-grupo',
      'group-by',
      'having',
      'join-agregacion',
    ]);
  });
  it('subconsultas y operadores de conjuntos son ampliación y van después de todo el núcleo', () => {
    const lastCore = Math.max(...core.map((lesson) => S2.lessons.indexOf(lesson)));
    for (const lesson of S2.lessons.filter((entry) =>
      ['subconsultas', 'conjuntos', 'integracion'].includes(entry.block),
    )) {
      expect(lesson.plan!.tier, lesson.id).toBe('extension');
      expect(S2.lessons.indexOf(lesson), lesson.id).toBeGreaterThan(lastCore);
    }
  });
  it('el puente al JOIN va antes: relaciones, alias de tabla y modelo mental', () => {
    expect(S2.lessons.slice(0, 3).map((lesson) => lesson.block)).toEqual([
      'relaciones',
      'alias',
      'modelo-join',
    ]);
    expect(S2.lessons[0]!.micro?.example).toBe('S2-E-S1-TEXTO');
  });
  it('INNER JOIN define ON antes de WHERE y deja la columna ambigua para el final', () => {
    const order = S2.lessons
      .filter((lesson) => lesson.block === 'inner-join')
      .map((lesson) => lesson.id);
    expect(order).toEqual(['S2-L04', 'S2-L06', 'S2-L05']);
  });
  it('PROYECTOS y ASIGNACIONES se presentan en el JOIN de varias tablas', () => {
    const first = (table: string) =>
      S2.scenes.find(
        (scene) => scene.kind === 'tables' && scene.tables?.some((entry) => entry.table === table),
      )?.lesson;
    expect(first('DEPARTAMENTOS')).toBe('S2-L01');
    expect(first('PROYECTOS')).toBe('S2-L07');
    expect(first('ASIGNACIONES')).toBe('S2-L07');
    expect(first('AUDITORIA_SALARIOS')).toBeUndefined();
  });
});

describe('Sección 3: el orden del profesor', () => {
  it('los temas centrales siguen el orden pedido', () => {
    const firstLesson = (concept: string) =>
      S3.lessons.findIndex((lesson) => lesson.concepts.includes(concept));
    const order = [
      'plsql',
      'anonymous-block',
      'variable',
      'anchored-type',
      'if',
      'for-loop',
      'implicit-cursor',
      'explicit-cursor',
      'function',
      'procedure',
      'package',
      'trigger',
    ].map(firstLesson);
    for (const position of order) expect(position).toBeGreaterThanOrEqual(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it('PL/SQL parte de SQL y el bloque anónimo empieza con BEGIN y END', () => {
    expect(S3.lessons[0]!.micro?.example).toBe('S3-E-SQL-SALARIO');
    expect(S3.lessons[1]!.micro?.example).toBe('S3-E-SOLO-BEGIN');
    expect(S3.lessons[1]!.example.example).toBe('S3-E-DECLARE-SIMPLE');
  });
  it('%ROWTYPE, CASE, LOOP/WHILE y las excepciones aparecen después de su tema base', () => {
    const at = (id: string) => S3.lessons.findIndex((lesson) => lesson.id === id);
    expect(at('S3-L29')).toBeGreaterThan(at('S3-L05'));
    expect(at('S3-L10')).toBeGreaterThan(at('S3-L09'));
    expect(at('S3-L11')).toBeGreaterThan(at('S3-L12'));
    expect(at('S3-L16')).toBeGreaterThan(at('S3-L25'));
    for (const id of [
      'S3-L29',
      'S3-L10',
      'S3-L06',
      'S3-L16',
      'S3-L17',
      'S3-L26',
      'S3-L27',
      'S3-L28',
    ])
      expect(S3.lessons[at(id)]!.plan!.tier, id).toBe('extension');
  });
  it('el trigger se explica por momento, evento, nivel y cuerpo antes de :OLD y :NEW', () => {
    const trigger = S3.lessons.find((lesson) => lesson.id === 'S3-L23')!;
    const meanings = trigger.plan!.parts.map((part) => part.meaning);
    for (const element of ['Momento', 'Evento', 'Nivel', 'Cuerpo'])
      expect(
        meanings.some((meaning) => meaning.startsWith(element)),
        element,
      ).toBe(true);
    const at = (id: string) => S3.lessons.findIndex((lesson) => lesson.id === id);
    expect(at('S3-L23')).toBeLessThan(at('S3-L24'));
    expect(at('S3-L24')).toBeLessThan(at('S3-L25'));
  });
  it('AUDITORIA_SALARIOS aparece con los triggers y se presenta vacía', () => {
    const scene = S3.scenes.find(
      (entry) =>
        entry.kind === 'tables' &&
        entry.tables?.some((table) => table.table === 'AUDITORIA_SALARIOS'),
    );
    expect(scene?.lesson).toBe('S3-L25');
    expect(EMPRESA_TABLES.find((table) => table.name === 'AUDITORIA_SALARIOS')!.rows).toHaveLength(
      0,
    );
  });
});

it('cada ejemplo con error de Oracle tiene explicación humana y corrección', () => {
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

describe.each(CURRICULA)('Error para aprender: $section', (curriculum) => {
  const errors = curriculum.examples.filter((example) => example.expectError);

  it('cada ejemplo con error explica qué ocurrió, por qué, cómo corregirlo y enseña el ejemplo correcto', () => {
    expect(errors.length).toBeGreaterThan(0);
    for (const example of errors) {
      const lesson = ERROR_LESSONS[example.id];
      expect(lesson, `${example.id}: falta la explicación humana`).toBeDefined();
      for (const text of [lesson!.what, lesson!.why, lesson!.fix])
        expect(text.trim().length, example.id).toBeGreaterThan(15);
      // El código técnico es secundario: no encabeza la explicación.
      expect(lesson!.what, example.id).not.toMatch(/(?:ORA|PLS)-\d{5}/);
      expect(lesson!.why, example.id).not.toMatch(/(?:ORA|PLS)-\d{5}/);
      const correct = curriculum.examples.find(
        (entry) => entry.id === correctExampleId(example.id),
      );
      expect(correct, `${example.id}: ejemplo correcto de la misma sección`).toBeDefined();
      expect(correct!.expectError, `${example.id}: el ejemplo correcto no falla`).toBeUndefined();
      const stored = VERIFIED.results[correct!.id];
      expect(stored, `${correct!.id}: verificado en Oracle`).toBeDefined();
      expect(
        stored!.kind === 'query-error' || (stored!.kind === 'plsql' && stored!.error !== null),
        `${correct!.id}: Oracle lo ejecuta sin error`,
      ).toBe(false);
    }
  });

  it('la corrección de un error solo usa lo enseñado en la lección que lo muestra', () => {
    for (const example of errors) {
      const lesson = curriculum.lessons.find((entry) =>
        lessonExamples(entry).some((item) => item.example === example.id),
      );
      if (!lesson) continue;
      const correct = exampleById(correctExampleId(example.id)!)!;
      expect(unmetConstructs(curriculum, lesson, exampleParts(correct)), correct.id).toEqual([]);
    }
  });
});

it('ningún identificador de ejemplo se repite', () => {
  const ids = ALL_EXAMPLES.map((example) => example.id);
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
});

it('cada explicación de error corresponde a un ejemplo que falla de verdad', () => {
  for (const id of Object.keys(ERROR_LESSONS))
    expect(exampleById(id)?.expectError, id).toBeDefined();
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
