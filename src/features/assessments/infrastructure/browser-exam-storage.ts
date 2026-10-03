import type { DraftSnapshot, ExamDraftStore } from '../application/answer-queue';
import { readAnswer } from '../application/exam-wire';

/**
 * Copia local de las respuestas aún no confirmadas, por intento. Solo identificadores de
 * opciones y la marca de revisión: nada de texto escrito ni datos personales. Se borra en
 * cuanto el servidor confirma todo.
 */

const PREFIX = 'dblab:exam:';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export class BrowserExamDraftStore implements ExamDraftStore {
  load(attemptId: string): DraftSnapshot | null {
    try {
      const raw = storage()?.getItem(PREFIX + attemptId);
      if (!raw) return null;
      const value = JSON.parse(raw) as { position?: unknown; entries?: unknown };
      if (!Array.isArray(value.entries)) return null;
      return {
        position: typeof value.position === 'number' ? value.position : 1,
        entries: value.entries.flatMap((entry: unknown) => {
          const item = entry as {
            position?: unknown;
            answer?: unknown;
            flagged?: unknown;
            revision?: unknown;
          };
          if (typeof item.position !== 'number' || typeof item.revision !== 'number') return [];
          return [
            {
              position: item.position,
              answer: readAnswer(item.answer),
              flagged: item.flagged === true,
              revision: item.revision,
            },
          ];
        }),
      };
    } catch {
      return null;
    }
  }

  save(attemptId: string, snapshot: DraftSnapshot): void {
    try {
      storage()?.setItem(PREFIX + attemptId, JSON.stringify(snapshot));
    } catch {
      // Sin almacenamiento la respuesta sigue en memoria y se reintenta el envío.
    }
  }

  clear(attemptId: string): void {
    try {
      storage()?.removeItem(PREFIX + attemptId);
    } catch {
      // Nada que borrar.
    }
  }
}

/** Marca de sesión de la pestaña para distinguir una recarga de una nueva entrada. */
export function markExamVisit(attemptId: string): 'entered' | 'reloaded' {
  try {
    const key = `${PREFIX}visit:${attemptId}`;
    const seen = window.sessionStorage.getItem(key) === '1';
    window.sessionStorage.setItem(key, '1');
    return seen ? 'reloaded' : 'entered';
  } catch {
    return 'entered';
  }
}
