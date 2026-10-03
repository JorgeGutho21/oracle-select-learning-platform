import { isSceneNumber, type SceneMemory } from '../application/presentation-api';

export const SCENE_STORAGE_KEY = 'sql-select-lab:presentation:scene';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Guarda solo el número de escena; si el almacenamiento falla, la exposición sigue igual. */
export class BrowserSceneMemory implements SceneMemory {
  constructor(private readonly resolveStorage: () => StorageLike | null = browserStorage) {}

  load(): number | null {
    try {
      const value = Number(this.resolveStorage()?.getItem(SCENE_STORAGE_KEY));
      return isSceneNumber(value) ? value : null;
    } catch {
      return null;
    }
  }

  save(scene: number): void {
    try {
      this.resolveStorage()?.setItem(SCENE_STORAGE_KEY, String(scene));
    } catch {
      // Sin almacenamiento no hay reanudación, pero la escena actual no se pierde.
    }
  }
}
