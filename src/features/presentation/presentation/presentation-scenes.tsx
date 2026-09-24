'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Fragment, useState, type ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { PRACTICE_RULES } from '@/features/challenge/application/challenge-api';
import {
  analyzeLabQuery,
  type AnatomyRole,
  type LabAnalysis,
} from '@/features/laboratory/application/lab-api';
import { SCENES } from '../application/presentation-api';
import { getVideo } from '@/features/resources/application/resources-api';
import {
  getLesson,
  LESSONS,
  lessonLabHref,
  STUDY_DATASET,
} from '@/features/study/application/study-api';
import { HighlightTable } from '@/presentation/components/data/highlight-table';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { SceneQr } from './scene-qr';

type Tone = 'light' | 'soft' | 'night' | 'tech';

const numberFormat = new Intl.NumberFormat('es-CO');
const SOURCE_COLUMNS = STUDY_DATASET.columns.map(({ name, type }) => ({ name, type }));
const SOURCE_ROWS = STUDY_DATASET.rows.map((row) => SOURCE_COLUMNS.map(({ name }) => row[name]));

function analysisOf(sql: string): LabAnalysis {
  return analyzeLabQuery(sql);
}

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Falta ${what} para la exposición.`);
  return value;
}

const expressionsLesson = required(getLesson('expresiones'), 'la lección de expresiones');
const completeLesson = required(getLesson('consulta-completa'), 'la lección de consulta completa');

// Consultas de las escenas: su resultado sale siempre del motor educativo.
const Q = {
  selectFrom: 'SELECT nombre, salario\nFROM empleados;',
  star: 'SELECT *\nFROM empleados;',
  cityName: 'SELECT ciudad, nombre\nFROM empleados;',
  nameCity: 'SELECT nombre, ciudad\nFROM empleados;',
  expression: 'SELECT nombre, salario * 12\nFROM empleados;',
  expressionDetail: 'SELECT nombre, salario, salario * 12 FROM empleados;',
  noAlias: 'SELECT nombre, salario * 12 FROM empleados;',
  alias: 'SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;',
  cities: 'SELECT ciudad FROM empleados;',
  distinct: 'SELECT DISTINCT ciudad\nFROM empleados;',
  pairs: 'SELECT DISTINCT ciudad, depto FROM empleados;',
  challenge: 'SELECT DISTINCT depto FROM empleados;',
} as const;

const A = Object.fromEntries(Object.entries(Q).map(([key, sql]) => [key, analysisOf(sql)])) as {
  readonly [K in keyof typeof Q]: LabAnalysis;
};

function rows(analysis: LabAnalysis) {
  return analysis.preview?.rows ?? [];
}

function columns(analysis: LabAnalysis) {
  return analysis.preview?.columns ?? [];
}

function duplicateIndexes(analysis: LabAnalysis): number[] {
  const seen = new Set<string>();
  return rows(analysis).flatMap((row, index) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return [index];
    seen.add(key);
    return [];
  });
}

function labRoute(sql: string, scene: number): Route {
  return lessonLabHref(sql, `/presentation?scene=${scene}`) as Route;
}

const KEYWORDS = /\b(SELECT|DISTINCT|FROM|AS)\b/g;

function Code({ sql, label }: { readonly sql: string; readonly label?: string }) {
  return (
    <figure className="scene-code">
      {label && <figcaption>{label}</figcaption>}
      <pre>
        <code>
          {sql
            .split(KEYWORDS)
            .map((part, index) =>
              index % 2 === 1 ? <b key={index}>{part}</b> : <Fragment key={index}>{part}</Fragment>,
            )}
        </code>
      </pre>
    </figure>
  );
}

function Result({
  analysis,
  caption,
  duplicates = [],
}: {
  readonly analysis: LabAnalysis;
  readonly caption: string;
  readonly duplicates?: readonly number[];
}) {
  const count = rows(analysis).length;
  return (
    <HighlightTable
      size="large"
      caption={caption}
      columns={columns(analysis)}
      rows={rows(analysis)}
      duplicateRows={duplicates}
      summary={`${count} ${count === 1 ? 'fila' : 'filas'} · vista educativa`}
    />
  );
}

function Scene({
  number,
  eyebrow,
  title = SCENES[number - 1]?.title ?? '',
  tone = 'light',
  children,
}: {
  readonly number: number;
  readonly eyebrow: string;
  /** Título visible; por defecto, el del guion de escenas. */
  readonly title?: string;
  readonly tone?: Tone;
  readonly children: ReactNode;
}) {
  return (
    <article
      className={`scene scene--${tone}`}
      aria-labelledby={`scene-title-${number}`}
      data-scene={number}
    >
      <header className="scene__header">
        <span className="scene__number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
        <div>
          <p className="scene__eyebrow">{eyebrow}</p>
          <h1 id={`scene-title-${number}`} className="scene__title" tabIndex={-1}>
            {title}
          </h1>
        </div>
      </header>
      <div className="scene__body">{children}</div>
    </article>
  );
}

const ROLE_LABEL: Partial<Record<AnatomyRole, string>> = {
  select: 'Instrucción',
  column: 'Columna',
  expression: 'Cálculo',
  alias: 'Alias',
  from: 'Origen',
  table: 'Tabla',
};

function Anatomy({ analysis }: { readonly analysis: LabAnalysis }) {
  const source = analysis.source;
  const parts = analysis.anatomy.filter((part) => part.role !== 'terminator');
  const segments: ReactNode[] = [];
  let position = 0;
  parts.forEach((part, index) => {
    if (part.span.start > position) {
      const text = source.slice(position, part.span.start);
      segments.push(
        <Fragment key={`t-${index}`}>
          {text.split(KEYWORDS).map((piece, i) =>
            i % 2 === 1 ? (
              <b key={i} className="anatomy-part anatomy-part--select">
                {piece}
              </b>
            ) : (
              piece
            ),
          )}
        </Fragment>,
      );
    }
    segments.push(
      <span key={`p-${index}`} className={`anatomy-part anatomy-part--${part.role}`}>
        {source.slice(part.span.start, part.span.end)}
      </span>,
    );
    position = part.span.end;
  });
  segments.push(<Fragment key="end">{source.slice(position)}</Fragment>);
  const legend = parts.filter(
    (part, index, all) =>
      ROLE_LABEL[part.role] && all.findIndex((other) => other.role === part.role) === index,
  );
  return (
    <div className="scene-anatomy">
      <pre className="scene-anatomy__code">
        <code>{segments}</code>
      </pre>
      <ul className="scene-anatomy__legend">
        {legend.map((part) => (
          <li key={part.role} className={`anatomy-legend anatomy-legend--${part.role}`}>
            <strong>{ROLE_LABEL[part.role]}</strong>
            <span>{part.explanation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RevealAnswer() {
  const [shown, setShown] = useState(false);
  const answer = rows(A.challenge).map((row) => String(row[0]));
  return (
    <div className="scene-quiz">
      <p className="scene-quiz__question">¿Cuántas filas devuelve esta consulta?</p>
      <Code sql={Q.challenge} />
      {shown ? (
        <p className="scene-quiz__answer" role="status">
          <strong>{answer.length} filas:</strong> {answer.join(', ')}.
        </p>
      ) : (
        <button type="button" className="scene-button" onClick={() => setShown(true)}>
          Revelar respuesta
        </button>
      )}
    </div>
  );
}

function SummaryVideo() {
  const video = getVideo('summary');
  return (
    <VideoPlayer
      compact
      titleAs="p"
      title={video.title}
      description={video.description}
      plannedDuration={video.plannedDuration}
      source={video.source}
      poster={video.poster}
      captions={video.captions}
      transcriptUrl={video.transcriptUrl}
    />
  );
}

const SUMMARY = [
  ['SELECT', 'Qué columnas mostrar.'],
  ['FROM', 'De qué tabla salen.'],
  ['*', 'Todas las columnas.'],
  ['a, b', 'Columnas en el orden pedido.'],
  ['salario * 12', 'Un cálculo por fila.'],
  ['AS alias', 'Un encabezado claro.'],
  ['DISTINCT', 'Sin filas repetidas.'],
] as const;

export function renderScene(scene: number): ReactNode {
  switch (scene) {
    case 1:
      return (
        <Scene
          number={1}
          eyebrow={`${identity.institution} · ${identity.program}`}
          title={identity.unitTitle}
          tone="night"
        >
          <div className="scene-cover">
            <div className="scene-cover__copy">
              <p className="scene-cover__course">
                Asignatura <strong>{identity.course}</strong>
              </p>
              <dl className="scene-credits">
                <div>
                  <dt>Autor</dt>
                  <dd>{identity.author}</dd>
                </div>
                <div>
                  <dt>Profesor</dt>
                  <dd>{identity.teacher}</dd>
                </div>
              </dl>
            </div>
            <div className="scene-cover__logo">
              <Image src={identity.logo} alt={identity.institution} width={805} height={417} />
            </div>
          </div>
        </Scene>
      );
    case 2:
      return (
        <Scene number={2} eyebrow="Ruta de la clase" tone="soft">
          <ol className="scene-path">
            {LESSONS.map((lesson, index) => (
              <li key={lesson.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{lesson.shortTitle}</strong>
                <code>{lesson.badge}</code>
              </li>
            ))}
          </ol>
          <p className="scene-note">
            {getVideo('intro').source
              ? 'Video introductorio disponible en Recursos; puede omitirse en clase.'
              : 'Video introductorio: en preparación. Esta escena se presenta sin él.'}
          </p>
        </Scene>
      );
    case 3:
      return (
        <Scene number={3} eyebrow="Punto de partida">
          <div className="scene-split scene-split--wide-right">
            <div className="scene-stack">
              <p className="scene-lead">
                SQL es el lenguaje para <strong>pedir datos</strong> a una base de datos.
              </p>
              <ul className="scene-terms">
                <li>
                  <strong>Tabla</strong> datos organizados
                </li>
                <li className="scene-terms__row">
                  <strong>Fila</strong> un empleado
                </li>
                <li className="scene-terms__column">
                  <strong>Columna</strong> un dato de todos
                </li>
              </ul>
            </div>
            <HighlightTable
              size="large"
              caption="Tabla EMPLEADOS con una fila y una columna resaltadas"
              columns={SOURCE_COLUMNS}
              rows={SOURCE_ROWS}
              highlightedColumns={['CIUDAD']}
              highlightedRow={0}
            />
          </div>
        </Scene>
      );
    case 4:
      return (
        <Scene number={4} eyebrow="Una sola fuente">
          <HighlightTable
            size="large"
            caption="Tabla EMPLEADOS completa"
            columns={SOURCE_COLUMNS}
            rows={SOURCE_ROWS}
          />
          <ul className="scene-metrics">
            <li>
              <strong>{SOURCE_ROWS.length}</strong> filas
            </li>
            <li>
              <strong>{SOURCE_COLUMNS.length}</strong> columnas
            </li>
            <li>
              <strong>1</strong> dataset: {STUDY_DATASET.id}
            </li>
          </ul>
        </Scene>
      );
    case 5:
      return (
        <Scene number={5} eyebrow="Qué y de dónde">
          <div className="scene-split">
            <div className="scene-stack">
              <Code sql={Q.selectFrom} />
              <ul className="scene-keys">
                <li>
                  <code>SELECT</code> qué columnas mostrar
                </li>
                <li>
                  <code>FROM</code> de qué tabla salen
                </li>
              </ul>
            </div>
            <Result analysis={A.selectFrom} caption="Resultado de SELECT nombre, salario" />
          </div>
        </Scene>
      );
    case 6:
      return (
        <Scene number={6} eyebrow="Todas las columnas">
          <div className="scene-split scene-split--wide-right">
            <div className="scene-stack">
              <Code sql={Q.star} />
              <p className="scene-lead">
                <code>*</code> equivale a las {SOURCE_COLUMNS.length} columnas, en su orden.
              </p>
              <p className="scene-warning">
                Después de SELECT, * no multiplica: significa «todas».
              </p>
            </div>
            <Result analysis={A.star} caption="Resultado de SELECT *" />
          </div>
        </Scene>
      );
    case 7:
      return (
        <Scene number={7} eyebrow="El orden lo decides tú">
          <div className="scene-split">
            <div className="scene-stack">
              <Code sql={Q.cityName} />
              <Result analysis={A.cityName} caption="Resultado de SELECT ciudad, nombre" />
            </div>
            <div className="scene-stack">
              <Code sql={Q.nameCity} />
              <Result analysis={A.nameCity} caption="Resultado de SELECT nombre, ciudad" />
            </div>
          </div>
        </Scene>
      );
    case 8: {
      const first = rows(A.expressionDetail)[0];
      const [precedence, parentheses] = expressionsLesson.visualExamples;
      const value = (analysis: LabAnalysis | undefined) => {
        const cell = analysis?.preview?.rows[0]?.[0];
        return typeof cell === 'number' ? numberFormat.format(cell) : '—';
      };
      return (
        <Scene number={8} eyebrow="Calcular sin cambiar la tabla">
          <div className="scene-split">
            <div className="scene-stack">
              <Code sql={Q.expression} />
              {first && (
                <p className="scene-callout">
                  {first[0]}: {numberFormat.format(Number(first[1]))} × 12 ={' '}
                  <strong>{numberFormat.format(Number(first[2]))}</strong>
                </p>
              )}
              <ul className="scene-precedence">
                <li>
                  <code>salario + 100000 * 12</code> <span>→ {value(precedence?.analysis)}</span>
                </li>
                <li>
                  <code>(salario + 100000) * 12</code> <span>→ {value(parentheses?.analysis)}</span>
                </li>
              </ul>
            </div>
            <Result
              analysis={A.expressionDetail}
              caption="SALARIO y su cálculo anual, fila por fila"
            />
          </div>
        </Scene>
      );
    }
    case 9:
      return (
        <Scene number={9} eyebrow="Un encabezado claro">
          <Code sql={Q.alias} />
          <div className="scene-split scene-split--compare">
            <div className="scene-stack">
              <p className="scene-label">Sin alias</p>
              <Result analysis={A.noAlias} caption="Encabezado sin alias" />
            </div>
            <div className="scene-stack">
              <p className="scene-label scene-label--on">Con AS salario_anual</p>
              <Result analysis={A.alias} caption="Encabezado con alias" />
            </div>
          </div>
        </Scene>
      );
    case 10: {
      const pairs = rows(A.pairs).length;
      return (
        <Scene number={10} eyebrow="Sin filas repetidas">
          <div className="scene-split scene-split--distinct">
            <div className="scene-stack">
              <p className="scene-label">SELECT ciudad</p>
              <Result
                analysis={A.cities}
                caption="Ciudades con repeticiones"
                duplicates={duplicateIndexes(A.cities)}
              />
            </div>
            <div className="scene-arrow" aria-hidden="true">
              <strong>
                {rows(A.cities).length} → {rows(A.distinct).length}
              </strong>
              <span>→</span>
            </div>
            <div className="scene-stack">
              <Code sql={Q.distinct} />
              <Result analysis={A.distinct} caption="Ciudades distintas" />
              <p className="scene-note">
                Con <code>ciudad, depto</code> se compara el par completo: {pairs} combinaciones.
              </p>
            </div>
          </div>
        </Scene>
      );
    }
    case 11:
      return (
        <Scene number={11} eyebrow="Todo junto" tone="night">
          <Anatomy analysis={analysisOf(completeLesson.sql)} />
          <p className="scene-translation">{completeLesson.translation}</p>
        </Scene>
      );
    case 12:
      return (
        <Scene number={12} eyebrow="Práctica guiada" tone="soft">
          <div className="scene-split">
            <div className="scene-stack">
              <p className="scene-lead">Escribe, analiza y lee la consulta en el laboratorio.</p>
              <Code sql={completeLesson.sql} label="Ejemplo de partida" />
              <Link className="scene-button" href={labRoute(completeLesson.sql, 12)}>
                Abrir en el laboratorio <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ol className="scene-process">
              <li>
                <strong>Escribir</strong> la consulta en el editor
              </li>
              <li>
                <strong>Analizar</strong> sintaxis y anatomía
              </li>
              <li>
                <strong>Ver</strong> la vista educativa del resultado
              </li>
              <li>
                <strong>Ejecutar en Oracle</strong> cuando el servicio esté conectado
              </li>
            </ol>
          </div>
          <p className="scene-note">
            Hoy Oracle no está conectado: el laboratorio lo indica y nunca simula una ejecución.
          </p>
        </Scene>
      );
    case 13:
      return (
        <Scene number={13} eyebrow="Aplicar lo aprendido" tone="tech">
          <div className="scene-split">
            <div className="scene-stack">
              <p className="scene-lead">
                Diez misiones: ordenar, predecir, detectar errores y escribir SQL.
              </p>
              <Link className="scene-button scene-button--cyan" href="/challenge">
                Abrir SQL Challenge <span aria-hidden="true">→</span>
              </Link>
            </div>
            <dl className="scene-rules">
              <div>
                <dt>Misiones</dt>
                <dd>10</dd>
              </div>
              <div>
                <dt>Puntos</dt>
                <dd>{PRACTICE_RULES.maxScorePerMission * 10}</dd>
              </div>
              <div>
                <dt>Intentos</dt>
                <dd>{PRACTICE_RULES.maxScoredAttempts} por misión</dd>
              </div>
              <div>
                <dt>Pista</dt>
                <dd>−{PRACTICE_RULES.hintPenalty} puntos</dd>
              </div>
            </dl>
          </div>
        </Scene>
      );
    case 14:
      return (
        <Scene number={14} eyebrow="Para recordar">
          <div className="scene-split scene-split--summary">
            <ul className="scene-summary">
              {SUMMARY.map(([code, text]) => (
                <li key={code}>
                  <code>{code}</code>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <SummaryVideo />
          </div>
          <p className="scene-note">La chuleta imprimible está en Recursos.</p>
        </Scene>
      );
    case 15:
      return (
        <Scene number={15} eyebrow="Reto rápido" tone="soft">
          <div className="scene-split">
            <RevealAnswer />
            <SceneQr path="/challenge" />
          </div>
        </Scene>
      );
    case 16:
      return (
        <Scene number={16} eyebrow="Cierre" title="¿Preguntas?" tone="night">
          <div className="scene-closing">
            <p className="scene-closing__lead">SELECT convierte preguntas en resultados.</p>
            <nav className="scene-links" aria-label="Seguir aprendiendo">
              <Link href="/learn">Modo Estudio →</Link>
              <Link href="/lab">Laboratorio SQL →</Link>
              <Link href="/resources">Recursos y chuleta →</Link>
            </nav>
            <p className="scene-signature">
              {identity.author} · Profesor {identity.teacher} · {identity.course} ·{' '}
              {identity.institution}
            </p>
          </div>
        </Scene>
      );
    default:
      return null;
  }
}
