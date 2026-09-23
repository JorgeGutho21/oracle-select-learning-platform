import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
  highlighted?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  highlightNote?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage = 'No hay datos disponibles.',
  highlightNote,
}: DataTableProps<T>) {
  const hasHighlight = columns.some((column) => column.highlighted);
  function columnClass(column: DataTableColumn<T>) {
    return [
      column.numeric ? 'ds-table__numeric' : '',
      column.highlighted ? 'ds-table__highlight' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
  return (
    <div className="ds-table-container">
      <p className="ds-table__hint">
        Desplaza la tabla horizontalmente si necesitas ver más columnas.
      </p>
      <div className="ds-table-scroll" role="region" aria-label={caption} tabIndex={0}>
        <table className="ds-table">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col" className={columnClass(column)}>
                  {column.header}
                  {column.highlighted && <span className="ds-sr-only"> (columna resaltada)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.id} className={columnClass(column)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="ds-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasHighlight && (
        <p className="ds-table__hint">
          {highlightNote ?? 'El borde azul identifica las columnas resaltadas.'}
        </p>
      )}
    </div>
  );
}
