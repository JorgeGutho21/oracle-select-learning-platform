import type { ReactNode } from 'react';
import { DataTable, type DataTableColumn } from '@/presentation/components/ui';

/** Tabla de un dataset educativo, con resaltado opcional de columnas. No modifica los datos. */

export interface DatasetColumn {
  readonly name: string;
  readonly type: 'number' | 'text';
}

export type DatasetRow = Readonly<Record<string, string | number>>;

const numberFormat = new Intl.NumberFormat('es-CO');

export interface DatasetTableProps<Row extends DatasetRow> {
  caption: string;
  columns: readonly DatasetColumn[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  highlighted?: readonly string[];
  highlightNote?: string;
  /** Formato de miles para columnas monetarias; no cambia el valor. */
  formatted?: readonly string[];
  extraColumns?: readonly DataTableColumn<Row>[];
}

export function DatasetTable<Row extends DatasetRow>({
  caption,
  columns,
  rows,
  rowKey,
  highlighted = [],
  highlightNote,
  formatted = [],
  extraColumns = [],
}: DatasetTableProps<Row>) {
  const tableColumns: DataTableColumn<Row>[] = [
    ...columns.map((column) => ({
      id: column.name,
      header: column.name,
      numeric: column.type === 'number',
      highlighted: highlighted.includes(column.name),
      cell: (row: Row): ReactNode => {
        const value = row[column.name];
        return typeof value === 'number' && formatted.includes(column.name)
          ? numberFormat.format(value)
          : value;
      },
    })),
    ...extraColumns,
  ];
  return (
    <DataTable
      caption={caption}
      columns={tableColumns}
      rows={rows}
      rowKey={rowKey}
      {...(highlightNote ? { highlightNote } : {})}
    />
  );
}
