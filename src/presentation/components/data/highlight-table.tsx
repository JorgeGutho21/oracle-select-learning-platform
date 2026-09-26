import { Fragment } from 'react';
import { formatCell } from './cell-format';

/**
 * Tabla didáctica: resalta columnas, filas que cumplen o no una condición, repetidas,
 * coincidencias de LIKE, celdas sin valor (NULL) y el orden aplicado, sin alterar los
 * datos. El significado nunca depende solo del color: cada marca tiene texto o símbolo.
 */

export type HighlightCell = string | number | null;

export interface HighlightTableColumn {
  readonly name: string;
  readonly type: 'number' | 'text' | 'date';
}

/** Resultado de la condición de WHERE para una fila. */
export type RowState = 'kept' | 'discarded' | 'unknown';

/** Marca de una celda: coincide con la condición, o parte a parte para LIKE. */
export type CellMark =
  | { readonly kind: 'match' }
  | {
      readonly kind: 'like';
      readonly segments: readonly {
        readonly text: string;
        readonly kind: 'literal' | 'one' | 'any';
      }[];
    };

export interface HighlightTableProps {
  readonly caption: string;
  readonly columns: readonly HighlightTableColumn[];
  readonly rows: readonly (readonly HighlightCell[])[];
  /** Columnas destacadas; con `dimOthers`, las demás se atenúan. */
  readonly highlightedColumns?: readonly string[];
  readonly dimOthers?: boolean;
  readonly highlightedRow?: number;
  /** Filas que repiten una anterior. */
  readonly duplicateRows?: readonly number[];
  /** Estado de cada fila frente a WHERE; añade la columna «¿Cumple?». */
  readonly rowStates?: readonly RowState[];
  /** Marcas por celda, alineadas con `rows`. */
  readonly cellMarks?: readonly (readonly (CellMark | null)[])[];
  /** Columnas por las que se ordenó el resultado, con su sentido. */
  readonly sortedBy?: readonly { readonly column: number; readonly direction: 'ASC' | 'DESC' }[];
  readonly size?: 'regular' | 'large';
  /** Resumen visible bajo la tabla, por ejemplo «8 de 20 filas · 3 columnas». */
  readonly summary?: string;
}

const STATE_TEXT: Readonly<Record<RowState, { symbol: string; label: string }>> = {
  kept: { symbol: '✓', label: 'Cumple' },
  discarded: { symbol: '✗', label: 'No cumple' },
  unknown: { symbol: '?', label: 'Desconocido (NULL)' },
};

function Cell({ value, mark }: { readonly value: HighlightCell; readonly mark: CellMark | null }) {
  if (value === null) {
    return (
      <span className="hl-null">
        NULL<span className="visually-hidden"> (sin valor)</span>
      </span>
    );
  }
  if (mark?.kind === 'like') {
    return (
      <span className="hl-like">
        {mark.segments.map((segment, index) =>
          segment.kind === 'literal' ? (
            <mark key={index} className="hl-like__literal">
              {segment.text}
            </mark>
          ) : segment.kind === 'one' ? (
            <span key={index} className="hl-like__one" title="_ : un carácter">
              {segment.text}
            </span>
          ) : (
            <Fragment key={index}>{segment.text}</Fragment>
          ),
        )}
        <span className="visually-hidden"> (coincide con el patrón)</span>
      </span>
    );
  }
  return (
    <>
      {formatCell(value)}
      {mark?.kind === 'match' && <span className="visually-hidden"> (coincide)</span>}
    </>
  );
}

export function HighlightTable({
  caption,
  columns,
  rows,
  highlightedColumns = [],
  dimOthers = false,
  highlightedRow,
  duplicateRows = [],
  rowStates,
  cellMarks,
  sortedBy = [],
  size = 'regular',
  summary,
}: HighlightTableProps) {
  const state = (name: string) =>
    highlightedColumns.includes(name)
      ? 'is-on'
      : dimOthers && highlightedColumns.length > 0
        ? 'is-dim'
        : undefined;
  const sortOf = (index: number) => sortedBy.find((entry) => entry.column === index);
  return (
    <div className={`hl-table hl-table--${size}`}>
      <div className="hl-table__scroll" role="region" aria-label={caption} tabIndex={0}>
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {rowStates && (
                <th scope="col" className="hl-table__state">
                  ¿Cumple?
                </th>
              )}
              {columns.map((column, index) => {
                const sort = sortOf(index);
                return (
                  <th
                    key={`${column.name}-${index}`}
                    scope="col"
                    className={[
                      state(column.name),
                      column.type === 'number' ? 'is-number' : '',
                      sort ? 'is-sorted' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-sort={
                      sort ? (sort.direction === 'ASC' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {column.name}
                    {sort && (
                      <span className="hl-table__sort" aria-hidden="true">
                        {sort.direction === 'ASC' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                    {state(column.name) === 'is-on' && (
                      <span className="visually-hidden"> (resaltada)</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const duplicate = duplicateRows.includes(rowIndex);
              const rowState = rowStates?.[rowIndex];
              const rowClass = [
                rowIndex === highlightedRow ? 'is-row' : '',
                duplicate ? 'is-duplicate' : '',
                rowState ? `is-${rowState}` : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <tr key={rowIndex} className={rowClass || undefined}>
                  {rowState && (
                    <td className="hl-table__state">
                      <span aria-hidden="true">{STATE_TEXT[rowState].symbol}</span>{' '}
                      <span className="hl-table__state-label">{STATE_TEXT[rowState].label}</span>
                    </td>
                  )}
                  {row.map((value, cellIndex) => {
                    const column = columns[cellIndex];
                    const mark = cellMarks?.[rowIndex]?.[cellIndex] ?? null;
                    const classes = [
                      column ? state(column.name) : undefined,
                      column?.type === 'number' ? 'is-number' : '',
                      mark ? 'is-match' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <td key={cellIndex} className={classes || undefined}>
                        <Cell value={value} mark={mark} />
                        {duplicate && cellIndex === row.length - 1 && (
                          <span className="hl-table__badge">repetida</span>
                        )}
                        {rowIndex === highlightedRow && cellIndex === 0 && (
                          <span className="visually-hidden"> (fila resaltada)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {summary && <p className="hl-table__summary">{summary}</p>}
    </div>
  );
}
