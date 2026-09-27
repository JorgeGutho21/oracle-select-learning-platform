import { EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import { DataView, type DataRowState } from '@/presentation/components/data/data-view';
import { columnTypeOf, type ResultPreview } from '../../application/challenge-api';

const noun = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** «6 filas · 3 columnas». */
export function sizeOf(rows: number, columns: number): string {
  return `${noun(rows, 'fila', 'filas')} · ${noun(columns, 'columna', 'columnas')}`;
}

/**
 * Resultado de una consulta sobre la muestra de trabajo: siempre una tabla real, con el
 * acento de «resultado» (distinto de los datos de origen).
 */
export function SampleTable({
  caption,
  label,
  result,
  summary,
  rowStates,
  duplicateRows,
  highlightedColumns,
  source = false,
}: {
  readonly caption: string;
  readonly label: string;
  readonly result: ResultPreview;
  readonly summary?: string;
  readonly rowStates?: readonly DataRowState[];
  readonly duplicateRows?: readonly number[];
  readonly highlightedColumns?: readonly string[];
  /** Datos de origen (marco gris) en lugar de un resultado. */
  readonly source?: boolean;
}) {
  return (
    <DataView
      caption={caption}
      label={label}
      columns={result.columns.map((name, index) => ({
        name,
        type: columnTypeOf(
          name,
          result.rows.map((row) => row[index] ?? null),
        ),
      }))}
      rows={result.rows}
      schema={EMPLEADOS_VIEW_SCHEMA}
      size="compact"
      summary={summary ?? sizeOf(result.rows.length, result.columns.length)}
      className={source ? 'dv--source' : 'dv--result'}
      {...(rowStates ? { rowStates } : {})}
      {...(duplicateRows ? { duplicateRows } : {})}
      {...(highlightedColumns ? { highlightedColumns } : {})}
    />
  );
}
