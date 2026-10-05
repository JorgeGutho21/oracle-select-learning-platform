'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type {
  ActivityView,
  MissionView,
  PracticeBlockView,
} from '@/features/curriculum/application/curriculum-api';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import {
  ActivityPlayer,
  type ActivityOutcome,
} from '@/features/curriculum/presentation/activity-player';
import { StarBorder } from '@/presentation/components/effects/star-border';
import { curriculumProgress } from '../progress/progress-sync-client';

/**
 * Raíces de cliente de las secciones de la fuente curricular: registran el avance en el
 * mismo formato que la Fase 2 (se sincroniza con la cuenta si hay sesión) y conectan las
 * actividades interactivas con ese progreso.
 */

const EMPTY: readonly ProgressRecord[] = [];

export function useCurriculumRecords(): readonly ProgressRecord[] {
  const store = curriculumProgress();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => EMPTY);
}

function completedItems(records: readonly ProgressRecord[], section: string, mode: string) {
  return new Set(
    records
      .filter((record) => record.section === section && record.mode === mode)
      .filter((record) => record.status === 'completed')
      .map((record) => record.item),
  );
}

/* ---------- Estudiar ---------- */

/** Registra la visita a una lección (en curso) sin rebajar una lección ya completada. */
export function LessonVisit({
  section,
  lessonId,
  version,
}: {
  readonly section: string;
  readonly lessonId: string;
  readonly version: number;
}) {
  useEffect(() => {
    curriculumProgress().lesson(section, lessonId, version, false);
  }, [section, lessonId, version]);
  return null;
}

export function LessonCheck({
  section,
  lessonId,
  version,
  activity,
}: {
  readonly section: string;
  readonly lessonId: string;
  readonly version: number;
  readonly activity: ActivityView;
}) {
  const records = useCurriculumRecords();
  const done = records.some(
    (record) =>
      record.section === section &&
      record.mode === 'study' &&
      record.item === lessonId &&
      record.status === 'completed' &&
      record.contentVersion === version,
  );
  return (
    <>
      <ActivityPlayer
        activity={activity}
        eyebrow="Mini predicción"
        solved={done}
        showReview={false}
        headingLevel={2}
        onFinished={() => curriculumProgress().lesson(section, lessonId, version, true)}
      />
      {done && (
        <p className="cu-lesson-done" role="status">
          <span aria-hidden="true">✓</span> Lección completada.
        </p>
      )}
    </>
  );
}

/** Marca de avance de una lección en el temario. */
export function LessonStatus({
  section,
  lessonId,
  version,
  pendingLabel,
}: {
  readonly section: string;
  readonly lessonId: string;
  readonly version: number;
  /** Texto cuando aún no hay registro (por ejemplo, «Pendiente» en el temario). */
  readonly pendingLabel?: string;
}) {
  const records = useCurriculumRecords();
  const record = records.find(
    (entry) => entry.section === section && entry.mode === 'study' && entry.item === lessonId,
  );
  if (!record)
    return pendingLabel ? <span className="cu-lesson-status">{pendingLabel}</span> : null;
  const done = record.status === 'completed' && record.contentVersion === version;
  return (
    <span className={`cu-lesson-status cu-lesson-status--${done ? 'done' : 'open'}`}>
      <span aria-hidden="true">{done ? '✓' : '•'}</span> {done ? 'Completada' : 'Empezada'}
    </span>
  );
}

/** Resumen de avance del temario: lecciones completadas de la versión vigente. */
export function StudySummary({
  section,
  lessons,
}: {
  readonly section: string;
  readonly lessons: readonly { readonly id: string; readonly version: number }[];
}) {
  const records = useCurriculumRecords();
  const done = lessons.filter((lesson) =>
    records.some(
      (record) =>
        record.section === section &&
        record.mode === 'study' &&
        record.item === lesson.id &&
        record.status === 'completed' &&
        record.contentVersion === lesson.version,
    ),
  ).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  return (
    <div className="cu-summary">
      <p className="cu-summary__value">
        <strong>{done}</strong> de {lessons.length} lecciones completadas
      </p>
      <progress
        className="cu-summary__bar"
        max={100}
        value={percent}
        aria-label="Avance del temario"
      >
        {percent} %
      </progress>
    </div>
  );
}

/* ---------- Practicar ---------- */

export function PracticeRoot({
  section,
  blocks,
}: {
  readonly section: string;
  readonly blocks: readonly PracticeBlockView[];
}) {
  const records = useCurriculumRecords();
  const solved = completedItems(records, section, 'practice');
  const total = blocks.reduce((sum, block) => sum + block.activities.length, 0);
  const done = blocks
    .flatMap((block) => block.activities)
    .filter((activity) => solved.has(activity.id)).length;
  return (
    <div className="cu-practice">
      <p className="cu-practice__progress" role="status">
        <strong>{done}</strong> de {total} prácticas resueltas
      </p>
      {blocks.map((block) => (
        <section
          key={block.id}
          className="cu-practice__block"
          aria-labelledby={`practica-${block.id}`}
        >
          <h2 id={`practica-${block.id}`}>
            {block.number}. {block.title}
          </h2>
          <ol className="cu-practice__list">
            {block.activities.map((activity, index) => (
              <li key={activity.id}>
                <ActivityPlayer
                  activity={activity}
                  eyebrow={`Práctica ${block.number}.${index + 1}`}
                  solved={solved.has(activity.id)}
                  onFinished={(outcome) => {
                    if (outcome.solved) curriculumProgress().practice(section, activity.id);
                  }}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ---------- Challenge ---------- */

/** Puntos de una misión: 100, menos 15 por pista vista y 10 por intento fallido; mínimo 40. */
export function missionPoints(steps: readonly ActivityOutcome[]): {
  readonly points: number;
  readonly result: 'solved' | 'revealed';
} {
  if (steps.some((step) => !step.solved)) return { points: 0, result: 'revealed' };
  const hints = steps.reduce((sum, step) => sum + step.hints, 0);
  const misses = steps.reduce((sum, step) => sum + Math.max(0, step.attempts - 1), 0);
  return { points: Math.max(40, 100 - hints * 15 - misses * 10), result: 'solved' };
}

export function ChallengeRoot({
  section,
  missions,
}: {
  readonly section: string;
  readonly missions: readonly MissionView[];
}) {
  const records = useCurriculumRecords();
  const scores = useMemo(() => {
    const map = new Map<string, { points: number; result: string }>();
    for (const record of records) {
      if (record.section !== section || record.mode !== 'challenge') continue;
      const points = record.state.points;
      if (typeof points === 'number') {
        map.set(record.item, { points, result: String(record.state.result ?? '') });
      }
    }
    return map;
  }, [records, section]);
  const [current, setCurrent] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [outcomes, setOutcomes] = useState<readonly ActivityOutcome[]>([]);
  const mission = missions.find((entry) => entry.id === current) ?? null;
  const total = [...scores.values()].reduce((sum, score) => sum + score.points, 0);
  const closed = missions.filter((entry) => scores.has(entry.id)).length;

  function open(id: string) {
    setCurrent(id);
    setStep(0);
    setOutcomes([]);
  }

  function finishStep(outcome: ActivityOutcome) {
    if (!mission) return;
    const next = [...outcomes, outcome];
    setOutcomes(next);
    if (next.length === mission.steps.length) {
      const score = missionPoints(next);
      const previous = scores.get(mission.id)?.points ?? 0;
      // Repetir una misión nunca baja la mejor puntuación guardada.
      curriculumProgress().mission(section, mission.id, {
        points: Math.max(previous, score.points),
        result: score.points >= previous ? score.result : 'solved',
      });
    }
  }

  if (mission) {
    const finished = outcomes.length === mission.steps.length;
    const activity = mission.steps[Math.min(step, mission.steps.length - 1)]!;
    const score = finished ? missionPoints(outcomes) : null;
    const nextMission = missions[missions.indexOf(mission) + 1];
    return (
      <section className="cu-mission" aria-labelledby="mission-title">
        <button type="button" className="inline-action" onClick={() => setCurrent(null)}>
          ← Volver al mapa de misiones
        </button>
        <p className="study-eyebrow">
          Misión {mission.number} de {missions.length} · {mission.skill}
        </p>
        <h2 id="mission-title">{mission.title}</h2>
        <p className="cu-mission__scenario">{mission.scenario}</p>
        <p className="cu-mission__steps">
          Paso {Math.min(step + 1, mission.steps.length)} de {mission.steps.length}
        </p>
        <ActivityPlayer
          key={`${mission.id}-${step}`}
          activity={activity}
          eyebrow={`Paso ${step + 1}`}
          onFinished={finishStep}
        />
        {outcomes.length > step && step < mission.steps.length - 1 && (
          <button
            type="button"
            className="ds-button ds-button--primary"
            onClick={() => setStep(step + 1)}
          >
            Siguiente paso →
          </button>
        )}
        {finished && score && (
          <div className="cu-mission__result" role="status">
            {score.result === 'solved' ? (
              <StarBorder className="cu-mission__badge">
                <p>
                  <span aria-hidden="true">✓</span> Misión cumplida: <strong>{score.points}</strong>{' '}
                  de 100 puntos
                </p>
              </StarBorder>
            ) : (
              <p>
                Misión cerrada sin puntos: viste la respuesta en un paso. Repasa la lección y vuelve
                a intentarlo cuando quieras.
              </p>
            )}
            {nextMission ? (
              <button
                type="button"
                className="ds-button ds-button--primary"
                onClick={() => open(nextMission.id)}
              >
                Siguiente misión: {nextMission.title} →
              </button>
            ) : (
              <Link
                className="ds-button ds-button--primary"
                href={`/evaluations?seccion=${section}` as Route}
              >
                Ver las evaluaciones de la sección →
              </Link>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="cu-challenge">
      <div className="cu-challenge__score" role="status">
        <p>
          <strong>{total}</strong> de {missions.length * 100} puntos · <strong>{closed}</strong> de{' '}
          {missions.length} misiones cerradas
        </p>
        <p className="cu-challenge__rules">
          Cada misión vale 100 puntos: −15 por pista vista y −10 por intento fallido (mínimo 40).
          Ver la respuesta cierra la misión sin puntos. Se guarda tu mejor resultado.
        </p>
      </div>
      <div className="db-challenge-blocks">
        {[...new Set(missions.map((entry) => entry.block.id))].map((blockId) => {
          const entries = missions.filter((entry) => entry.block.id === blockId);
          const complete = entries.filter((entry) => scores.has(entry.id)).length;
          return (
            <section
              key={blockId}
              className="db-challenge-block"
              aria-labelledby={`retos-${blockId}`}
            >
              <header className="db-challenge-block__header">
                <div>
                  <p className="study-eyebrow">Bloque de retos</p>
                  <h2 id={`retos-${blockId}`}>{entries[0]!.block.title}</h2>
                </div>
                <p>
                  {complete} de {entries.length} misiones cerradas ·{' '}
                  {complete === entries.length
                    ? 'Completado'
                    : complete
                      ? 'En progreso'
                      : 'Por empezar'}
                </p>
              </header>
              <ol className="cu-mission-map">
                {entries.map((entry) => {
                  const score = scores.get(entry.id);
                  return (
                    <li key={entry.id} className={`cu-mission-card${score ? ' is-closed' : ''}`}>
                      <p className="cu-mission-card__number">Misión {entry.number}</p>
                      <h3 className="cu-mission-card__title">{entry.title}</h3>
                      <p className="cu-mission-card__skill">{entry.skill}</p>
                      <p className="db-challenge-topics">
                        <strong>Temas:</strong> {entry.topics.join(' · ')}
                      </p>
                      <p className="db-challenge-state">
                        {score
                          ? 'Cerrada · puedes mejorar tu resultado'
                          : 'Disponible · práctica guiada'}
                      </p>
                      <p className="cu-mission-card__steps">
                        {entry.steps.length} {entry.steps.length === 1 ? 'paso' : 'pasos'}
                        {score && (
                          <>
                            {' '}
                            · <span aria-hidden="true">✓</span> {score.points} puntos
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        className={`ds-button ${score ? 'ds-button--secondary' : 'ds-button--primary'}`}
                        onClick={() => open(entry.id)}
                      >
                        {score ? 'Repetir' : 'Empezar'}
                        <span className="visually-hidden"> la misión {entry.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
