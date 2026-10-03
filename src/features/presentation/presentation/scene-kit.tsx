'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { useSceneStep } from './scene-step';
import {
  CONCEPT_CATEGORY_LABEL,
  SQL_CONCEPTS,
  type ConceptId,
  type SqlConcept,
} from '@/application/sql-concepts';
import type { ExplainedQuery, FlowTable } from '@/features/laboratory/application/lab-api';
import { FlowTableView } from '@/presentation/components/data/query-flow';
import { highlightSql, SqlCode } from '@/presentation/components/data/sql-code';
import { sceneBlock, sceneNumber, SCENES } from '../application/presentation-api';

/**
 * Piezas comunes de las escenas del Modo Exposición. Toda escena sigue la misma plantilla:
 * encabezado (número, bloque y título), definición o propósito, contenido e idea clave.
 * Las medidas están en em para escalar con el lienzo 16:9.
 */

/* ---------- Paso a paso ---------- */

export { Reveal, SceneStepContext, useSceneStep, type SceneStep } from './scene-step';

/* ---------- Plantilla ---------- */

export type SceneTone = 'light' | 'soft' | 'night' | 'tech';
export type SceneLayout =
  | 'cover'
  | 'concept'
  | 'comparison'
  | 'pipeline'
  | 'transformation'
  | 'steps'
  | 'practice'
  | 'summary'
  | 'media'
  | 'live';

export interface SceneProps {
  readonly id: string;
  /** Título visible; por defecto, el del guion de escenas. */
  readonly title?: string;
  readonly tone?: SceneTone;
  readonly layout?: SceneLayout;
  /** Conceptos que la escena define (el bloque «Definición»). */
  readonly concepts?: readonly ConceptId[];
  /** Si la escena no introduce un concepto: su propósito. */
  readonly purpose?: ReactNode;
  /** «Cómo leerlo en español»: frase o `true` para usar la del primer concepto. */
  readonly reading?: string | true;
  /** «Para qué sirve»: frase o `true` para usar la del primer concepto. */
  readonly use?: ReactNode | true;
  /** Idea clave (una línea); por defecto, la del primer concepto. */
  readonly takeaway?: ReactNode | false;
  readonly children: ReactNode;
}

export function Scene({
  id,
  title,
  tone = 'light',
  layout = 'concept',
  concepts = [],
  purpose,
  reading,
  use,
  takeaway,
  children,
}: SceneProps) {
  const number = sceneNumber(id);
  const outline = SCENES[number - 1]!;
  const first = concepts[0] ? SQL_CONCEPTS[concepts[0]] : null;
  const category = first ? CONCEPT_CATEGORY_LABEL[first.category] : null;
  const key = takeaway === undefined ? first?.keyTakeaway : takeaway;
  return (
    <article
      className={`scene scene--${tone} scene--${layout}`}
      aria-labelledby={`scene-title-${number}`}
      data-scene={number}
      data-scene-id={id}
    >
      <header className="scene__header">
        <span className="scene__number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
        <div className="scene__heading">
          <p className="scene__eyebrow">
            {sceneBlock(outline).title}
            {category && <span className="scene__category">{category}</span>}
          </p>
          <h1 id={`scene-title-${number}`} className="scene__title" tabIndex={-1}>
            {title ?? outline.title}
          </h1>
        </div>
      </header>
      {(concepts.length > 0 || purpose) && (
        <ConceptIntro
          concepts={concepts}
          purpose={purpose}
          reading={reading === true ? first?.humanReading : reading}
          use={use === true ? first?.whyItMatters : use}
        />
      )}
      <div className="scene__main">{children}</div>
      {key && (
        <p className="scene-takeaway">
          <span className="scene-takeaway__label">Idea clave</span> <span>{key}</span>
        </p>
      )}
    </article>
  );
}

/** Pone en negrita el término con el que empieza la definición («WHERE conserva…»). */
function DefinitionText({ concept }: { readonly concept: SqlConcept }) {
  const { definition, title } = concept;
  if (definition.startsWith(title)) {
    return (
      <>
        <strong className="concept-intro__term">{title}</strong>
        {definition.slice(title.length)}
      </>
    );
  }
  return <>{definition}</>;
}

/**
 * Bloque «Definición» (o «Propósito») bajo el título: visible, breve y con la categoría
 * correcta del término (cláusula, operador lógico, condición…). Sale de la fuente
 * conceptual única, igual que en el Estudio, los Recursos y el buscador.
 */
export function ConceptIntro({
  concepts = [],
  purpose,
  reading,
  use,
}: {
  readonly concepts?: readonly ConceptId[];
  readonly purpose?: ReactNode;
  readonly reading?: string | undefined;
  readonly use?: ReactNode;
}) {
  const items = concepts.map((id) => SQL_CONCEPTS[id]);
  return (
    <section className="concept-intro" aria-label={items.length > 0 ? 'Definición' : 'Propósito'}>
      <p className="concept-intro__label">{items.length > 0 ? 'Definición' : 'Propósito'}</p>
      <div className="concept-intro__body">
        {items.length === 0 && <p className="concept-intro__text">{purpose}</p>}
        {items.length === 1 && (
          <p className="concept-intro__text">
            <DefinitionText concept={items[0]!} />
          </p>
        )}
        {items.length > 1 && (
          <ul className="concept-intro__list">
            {items.map((item) => (
              <li key={item.id}>
                <DefinitionText concept={item} />
              </li>
            ))}
          </ul>
        )}
        {use && (
          <p className="concept-intro__use">
            <span>Para qué sirve</span> {use}
          </p>
        )}
        {reading && (
          <p className="concept-intro__reading">
            <span>Cómo leerlo</span> «{reading}»
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- Código y datos ---------- */

export function Code({
  sql,
  label,
  tone,
}: {
  readonly sql: string;
  readonly label?: string;
  readonly tone?: 'default' | 'error' | 'success';
}) {
  return (
    <SqlCode sql={sql} size="large" {...(label ? { label } : {})} {...(tone ? { tone } : {})} />
  );
}

export function Data({
  table,
  caption,
  label,
  summary,
  explained,
}: {
  readonly table: FlowTable;
  readonly caption: string;
  readonly label?: string;
  readonly summary?: string;
  /** Consulta de la que salen los datos: activa el enlace código ↔ columnas. */
  readonly explained?: ExplainedQuery;
}) {
  return (
    <FlowTableView
      table={table}
      caption={caption}
      size="large"
      {...(label ? { label } : {})}
      {...(summary !== undefined ? { summary } : {})}
      {...(explained ? { columnRoles: explained.columnRoles } : {})}
    />
  );
}

/** Resultado compacto como fichas de nombres, cuando una tabla sería demasiado. */
export function NameChips({
  names,
  marked = [],
  label,
  visibleLabel = false,
}: {
  readonly names: readonly string[];
  /** Nombres que se destacan (por ejemplo, los que cambian entre dos consultas). */
  readonly marked?: readonly string[];
  readonly label: string;
  /** Muestra el rótulo encima de la lista (además de nombrarla). */
  readonly visibleLabel?: boolean;
}) {
  const list = (
    <ul className="name-chips" aria-label={label}>
      {names.map((name) => (
        <li key={name} className={marked.includes(name) ? 'is-marked' : undefined}>
          {name}
          {marked.includes(name) && <span className="visually-hidden"> (cambia)</span>}
        </li>
      ))}
    </ul>
  );
  if (!visibleLabel) return list;
  return (
    <div className="name-chips-block">
      <p className="name-chips-block__label" aria-hidden="true">
        {label}
      </p>
      {list}
    </div>
  );
}

/* ---------- Enlace código ↔ datos ---------- */

export type ClauseRole = 'select' | 'from' | 'where' | 'order';

const CLAUSE_OF_LINE: readonly [RegExp, ClauseRole][] = [
  [/^\s*SELECT\b/i, 'select'],
  [/^\s*FROM\b/i, 'from'],
  [/^\s*(WHERE|AND|OR)\b/i, 'where'],
  [/^\s*ORDER\s+BY\b/i, 'order'],
];

const CLAUSE_HINT: Readonly<Record<ClauseRole, string>> = {
  select: 'resalta las columnas que se muestran',
  from: 'resalta la tabla de origen',
  where: 'resalta la condición y las filas que cumplen',
  order: 'resalta la columna del orden',
};

/** Parte una consulta en tramos por cláusula (una cláusula por línea, como en las escenas). */
export function clauseLines(sql: string): { readonly role: ClauseRole; readonly text: string }[] {
  const lines = sql.split('\n');
  const result: { role: ClauseRole; text: string }[] = [];
  for (const line of lines) {
    const role = CLAUSE_OF_LINE.find(([pattern]) => pattern.test(line))?.[1];
    const last = result.at(-1);
    if (role && (!last || last.role !== role || role !== 'where' || /^\s*WHERE/i.test(line))) {
      result.push({ role, text: line });
    } else if (last) {
      last.text += `\n${line}`;
    } else {
      result.push({ role: 'select', text: line });
    }
  }
  return result;
}

/**
 * Código SQL con una cláusula por línea convertida en botón: al señalarla, enfocarla o
 * pulsarla, el contenedor marca `data-active-clause` y las tablas enlazadas resaltan sus
 * columnas y filas. Funciona con teclado (Tab y Enter), no solo con el puntero.
 */
export function useClauseLink(stepClauses?: Readonly<Record<number, ClauseRole>>) {
  const [pinned, setPinned] = useState<ClauseRole | null>(null);
  const [hovered, setHovered] = useState<ClauseRole | null>(null);
  const step = useSceneStep();
  return {
    active: hovered ?? pinned ?? stepClauses?.[step] ?? null,
    pinned,
    setPinned,
    setHovered,
  };
}

export function ClauseCode({
  sql,
  label,
  link,
  hintId,
  className = '',
}: {
  readonly sql: string;
  readonly label?: string;
  readonly link: ReturnType<typeof useClauseLink>;
  readonly hintId: string;
  readonly className?: string;
}) {
  const parts = clauseLines(sql);
  const { pinned, setPinned, setHovered } = link;
  return (
    <figure className={`sql-code sql-code--large ${className}`.trim()}>
      {label && <figcaption className="sql-code__label">{label}</figcaption>}
      <pre className="sql-code__pre" aria-label={label ?? 'Consulta SQL'}>
        <code>
          {parts.map((part, index) => (
            <button
              key={`${part.role}-${index}`}
              type="button"
              className="sql-clause"
              data-clause={part.role}
              aria-pressed={pinned === part.role}
              aria-describedby={hintId}
              aria-label={`${part.text.trim()}: ${CLAUSE_HINT[part.role]}`}
              onMouseEnter={() => setHovered(part.role)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(part.role)}
              onBlur={() => setHovered(null)}
              onClick={() => setPinned(pinned === part.role ? null : part.role)}
            >
              {highlightSql(part.text)}
            </button>
          ))}
        </code>
      </pre>
    </figure>
  );
}

/* ---------- «En esta consulta» ---------- */

/** Papel semántico de cada concepto: el mismo color en toda la plataforma. */
const CONCEPT_ROLE: Partial<
  Record<ConceptId, 'select' | 'from' | 'filter' | 'order' | 'operator'>
> = {
  select: 'select',
  star: 'select',
  'column-list': 'select',
  comma: 'select',
  distinct: 'select',
  alias: 'select',
  as: 'select',
  from: 'from',
  table: 'from',
  where: 'filter',
  comparison: 'filter',
  and: 'filter',
  or: 'filter',
  not: 'filter',
  between: 'filter',
  in: 'filter',
  like: 'filter',
  percent: 'filter',
  underscore: 'filter',
  null: 'filter',
  'is-null': 'filter',
  'is-not-null': 'filter',
  'order-by': 'order',
  asc: 'order',
  desc: 'order',
  expression: 'operator',
  'arithmetic-precedence': 'operator',
  parentheses: 'operator',
  concat: 'operator',
};

/** Papel semántico (color) de un concepto: select, from, filter, order, operator o neutral. */
export function conceptRole(id: ConceptId): string {
  return CONCEPT_ROLE[id] ?? 'neutral';
}

/**
 * Diccionario visual de la consulta mostrada: solo los elementos presentes, con la glosa
 * breve de la fuente conceptual única («SELECT · elige qué columnas mostrar»).
 */
export function QueryGlossary({
  ids,
  label = 'En esta consulta',
}: {
  readonly ids: readonly ConceptId[];
  readonly label?: string;
}) {
  return (
    <section className="query-glossary" aria-label={label}>
      <p className="query-glossary__label">{label}</p>
      <dl className="query-glossary__list">
        {ids.map((id) => (
          <div
            key={id}
            className={`query-glossary__item query-glossary__item--${CONCEPT_ROLE[id] ?? 'neutral'}`}
          >
            <dt>
              <code>{SQL_CONCEPTS[id].title}</code>
            </dt>
            <dd>{SQL_CONCEPTS[id].gloss}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
