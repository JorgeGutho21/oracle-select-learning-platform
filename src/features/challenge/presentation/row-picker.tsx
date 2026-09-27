import { useId } from 'react';
import { formatCell } from '@/presentation/components/data/cell-format';
import { EMPLEADOS, type EmpleadoRow, type EmpleadosColumn } from '../application/challenge-api';

/**
 * Selección de filas de una muestra de EMPLEADOS (M04). Cada fila es una casilla con sus
 * campos en una lista de definición: en pantallas anchas se alinean como una tabla con
 * encabezado visual; en estrechas, cada campo lleva su nombre. Sin barra horizontal.
 * Al cerrar la misión, cada fila indica si cumple la condición y se resalta la columna
 * que decide.
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
  /** Filas que conserva la consulta: solo se pasa con la misión cerrada. */
  readonly kept?: readonly number[];
  /** Columnas que usa la condición, resaltadas al revelar. */
  readonly focusColumns?: readonly string[];
}) {
  const baseId = useId();
  const rows = EMPLEADOS.rows.filter((row) => rowIds.includes(row.ID_EMPLEADO));
  const cell = (row: EmpleadoRow, column: EmpleadosColumn) => {
    const value = row[column];
    return value === null ? 'NULL' : formatCell(value);
  };
  const numeric = (column: EmpleadosColumn) =>
    EMPLEADOS.columns.find((item) => item.name === column)?.type === 'number';
  const revealed = kept !== undefined;
  // Ancho proporcional al texto más largo de cada columna (y a su encabezado): la misma
  // plantilla para todas las filas mantiene las columnas alineadas.
  const template = columns
    .map((column) => {
      const longest = Math.max(column.length * 0.7, ...rows.map((row) => cell(row, column).length));
      return `minmax(0, ${Math.ceil(longest)}fr)`;
    })
    .join(' ');
  const focus = (column: string) => (revealed && focusColumns.includes(column) ? ' is-focus' : '');
  return (
    <fieldset
      className={`ch-pick${revealed ? ' is-revealed' : ''}`}
      style={{ ['--ch-pick-template' as string]: template }}
    >
      <legend className="ch-pick__legend">{legend}</legend>
      <p className="ch-pick__meta">
        Muestra de {rows.length} de {EMPLEADOS.rows.length} registros
      </p>
      <div className="ch-pick__head" aria-hidden="true">
        <span>Incluir</span>
        {columns.map((column) => (
          <span key={column} className={`${numeric(column) ? 'is-number' : ''}${focus(column)}`}>
            {column}
          </span>
        ))}
        {revealed && <span>¿Cumple?</span>}
      </div>
      <ul className="ch-pick__rows">
        {rows.map((row) => {
          const id = row.ID_EMPLEADO;
          const fieldsId = `${baseId}-${id}`;
          const state = revealed ? (kept.includes(id) ? 'kept' : 'discarded') : null;
          return (
            <li
              key={id}
              className={[
                'ch-pick__row',
                selected.includes(id) ? 'is-selected' : '',
                state ? `is-${state}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <label className="ch-pick__label">
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => onToggle(id)}
                  disabled={disabled}
                  aria-label={`Incluir a ${row.NOMBRE}`}
                  aria-describedby={fieldsId}
                />
                <dl className="ch-pick__fields" id={fieldsId}>
                  {columns.map((column) => (
                    <div
                      key={column}
                      className={`ch-pick__field${numeric(column) ? ' is-number' : ''}${focus(column)}`}
                    >
                      <dt>{column}</dt>
                      <dd>{cell(row, column)}</dd>
                    </div>
                  ))}
                </dl>
                {state && (
                  <span className={`ch-pick__state ch-pick__state--${state}`}>
                    <span aria-hidden="true">{state === 'kept' ? '✓ ' : '✗ '}</span>
                    {state === 'kept' ? 'Cumple' : 'No cumple'}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
