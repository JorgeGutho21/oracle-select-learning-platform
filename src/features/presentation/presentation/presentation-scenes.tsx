'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useState, type ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { EMPLEADOS_FIELD_GROUP_LIST, EMPLEADOS_SCHEMA_COLUMNS } from '@/application/dataset-view';
import { SQL_CONCEPTS, type ConceptId } from '@/application/sql-concepts';
import { MISSION_OVERVIEW, PRACTICE_RULES } from '@/features/challenge/application/challenge-api';
import {
  analyzeLabQuery,
  EMPLEADOS,
  explainQuery,
  type ExplainOptions,
  type ExplainedQuery,
} from '@/features/laboratory/application/lab-api';
import { CURRICULUM_LEVELS } from '@/features/modules/application/modules-api';
import { getVideo } from '@/features/resources/application/resources-api';
import { formatNumber } from '@/presentation/components/data/cell-format';
import { HighlightTable } from '@/presentation/components/data/highlight-table';
import { SchemaCards } from '@/presentation/components/data/schema-cards';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { SCENES, sceneNumber } from '../application/presentation-api';
import { Code, CountFlow, Data, LinkedQuery, NameChips, Reveal, Scene } from './scene-kit';
import { SceneQr } from './scene-qr';
import {
  ColumnGrid,
  ComparatorScale,
  ErrorCard,
  ExpressionCard,
  LevelRoadmap,
  ListChips,
  LogicPanel,
  MetricStrip,
  MissionPath,
  PatternCard,
  RangeLine,
  RouteMap,
  SqlAnatomy,
  SqlJourney,
  StepFlow,
  type AnatomyClause,
  type RouteStage,
} from './scene-visuals';

/**
 * Escenas del Modo Exposición: una idea por escena con la misma plantilla (definición o
 * propósito, SQL, visualización del cambio sobre los datos, resultado e idea clave). Todos
 * los datos, recuentos y resultados salen del motor educativo sobre EMPLEADOS; ninguna
 * escena escribe resultados a mano. Cada tabla muestra solo las columnas del concepto.
 */

const MAX_ROWS = 6;

function flow(sql: string, options: ExplainOptions = {}): ExplainedQuery {
  return explainQuery(sql, { maxRows: MAX_ROWS, ...options });
}

/** Posiciones de filas de EMPLEADOS a partir de sus ID_EMPLEADO. */
const ids = (...values: number[]) => values.map((id) => id - 1);

/** Primera columna del resultado de una consulta (nombres, ciudades…). */
function firstColumn(sql: string): string[] {
  return (analyzeLabQuery(sql).preview?.rows ?? []).map((row) => String(row[0] ?? ''));
}

/** ID_EMPLEADO de las filas que cumplen una condición, según el motor. */
function matching(condition: string): Set<number> {
  const sql = ['SELECT id_empleado', 'FROM empleados', `WHERE ${condition};`].join('\n');
  return new Set((analyzeLabQuery(sql).preview?.rows ?? []).map((row) => Number(row[0])));
}

function rowCount(sql: string): number {
  return analyzeLabQuery(sql).preview?.rows.length ?? 0;
}

const nameOf = (id: number) => EMPLEADOS.rows[id - 1]!.NOMBRE;

const INTEGRATED =
  "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 4000000 AND 8000000\nORDER BY salario DESC;";

const INTEGRATED_QUESTION =
  'Quiero ver nombre, ciudad y salario de los empleados activos de Bogotá con salarios entre 4 y 8 millones, del mayor al menor.';

// Consultas de las escenas, calculadas una vez.
const F = {
  journey: firstColumn("SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';"),
  selectFrom: flow('SELECT nombre, cargo\nFROM empleados;', {
    sourceColumns: ['NOMBRE', 'APELLIDO', 'CARGO'],
    maxRows: 5,
  }),
  cityName: flow('SELECT ciudad, nombre\nFROM empleados;', { maxRows: 5 }),
  nameCity: flow('SELECT nombre, ciudad\nFROM empleados;', { maxRows: 5 }),
  precedence: flow(
    'SELECT nombre, salario, bono,\n       salario + bono * 12 AS sin_parentesis,\n       (salario + bono) * 12 AS con_parentesis\nFROM empleados\nWHERE id_empleado IN (1, 2, 4);',
  ),
  noAlias: flow('SELECT nombre,\n       salario * 12\nFROM empleados;', { maxRows: 3 }),
  alias: flow('SELECT nombre,\n       salario * 12 AS salario_anual\nFROM empleados;', {
    maxRows: 3,
  }),
  distinct: flow('SELECT DISTINCT ciudad\nFROM empleados;', { maxRows: 7 }),
  distinctPairs: rowCount('SELECT DISTINCT ciudad, departamento FROM empleados;'),
  where: flow("SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad = 'Cali';", {
    sourceColumns: ['NOMBRE', 'CIUDAD'],
    rows: ids(1, 4, 8, 11, 12),
  }),
  withoutParentheses: firstColumn(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá' OR ciudad = 'Medellín'\n  AND salario > 5000000;",
  ),
  withParentheses: firstColumn(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
  ),
  between: flow(
    'SELECT nombre, salario\nFROM empleados\nWHERE salario BETWEEN 3000000 AND 6000000;',
    {
      sourceColumns: ['NOMBRE', 'SALARIO'],
      rows: ids(11, 9, 3, 15),
    },
  ),
  betweenIds: matching('salario BETWEEN 3000000 AND 6000000'),
  in: flow(
    "SELECT nombre, ciudad\nFROM empleados\nWHERE ciudad IN ('Bogotá', 'Medellín', 'Cali');",
    {
      sourceColumns: ['NOMBRE', 'CIUDAD'],
      rows: ids(1, 3, 4, 12, 17, 19, 20),
    },
  ),
  likeStarts: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE 'A%';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(1, 6, 2),
  }),
  likeContains: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE '%ar%';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(2, 3, 5),
  }),
  likeSecond: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE '_a%';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(3, 5, 1),
  }),
  isNull: flow('SELECT nombre, bono\nFROM empleados\nWHERE bono IS NULL;', {
    sourceColumns: ['NOMBRE', 'BONO'],
    rows: ids(1, 4, 7, 10, 12, 16, 18),
  }),
  equalsNull: rowCount('SELECT nombre FROM empleados WHERE bono = NULL;'),
  zero: rowCount('SELECT nombre FROM empleados WHERE bono = 0;'),
  original: flow('SELECT nombre, salario\nFROM empleados;', { maxRows: 5 }),
  orderDesc: flow('SELECT nombre, salario\nFROM empleados\nORDER BY salario DESC;', {
    maxRows: 5,
  }),
  integrated: flow(INTEGRATED),
};

const STEPS: readonly { readonly label: string; readonly sql: string; readonly note: string }[] = [
  {
    label: 'FROM',
    sql: 'SELECT *\nFROM empleados;',
    note: 'Partimos de la tabla completa: 20 filas y 12 columnas. Aquí, las que usaremos.',
  },
  {
    label: 'SELECT',
    sql: 'SELECT nombre, ciudad, salario\nFROM empleados;',
    note: 'Solo las columnas de la pregunta.',
  },
  {
    label: 'WHERE',
    sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE estado = 'ACTIVO';",
    note: 'Solo empleados activos.',
  },
  {
    label: 'AND',
    sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá';",
    note: 'Además, de Bogotá.',
  },
  {
    label: 'BETWEEN',
    sql: "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 4000000 AND 8000000;",
    note: 'Además, con salario entre 4 y 8 millones.',
  },
  { label: 'ORDER BY', sql: INTEGRATED, note: 'Del mayor al menor salario.' },
];

// La tabla de partida muestra las columnas que usa la consulta final (SELECT * tendría 12).
const STEP_COLUMNS = ['NOMBRE', 'CIUDAD', 'ESTADO', 'SALARIO'];

const STEP_FLOWS = STEPS.map((step, index) => {
  const explained = flow(step.sql, index === 0 ? { sourceColumns: STEP_COLUMNS } : {});
  return { ...step, explained, table: index === 0 ? explained.source : explained.result };
});

function labRoute(sql: string, scene: string): Route {
  return `/lab?${new URLSearchParams({ sql, returnTo: `/presentation?scene=${sceneNumber(scene)}` }).toString()}` as Route;
}

/** Bloque «Qué hace» de una escena: una o dos frases. */
function What({ children }: { readonly children: ReactNode }) {
  return (
    <p className="scene-what">
      <span>Qué hace</span> {children}
    </p>
  );
}

function rows(count: number, total: number = EMPLEADOS.rows.length): string {
  return `${count} de ${total} filas`;
}

/* ---------- Contenido fijo ---------- */

/** Los ocho bloques de la ruta (escenas 02 y 25), con los conceptos de cada uno. */
const ROUTE: readonly RouteStage[] = [
  { title: 'Fundamentos', glyph: '▦', concepts: 'SQL · tabla · fila · columna' },
  { title: 'Consulta', glyph: '▤', concepts: 'SELECT · FROM · * · expresiones · AS' },
  { title: 'Duplicados', glyph: '◎', concepts: 'DISTINCT' },
  { title: 'Filtrar', glyph: '▽', concepts: 'WHERE · comparadores · AND · OR' },
  { title: 'Operadores', glyph: '⋯', concepts: 'BETWEEN · IN · LIKE' },
  { title: 'Ausencia de datos', glyph: '∅', concepts: 'NULL · IS NULL' },
  { title: 'Ordenar', glyph: '⇅', concepts: 'ORDER BY · ASC · DESC' },
  { title: 'Integrar', glyph: '✓', concepts: 'consulta completa · errores · Lab · Challenge' },
];

const COMPARE_VALUE = 4200000;

const COMPARATORS: readonly (readonly [string, string])[] = [
  ['<', 'menor'],
  ['<=', 'menor o igual'],
  ['=', 'igual'],
  ['>=', 'mayor o igual'],
  ['>', 'mayor'],
  ['<>', 'distinto'],
];

const COMPARATOR_ITEMS = COMPARATORS.map(([operator, meaning]) => {
  const condition = `salario ${operator} ${COMPARE_VALUE}`;
  return { operator, meaning, condition, count: matching(condition).size };
});

function logicExamples(a: string, b: string, operator: 'AND' | 'OR', people: readonly number[]) {
  const first = matching(a);
  const second = matching(b);
  return people.map((id) => {
    const inA = first.has(id);
    const inB = second.has(id);
    return {
      name: nameOf(id),
      a: inA,
      b: inB,
      result: operator === 'AND' ? inA && inB : inA || inB,
    };
  });
}

const AND_A = "ciudad = 'Bogotá'";
const AND_B = 'salario > 5000000';
const OR_A = "ciudad = 'Cali'";
const OR_B = "ciudad = 'Barranquilla'";

const ANATOMY: readonly AnatomyClause[] = [
  {
    role: 'select',
    keyword: 'SELECT',
    content: 'nombre, ciudad, salario',
    question: '¿qué mostrar?',
    part: 'columnas del resultado',
    definition: SQL_CONCEPTS.select.definition,
    logical: 3,
  },
  {
    role: 'from',
    keyword: 'FROM',
    content: 'empleados',
    question: '¿de dónde?',
    part: 'tabla de origen',
    definition: SQL_CONCEPTS.from.definition,
    logical: 1,
  },
  {
    role: 'where',
    keyword: 'WHERE',
    content:
      "estado = 'ACTIVO'\n  AND ciudad = 'Bogotá'\n  AND salario BETWEEN 4000000 AND 8000000",
    question: '¿qué filas?',
    part: 'condiciones unidas con AND',
    definition: SQL_CONCEPTS.where.definition,
    logical: 2,
  },
  {
    role: 'order',
    keyword: 'ORDER BY',
    content: 'salario DESC',
    question: '¿en qué orden?',
    part: 'criterio y sentido',
    definition: SQL_CONCEPTS['order-by'].definition,
    logical: 4,
  },
];

/** Errores frecuentes con causa y corrección, tomados de la fuente conceptual. */
const ERROR_CONCEPTS: readonly ConceptId[] = [
  'select',
  'where',
  'is-null',
  'between',
  'in',
  'like',
];
const ERROR_TITLES: Partial<Record<ConceptId, string>> = {
  select: 'Falta la coma',
  where: 'Texto sin comillas',
  'is-null': 'NULL con =',
  between: 'Límites al revés',
  in: 'Lista sin paréntesis',
  like: 'Patrón sin comillas',
};

/** Nombre corto de cada nivel futuro y dos temas de ejemplo. */
const LEVEL_NAMES: Readonly<Record<number, { readonly name: string; readonly examples: string }>> =
  {
    2: { name: 'Funciones', examples: 'UPPER · ROUND · NVL' },
    3: { name: 'Agregación', examples: 'COUNT · SUM · GROUP BY' },
    4: { name: 'JOINs', examples: 'INNER JOIN · LEFT JOIN' },
    5: { name: 'Subconsultas', examples: 'IN (SELECT …) · EXISTS' },
    6: { name: 'Modificar datos', examples: 'INSERT · UPDATE · DELETE' },
    7: { name: 'Estructura', examples: 'CREATE TABLE · ALTER' },
  };

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
      <div className="scene-grid scene-grid--flow">
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
              className="scene-button scene-button--ghost"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              ← Paso anterior
            </button>
            <button
              type="button"
              className="scene-button"
              disabled={step === STEP_FLOWS.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Paso siguiente →
            </button>
          </div>
        </div>
        {current.table && (
          <Data
            table={current.table}
            caption={step === 0 ? 'Tabla EMPLEADOS de origen' : `Resultado del paso ${step + 1}`}
            label={step === 0 ? 'Tabla original' : `Resultado · paso ${step + 1}`}
          />
        )}
      </div>
    </div>
  );
}

const QUIZ_SQL = "SELECT DISTINCT departamento\nFROM empleados\nWHERE ciudad = 'Bogotá';";

function RevealAnswer() {
  const [shown, setShown] = useState(false);
  const answer = firstColumn(QUIZ_SQL);
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

const DATASET_COLUMNS = [
  'ID_EMPLEADO',
  'NOMBRE',
  'APELLIDO',
  'CARGO',
  'DEPARTAMENTO',
  'CIUDAD',
  'SALARIO',
  'ESTADO',
];

function datasetPreview(names: readonly string[], count: number) {
  const columns = EMPLEADOS.columns
    .filter(({ name }) => names.includes(name))
    .map(({ name, type }) => ({ name, type }));
  return {
    columns,
    rows: EMPLEADOS.rows
      .slice(0, count)
      .map((row) => columns.map(({ name }) => row[name as keyof typeof row] ?? null)),
  };
}

/* ---------- Escenas ---------- */

const RENDER: Readonly<Record<string, () => ReactNode>> = {
  portada: () => (
    <Scene
      id="portada"
      title={identity.unitTitle}
      tone="night"
      layout="cover"
      purpose="Aprender a pedir datos a una tabla con la sentencia SELECT de Oracle SQL."
      takeaway={false}
    >
      <div className="scene-cover">
        <div className="scene-cover__copy">
          <p className="scene-cover__course">
            {identity.institution} · {identity.program} · Asignatura{' '}
            <strong>{identity.course}</strong>
          </p>
          <ul className="scene-cover__goals" aria-label="Al terminar podrás">
            <li>Elegir columnas y calcular valores</li>
            <li>Filtrar filas con condiciones</li>
            <li>Ordenar el resultado</li>
          </ul>
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
          <Image src={identity.logo} alt={identity.institution} width={805} height={417} priority />
        </div>
      </div>
    </Scene>
  ),
  ruta: () => (
    <Scene
      id="ruta"
      layout="summary"
      tone="soft"
      purpose="Ocho bloques; cada uno añade una pieza a la misma consulta, de la tabla al resultado ordenado."
      takeaway="Cada bloque tiene su lección en el Modo Estudio, con ejemplos y una comprobación."
    >
      <RouteMap stages={ROUTE} />
    </Scene>
  ),
  'que-es-sql': () => (
    <Scene id="que-es-sql" concepts={['sql']} layout="pipeline">
      <div className="scene-grid scene-grid--stack">
        <SqlJourney
          question="¿Quiénes trabajan en Cali?"
          sql={"SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';"}
          names={F.journey}
        />
        <div className="scene-duo">
          <p className="scene-duo__item scene-duo__item--on">
            <span className="scene-duo__label">En esta unidad</span>
            <strong>Consultar</strong> <code>SELECT</code> solo lee los datos.
          </p>
          <p className="scene-duo__item">
            <span className="scene-duo__label">Nivel 6</span>
            <strong>Modificar</strong> <code>INSERT</code> · <code>UPDATE</code> ·{' '}
            <code>DELETE</code>
          </p>
        </div>
      </div>
    </Scene>
  ),
  empleados: () => {
    const preview = datasetPreview(DATASET_COLUMNS, 4);
    return (
      <Scene id="empleados" concepts={['table']} layout="concept" takeaway={false}>
        <div className="scene-grid scene-grid--dataset">
          <div className="scene-dataset__top">
            <MetricStrip
              items={[
                { value: EMPLEADOS.rows.length, label: 'empleados' },
                { value: EMPLEADOS.columns.length, label: 'columnas' },
                { value: 'NUMBER · VARCHAR2 · DATE', label: 'tipos' },
                { value: 'mensuales', label: 'SALARIO y BONO' },
              ]}
            />
            <ul className="scene-legend">
              <li className="scene-legend__row">
                <strong>Fila</strong> un empleado (Ana)
              </li>
              <li className="scene-legend__column">
                <strong>Columna</strong> un dato de todos (CIUDAD)
              </li>
            </ul>
          </div>
          <HighlightTable
            size="large"
            label="Tabla original · 8 de 12 columnas"
            caption="Primeras filas de EMPLEADOS con una fila y una columna resaltadas"
            columns={preview.columns}
            rows={preview.rows}
            highlightedColumns={['CIUDAD']}
            highlightedRow={0}
            summary="4 de 20 filas"
          />
          <SchemaCards
            label="Los 12 campos que utilizaremos"
            groups={EMPLEADOS_FIELD_GROUP_LIST}
            columns={EMPLEADOS_SCHEMA_COLUMNS}
            headingLevel="h2"
            baseTypes
          />
        </div>
      </Scene>
    );
  },
  'select-from': () => (
    <Scene
      id="select-from"
      concepts={['select', 'from']}
      reading="Muéstrame el nombre y el cargo de cada empleado."
      layout="pipeline"
    >
      <div className="scene-grid scene-grid--pipeline">
        <Reveal at={1} className="ask-cards">
          <p className="ask-card">
            <span className="ask-card__question">¿Qué quieres?</span>
            <strong>nombre, cargo</strong>
            <code>SELECT</code>
          </p>
          <p className="ask-card">
            <span className="ask-card__question">¿De dónde?</span>
            <strong>empleados</strong>
            <code>FROM</code>
          </p>
        </Reveal>
        <LinkedQuery
          sql={F.selectFrom.sql}
          stepClauses={{ 2: 'from', 3: 'select' }}
          aside={
            <Reveal at={4}>
              <What>Conserva las 20 filas y solo 2 columnas.</What>
            </Reveal>
          }
        >
          <Reveal at={2}>
            <Data
              table={F.selectFrom.source}
              caption="Tabla EMPLEADOS de origen"
              label="Tabla original"
              explained={F.selectFrom}
            />
          </Reveal>
          <Reveal at={4}>
            <Data
              table={F.selectFrom.result!}
              caption="Resultado de SELECT nombre, cargo"
              label="Resultado"
              explained={F.selectFrom}
            />
          </Reveal>
        </LinkedQuery>
      </div>
    </Scene>
  ),
  asterisco: () => (
    <Scene id="asterisco" concepts={['star']} reading layout="concept">
      <div className="scene-grid scene-grid--split">
        <div className="scene-stack">
          <Code sql={'SELECT *\nFROM empleados;'} />
          <p className="scene-lead">
            <code>*</code> <span aria-hidden="true">→</span> {EMPLEADOS.columns.length} columnas, en
            su orden
          </p>
          <ul className="scene-pros">
            <li className="scene-pros__yes">
              <span aria-hidden="true">✓</span> Explorar una tabla nueva
            </li>
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> Consulta final: pide solo lo necesario
            </li>
          </ul>
        </div>
        <ColumnGrid columns={EMPLEADOS_SCHEMA_COLUMNS} groups={EMPLEADOS_FIELD_GROUP_LIST} />
      </div>
    </Scene>
  ),
  columnas: () => (
    <Scene id="columnas" concepts={['column-list']} layout="comparison">
      <div className="scene-grid scene-grid--compare">
        <div className="scene-stack">
          <Code sql={F.cityName.sql} label="CIUDAD primero" />
          <Data
            table={F.cityName.result!}
            caption="Resultado de SELECT ciudad, nombre"
            label="Resultado"
          />
        </div>
        <p className="scene-versus">
          <span aria-hidden="true">⇄</span> Mismos datos, distinto orden
        </p>
        <div className="scene-stack">
          <Code sql={F.nameCity.sql} label="NOMBRE primero" />
          <Data
            table={F.nameCity.result!}
            caption="Resultado de SELECT nombre, ciudad"
            label="Resultado"
          />
        </div>
      </div>
    </Scene>
  ),
  expresiones: () => {
    const ana = EMPLEADOS.rows[0]!;
    const bonus = ana.BONO ?? 0;
    return (
      <Scene id="expresiones" concepts={['expression']} reading layout="concept">
        <div className="scene-grid scene-grid--wide-data">
          <div className="scene-stack">
            <ExpressionCard
              expression="salario * 12"
              order={['salario × 12']}
              value={formatNumber(ana.SALARIO * 12)}
            />
            <ExpressionCard
              expression="salario + bono * 12"
              order={['bono × 12', '+ salario']}
              value={formatNumber(ana.SALARIO + bonus * 12)}
            />
            <ExpressionCard
              expression="(salario + bono) * 12"
              order={['salario + bono', '× 12']}
              value={formatNumber((ana.SALARIO + bonus) * 12)}
              tone="accent"
            />
          </div>
          <div className="scene-stack">
            <Data
              table={F.precedence.result!}
              caption="Precedencia con y sin paréntesis"
              label="Resultado · 3 empleados"
            />
            <p className="scene-note">
              * y / se calculan antes que + y -. {SQL_CONCEPTS.expression.oracleNote}
            </p>
          </div>
        </div>
      </Scene>
    );
  },
  alias: () => (
    <Scene id="alias" concepts={['alias', 'as']} layout="comparison">
      <div className="scene-grid scene-grid--alias">
        <Code sql={F.alias.sql} />
        <div className="scene-grid scene-grid--compare">
          <Data
            table={F.noAlias.result!}
            caption="Encabezado sin alias"
            label="Antes · sin alias"
          />
          <p className="scene-versus">
            <span aria-hidden="true">→</span> <code>AS salario_anual</code>
          </p>
          <Data table={F.alias.result!} caption="Encabezado con alias" label="Después · con AS" />
        </div>
        <p className="scene-callout">
          <strong>No cambia la tabla:</strong> SALARIO sigue siendo{' '}
          {formatNumber(EMPLEADOS.rows[0]!.SALARIO)} para Ana; solo cambia el encabezado del
          resultado.
        </p>
      </div>
    </Scene>
  ),
  distinct: () => (
    <Scene id="distinct" concepts={['distinct']} reading layout="transformation">
      <div className="scene-grid scene-grid--transform">
        <Reveal at={1}>
          <Data
            table={F.distinct.beforeDistinct!}
            caption="Ciudades con repeticiones"
            label="Antes · SELECT ciudad"
            summary={`${F.distinct.beforeDistinct!.rows.length} de ${F.distinct.counts.source} filas`}
          />
        </Reveal>
        <Reveal at={2} className="scene-transform">
          <CountFlow
            label="Cambio en el número de filas"
            steps={[
              { value: F.distinct.counts.source, text: 'filas' },
              { value: F.distinct.counts.result, text: 'ciudades únicas', via: 'DISTINCT' },
            ]}
          />
          <ul className="scene-tags">
            <li>No ordena</li>
            <li>No borra datos</li>
          </ul>
        </Reveal>
        <Reveal at={3} className="scene-stack">
          <Code sql={F.distinct.sql} />
          <Data
            table={F.distinct.result!}
            caption="Ciudades distintas"
            label="Después · DISTINCT"
          />
          <p className="scene-note">
            Compara la fila completa: <code>DISTINCT ciudad, departamento</code> da{' '}
            {F.distinctPairs} pares.
          </p>
        </Reveal>
      </div>
    </Scene>
  ),
  where: () => (
    <Scene id="where" concepts={['where']} reading layout="transformation">
      <LinkedQuery
        sql={F.where.sql}
        className="linked-query--top"
        stepClauses={{ 2: 'where' }}
        aside={
          <Reveal at={3}>
            <CountFlow
              label="Filas antes y después de WHERE"
              steps={[
                { value: F.where.counts.source, text: 'filas' },
                { value: F.where.counts.result, text: 'filas cumplen', via: "ciudad = 'Cali'" },
              ]}
            />
          </Reveal>
        }
      >
        <Reveal at={1}>
          <Data
            table={F.where.source}
            caption="Tabla original con la condición"
            label="Tabla original"
            explained={F.where}
          />
        </Reveal>
        <Reveal at={4}>
          <Data
            table={F.where.result!}
            caption="Filas que cumplen"
            label="Resultado"
            explained={F.where}
          />
        </Reveal>
      </LinkedQuery>
    </Scene>
  ),
  comparaciones: () => (
    <Scene id="comparaciones" concepts={['comparison']} layout="concept">
      <div className="scene-grid scene-grid--stack">
        <ComparatorScale items={COMPARATOR_ITEMS} total={EMPLEADOS.rows.length} />
        <ul className="scene-quotes">
          <li className="scene-pros__yes">
            <span aria-hidden="true">✓</span> <code>ciudad = &apos;Cali&apos;</code> texto entre
            comillas simples
          </li>
          <li className="scene-pros__no">
            <span aria-hidden="true">✗</span> <code>ciudad = Cali</code> busca una columna
          </li>
          <li className="scene-pros__no">
            <span aria-hidden="true">✗</span> <code>ciudad = &quot;Cali&quot;</code> es un nombre
          </li>
        </ul>
      </div>
    </Scene>
  ),
  'and-or': () => (
    <Scene
      id="and-or"
      concepts={['and', 'or']}
      layout="comparison"
      takeaway="AND: se cumplen todas. OR: basta con una."
    >
      <div className="scene-grid scene-grid--duo">
        <LogicPanel
          operator="AND"
          lead="las dos condiciones"
          conditions={[AND_A, AND_B]}
          examples={logicExamples(AND_A, AND_B, 'AND', [1, 6, 3])}
          names={firstColumn(
            "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Bogotá'\n  AND salario > 5000000;",
          )}
        />
        <LogicPanel
          operator="OR"
          lead="al menos una condición"
          conditions={[OR_A, OR_B]}
          examples={logicExamples(OR_A, OR_B, 'OR', [4, 12, 1])}
          names={firstColumn(
            "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali'\n   OR ciudad = 'Barranquilla';",
          )}
        />
      </div>
    </Scene>
  ),
  parentesis: () => {
    const extra = F.withoutParentheses.filter((name) => !F.withParentheses.includes(name));
    return (
      <Scene id="parentesis" concepts={['logical-precedence']} layout="comparison">
        <div className="scene-grid scene-grid--duo">
          <div className="scene-stack">
            <Code
              label={`Sin paréntesis · ${F.withoutParentheses.length} filas`}
              sql={"WHERE ciudad = 'Bogotá'\n   OR ciudad = 'Medellín'\n  AND salario > 5000000"}
            />
            <p className="scene-warning">
              Oracle lee: Bogotá <strong>OR</strong> (Medellín <strong>AND</strong> salario &gt;
              5.000.000)
            </p>
            <NameChips
              names={F.withoutParentheses}
              marked={extra}
              label={`${F.withoutParentheses.length} filas sin paréntesis`}
            />
          </div>
          <div className="scene-stack">
            <Code
              label={`Con paréntesis · ${F.withParentheses.length} filas`}
              sql={"WHERE (ciudad = 'Bogotá'\n    OR ciudad = 'Medellín')\n  AND salario > 5000000"}
            />
            <p className="scene-good">
              Primero la ciudad; después, el salario para las dos ciudades.
            </p>
            <NameChips
              names={F.withParentheses}
              label={`${F.withParentheses.length} filas con paréntesis`}
            />
          </div>
        </div>
        <p className="scene-note scene-note--center">
          Marcados: {extra.length} empleados de Bogotá que ganan 5.000.000 o menos y solo aparecen
          sin paréntesis.
        </p>
      </Scene>
    );
  },
  between: () => (
    <Scene id="between" concepts={['between']} reading layout="concept">
      <div className="scene-grid scene-grid--split">
        <div className="scene-stack">
          <Code sql={F.between.sql} />
          <Data
            table={F.between.source}
            caption="Salarios en los límites del rango y justo fuera"
            label="Los límites"
            summary={`${F.between.counts.result} de 20 filas en el rango`}
          />
        </div>
        <div className="scene-stack">
          <RangeLine
            low={3000000}
            high={6000000}
            points={EMPLEADOS.rows.map((row) => ({
              name: row.NOMBRE,
              value: row.SALARIO,
              inside: F.betweenIds.has(row.ID_EMPLEADO),
            }))}
          />
          <What>
            Equivale a <code>salario &gt;= 3000000 AND salario &lt;= 6000000</code>.
          </What>
        </div>
      </div>
    </Scene>
  ),
  in: () => (
    <Scene id="in" concepts={['in']} reading layout="comparison">
      <div className="scene-grid scene-grid--flow">
        <div className="scene-stack">
          <ListChips column="CIUDAD" values={['Bogotá', 'Medellín', 'Cali']} />
          <Code
            label="Con OR · repetitivo"
            sql={"WHERE ciudad = 'Bogotá'\n   OR ciudad = 'Medellín'\n   OR ciudad = 'Cali'"}
          />
          <p className="scene-arrow-down" aria-hidden="true">
            ↓
          </p>
          <Code label="Con IN · compacto" sql={"WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')"} />
        </div>
        <Data
          table={F.in.source}
          caption="Ciudades en la lista y fuera de ella"
          label="Tabla original"
          summary={`${F.in.counts.result} de 20 filas cumplen`}
        />
      </div>
    </Scene>
  ),
  like: () => (
    <Scene id="like" concepts={['like']} reading layout="concept">
      <div className="scene-grid scene-grid--flow">
        <div className="scene-stack">
          <Code sql={F.likeStarts.sql} />
          <dl className="scene-wildcards">
            <div>
              <dt>
                <code>%</code>
              </dt>
              <dd>{SQL_CONCEPTS.percent.definition}</dd>
            </div>
            <div>
              <dt>
                <code>_</code>
              </dt>
              <dd>{SQL_CONCEPTS.underscore.definition}</dd>
            </div>
          </dl>
        </div>
        <div className="pattern-cards">
          <PatternCard pattern="A%" meaning="empieza por A" table={F.likeStarts.source} />
          <PatternCard pattern="%ar%" meaning="contiene «ar»" table={F.likeContains.source} />
          <PatternCard pattern="_a%" meaning="a en la 2.ª posición" table={F.likeSecond.source} />
        </div>
      </div>
    </Scene>
  ),
  null: () => (
    <Scene id="null" concepts={['null', 'is-null']} layout="concept">
      <div className="scene-grid scene-grid--flow">
        <div className="scene-stack">
          <ul className="null-facts" aria-label="Qué no es NULL">
            <li>
              <code>NULL</code> ≠ <code>0</code>
            </li>
            <li>
              <code>NULL</code> ≠ <code>&apos;NULL&apos;</code>
            </li>
            <li className="null-facts__oracle">{SQL_CONCEPTS.null.oracleNote}</li>
          </ul>
          <Code sql={F.isNull.sql} />
          <ul className="scene-null">
            <li className="scene-pros__no">
              <span aria-hidden="true">✗</span> <code>bono = NULL</code>{' '}
              <span>{F.equalsNull} filas: nunca es verdadero</span>
            </li>
            <li className="scene-pros__yes">
              <span aria-hidden="true">✓</span> <code>bono IS NULL</code>{' '}
              <span>{F.isNull.counts.result} filas sin bono</span>
            </li>
            <li>
              <span aria-hidden="true">·</span> <code>bono = 0</code>{' '}
              <span>{F.zero} fila: 0 sí es un valor</span>
            </li>
          </ul>
        </div>
        <Data
          table={F.isNull.source}
          caption="BONO con valores y sin valor"
          label="Tabla original · BONO"
          summary="7 de 20 filas"
        />
      </div>
    </Scene>
  ),
  'order-by': () => (
    <Scene
      id="order-by"
      concepts={['order-by']}
      reading
      layout="transformation"
      takeaway="ASC (de menor a mayor) es el valor por defecto; DESC invierte el orden."
    >
      <div className="scene-grid scene-grid--transform">
        <Reveal at={1}>
          <Data
            table={F.original.result!}
            caption="Orden original sin ORDER BY"
            label="Antes · sin ORDER BY"
            summary="5 de 20 filas · orden sin garantía"
          />
        </Reveal>
        <Reveal at={2} className="scene-transform">
          <p className="sort-badges">
            <span className="sort-badge">
              <span aria-hidden="true">↑</span> ASC menor a mayor
            </span>
            <span className="sort-badge sort-badge--on">
              <span aria-hidden="true">↓</span> DESC mayor a menor
            </span>
          </p>
        </Reveal>
        <Reveal at={2} className="scene-stack">
          <Code sql={F.orderDesc.sql} />
          <Data
            table={F.orderDesc.result!}
            caption="Del salario más alto al más bajo"
            label="Después · ORDER BY salario DESC"
          />
        </Reveal>
      </div>
    </Scene>
  ),
  anatomia: () => (
    <Scene
      id="anatomia"
      tone="night"
      layout="concept"
      purpose="Una consulta completa responde cuatro preguntas: qué mostrar, de dónde, qué filas y en qué orden."
      takeaway="Se escribe SELECT → FROM → WHERE → ORDER BY; se entiende FROM → WHERE → SELECT → ORDER BY."
    >
      <SqlAnatomy clauses={ANATOMY} />
    </Scene>
  ),
  'paso-a-paso': () => (
    <Scene
      id="paso-a-paso"
      layout="steps"
      purpose={<>«{INTEGRATED_QUESTION}»</>}
      takeaway="Cada cláusula reduce u organiza el resultado del paso anterior."
    >
      <BuildStepper />
    </Scene>
  ),
  errores: () => (
    <Scene
      id="errores"
      layout="practice"
      purpose="Cada error tiene una causa y una corrección: encuéntralo antes de leerla."
      takeaway="Comillas simples para textos, IS NULL para NULL y paréntesis para listas."
    >
      <div className="error-cards">
        {ERROR_CONCEPTS.map((id) => {
          const mistake = SQL_CONCEPTS[id].mistake!;
          const lastLine = (sql: string) => sql.split('\n').at(-1)!.replace(/;$/, '');
          return (
            <ErrorCard
              key={id}
              title={ERROR_TITLES[id] ?? SQL_CONCEPTS[id].title}
              wrong={id === 'select' ? mistake.wrong.split('\n')[0]! : lastLine(mistake.wrong)}
              right={id === 'select' ? mistake.right.split('\n')[0]! : lastLine(mistake.right)}
              why={mistake.why}
            />
          );
        })}
      </div>
    </Scene>
  ),
  laboratorio: () => (
    <Scene
      id="laboratorio"
      tone="soft"
      layout="practice"
      purpose="En el laboratorio escribes una consulta, entiendes sus errores y la ejecutas en Oracle real."
      takeaway={false}
    >
      <div className="scene-grid scene-grid--split">
        <div className="lab-preview" aria-label="Vista del laboratorio">
          <p className="lab-preview__bar">
            <span aria-hidden="true">● ● ●</span> Laboratorio SQL
          </p>
          <Code sql={INTEGRATED} label="Editor" />
          <Data
            table={F.integrated.result!}
            caption="Vista educativa de la consulta de ejemplo"
            label="Resultado"
          />
          <Link className="scene-button" href={labRoute(INTEGRATED, 'laboratorio')}>
            Abrir en Lab <span aria-hidden="true">→</span>
          </Link>
        </div>
        <StepFlow
          label="Qué puedes hacer en el laboratorio"
          steps={[
            { title: 'Escribir', text: 'Editor con resaltado y ejemplos listos para cargar.' },
            {
              title: 'Entender errores',
              text: 'Diagnóstico con categoría, lugar, causa y corrección.',
            },
            { title: 'Ejecutar en Oracle', text: 'La misma consulta en Oracle Database real.' },
          ]}
        />
      </div>
    </Scene>
  ),
  challenge: () => (
    <Scene
      id="challenge"
      tone="tech"
      layout="practice"
      purpose="Diez misiones para aplicar lo aprendido, con puntos y pistas; la última se califica con Oracle real."
      takeaway={false}
    >
      <div className="scene-grid scene-grid--stack">
        <MissionPath missions={MISSION_OVERVIEW} />
        <div className="scene-grid scene-grid--split">
          <dl className="scene-rules">
            <div>
              <dt>Puntos</dt>
              <dd>{PRACTICE_RULES.maxScorePerMission * MISSION_OVERVIEW.length}</dd>
            </div>
            <div>
              <dt>Intentos</dt>
              <dd>{PRACTICE_RULES.maxScoredAttempts} por misión</dd>
            </div>
            <div>
              <dt>Pista</dt>
              <dd>−{PRACTICE_RULES.hintPenalty} puntos</dd>
            </div>
            <div>
              <dt>M10</dt>
              <dd>Oracle real</dd>
            </div>
          </dl>
          <Link className="scene-button scene-button--cyan" href="/challenge">
            Iniciar Challenge <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Scene>
  ),
  aprendimos: () => (
    <Scene
      id="aprendimos"
      layout="summary"
      purpose="Recorrimos los ocho bloques: ya puedes leer y escribir una consulta SELECT completa."
      takeaway="La chuleta imprimible con todas las piezas está en Recursos."
    >
      <RouteMap stages={ROUTE} completed />
    </Scene>
  ),
  video: () => (
    <Scene
      id="video"
      layout="media"
      purpose="Repasa en video la primera parte de la unidad: SELECT, FROM, *, cálculos, AS y DISTINCT."
      takeaway="Puede verse después de clase, con subtítulos en español."
    >
      <SummaryVideo />
    </Scene>
  ),
  reto: () => (
    <Scene
      id="reto"
      tone="soft"
      layout="live"
      purpose="Practica con toda la clase: el profesor crea una sala y todos resuelven las misiones en su móvil."
      takeaway={false}
    >
      <div className="scene-grid scene-grid--stack">
        <StepFlow
          label="Cómo funciona la sala en vivo"
          steps={[
            { title: 'Profesor', text: 'Crea la sala' },
            { title: 'QR', text: 'Proyecta el código' },
            { title: 'Estudiantes', text: 'Entran desde el móvil' },
            { title: 'Misiones', text: 'Resuelven a la vez' },
            { title: 'Ranking', text: 'Resultados en vivo' },
          ]}
        />
        <div className="scene-grid scene-grid--split">
          <RevealAnswer />
          <SceneQr path="/challenge" />
        </div>
      </div>
    </Scene>
  ),
  proximos: () => (
    <Scene
      id="proximos"
      layout="summary"
      purpose="La ruta continúa con seis niveles más; SELECT es la base de todos."
      takeaway={
        <>
          Cada tema futuro ya tiene su ficha en <Link href="/modules">la ruta de aprendizaje</Link>.
        </>
      }
    >
      <LevelRoadmap
        levels={CURRICULUM_LEVELS.filter((level) => level.number > 1).map((level) => ({
          number: level.number,
          name: LEVEL_NAMES[level.number]?.name ?? level.title,
          summary: level.summary,
          examples: LEVEL_NAMES[level.number]?.examples ?? '',
        }))}
      />
    </Scene>
  ),
  cierre: () => (
    <Scene
      id="cierre"
      title="¿Preguntas?"
      tone="night"
      layout="summary"
      purpose="Ahora puedes leer, entender y escribir una consulta completa como esta."
      takeaway="SELECT convierte preguntas en resultados."
    >
      <div className="scene-grid scene-grid--split">
        <div className="scene-stack">
          <Code sql={INTEGRATED} />
          <p className="scene-closing__reading">
            «{INTEGRATED_QUESTION}» <strong>{rows(F.integrated.counts.result)}.</strong>
          </p>
        </div>
        <div className="scene-closing">
          <nav className="scene-links" aria-label="Seguir aprendiendo">
            <Link href="/learn">Estudiar →</Link>
            <Link href="/lab">Practicar SQL →</Link>
            <Link href="/resources">Recursos y chuleta →</Link>
          </nav>
          <p className="scene-signature">
            {identity.author} · Profesor {identity.teacher} · {identity.course} ·{' '}
            {identity.institution}
          </p>
        </div>
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
