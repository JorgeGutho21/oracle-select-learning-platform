import { describe, expect, it } from 'vitest';
import {
  clampScene,
  parseSceneParam,
  SCENE_TOTAL,
  SCENES,
} from '@/features/presentation/application/presentation-api';
import {
  BrowserSceneMemory,
  SCENE_STORAGE_KEY,
} from '@/features/presentation/infrastructure/browser-scene-memory';

describe('guion del Modo Exposición', () => {
  it('tiene las dieciséis escenas acordadas, numeradas y en orden', () => {
    expect(SCENE_TOTAL).toBe(16);
    expect(SCENES.map(({ number }) => number)).toEqual(
      Array.from({ length: 16 }, (_, index) => index + 1),
    );
    expect(SCENES.map(({ title }) => title)).toEqual([
      'Portada',
      'Qué aprenderemos',
      'Qué es SQL',
      'La tabla EMPLEADOS',
      'SELECT y FROM',
      'SELECT *',
      'Columnas específicas',
      'Expresiones',
      'Alias con AS',
      'DISTINCT',
      'Anatomía de una consulta',
      'Laboratorio',
      'SQL Challenge',
      'Resumen',
      'Reto y QR',
      'Cierre',
    ]);
  });

  it('interpreta el parámetro de escena sin aceptar valores fuera de rango', () => {
    expect(parseSceneParam('7')).toBe(7);
    expect(parseSceneParam(['12', '3'])).toBe(12);
    for (const value of [undefined, '', '0', '17', '2.5', 'abc', '-1']) {
      expect(parseSceneParam(value)).toBeNull();
    }
    expect(clampScene(0)).toBe(1);
    expect(clampScene(99)).toBe(16);
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
