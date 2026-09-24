import { DataTable, type DataTableColumn } from '@/presentation/components/ui';
import { EMPLEADOS, type EmpleadoRow, type EmpleadosColumn } from '../application/challenge-api';
import { formatNumber } from './format';

export interface SourceTableProps {
  caption?: string;
  highlighted?: readonly string[];
  columns?: readonly EmpleadosColumn[];
  extraColumns?: readonly DataTableColumn<EmpleadoRow>[];
}

/** Tabla EMPLEADOS del dataset canónico; nunca modifica sus datos. */
export function SourceTable({
  caption = `Tabla EMPLEADOS (${EMPLEADOS.id})`,
  highlighted = [],
  columns,
  extraColumns = [],
}: SourceTableProps) {
  const visible = EMPLEADOS.columns.filter((column) => !columns || columns.includes(column.name));
  const tableColumns: DataTableColumn<EmpleadoRow>[] = [
    ...visible.map((column) => ({
      id: column.name,
      header: column.name,
      numeric: column.type === 'number',
      highlighted: highlighted.includes(column.name),
      cell: (row: EmpleadoRow) => {
        const value = row[column.name];
        return typeof value === 'number' && column.name === 'SALARIO' ? formatNumber(value) : value;
      },
    })),
    ...extraColumns,
  ];
  return (
    <DataTable
      caption={caption}
      columns={tableColumns}
      rows={EMPLEADOS.rows}
      rowKey={(row) => String(row.ID)}
      highlightNote="El borde azul marca las columnas que elegiste."
    />
  );
}
