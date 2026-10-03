import { describe, expect, it } from 'vitest';
import { MISSION_IDS } from '@/features/challenge/domain/types';
import { SCENE_TOTAL } from '@/features/presentation/domain/scenes';
import {
  isTrackedKey,
  modeCatalog,
  PROGRESS_CATALOG,
  sectionIsTracked,
} from '@/features/progress/application/catalog';
import { progressRecordSchema } from '@/features/progress/application/progress-dto';
import { presenceArea, readProgressRecord } from '@/features/progress/application/progress-wire';
import { learnerProgress } from '@/features/progress/application/summary';
import {
  latestRecord,
  mergeRecord,
  mergeRecords,
  pendingUpload,
  type ProgressRecord,
} from '@/features/progress/domain/progress';
import { LESSON_COUNT, LESSON_INDEX } from '@/features/study/application/lesson-index';

function study(item: string, status: ProgressRecord['status'], at = 0, version: number | null = 1) {
  return {
    section: 'fundamentos-sql',
    mode: 'study',
    item,
    status,
    percent: status === 'completed' ? 100 : 0,
    contentVersion: status === 'completed' ? version : null,
    state: {},
    lastActivityAt: at,
  } satisfies ProgressRecord;
}

describe('Fusión monótona del progreso', () => {
  it('completado nunca vuelve a en curso por una sincronización antigua', () => {
    const merged = mergeRecord(study('L05', 'completed', 10), study('L05', 'in_progress', 99));
    expect(merged.status).toBe('completed');
    expect(merged.percent).toBe(100);
    expect(merged.lastActivityAt).toBe(99);
  });

  it('es conmutativa e idempotente; la posición la decide la actividad más reciente', () => {
    const a = {
      ...study('scenes', 'in_progress', 5),
      mode: 'class',
      percent: 40,
      state: { scene: 12 },
    };
    const b = {
      ...study('scenes', 'in_progress', 9),
      mode: 'class',
      percent: 10,
      state: { scene: 3 },
    };
    expect(mergeRecord(a, b)).toEqual(mergeRecord(b, a));
    expect(mergeRecord(mergeRecord(a, b), b)).toEqual(mergeRecord(a, b));
    expect(mergeRecord(a, b)).toMatchObject({
      percent: 40,
      state: { scene: 3 },
      lastActivityAt: 9,
    });
  });

  it('local = lección 5, nube = lección 4: se conservan las dos', () => {
    const merged = mergeRecords([study('L05', 'completed', 2)], [study('L04', 'completed', 1)]);
    expect(merged.map(({ item }) => item).sort()).toEqual(['L04', 'L05']);
  });

  it('solo sube lo que cambia la nube', () => {
    const cloud = [study('L04', 'completed', 1)];
    const local = [study('L04', 'in_progress', 0), study('L05', 'completed', 3)];
    expect(pendingUpload(local, cloud).map(({ item }) => item)).toEqual(['L05']);
    expect(pendingUpload(cloud, cloud)).toEqual([]);
  });

  it('dónde me quedé: la actividad conocida más reciente', () => {
    expect(latestRecord([study('L01', 'completed', 0), study('L02', 'in_progress', 5)])?.item).toBe(
      'L02',
    );
    expect(latestRecord([study('L01', 'completed', 0)])).toBeNull();
  });
});

describe('Registro canónico y avance', () => {
  it('los totales salen del contenido publicado, sin números escritos a mano', () => {
    expect(modeCatalog('fundamentos-sql', 'study')?.total).toBe(LESSON_COUNT);
    expect(modeCatalog('fundamentos-sql', 'challenge')?.total).toBe(MISSION_IDS.length);
    expect(modeCatalog('fundamentos-sql', 'class')?.total).toBe(SCENE_TOTAL);
    expect(PROGRESS_CATALOG.every(({ section }) => section === 'fundamentos-sql')).toBe(true);
    expect(sectionIsTracked('consultas-relacionales')).toBe(false);
    expect(sectionIsTracked('plsql')).toBe(false);
  });

  it('acepta solo elementos del registro', () => {
    expect(isTrackedKey({ section: 'fundamentos-sql', mode: 'study', item: 'L05' })).toBe(true);
    expect(isTrackedKey({ section: 'fundamentos-sql', mode: 'study', item: 'L99' })).toBe(false);
    expect(isTrackedKey({ section: 'plsql', mode: 'study', item: 'L05' })).toBe(false);
    expect(
      progressRecordSchema.safeParse({ ...study('L05', 'completed'), section: 'otra' }).success,
    ).toBe(false);
  });

  it('calcula el porcentaje por sección y modo; las lecciones desactualizadas no cuentan', () => {
    const records = [
      study('L00', 'completed', 1),
      study('L01', 'completed', 2),
      study('L02', 'completed', 3, 0),
      study('L03', 'in_progress', 4),
      { ...study('M01', 'completed', 5), mode: 'challenge', contentVersion: null },
      { ...study('scenes', 'in_progress', 6), mode: 'class', percent: 50, state: { scene: 15 } },
    ];
    const progress = learnerProgress(records);
    const s1 = progress.sections.find(({ section }) => section === 'fundamentos-sql')!;
    expect(s1.lessons).toEqual({
      done: 2,
      total: LESSON_COUNT,
      percent: Math.round((2 / LESSON_COUNT) * 100),
    });
    expect(s1.modes.find(({ mode }) => mode === 'challenge')).toMatchObject({ done: 1, total: 10 });
    expect(s1.modes.find(({ mode }) => mode === 'class')).toMatchObject({ percent: 50 });
    expect(progress.overall.done).toBe(2);
    expect(progress.resume?.title).toBe(LESSON_INDEX[3]!.shortTitle);
    expect(progress.sections.find(({ section }) => section === 'plsql')?.lessons).toBeNull();
    expect(progress.recent[0]?.text).toBe('Exposición: escena 15');
  });

  it('sin avance propone la primera lección', () => {
    const progress = learnerProgress([]);
    expect(progress.overall).toEqual({ done: 0, total: LESSON_COUNT, percent: 0 });
    expect(progress.resume?.label).toBe(`Empezar por «${LESSON_INDEX[0]!.shortTitle}»`);
    expect(progress.recent).toEqual([]);
  });

  it('el navegador lee los registros sin zod y descarta los mal formados', () => {
    const record = study('L05', 'completed', 3);
    expect(readProgressRecord(record)).toEqual(record);
    expect(readProgressRecord({ ...record, status: 'aprobado' })).toBeNull();
    expect(readProgressRecord({ ...record, state: { scene: { x: 1 } } })).toBeNull();
    expect(readProgressRecord('x')).toBeNull();
  });

  it('la presencia solo envía zonas generales, nunca la URL completa', () => {
    expect(presenceArea('/learn/where')).toBe('fundamentos-sql/study');
    expect(presenceArea('/sections/plsql')).toBe('secciones/plsql');
    expect(presenceArea('/sections/<script>')).toBe('secciones');
    expect(presenceArea('/join/ABC123?nombre=x')).toBe('sala-en-vivo');
    expect(presenceArea('/')).toBe('inicio');
  });
});
