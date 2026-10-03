import type { ChallengeRepository, StoredChallenge } from '@/features/challenge/application/ports';
import type { ChallengeState } from '@/features/challenge/domain/challenge-state';
import { BrowserChallengeRepository } from '@/features/challenge/infrastructure/browser-challenge-repository';
import { SCENE_TOTAL } from '@/features/presentation/domain/scenes';
import type { SceneMemory } from '@/features/presentation/application/presentation-api';
import {
  BrowserSceneMemory,
  SCENE_STORAGE_KEY,
} from '@/features/presentation/infrastructure/browser-scene-memory';
import {
  challengeRecords,
  classRecord,
  newerScene,
  readStudyState,
  studyRecords,
  studyStateWithRecords,
} from '@/features/progress/application/local-mapping';
import {
  ProgressSync,
  type LocalProgressSource,
} from '@/features/progress/application/progress-sync';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import { CurriculumProgressStore } from '@/features/curriculum/application/curriculum-progress';
import { BrowserCurriculumProgressStorage } from '@/features/curriculum/infrastructure/browser-curriculum-progress';
import {
  BrowserOwnerStore,
  browserStorage,
  hasSessionHint,
  readSceneTime,
  SCENE_AT_STORAGE_KEY,
  writeSceneTime,
} from '@/features/progress/infrastructure/browser-progress-storage';
import { HttpProgressGateway } from '@/features/progress/infrastructure/http-progress-gateway';
import type {
  StoredStudyProgress,
  StudyProgressRepository,
  StudyProgressState,
} from '@/features/study/application/progress';
import { BrowserStudyProgressRepository } from '@/features/study/infrastructure/browser-study-progress';

/**
 * Raíz de composición de la sincronización en el navegador. Las páginas siguen usando sus
 * repositorios locales de siempre, envueltos para avisar a la sincronización de cada cambio.
 * Para un invitado los envoltorios no hacen nada más: ni red ni esperas.
 */

/** Espera máxima de la primera sincronización antes de mostrar el progreso local. */
const READY_TIMEOUT_MS = 1500;

function readScene(): number | null {
  try {
    const value = Number(browserStorage()?.getItem(SCENE_STORAGE_KEY));
    return Number.isInteger(value) && value >= 1 && value <= SCENE_TOTAL ? value : null;
  } catch {
    return null;
  }
}

class BrowserLocalProgressSource implements LocalProgressSource {
  private readonly study = new BrowserStudyProgressRepository();
  private readonly challenge = new BrowserChallengeRepository();

  private async studyState(): Promise<StudyProgressState> {
    const stored = await this.study.load();
    return readStudyState(stored.status === 'found' ? stored.data : null);
  }

  async snapshot(): Promise<readonly ProgressRecord[]> {
    const challenge = await this.challenge.load();
    return [
      ...studyRecords(await this.studyState()),
      ...challengeRecords(challenge.status === 'found' ? challenge.data : null),
      ...classRecord(readScene(), SCENE_TOTAL, readSceneTime()),
      ...curriculumProgress().getSnapshot(),
    ];
  }

  async absorb(records: readonly ProgressRecord[]): Promise<void> {
    curriculumProgress().absorb(records);
    const current = await this.studyState();
    const merged = studyStateWithRecords(current, records);
    if (JSON.stringify(merged) !== JSON.stringify(current)) await this.study.save(merged);
    const scene = newerScene(records, readSceneTime());
    if (scene !== null) {
      try {
        browserStorage()?.setItem(SCENE_STORAGE_KEY, String(scene));
        const remote = records.find((record) => record.mode === 'class');
        writeSceneTime(remote?.lastActivityAt ?? Date.now());
      } catch {
        // Sin almacenamiento la exposición empieza desde su portada.
      }
    }
  }

  async clear(): Promise<void> {
    curriculumProgress().clear();
    await this.study.clear();
    await this.challenge.clear();
    try {
      browserStorage()?.removeItem(SCENE_STORAGE_KEY);
      browserStorage()?.removeItem(SCENE_AT_STORAGE_KEY);
    } catch {
      // Nada que borrar.
    }
  }
}

let engine: ProgressSync | null = null;
let curriculum: CurriculumProgressStore | null = null;

/**
 * Progreso de las secciones de la fuente curricular (Sección 2 en adelante): un solo almacén
 * por pestaña, que avisa a la sincronización de cada cambio.
 */
export function curriculumProgress(): CurriculumProgressStore {
  curriculum ??= new CurriculumProgressStore(new BrowserCurriculumProgressStorage(), () =>
    progressSync().notifyLocalChange(),
  );
  return curriculum;
}

/** Una sola sincronización por pestaña, compartida por todas las páginas. */
export function progressSync(): ProgressSync {
  engine ??= new ProgressSync({
    local: new BrowserLocalProgressSource(),
    cloud: new HttpProgressGateway(),
    owner: new BrowserOwnerStore(),
  });
  return engine;
}

/** Antes de leer: con sesión, espera brevemente la primera sincronización. */
async function beforeRead(): Promise<void> {
  const sync = progressSync();
  if (hasSessionHint()) sync.expectAccount();
  await sync.ready(READY_TIMEOUT_MS);
}

export class SyncedStudyProgressRepository implements StudyProgressRepository {
  constructor(
    private readonly inner: StudyProgressRepository = new BrowserStudyProgressRepository(),
  ) {}
  async load(): Promise<StoredStudyProgress> {
    await beforeRead();
    return this.inner.load();
  }
  async save(progress: StudyProgressState): Promise<boolean> {
    const saved = await this.inner.save(progress);
    progressSync().notifyLocalChange();
    return saved;
  }
  async clear(): Promise<boolean> {
    const cleared = await this.inner.clear();
    await progressSync().reset('fundamentos-sql', 'study');
    return cleared;
  }
}

export class SyncedChallengeRepository implements ChallengeRepository {
  constructor(private readonly inner: ChallengeRepository = new BrowserChallengeRepository()) {}
  load(): Promise<StoredChallenge> {
    return this.inner.load();
  }
  async save(state: ChallengeState): Promise<boolean> {
    const saved = await this.inner.save(state);
    progressSync().notifyLocalChange();
    return saved;
  }
  clear(): Promise<boolean> {
    // Reiniciar la práctica no borra de la nube las misiones ya cerradas: son avance.
    return this.inner.clear();
  }
}

export class SyncedSceneMemory implements SceneMemory {
  constructor(private readonly inner: SceneMemory = new BrowserSceneMemory()) {}
  load(): number | null {
    return this.inner.load();
  }
  save(scene: number): void {
    this.inner.save(scene);
    writeSceneTime(Date.now());
    progressSync().notifyLocalChange();
  }
}
