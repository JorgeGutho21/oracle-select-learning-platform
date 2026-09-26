import type { DataTableColumn } from '@/presentation/components/ui';
import { DatasetTable } from '@/presentation/components/data/dataset-table';
import { EMPLEADOS, type EmpleadoRow, type EmpleadosColumn } from '../application/challenge-api';

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
  return (
    <DatasetTable<EmpleadoRow>
      caption={caption}
      columns={EMPLEADOS.columns.filter((column) => !columns || columns.includes(column.name))}
      rows={EMPLEADOS.rows}
      rowKey={(row) => String(row.ID_EMPLEADO)}
      highlighted={highlighted}
      highlightNote="El borde azul marca las columnas que elegiste."
      formatted={['SALARIO', 'BONO']}
      extraColumns={extraColumns}
    />
  );
}
