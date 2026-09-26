import { describe, expect, it } from 'vitest';
import { analyzeLabQuery } from '@/features/laboratory/application/lab-api';
import {
  checkView,
  LESSON_VERSIONS,
  LESSONS,
  lessonLabHref,
  lessonNeighbors,
  lessonView,
  STUDY_BLOCKS,
  STUDY_DATASET,
  STUDY_RELEASE_ID,
} from '@/features/study/application/study-api';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import {
  currentCompletedCount,
  emptyStudyProgress,
  parseStudyProgress,
  updatedLessons,
  withCompletedLesson,
  withVisitedLesson,
  type StudyProgressState,
} from '@/features/study/application/progress';
import { LESSON_OUTLINE } from '@/features/study/domain/lesson-outline';

const bySlug = (slug: string) => LESSONS.find((lesson) => lesson.slug === slug)!;
const valid = (sql: string) => analyzeLabQuery(sql).status === 'valid';

describe('contenido del Modo Estudio', () => {
  it('publica 22 lecciones L00–L21 en 8 bloques, con rutas únicas', () => {
    expect(LESSONS.map(({ id }) => id)).toEqual(
      Array.from({ length: 22 }, (_, index) => `L${String(index).padStart(2, '0')}`),
    );
    expect(new Set(LESSONS.map(({ slug }) => slug)).size).toBe(22);
    expect(STUDY_BLOCKS.map(({ letter }) => letter)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
    ]);
    for (const block of STUDY_BLOCKS) {
      expect(
        LESSONS.some((lesson) => lesson.block === block.id),
        block.id,
      ).toBe(true);
    }
    expect(LESSONS.map(({ id, slug, title }) => ({ id, slug, title }))).toEqual(
      LESSON_OUTLINE.map(({ id, slug, title }) => ({ id, slug, title })),
    );
    expect(LESSON_INDEX.map(({ slug }) => slug)).toEqual(LESSONS.map(({ slug }) => slug));
  });

  it('conserva las rutas de la versión anterior', () => {
    for (const slug of [
      'introduccion',
      'select',
      'from',
      'asterisco',
      'columnas',
      'expresiones',
      'alias',
      'distinct',
      'consulta-completa',
    ]) {
      expect(bySlug(slug), slug).toBeDefined();
    }
  });

  it('cubre todos los temas actuales de la unidad', () => {
    const slugs = LESSONS.map(({ slug }) => slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        'select',
        'from',
        'asterisco',
        'columnas',
        'expresiones',
        'precedencia',
        'alias',
        'concatenacion',
        'distinct',
        'where',
        'comparaciones',
        'and-or',
        'parentesis',
        'between',
        'in',
        'like',
        'null',
        'order-by',
        'consulta-completa',
        'errores-frecuentes',
      ]),
    );
  });

  it('cada lección tiene las doce partes de la plantilla', () => {
    for (const lesson of LESSONS) {
      const { content } = lesson;
      expect(content.oneLiner.length, lesson.slug).toBeGreaterThan(20);
      expect(content.oneLiner.length, lesson.slug).toBeLessThan(140);
      expect(content.whatItDoes.length, lesson.slug).toBeGreaterThan(60);
      expect(content.purpose.length, lesson.slug).toBeGreaterThan(30);
      expect(content.syntax.length, lesson.slug).toBeGreaterThan(3);
      expect(content.syntaxReading.length, lesson.slug).toBeGreaterThan(10);
      expect(content.example.question, lesson.slug).toMatch(/\S/);
      expect(content.example.reading, lesson.slug).toMatch(/\S/);
      expect(content.changed.length, lesson.slug).toBeGreaterThan(0);
      expect(content.unchanged.length, lesson.slug).toBeGreaterThan(0);
      expect(content.error.title, lesson.slug).toMatch(/\S/);
      expect(content.error.why.length, lesson.slug).toBeGreaterThan(20);
      expect(content.check.hints, lesson.slug).toHaveLength(2);
    }
  });

  it('todos los ejemplos, comparaciones, pasos y correcciones son SQL válido del motor', () => {
    for (const lesson of LESSONS) {
      const { content } = lesson;
      expect(valid(content.example.sql), `${lesson.slug}: ejemplo`).toBe(true);
      for (const comparison of content.comparisons ?? []) {
        expect(valid(comparison.sql), `${lesson.slug}: ${comparison.label}`).toBe(true);
      }
      for (const step of content.steps ?? []) {
        expect(valid(step.sql), `${lesson.slug}: ${step.label}`).toBe(true);
      }
      for (const item of [content.error, ...(content.catalog ?? [])]) {
        if (item.right) expect(valid(item.right), `${lesson.slug}: ${item.title}`).toBe(true);
      }
    }
  });

  it('cada error de ejemplo produce un diagnóstico o un resultado distinto del correcto', () => {
    for (const lesson of LESSONS) {
      for (const item of [lesson.content.error, ...(lesson.content.catalog ?? [])]) {
        if (!item.wrong) continue;
        const wrong = analyzeLabQuery(item.wrong);
        const right = item.right ? analyzeLabQuery(item.right) : null;
        const differs =
          JSON.stringify(wrong.preview?.rows) !== JSON.stringify(right?.preview?.rows) ||
          JSON.stringify(wrong.preview?.columns) !== JSON.stringify(right?.preview?.columns);
        expect(wrong.diagnostics.length > 0 || differs, `${lesson.slug}: ${item.title}`).toBe(true);
      }
    }
  });

  it('las columnas de origen elegidas existen en EMPLEADOS', () => {
    const columns = STUDY_DATASET.columns.map(({ name }) => name as string);
    for (const lesson of LESSONS) {
      for (const column of lesson.content.sourceColumns ?? []) {
        expect(columns, lesson.slug).toContain(column);
      }
    }
  });

  it('las vistas calculan tabla de origen y resultado con el motor', () => {
    const where = lessonView(bySlug('where'));
    // Muestra de 10 filas de las 20: las 5 que cumplen y 5 que no, rotulada con el total.
    expect(where.example.source.rowStates).toHaveLength(10);
    expect(where.example.source.totalRows).toBe(20);
    expect(where.example.source.rowStates?.filter((state) => state === 'kept')).toHaveLength(5);
    expect(where.example.result?.rows).toHaveLength(5);
    // La lección de EMPLEADOS muestra la tabla completa.
    expect(lessonView(bySlug('empleados')).example.source.rows).toHaveLength(20);
    const distinct = lessonView(bySlug('distinct'));
    expect(distinct.example.beforeDistinct?.duplicateRows).toHaveLength(15);
    expect(distinct.example.result?.rows).toHaveLength(5);
    const like = lessonView(bySlug('like'));
    expect(like.example.source.cellMarks?.flat().some((mark) => mark?.kind === 'like')).toBe(true);
    const order = lessonView(bySlug('order-by'));
    expect(order.example.result?.sortedBy).toEqual([{ column: 2, direction: 'DESC' }]);
    const integrated = lessonView(bySlug('consulta-completa'));
    expect(integrated.steps.map((step) => step.explained.counts.result)).toEqual([
      20, 20, 17, 6, 3, 3,
    ]);
  });

  it('las mini comprobaciones calculan su respuesta con el motor', () => {
    expect(checkView(bySlug('asterisco').content.check)).toMatchObject({ answer: 12 });
    expect(checkView(bySlug('distinct').content.check)).toMatchObject({ answer: 5 });
    expect(checkView(bySlug('where').content.check)).toMatchObject({ answer: 3 });
    expect(checkView(bySlug('and-or').content.check)).toMatchObject({ answer: 4 });
    expect(checkView(bySlug('between').content.check)).toMatchObject({ answer: 4 });
    expect(checkView(bySlug('expresiones').content.check)).toMatchObject({ answer: 36000000 });
    for (const lesson of LESSONS) {
      const view = checkView(lesson.content.check);
      if (view.kind === 'choice') {
        expect(
          view.options.filter((option) => option.correct),
          lesson.slug,
        ).toHaveLength(1);
      }
      if (view.kind === 'order') {
        expect(view.shuffled.join('|'), lesson.slug).not.toBe(view.answer.join('|'));
        expect([...view.shuffled].sort(), lesson.slug).toEqual([...view.answer].sort());
      }
    }
  });

  it('enlaza lecciones vecinas y el laboratorio con la consulta y el retorno', () => {
    expect(lessonNeighbors('introduccion').previous).toBeNull();
    expect(lessonNeighbors('introduccion').next?.slug).toBe('empleados');
    expect(lessonNeighbors('errores-frecuentes').next).toBeNull();
    const url = new URL(lessonLabHref('SELECT *\nFROM empleados;', '/learn/asterisco'), 'http://x');
    expect(url.pathname).toBe('/lab');
    expect(url.searchParams.get('sql')).toBe('SELECT *\nFROM empleados;');
    expect(url.searchParams.get('returnTo')).toBe('/learn/asterisco');
  });
});

describe('reglas de progreso del Modo Estudio', () => {
  it('usa una versión nueva del recorrido: el progreso de nueve lecciones se descarta', () => {
    expect(STUDY_RELEASE_ID).toBe('select-study-v2');
    expect(
      parseStudyProgress({ releaseId: 'select-study-v1', version: 1 }, STUDY_RELEASE_ID).status,
    ).toBe('other-release');
  });

  it('valida el dato guardado y descarta lecciones o versiones inventadas', () => {
    const parsed = parseStudyProgress(
      {
        releaseId: STUDY_RELEASE_ID,
        version: 1,
        completed: ['L01', 'L99', 7, 'L01', 'L21'],
        lessonVersions: { L01: 1, L99: 1, L02: 'x' },
        lastLesson: 'LXX',
        updatedAt: 5,
      },
      STUDY_RELEASE_ID,
    );
    expect(parsed).toEqual({
      status: 'valid',
      progress: {
        releaseId: STUDY_RELEASE_ID,
        version: 1,
        completed: ['L01', 'L21'],
        lessonVersions: { L01: 1 },
        lastLesson: null,
        updatedAt: 5,
      },
    });
    expect(parseStudyProgress('texto', STUDY_RELEASE_ID).status).toBe('other-release');
  });

  it('visitar recuerda la última lección sin completarla', () => {
    const start = emptyStudyProgress(STUDY_RELEASE_ID, 0);
    const visited = withVisitedLesson(start, 'L15', 10);
    expect(visited.lastLesson).toBe('L15');
    expect(visited.completed).toEqual([]);
    expect(withVisitedLesson(visited, 'L15', 20)).toBe(visited);
  });

  it('completar guarda la versión y no duplica la lección', () => {
    const once = withCompletedLesson(emptyStudyProgress(STUDY_RELEASE_ID, 0), 'L02', 1, 1);
    const twice = withCompletedLesson(once, 'L02', 1, 2);
    expect(twice.completed).toEqual(['L02']);
    expect(twice.lessonVersions).toEqual({ L02: 1 });
    expect(currentCompletedCount(twice, LESSON_VERSIONS)).toBe(1);
  });

  it('una lección completada con otra versión pide repaso y no cuenta en el avance', () => {
    const old = withCompletedLesson(emptyStudyProgress(STUDY_RELEASE_ID, 0), 'L03', 0, 1);
    expect(updatedLessons(old, LESSON_VERSIONS)).toEqual(['L03']);
    expect(currentCompletedCount(old, LESSON_VERSIONS)).toBe(0);
  });

  it('informa almacenamiento no disponible o ilegible sin lanzar errores', async () => {
    const blocked = new BrowserStudyProgressRepository(() => null);
    expect(await blocked.load()).toEqual({ status: 'unavailable' });
    expect(await blocked.save(emptyStudyProgress(STUDY_RELEASE_ID, 0))).toBe(false);
    const broken = new BrowserStudyProgressRepository(() => ({
      getItem: () => '{no es json',
      setItem: () => {
        throw new Error('cuota');
      },
      removeItem: () => {},
    }));
    expect(await broken.load()).toEqual({ status: 'unreadable' });
    expect(await broken.save(emptyStudyProgress(STUDY_RELEASE_ID, 0))).toBe(false);
  });
});

describe('persistencia local de Estudio', () => {
  it('guarda, carga y borra progreso versionado', async () => {
    const data = new Map<string, string>();
    const repository = new BrowserStudyProgressRepository(() => ({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => void data.delete(key),
    }));
    const progress: StudyProgressState = {
      releaseId: STUDY_RELEASE_ID,
      version: 1,
      completed: ['L00'],
      lessonVersions: { L00: 1 },
      lastLesson: 'L00',
      updatedAt: 1,
    };
    expect(await repository.save(progress)).toBe(true);
    expect(await repository.load()).toEqual({ status: 'found', data: progress });
    expect(await repository.clear()).toBe(true);
    expect(await repository.load()).toEqual({ status: 'empty' });
  });
});
