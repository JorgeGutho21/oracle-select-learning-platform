'use client';

import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  EMPLEADOS_FIELD_GROUP_LIST,
  EMPLEADOS_SCHEMA_COLUMNS,
  EMPLEADOS_VIEW_SCHEMA,
} from '@/application/dataset-view';
import { Alert, Chip } from '@/presentation/components/ui';
import { DataView } from '@/presentation/components/data/data-view';
import { DatasetExplorer } from '@/presentation/components/data/dataset-explorer';
import { SchemaCards } from '@/presentation/components/data/schema-cards';
import { SqlCode } from '@/presentation/components/data/sql-code';
import {
  EMPLEADOS,
  type AnatomyRole,
  type CellValue,
  type DiagnosticGroup,
  type EmpleadoRow,
  type LabAnalysis,
  type LabDiagnostic,
} from '../application/lab-api';
import type { LabExecution } from '../application/execute-on-oracle';
import { explainOracleError } from '@/features/curriculum/application/learning-feedback';

/** Paneles del laboratorio. Solo presentan el análisis; no contienen reglas SQL. */

export function Panel({
  id,
  number,
  title,
  children,
  aside,
  className = '',
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`lab-panel ${className}`.trim()} aria-labelledby={id}>
      <header className="lab-panel__header">
        <h2 id={id} className="lab-panel__title">
          <span className="lab-panel__number" aria-hidden="true">
            {number}
          </span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function StaleNote({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <p className="lab-stale" role="status">
      La consulta cambió desde el último análisis: esto corresponde a la versión anterior. Pulsa
      «Analizar» para actualizarlo.
    </p>
  );
}

/* ---------- 6. Esquema y datos ---------- */

/**
 * El esquema primero (12 columnas agrupadas, las que usa la consulta resaltadas); los 20
 * registros, solo si se piden. Son los DATOS de origen, no el resultado de la consulta: se
 * rotulan y se enmarcan distinto para que no se confundan con lo que devuelve SELECT.
 */
export function SchemaPanel({ highlighted }: { highlighted: readonly string[] }) {
  return (
    <Panel id="lab-schema" number={6} title="Esquema disponible" className="lab-panel--wide">
      <p className="lab-schema__summary">
        <strong>EMPLEADOS</strong> · {EMPLEADOS.columns.length} columnas · {EMPLEADOS.rows.length}{' '}
        registros · {EMPLEADOS.id}
      </p>
      <SchemaCards
        label="Columnas de EMPLEADOS"
        groups={EMPLEADOS_FIELD_GROUP_LIST}
        columns={EMPLEADOS_SCHEMA_COLUMNS}
        highlighted={highlighted}
      />
      <details className="lab-schema__data">
        <summary>Ver los {EMPLEADOS.rows.length} registros</summary>
        <p className="lab-muted">
          Datos almacenados en la tabla EMPLEADOS. No es el resultado de tu consulta: ese está en el
          panel 2.
        </p>
        <DatasetExplorer
          caption={`Tabla EMPLEADOS · ${EMPLEADOS.rows.length} filas · ${EMPLEADOS.id}`}
          label="Datos de origen · EMPLEADOS"
          columns={EMPLEADOS.columns.map(({ name, type }) => ({ name, type }))}
          rows={EMPLEADOS.rows.map((row) =>
            EMPLEADOS.columns.map(({ name }) => row[name as keyof EmpleadoRow] ?? null),
          )}
          schema={EMPLEADOS_VIEW_SCHEMA}
          highlightedColumns={highlighted}
        />
      </details>
    </Panel>
  );
}

/* ---------- 6. Diagnóstico ---------- */

const GROUP_CLASS: Record<DiagnosticGroup, string> = {
  SINTAXIS: 'syntax',
  SEMÁNTICA: 'semantic',
  'ALCANCE EDUCATIVO': 'scope',
  ORACLE: 'oracle',
  ADVERTENCIA: 'warning',
};

const GROUP_HELP: Record<DiagnosticGroup, string> = {
  SINTAXIS: 'La consulta no está bien escrita y no se puede ejecutar.',
  SEMÁNTICA: 'Está bien escrita, pero usa algo que no existe o no encaja en EMPLEADOS.',
  'ALCANCE EDUCATIVO': 'Es SQL de Oracle que esta unidad todavía no enseña o no permite.',
  ORACLE: 'Es una regla propia de Oracle: la base de datos la rechazaría.',
  ADVERTENCIA: 'Se puede ejecutar, pero el resultado quizá no es el que buscas.',
};

/**
 * Un diagnóstico en el orden en que ayuda a aprender: categoría y qué ocurrió; dónde (el
 * editor lo subraya); por qué. La corrección no se regala: se abre solo si se pide.
 */
function DiagnosticItem({
  item,
  onApply,
}: {
  item: LabDiagnostic;
  onApply?: (sql: string) => void;
}) {
  return (
    <article
      className={`lab-diagnostic lab-diagnostic--${GROUP_CLASS[item.group]}`}
      aria-label={`${item.group}: ${item.message}`}
    >
      <header className="lab-diagnostic__header">
        <span className="lab-diagnostic__group">
          <span aria-hidden="true">{item.severity === 'error' ? '✗' : '!'}</span> {item.group}
        </span>
        <span className="lab-diagnostic__kind">{GROUP_HELP[item.group]}</span>
      </header>
      <p className="lab-diagnostic__message">{item.message}</p>
      <dl className="lab-diagnostic__details">
        <div>
          <dt>Dónde</dt>
          <dd>
            Línea {item.line}, columna {item.column}
          </dd>
        </div>
        <div>
          <dt>Encontrado</dt>
          <dd>
            <code>{item.found}</code>
          </dd>
        </div>
        {item.hint && (
          <div>
            <dt>Por qué</dt>
            <dd className="lab-hint">{item.hint}</dd>
          </div>
        )}
      </dl>
      {/* Primero la pista; la corrección se abre solo si el estudiante la pide. */}
      {item.correction && (
        <details className="lab-diagnostic__example lab-diagnostic__correction">
          <summary>Ver la posible corrección</summary>
          <p className="lab-diagnostic__fix-label">Cómo corregirlo</p>
          <code className="lab-diagnostic__fix">{item.correction}</code>
          {item.fixedSql && onApply && (
            <button
              type="button"
              className="ds-button ds-button--secondary"
              onClick={() => onApply(item.fixedSql!)}
            >
              Aplicar la corrección
            </button>
          )}
        </details>
      )}
      {item.example && (
        <details className="lab-diagnostic__example">
          <summary>Ver un ejemplo correcto</summary>
          <SqlCode sql={item.example} tone="success" />
        </details>
      )}
      <div className="lab-diagnostic__actions">
        {item.fixedSql && onApply && !item.correction && (
          <button
            type="button"
            className="ds-button ds-button--secondary"
            onClick={() => onApply(item.fixedSql!)}
          >
            Aplicar la corrección
          </button>
        )}
        {item.learnMore && (
          <Link className="inline-action" href={item.learnMore.href as Route}>
            Ver en Próximamente: {item.learnMore.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export function FeedbackPanel({
  analysis,
  stale,
  onApply,
}: {
  analysis: LabAnalysis | null;
  stale: boolean;
  onApply?: (sql: string) => void;
}) {
  return (
    <Panel id="lab-feedback" number={3} title="Diagnóstico" className="lab-panel--feedback">
      <div aria-live="polite" className="lab-stack">
        {!analysis ? (
          <p className="lab-empty">Escribe una consulta y pulsa «Analizar».</p>
        ) : (
          <>
            <StaleNote stale={stale} />
            {analysis.status === 'valid' && analysis.translation && (
              <Alert tone="success" title="Consulta válida dentro del subconjunto SELECT">
                <p>
                  {analysis.preview?.rows.length ?? 0} de {EMPLEADOS.rows.length} filas y{' '}
                  {analysis.preview?.columns.length ?? 0} columna
                  {analysis.preview?.columns.length === 1 ? '' : 's'} en el resultado. Columnas que
                  lee:{' '}
                  {[...new Set([...analysis.sourceColumns, ...analysis.conditionColumns])].join(
                    ', ',
                  )}
                  .
                </p>
              </Alert>
            )}
            {analysis.diagnostics.map((item, index) => (
              <DiagnosticItem
                key={`${item.from}-${index}`}
                item={item}
                {...(onApply ? { onApply } : {})}
              />
            ))}
          </>
        )}
      </div>
    </Panel>
  );
}

/* ---------- 3. Resultado ---------- */

/**
 * Tabla de resultados compartida por la vista previa educativa y la ejecución en Oracle:
 * siempre una tabla con las columnas y filas reales del resultado, en el orden de la
 * consulta. Si en móvil o tableta no caben todas las columnas, se reparte en bandas con el
 * mismo número de empleado; nunca en fichas por registro.
 */
export function ResultTableView({
  caption,
  label,
  columns,
  rows,
  sortedBy,
}: {
  caption: string;
  label: string;
  columns: readonly { name: string; type: 'number' | 'text' | 'date' }[];
  rows: readonly (readonly CellValue[])[];
  /** Columnas por las que se ordenó el resultado (ORDER BY), con su sentido. */
  sortedBy?: readonly { column: number; direction: 'ASC' | 'DESC' }[];
}) {
  return (
    <DataView
      caption={caption}
      label={label}
      summary={`${rows.length} ${rows.length === 1 ? 'fila' : 'filas'} · ${columns.length} ${
        columns.length === 1 ? 'columna' : 'columnas'
      }`}
      columns={columns}
      rows={rows}
      schema={EMPLEADOS_VIEW_SCHEMA}
      size="compact"
      className="dv--result"
      {...(sortedBy ? { sortedBy } : {})}
    />
  );
}

export function ResultPanel({
  analysis,
  stale,
  oracleStatus,
  execution,
  executing,
}: {
  analysis: LabAnalysis | null;
  stale: boolean;
  oracleStatus: ReactNode;
  execution: { sql: string; result: LabExecution } | null;
  executing: boolean;
}) {
  return (
    <Panel id="lab-result" number={2} title="Resultado">
      <div className="lab-result__block">
        <div className="lab-result__heading">
          <h3>Vista previa educativa</h3>
          <Chip tone="warning">No es una ejecución en Oracle</Chip>
        </div>
        <p className="lab-muted">
          Calculada en el navegador por el analizador del curso sobre el dataset {EMPLEADOS.id}.
          Sirve para comprender la consulta; no acredita el laboratorio real.
        </p>
        <StaleNote stale={stale} />
        {!analysis ? (
          <p className="lab-empty">Pulsa «Analizar» para ver qué devolvería la consulta.</p>
        ) : analysis.preview ? (
          <ResultTableView
            caption={`Vista previa: ${analysis.preview.rows.length} filas, ${analysis.preview.columns.length} columnas`}
            label="Resultado · vista educativa"
            columns={analysis.preview.columns}
            rows={analysis.preview.rows}
            sortedBy={orderOf(analysis)}
          />
        ) : (
          <p className="lab-empty">Sin vista previa: corrige los errores del diagnóstico.</p>
        )}
      </div>
      <div className="lab-result__block lab-result__block--oracle" aria-live="polite">
        {oracleStatus}
        {executing ? (
          <p className="lab-muted">Enviando la consulta al servicio Oracle…</p>
        ) : !execution ? (
          <p className="lab-muted">
            Pulsa «Ejecutar en Oracle» para ejecutar la consulta en el motor real.
          </p>
        ) : (
          <OracleOutcome
            execution={execution}
            stale={execution.sql !== analysis?.source}
            sortedBy={execution.sql === analysis?.source ? orderOf(analysis) : []}
          />
        )}
      </div>
    </Panel>
  );
}

/** Criterios de ORDER BY del resultado que son columnas, para marcar su encabezado. */
function orderOf(analysis: LabAnalysis | null): { column: number; direction: 'ASC' | 'DESC' }[] {
  const order = analysis?.preview?.trace.order ?? [];
  return order
    .filter(
      (entry): entry is { column: number; direction: 'ASC' | 'DESC' } => entry.column !== null,
    )
    .filter(
      (entry, index, all) => all.findIndex((other) => other.column === entry.column) === index,
    );
}

function OracleOutcome({
  execution,
  stale,
  sortedBy,
}: {
  execution: { sql: string; result: LabExecution };
  stale: boolean;
  sortedBy: readonly { column: number; direction: 'ASC' | 'DESC' }[];
}) {
  const { result } = execution;
  return (
    <div className="lab-stack">
      {stale && <p className="lab-stale">Resultado de una versión anterior de la consulta.</p>}
      {result.status === 'ok' && (
        <ResultTableView
          caption={`Oracle (${result.engine}) · ${result.rows.length} filas · ${result.elapsedMs} ms`}
          label="Resultado Oracle"
          columns={result.columns}
          rows={result.rows}
          sortedBy={sortedBy}
        />
      )}
      {result.status === 'unavailable' && (
        <div data-error-kind="application">
          <Alert tone="warning" title="Servicio Oracle no disponible">
            {result.message}
          </Alert>
        </div>
      )}
      {result.status === 'rejected' && (
        <Alert tone="danger" title="No se envió a Oracle">
          La consulta no pasó la validación del subconjunto: {result.message}
        </Alert>
      )}
      {result.status === 'oracle-error' && (
        <Alert
          tone="warning"
          title={explainOracleError(result.code)?.title ?? 'Revisa la consulta'}
        >
          <p>
            {explainOracleError(result.code)?.explanation ??
              'Oracle rechazó esta sentencia. Revisa la sintaxis y los datos de la consulta.'}
          </p>
          {explainOracleError(result.code) && (
            <p>
              <strong>Cómo corregirlo:</strong> {explainOracleError(result.code)!.correction}
            </p>
          )}
          <details>
            <summary>Oracle devolvió {result.code}</summary>
            <pre className="cu-oracle-error__message">{result.message}</pre>
          </details>
        </Alert>
      )}
    </div>
  );
}

/* ---------- 4. Traducción ---------- */

export function TranslationPanel({
  analysis,
  stale,
}: {
  analysis: LabAnalysis | null;
  stale: boolean;
}) {
  return (
    <Panel id="lab-translation" number={4} title="En lenguaje cotidiano">
      <StaleNote stale={stale} />
      {analysis?.translation ? (
        <div className="lab-stack">
          <p className="lab-translation__summary">{analysis.translation.summary}</p>
          <ol className="lab-steps">
            {analysis.translation.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="lab-empty">La traducción aparece cuando la consulta es válida.</p>
      )}
    </Panel>
  );
}

/* ---------- 5. Anatomía ---------- */

const roleClass: Record<AnatomyRole, string> = {
  select: 'keyword',
  distinct: 'keyword',
  from: 'keyword',
  where: 'keyword',
  order: 'keyword',
  logical: 'keyword',
  condition: 'condition',
  'order-item': 'order',
  star: 'column',
  column: 'column',
  expression: 'expression',
  alias: 'alias',
  separator: 'separator',
  table: 'table',
  terminator: 'separator',
};

export function AnatomyPanel({
  analysis,
  stale,
}: {
  analysis: LabAnalysis | null;
  stale: boolean;
}) {
  const parts = analysis?.anatomy ?? [];
  const numbered = parts.filter((part) => part.role !== 'separator');
  const source = analysis?.source ?? '';
  const segments: ReactNode[] = [];
  let cursor = 0;
  parts.forEach((part, index) => {
    if (part.span.start > cursor) segments.push(source.slice(cursor, part.span.start));
    const number = numbered.indexOf(part) + 1;
    segments.push(
      <mark key={index} className={`lab-part lab-part--${roleClass[part.role]}`}>
        {source.slice(part.span.start, part.span.end)}
        {number > 0 && (
          <sup className="lab-part__index" aria-hidden="true">
            {number}
          </sup>
        )}
      </mark>,
    );
    cursor = part.span.end;
  });
  if (cursor < source.length) segments.push(source.slice(cursor));

  return (
    <Panel id="lab-anatomy" number={5} title="Anatomía de la consulta">
      <StaleNote stale={stale} />
      {parts.length === 0 ? (
        <p className="lab-empty">La anatomía aparece cuando la consulta es válida.</p>
      ) : (
        <div className="lab-anatomy">
          <pre className="lab-anatomy__code" aria-label="Consulta con sus partes marcadas">
            <code>{segments}</code>
          </pre>
          <ol className="lab-anatomy__legend">
            {numbered.map((part, index) => (
              <li key={index} className={`lab-legend lab-legend--${roleClass[part.role]}`}>
                <span className="lab-legend__label">{part.label}</span>
                <code>{part.text}</code>
                <span className="lab-legend__text">{part.explanation}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  );
}
