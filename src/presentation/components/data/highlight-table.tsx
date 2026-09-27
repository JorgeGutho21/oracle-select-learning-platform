import { EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import {
  DataView,
  type ColumnRole,
  type DataCell,
  type DataCellMark,
  type DataColumn,
  type DataRowState,
  type DataViewLabel,
  type DataViewSchema,
} from './data-view';

/**
 * Tabla didáctica de Estudio, Exposición y Home. Es la vista de datos adaptable con el
 * esquema de EMPLEADOS: tabla cuando cabe y fichas por registro cuando no.
 */

export type HighlightCell = DataCell;
export type HighlightTableColumn = DataColumn;
export type RowState = DataRowState;
export type CellMark = DataCellMark;

export interface HighlightTableProps {
  readonly caption: string;
  readonly label?: DataViewLabel;
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
  readonly columnRoles?: Readonly<Record<string, readonly ColumnRole[]>>;
  readonly size?: 'regular' | 'large';
  /** Resumen visible, por ejemplo «8 de 20 filas · 3 columnas». */
  readonly summary?: string;
  readonly detail?: 'summary' | 'full';
  readonly schema?: DataViewSchema;
  readonly mode?: 'auto' | 'table' | 'bands' | 'records';
  readonly className?: string;
}

export function HighlightTable({ schema, ...props }: HighlightTableProps) {
  return <DataView schema={schema ?? EMPLEADOS_VIEW_SCHEMA} {...props} />;
}
