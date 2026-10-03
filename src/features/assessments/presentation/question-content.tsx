import { CellValueView } from '@/presentation/components/data/cell-format';
import { SqlCode, SqlLines } from '@/presentation/components/data/sql-code';
import type { DataTable, OptionKind } from '../application/assessment-api';

/**
 * Contenido de una pregunta: enunciado, consulta, tablas de origen y consultas a comparar.
 * Lo comparten el examen, la retroalimentación y las vistas del profesor. Todo es texto o
 * datos: nunca se interpreta HTML del banco.
 */

export interface QuestionExhibit {
  readonly tables?: readonly DataTable[];
  readonly queries?: readonly { readonly label: string; readonly sql: string }[];
}

/** Tabla de resultado compacta: se adapta con desplazamiento propio, no de la página. */
export function ResultGrid({
  table,
  caption,
  compact = false,
}: {
  readonly table: DataTable;
  readonly caption?: string;
  readonly compact?: boolean;
}) {
  const label = caption ?? table.caption;
  return (
    // Dentro de una opción la tabla no es un control propio (la opción ya es enfocable).
    <div
      className={`exam-grid${compact ? ' exam-grid--compact' : ''}`}
      {...(compact ? {} : { tabIndex: 0, role: 'region', 'aria-label': label ?? 'Tabla' })}
    >
      <table>
        {label && <caption>{label}</caption>}
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 ? (
            <tr>
              <td colSpan={Math.max(1, table.columns.length)} className="exam-grid__empty">
                Sin filas
              </td>
            </tr>
          ) : (
            table.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, column) => (
                  <td key={column} className={typeof cell === 'number' ? 'is-number' : undefined}>
                    <CellValueView value={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function QuestionBody({
  prompt,
  code,
  exhibit,
  headingId,
  position,
}: {
  readonly prompt: string;
  readonly code: string | null;
  readonly exhibit: QuestionExhibit | null;
  readonly headingId?: string;
  readonly position?: number;
}) {
  return (
    <div className="exam-question__body">
      <p className="exam-question__prompt" id={headingId}>
        {position !== undefined && <span className="visually-hidden">Pregunta {position}. </span>}
        {prompt}
      </p>
      {exhibit?.tables?.map((table, index) => (
        <ResultGrid key={`t${index}`} table={table} />
      ))}
      {code && <SqlCode sql={code} label="Consulta" />}
      {exhibit?.queries && exhibit.queries.length > 0 && (
        <div className="exam-compare">
          {exhibit.queries.map((query) => (
            <SqlCode key={query.label} sql={query.sql} label={`Consulta ${query.label}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Cuerpo de una opción: texto, código SQL o tabla de resultado. */
export function OptionBody({
  body,
  kind,
  result,
}: {
  readonly body: string;
  readonly kind: OptionKind;
  readonly result: DataTable | null;
}) {
  if (kind === 'code') {
    return (
      <code className="exam-option__code">
        <SqlLines sql={body} />
      </code>
    );
  }
  if (kind === 'table' && result) {
    return (
      <span className="exam-option__table">
        <span className="exam-option__summary">{body}</span>
        <ResultGrid table={result} compact />
      </span>
    );
  }
  return <span className="exam-option__text">{body}</span>;
}
