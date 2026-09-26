'use client';

import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Alert, Chip, DataTable } from '@/presentation/components/ui';
import { CellValueView } from '@/presentation/components/data/cell-format';
import { DatasetTable } from '@/presentation/components/data/dataset-table';
import { SqlCode } from '@/presentation/components/data/sql-code';
import {
  EMPLEADOS,
  type AnatomyRole,
  type CellValue,
  type DiagnosticGroup,
  type EmpleadoRow,
  type LabAnalysis,
  type LabDiagnostic,
  type OracleServiceStatus,
} from '../application/lab-api';
import type { LabExecution } from '../application/execute-on-oracle';

/** Paneles del laboratorio. Solo presentan el análisis; no contienen reglas SQL. */

const TYPE_LABEL = { number: 'número', text: 'texto', date: 'fecha' } as const;

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

/* ---------- 1. Esquema ---------- */

export function SchemaPanel({ highlighted }: { highlighted: readonly string[] }) {
  return (
    <Panel id="lab-schema" number={1} title="Esquema disponible">
      <ul className="lab-schema" aria-label="Columnas de EMPLEADOS">
        {EMPLEADOS.columns.map((column) => (
          <li
            key={column.name}
            className={highlighted.includes(column.name) ? 'lab-schema__used' : undefined}
          >
            <code>{column.name}</code>
            <span>
              {TYPE_LABEL[column.type]}
              {column.nullable ? ' · admite NULL' : ''}
            </span>
            {highlighted.includes(column.name) && (
              <span className="ds-sr-only"> (usada por la consulta)</span>
            )}
          </li>
        ))}
      </ul>
      <DatasetTable<EmpleadoRow>
        caption={`Tabla EMPLEADOS · ${EMPLEADOS.rows.length} filas · ${EMPLEADOS.id}`}
        columns={EMPLEADOS.columns}
        rows={EMPLEADOS.rows}
        rowKey={(row) => String(row.ID_EMPLEADO)}
        highlighted={highlighted}
        highlightNote="El borde azul marca las columnas que lee la consulta."
        formatted={['SALARIO', 'BONO']}
      />
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
        <span className="lab-diagnostic__position">
          Línea {item.line}, columna {item.column}
        </span>
      </header>
      <p className="lab-diagnostic__message">{item.message}</p>
      <dl className="lab-diagnostic__details">
        <div>
          <dt>Encontrado</dt>
          <dd>
            <code>{item.found}</code>
          </dd>
        </div>
      </dl>
      {item.hint && <p className="lab-hint">{item.hint}</p>}
      <p className="lab-diagnostic__help">{GROUP_HELP[item.group]}</p>
      {/* Primero la pista; la corrección se abre solo si el estudiante la pide. */}
      {item.correction && (
        <details className="lab-diagnostic__example lab-diagnostic__correction">
          <summary>Ver la posible corrección</summary>
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
    <Panel id="lab-feedback" number={6} title="Diagnóstico" className="lab-panel--feedback">
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

type ResultRow = { key: string; values: readonly CellValue[] };

function ResultTableView({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly { name: string; type: 'number' | 'text' | 'date' }[];
  rows: readonly (readonly CellValue[])[];
}) {
  const data: ResultRow[] = rows.map((values, index) => ({ key: String(index), values }));
  return (
    <DataTable<ResultRow>
      caption={caption}
      rowKey={(row) => row.key}
      rows={data}
      columns={columns.map((column, index) => ({
        id: `${column.name}-${index}`,
        header: column.name,
        numeric: column.type === 'number',
        cell: (row) => <CellValueView value={row.values[index] ?? null} />,
      }))}
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
  oracleStatus: OracleServiceStatus | null;
  execution: { sql: string; result: LabExecution } | null;
  executing: boolean;
}) {
  return (
    <Panel id="lab-result" number={3} title="Resultado">
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
            columns={analysis.preview.columns}
            rows={analysis.preview.rows}
          />
        ) : (
          <p className="lab-empty">Sin vista previa: corrige los errores del diagnóstico.</p>
        )}
      </div>
      <div className="lab-result__block lab-result__block--oracle" aria-live="polite">
        <div className="lab-result__heading">
          <h3>Ejecución en Oracle</h3>
          <Chip tone={oracleStatus?.available ? 'success' : 'neutral'}>
            {oracleStatus === null
              ? 'Comprobando…'
              : oracleStatus.available
                ? 'Conectado'
                : 'No conectado'}
          </Chip>
        </div>
        {executing ? (
          <p className="lab-muted">Enviando la consulta al servicio Oracle…</p>
        ) : !execution ? (
          <p className="lab-muted">
            {oracleStatus && !oracleStatus.available
              ? oracleStatus.message
              : 'Pulsa «Ejecutar en Oracle» para ejecutar la consulta en el motor real.'}
          </p>
        ) : (
          <OracleOutcome execution={execution} stale={execution.sql !== analysis?.source} />
        )}
      </div>
    </Panel>
  );
}

function OracleOutcome({
  execution,
  stale,
}: {
  execution: { sql: string; result: LabExecution };
  stale: boolean;
}) {
  const { result } = execution;
  return (
    <div className="lab-stack">
      {stale && <p className="lab-stale">Resultado de una versión anterior de la consulta.</p>}
      {result.status === 'ok' && (
        <ResultTableView
          caption={`Oracle (${result.engine}) · ${result.rows.length} filas · ${result.elapsedMs} ms`}
          columns={result.columns}
          rows={result.rows}
        />
      )}
      {result.status === 'unavailable' && (
        <Alert tone="warning" title="Servicio Oracle no disponible">
          {result.message}
        </Alert>
      )}
      {result.status === 'rejected' && (
        <Alert tone="danger" title="No se envió a Oracle">
          La consulta no pasó la validación del subconjunto: {result.message}
        </Alert>
      )}
      {result.status === 'oracle-error' && (
        <Alert tone="danger" title={`Oracle devolvió ${result.code}`}>
          {result.message}
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
    <Panel id="lab-anatomy" number={5} title="Anatomía de la consulta" className="lab-panel--wide">
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
