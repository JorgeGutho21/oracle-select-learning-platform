'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';
import type { ConceptProjection, ProjectedPart } from '@/application/didactic-projection';
import type { FlowTable } from '@/features/laboratory/application/lab-api';
import { requiredTableWidth } from '@/presentation/components/data/data-view';
import { highlightSql } from '@/presentation/components/data/sql-code';
import { ClauseCode, conceptRole, Data, Reveal, useClauseLink, type ClauseRole } from './scene-kit';

/**
 * Flujo pedagógico común de las escenas de conceptos (05–19):
 *
 *   1 TABLA ORIGEN → 2 CONSULTA → 3 QUÉ HACE CADA PARTE → 4 RESULTADO   (+ idea clave)
 *
 * La tabla de origen es una muestra de EMPLEADOS con solo las columnas del concepto; el
 * resultado es el de la consulta sobre esas mismas filas (proyección didáctica), con el
 * recuento en la tabla completa. En «Paso a paso» cada bloque aparece en su paso. En el
 * lienzo 16:9 los bloques van en fila o en dos columnas; en móvil, apilados en orden.
 */

export type FlowLayout = 'row' | 'columns';

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Ancho (em de la escena) que pide una tabla: la vista de datos usa 0,8 em. */
function tableWidth(table: FlowTable): number {
  return (
    requiredTableWidth(table.columns, table.rows, {
      size: 'large',
      states: Boolean(table.rowStates),
      duplicates: Boolean(table.duplicateRows?.length),
    }) *
      0.8 +
    0.4
  );
}

/** Ancho (em) del código: la línea más larga en monoespaciada al 92 %. */
export function codeWidth(sql: string): number {
  const longest = Math.max(...sql.split('\n').map((line) => line.length));
  return longest * 0.6 * 0.92 + 1.9;
}

export function FlowStep({
  number,
  title,
  children,
  className = '',
}: {
  readonly number: number;
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <Reveal at={number} className={`flow-step ${className}`.trim()}>
      <p className="flow-step__title">
        <span className="flow-step__number" aria-hidden="true">
          {number}
        </span>{' '}
        {title}
      </p>
      {children}
    </Reveal>
  );
}

/** «Qué hace cada parte»: fragmento del SQL, con su color semántico, y su función. */
export function QueryParts({ parts }: { readonly parts: readonly ProjectedPart[] }) {
  return (
    <dl className="query-parts">
      {parts.map((part) => (
        <div
          key={`${part.code}-${part.concept}`}
          className={`query-parts__item query-parts__item--${conceptRole(part.concept)}`}
        >
          <dt>
            <code>{highlightSql(part.code)}</code>
          </dt>
          <dd>{part.text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FlowArrow({ label }: { readonly label?: string }) {
  return (
    <p className="concept-flow__arrow" aria-hidden="true">
      <span>→</span>
      {label && <small>{label}</small>}
    </p>
  );
}

export function sourceSummary(projection: ConceptProjection): string {
  const shown = projection.sample.source.rows.length;
  return `${shown} de ${plural(projection.full.rows, 'fila', 'filas')} · muestra`;
}

export function resultSummary(projection: ConceptProjection): string {
  const { counts } = projection.sample;
  const all = projection.full;
  return counts.result === counts.source
    ? `${plural(counts.result, 'fila', 'filas')} · tabla completa: ${all.result} de ${all.rows}`
    : `${counts.result} de ${plural(counts.source, 'fila', 'filas')} · tabla completa: ${all.result} de ${all.rows}`;
}

export function ConceptFlow({
  projection,
  layout = 'row',
  result,
  resultWidth,
  after,
  queryAfter,
  resultAfter,
  stepClauses,
  sourceCaption = 'Tabla de origen: muestra de EMPLEADOS',
  resultCaption = 'Resultado de la consulta sobre la muestra',
}: {
  readonly projection: ConceptProjection;
  readonly layout?: FlowLayout;
  /** Resultado a medida (dos tablas comparadas, antes y después…). */
  readonly result?: ReactNode;
  /** Ancho (em) del resultado a medida. */
  readonly resultWidth?: number;
  /** Nota bajo las partes (equivalencias, reglas). */
  readonly after?: ReactNode;
  /** Nota bajo la consulta (qué hace y qué no hace). */
  readonly queryAfter?: ReactNode;
  /** Nota bajo el resultado. */
  readonly resultAfter?: ReactNode;
  /** En «Paso a paso», la cláusula que se resalta en cada paso (por defecto, ninguna). */
  readonly stepClauses?: Readonly<Record<number, ClauseRole>>;
  readonly sourceCaption?: string;
  readonly resultCaption?: string;
}) {
  const link = useClauseLink(stepClauses);
  const hintId = useId();
  const { sample } = projection;
  const source = (
    <FlowStep number={1} title="Tabla de origen" className="flow-step--source">
      <Data
        table={sample.source}
        caption={sourceCaption}
        summary={sourceSummary(projection)}
        explained={sample}
      />
    </FlowStep>
  );
  const query = (
    <FlowStep number={2} title="Consulta" className="flow-step--query">
      <ClauseCode sql={projection.sql} link={link} hintId={hintId} />
      <p id={hintId} className="visually-hidden">
        Pulsa una cláusula para resaltar los datos que usa.
      </p>
      {queryAfter}
    </FlowStep>
  );
  const parts = (
    <FlowStep number={3} title="Qué hace cada parte" className="flow-step--parts">
      <QueryParts parts={projection.parts} />
      {after}
    </FlowStep>
  );
  const output = (
    <FlowStep number={4} title="Resultado" className="flow-step--result">
      {result ??
        (sample.result && (
          <Data
            table={sample.result}
            caption={resultCaption}
            summary={resultSummary(projection)}
            explained={sample}
          />
        ))}
      {resultAfter}
    </FlowStep>
  );
  const sourceWidth = tableWidth(sample.source);
  const outputWidth = resultWidth ?? (sample.result ? tableWidth(sample.result) : 12);
  const queryWidth = Math.max(codeWidth(projection.sql), 13);
  const style =
    layout === 'row'
      ? {
          '--flow-columns': `minmax(0, ${sourceWidth.toFixed(1)}fr) auto minmax(0, ${queryWidth.toFixed(1)}fr) auto minmax(0, ${outputWidth.toFixed(1)}fr)`,
        }
      : {
          '--flow-columns': `minmax(0, ${Math.max(sourceWidth, queryWidth).toFixed(1)}fr) auto minmax(0, ${Math.max(outputWidth, 16).toFixed(1)}fr)`,
        };
  return (
    <div
      className={`concept-flow concept-flow--${layout}`}
      data-active-clause={link.active ?? undefined}
      style={style as CSSProperties}
    >
      {layout === 'row' ? (
        <>
          <div className="concept-flow__column">{source}</div>
          <FlowArrow />
          <div className="concept-flow__column">
            {query}
            {parts}
          </div>
          <FlowArrow />
          <div className="concept-flow__column">{output}</div>
        </>
      ) : (
        <>
          <div className="concept-flow__column">
            {source}
            {query}
          </div>
          <FlowArrow />
          <div className="concept-flow__column">
            {parts}
            {output}
          </div>
        </>
      )}
    </div>
  );
}
