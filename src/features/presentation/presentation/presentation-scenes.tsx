'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { Fragment, useState, type ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { PRACTICE_RULES } from '@/features/challenge/application/challenge-api';
import {
  analyzeLabQuery,
  EMPLEADOS,
  explainQuery,
  type AnatomyRole,
  type ExplainOptions,
  type ExplainedQuery,
  type FlowTable,
} from '@/features/laboratory/application/lab-api';
import { SCENES, sceneNumber } from '../application/presentation-api';
import { getVideo } from '@/features/resources/application/resources-api';
import {
  LESSON_COUNT,
  LESSON_INDEX,
  STUDY_BLOCKS,
} from '@/features/study/application/lesson-index';
import { formatNumber } from '@/presentation/components/data/cell-format';
import { HighlightTable } from '@/presentation/components/data/highlight-table';
import { FlowTableView } from '@/presentation/components/data/query-flow';
import { SqlCode } from '@/presentation/components/data/sql-code';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { SceneQr } from './scene-qr';

/**
 * Escenas del Modo Exposición: una idea por escena, código y tablas grandes, y el patrón
 * tabla → consulta → qué hace → resultado. Todos los datos y resultados salen del motor
 * educativo sobre EMPLEADOS; ninguna escena escribe resultados a mano.
 */

type Tone = 'light' | 'soft' | 'night' | 'tech';

const MAX_ROWS = 8;

function flow(sql: string, options: ExplainOptions = {}): ExplainedQuery {
  return explainQuery(sql, { maxRows: MAX_ROWS, ...options });
}

/** Posiciones de filas de EMPLEADOS a partir de sus ID_EMPLEADO. */
const ids = (...values: number[]) => values.map((id) => id - 1);

const INTEGRATED = `SELECT nombre, departamento, salario
FROM empleados
WHERE estado = 'ACTIVO'
  AND ciudad = 'Bogotá'
  AND salario BETWEEN 3000000 AND 6000000
ORDER BY salario DESC;`;

// Consultas de las escenas, calculadas una vez.
const F = {
  selectFrom: flow('SELECT nombre, cargo\nFROM empleados;', {
    // Tres columnas: caben enteras junto al resultado en el lienzo 16:9.
    sourceColumns: ['NOMBRE', 'APELLIDO', 'CARGO'],
  }),
  cityName: flow('SELECT ciudad, nombre\nFROM empleados;', { maxRows: 6 }),
  nameCity: flow('SELECT nombre, ciudad\nFROM empleados;', { maxRows: 6 }),
  precedence: flow(
    'SELECT nombre, salario, bono,\n       salario + bono * 12 AS sin_parentesis,\n       (salario + bono) * 12 AS con_parentesis\nFROM empleados\nWHERE id_empleado IN (1, 2, 4);',
  ),
  noAlias: flow('SELECT nombre,\n       salario * 12\nFROM empleados;', { maxRows: 5 }),
  alias: flow('SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;', {
    maxRows: 5,
  }),
  distinct: flow('SELECT DISTINCT ciudad\nFROM empleados;'),
  distinctPairs: analyzeLabQuery('SELECT DISTINCT ciudad, departamento FROM empleados;'),
  where: flow("SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Cali';", {
    // La tabla de origen muestra la columna de la condición; el resultado, las del SELECT.
    sourceColumns: ['NOMBRE', 'CIUDAD'],
  }),
  greater: flow('SELECT nombre, salario\nFROM empleados\nWHERE salario >= 5000000;'),
  and: flow(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá'\n  AND salario > 5000000;",
    {
      maxRows: 5,
    },
  ),
  or: flow(
    "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali'\n   OR ciudad = 'Barranquilla';",
    {
      maxRows: 5,
    },
  ),
  withoutParentheses: flow(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá' OR ciudad = 'Medellín'\n  AND salario > 5000000;",
    { maxRows: 6 },
  ),
  withParentheses: flow(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
    { maxRows: 6 },
  ),
  between: flow(
    'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
    {
      sourceColumns: ['NOMBRE', 'SALARIO'],
      rows: ids(1, 3, 5, 6, 9, 11, 15, 18),
    },
  ),
  in: flow(
    "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Medellín', 'Cali');",
    {
      sourceColumns: ['NOMBRE', 'CIUDAD'],
      rows: ids(1, 3, 4, 7, 12, 17, 19, 20),
    },
  ),
  like: flow("SELECT nombre, apellido\nFROM empleados\nWHERE nombre LIKE '%ar%';", {
    sourceColumns: ['NOMBRE', 'APELLIDO'],
    rows: ids(1, 2, 3, 5, 8, 10, 12, 18),
  }),
  isNull: flow('SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;', {
    sourceColumns: ['NOMBRE', 'APELLIDO', 'BONO'],
    rows: ids(1, 4, 7, 10, 12, 16, 18, 20),
  }),
  equalsNull: analyzeLabQuery('SELECT nombre FROM empleados WHERE bono = NULL;'),
  zero: analyzeLabQuery('SELECT nombre FROM empleados WHERE bono = 0;'),
  orderDesc: flow('SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;'),
  orderTwo: flow(
    'SELECT departamento, nombre, salario\nFROM empleados\nORDER BY departamento ASC, salario DESC;',
  ),
  integrated: analyzeLabQuery(INTEGRATED),
};

const STEPS: readonly { readonly label: string; readonly sql: string; readonly note: string }[] = [
  {
    label: 'FROM',
    sql: 'SELECT *\nFROM empleados;',
    note: 'Partimos de la tabla completa: 20 filas y 12 columnas. Aquí, las que usaremos.',
  },
  {
    label: 'SELECT',
    sql: 'SELECT nombre, departamento, salario\nFROM empleados;',
    note: 'Solo las columnas de la pregunta.',
  },
  {
    label: 'WHERE',
    sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO';",
    note: 'Solo empleados activos.',
  },
  {
    label: 'AND',
    sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá';",
    note: 'Además, de Bogotá.',
  },
  {
    label: 'BETWEEN',
    sql: "SELECT nombre, departamento, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 3000000 AND 6000000;",
    note: 'Además, con salario en el rango.',
  },
  { label: 'ORDER BY', sql: INTEGRATED, note: 'Del mayor al menor salario.' },
];

// Columnas de EMPLEADOS que usa la consulta final: el paso FROM muestra la tabla con ellas
// para que quepa en la escena (SELECT * tendría 12 columnas).
const STEP_COLUMNS = ['NOMBRE', 'DEPARTAMENTO', 'CIUDAD', 'ESTADO', 'SALARIO'];

const STEP_FLOWS = STEPS.map((step, index) => {
  const explained = flow(step.sql, {
    maxRows: 6,
    ...(index === 0 ? { sourceColumns: STEP_COLUMNS } : {}),
  });
  return { ...step, explained, table: index === 0 ? explained.source : explained.result };
});

function labRoute(sql: string, scene: string): Route {
  return `/lab?${new URLSearchParams({ sql, returnTo: `/presentation?scene=${sceneNumber(scene)}` }).toString()}` as Route;
}

function Scene({
  id,
  eyebrow,
  title,
  tone = 'light',
  children,
}: {
  readonly id: string;
  readonly eyebrow: string;
  /** Título visible; por defecto, el del guion de escenas. */
  readonly title?: string;
  readonly tone?: Tone;
  readonly children: ReactNode;
}) {
  const number = sceneNumber(id);
  return (
    <article
      className={`scene scene--${tone}`}
      aria-labelledby={`scene-title-${number}`}
      data-scene={number}
      data-scene-id={id}
    >
      <header className="scene__header">
        <span className="scene__number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
        <div>
          <p className="scene__eyebrow">{eyebrow}</p>
          <h1 id={`scene-title-${number}`} className="scene__title" tabIndex={-1}>
            {title ?? SCENES[number - 1]?.title}
          </h1>
        </div>
      </header>
      <div className="scene__body">{children}</div>
    </article>
  );
}

function Code({ sql, label }: { readonly sql: string; readonly label?: string }) {
  return <SqlCode sql={sql} size="large" {...(label ? { label } : {})} />;
}

function Table({
  table,
  caption,
  summary,
}: {
  readonly table: FlowTable;
  readonly caption: string;
  readonly summary?: string;
}) {
  return (
    <FlowTableView table={table} caption={caption} size="large" {...(summary ? { summary } : {})} />
  );
}

/** Flecha con la transformación: «20 → 5». */
function Arrow({
  from,
  to,
  label,
}: {
  readonly from: number;
  readonly to: number;
  readonly label: string;
}) {
  return (
    <div className="scene-arrow" role="img" aria-label={`${label}: de ${from} a ${to} filas`}>
      <strong>
        {from} → {to}
      </strong>
      <span aria-hidden="true">→</span>
      <em>{label}</em>
    </div>
  );
}

/** Bloque «Qué hace» de una escena: una o dos frases. */
function What({ children }: { readonly children: ReactNode }) {
  return (
    <p className="scene-what">
      <span>Qué hace</span> {children}
    </p>
  );
}

function Count({ explained }: { readonly explained: ExplainedQuery }) {
  return (
    <p className="scene-count">
      <strong>{explained.counts.result}</strong> de {explained.counts.source} filas
    </p>
  );
}

/* ---------- Anatomía ---------- */

const ROLE_LABEL: Partial<Record<AnatomyRole, string>> = {
  select: 'Qué columnas',
  from: 'De qué tabla',
  where: 'Qué filas',
  order: 'En qué orden',
};

function Anatomy({ sql }: { readonly sql: string }) {
  const analysis = analyzeLabQuery(sql);
  const parts = analysis.anatomy.filter((part) => part.role !== 'terminator');
  const segments: ReactNode[] = [];
  let position = 0;
  parts.forEach((part, index) => {
    if (part.span.start > position) {
      segments.push(<Fragment key={`t-${index}`}>{sql.slice(position, part.span.start)}</Fragment>);
    }
    segments.push(
      <span key={`p-${index}`} className={`anatomy-part anatomy-part--${part.role}`}>
        {sql.slice(part.span.start, part.span.end)}
      </span>,
    );
    position = part.span.end;
  });
  segments.push(<Fragment key="end">{sql.slice(position)}</Fragment>);
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
            <strong>
              <code>{part.label}</code> {ROLE_LABEL[part.role]}
            </strong>
            <span>{part.explanation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Escenas interactivas ---------- */

function BuildStepper() {
  const [step, setStep] = useState(0);
  const current = STEP_FLOWS[step]!;
  return (
    <div className="scene-stepper">
      <ol className="scene-stepper__track" aria-label="Pasos">
        {STEP_FLOWS.map((entry, index) => (
          <li
            key={entry.label}
            className={index === step ? 'is-current' : index < step ? 'is-done' : ''}
          >
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
            >
              <span aria-hidden="true">{index + 1}</span> {entry.label}
            </button>
          </li>
        ))}
      </ol>
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code sql={current.sql} label={`Paso ${step + 1} · ${current.label}`} />
          <What>{current.note}</What>
          <p className="scene-count" role="status">
            <strong>{current.explained.counts.result}</strong> de {current.explained.counts.source}{' '}
            filas
          </p>
          <div className="scene-stepper__buttons">
            <button
              type="button"
              className="scene-button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              ← Paso anterior
            </button>
            <button
              type="button"
              className="scene-button scene-button--cyan"
              disabled={step === STEP_FLOWS.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Paso siguiente →
            </button>
          </div>
        </div>
        {current.table && (
          <Table
            table={current.table}
            caption={step === 0 ? 'Tabla EMPLEADOS de origen' : `Resultado del paso ${step + 1}`}
          />
        )}
      </div>
    </div>
  );
}

const QUIZ_SQL = "SELECT DISTINCT departamento\nFROM empleados\nWHERE ciudad = 'Bogotá';";

function RevealAnswer() {
  const [shown, setShown] = useState(false);
  const answer = (analyzeLabQuery(QUIZ_SQL).preview?.rows ?? []).map((row) => String(row[0]));
  return (
    <div className="scene-quiz">
      <p className="scene-quiz__question">¿Cuántas filas devuelve esta consulta?</p>
      <Code sql={QUIZ_SQL} />
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
      orientation={video.orientation}
      source={video.source}
      poster={video.poster}
      captions={video.captions}
      transcriptUrl={video.transcriptUrl}
    />
  );
}

/* ---------- Contenido fijo ---------- */

const LEARNED: readonly (readonly [string, string])[] = [
  ['SELECT … FROM', 'qué columnas y de qué tabla'],
  ['*', 'todas las columnas'],
  ['a, b', 'columnas en el orden pedido'],
  ['salario * 12', 'un cálculo por fila'],
  ['( )', 'cambian la precedencia'],
  ['AS alias', 'encabezado temporal'],
  ['||', 'une textos'],
  ['DISTINCT', 'sin filas repetidas'],
  ['WHERE', 'qué filas conservar'],
  ['= <> > <', 'comparar valores'],
  ['AND · OR', 'combinar condiciones'],
  ['BETWEEN', 'rango con límites'],
  ['IN ( )', 'lista de valores'],
  ['LIKE', '% varios, _ uno'],
  ['IS NULL', 'sin valor; nunca = NULL'],
  ['ORDER BY', 'ASC y DESC'],
];

const ERRORS: readonly (readonly [string, string, string])[] = [
  ['SELECT nombre salario', 'SELECT nombre, salario', 'Falta la coma'],
  ['WHERE ciudad = Cali', "WHERE ciudad = 'Cali'", 'Textos entre comillas simples'],
  ['WHERE bono = NULL', 'WHERE bono IS NULL', 'NULL no se compara con ='],
  ['BETWEEN 6000000 AND 3000000', 'BETWEEN 3000000 AND 6000000', 'El menor va primero'],
  ["IN 'Bogotá', 'Cali'", "IN ('Bogotá', 'Cali')", 'La lista va entre paréntesis'],
  ['LIKE A%', "LIKE 'A%'", 'El patrón es un texto'],
];

const OPERATORS: readonly (readonly [string, string])[] = [
  ['=', 'igual'],
  ['<> · !=', 'distinto'],
  ['>', 'mayor'],
  ['>=', 'mayor o igual'],
  ['<', 'menor'],
  ['<=', 'menor o igual'],
];

const ROADMAP: readonly {
  readonly stage: string;
  readonly title: string;
  readonly items: string;
}[] = [
  {
    stage: 'Ahora',
    title: 'SELECT fundamental',
    items: 'SELECT · WHERE · BETWEEN · IN · LIKE · NULL · ORDER BY',
  },
  {
    stage: 'Siguiente nivel',
    title: 'Funciones y agrupación',
    items: 'UPPER · LOWER · ROUND · NVL · COUNT · SUM · AVG · GROUP BY · HAVING',
  },
  {
    stage: 'Más adelante',
    title: 'Varias tablas y cambios',
    items: 'JOIN · subconsultas · INSERT · UPDATE · DELETE · COMMIT · ROLLBACK · CREATE TABLE',
  },
];

const SOURCE_COLUMNS = EMPLEADOS.columns.map(({ name, type }) => ({ name, type }));
const PREVIEW_COLUMNS = [
  'ID_EMPLEADO',
  'NOMBRE',
  'APELLIDO',
  'DEPARTAMENTO',
  'CIUDAD',
  'SALARIO',
  'BONO',
];

function datasetPreview(names: readonly string[], rows: number) {
  const columns = SOURCE_COLUMNS.filter(({ name }) => names.includes(name));
  return {
    columns,
    rows: EMPLEADOS.rows
      .slice(0, rows)
      .map((row) => columns.map(({ name }) => row[name as keyof typeof row] ?? null)),
  };
}

/* ---------- Escenas ---------- */

const RENDER: Readonly<Record<string, () => ReactNode>> = {
  portada: () => (
    <Scene
      id="portada"
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
  ),
  ruta: () => (
    <Scene
      id="ruta"
      eyebrow={`${STUDY_BLOCKS.length} bloques · ${LESSON_COUNT} lecciones`}
      tone="soft"
    >
      <ol className="scene-blocks">
        {STUDY_BLOCKS.map((block) => (
          <li key={block.id}>
            <span className="scene-blocks__letter" aria-hidden="true">
              {block.letter}
            </span>
            <strong>{block.title}</strong>
            <span className="scene-blocks__badges">
              {LESSON_INDEX.filter((lesson) => lesson.block === block.id)
                .map((lesson) => lesson.badge)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ol>
      <p className="scene-note">
        Cada escena tiene su lección en el Modo Estudio, con más detalle, ejemplos y una
        comprobación.
      </p>
    </Scene>
  ),
  'que-es-sql': () => {
    const preview = datasetPreview(['ID_EMPLEADO', 'NOMBRE', 'CIUDAD', 'SALARIO'], 5);
    return (
      <Scene id="que-es-sql" eyebrow="Punto de partida">
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
            <p className="scene-note">
              <strong>Consultar</strong> (SELECT) es esta unidad. <strong>Modificar</strong>{' '}
              (INSERT, UPDATE, DELETE) llega en el Nivel 6.
            </p>
          </div>
          <HighlightTable
            size="large"
            caption="Tabla EMPLEADOS con una fila y una columna resaltadas"
            columns={preview.columns}
            rows={preview.rows}
            highlightedColumns={['CIUDAD']}
            highlightedRow={0}
            summary="5 de 20 filas"
          />
        </div>
      </Scene>
    );
  },
  empleados: () => {
    const preview = datasetPreview(PREVIEW_COLUMNS, MAX_ROWS);
    return (
      <Scene id="empleados" eyebrow="La única tabla de la unidad">
        <HighlightTable
          size="large"
          caption="Primeras filas de EMPLEADOS"
          columns={preview.columns}
          rows={preview.rows}
          summary={`${MAX_ROWS} de ${EMPLEADOS.rows.length} filas · ${PREVIEW_COLUMNS.length} de ${EMPLEADOS.columns.length} columnas`}
        />
        <ul className="scene-metrics">
          <li>
            <strong>{EMPLEADOS.rows.length}</strong> empleados
          </li>
          <li>
            <strong>{EMPLEADOS.columns.length}</strong> columnas
          </li>
          <li>
            <strong>NUMBER · VARCHAR2 · DATE</strong> tipos
          </li>
          <li>
            SALARIO y BONO <strong>mensuales</strong>; BONO puede ser <strong>NULL</strong>
          </li>
        </ul>
      </Scene>
    );
  },
  'select-from': () => (
    <Scene id="select-from" eyebrow="Qué y de dónde">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code sql={F.selectFrom.sql} />
          <ul className="scene-keys">
            <li>
              <code>SELECT</code> qué columnas mostrar
            </li>
            <li>
              <code>FROM</code> de qué tabla salen
            </li>
          </ul>
          <What>Conserva las 20 filas y solo 2 columnas.</What>
        </div>
        <div className="scene-pair">
          <Table table={F.selectFrom.source} caption="Tabla original" />
          <Table table={F.selectFrom.result!} caption="Resultado" />
        </div>
      </div>
    </Scene>
  ),
  asterisco: () => (
    <Scene id="asterisco" eyebrow="Todas las columnas">
      <div className="scene-split">
        <div className="scene-stack">
          <Code sql={'SELECT *\nFROM empleados;'} />
          <p className="scene-lead">
            <code>*</code> = las {EMPLEADOS.columns.length} columnas, en su orden.
          </p>
          <ul className="scene-pros">
            <li className="scene-pros__yes">
              <span aria-hidden="true">✓</span> Explorar una tabla nueva
            </li>
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> En consultas finales: pide solo lo que necesitas
            </li>
          </ul>
        </div>
        <ul className="scene-columns" aria-label="Columnas que expande el asterisco">
          {EMPLEADOS.columns.map((column, index) => (
            <li key={column.name}>
              <span aria-hidden="true">{index + 1}</span> <code>{column.name}</code>
            </li>
          ))}
        </ul>
      </div>
    </Scene>
  ),
  columnas: () => (
    <Scene id="columnas" eyebrow="La coma separa; el orden lo decides tú">
      <div className="scene-split">
        <div className="scene-stack">
          <Code sql={F.cityName.sql} />
          <Table table={F.cityName.result!} caption="Resultado de SELECT ciudad, nombre" />
        </div>
        <div className="scene-stack">
          <Code sql={F.nameCity.sql} />
          <Table table={F.nameCity.result!} caption="Resultado de SELECT nombre, ciudad" />
        </div>
      </div>
    </Scene>
  ),
  expresiones: () => {
    const ana = EMPLEADOS.rows[0]!;
    return (
      <Scene id="expresiones" eyebrow="Calcular sin cambiar la tabla">
        <div className="scene-split scene-split--flow">
          <div className="scene-stack">
            <p className="scene-callout">
              {ana.NOMBRE}: {formatNumber(ana.SALARIO)} × 12 ={' '}
              <strong>{formatNumber(ana.SALARIO * 12)}</strong>
            </p>
            <ul className="scene-precedence">
              <li>
                <code>salario + bono * 12</code> <span>primero bono × 12</span>
              </li>
              <li>
                <code>(salario + bono) * 12</code> <span>primero la suma</span>
              </li>
            </ul>
            <What>* y / van antes que + y -. Con NULL, el cálculo da NULL.</What>
          </div>
          <Table table={F.precedence.result!} caption="Precedencia con y sin paréntesis" />
        </div>
      </Scene>
    );
  },
  alias: () => (
    <Scene id="alias" eyebrow="Un nombre temporal para el resultado">
      <Code sql={F.alias.sql} />
      <div className="scene-split scene-split--compare">
        <div className="scene-stack">
          <p className="scene-label">Antes · sin alias</p>
          <Table table={F.noAlias.result!} caption="Encabezado sin alias" />
        </div>
        <div className="scene-stack">
          <p className="scene-label scene-label--on">Después · con AS salario_anual</p>
          <Table table={F.alias.result!} caption="Encabezado con alias" />
        </div>
        <ul className="scene-facts">
          <li>
            <strong>Alias:</strong> nombre temporal de una columna del resultado
          </li>
          <li>
            <strong>AS:</strong> la palabra, opcional, que lo asigna
          </li>
          <li>
            <strong>No cambia</strong> la tabla ni sus datos: SALARIO sigue igual
          </li>
        </ul>
      </div>
    </Scene>
  ),
  distinct: () => (
    <Scene id="distinct" eyebrow="Sin filas repetidas">
      <div className="scene-split scene-split--distinct">
        <div className="scene-stack">
          <p className="scene-label">SELECT ciudad</p>
          <Table table={F.distinct.beforeDistinct!} caption="Ciudades con repeticiones" />
        </div>
        <Arrow from={F.distinct.counts.source} to={F.distinct.counts.result} label="DISTINCT" />
        <div className="scene-stack">
          <Code sql={F.distinct.sql} />
          <Table table={F.distinct.result!} caption="Ciudades distintas" />
          <p className="scene-note">
            Compara la fila completa: <code>DISTINCT ciudad, departamento</code> da{' '}
            {F.distinctPairs.preview?.rows.length} pares. No ordena y no borra datos.
          </p>
        </div>
      </div>
    </Scene>
  ),
  where: () => (
    <Scene id="where" eyebrow="Decide qué filas se conservan">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code sql={F.where.sql} />
          <What>Revisa cada fila: si la ciudad es Cali, pasa; si no, se descarta.</What>
          <Count explained={F.where} />
        </div>
        <div className="scene-pair">
          <Table table={F.where.source} caption="Tabla original con la condición" />
          <Table table={F.where.result!} caption="Filas que cumplen" />
        </div>
      </div>
    </Scene>
  ),
  comparaciones: () => (
    <Scene id="comparaciones" eyebrow="Igual, distinto, mayor, menor">
      <div className="scene-split">
        <div className="scene-stack">
          <ul className="scene-operators">
            {OPERATORS.map(([operator, meaning]) => (
              <li key={operator}>
                <code>{operator}</code> <span>{meaning}</span>
              </li>
            ))}
          </ul>
          <ul className="scene-quotes">
            <li className="scene-pros__yes">
              <span aria-hidden="true">✓</span> <code>ciudad = &apos;Cali&apos;</code> texto
            </li>
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> <code>ciudad = Cali</code> busca una columna
            </li>
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> <code>ciudad = &quot;Cali&quot;</code> es un nombre
            </li>
          </ul>
        </div>
        <div className="scene-stack">
          <Code sql={F.greater.sql} />
          <Table table={F.greater.result!} caption="Salario mayor o igual que 5.000.000" />
        </div>
      </div>
    </Scene>
  ),
  'and-or': () => (
    <Scene id="and-or" eyebrow="Combinar condiciones">
      <div className="scene-split">
        <div className="scene-stack">
          <p className="scene-label scene-label--on">AND · se cumplen las dos</p>
          <Code sql={F.and.sql} />
          <Table table={F.and.result!} caption="Resultado con AND" />
        </div>
        <div className="scene-stack">
          <p className="scene-label">OR · basta con una</p>
          <Code sql={F.or.sql} />
          <Table table={F.or.result!} caption="Resultado con OR" />
        </div>
      </div>
    </Scene>
  ),
  parentesis: () => (
    <Scene id="parentesis" eyebrow="AND se evalúa antes que OR">
      <div className="scene-split">
        <div className="scene-stack">
          <p className="scene-label">Sin paréntesis · {F.withoutParentheses.counts.result} filas</p>
          <Code sql={F.withoutParentheses.sql} />
          <p className="scene-warning">
            Oracle lee: Bogotá <strong>OR</strong> (Medellín <strong>AND</strong> salario &gt;
            5000000).
          </p>
          <Table table={F.withoutParentheses.result!} caption="Resultado sin paréntesis" />
        </div>
        <div className="scene-stack">
          <p className="scene-label scene-label--on">
            Con paréntesis · {F.withParentheses.counts.result} filas
          </p>
          <Code sql={F.withParentheses.sql} />
          <Table table={F.withParentheses.result!} caption="Resultado con paréntesis" />
        </div>
      </div>
    </Scene>
  ),
  between: () => (
    <Scene id="between" eyebrow="Rangos con los límites incluidos">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code sql={F.between.sql} />
          <What>
            Equivale a <code>salario &gt;= 3000000 AND salario &lt;= 6000000</code>. El menor va
            primero.
          </What>
          <Count explained={F.between} />
        </div>
        <div className="scene-pair">
          <Table table={F.between.source} caption="Salarios dentro y fuera del rango" />
          <Table table={F.between.result!} caption="Dentro del rango" />
        </div>
      </div>
    </Scene>
  ),
  in: () => (
    <Scene id="in" eyebrow="Una lista en lugar de varios OR">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code
            label="Con OR"
            sql={"WHERE ciudad = 'Bogotá'\n   OR ciudad = 'Medellín'\n   OR ciudad = 'Cali'"}
          />
          <Code label="Con IN" sql={"WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')"} />
          <Count explained={F.in} />
        </div>
        <Table table={F.in.source} caption="Ciudades en la lista y fuera de ella" />
      </div>
    </Scene>
  ),
  like: () => (
    <Scene id="like" eyebrow="Patrones de texto">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <Code sql={F.like.sql} />
          <ul className="scene-patterns">
            <li>
              <code>&apos;A%&apos;</code> empieza por A
            </li>
            <li>
              <code>&apos;%a&apos;</code> termina en a
            </li>
            <li>
              <code>&apos;%ar%&apos;</code> contiene ar
            </li>
            <li>
              <code>&apos;_o%&apos;</code> o en la 2.ª posición
            </li>
          </ul>
          <What>
            % = cualquier cantidad de caracteres; _ = exactamente uno. Distingue mayúsculas.
          </What>
        </div>
        <Table table={F.like.source} caption="Nombres que contienen ar" />
      </div>
    </Scene>
  ),
  null: () => (
    <Scene id="null" eyebrow="Ausencia de valor">
      <div className="scene-split scene-split--flow">
        <div className="scene-stack">
          <p className="scene-lead">
            <strong>NULL</strong> no es 0 ni un texto vacío: es que no hay valor.
          </p>
          <Code sql={F.isNull.sql} />
          <ul className="scene-null">
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> <code>bono = NULL</code>{' '}
              <span>{F.equalsNull.preview?.rows.length ?? 0} filas: nunca es verdadero</span>
            </li>
            <li className="scene-pros__yes">
              <span aria-hidden="true">✓</span> <code>bono IS NULL</code>{' '}
              <span>{F.isNull.counts.result} filas sin bono</span>
            </li>
            <li>
              <span aria-hidden="true">·</span> <code>bono = 0</code>{' '}
              <span>{F.zero.preview?.rows.length ?? 0} fila: 0 sí es un valor</span>
            </li>
          </ul>
        </div>
        <Table table={F.isNull.source} caption="BONO con valores y sin valor" />
      </div>
    </Scene>
  ),
  'order-by': () => (
    <Scene id="order-by" eyebrow="Ordenar el resultado">
      <div className="scene-split">
        <div className="scene-stack">
          <Code sql={F.orderDesc.sql} />
          <Table table={F.orderDesc.result!} caption="Del salario más alto al más bajo" />
        </div>
        <div className="scene-stack">
          <Code sql={F.orderTwo.sql} />
          <Table table={F.orderTwo.result!} caption="Por departamento y, dentro, por salario" />
          <p className="scene-note">
            ASC es el valor por defecto. DISTINCT quita repetidas; ORDER BY ordena.
          </p>
        </div>
      </div>
    </Scene>
  ),
  anatomia: () => (
    <Scene id="anatomia" eyebrow="Todo junto" tone="night">
      <Anatomy sql={INTEGRATED} />
      <div className="scene-orders">
        <p>
          <span>Se escribe</span> SELECT → FROM → WHERE → ORDER BY
        </p>
        <p>
          <span>Se entiende</span> FROM → WHERE → SELECT → ORDER BY
        </p>
        <p className="scene-orders__note">
          Es un modelo mental: Oracle puede ejecutarla con otro plan y obtiene el mismo resultado.
        </p>
      </div>
    </Scene>
  ),
  'paso-a-paso': () => (
    <Scene
      id="paso-a-paso"
      eyebrow="Activos de Bogotá con salario entre 3 y 6 millones, del mayor al menor"
    >
      <BuildStepper />
    </Scene>
  ),
  errores: () => (
    <Scene id="errores" eyebrow="Reconocer y corregir">
      <ul className="scene-errors">
        {ERRORS.map(([wrong, right, why]) => (
          <li key={wrong}>
            <code className="scene-errors__wrong">
              <span aria-hidden="true">✗ </span>
              {wrong}
            </code>
            <code className="scene-errors__right">
              <span aria-hidden="true">✓ </span>
              {right}
            </code>
            <span>{why}</span>
          </li>
        ))}
      </ul>
    </Scene>
  ),
  laboratorio: () => (
    <Scene id="laboratorio" eyebrow="Práctica guiada" tone="soft">
      <div className="scene-split">
        <div className="scene-stack">
          <p className="scene-lead">Escribe, analiza y ejecuta en Oracle.</p>
          <Code sql={INTEGRATED} label="Ejemplo de partida" />
          <Link className="scene-button" href={labRoute(INTEGRATED, 'laboratorio')}>
            Abrir en el laboratorio <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ol className="scene-process">
          <li>
            <strong>Diagnóstico</strong> con línea, fragmento y corrección posible
          </li>
          <li>
            <strong>Tipos de aviso</strong>: sintaxis, semántica, alcance, Oracle y advertencia
          </li>
          <li>
            <strong>Vista educativa</strong> y lectura en español
          </li>
          <li>
            <strong>Ejecución real</strong> en Oracle Database
          </li>
        </ol>
      </div>
    </Scene>
  ),
  challenge: () => (
    <Scene id="challenge" eyebrow="Aplicar lo aprendido" tone="tech">
      <div className="scene-split">
        <div className="scene-stack">
          <p className="scene-lead">
            Diez misiones: elegir columnas, ordenar piezas, predecir filas, detectar errores y
            escribir la consulta final.
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
  ),
  aprendimos: () => (
    <Scene id="aprendimos" eyebrow="Para recordar">
      <ul className="scene-summary">
        {LEARNED.map(([code, text]) => (
          <li key={code}>
            <code>{code}</code>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <p className="scene-note">La chuleta imprimible está en Recursos.</p>
    </Scene>
  ),
  video: () => (
    <Scene id="video" eyebrow="Repaso en video">
      <div className="scene-split scene-split--summary">
        <SummaryVideo />
        <p className="scene-note">
          El video repasa la primera parte de la unidad: SELECT, FROM, *, cálculos, AS y DISTINCT.
          Puede verse después de clase.
        </p>
      </div>
    </Scene>
  ),
  reto: () => (
    <Scene id="reto" eyebrow="Reto rápido" tone="soft">
      <div className="scene-split">
        <RevealAnswer />
        <SceneQr path="/challenge" />
      </div>
    </Scene>
  ),
  proximos: () => (
    <Scene id="proximos" eyebrow="La ruta continúa">
      <ol className="scene-roadmap">
        {ROADMAP.map((entry) => (
          <li key={entry.stage}>
            <span className="scene-roadmap__stage">{entry.stage}</span>
            <strong>{entry.title}</strong>
            <span>{entry.items}</span>
          </li>
        ))}
      </ol>
      <p className="scene-note">
        Cada tema futuro ya tiene su ficha en <Link href="/modules">la ruta de aprendizaje</Link>.
      </p>
    </Scene>
  ),
  cierre: () => (
    <Scene id="cierre" eyebrow="Cierre" title="¿Preguntas?" tone="night">
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
  ),
};

export function renderScene(scene: number): ReactNode {
  const outline = SCENES[scene - 1];
  return outline ? (RENDER[outline.id]?.() ?? null) : null;
}

/** Identificadores de escena con contenido (para pruebas de coherencia). */
export const RENDERED_SCENES = Object.keys(RENDER);
