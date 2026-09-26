'use client';

import { Fragment, useId, useState, type ReactNode } from 'react';
import type { FlowTable } from '@/features/laboratory/application/lab-api';
import { formatNumber } from '@/presentation/components/data/cell-format';
import {
  highlightSql,
  SqlCode as SqlBlock,
  SqlLines,
} from '@/presentation/components/data/sql-code';

/**
 * Visualizaciones propias de las escenas: cada una representa un concepto (un rango, una
 * lista, una condición lógica) en lugar de una tabla genérica. Solo presentan: los datos y
 * los recuentos se calculan en `presentation-scenes.tsx` con el motor educativo.
 */

/* ---------- Ruta de aprendizaje (escenas 02 y 25) ---------- */

export interface RouteStage {
  readonly title: string;
  readonly glyph: string;
  readonly concepts: string;
}

export function RouteMap({
  stages,
  completed = false,
}: {
  readonly stages: readonly RouteStage[];
  readonly completed?: boolean;
}) {
  return (
    <ol className="route-map" data-completed={completed || undefined}>
      {stages.map((stage, index) => (
        <li key={stage.title} className="route-map__stage">
          <span className="route-map__number" aria-hidden="true">
            {completed ? '✓' : String(index + 1).padStart(2, '0')}
          </span>
          <span className="route-map__glyph" aria-hidden="true">
            {stage.glyph}
          </span>
          <strong className="route-map__title">
            {stage.title}
            {completed && <span className="visually-hidden"> (completado)</span>}
          </strong>
          <span className="route-map__concepts">{stage.concepts}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Qué es SQL (escena 03) ---------- */

export function SqlJourney({
  question,
  sql,
  names,
}: {
  readonly question: string;
  readonly sql: string;
  readonly names: readonly string[];
}) {
  return (
    <ol className="journey" aria-label="De la pregunta al resultado">
      <li className="journey__step">
        <span className="journey__who">Persona</span>
        <p className="journey__question">«{question}»</p>
      </li>
      <li className="journey__step journey__step--sql">
        <span className="journey__who">SQL</span>
        <pre className="journey__code">
          <code>
            <SqlLines sql={sql} />
          </code>
        </pre>
      </li>
      <li className="journey__step">
        <span className="journey__who">Base de datos</span>
        <p>
          <strong>Oracle Database</strong> busca en la tabla <code>EMPLEADOS</code>
        </p>
      </li>
      <li className="journey__step journey__step--result">
        <span className="journey__who">Resultado</span>
        <ul className="name-chips" aria-label={`${names.length} filas`}>
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </li>
    </ol>
  );
}

/* ---------- Cifras (escena 04) ---------- */

export function MetricStrip({
  items,
}: {
  readonly items: readonly { readonly value: ReactNode; readonly label: string }[];
}) {
  return (
    <ul className="metric-strip">
      {items.map((item) => (
        <li key={item.label}>
          <strong>{item.value}</strong> <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- SELECT * (escena 06) ---------- */

export function ColumnGrid({
  columns,
  groups,
}: {
  readonly columns: readonly { readonly name: string; readonly oracleType: string }[];
  readonly groups: readonly {
    readonly id: string;
    readonly title: string;
    readonly columns: readonly string[];
  }[];
}) {
  const groupOf = (name: string) => groups.find((group) => group.columns.includes(name));
  return (
    <div className="column-grid">
      <ol className="column-grid__list" aria-label="Las 12 columnas que expande el asterisco">
        {columns.map((column, index) => (
          <li key={column.name} className={`column-grid__item group--${groupOf(column.name)?.id}`}>
            <span className="column-grid__index" aria-hidden="true">
              {index + 1}
            </span>
            <code>{column.name}</code>
          </li>
        ))}
      </ol>
      <ul className="group-legend" aria-label="Grupos de columnas">
        {groups.map((group) => (
          <li key={group.id} className={`group--${group.id}`}>
            {group.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Expresiones (escena 08) ---------- */

export function ExpressionCard({
  expression,
  order,
  value,
  tone = 'default',
}: {
  readonly expression: string;
  /** Pasos del cálculo en orden: «bono × 12», «+ salario». */
  readonly order: readonly string[];
  /** Resultado para Ana. */
  readonly value: string;
  readonly tone?: 'default' | 'accent';
}) {
  return (
    <div className={`expression-card expression-card--${tone}`}>
      <code className="expression-card__code">{highlightSql(expression)}</code>
      <ol className="expression-card__order">
        {order.map((step, index) => (
          <li key={step}>
            <span aria-hidden="true">{index + 1}.º</span> {step}
          </li>
        ))}
      </ol>
      <p className="expression-card__value">
        Ana <span aria-hidden="true">→</span> <strong>{value}</strong>
      </p>
    </div>
  );
}

/* ---------- Comparadores (escena 12) ---------- */

export function ComparatorScale({
  items,
  total,
}: {
  readonly items: readonly {
    readonly operator: string;
    readonly meaning: string;
    readonly condition: string;
    readonly count: number;
  }[];
  readonly total: number;
}) {
  return (
    <div className="comparator-scale">
      <p className="comparator-scale__axis" aria-hidden="true">
        <span>menor</span>
        <span>mayor</span>
      </p>
      <ol className="comparator-scale__list">
        {items.map((item) => (
          <li key={item.operator} className="comparator-scale__item">
            <code className="comparator-scale__operator">{item.operator}</code>
            <span className="comparator-scale__meaning">{item.meaning}</span>
            <code className="comparator-scale__condition">{highlightSql(item.condition)}</code>
            <span className="comparator-scale__count">
              <strong>{item.count}</strong> de {total} filas
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- AND y OR (escena 13) ---------- */

function Truth({ value }: { readonly value: boolean }) {
  return (
    <span className={`truth truth--${value ? 'yes' : 'no'}`}>
      <span aria-hidden="true">{value ? '✓' : '✗'}</span>
      <span className="visually-hidden">{value ? 'verdadero' : 'falso'}</span>
    </span>
  );
}

export function LogicPanel({
  operator,
  lead,
  conditions,
  examples,
  names,
}: {
  readonly operator: 'AND' | 'OR';
  readonly lead: string;
  readonly conditions: readonly [string, string];
  readonly examples: readonly {
    readonly name: string;
    readonly a: boolean;
    readonly b: boolean;
    readonly result: boolean;
  }[];
  readonly names: readonly string[];
}) {
  return (
    <section className={`logic-panel logic-panel--${operator.toLowerCase()}`} aria-label={operator}>
      <p className="logic-panel__lead">
        <code>{operator}</code> {lead}
      </p>
      <SqlBlock
        sql={`WHERE ${conditions[0]}\n${operator === 'AND' ? '  AND' : '   OR'} ${conditions[1]}`}
      />
      <table className="logic-panel__table">
        <caption className="visually-hidden">
          Cómo decide {operator} con dos condiciones, fila por fila
        </caption>
        <thead>
          <tr>
            <th scope="col">Empleado</th>
            <th scope="col">
              <code>{highlightSql(conditions[0])}</code>
            </th>
            <th scope="col">
              <code>{highlightSql(conditions[1])}</code>
            </th>
            <th scope="col">¿Pasa?</th>
          </tr>
        </thead>
        <tbody>
          {examples.map((example) => (
            <tr key={example.name}>
              <th scope="row">{example.name}</th>
              <td>
                <Truth value={example.a} />
              </td>
              <td>
                <Truth value={example.b} />
              </td>
              <td className="logic-panel__result">
                <Truth value={example.result} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="logic-panel__names">
        <strong>{names.length} filas:</strong> {names.join(' · ')}
      </p>
    </section>
  );
}

/* ---------- BETWEEN (escena 15) ---------- */

export function RangeLine({
  low,
  high,
  points,
}: {
  readonly low: number;
  readonly high: number;
  readonly points: readonly {
    readonly name: string;
    readonly value: number;
    readonly inside: boolean;
  }[];
}) {
  const values = points.map((point) => point.value);
  const min = Math.floor(Math.min(...values, low) / 1_000_000) * 1_000_000;
  const max = Math.ceil(Math.max(...values, high) / 1_000_000) * 1_000_000;
  const x = (value: number) => 4 + ((value - min) / (max - min)) * 92;
  const ticks: number[] = [];
  for (let tick = min; tick <= max; tick += 1_000_000) ticks.push(tick);
  const inside = points.filter((point) => point.inside).length;
  // Puntos del mismo salario se apilan para que todos se vean.
  const stack = new Map<number, number>();
  return (
    <figure className="range-line">
      <svg
        viewBox="0 0 100 34"
        role="img"
        aria-label={`Salarios de los ${points.length} empleados en una recta: ${inside} están entre ${formatNumber(low)} y ${formatNumber(high)}, límites incluidos.`}
      >
        <rect
          className="range-line__band"
          x={x(low)}
          y="6"
          width={x(high) - x(low)}
          height="16"
          rx="1.5"
        />
        <line className="range-line__axis" x1="4" x2="96" y1="22" y2="22" />
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="range-line__tick" x1={x(tick)} x2={x(tick)} y1="21" y2="23.5" />
            <text className="range-line__tick-label" x={x(tick)} y="28" textAnchor="middle">
              {tick / 1_000_000}M
            </text>
          </g>
        ))}
        {[low, high].map((limit) => (
          <line
            key={limit}
            className="range-line__limit"
            x1={x(limit)}
            x2={x(limit)}
            y1="4"
            y2="24"
          />
        ))}
        {points.map((point) => {
          const level = stack.get(point.value) ?? 0;
          stack.set(point.value, level + 1);
          return (
            <circle
              key={point.name}
              className={point.inside ? 'range-line__dot is-in' : 'range-line__dot'}
              cx={x(point.value)}
              cy={18 - level * 3.2}
              r="1.35"
            />
          );
        })}
      </svg>
      <figcaption className="range-line__legend">
        <span className="range-line__key range-line__key--in">
          <span aria-hidden="true">●</span> dentro del rango ({inside})
        </span>
        <span className="range-line__key">
          <span aria-hidden="true">○</span> fuera ({points.length - inside})
        </span>
        <span className="range-line__key range-line__key--limit">
          <span aria-hidden="true">┃</span> límites {formatNumber(low)} y {formatNumber(high)}:
          incluidos
        </span>
      </figcaption>
    </figure>
  );
}

/* ---------- IN (escena 16) ---------- */

export function ListChips({
  column,
  values,
}: {
  readonly column: string;
  readonly values: readonly string[];
}) {
  return (
    <p className="list-chips">
      <code className="list-chips__column">{column}</code>
      <span className="list-chips__in">IN</span>
      <span className="list-chips__paren" aria-hidden="true">
        (
      </span>
      {values.map((value, index) => (
        <Fragment key={value}>
          <span className="list-chips__value">{value}</span>
          {index < values.length - 1 && <span className="visually-hidden">, </span>}
        </Fragment>
      ))}
      <span className="list-chips__paren" aria-hidden="true">
        )
      </span>
    </p>
  );
}

/* ---------- LIKE (escena 17) ---------- */

export function PatternCard({
  pattern,
  meaning,
  table,
}: {
  readonly pattern: string;
  readonly meaning: string;
  /** Tabla de NOMBRE con el estado de cada fila y las marcas de coincidencia. */
  readonly table: FlowTable;
}) {
  return (
    <div className="pattern-card">
      <p className="pattern-card__head">
        <code className="pattern-card__pattern">{highlightSql(`'${pattern}'`)}</code>{' '}
        <span>{meaning}</span>
      </p>
      <ul className="pattern-card__examples">
        {table.rows.map((row, index) => {
          const kept = table.rowStates?.[index] === 'kept';
          const mark = table.cellMarks?.[index]?.[0];
          const name = String(row[0] ?? '');
          return (
            <li key={name} className={kept ? 'is-kept' : 'is-discarded'}>
              <span aria-hidden="true">{kept ? '✓' : '✗'}</span>{' '}
              {mark?.kind === 'like' ? (
                <span className="dv-like">
                  {mark.segments.map((segment, position) =>
                    segment.kind === 'literal' ? (
                      <mark key={position} className="dv-like__literal">
                        {segment.text}
                      </mark>
                    ) : (
                      <Fragment key={position}>{segment.text}</Fragment>
                    ),
                  )}
                </span>
              ) : (
                name
              )}
              <span className="visually-hidden">{kept ? ' (cumple)' : ' (no cumple)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Anatomía (escena 20) ---------- */

export interface AnatomyClause {
  readonly role: 'select' | 'from' | 'where' | 'order';
  readonly keyword: string;
  readonly content: string;
  /** Qué pregunta responde: «¿qué mostrar?». */
  readonly question: string;
  /** Qué es lo que va después de la palabra clave: «columnas». */
  readonly part: string;
  readonly definition: string;
  /** Paso del orden lógico de evaluación. */
  readonly logical: number;
}

/**
 * Anatomía interactiva: cada cláusula es un botón (puntero, foco o teclado) que muestra su
 * papel, su definición y en qué paso la evalúa Oracle.
 */
export function SqlAnatomy({ clauses }: { readonly clauses: readonly AnatomyClause[] }) {
  const [active, setActive] = useState<AnatomyClause['role']>('select');
  const detailId = useId();
  const current = clauses.find((clause) => clause.role === active) ?? clauses[0]!;
  return (
    <div className="anatomy" data-active={active}>
      <ol className="anatomy__rows" aria-label="Partes de la consulta">
        {clauses.map((clause) => (
          <li key={clause.role}>
            <button
              type="button"
              className={`anatomy__row anatomy__row--${clause.role}`}
              aria-pressed={active === clause.role}
              aria-controls={detailId}
              onMouseEnter={() => setActive(clause.role)}
              onFocus={() => setActive(clause.role)}
              onClick={() => setActive(clause.role)}
            >
              <span className="anatomy__keyword">
                <code>{clause.keyword}</code>
                <small>{clause.question}</small>
              </span>
              <span className="anatomy__content">
                <code>{highlightSql(clause.content)}</code>
                <small>{clause.part}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <aside id={detailId} className="anatomy__detail" aria-live="polite">
        <p className="anatomy__detail-title">
          <code>{current.keyword}</code> · {current.question}
        </p>
        <p>{current.definition}</p>
        <p className="anatomy__logical">
          Oracle la evalúa en el paso <strong>{current.logical}</strong> de 4.
        </p>
      </aside>
    </div>
  );
}

/* ---------- Errores (escena 22) ---------- */

export function ErrorCard({
  title,
  wrong,
  why,
  right,
}: {
  readonly title: string;
  readonly wrong: string;
  readonly why: string;
  readonly right: string;
}) {
  return (
    <article className="error-card">
      <h2 className="error-card__title">{title}</h2>
      <p className="error-card__line error-card__line--wrong">
        <span aria-hidden="true">✗</span>
        <span className="visually-hidden">Con error: </span>
        <code>{highlightSql(wrong)}</code>
      </p>
      <p className="error-card__why">
        <span className="error-card__label">Causa</span> {why}
      </p>
      <p className="error-card__line error-card__line--right">
        <span aria-hidden="true">✓</span>
        <span className="visually-hidden">Corrección: </span>
        <code>{highlightSql(right)}</code>
      </p>
    </article>
  );
}

/* ---------- Challenge (escena 24) ---------- */

const DIFFICULTY_LABEL = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' } as const;

export function MissionPath({
  missions,
}: {
  readonly missions: readonly {
    readonly id: string;
    readonly title: string;
    readonly difficulty: 'facil' | 'media' | 'dificil';
  }[];
}) {
  return (
    <ol className="mission-path" aria-label="Las diez misiones">
      {missions.map((mission, index) => (
        <li
          key={mission.id}
          className={`mission-path__item mission-path__item--${mission.difficulty}${
            index === missions.length - 1 ? ' is-final' : ''
          }`}
        >
          <span className="mission-path__id">{mission.id}</span>
          <span className="mission-path__title">{mission.title}</span>
          <span className="mission-path__level">{DIFFICULTY_LABEL[mission.difficulty]}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Flujos de pasos (escenas 23 y 27) ---------- */

export function StepFlow({
  steps,
  label,
}: {
  readonly steps: readonly { readonly title: string; readonly text: string }[];
  readonly label: string;
}) {
  return (
    <ol className="step-flow" aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.title} className="step-flow__item">
          <span className="step-flow__number" aria-hidden="true">
            {index + 1}
          </span>
          <strong>{step.title}</strong>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Próximos niveles (escena 28) ---------- */

export function LevelRoadmap({
  levels,
}: {
  readonly levels: readonly {
    readonly number: number;
    readonly name: string;
    readonly summary: string;
    readonly examples: string;
  }[];
}) {
  return (
    <ol className="level-roadmap">
      {levels.map((level) => (
        <li key={level.number} className="level-roadmap__item">
          <span className="level-roadmap__number">Nivel {level.number}</span>
          <strong className="level-roadmap__name">{level.name}</strong>
          <span className="level-roadmap__summary">{level.summary}</span>
          <code className="level-roadmap__examples">{level.examples}</code>
        </li>
      ))}
    </ol>
  );
}
