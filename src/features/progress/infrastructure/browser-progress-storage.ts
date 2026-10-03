import { cookieHasSessionHint } from '@/features/accounts/application/session-hint';
import type { OwnerStore } from '../application/progress-sync';

/**
 * Datos de sincronización en este navegador: el dueño del progreso local y la hora de la
 * última escena de la exposición. Las claves de progreso de siempre no cambian.
 */

export const OWNER_STORAGE_KEY = 'sql-select-lab:account:owner';
export const SCENE_AT_STORAGE_KEY = 'sql-select-lab:presentation:scene:at';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export class BrowserOwnerStore implements OwnerStore {
  constructor(private readonly resolve: () => StorageLike | null = browserStorage) {}
  read(): string | null {
    try {
      const value = this.resolve()?.getItem(OWNER_STORAGE_KEY) ?? null;
      return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
    } catch {
      return null;
    }
  }
  write(userId: string): void {
    try {
      this.resolve()?.setItem(OWNER_STORAGE_KEY, userId);
    } catch {
      // Sin almacenamiento no hay dueño: la siguiente sesión vuelve a fusionar (idempotente).
    }
  }
  clear(): void {
    try {
      this.resolve()?.removeItem(OWNER_STORAGE_KEY);
    } catch {
      // Nada que borrar.
    }
  }
}

/** ¿Hay una sesión iniciada? La marca no contiene datos: solo evita preguntar en vano. */
export function hasSessionHint(): boolean {
  try {
    return typeof document !== 'undefined' && cookieHasSessionHint(document.cookie);
  } catch {
    return false;
  }
}

export function readSceneTime(): number {
  try {
    const value = Number(browserStorage()?.getItem(SCENE_AT_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function writeSceneTime(at: number): void {
  try {
    browserStorage()?.setItem(SCENE_AT_STORAGE_KEY, String(at));
  } catch {
    // La escena se guardó igual; solo se pierde su hora.
  }
}
