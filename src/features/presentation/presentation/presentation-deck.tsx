'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ACADEMIC_IDENTITY } from '@/application/academic-identity';
import { getLesson, STUDY_DATASET, type StudyLesson } from '@/features/study/application/study-api';

const SCENE_TOTAL = 16;

type AcademicIdentity = typeof ACADEMIC_IDENTITY;

interface PresentationDeckProps {
  readonly initialScene: number;
  readonly identity: AcademicIdentity;
  readonly lessonCount: number;
}

interface SceneFrameProps {
  readonly number: number;
  readonly eyebrow: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly tone?: 'light' | 'night' | 'soft';
}

function clampScene(value: number): number {
  return Number.isInteger(value) && value >= 1 && value <= SCENE_TOTAL ? value : 1;
}

function sceneFromLocation(): number {
  const value = new URL(window.location.href).searchParams.get('scene');
  return clampScene(Number(value ?? 1));
}

function isKeyboardNavigationBlocked(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'input, textarea, select, video, [contenteditable="true"], [role="dialog"], .cm-editor',
      ),
    )
  );
}

function SceneFrame({ number, eyebrow, title, children, tone = 'light' }: SceneFrameProps) {
  return (
    <article
      className={`presentation-scene presentation-scene--${tone}`}
      aria-labelledby={`presentation-title-${number}`}
    >
      <header className="presentation-scene__heading">
        <span className="presentation-scene__number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
        <div>
          <p className="presentation-scene__eyebrow">{eyebrow}</p>
          <h1 id={`presentation-title-${number}`}>{title}</h1>
        </div>
      </header>
      <div className="presentation-scene__content">{children}</div>
    </article>
  );
}

function SqlCard({ sql, label = 'Consulta' }: { readonly sql: string; readonly label?: string }) {
  return (
    <div className="presentation-sql" aria-label={label}>
      <span>{label}</span>
      <code>{sql}</code>
    </div>
  );
}

function LessonSummary({ lesson }: { readonly lesson: StudyLesson }) {
  return (
    <div className="presentation-lesson">
      <p className="presentation-lead">{lesson.explanation}</p>
      <SqlCard sql={lesson.sql} />
      <p className="presentation-translation">
        <strong>En español:</strong> {lesson.translation}
      </p>
    </div>
  );
}

function SourceTable({ highlighted = [] }: { readonly highlighted?: readonly string[] }) {
  return (
    <div
      className="presentation-table-wrap"
      role="region"
      aria-label="Tabla EMPLEADOS"
      tabIndex={0}
    >
      <table className="presentation-table">
        <caption>EMPLEADOS · dataset empleados-select-v1</caption>
        <thead>
          <tr>
            {STUDY_DATASET.columns.map((column) => (
              <th
                key={column.name}
                scope="col"
                className={highlighted.includes(column.name) ? 'is-highlighted' : undefined}
              >
                {column.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STUDY_DATASET.rows.map((row) => (
            <tr key={row.ID}>
              {STUDY_DATASET.columns.map((column) => (
                <td
                  key={column.name}
                  className={highlighted.includes(column.name) ? 'is-highlighted' : undefined}
                >
                  {column.name === 'SALARIO'
                    ? new Intl.NumberFormat('es-CO').format(row[column.name])
                    : row[column.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultPreview({
  lesson,
  limit = 6,
}: {
  readonly lesson: StudyLesson;
  readonly limit?: number;
}) {
  const preview = lesson.analysis.preview;
  if (!preview) return null;
  return (
    <div className="presentation-result" aria-label="Demostración educativa del resultado">
      <p className="presentation-result__label">Demostración educativa · {preview.datasetId}</p>
      <div
        className="presentation-table-wrap"
        role="region"
        aria-label="Resultado de ejemplo"
        tabIndex={0}
      >
        <table className="presentation-table presentation-table--result">
          <thead>
            <tr>
              {preview.columns.map((column) => (
                <th key={column.name} scope="col">
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.slice(0, limit).map((row, rowIndex) => (
              <tr key={`${row.join('-')}-${rowIndex}`}>
                {row.map((value, columnIndex) => (
                  <td key={`${columnIndex}-${String(value)}`}>
                    {typeof value === 'number'
                      ? new Intl.NumberFormat('es-CO').format(value)
                      : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function requiredLesson(slug: string): StudyLesson {
  const lesson = getLesson(slug);
  if (!lesson) throw new Error(`No existe la lección ${slug}.`);
  return lesson;
}

const introduction = requiredLesson('introduccion');
const selectLesson = requiredLesson('select');
const fromLesson = requiredLesson('from');
const starLesson = requiredLesson('asterisco');
const columnsLesson = requiredLesson('columnas');
const expressionsLesson = requiredLesson('expresiones');
const aliasLesson = requiredLesson('alias');
const distinctLesson = requiredLesson('distinct');
const completeLesson = requiredLesson('consulta-completa');

function labHref(sql: string, scene: number): Route {
  const params = new URLSearchParams({ sql, returnTo: `/presentation?scene=${scene}` });
  return `/lab?${params.toString()}` as Route;
}

function renderScene(scene: number, identity: AcademicIdentity, lessonCount: number): ReactNode {
  switch (scene) {
    case 1:
      return (
        <SceneFrame
          number={1}
          eyebrow={identity.institution}
          title={identity.unitTitle}
          tone="night"
        >
          <div className="presentation-cover">
            <div>
              <p className="presentation-cover__program">{identity.program}</p>
              <p className="presentation-lead">
                Aprende a elegir, calcular y nombrar datos con SELECT.
              </p>
              <dl className="presentation-credits">
                <div>
                  <dt>Presenta</dt>
                  <dd>{identity.author}</dd>
                </div>
                <div>
                  <dt>Docente</dt>
                  <dd>{identity.teacher}</dd>
                </div>
                <div>
                  <dt>Asignatura</dt>
                  <dd>{identity.course}</dd>
                </div>
              </dl>
            </div>
            <div className="presentation-logo-plate">
              <Image
                src={identity.logo}
                alt={`Logotipo de ${identity.institution}`}
                width={322}
                height={167}
                priority
              />
            </div>
          </div>
        </SceneFrame>
      );
    case 2:
      return (
        <SceneFrame
          number={2}
          eyebrow="Ruta de aprendizaje"
          title="Al terminar podrás…"
          tone="soft"
        >
          <ol className="presentation-objectives">
            <li>
              <span>01</span>Leer una consulta SELECT y explicar cada parte.
            </li>
            <li>
              <span>02</span>Elegir columnas, crear cálculos y poner alias claros.
            </li>
            <li>
              <span>03</span>Usar DISTINCT para quitar combinaciones repetidas.
            </li>
            <li>
              <span>04</span>Construir y probar una consulta completa.
            </li>
          </ol>
          <p className="presentation-note">
            La misma ruta continúa en {lessonCount} lecciones de Estudio.
          </p>
        </SceneFrame>
      );
    case 3:
      return (
        <SceneFrame number={3} eyebrow={introduction.id} title="SQL pregunta; la tabla responde">
          <div className="presentation-two-columns presentation-two-columns--wide-right">
            <div>
              <p className="presentation-lead">{introduction.explanation}</p>
              <div className="presentation-concepts">
                <span>
                  <strong>Tabla</strong> conjunto organizado
                </span>
                <span>
                  <strong>Fila</strong> un empleado
                </span>
                <span>
                  <strong>Columna</strong> un atributo
                </span>
              </div>
            </div>
            <SourceTable highlighted={['NOMBRE']} />
          </div>
        </SceneFrame>
      );
    case 4:
      return (
        <SceneFrame number={4} eyebrow="Fuente común" title="Conoce EMPLEADOS">
          <SourceTable />
          <div className="presentation-metrics" aria-label="Resumen del dataset">
            <span>
              <strong>6</strong> filas
            </span>
            <span>
              <strong>6</strong> columnas
            </span>
            <span>
              <strong>1</strong> versión canónica
            </span>
          </div>
        </SceneFrame>
      );
    case 5:
      return (
        <SceneFrame
          number={5}
          eyebrow={`${selectLesson.id} + ${fromLesson.id}`}
          title="SELECT dice qué; FROM dice de dónde"
        >
          <div className="presentation-query-anatomy presentation-query-anatomy--simple">
            <span className="part part--keyword">SELECT</span>
            <span className="part part--column">nombre, salario</span>
            <span className="part part--keyword">FROM</span>
            <span className="part part--table">empleados;</span>
          </div>
          <div className="presentation-two-columns">
            <p>
              <strong>SELECT</strong>
              <br />
              Elige las columnas visibles.
            </p>
            <p>
              <strong>FROM</strong>
              <br />
              Identifica la tabla de origen.
            </p>
          </div>
          <p className="presentation-translation">{selectLesson.translation}</p>
        </SceneFrame>
      );
    case 6:
      return (
        <SceneFrame number={6} eyebrow={starLesson.id} title="* expande todas las columnas">
          <div className="presentation-two-columns presentation-two-columns--wide-right">
            <LessonSummary lesson={starLesson} />
            <div>
              <div className="presentation-column-cloud" aria-label="Las seis columnas">
                {STUDY_DATASET.columns.map((column) => (
                  <span key={column.name}>{column.name}</span>
                ))}
              </div>
              <p className="presentation-warning">
                Aquí * significa “todas las columnas”. En una expresión significa multiplicación.
              </p>
            </div>
          </div>
        </SceneFrame>
      );
    case 7:
      return (
        <SceneFrame number={7} eyebrow={columnsLesson.id} title="Tú decides columnas y orden">
          <div className="presentation-two-columns">
            <LessonSummary lesson={columnsLesson} />
            <ResultPreview lesson={columnsLesson} />
          </div>
        </SceneFrame>
      );
    case 8:
      return (
        <SceneFrame number={8} eyebrow={expressionsLesson.id} title="Calcula sin alterar la fuente">
          <div className="presentation-two-columns">
            <LessonSummary lesson={expressionsLesson} />
            <div className="presentation-calculation">
              <span>SALARIO</span>
              <span>×</span>
              <span>12</span>
              <span>=</span>
              <strong>SALARIO ANUAL</strong>
              <p>
                Ana: 3.000.000 × 12 = <strong>36.000.000</strong>
              </p>
              <p className="presentation-note">
                Los paréntesis cambian la precedencia del cálculo.
              </p>
            </div>
          </div>
        </SceneFrame>
      );
    case 9:
      return (
        <SceneFrame
          number={9}
          eyebrow={aliasLesson.id}
          title="AS pone un nombre claro al resultado"
        >
          <div className="presentation-two-columns">
            <LessonSummary lesson={aliasLesson} />
            <div className="presentation-before-after">
              <div>
                <span>Expresión</span>
                <code>SALARIO * 12</code>
              </div>
              <span aria-hidden="true">→</span>
              <div>
                <span>Encabezado</span>
                <code>SALARIO_ANUAL</code>
              </div>
            </div>
          </div>
          <p className="presentation-warning">
            El alias etiqueta esta salida. La columna SALARIO de EMPLEADOS permanece intacta.
          </p>
        </SceneFrame>
      );
    case 10:
      return (
        <SceneFrame
          number={10}
          eyebrow={distinctLesson.id}
          title="DISTINCT compara toda la proyección"
        >
          <div className="presentation-two-columns">
            <LessonSummary lesson={distinctLesson} />
            <div className="presentation-distinct-counts">
              <div>
                <strong>3</strong>
                <span>ciudades distintas</span>
              </div>
              <div>
                <strong>5</strong>
                <span>pares CIUDAD + DEPTO</span>
              </div>
            </div>
          </div>
          <ResultPreview lesson={distinctLesson} limit={5} />
        </SceneFrame>
      );
    case 11:
      return (
        <SceneFrame
          number={11}
          eyebrow={completeLesson.id}
          title="Anatomía de una consulta completa"
          tone="night"
        >
          <div className="presentation-query-anatomy">
            <span className="part part--keyword">SELECT</span>
            <span className="part part--column">nombre, ciudad,</span>
            <span className="part part--expression">salario * 12</span>
            <span className="part part--keyword">AS</span>
            <span className="part part--alias">salario_anual</span>
            <span className="part part--keyword">FROM</span>
            <span className="part part--table">empleados;</span>
          </div>
          <div className="presentation-anatomy-legend">
            <span className="legend--keyword">Instrucciones</span>
            <span className="legend--column">Columnas</span>
            <span className="legend--expression">Cálculo</span>
            <span className="legend--alias">Alias</span>
            <span className="legend--table">Origen</span>
          </div>
          <p className="presentation-translation">{completeLesson.translation}</p>
        </SceneFrame>
      );
    case 12:
      return (
        <SceneFrame number={12} eyebrow="Práctica guiada" title="Lleva la consulta al laboratorio">
          <div className="presentation-two-columns">
            <div>
              <p className="presentation-lead">
                Edita, analiza y prepara una ejecución real en Oracle cuando el servicio esté
                conectado.
              </p>
              <SqlCard sql={completeLesson.sql} label="Ejemplo de partida" />
              <Link className="presentation-action" href={labHref(completeLesson.sql, 12)}>
                Abrir en laboratorio <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="presentation-process" aria-label="Proceso del laboratorio">
              <span>1. Escribir</span>
              <span aria-hidden="true">→</span>
              <span>2. Analizar</span>
              <span aria-hidden="true">→</span>
              <span>3. Ejecutar</span>
              <span aria-hidden="true">→</span>
              <span>4. Explicar</span>
            </div>
          </div>
          <p className="presentation-note">
            La vista previa educativa se rotula como demostración. Solo Oracle conectado acredita
            una ejecución real.
          </p>
        </SceneFrame>
      );
    case 13:
      return (
        <SceneFrame number={13} eyebrow="Aplicación" title="SQL Oracle Challenge" tone="night">
          <div className="presentation-challenge">
            <div className="presentation-challenge__badge" aria-hidden="true">
              10
            </div>
            <div>
              <p className="presentation-lead">
                Diez misiones para ordenar, predecir, detectar errores y escribir SQL.
              </p>
              <ul className="presentation-inline-list">
                <li>2 intentos</li>
                <li>Pistas</li>
                <li>Hasta 1000 puntos</li>
              </ul>
              <Link className="presentation-action presentation-action--cyan" href="/challenge">
                Abrir Challenge <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </SceneFrame>
      );
    case 14:
      return (
        <SceneFrame number={14} eyebrow="Síntesis" title="Una pregunta, cuatro decisiones">
          <div className="presentation-summary-flow">
            <span>
              <strong>1</strong> ¿Qué mostrar?
            </span>
            <span>
              <strong>2</strong> ¿De dónde?
            </span>
            <span>
              <strong>3</strong> ¿Qué calcular?
            </span>
            <span>
              <strong>4</strong> ¿Cómo nombrarlo?
            </span>
          </div>
          <div className="presentation-media-slot">
            <span className="presentation-media-slot__icon" aria-hidden="true">
              ▶
            </span>
            <div>
              <strong>Vídeo resumen · espacio preparado</strong>
              <p>El recurso definitivo aún no ha sido publicado.</p>
            </div>
          </div>
        </SceneFrame>
      );
    case 15:
      return (
        <SceneFrame number={15} eyebrow="Sala en vivo" title="Reserva para QR y código" tone="soft">
          <div className="presentation-qr-layout">
            <div className="presentation-qr-slot" aria-label="Espacio reservado para el código QR">
              <span aria-hidden="true">QR</span>
              <small>Se mostrará al crear una sala</small>
            </div>
            <div>
              <p className="presentation-lead">
                El QR real se generará desde una sala activa. No hay código ni enlace inventado en
                esta presentación.
              </p>
              <dl className="presentation-room-facts">
                <div>
                  <dt>Código</dt>
                  <dd>Disponible al crear sala</dd>
                </div>
                <div>
                  <dt>Participantes</dt>
                  <dd>Aún no hay participantes</dd>
                </div>
              </dl>
              <Link className="presentation-action" href="/live">
                Ir a sala en vivo <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </SceneFrame>
      );
    case 16:
      return (
        <SceneFrame
          number={16}
          eyebrow="Cierre"
          title="SELECT convierte preguntas en resultados"
          tone="night"
        >
          <div className="presentation-closing">
            <div>
              <p className="presentation-lead">
                Ya puedes elegir columnas, calcular valores, usar alias y reconocer duplicados.
              </p>
              <SqlCard
                sql="SELECT DISTINCT ciudad FROM empleados;"
                label="Una consulta para recordar"
              />
            </div>
            <nav aria-label="Recursos para continuar" className="presentation-resource-links">
              <Link href="/learn">
                Estudiar las lecciones <span aria-hidden="true">→</span>
              </Link>
              <Link href="/lab">
                Practicar en laboratorio <span aria-hidden="true">→</span>
              </Link>
              <Link href="/resources">
                Ver recursos y chuleta <span aria-hidden="true">→</span>
              </Link>
            </nav>
          </div>
          <p className="presentation-signature">
            {identity.author} · {identity.institution}
          </p>
        </SceneFrame>
      );
    default:
      return null;
  }
}

export function PresentationDeck({ initialScene, identity, lessonCount }: PresentationDeckProps) {
  const [scene, setScene] = useState(() => clampScene(initialScene));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (nextScene: number) => {
      const next = clampScene(nextScene);
      if (next === scene) return;
      window.history.pushState(null, '', `/presentation?scene=${next}`);
      setScene(next);
    },
    [scene],
  );

  useEffect(() => {
    const handlePopState = () => setScene(sceneFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === deckRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isKeyboardNavigationBlocked(event.target)) return;
      if (event.key === 'ArrowRight' && scene < SCENE_TOTAL) {
        event.preventDefault();
        navigate(scene + 1);
      }
      if (event.key === 'ArrowLeft' && scene > 1) {
        event.preventDefault();
        navigate(scene - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, scene]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await deckRef.current?.requestFullscreen();
    } catch {
      // El navegador puede rechazar la pantalla completa; la escena sigue en la ventana.
    }
  }

  return (
    <div className="presentation-page">
      <div className="presentation-deck" ref={deckRef} data-theme="dark">
        <div className="presentation-stage" aria-live="polite">
          {renderScene(scene, identity, lessonCount)}
        </div>
        <footer className="presentation-controls" aria-label="Controles de la exposición">
          <button
            type="button"
            onClick={() => navigate(scene - 1)}
            disabled={scene === 1}
            aria-label="Escena anterior"
          >
            <span aria-hidden="true">←</span>
            <span className="presentation-controls__label">Anterior</span>
          </button>
          <div className="presentation-progress">
            <label htmlFor="presentation-scene-select">Escena</label>
            <select
              id="presentation-scene-select"
              value={scene}
              onChange={(event) => navigate(Number(event.target.value))}
            >
              {Array.from({ length: SCENE_TOTAL }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number}>
                  {number} de {SCENE_TOTAL}
                </option>
              ))}
            </select>
            <div className="presentation-progress__track" aria-hidden="true">
              <span style={{ width: `${(scene / SCENE_TOTAL) * 100}%` }} />
            </div>
            <span className="visually-hidden" role="status">
              Escena {scene} de {SCENE_TOTAL}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          >
            <span className="presentation-controls__label">
              {isFullscreen ? 'Salir' : 'Pantalla completa'}
            </span>
            <span aria-hidden="true">{isFullscreen ? '↙' : '↗'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(scene + 1)}
            disabled={scene === SCENE_TOTAL}
            aria-label="Escena siguiente"
          >
            <span className="presentation-controls__label">Siguiente</span>
            <span aria-hidden="true">→</span>
          </button>
        </footer>
      </div>
      <p className="presentation-keyboard-help">
        Usa ← y → para cambiar de escena. Escape sale de pantalla completa sin perder tu posición.
      </p>
    </div>
  );
}
