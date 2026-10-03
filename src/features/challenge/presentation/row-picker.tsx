import { useId } from 'react';
import { formatCell } from '@/presentation/components/data/cell-format';
import { NullBadge } from '@/presentation/components/data/data-view';
import { EMPLEADOS, type EmpleadoRow, type EmpleadosColumn } from '../application/challenge-api';

/**
 * Selección de filas sobre la muestra de trabajo (M04): una tabla real (thead, tbody, th)
 * con una casilla por fila. Toda la fila se puede tocar; la casilla sigue siendo el control
 * accesible. Al cerrar la misión, las filas que conserva la condición se resaltan y las
 * descartadas se atenúan, con símbolo y texto además del color.
 */
export function RowPicker({
  legend,
  columns,
  rowIds,
  selected,
  onToggle,
  disabled,
  kept,
  focusColumns = [],
}: {
  readonly legend: string;
  readonly columns: readonly EmpleadosColumn[];
  readonly rowIds: readonly number[];
  readonly selected: readonly number[];
  readonly onToggle: (id: number) => void;
  readonly disabled: boolean;
  /** Filas que conserva la condición: solo se pasa con la misión cerrada. */
  readonly kept?: readonly number[];
  /** Columnas que usa la condición, resaltadas al revelar. */
  readonly focusColumns?: readonly string[];
}) {
  const captionId = useId();
  const rows = EMPLEADOS.rows.filter((row) => rowIds.includes(row.ID_EMPLEADO));
  const numeric = (column: EmpleadosColumn) =>
    EMPLEADOS.columns.find((item) => item.name === column)?.type === 'number';
  const revealed = kept !== undefined;
  const cell = (row: EmpleadoRow, column: EmpleadosColumn) => {
    const value = row[column];
    return value === null ? <NullBadge /> : formatCell(value);
  };
  const focus = (column: string) => (revealed && focusColumns.includes(column) ? 'is-focus' : '');
  return (
    <fieldset className={`ch-pick${revealed ? ' is-revealed' : ''}`}>
      <legend className="ch-pick__legend">{legend}</legend>
      <p className="ch-pick__meta" id={captionId}>
        Muestra de trabajo: {rows.length} registros · {columns.length} columnas
        {!revealed && ' · toca las filas que cumplirán la condición'}
      </p>
      <div className="ch-pick__frame">
        <table className="ch-pick__table" aria-describedby={captionId}>
          <caption className="visually-hidden">{legend}</caption>
          <thead>
            <tr>
              <th scope="col" className="ch-pick__check">
                <span className="visually-hidden">Incluir</span>
                <span aria-hidden="true">✓</span>
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={
                    [numeric(column) ? 'is-number' : '', focus(column)].filter(Boolean).join(' ') ||
                    undefined
                  }
                >
                  {column === 'ID_EMPLEADO' ? (
                    <abbr title="ID_EMPLEADO">
                      <span aria-hidden="true">ID</span>
                      <span className="visually-hidden">ID_EMPLEADO</span>
                    </abbr>
                  ) : (
                    column.split(/(?<=_)/).map((part, index) => (
                      <span key={index}>
                        {index > 0 && <wbr />}
                        {part}
                      </span>
                    ))
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = row.ID_EMPLEADO;
              const state = revealed ? (kept.includes(id) ? 'kept' : 'discarded') : null;
              const checked = selected.includes(id);
              return (
                <tr
                  key={id}
                  className={[
                    'ch-pick__row',
                    checked ? 'is-selected' : '',
                    state ? `is-${state}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={(event) => {
                    if (disabled || (event.target as HTMLElement).closest('input')) return;
                    onToggle(id);
                  }}
                >
                  <td className="ch-pick__check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(id)}
                      disabled={disabled}
                      aria-label={`Incluir a ${row.NOMBRE} (ID ${id})`}
                    />
                    {state && (
                      <span className={`ch-pick__state ch-pick__state--${state}`}>
                        <span aria-hidden="true">{state === 'kept' ? '✓' : '✗'}</span>
                        <span className="visually-hidden">
                          {state === 'kept' ? ' Se conserva' : ' Se descarta'}
                        </span>
                      </span>
                    )}
                  </td>
                  {columns.map((column) =>
                    column === 'ID_EMPLEADO' ? (
                      <th key={column} scope="row" className="is-number">
                        {cell(row, column)}
                      </th>
                    ) : (
                      <td
                        key={column}
                        className={
                          [numeric(column) ? 'is-number' : '', focus(column)]
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                      >
                        {cell(row, column)}
                      </td>
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
