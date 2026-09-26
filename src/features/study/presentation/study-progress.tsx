'use client';

import type { Route } from 'next';
import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  currentCompletedCount,
  emptyStudyProgress,
  parseStudyProgress,
  updatedLessons,
  withCompletedLesson,
  withVisitedLesson,
  type StudyProgressRepository,
  type StudyProgressState,
} from '../application/progress';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  LESSON_VERSIONS,
  STUDY_BLOCKS,
  STUDY_RELEASE_ID,
  type LessonId,
} from '../application/lesson-index';
import type { CheckView } from '../application/study-api';
import { MiniCheck } from '@/presentation/components/interaction/mini-check';
import { Alert, Button, Dialog, Progress } from '@/presentation/components/ui';

/**
 * Progreso del Modo Estudio en el navegador. Un solo proveedor por página comparte el
 * estado entre el temario, la lección y la mini comprobación. Visitar no completa: una
 * lección se marca al resolver su mini comprobación (o al ver su respuesta).
 */

const NOT_SAVED =
  'El progreso no se guardará al cerrar: el almacenamiento local no está disponible.';

export function useStudyProgress(repository: StudyProgressRepository) {
  const [progress, setProgress] = useState<StudyProgressState>(() =>
    emptyStudyProgress(STUDY_RELEASE_ID, 0),
  );
  const [warning, setWarning] = useState('');
  const [otherRelease, setOtherRelease] = useState(false);
  const [ready, setReady] = useState(false);
  // Último estado leído o guardado: solo se guarda lo que cambia después de leer el
  // almacenamiento. Se compara el estado, no una marca: la visita que registra una lección
  // al quedar lista llega en el mismo ciclo que la lectura y una marca se perdía.
  const persisted = useRef<StudyProgressState>(progress);

  useEffect(() => {
    let active = true;
    void repository.load().then((stored) => {
      if (!active) return;
      if (stored.status === 'found') {
        const parsed = parseStudyProgress(stored.data, STUDY_RELEASE_ID);
        if (parsed.status === 'valid') {
          persisted.current = parsed.progress;
          setProgress(parsed.progress);
        } else setOtherRelease(true);
      } else if (stored.status === 'unavailable' || stored.status === 'unreadable') {
        setWarning(NOT_SAVED);
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!ready || progress === persisted.current) return;
    persisted.current = progress;
    void repository.save(progress).then((ok) => {
      if (!ok) setWarning(NOT_SAVED);
    });
  }, [progress, ready, repository]);

  const update = useCallback((next: (current: StudyProgressState) => StudyProgressState) => {
    setProgress(next);
  }, []);

  const visit = useCallback(
    (id: LessonId) => update((current) => withVisitedLesson(current, id, Date.now())),
    [update],
  );
  const complete = useCallback(
    (id: LessonId) =>
      update((current) => withCompletedLesson(current, id, LESSON_VERSIONS[id], Date.now())),
    [update],
  );
  const reset = useCallback(async () => {
    const empty = emptyStudyProgress(STUDY_RELEASE_ID, Date.now());
    // El estado vacío no se guarda: se borra el almacenamiento.
    persisted.current = empty;
    setProgress(empty);
    setOtherRelease(false);
    if (!(await repository.clear())) setWarning(NOT_SAVED);
  }, [repository]);

  return { progress, warning, otherRelease, ready, visit, complete, reset };
}

type StudyProgressValue = ReturnType<typeof useStudyProgress>;

const StudyProgressContext = createContext<StudyProgressValue | null>(null);

export function StudyProgressProvider({
  repository,
  children,
}: {
  readonly repository: StudyProgressRepository;
  readonly children: ReactNode;
}) {
  const value = useStudyProgress(repository);
  return <StudyProgressContext.Provider value={value}>{children}</StudyProgressContext.Provider>;
}

function useProgressContext(): StudyProgressValue {
  const value = useContext(StudyProgressContext);
  if (!value) throw new Error('Falta StudyProgressProvider.');
  return value;
}

export function StudyAlerts() {
  const { warning, otherRelease } = useProgressContext();
  return (
    <>
      {warning && (
        <Alert tone="warning" title="Progreso solo en memoria">
          {warning}
        </Alert>
      )}
      {otherRelease && (
        <Alert tone="info" title="Recorrido actualizado">
          Tu progreso guardado corresponde a la versión anterior del curso, de nueve lecciones. El
          recorrido nuevo tiene {LESSON_COUNT}: empieza de nuevo o salta a la que necesites.
        </Alert>
      )}
    </>
  );
}

export function StudyProgress({
  progress,
  compact = false,
}: {
  readonly progress: StudyProgressState;
  readonly compact?: boolean;
}) {
  const last = LESSON_INDEX.find((lesson) => lesson.id === progress.lastLesson);
  const done = currentCompletedCount(progress, LESSON_VERSIONS);
  const updated = updatedLessons(progress, LESSON_VERSIONS).length;
  return (
    <section
      className={`study-progress ${compact ? 'study-progress--compact' : ''}`.trim()}
      aria-labelledby="study-progress-title"
    >
      <div className="study-progress__head">
        <p className="study-eyebrow">Tu progreso</p>
        <h2 id="study-progress-title">
          {done} de {LESSON_COUNT} lecciones
        </h2>
      </div>
      <Progress label="Progreso del Modo Estudio" value={done} max={LESSON_COUNT} />
      {updated > 0 && (
        <p className="study-updated">
          Contenido actualizado; conviene repasarlo ({updated}{' '}
          {updated === 1 ? 'lección' : 'lecciones'}).
        </p>
      )}
      <div className="study-progress__actions">
        {last ? (
          <Link className="ds-button ds-button--primary" href={`/learn/${last.slug}` as Route}>
            Continuar en {last.shortTitle}
          </Link>
        ) : (
          <Link className="ds-button ds-button--primary" href="/learn/introduccion">
            Empezar el recorrido
          </Link>
        )}
        {compact && (
          <Link className="ds-button ds-button--secondary" href="/learn">
            Ver temario
          </Link>
        )}
      </div>
      <p className="study-progress__note">
        Se guarda solo en este navegador. Cada lección se completa al resolver su mini comprobación.
      </p>
    </section>
  );
}

/** Progreso del proveedor de la página. */
export function StudyProgressPanel({ compact = false }: { readonly compact?: boolean }) {
  const { progress } = useProgressContext();
  return <StudyProgress progress={progress} compact={compact} />;
}

/** Resumen breve del avance para tarjetas, como la del catálogo de módulos. */
export function StudyProgressSummary({ progress }: { readonly progress: StudyProgressState }) {
  const done = currentCompletedCount(progress, LESSON_VERSIONS);
  const last = LESSON_INDEX.find((lesson) => lesson.id === progress.lastLesson);
  return (
    <div className="study-progress-summary">
      <Progress
        label={`Tu progreso: ${done} de ${LESSON_COUNT} lecciones`}
        value={done}
        max={LESSON_COUNT}
      />
      <Link
        className="ds-button ds-button--primary"
        href={(last ? `/learn/${last.slug}` : '/learn') as Route}
      >
        {last ? `Continuar en ${last.shortTitle}` : 'Empezar el Modo Estudio'}
      </Link>
    </div>
  );
}

/** Temario completo por bloques, con el estado de cada lección. */
export function StudyLessonList() {
  const { progress, reset } = useProgressContext();
  const [resetOpen, setResetOpen] = useState(false);
  const completed = new Set(progress.completed);
  const updated = new Set(updatedLessons(progress, LESSON_VERSIONS));
  return (
    <>
      <div className="study-blocks">
        {STUDY_BLOCKS.map((block) => (
          <section key={block.id} className="study-block" aria-labelledby={`bloque-${block.id}`}>
            <header className="study-block__header">
              <span className="study-block__letter" aria-hidden="true">
                {block.letter}
              </span>
              <div>
                <h2 id={`bloque-${block.id}`}>
                  <span className="visually-hidden">Bloque {block.letter}: </span>
                  {block.title}
                </h2>
                <p>{block.summary}</p>
              </div>
            </header>
            <ol className="study-path" aria-label={`Lecciones del bloque ${block.title}`}>
              {LESSON_INDEX.filter((lesson) => lesson.block === block.id).map((lesson) => {
                const state = updated.has(lesson.id)
                  ? 'Contenido actualizado'
                  : completed.has(lesson.id)
                    ? 'Completada'
                    : 'Pendiente';
                return (
                  <li key={lesson.id}>
                    <Link
                      className={`study-card ${state === 'Completada' ? 'is-done' : ''}`.trim()}
                      href={`/learn/${lesson.slug}` as Route}
                    >
                      <span className="study-card__number">
                        {String(lesson.number).padStart(2, '0')}
                      </span>
                      <span className="study-card__body">
                        <strong>{lesson.shortTitle}</strong>
                        <span>{lesson.summary}</span>
                      </span>
                      <code className="study-card__badge">{lesson.badge}</code>
                      <span className="study-card__state">
                        {state === 'Completada' ? '✓ ' : ''}
                        {state}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      <div className="study-index-footer">
        <Link className="study-teach" href="/presentation">
          <strong>¿Vas a explicarlo en clase?</strong>
          <span>El Modo Exposición resume el mismo contenido en escenas para proyector.</span>
        </Link>
        <Button variant="text" onClick={() => setResetOpen(true)}>
          Reiniciar progreso
        </Button>
      </div>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="¿Reiniciar tu progreso?"
        description="Se borrarán las lecciones completadas y la última lección visitada solo en este navegador."
      >
        <div className="study-dialog-actions">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Conservar progreso
          </Button>
          <Button onClick={() => void reset().then(() => setResetOpen(false))}>
            Sí, reiniciar
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** Temario lateral de una lección, con las completadas marcadas. */
export function LessonToc({ current }: { readonly current: string }) {
  const { progress } = useProgressContext();
  const completed = new Set(progress.completed);
  const index = LESSON_INDEX.findIndex((lesson) => lesson.slug === current);
  const list = (
    <ol>
      {STUDY_BLOCKS.map((block) => (
        <li key={block.id} className="study-toc__block">
          <span className="study-toc__block-title">
            {block.letter} · {block.title}
          </span>
          <ol>
            {LESSON_INDEX.filter((lesson) => lesson.block === block.id).map((lesson) => (
              <li key={lesson.id}>
                <Link
                  aria-current={lesson.slug === current ? 'page' : undefined}
                  href={`/learn/${lesson.slug}` as Route}
                >
                  <span className="study-toc__number" aria-hidden="true">
                    {completed.has(lesson.id) ? '✓' : String(lesson.number).padStart(2, '0')}
                  </span>
                  <span>
                    {lesson.shortTitle}
                    {completed.has(lesson.id) && (
                      <span className="visually-hidden"> (completada)</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <aside className="study-toc" aria-label="Temario">
        <Link href="/learn" className="study-toc__back">
          ← Temario completo
        </Link>
        {list}
      </aside>
      <details className="study-mobile-toc">
        <summary>
          Temario · Lección {index + 1} de {LESSON_COUNT}
        </summary>
        {list}
      </details>
    </>
  );
}

/** Registra la visita y completa la lección al resolver su mini comprobación. */
export function LessonCheck({
  lessonId,
  check,
}: {
  readonly lessonId: LessonId;
  readonly check: CheckView;
}) {
  const { progress, ready, visit, complete } = useProgressContext();
  useEffect(() => {
    if (ready) visit(lessonId);
  }, [lessonId, ready, visit]);
  return (
    <MiniCheck
      check={check}
      solved={progress.completed.includes(lessonId)}
      onSolved={() => complete(lessonId)}
    />
  );
}
