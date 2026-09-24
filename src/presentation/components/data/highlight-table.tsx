/**
 * Tabla didáctica: resalta columnas, una fila o filas repetidas sin alterar los datos.
 * El significado nunca depende solo del color: cada marca tiene texto accesible.
 */

export type HighlightCell = string | number;

export interface HighlightTableColumn {
  readonly name: string;
  readonly type: 'number' | 'text';
}

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
  readonly size?: 'regular' | 'large';
  /** Resumen visible bajo la tabla, por ejemplo «6 filas · 2 columnas». */
  readonly summary?: string;
}

const numberFormat = new Intl.NumberFormat('es-CO');

function formatCell(value: HighlightCell): string {
  return typeof value === 'number' && Math.abs(value) >= 1000
    ? numberFormat.format(value)
    : String(value);
}

export function HighlightTable({
  caption,
  columns,
  rows,
  highlightedColumns = [],
  dimOthers = false,
  highlightedRow,
  duplicateRows = [],
  size = 'regular',
  summary,
}: HighlightTableProps) {
  const state = (name: string) =>
    highlightedColumns.includes(name)
      ? 'is-on'
      : dimOthers && highlightedColumns.length > 0
        ? 'is-dim'
        : undefined;
  return (
    <div className={`hl-table hl-table--${size}`}>
      <div className="hl-table__scroll" role="region" aria-label={caption} tabIndex={0}>
        <table>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={`${column.name}-${index}`}
                  scope="col"
                  className={[state(column.name), column.type === 'number' ? 'is-number' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {column.name}
                  {state(column.name) === 'is-on' && (
                    <span className="visually-hidden"> (resaltada)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const duplicate = duplicateRows.includes(rowIndex);
              const rowClass = [
                rowIndex === highlightedRow ? 'is-row' : '',
                duplicate ? 'is-duplicate' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <tr key={rowIndex} className={rowClass || undefined}>
                  {row.map((value, cellIndex) => {
                    const column = columns[cellIndex];
                    const classes = [
                      column ? state(column.name) : undefined,
                      typeof value === 'number' ? 'is-number' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <td key={cellIndex} className={classes || undefined}>
                        {formatCell(value)}
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
