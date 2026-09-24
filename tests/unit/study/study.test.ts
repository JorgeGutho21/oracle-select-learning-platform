import { describe, expect, it } from 'vitest';
import { checkCompleteQuery, LESSONS, STUDY_DATASET } from '@/features/study/application/study-api';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';
import type { StudyProgressState } from '@/features/study/application/progress';

describe('catálogo de Estudio', () => {
  it('publica L00–L08 con slugs únicos y ejemplos derivados del dataset', () => {
    expect(LESSONS.map(({ id }) => id)).toEqual(['L00', 'L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08']);
    expect(new Set(LESSONS.map(({ slug }) => slug)).size).toBe(9);
    expect(LESSONS.every(({ analysis }) => analysis.status === 'valid')).toBe(true);
    expect(STUDY_DATASET.rows).toHaveLength(6);
  });

  it('conserva los contrastes verificables de precedencia y DISTINCT', () => {
    const expressions = LESSONS.find(({ id }) => id === 'L05')!;
    expect(expressions.visualExamples.map((example) => example.analysis.preview?.rows[0]?.[0])).toEqual([4200000, 37200000]);
    const distinct = LESSONS.find(({ id }) => id === 'L07')!;
    expect(distinct.visualExamples.map((example) => example.analysis.preview?.rows.length)).toEqual([3, 5]);
  });

  it('corrige L08 por estructura y multiconjunto, aceptando una expresión equivalente', () => {
    expect(checkCompleteQuery('SELECT nombre, ciudad, 12 * salario AS salario_anual FROM empleados').correct).toBe(true);
    expect(checkCompleteQuery('SELECT ciudad, nombre, salario * 12 AS salario_anual FROM empleados').correct).toBe(false);
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
    const progress: StudyProgressState = { releaseId: 'select-study-v1', version: 1, completed: ['L00'], lessonVersions: { L00: 1 }, lastLesson: 'L00', updatedAt: 1 };
    expect(await repository.save(progress)).toBe(true);
    expect(await repository.load()).toEqual({ status: 'found', data: progress });
    expect(await repository.clear()).toBe(true);
    expect(await repository.load()).toEqual({ status: 'empty' });
  });
});
