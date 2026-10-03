import { MISSION_IDS } from '@/features/challenge/domain/types';
import {
  LESSON_INDEX,
  STUDY_RELEASE_ID,
  type LessonId,
} from '@/features/study/application/lesson-index';
import {
  emptyStudyProgress,
  parseStudyProgress,
  type StudyProgressState,
} from '@/features/study/application/progress';
import { CLASS_ITEM, latestRecord, type ProgressRecord } from '../domain/progress';

/**
 * Traducción entre el progreso que la plataforma ya guardaba en el navegador (mismas claves
 * y formatos de siempre) y los registros comunes. El progreso local no cambia de formato:
 * la sincronización lo lee y, para el Modo Estudio, lo completa con lo que llega de la nube.
 */

const SECTION = 'fundamentos-sql';
const LESSON_IDS = new Set<string>(LESSON_INDEX.map(({ id }) => id));

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function time(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Lecciones completadas y la última abierta del Modo Estudio. */
export function studyRecords(state: StudyProgressState): readonly ProgressRecord[] {
  const records: ProgressRecord[] = state.completed.map((id) => ({
    section: SECTION,
    mode: 'study',
    item: id,
    status: 'completed',
    percent: 100,
    contentVersion: state.lessonVersions[id] ?? null,
    state: {},
    lastActivityAt: id === state.lastLesson ? time(state.updatedAt) : 0,
  }));
  if (state.lastLesson && !state.completed.includes(state.lastLesson)) {
    records.push({
      section: SECTION,
      mode: 'study',
      item: state.lastLesson,
      status: 'in_progress',
      percent: 0,
      contentVersion: null,
      state: {},
      lastActivityAt: time(state.updatedAt),
    });
  }
  return records;
}

/** Lee el progreso del Modo Estudio guardado; otra versión del recorrido cuenta como vacío. */
export function readStudyState(data: unknown): StudyProgressState {
  const parsed = parseStudyProgress(data, STUDY_RELEASE_ID);
  return parsed.status === 'valid' ? parsed.progress : emptyStudyProgress(STUDY_RELEASE_ID, 0);
}

/**
 * Completa el progreso local del Modo Estudio con los registros de la nube: une las
 * lecciones completadas (con la versión más alta) y toma como última lección la de
 * actividad más reciente. Nunca quita una lección completada.
 */
export function studyStateWithRecords(
  state: StudyProgressState,
  records: readonly ProgressRecord[],
): StudyProgressState {
  const study = records.filter(
    (record) =>
      record.section === SECTION && record.mode === 'study' && LESSON_IDS.has(record.item),
  );
  const completed = new Set<LessonId>(state.completed);
  const versions: Partial<Record<LessonId, number>> = { ...state.lessonVersions };
  for (const record of study) {
    if (record.status !== 'completed') continue;
    const id = record.item as LessonId;
    completed.add(id);
    if (record.contentVersion !== null) {
      versions[id] = Math.max(versions[id] ?? 0, record.contentVersion);
    }
  }
  const remote = latestRecord(study);
  const remoteIsNewer = remote !== null && remote.lastActivityAt > state.updatedAt;
  return {
    ...state,
    completed: [...completed],
    lessonVersions: versions,
    lastLesson: remoteIsNewer ? (remote.item as LessonId) : state.lastLesson,
    updatedAt: Math.max(state.updatedAt, remote?.lastActivityAt ?? 0),
  };
}

const CLOSED = new Set(['solved', 'failed', 'skipped']);

/**
 * Misiones de la práctica individual del Challenge. Se leen con tolerancia: un dato
 * dañado simplemente no aporta registros (el servidor vuelve a validar todo).
 */
export function challengeRecords(data: unknown): readonly ProgressRecord[] {
  if (!isObject(data) || data.mode !== 'practice' || !isObject(data.missions)) return [];
  const missions = data.missions;
  return MISSION_IDS.flatMap((id): ProgressRecord[] => {
    const mission = missions[id];
    if (!isObject(mission) || typeof mission.status !== 'string') return [];
    const closed = CLOSED.has(mission.status);
    if (!closed && mission.status !== 'in-progress') return [];
    const attempts = Array.isArray(mission.attempts) ? mission.attempts : [];
    const lastAttempt = attempts.reduce<number>(
      (latest, attempt) => Math.max(latest, isObject(attempt) ? time(attempt.submittedAt) : 0),
      0,
    );
    return [
      {
        section: SECTION,
        mode: 'challenge',
        item: id,
        status: closed ? 'completed' : 'in_progress',
        percent: closed ? 100 : 0,
        contentVersion: null,
        state: closed ? { result: mission.status } : {},
        lastActivityAt: Math.max(time(mission.closedAt), lastAttempt, time(mission.openedAt)),
      },
    ];
  });
}

/** Escena alcanzada en la exposición: un solo registro con su posición. */
export function classRecord(
  scene: number | null,
  total: number,
  at: number,
): readonly ProgressRecord[] {
  if (scene === null || !Number.isInteger(scene) || scene < 1 || scene > total) return [];
  return [
    {
      section: SECTION,
      mode: 'class',
      item: CLASS_ITEM,
      status: scene === total ? 'completed' : 'in_progress',
      percent: Math.round((scene / total) * 100),
      contentVersion: null,
      state: { scene },
      lastActivityAt: time(at),
    },
  ];
}

/** Escena guardada en la nube, si es más reciente que la local. */
export function newerScene(records: readonly ProgressRecord[], localAt: number): number | null {
  const remote = records.find(
    (record) => record.section === SECTION && record.mode === 'class' && record.item === CLASS_ITEM,
  );
  const scene = remote?.state.scene;
  return remote && typeof scene === 'number' && remote.lastActivityAt > localAt ? scene : null;
}
