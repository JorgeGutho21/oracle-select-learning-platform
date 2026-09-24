'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StudyProgressRepository, StudyProgressState } from '../application/progress';
import { STUDY_PROGRESS_VERSION } from '../application/progress';
import {
  checkCompleteQuery,
  LESSONS,
  STUDY_DATASET,
  STUDY_RELEASE_ID,
  type LessonId,
  type StudyLesson,
} from '../application/study-api';
import { Alert, Button, CodeBlock, Dialog, Progress } from '@/presentation/components/ui';
import { DatasetTable } from '@/presentation/components/data/dataset-table';

function fresh(): StudyProgressState {
  return {
    releaseId: STUDY_RELEASE_ID,
    version: STUDY_PROGRESS_VERSION,
    completed: [],
    lessonVersions: {},
    lastLesson: null,
    updatedAt: Date.now(),
  };
}
function valid(value: unknown): value is StudyProgressState {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StudyProgressState>;
  return (
    item.releaseId === STUDY_RELEASE_ID &&
    item.version === STUDY_PROGRESS_VERSION &&
    Array.isArray(item.completed) &&
    typeof item.lessonVersions === 'object'
  );
}

export function useStudyProgress(repository: StudyProgressRepository) {
  const [progress, setProgress] = useState<StudyProgressState>(fresh);
  const [warning, setWarning] = useState('');
  const [outdated, setOutdated] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void repository.load().then((stored) => {
      if (!active) return;
      if (stored.status === 'found') {
        if (valid(stored.data)) setProgress(stored.data);
        else setOutdated(true);
      } else if (stored.status === 'unavailable' || stored.status === 'unreadable')
        setWarning(
          'No pudimos leer el almacenamiento local. Tu avance continuará en memoria durante esta visita.',
        );
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [repository]);
  const save = useCallback(
    async (next: StudyProgressState) => {
      setProgress(next);
      if (!(await repository.save(next)))
        setWarning('No pudimos guardar el avance. Continuará en memoria durante esta visita.');
    },
    [repository],
  );
  const visit = useCallback(
    (id: LessonId) => {
      setProgress((current) => {
        if (current.lastLesson === id) return current;
        const next = { ...current, lastLesson: id, updatedAt: Date.now() };
        void repository.save(next).then((ok) => {
          if (!ok)
            setWarning('No pudimos guardar el avance. Continuará en memoria durante esta visita.');
        });
        return next;
      });
    },
    [repository],
  );
  const complete = useCallback(
    (id: LessonId) => {
      const lessonVersion = LESSONS.find((lesson) => lesson.id === id)?.version ?? 1;
      void save({
        ...progress,
        completed: [...new Set([...progress.completed, id])],
        lessonVersions: { ...progress.lessonVersions, [id]: lessonVersion },
        lastLesson: id,
        updatedAt: Date.now(),
      });
    },
    [progress, save],
  );
  const reset = useCallback(async () => {
    setProgress(fresh());
    setOutdated(false);
    if (!(await repository.clear()))
      setWarning('El avance se reinició en memoria, pero no pudimos borrar el dato local.');
  }, [repository]);
  return { progress, warning, outdated, ready, visit, complete, reset };
}

export function StudyProgress({
  progress,
  compact = false,
}: {
  progress: StudyProgressState;
  compact?: boolean;
}) {
  const last = LESSONS.find((lesson) => lesson.id === progress.lastLesson);
  const updated = progress.completed.filter((id) => {
    const lesson = LESSONS.find((item) => item.id === id);
    return lesson && progress.lessonVersions[id] !== lesson.version;
  }).length;
  return (
    <section
      className={`study-progress ${compact ? 'study-progress--compact' : ''}`}
      aria-labelledby="study-progress-title"
    >
      <div>
        <p className="study-eyebrow">Tu recorrido</p>
        <h2 id="study-progress-title">
          {progress.completed.length} de {LESSONS.length} lecciones
        </h2>
      </div>
      <Progress label="Progreso del curso" value={progress.completed.length} max={LESSONS.length} />
      {updated > 0 && (
        <p className="study-updated">
          {updated} lección actualizada: vuelve a resolverla para renovar la marca.
        </p>
      )}
      {last && (
        <Link className="ds-button ds-button--secondary" href={`/learn/${last.slug}`}>
          Continuar en {last.shortTitle}
        </Link>
      )}
    </section>
  );
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
  const [feedback, setFeedback] = useState('');
  const [parts, setParts] = useState({ row: '', column: '', header: '' });
  const [counts, setCounts] = useState({ cities: '', pairs: '' });
  const [sql, setSql] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [order, setOrder] = useState({ first: '', second: '' });
  const [expanded, setExpanded] = useState(false);
  const [alias, setAlias] = useState('');
  const finish = (ok: boolean, message: string) => {
    setFeedback(message);
    if (ok) done();
  };
  const a = lesson.activity;
  return (
    <section className="study-activity" aria-labelledby="activity-title">
      <p className="study-eyebrow">Microactividad</p>
      <h2 id="activity-title">Comprueba lo aprendido</h2>
      {a.kind === 'choice' && (
        <fieldset>
          <legend>{a.prompt}</legend>
          {a.options.map((option, i) => (
            <label className="study-option" key={option}>
              <input
                type="radio"
                name={`answer-${lesson.id}`}
                checked={choice === i}
                onChange={() => setChoice(i)}
              />{' '}
              {option}
            </label>
          ))}
          <Button
            onClick={() =>
              finish(
                choice === a.answer,
                choice === a.answer ? a.success : 'Revisa la explicación y prueba otra opción.',
              )
            }
          >
            Comprobar
          </Button>
        </fieldset>
      )}
      {a.kind === 'select-columns' && (
        <>
          <p>Selecciona sobre la fuente las columnas que pide la consulta.</p>
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
                selectedColumns.length === 2 &&
                  selectedColumns.includes('NOMBRE') &&
                  selectedColumns.includes('SALARIO'),
                'Selecciona exactamente NOMBRE y SALARIO; las seis filas permanecen.',
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
          <Button variant="secondary" onClick={() => setExpanded(true)}>
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
                expanded,
                'Correcto: * muestra los seis encabezados y conserva las seis filas.',
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
            onClick={() => {
              const ok = order.first === 'CIUDAD' && order.second === 'NOMBRE';
              finish(
                ok,
                ok
                  ? 'Correcto: el resultado coloca CIUDAD antes de NOMBRE y mantiene seis filas.'
                  : 'La consulta pide CIUDAD primero y NOMBRE después.',
              );
            }}
          >
            Aplicar orden
          </Button>
        </>
      )}
      {a.kind === 'assign-alias' && (
        <>
          <label className="study-query">
            Escribe el encabezado para SALARIO × 12
            <input value={alias} onChange={(e) => setAlias(e.target.value)} />
          </label>
          <div className="study-alias-preview">
            <span>
              Fuente intacta: <strong>SALARIO</strong>
            </span>
            <span>
              Resultado: <strong>{alias.trim().toUpperCase() || '…'}</strong>
            </span>
          </div>
          <Button
            onClick={() => {
              const ok = alias.trim().toUpperCase() === 'SALARIO_ANUAL';
              finish(
                ok,
                ok
                  ? 'Correcto: el resultado dice SALARIO_ANUAL y la fuente conserva SALARIO.'
                  : 'El pedido requiere exactamente el alias SALARIO_ANUAL.',
              );
            }}
          >
            Asignar alias
          </Button>
        </>
      )}
      {a.kind === 'table-parts' && (
        <>
          <p>Identifica tres partes usando la primera fila visible.</p>
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
                parts.row === 'Datos de Ana' &&
                  parts.column === 'SALARIO' &&
                  parts.header === 'CIUDAD',
                'Datos de Ana es una fila; SALARIO, una columna; CIUDAD, su encabezado.',
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
                />{' '}
                {option}
              </label>
            ))}
          </fieldset>
          <Button
            onClick={() =>
              finish(
                choice === 0,
                choice === 0
                  ? 'Correcto: la multiplicación ocurre primero, salvo que los paréntesis agrupen la suma.'
                  : 'Revisa qué operación ocurre primero.',
              )
            }
          >
            Comprobar
          </Button>
        </>
      )}
      {a.kind === 'distinct-counts' && (
        <>
          <p>Cuenta resultados únicos en las dos proyecciones.</p>
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
                counts.cities === '3' && counts.pairs === '5',
                counts.cities === '3' && counts.pairs === '5'
                  ? 'Correcto: seis filas se transforman en 3 ciudades o 5 pares únicos.'
                  : 'DISTINCT compara toda la combinación proyectada.',
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
              rows={6}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
            />
          </label>
          <Button
            onClick={() => {
              const result = checkCompleteQuery(sql);
              finish(result.correct, result.message);
            }}
          >
            Revisar consulta
          </Button>
        </>
      )}
      {(feedback || solved) && (
        <Alert
          tone={solved ? 'success' : 'warning'}
          title={solved ? 'Lección completada' : 'Aún no'}
          live
        >
          {feedback || 'Ya resolviste esta actividad.'}
        </Alert>
      )}
    </section>
  );
}

function Result({ lesson }: { lesson: StudyLesson }) {
  const p = lesson.analysis.preview;
  if (!p) return null;
  const columns = p.columns.map((c) => ({
    name: c.name,
    type: c.type === 'number' ? ('number' as const) : ('text' as const),
  }));
  const rows = p.rows.map((values, row) =>
    Object.fromEntries([['_key', row], ...columns.map((c, i) => [c.name, values[i] ?? ''])]),
  );
  return (
    <DatasetTable
      caption={`Resultado del ejemplo ${lesson.id}`}
      columns={columns}
      rows={rows}
      rowKey={(row) => String(row._key)}
      formatted={columns
        .filter((c) => c.name.includes('SALARIO') || c.name === 'TOTAL')
        .map((c) => c.name)}
    />
  );
}

function VisualExamples({ lesson }: { lesson: StudyLesson }) {
  if (lesson.visualExamples.length === 0) return null;
  return (
    <section className="study-comparisons" aria-labelledby="comparison-title">
      <h2 id="comparison-title">Compara la transformación</h2>
      <div>
        {lesson.visualExamples.map((example) => {
          const preview = example.analysis.preview;
          if (!preview) return null;
          const columns = preview.columns.map((c) => ({ name: c.name, type: c.type }));
          const rows = preview.rows.map((values, row) =>
            Object.fromEntries([
              ['_key', row],
              ...columns.map((c, i) => [c.name, values[i] ?? '']),
            ]),
          );
          return (
            <article key={example.sql}>
              <strong>{example.label}</strong>
              <CodeBlock
                code={example.sql}
                labHref={`/lab?sql=${encodeURIComponent(example.sql)}&returnTo=${encodeURIComponent(`/learn/${lesson.slug}`)}`}
              />
              <DatasetTable
                caption={example.label}
                columns={columns}
                rows={rows}
                rowKey={(item) => String(item._key)}
                formatted={['TOTAL']}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function StudyPage({
  repository,
  lesson,
}: {
  repository: StudyProgressRepository;
  lesson?: StudyLesson;
}) {
  const { progress, warning, outdated, ready, visit, complete, reset } =
    useStudyProgress(repository);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    if (lesson && ready) visit(lesson.id);
  }, [lesson, ready, visit]);
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);
  if (!lesson)
    return (
      <div className="study-shell">
        <header className="study-hero">
          <p className="study-eyebrow">Modo Estudio · 45–60 minutos</p>
          <h1>Aprende SELECT paso a paso</h1>
          <p>
            Nueve lecciones breves con la misma tabla EMPLEADOS, ejemplos verificables y una
            actividad antes de marcar cada avance.
          </p>
        </header>
        {warning && (
          <Alert tone="warning" title="Avance solo en memoria">
            {warning}
          </Alert>
        )}
        <StudyProgress progress={progress} />
        {outdated && (
          <Alert tone="warning" title="Progreso de otra versión">
            El contenido cambió. Reinicia el progreso para estudiar la versión actual.
          </Alert>
        )}
        <div className="study-catalog">
          {LESSONS.map((item, i) => (
            <Link className="study-card" href={`/learn/${item.slug}`} key={item.id}>
              <span>
                {item.id} · {i + 1} de {LESSONS.length}
              </span>
              <h2>{item.title}</h2>
              <p>{item.objective}</p>
              <strong>{completed.has(item.id) ? 'Completada ✓' : 'Empezar →'}</strong>
            </Link>
          ))}
        </div>
        <Button variant="text" onClick={() => setResetOpen(true)}>
          Reiniciar progreso
        </Button>
        <Reset
          open={resetOpen}
          close={() => setResetOpen(false)}
          reset={() => void reset().then(() => setResetOpen(false))}
        />
      </div>
    );
  const index = LESSONS.findIndex((x) => x.id === lesson.id);
  const previous = LESSONS[index - 1];
  const next = LESSONS[index + 1];
  return (
    <div className="study-shell">
      <div className="study-layout">
        <details className="study-mobile-index">
          <summary>
            Temario · {lesson.id} {lesson.shortTitle}
          </summary>
          <ol>
            {LESSONS.map((item) => (
              <li key={item.id}>
                <Link
                  aria-current={item.id === lesson.id ? 'page' : undefined}
                  href={`/learn/${item.slug}`}
                >
                  {completed.has(item.id) ? '✓ ' : ''}
                  {item.id} {item.shortTitle}
                </Link>
              </li>
            ))}
          </ol>
        </details>
        <aside className="study-index" aria-label="Temario">
          <Link href="/learn">← Ver recorrido</Link>
          <ol>
            {LESSONS.map((item) => (
              <li key={item.id}>
                <Link
                  aria-current={item.id === lesson.id ? 'page' : undefined}
                  href={`/learn/${item.slug}`}
                >
                  {completed.has(item.id) ? '✓ ' : ''}
                  {item.id} {item.shortTitle}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
        <article className="study-lesson">
          <header>
            <p className="study-eyebrow">
              {lesson.id} · Lección {index + 1} de {LESSONS.length}
            </p>
            <h1>{lesson.title}</h1>
            <p className="study-objective">
              <strong>Objetivo:</strong> {lesson.objective}
            </p>
          </header>
          {warning && (
            <Alert tone="warning" title="Avance solo en memoria">
              {warning}
            </Alert>
          )}
          <section>
            <h2>Una idea cotidiana</h2>
            <p>{lesson.explanation}</p>
          </section>
          <section>
            <h2>Consulta canónica</h2>
            <CodeBlock
              code={lesson.sql}
              labHref={`/lab?sql=${encodeURIComponent(lesson.sql)}&returnTo=${encodeURIComponent(`/learn/${lesson.slug}`)}`}
            />
            <p className="study-translation">
              <strong>En español:</strong> {lesson.translation}
            </p>
          </section>
          <section>
            <h2>Fuente: EMPLEADOS</h2>
            <DatasetTable
              caption={`Tabla fuente ${STUDY_DATASET.table}`}
              columns={STUDY_DATASET.columns}
              rows={STUDY_DATASET.rows}
              rowKey={(row) => String(row.ID)}
              formatted={['SALARIO']}
              highlighted={lesson.analysis.sourceColumns}
              highlightNote="Las columnas resaltadas participan en esta consulta."
            />
          </section>
          <section className="study-transform" aria-label="Transformación visual">
            <div>
              <span>1</span>
              <strong>Fuente</strong>
            </div>
            <b aria-hidden="true">→</b>
            <div>
              <span>2</span>
              <strong>SELECT transforma la vista</strong>
            </div>
            <b aria-hidden="true">→</b>
            <div>
              <span>3</span>
              <strong>Resultado</strong>
            </div>
          </section>
          <section>
            <h2>Resultado del ejemplo</h2>
            <Result lesson={lesson} />
            <p className="study-note">
              Ejemplo educativo sobre {STUDY_DATASET.id}. Sin ORDER BY, el orden de filas no está
              garantizado.
            </p>
          </section>
          <VisualExamples lesson={lesson} />
          <Alert tone="warning" title="Error frecuente">
            {lesson.frequentError}
          </Alert>
          <Activity
            key={lesson.id}
            lesson={lesson}
            solved={completed.has(lesson.id)}
            done={() => complete(lesson.id)}
          />
          <p className="study-source">Fuente académica: {lesson.sourceReference}</p>
          <nav className="study-pager" aria-label="Navegación entre lecciones">
            {previous ? (
              <Link className="ds-button ds-button--secondary" href={`/learn/${previous.slug}`}>
                ← {previous.shortTitle}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="ds-button ds-button--primary" href={`/learn/${next.slug}`}>
                {next.shortTitle} →
              </Link>
            ) : (
              <Link className="ds-button ds-button--primary" href="/lab">
                Practicar en laboratorio →
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
function Reset({ open, close, reset }: { open: boolean; close: () => void; reset: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={close}
      title="¿Reiniciar tu progreso?"
      description="Se eliminarán las lecciones completadas y la última lección visitada en este dispositivo."
    >
      <div className="study-dialog-actions">
        <Button variant="secondary" onClick={close}>
          Conservar progreso
        </Button>
        <Button onClick={reset}>Sí, reiniciar</Button>
      </div>
    </Dialog>
  );
}
