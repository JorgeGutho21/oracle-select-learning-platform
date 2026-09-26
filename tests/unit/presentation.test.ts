import { describe, expect, it } from 'vitest';
import {
  clampScene,
  parseSceneParam,
  SCENE_TOTAL,
  sceneNumber,
  SCENES,
} from '@/features/presentation/application/presentation-api';
import {
  BrowserSceneMemory,
  SCENE_STORAGE_KEY,
} from '@/features/presentation/infrastructure/browser-scene-memory';
import { LESSON_INDEX } from '@/features/study/application/lesson-index';
import { FUTURE_TOPICS } from '@/features/modules/application/modules-api';

describe('guion del Modo Exposición', () => {
  it('tiene 29 escenas numeradas en orden, con identificadores únicos', () => {
    expect(SCENE_TOTAL).toBe(29);
    expect(SCENES.map(({ number }) => number)).toEqual(
      Array.from({ length: 29 }, (_, index) => index + 1),
    );
    expect(new Set(SCENES.map(({ id }) => id)).size).toBe(29);
    expect(SCENES.map(({ title }) => title)).toEqual([
      'Portada',
      'Ruta de aprendizaje',
      'Qué es SQL',
      'Conoce EMPLEADOS',
      'SELECT y FROM',
      'SELECT *',
      'Columnas específicas',
      'Expresiones y precedencia',
      'Alias con AS',
      'DISTINCT',
      'WHERE',
      'Comparaciones',
      'AND y OR',
      'Paréntesis y precedencia lógica',
      'BETWEEN',
      'IN',
      'LIKE',
      'NULL e IS NULL',
      'ORDER BY',
      'Anatomía de una consulta',
      'Construimos una consulta',
      'Errores frecuentes',
      'Laboratorio',
      'SQL Challenge',
      'Qué aprendimos',
      'Video resumen',
      'Reto en vivo',
      'Próximos temas',
      'Cierre',
    ]);
    expect(sceneNumber('where')).toBe(11);
  });

  it('cada escena de contenido enlaza con lecciones actuales, nunca con temas futuros', () => {
    const lessons = new Set(LESSON_INDEX.map(({ slug }) => slug));
    const futures = new Set(FUTURE_TOPICS.map(({ slug }) => slug));
    for (const scene of SCENES) {
      for (const lesson of scene.lessons) {
        expect(lessons, scene.id).toContain(lesson);
        expect(futures.has(lesson), scene.id).toBe(false);
      }
    }
    // Todas las lecciones de contenido tienen su escena.
    const covered = new Set(SCENES.flatMap(({ lessons: list }) => list));
    for (const lesson of LESSON_INDEX) expect(covered, lesson.slug).toContain(lesson.slug);
  });

  it('interpreta el parámetro de escena sin aceptar valores fuera de rango', () => {
    expect(parseSceneParam('7')).toBe(7);
    expect(parseSceneParam(['12', '3'])).toBe(12);
    expect(parseSceneParam('29')).toBe(29);
    for (const value of [undefined, '', '0', '30', '2.5', 'abc', '-1']) {
      expect(parseSceneParam(value)).toBeNull();
    }
    expect(clampScene(0)).toBe(1);
    expect(clampScene(99)).toBe(29);
    expect(clampScene(Number.NaN)).toBe(1);
  });
});

describe('memoria local de la escena', () => {
  function fakeStorage() {
    const data = new Map<string, string>();
    return {
      data,
      storage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
      },
    };
  }

  it('guarda y recupera solo escenas válidas', () => {
    const { data, storage } = fakeStorage();
    const memory = new BrowserSceneMemory(() => storage);
    expect(memory.load()).toBeNull();
    memory.save(9);
    expect(data.get(SCENE_STORAGE_KEY)).toBe('9');
    expect(memory.load()).toBe(9);
    data.set(SCENE_STORAGE_KEY, '40');
    expect(memory.load()).toBeNull();
  });

  it('no falla si el almacenamiento está bloqueado', () => {
    const memory = new BrowserSceneMemory(() => ({
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    }));
    expect(memory.load()).toBeNull();
    expect(() => memory.save(3)).not.toThrow();
    expect(new BrowserSceneMemory(() => null).load()).toBeNull();
  });
});
