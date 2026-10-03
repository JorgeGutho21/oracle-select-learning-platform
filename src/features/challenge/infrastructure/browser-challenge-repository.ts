import type { ChallengeRepository, StoredChallenge } from '../application/ports';
import type { ChallengeState } from '../domain/challenge-state';

/** Subconjunto de la Web Storage API; permite inyectar un doble en pruebas. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const CHALLENGE_STORAGE_KEY = 'sql-select-lab:challenge:practice';

/** Devuelve `localStorage` o `null` si no existe o el navegador lo bloquea. */
export function browserLocalStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Persistencia local de la práctica individual (DATABASE_SCHEMA: sin progreso en servidor
 * en v1). Nunca lanza: un almacenamiento bloqueado o lleno se informa como no disponible.
 */
export class BrowserChallengeRepository implements ChallengeRepository {
  constructor(
    private readonly resolveStorage: () => StorageLike | null = browserLocalStorage,
    private readonly key: string = CHALLENGE_STORAGE_KEY,
  ) {}

  async load(): Promise<StoredChallenge> {
    const storage = this.resolveStorage();
    if (!storage) return { status: 'unavailable' };
    let raw: string | null;
    try {
      raw = storage.getItem(this.key);
    } catch {
      return { status: 'unavailable' };
    }
    if (raw === null) return { status: 'empty' };
    try {
      return { status: 'found', data: JSON.parse(raw) as unknown };
    } catch {
      return { status: 'unreadable' };
    }
  }

  async save(state: ChallengeState): Promise<boolean> {
    const storage = this.resolveStorage();
    if (!storage) return false;
    try {
      storage.setItem(this.key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    const storage = this.resolveStorage();
    if (!storage) return false;
    try {
      storage.removeItem(this.key);
      return true;
    } catch {
      return false;
    }
  }
}
