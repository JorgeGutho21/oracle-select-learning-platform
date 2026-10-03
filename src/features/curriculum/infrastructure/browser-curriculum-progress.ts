import type { ProgressRecord } from '@/features/progress/domain/progress';
import type { CurriculumProgressStorage } from '../application/curriculum-progress';

/**
 * Progreso de las secciones de la fuente curricular en el navegador (localStorage). Sin
 * almacenamiento disponible (modo privado estricto) el avance vive solo en la pestaña.
 */

export const CURRICULUM_PROGRESS_KEY = 'dblab:curriculum-progress:v1';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export class BrowserCurriculumProgressStorage implements CurriculumProgressStorage {
  load(): unknown {
    try {
      const text = storage()?.getItem(CURRICULUM_PROGRESS_KEY);
      return text ? (JSON.parse(text) as unknown) : null;
    } catch {
      return null;
    }
  }

  save(records: readonly ProgressRecord[]): boolean {
    try {
      storage()?.setItem(CURRICULUM_PROGRESS_KEY, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      storage()?.removeItem(CURRICULUM_PROGRESS_KEY);
    } catch {
      // Nada que borrar.
    }
  }
}
