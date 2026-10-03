'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useState, type ReactNode } from 'react';
import { ACADEMIC_IDENTITY as identity } from '@/application/academic-identity';
import { EMPLEADOS_FIELD_GROUP_LIST, EMPLEADOS_SCHEMA_COLUMNS } from '@/application/dataset-view';
import { conceptProjection, type ProjectedPart } from '@/application/didactic-projection';
import { SQL_CONCEPTS, type ConceptId } from '@/application/sql-concepts';
import { MISSION_OVERVIEW, PRACTICE_RULES } from '@/features/challenge/application/challenge-api';
import {
  analyzeLabQuery,
  datasetRows,
  EMPLEADOS,
  explainQuery,
  type ExplainOptions,
  type ExplainedQuery,
} from '@/features/laboratory/application/lab-api';
import { getVideo } from '@/features/resources/application/resources-api';
import { formatNumber } from '@/presentation/components/data/cell-format';
import { HighlightTable } from '@/presentation/components/data/highlight-table';
import { SchemaCards } from '@/presentation/components/data/schema-cards';
import { VideoPlayer } from '@/presentation/components/media/video-player';
import { SCENES, sceneNumber } from '../application/presentation-api';
import { Code, Data, NameChips, QueryGlossary, Scene } from './scene-kit';
import { ConceptFlow, FlowArrow, FlowStep, QueryParts, resultSummary } from './scene-flow';
import { SceneQr } from './scene-qr';
import {
  CompetencyGrid,
  DataToQuery,
  ErrorCard,
  FutureRoadmap,
  LogicPanel,
  MetricStrip,
  MissionPath,
  OperatorStrip,
  ParenthesesTable,
  PatternCard,
  RangeLine,
  RouteMap,
  SqlAnatomy,
  SqlJourney,
  StepFlow,
  TableCard,
  type AnatomyClause,
  type FutureTopic,
  type ParenthesesRow,
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

/** Consulta integradora de «Qué aprendimos» (escena 26). */
const SYNTHESIS =
  'SELECT DISTINCT ciudad\nFROM empleados\nWHERE salario >= 4000000\nORDER BY ciudad;';

/** Qué hace cada parte de la consulta integradora (escena 26). */
function part(code: string, concept: ConceptId, text: string): ProjectedPart {
  return { code, concept, title: SQL_CONCEPTS[concept].title, text };
}

const SYNTHESIS_PARTS: readonly ProjectedPart[] = [
  part('SELECT DISTINCT ciudad', 'distinct', 'ciudades, sin repetir'),
  part('FROM empleados', 'from', 'de la tabla EMPLEADOS'),
  part('WHERE salario >= 4000000', 'where', 'solo quien gana 4 millones o más'),
  part('ORDER BY ciudad', 'order-by', 'en orden alfabético'),
];

/** Consulta de la anatomía (escena 21). */
const ANATOMY_SQL =
  "SELECT nombre, salario\nFROM empleados\nWHERE ciudad = 'Cali'\nORDER BY salario DESC;";

const INTEGRATED_QUESTION =
  'Quiero ver nombre, ciudad y salario de los empleados activos de Bogotá con salarios entre 4 y 8 millones, del mayor al menor.';

// Proyecciones didácticas de las escenas 06–20: muestra de EMPLEADOS, consulta, partes y
// resultado sobre esas mismas filas (application/didactic-projection).
const P = {
  selectFrom: conceptProjection('select-from'),
  star: conceptProjection('star'),
  columns: conceptProjection('columns'),
  columnsSwapped: conceptProjection('columns', { sql: 'SELECT ciudad, nombre\nFROM empleados;' }),
  expression: conceptProjection('expression'),
  alias: conceptProjection('alias'),
  aliasBefore: conceptProjection('alias', {
    sql: 'SELECT nombre,\n       salario * 12\nFROM empleados;',
  }),
  distinct: conceptProjection('distinct'),
  where: conceptProjection('where'),
  comparison: conceptProjection('comparison'),
  between: conceptProjection('between'),
  in: conceptProjection('in'),
  like: conceptProjection('like'),
  isNull: conceptProjection('is-null'),
  orderBy: conceptProjection('order-by'),
};

// Otras consultas de las escenas, calculadas una vez.
const F = {
  journey: firstColumn("SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';"),
  distinctPairs: rowCount('SELECT DISTINCT ciudad, departamento FROM empleados;'),
  withoutParentheses: firstColumn(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE ciudad = 'Bogotá' OR ciudad = 'Medellín'\n  AND salario > 5000000;",
  ),
  withParentheses: firstColumn(
    "SELECT nombre, ciudad, salario\nFROM empleados\nWHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín')\n  AND salario > 5000000;",
  ),
  likeEnds: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE '%a';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(1, 3, 2),
  }),
  likeContains: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE '%ar%';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(2, 3, 5),
  }),
  likeSecond: flow("SELECT nombre\nFROM empleados\nWHERE nombre LIKE '_a%';", {
    sourceColumns: ['NOMBRE'],
    rows: ids(3, 5, 1),
  }),
  equalsNull: rowCount('SELECT nombre FROM empleados WHERE bono = NULL;'),
  isNotNull: rowCount('SELECT nombre FROM empleados WHERE bono IS NOT NULL;'),
  integrated: flow(INTEGRATED),
  synthesis: firstColumn(SYNTHESIS),
  anatomy: rowCount(ANATOMY_SQL),
};

const PAREN_WITHOUT = "WHERE ciudad = 'Bogotá'\n   OR ciudad = 'Medellín'\n  AND salario > 5000000";
const PAREN_WITH = "WHERE (ciudad = 'Bogotá'\n    OR ciudad = 'Medellín')\n  AND salario > 5000000";

/** Candidatas de la escena 15: el veredicto de cada versión sale del motor. */
const PAREN_ROWS: readonly ParenthesesRow[] = (() => {
  const without = matching(PAREN_WITHOUT.replace(/^WHERE /, ''));
  const withGroup = matching(PAREN_WITH.replace(/^WHERE /, ''));
  return [1, 6, 3, 7, 10].map((id) => {
    const row = EMPLEADOS.rows[id - 1]!;
    return {
      name: row.NOMBRE,
      city: row.CIUDAD,
      salary: row.SALARIO,
      without: without.has(id),
      with: withGroup.has(id),
    };
  });
})();

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

/** Los ocho bloques del mapa de aprendizaje (escena 02): objetivo y conceptos. */
const ROUTE: readonly RouteStage[] = [
  {
    letter: 'A',
    title: 'Fundamentos',
    goal: 'Entender tabla, fila y columna.',
    concepts: 'SQL · EMPLEADOS · tipos de dato',
    outcome: 'Leer la tabla EMPLEADOS',
  },
  {
    letter: 'B',
    title: 'Primera consulta',
    goal: 'Elegir qué mostrar y de dónde.',
    concepts: 'SELECT · FROM · * · expresiones · AS',
    outcome: 'Escribir SELECT … FROM',
  },
  {
    letter: 'C',
    title: 'Duplicados',
    goal: 'Obtener valores únicos del resultado.',
    concepts: 'DISTINCT',
    outcome: 'Listar valores sin repetir',
  },
  {
    letter: 'D',
    title: 'Filtrar',
    goal: 'Elegir filas con una condición.',
    concepts: 'WHERE · comparadores · AND · OR · NOT',
    outcome: 'Pedir solo ciertas filas',
  },
  {
    letter: 'E',
    title: 'Operadores de filtro',
    goal: 'Rangos, listas y patrones de texto.',
    concepts: 'BETWEEN · IN · LIKE',
    outcome: 'Buscar rangos, listas y textos',
  },
  {
    letter: 'F',
    title: 'Valores ausentes',
    goal: 'Reconocer y consultar NULL.',
    concepts: 'NULL · IS NULL · IS NOT NULL',
    outcome: 'Encontrar datos que faltan',
  },
  {
    letter: 'G',
    title: 'Ordenar',
    goal: 'Presentar el resultado en un orden.',
    concepts: 'ORDER BY · ASC · DESC',
    outcome: 'Ordenar de mayor a menor',
  },
  {
    letter: 'H',
    title: 'Integrar',
    goal: 'Consultas completas y práctica.',
    concepts: 'consulta completa · errores · Lab · Challenge',
    outcome: 'Resolver el Challenge',
  },
];

/** Lo que el estudiante ya puede hacer (escena 26). */
const COMPETENCIES = [
  { text: 'Elegir columnas', sql: 'SELECT' },
  { text: 'Consultar una tabla', sql: 'FROM' },
  { text: 'Crear expresiones', sql: 'salario * 12' },
  { text: 'Renombrar resultados', sql: 'AS' },
  { text: 'Eliminar duplicados del resultado', sql: 'DISTINCT' },
  { text: 'Filtrar filas', sql: 'WHERE' },
  { text: 'Combinar condiciones', sql: 'AND · OR' },
  { text: 'Trabajar con NULL', sql: 'IS NULL' },
  { text: 'Ordenar resultados', sql: 'ORDER BY' },
] as const;

/** Siguiente ruta recomendada (escena 29): temas futuros, fuera de la evaluación actual. */
const FUTURE_TOPICS: readonly FutureTopic[] = [
  { title: 'Funciones de texto', examples: 'UPPER · LOWER · INITCAP · SUBSTR · LENGTH', level: 2 },
  { title: 'Funciones numéricas', examples: 'ROUND · TRUNC', level: 2 },
  { title: 'Funciones de fecha', examples: 'SYSDATE · operaciones con fechas', level: 2 },
  { title: 'Funciones de agregación', examples: 'COUNT · SUM · AVG · MIN · MAX', level: 3 },
  { title: 'Agrupación', examples: 'GROUP BY · HAVING', level: 3 },
  { title: 'Consultas con varias tablas', examples: 'INNER JOIN · LEFT JOIN · PK/FK', level: 4 },
  { title: 'Subconsultas', examples: 'SELECT dentro de SELECT', level: 5 },
  {
    title: 'Operadores de conjuntos',
    examples: 'UNION · UNION ALL · INTERSECT · MINUS',
    level: null,
  },
  { title: 'Modificar datos', examples: 'INSERT · UPDATE · DELETE', level: 6 },
  {
    title: 'Estructura de la base de datos',
    examples: 'CREATE TABLE · ALTER TABLE · DROP · constraints',
    level: 7,
  },
];

const COMPARATORS: readonly (readonly [string, string])[] = [
  ['<', 'menor'],
  ['<=', 'menor o igual'],
  ['=', 'igual'],
  ['>=', 'mayor o igual'],
  ['>', 'mayor'],
  ['<>', 'distinto'],
];

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
    content: 'nombre, salario',
    question: '¿qué mostrar?',
    part: 'Proyección · columnas del resultado',
    definition: SQL_CONCEPTS.select.definition,
    logical: 3,
  },
  {
    role: 'from',
    keyword: 'FROM',
    content: 'empleados',
    question: '¿de dónde?',
    part: 'Fuente · tabla de origen',
    definition: SQL_CONCEPTS.from.definition,
    logical: 1,
  },
  {
    role: 'where',
    keyword: 'WHERE',
    content: "ciudad = 'Cali'",
    question: '¿qué filas?',
    part: 'Filtro · condición',
    definition: SQL_CONCEPTS.where.definition,
    logical: 2,
  },
  {
    role: 'order',
    keyword: 'ORDER BY',
    content: 'salario DESC',
    question: '¿en qué orden?',
    part: 'Orden · criterio y sentido',
    definition: SQL_CONCEPTS['order-by'].definition,
    logical: 4,
  },
];

/** Errores frecuentes con causa y corrección, tomados de la fuente conceptual. */
const ERRORS: readonly {
  readonly id: ConceptId;
  readonly title: string;
  /** Qué parte del SQL se muestra: la primera línea, la última o todo en una línea. */
  readonly part: 'first' | 'last' | 'all';
}[] = [
  { id: 'select', title: 'Falta la coma', part: 'first' },
  { id: 'from', title: 'Falta FROM', part: 'all' },
  { id: 'column', title: 'Columna inexistente', part: 'first' },
  { id: 'is-null', title: 'NULL con =', part: 'last' },
  { id: 'distinct', title: 'DISTINCT mal colocado', part: 'first' },
  { id: 'where', title: 'Texto sin comillas', part: 'last' },
];

function sqlPart(sql: string, part: 'first' | 'last' | 'all'): string {
  const lines = sql.replace(/;$/, '').split('\n');
  return part === 'first' ? lines[0]! : part === 'last' ? lines.at(-1)! : lines.join(' ');
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

/** Tabla EMPLEADOS completa (escena 04): todas las filas y columnas del dataset canónico. */
const FULL_DATASET = {
  columns: EMPLEADOS.columns.map(({ name, type }) => ({ name, type })),
  rows: datasetRows(),
};

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
      purpose="Pasaremos de entender una tabla a construir consultas completas, paso a paso."
      takeaway="Al terminar: leer, escribir y corregir consultas SELECT completas."
    >
      <RouteMap stages={ROUTE} />
    </Scene>
  ),
  'que-es-sql': () => (
    <Scene id="que-es-sql" concepts={['sql']} use={SQL_CONCEPTS.sql.whatItDoes} layout="pipeline">
      <div className="scene-grid scene-grid--stack">
        <SqlJourney
          question="¿Quiénes trabajan en Cali?"
          sql={"SELECT nombre\nFROM empleados\nWHERE ciudad = 'Cali';"}
          names={F.journey}
        />
        <QueryGlossary ids={['table', 'row', 'column', 'query']} label="Vocabulario de la unidad" />
      </div>
    </Scene>
  ),
  'tabla-empleados': () => {
    const rowCount = EMPLEADOS.rows.length;
    const columnCount = EMPLEADOS.columns.length;
    return (
      <Scene
        id="tabla-empleados"
        purpose="Estos son los datos que utilizaremos durante toda la unidad."
        layout="concept"
        takeaway={false}
      >
        <div className="scene-full-table">
          <p className="scene-full-table__intro">
            La tabla EMPLEADOS contiene {rowCount} registros y {columnCount} atributos. A partir de
            ella construiremos y analizaremos las consultas SQL de las siguientes diapositivas.
          </p>
          <HighlightTable
            size="large"
            caption={`Tabla EMPLEADOS completa: ${rowCount} filas y ${columnCount} columnas`}
            columns={FULL_DATASET.columns}
            rows={FULL_DATASET.rows}
            className="dv--dataset-full"
          />
          <p className="scene-full-table__legend">
            {rowCount} empleados · {columnCount} atributos · tabla base de la unidad
          </p>
        </div>
      </Scene>
    );
  },
  empleados: () => {
    const preview = datasetPreview(DATASET_COLUMNS, 3);
    return (
      <Scene
        id="empleados"
        concepts={['table']}
        use="EMPLEADOS será nuestra tabla de ejemplo durante toda la unidad: cada fila es un empleado."
        layout="concept"
        takeaway={false}
      >
        <div className="scene-grid scene-grid--dataset">
          <div className="scene-dataset__top">
            <MetricStrip
              items={[
                { value: EMPLEADOS.rows.length, label: 'empleados (filas)' },
                { value: EMPLEADOS.columns.length, label: 'atributos (columnas)' },
                { value: 'NUMBER · VARCHAR2 · DATE', label: 'tipos' },
                { value: 'NULL', label: 'posible en BONO' },
              ]}
            />
            <ul className="scene-legend">
              <li className="scene-legend__row">
                <strong>Fila</strong> un registro: un empleado (Ana)
              </li>
              <li className="scene-legend__column">
                <strong>Columna</strong> un atributo de todos (CIUDAD)
              </li>
              <li className="scene-legend__cell">
                <strong>Celda</strong> un valor (Bogotá)
              </li>
            </ul>
          </div>
          <HighlightTable
            size="large"
            label="Tabla original · 8 de 12 columnas"
            caption="Primeras filas de EMPLEADOS con una fila, una columna y su celda resaltadas"
            columns={preview.columns}
            rows={preview.rows}
            highlightedColumns={['CIUDAD']}
            highlightedRow={0}
            summary="3 de 20 filas"
          />
          <SchemaCards
            label="Los 12 atributos, por grupos"
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
      use
      layout="pipeline"
      takeaway={P.selectFrom.keyIdea}
    >
      <ConceptFlow projection={P.selectFrom} stepClauses={{ 2: 'from', 3: 'select' }} />
    </Scene>
  ),
  asterisco: () => (
    <Scene id="asterisco" concepts={['star']} use layout="pipeline" takeaway={P.star.keyIdea}>
      <div className="star-flow">
        <div className="star-flow__top">
          <FlowStep number={1} title="Tabla de origen">
            <TableCard
              name="EMPLEADOS"
              facts={[`${EMPLEADOS.rows.length} filas`, `${EMPLEADOS.columns.length} columnas`]}
            />
          </FlowStep>
          <FlowArrow />
          <FlowStep number={2} title="Consulta">
            <Code sql={P.star.sql} />
          </FlowStep>
          <FlowStep number={3} title="Qué hace cada parte" className="flow-step--wide">
            <QueryParts parts={P.star.parts} />
          </FlowStep>
        </div>
        <FlowStep
          number={4}
          title={`Resultado · ${P.star.sample.counts.result} de ${EMPLEADOS.rows.length} filas · todas las columnas`}
        >
          <HighlightTable
            size="large"
            caption="Resultado de SELECT *: las 12 columnas de EMPLEADOS"
            columns={P.star.sample.result!.columns}
            rows={P.star.sample.result!.rows}
            fallback="bands"
            className="dv--free"
          />
        </FlowStep>
      </div>
    </Scene>
  ),
  columnas: () => (
    <Scene id="columnas" concepts={['column-list']} use layout="pipeline">
      <ConceptFlow
        projection={P.columns}
        layout="columns"
        after={
          <p className="flow-note">
            SELECT elige columnas, no filas: las {P.columns.sample.counts.source} filas siguen.
          </p>
        }
        result={
          <div className="flow-compare">
            {[P.columns, P.columnsSwapped].map((projection) => (
              <div key={projection.sql} className="flow-compare__item">
                <p className="flow-compare__label">
                  <code>{projection.sql.split('\n')[0]}</code>
                </p>
                <Data
                  table={projection.sample.result!}
                  caption={`Resultado de ${projection.sql.split('\n')[0]}`}
                  summary={`${projection.sample.counts.result} filas`}
                />
              </div>
            ))}
          </div>
        }
      />
    </Scene>
  ),
  expresiones: () => {
    const ana = EMPLEADOS.rows[0]!;
    const bonus = ana.BONO ?? 0;
    return (
      <Scene id="expresiones" concepts={['expression']} use layout="pipeline">
        <ConceptFlow
          projection={P.expression}
          layout="columns"
          queryAfter={
            <p className="flow-note">
              Ana: <code>{formatNumber(bonus)} × 12</code> va primero →{' '}
              {formatNumber(ana.SALARIO + bonus * 12)}. Si BONO es NULL, el resultado es NULL.
            </p>
          }
        />
      </Scene>
    );
  },
  alias: () => (
    <Scene
      id="alias"
      concepts={['alias', 'as']}
      use={SQL_CONCEPTS.alias.whyItMatters}
      layout="pipeline"
      takeaway="AS solo cambia el encabezado de esta consulta: la tabla no cambia y el nombre no es permanente."
    >
      <ConceptFlow
        projection={P.alias}
        layout="columns"
        result={
          <div className="flow-compare">
            <div className="flow-compare__item">
              <p className="flow-compare__label">Antes · sin alias</p>
              <Data
                table={P.aliasBefore.sample.result!}
                caption="Encabezado sin alias: SALARIO*12"
                summary=""
              />
            </div>
            <div className="flow-compare__item">
              <p className="flow-compare__label">
                Después · <code>AS salario_anual</code>
              </p>
              <Data
                table={P.alias.sample.result!}
                caption="Encabezado con alias: SALARIO_ANUAL"
                summary=""
              />
            </div>
          </div>
        }
      />
    </Scene>
  ),
  distinct: () => (
    <Scene id="distinct" concepts={['distinct']} use layout="pipeline">
      <ConceptFlow
        projection={P.distinct}
        after={
          <>
            <ul className="flow-facts" aria-label="Qué hace y qué no hace DISTINCT">
              <li>
                <span aria-hidden="true">✓</span>Quita repetidos del resultado
              </li>
              <li>
                <span aria-hidden="true">✓</span>No borra datos de la tabla
              </li>
              <li>
                <span aria-hidden="true">✓</span>No ordena
              </li>
            </ul>
          </>
        }
        resultWidth={19}
        result={
          <div className="flow-compare">
            <div className="flow-compare__item">
              <p className="flow-compare__label">Sin DISTINCT</p>
              <Data
                table={P.distinct.sample.beforeDistinct!}
                caption="Ciudades de la muestra, con las repetidas marcadas"
                summary={`${P.distinct.sample.beforeDistinct!.rows.length} filas`}
              />
            </div>
            <div className="flow-compare__item">
              <p className="flow-compare__label">Con DISTINCT</p>
              <Data
                table={P.distinct.sample.result!}
                caption="Ciudades distintas de la muestra"
                summary={`${P.distinct.sample.counts.result} filas · tabla completa: ${P.distinct.full.result}`}
              />
            </div>
            <p className="flow-note flow-compare__wide">
              Con dos columnas compara la pareja: <code>DISTINCT ciudad, departamento</code> da{' '}
              {F.distinctPairs} combinaciones.
            </p>
          </div>
        }
      />
    </Scene>
  ),
  where: () => (
    <Scene id="where" concepts={['where']} use layout="pipeline" takeaway={P.where.keyIdea}>
      <ConceptFlow projection={P.where} stepClauses={{ 2: 'where', 3: 'where' }} />
    </Scene>
  ),
  comparaciones: () => (
    <Scene
      id="comparaciones"
      concepts={['comparison']}
      use
      layout="pipeline"
      takeaway={P.comparison.keyIdea}
    >
      <ConceptFlow projection={P.comparison} />
      <OperatorStrip items={COMPARATORS} />
    </Scene>
  ),
  'and-or': () => (
    <Scene
      id="and-or"
      concepts={['and', 'or']}
      use={SQL_CONCEPTS.and.whyItMatters}
      layout="comparison"
      takeaway="AND: se cumplen todas. OR: basta con una."
    >
      <div className="scene-grid scene-grid--duo">
        <LogicPanel
          operator="AND"
          lead="exige que las dos condiciones sean verdaderas"
          conditions={[AND_A, AND_B]}
          examples={logicExamples(AND_A, AND_B, 'AND', [1, 6, 3])}
          names={firstColumn(
            "SELECT nombre\nFROM empleados\nWHERE ciudad = 'Bogotá'\n  AND salario > 5000000;",
          )}
        />
        <LogicPanel
          operator="OR"
          lead="acepta la fila si se cumple al menos una"
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
      <Scene id="parentesis" concepts={['logical-precedence']} use layout="comparison">
        <div className="scene-grid scene-grid--paren">
          <FlowStep number={1} title="Filas candidatas">
            <ParenthesesTable rows={PAREN_ROWS} />
          </FlowStep>
          <FlowArrow />
          <div className="scene-stack">
            <FlowStep number={2} title="Consulta sin paréntesis">
              <Code sql={PAREN_WITHOUT} />
              <p className="scene-warning">
                Oracle lee: Bogotá <strong>OR</strong> (Medellín <strong>AND</strong> salario &gt;
                5.000.000)
              </p>
            </FlowStep>
            <FlowStep number={3} title="Consulta con paréntesis">
              <Code sql={PAREN_WITH} />
              <p className="scene-good">Primero la ciudad; después, el salario.</p>
            </FlowStep>
          </div>
          <FlowArrow />
          <FlowStep number={4} title="Resultado en la tabla completa">
            <div className="scene-stack">
              <NameChips
                names={F.withoutParentheses}
                marked={extra}
                label={`Sin paréntesis: ${F.withoutParentheses.length} filas`}
                visibleLabel
              />
              <NameChips
                names={F.withParentheses}
                label={`Con paréntesis: ${F.withParentheses.length} filas`}
                visibleLabel
              />
            </div>
          </FlowStep>
        </div>
      </Scene>
    );
  },
  between: () => (
    <Scene id="between" concepts={['between']} use layout="pipeline">
      <ConceptFlow
        projection={P.between}
        after={
          <p className="flow-note">
            Equivale a <code>salario &gt;= 3000000 AND salario &lt;= 6000000</code>.
          </p>
        }
        resultWidth={12}
        result={
          <div className="scene-stack">
            <Data
              table={P.between.sample.result!}
              caption="Filas de la muestra dentro del rango"
              summary={resultSummary(P.between)}
            />
            <RangeLine
              low={3000000}
              high={6000000}
              compact
              points={P.between.sample.source.rows.map((row, index) => ({
                name: String(row[0]),
                value: Number(row[1]),
                inside: P.between.sample.source.rowStates?.[index] === 'kept',
              }))}
            />
          </div>
        }
      />
    </Scene>
  ),
  in: () => (
    <Scene id="in" concepts={['in']} use layout="pipeline">
      <ConceptFlow
        projection={P.in}
        layout="columns"
        after={
          <p className="flow-note">
            Equivale a <code>ciudad = &apos;Medellín&apos; OR ciudad = &apos;Cali&apos;</code>, más
            corto y fácil de ampliar.
          </p>
        }
      />
    </Scene>
  ),
  like: () => (
    <Scene id="like" concepts={['like']} use layout="pipeline">
      <ConceptFlow projection={P.like} />
      <div className="pattern-strip" aria-label="Otros patrones">
        <PatternCard pattern="%a" meaning="termina en a" table={F.likeEnds.source} />
        <PatternCard pattern="%ar%" meaning="contiene «ar»" table={F.likeContains.source} />
        <PatternCard
          pattern="_a%"
          meaning="_ = un carácter: a en 2.ª posición"
          table={F.likeSecond.source}
        />
      </div>
    </Scene>
  ),
  null: () => (
    <Scene id="null" concepts={['null', 'is-null']} use layout="pipeline">
      <ConceptFlow
        projection={P.isNull}
        resultAfter={
          <ul className="flow-facts" aria-label="NULL frente a 0 y a =">
            <li>
              <span aria-hidden="true">✓</span>Mario tiene 0: no es NULL
            </li>
            <li>
              <span className="is-no" aria-hidden="true">
                ✗
              </span>
              <code>bono = NULL</code> → {F.equalsNull} filas
            </li>
            <li>
              <span aria-hidden="true">✓</span>
              <code>IS NOT NULL</code> → {F.isNotNull} filas
            </li>
          </ul>
        }
      />
    </Scene>
  ),
  'order-by': () => (
    <Scene id="order-by" concepts={['order-by']} use layout="pipeline" takeaway={P.orderBy.keyIdea}>
      <ConceptFlow
        projection={P.orderBy}
        after={
          <ul className="flow-facts" aria-label="Sentidos del orden">
            <li>
              <span aria-hidden="true">↑</span>ASC: de menor a mayor (por defecto)
            </li>
            <li>
              <span aria-hidden="true">↓</span>DESC: de mayor a menor
            </li>
            <li>
              <span aria-hidden="true">✓</span>No cambia la tabla
            </li>
          </ul>
        }
      />
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
      <p className="anatomy-result">
        Resultado: <strong>{rows(F.anatomy)}</strong> · los empleados de Cali, del salario más alto
        al más bajo.
      </p>
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
      takeaway="Coma entre columnas, FROM siempre, comillas simples para textos e IS NULL para NULL."
    >
      <div className="error-cards">
        {ERRORS.map(({ id, title, part }) => {
          const mistake = SQL_CONCEPTS[id].mistake!;
          return (
            <ErrorCard
              key={id}
              title={title}
              wrong={sqlPart(mistake.wrong, part)}
              right={sqlPart(mistake.right, part)}
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
          <Code sql={INTEGRATED} />
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
      purpose="Una consulta le pregunta a una tabla y su resultado es otra tabla."
      takeaway="Tabla → consulta → operación → resultado: la tabla original no cambia."
    >
      <div className="scene-grid scene-grid--synthesis">
        <section className="scene-stack" aria-labelledby="scene-25-competencies">
          <h2 id="scene-25-competencies" className="scene-subtitle">
            Ahora ya puedes…
          </h2>
          <CompetencyGrid items={COMPETENCIES} />
        </section>
        <div className="scene-stack">
          <Code sql={SYNTHESIS} label="Todo junto" />
          <QueryParts parts={SYNTHESIS_PARTS} />
          <NameChips
            names={F.synthesis}
            label={`Resultado: ${F.synthesis.length} ciudades`}
            visibleLabel
          />
        </div>
      </div>
    </Scene>
  ),
  video: () => (
    <Scene
      id="video"
      layout="media"
      purpose="Repasa visualmente los conceptos esenciales antes del reto final."
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
      <div className="scene-grid scene-grid--live">
        <dl className="live-facts">
          <div>
            <dt>Qué harás</dt>
            <dd>Resolver las diez misiones del Challenge desde tu móvil, a la vez que la clase.</dd>
          </div>
          <div>
            <dt>Cómo entrar</dt>
            <dd>
              El profesor proyecta el QR de la sala; también puedes escribir su código en «En vivo».
            </dd>
          </div>
          <div>
            <dt>Qué evalúa</dt>
            <dd>
              Lo aprendido en la unidad, con {PRACTICE_RULES.maxScoredAttempts} intentos por misión
              y una pista opcional.
            </dd>
          </div>
          <div>
            <dt>Tu resultado</dt>
            <dd>Tus puntos entran al ranking de la sala; al final verás el resumen por misión.</dd>
          </div>
        </dl>
        <SceneQr path="/challenge" />
      </div>
    </Scene>
  ),
  proximos: () => (
    <Scene
      id="proximos"
      layout="summary"
      purpose="Hasta ahora aprendimos a consultar una tabla. Lo siguiente: resumir información, combinar tablas, crear consultas más complejas y modificar datos."
      takeaway={
        <>
          No forman parte de la evaluación de esta unidad; cada tema tiene su ficha en{' '}
          <Link href="/modules">la ruta de aprendizaje</Link>.
        </>
      }
    >
      <p className="scene-subtitle">Siguiente ruta recomendada · Próximamente</p>
      <FutureRoadmap topics={FUTURE_TOPICS} />
    </Scene>
  ),
  cierre: () => (
    <Scene
      id="cierre"
      title="¿Preguntas?"
      tone="night"
      layout="summary"
      purpose="Del dato a la consulta: lo esencial de la unidad en tres ideas."
      takeaway="Ya no estás viendo una tabla: ahora sabes hacerle preguntas."
    >
      <div className="scene-grid scene-grid--closing">
        <div className="scene-stack">
          <DataToQuery />
          <ol className="closing-ideas">
            <li>
              <code>SELECT</code> decide qué información queremos ver.
            </li>
            <li>
              <code>FROM</code> indica de dónde proviene.
            </li>
            <li>
              <code>WHERE</code>, <code>DISTINCT</code> y <code>ORDER BY</code> afinan filas,
              repetidos y orden.
            </li>
          </ol>
        </div>
        <div className="scene-closing">
          <section className="exit-questions" aria-labelledby="scene-30-questions">
            <h2 id="scene-30-questions" className="exit-questions__title">
              Preguntas de salida
            </h2>
            <ol>
              <li>¿Qué diferencia hay entre SELECT y WHERE?</li>
              <li>¿Cuándo usarías DISTINCT?</li>
              <li>¿Por qué NULL se consulta con IS NULL?</li>
            </ol>
          </section>
          <nav className="scene-links" aria-label="Seguir practicando">
            <Link href="/lab">Abrir el laboratorio →</Link>
            <Link href="/challenge">Iniciar Challenge →</Link>
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
