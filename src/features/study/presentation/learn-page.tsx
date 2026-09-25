'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  checkCompleteQuery,
  LESSON_VERSIONS,
  LESSONS,
  lessonLabHref,
  STUDY_DATASET,
  STUDY_RELEASE_ID,
  type LessonId,
  type StudyLesson,
  type TransformationStep,
} from '../application/study-api';
import { getVideo, type VideoResource } from '@/features/resources/application/resources-api';
import { HighlightTable } from '@/presentation/components/data/highlight-table';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { Alert, Button, CodeBlock, Dialog, Progress } from '@/presentation/components/ui';

const NOT_SAVED =
  'El progreso no se guardará al cerrar: el almacenamiento local no está disponible.';

const SOURCE_COLUMNS = STUDY_DATASET.columns.map(({ name, type }) => ({ name, type }));
const SOURCE_ROWS = STUDY_DATASET.rows.map((row) => SOURCE_COLUMNS.map(({ name }) => row[name]));

export function useStudyProgress(repository: StudyProgressRepository) {
  const [progress, setProgress] = useState<StudyProgressState>(() =>
    emptyStudyProgress(STUDY_RELEASE_ID, 0),
  );
  const [warning, setWarning] = useState('');
  const [otherRelease, setOtherRelease] = useState(false);
  const [ready, setReady] = useState(false);
  // Solo se guarda lo que cambia después de leer el almacenamiento.
  const dirty = useRef(false);

  useEffect(() => {
    let active = true;
    void repository.load().then((stored) => {
      if (!active) return;
      if (stored.status === 'found') {
        const parsed = parseStudyProgress(stored.data, STUDY_RELEASE_ID);
        if (parsed.status === 'valid') setProgress(parsed.progress);
        else setOtherRelease(true);
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
    if (!ready || !dirty.current) return;
    dirty.current = false;
    void repository.save(progress).then((ok) => {
      if (!ok) setWarning(NOT_SAVED);
    });
  }, [progress, ready, repository]);

  const update = useCallback((next: (current: StudyProgressState) => StudyProgressState) => {
    dirty.current = true;
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
    dirty.current = false;
    setProgress(emptyStudyProgress(STUDY_RELEASE_ID, Date.now()));
    setOtherRelease(false);
    if (!(await repository.clear())) setWarning(NOT_SAVED);
  }, [repository]);

  return { progress, warning, otherRelease, ready, visit, complete, reset };
}

export function StudyProgress({
  progress,
  compact = false,
}: {
  progress: StudyProgressState;
  compact?: boolean;
}) {
  const last = LESSONS.find((lesson) => lesson.id === progress.lastLesson);
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
          {done} de {LESSONS.length} lecciones
        </h2>
      </div>
      <Progress label="Progreso del Modo Estudio" value={done} max={LESSONS.length} />
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
        Se guarda solo en este navegador. Visitar no completa: cada lección se marca al resolver su
        actividad.
      </p>
    </section>
  );
}

/** Resumen breve del avance para tarjetas, como la del catálogo de módulos. */
export function StudyProgressSummary({ progress }: { progress: StudyProgressState }) {
  const done = currentCompletedCount(progress, LESSON_VERSIONS);
  const last = LESSONS.find((lesson) => lesson.id === progress.lastLesson);
  return (
    <div className="study-progress-summary">
      <Progress
        label={`Tu progreso: ${done} de ${LESSONS.length} lecciones`}
        value={done}
        max={LESSONS.length}
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

function feedbackFor(ok: boolean, success: string, retry: string) {
  return { ok, message: ok ? success : retry };
}

function Activity({
  lesson,
  solved,
  done,
}: {
  lesson: StudyLesson;
  solved: boolean;
  done: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [parts, setParts] = useState({ row: '', column: '', header: '' });
  const [counts, setCounts] = useState({ cities: '', pairs: '' });
  const [sql, setSql] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [order, setOrder] = useState({ first: '', second: '' });
  const [expanded, setExpanded] = useState(false);
  const [alias, setAlias] = useState('');
  const finish = (result: { ok: boolean; message: string }) => {
    setFeedback(result);
    if (result.ok) done();
  };
  const a = lesson.activity;
  return (
    <section className="study-activity" aria-labelledby="activity-title">
      <p className="study-eyebrow">Microactividad</p>
      <h2 id="activity-title">Comprueba lo aprendido</h2>
      {a.kind === 'choice' && (
        <fieldset>
          <legend>{a.prompt}</legend>
          <div className="study-options">
            {a.options.map((option, i) => (
              <label className="study-option" key={option}>
                <input
                  type="radio"
                  name={`answer-${lesson.id}`}
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                />
                <code>{option}</code>
              </label>
            ))}
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  choice === a.answer,
                  a.success,
                  'Revisa la explicación y prueba otra opción.',
                ),
              )
            }
          >
            Comprobar
          </Button>
        </fieldset>
      )}
      {a.kind === 'select-columns' && (
        <>
          <p>Toca las columnas que pide la consulta: SELECT nombre, salario.</p>
          <div className="study-column-picker">
            {STUDY_DATASET.columns.map(({ name }) => (
              <Button
                key={name}
                variant={selectedColumns.includes(name) ? 'primary' : 'secondary'}
                aria-pressed={selectedColumns.includes(name)}
                onClick={() =>
                  setSelectedColumns((current) =>
                    current.includes(name)
                      ? current.filter((item) => item !== name)
                      : [...current, name],
                  )
                }
              >
                {name}
              </Button>
            ))}
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  selectedColumns.length === 2 &&
                    selectedColumns.includes('NOMBRE') &&
                    selectedColumns.includes('SALARIO'),
                  'Correcto: NOMBRE y SALARIO; las seis filas permanecen.',
                  'Selecciona exactamente NOMBRE y SALARIO.',
                ),
              )
            }
          >
            Proyectar columnas
          </Button>
        </>
      )}
      {a.kind === 'expand-star' && (
        <>
          <p>Expande el asterisco para comprobar qué representa en esta posición.</p>
          <Button variant="secondary" aria-expanded={expanded} onClick={() => setExpanded(true)}>
            Expandir *
          </Button>
          {expanded && (
            <div className="study-expanded">
              <strong>{STUDY_DATASET.columns.map(({ name }) => name).join(' · ')}</strong>
              <span>
                {STUDY_DATASET.columns.length} columnas × {STUDY_DATASET.rows.length} filas
              </span>
            </div>
          )}
          <Button
            disabled={!expanded}
            onClick={() =>
              finish(
                feedbackFor(
                  expanded,
                  'Correcto: * muestra los seis encabezados y conserva las seis filas.',
                  'Primero expande el asterisco.',
                ),
              )
            }
          >
            Confirmar expansión
          </Button>
        </>
      )}
      {a.kind === 'order-columns' && (
        <>
          <p>Ordena los dos encabezados como los pide SELECT ciudad, nombre.</p>
          <div className="study-fields">
            <label>
              Primera columna
              <select
                value={order.first}
                onChange={(e) => setOrder({ ...order, first: e.target.value })}
              >
                <option value="">Elige</option>
                <option>CIUDAD</option>
                <option>NOMBRE</option>
              </select>
            </label>
            <label>
              Segunda columna
              <select
                value={order.second}
                onChange={(e) => setOrder({ ...order, second: e.target.value })}
              >
                <option value="">Elige</option>
                <option>CIUDAD</option>
                <option>NOMBRE</option>
              </select>
            </label>
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  order.first === 'CIUDAD' && order.second === 'NOMBRE',
                  'Correcto: el resultado coloca CIUDAD antes de NOMBRE y mantiene seis filas.',
                  'La consulta pide CIUDAD primero y NOMBRE después.',
                ),
              )
            }
          >
            Aplicar orden
          </Button>
        </>
      )}
      {a.kind === 'assign-alias' && (
        <>
          <label className="study-query">
            Escribe el encabezado para SALARIO × 12
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <div className="study-alias-preview" aria-live="polite">
            <span>
              Fuente intacta: <strong>SALARIO</strong>
            </span>
            <span>
              Resultado: <strong>{alias.trim().toUpperCase() || '…'}</strong>
            </span>
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  alias.trim().toUpperCase() === 'SALARIO_ANUAL',
                  'Correcto: el resultado dice SALARIO_ANUAL y la fuente conserva SALARIO.',
                  'El pedido requiere exactamente el alias SALARIO_ANUAL.',
                ),
              )
            }
          >
            Asignar alias
          </Button>
        </>
      )}
      {a.kind === 'table-parts' && (
        <>
          <p>Identifica tres partes usando la primera fila de EMPLEADOS.</p>
          <div className="study-fields">
            <label>
              Una fila
              <select
                value={parts.row}
                onChange={(e) => setParts({ ...parts, row: e.target.value })}
              >
                <option value="">Elige</option>
                <option>Datos de Ana</option>
                <option>NOMBRE</option>
              </select>
            </label>
            <label>
              Una columna
              <select
                value={parts.column}
                onChange={(e) => setParts({ ...parts, column: e.target.value })}
              >
                <option value="">Elige</option>
                <option>SALARIO</option>
                <option>Datos de Ana</option>
              </select>
            </label>
            <label>
              Un encabezado
              <select
                value={parts.header}
                onChange={(e) => setParts({ ...parts, header: e.target.value })}
              >
                <option value="">Elige</option>
                <option>CIUDAD</option>
                <option>Bogotá</option>
              </select>
            </label>
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  parts.row === 'Datos de Ana' &&
                    parts.column === 'SALARIO' &&
                    parts.header === 'CIUDAD',
                  'Correcto: los datos de Ana son una fila; SALARIO, una columna; CIUDAD, un encabezado.',
                  'Una fila es un registro completo; una columna, un dato de todos; el encabezado, su nombre.',
                ),
              )
            }
          >
            Comprobar las tres
          </Button>
        </>
      )}
      {a.kind === 'precedence' && (
        <>
          <fieldset>
            <legend>Para Ana, ¿qué comparación es correcta?</legend>
            <div className="study-options">
              {[
                'Sin paréntesis: 4.200.000; con paréntesis: 37.200.000',
                'Ambas producen 37.200.000',
                'Sin paréntesis: 37.200.000; con paréntesis: 4.200.000',
              ].map((option, i) => (
                <label className="study-option" key={option}>
                  <input
                    type="radio"
                    name="precedence"
                    checked={choice === i}
                    onChange={() => setChoice(i)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  choice === 0,
                  'Correcto: la multiplicación ocurre primero, salvo que los paréntesis agrupen la suma.',
                  'Revisa qué operación ocurre primero.',
                ),
              )
            }
          >
            Comprobar
          </Button>
        </>
      )}
      {a.kind === 'distinct-counts' && (
        <>
          <p>Cuenta los resultados únicos de las dos proyecciones.</p>
          <div className="study-fields">
            <label>
              Ciudades únicas
              <input
                inputMode="numeric"
                value={counts.cities}
                onChange={(e) => setCounts({ ...counts, cities: e.target.value })}
              />
            </label>
            <label>
              Pares CIUDAD–DEPTO
              <input
                inputMode="numeric"
                value={counts.pairs}
                onChange={(e) => setCounts({ ...counts, pairs: e.target.value })}
              />
            </label>
          </div>
          <Button
            onClick={() =>
              finish(
                feedbackFor(
                  counts.cities.trim() === '3' && counts.pairs.trim() === '5',
                  'Correcto: seis filas se reducen a 3 ciudades o a 5 pares únicos.',
                  'DISTINCT compara toda la combinación proyectada.',
                ),
              )
            }
          >
            Comprobar
          </Button>
        </>
      )}
      {a.kind === 'query' && (
        <>
          <label className="study-query">
            {a.prompt}
            <textarea
              rows={5}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
            />
          </label>
          <Button
            onClick={() => {
              const check = checkCompleteQuery(sql);
              finish({ ok: check.correct, message: check.message });
            }}
          >
            Revisar consulta
          </Button>
        </>
      )}
      {feedback && !feedback.ok && (
        <Alert tone="warning" title="Aún no" live>
          {feedback.message}
        </Alert>
      )}
      {(solved || feedback?.ok) && (
        <Alert tone="success" title="Lección completada" live>
          {feedback?.ok ? feedback.message : 'Ya resolviste esta actividad en este navegador.'}
        </Alert>
      )}
    </section>
  );
}

function StepView({ step }: { step: TransformationStep }) {
  if (step.kind === 'source') {
    return (
      <HighlightTable
        caption={`Tabla fuente ${STUDY_DATASET.table}`}
        columns={SOURCE_COLUMNS}
        rows={SOURCE_ROWS}
        highlightedColumns={step.columns}
        dimOthers
        {...(step.row === undefined ? {} : { highlightedRow: step.row })}
        summary={`Tabla ${STUDY_DATASET.table} · ${SOURCE_ROWS.length} filas · ${SOURCE_COLUMNS.length} columnas`}
      />
    );
  }
  const preview = step.analysis.preview;
  if (!preview) return null;
  return (
    <>
      <code className="study-step__sql">{step.sql}</code>
      <HighlightTable
        caption={`Resultado de ${step.sql}`}
        columns={preview.columns}
        rows={preview.rows}
        duplicateRows={step.duplicateRows}
        summary={`Resultado · ${preview.rows.length} filas · ${preview.columns.length} ${
          preview.columns.length === 1 ? 'columna' : 'columnas'
        } · vista educativa`}
      />
    </>
  );
}

function Transformation({ lesson }: { lesson: StudyLesson }) {
  const [index, setIndex] = useState(0);
  const step = lesson.steps[index];
  if (!step) return null;
  return (
    <section className="study-visual" aria-labelledby="visual-title">
      <div className="study-visual__head">
        <div>
          <p className="study-eyebrow">Efecto visual</p>
          <h2 id="visual-title">De la tabla al resultado</h2>
        </div>
        <ol className="study-steps">
          {lesson.steps.map((item, itemIndex) => (
            <li key={item.title}>
              <button
                type="button"
                aria-current={itemIndex === index ? 'step' : undefined}
                onClick={() => setIndex(itemIndex)}
              >
                <span aria-hidden="true">{itemIndex + 1}</span> {item.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="study-visual__caption" aria-live="polite">
        <strong>
          Paso {index + 1} de {lesson.steps.length}:
        </strong>{' '}
        {step.caption}
      </p>
      <StepView step={step} />
      <div className="study-visual__nav">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ← Paso anterior
        </Button>
        <Button
          variant="secondary"
          disabled={index === lesson.steps.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Paso siguiente →
        </Button>
      </div>
      <p className="study-note">
        Vista educativa sobre {STUDY_DATASET.id}. Sin ORDER BY, Oracle no garantiza el orden de las
        filas.
      </p>
    </section>
  );
}

function Comparisons({ lesson }: { lesson: StudyLesson }) {
  if (lesson.visualExamples.length === 0) return null;
  return (
    <section className="study-comparisons" aria-labelledby="comparison-title">
      <p className="study-eyebrow">Compara</p>
      <h2 id="comparison-title">Dos consultas, dos resultados</h2>
      <div className="study-comparisons__grid">
        {lesson.visualExamples.map((example) => {
          const preview = example.analysis.preview;
          if (!preview) return null;
          return (
            <article key={example.sql}>
              <h3>{example.label}</h3>
              <CodeBlock
                code={example.sql}
                labHref={lessonLabHref(example.sql, `/learn/${lesson.slug}`) as Route}
              />
              <HighlightTable
                caption={example.label}
                columns={preview.columns}
                rows={preview.rows}
                summary={`${preview.rows.length} filas`}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UnitVideo({ video }: { video: VideoResource }) {
  return (
    <VideoPlayer
      title={video.title}
      description={video.description}
      plannedDuration={video.plannedDuration}
      duration={video.duration}
      orientation={video.orientation}
      source={video.source}
      poster={video.poster}
      captions={video.captions}
      transcriptUrl={video.transcriptUrl}
    />
  );
}

function LessonIndex({ progress, onReset }: { progress: StudyProgressState; onReset: () => void }) {
  const completed = new Set(progress.completed);
  const updated = new Set(updatedLessons(progress, LESSON_VERSIONS));
  return (
    <>
      <ol className="study-path" aria-label="Temario del Modo Estudio">
        {LESSONS.map((lesson, index) => {
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
                <span className="study-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="study-card__body">
                  <strong>{lesson.shortTitle}</strong>
                  <span>{lesson.objective}</span>
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
      <div className="study-index-footer">
        <Link className="study-teach" href="/presentation">
          <strong>¿Vas a explicarlo en clase?</strong>
          <span>El Modo Exposición presenta el mismo contenido en escenas para proyector.</span>
        </Link>
        <Button variant="text" onClick={onReset}>
          Reiniciar progreso
        </Button>
      </div>
    </>
  );
}

export function StudyPage({
  repository,
  lesson,
}: {
  repository: StudyProgressRepository;
  lesson?: StudyLesson;
}) {
  const { progress, warning, otherRelease, ready, visit, complete, reset } =
    useStudyProgress(repository);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    if (lesson && ready) visit(lesson.id);
  }, [lesson, ready, visit]);
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);

  const alerts = (
    <>
      {warning && (
        <Alert tone="warning" title="Progreso solo en memoria">
          {warning}
        </Alert>
      )}
      {otherRelease && (
        <Alert tone="info" title="Contenido actualizado">
          Tu progreso guardado corresponde a otra versión del curso; conviene repasar las lecciones.
        </Alert>
      )}
    </>
  );

  const resetDialog = (
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
        <Button onClick={() => void reset().then(() => setResetOpen(false))}>Sí, reiniciar</Button>
      </div>
    </Dialog>
  );

  if (!lesson) {
    return (
      <div className="study-shell">
        <header className="study-hero">
          <div className="site-container study-hero__inner">
            <div>
              <p className="study-eyebrow">Modo Estudio · 45–60 minutos</p>
              <h1>Aprende SELECT paso a paso</h1>
              <p className="study-hero__lead">
                Nueve lecciones cortas con la misma tabla EMPLEADOS. Cada una muestra la tabla, la
                consulta, el efecto y el resultado, y termina con una actividad.
              </p>
            </div>
            <StudyProgress progress={progress} />
          </div>
        </header>
        <div className="site-container study-index">
          {alerts}
          <section className="study-start" aria-labelledby="study-start-title">
            <div className="study-start__copy">
              <p className="study-eyebrow">Inicio del recorrido</p>
              <h2 id="study-start-title">Antes de la primera lección</h2>
              <p>
                Mira el video introductorio o empieza directamente: la primera lección explica lo
                mismo con la tabla EMPLEADOS.
              </p>
              <Link className="ds-button ds-button--primary" href="/learn/introduccion">
                Empezar por «¿Qué es SQL?»
              </Link>
            </div>
            <UnitVideo video={getVideo('intro')} />
          </section>
          <LessonIndex progress={progress} onReset={() => setResetOpen(true)} />
        </div>
        {resetDialog}
      </div>
    );
  }

  const index = LESSONS.findIndex((item) => item.id === lesson.id);
  const previous = LESSONS[index - 1];
  const next = LESSONS[index + 1];
  const labHref = lessonLabHref(lesson.sql, `/learn/${lesson.slug}`) as Route;
  const toc = LESSONS.map((item) => (
    <li key={item.id}>
      <Link
        aria-current={item.id === lesson.id ? 'page' : undefined}
        href={`/learn/${item.slug}` as Route}
      >
        <span className="study-toc__number" aria-hidden="true">
          {completed.has(item.id) ? '✓' : String(LESSONS.indexOf(item) + 1).padStart(2, '0')}
        </span>
        <span>
          {item.shortTitle}
          {completed.has(item.id) && <span className="visually-hidden"> (completada)</span>}
        </span>
      </Link>
    </li>
  ));

  return (
    <div className="study-shell">
      <div className="site-container study-layout">
        <aside className="study-toc" aria-label="Temario">
          <Link href="/learn" className="study-toc__back">
            ← Temario completo
          </Link>
          <ol>{toc}</ol>
        </aside>
        <article className="study-lesson">
          <details className="study-mobile-toc">
            <summary>
              Temario · Lección {index + 1} de {LESSONS.length}
            </summary>
            <ol>{toc}</ol>
          </details>
          <header className="study-lesson__header">
            <p className="study-eyebrow">
              Lección {index + 1} de {LESSONS.length} · {lesson.id}
            </p>
            <h1>{lesson.title}</h1>
            <p className="study-objective">
              <strong>Objetivo:</strong> {lesson.objective}
            </p>
          </header>
          {alerts}
          <div className="study-intro">
            <section className="study-card-block" aria-labelledby="idea-title">
              <p className="study-eyebrow">Explicación cotidiana</p>
              <h2 id="idea-title">La idea</h2>
              <p>{lesson.explanation}</p>
            </section>
            <section
              className="study-card-block study-card-block--syntax"
              aria-labelledby="syntax-title"
            >
              <p className="study-eyebrow">Sintaxis</p>
              <h2 id="syntax-title">El patrón</h2>
              <pre className="study-syntax">
                <code>{lesson.syntax}</code>
              </pre>
            </section>
          </div>
          <section className="study-example" aria-labelledby="example-title">
            <p className="study-eyebrow">Ejemplo con EMPLEADOS</p>
            <h2 id="example-title">La consulta</h2>
            <CodeBlock code={lesson.sql} labHref={labHref} />
            <p className="study-translation">
              <strong>Traducción:</strong> {lesson.translation}
            </p>
          </section>
          <Transformation key={lesson.id} lesson={lesson} />
          <Comparisons lesson={lesson} />
          <section className="study-error" aria-labelledby="error-title">
            <span className="study-error__mark" aria-hidden="true">
              !
            </span>
            <div>
              <h2 id="error-title">Error frecuente</h2>
              <p>{lesson.frequentError}</p>
            </div>
          </section>
          <Activity
            key={`activity-${lesson.id}`}
            lesson={lesson}
            solved={completed.has(lesson.id)}
            done={() => complete(lesson.id)}
          />
          {!next && (
            <section className="study-closing" aria-labelledby="study-closing-title">
              <p className="study-eyebrow">Final del recorrido</p>
              <h2 id="study-closing-title">Repasa toda la unidad</h2>
              <UnitVideo video={getVideo('summary')} />
              <p>
                Después, pon a prueba lo aprendido en el{' '}
                <Link href="/challenge">SQL Challenge</Link> o repasa la{' '}
                <Link href={'/resources#chuleta' as Route}>chuleta de SELECT</Link>.
              </p>
            </section>
          )}
          <p className="study-source">Fuente académica: {lesson.sourceReference}</p>
          <nav className="study-pager" aria-label="Navegación entre lecciones">
            {previous ? (
              <Link
                className="ds-button ds-button--secondary"
                href={`/learn/${previous.slug}` as Route}
              >
                ← {previous.shortTitle}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="ds-button ds-button--primary" href={`/learn/${next.slug}` as Route}>
                {next.shortTitle} →
              </Link>
            ) : (
              <Link className="ds-button ds-button--primary" href={labHref}>
                Practicar en el laboratorio →
              </Link>
            )}
          </nav>
        </article>
      </div>
      {resetDialog}
    </div>
  );
}
