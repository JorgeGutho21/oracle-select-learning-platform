import { describe, expect, it } from 'vitest';
import {
  checkCompleteQuery,
  LESSON_VERSIONS,
  LESSONS,
  lessonLabHref,
  STUDY_DATASET,
  STUDY_RELEASE_ID,
} from '@/features/study/application/study-api';
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

describe('contenido del Modo Estudio', () => {
  it('sigue la ruta acordada y comparte títulos con el esquema central', () => {
    expect(LESSONS.map(({ shortTitle }) => shortTitle)).toEqual([
      '¿Qué es SQL?',
      'SELECT',
      'FROM',
      'SELECT *',
      'Columnas específicas',
      'Expresiones y cálculos',
      'Alias AS',
      'DISTINCT',
      'Consulta completa',
    ]);
    expect(LESSONS.map(({ id, slug, title }) => ({ id, slug, title }))).toEqual(
      LESSON_OUTLINE.map(({ id, slug, title }) => ({ id, slug, title })),
    );
  });

  it('cada lección tiene explicación, sintaxis, ejemplo, pasos visuales, error y actividad', () => {
    const columns = STUDY_DATASET.columns.map(({ name }) => name as string);
    for (const lesson of LESSONS) {
      expect(lesson.explanation.length, lesson.id).toBeGreaterThan(40);
      expect(lesson.syntax, lesson.id).toMatch(/SELECT[\s\S]*FROM/);
      expect(lesson.translation.length, lesson.id).toBeGreaterThan(10);
      expect(lesson.frequentError.length, lesson.id).toBeGreaterThan(10);
      expect(lesson.steps.length, lesson.id).toBeGreaterThanOrEqual(2);
      for (const step of lesson.steps) {
        if (step.kind === 'result') expect(step.analysis.status, step.sql).toBe('valid');
        else for (const column of step.columns) expect(columns).toContain(column);
      }
    }
  });

  it('incluye los cuatro ejemplos visuales obligatorios con su resultado real', () => {
    const byId = (id: string) => LESSONS.find((lesson) => lesson.id === id)!;
    const compact = (sql: string) => sql.replace(/\s+/g, ' ').trim();
    expect(compact(byId('L01').sql)).toBe('SELECT nombre, salario FROM empleados;');
    expect(compact(byId('L03').sql)).toBe('SELECT * FROM empleados;');
    expect(compact(byId('L06').sql)).toBe(
      'SELECT nombre, salario * 12 AS salario_anual FROM empleados;',
    );
    expect(compact(byId('L07').sql)).toBe('SELECT DISTINCT ciudad FROM empleados;');
    expect(byId('L01').analysis.preview?.columns.map(({ name }) => name)).toEqual([
      'NOMBRE',
      'SALARIO',
    ]);
    expect(byId('L03').analysis.preview?.columns).toHaveLength(6);
    expect(byId('L06').analysis.preview?.rows[0]).toEqual(['Ana', 36000000]);
    expect(byId('L07').analysis.preview?.rows).toHaveLength(3);
  });

  it('marca las filas repetidas antes de DISTINCT a partir del resultado del motor', () => {
    const [before, after] = LESSONS.find(({ id }) => id === 'L07')!.steps;
    expect(before?.kind === 'result' ? before.duplicateRows : null).toEqual([2, 4, 5]);
    expect(after?.kind === 'result' ? after.analysis.preview?.rows : null).toHaveLength(3);
  });

  it('genera enlaces al laboratorio con la consulta y el retorno codificados', () => {
    const url = new URL(lessonLabHref('SELECT *\nFROM empleados;', '/learn/asterisco'), 'http://x');
    expect(url.pathname).toBe('/lab');
    expect(url.searchParams.get('sql')).toBe('SELECT *\nFROM empleados;');
    expect(url.searchParams.get('returnTo')).toBe('/learn/asterisco');
  });
});

describe('reglas de progreso del Modo Estudio', () => {
  it('valida el dato guardado y descarta lecciones o versiones inventadas', () => {
    const parsed = parseStudyProgress(
      {
        releaseId: STUDY_RELEASE_ID,
        version: 1,
        completed: ['L01', 'L99', 7, 'L01'],
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
        completed: ['L01'],
        lessonVersions: { L01: 1 },
        lastLesson: null,
        updatedAt: 5,
      },
    });
    expect(parseStudyProgress({ releaseId: 'otra', version: 1 }, STUDY_RELEASE_ID)).toEqual({
      status: 'other-release',
    });
    expect(parseStudyProgress('texto', STUDY_RELEASE_ID).status).toBe('other-release');
  });

  it('visitar recuerda la última lección sin completarla', () => {
    const start = emptyStudyProgress(STUDY_RELEASE_ID, 0);
    const visited = withVisitedLesson(start, 'L05', 10);
    expect(visited.lastLesson).toBe('L05');
    expect(visited.completed).toEqual([]);
    expect(withVisitedLesson(visited, 'L05', 20)).toBe(visited);
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

describe('catálogo de Estudio', () => {
  it('publica L00–L08 con slugs únicos y ejemplos derivados del dataset', () => {
    expect(LESSONS.map(({ id }) => id)).toEqual([
      'L00',
      'L01',
      'L02',
      'L03',
      'L04',
      'L05',
      'L06',
      'L07',
      'L08',
    ]);
    expect(new Set(LESSONS.map(({ slug }) => slug)).size).toBe(9);
    expect(LESSONS.every(({ analysis }) => analysis.status === 'valid')).toBe(true);
    expect(STUDY_DATASET.rows).toHaveLength(6);
  });

  it('conserva los contrastes verificables de precedencia y DISTINCT', () => {
    const expressions = LESSONS.find(({ id }) => id === 'L05')!;
    expect(
      expressions.visualExamples.map((example) => example.analysis.preview?.rows[0]?.[0]),
    ).toEqual([4200000, 37200000]);
    const distinct = LESSONS.find(({ id }) => id === 'L07')!;
    expect(distinct.visualExamples.map((example) => example.analysis.preview?.rows.length)).toEqual(
      [3, 5],
    );
  });

  it('corrige L08 por estructura y multiconjunto, aceptando una expresión equivalente', () => {
    expect(
      checkCompleteQuery('SELECT nombre, ciudad, 12 * salario AS salario_anual FROM empleados')
        .correct,
    ).toBe(true);
    expect(
      checkCompleteQuery('SELECT ciudad, nombre, salario * 12 AS salario_anual FROM empleados')
        .correct,
    ).toBe(false);
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
      releaseId: 'select-study-v1',
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
