import {
  DataView,
  type DataCell,
  type DataColumn,
  type DataViewLabel,
  type DataViewSchema,
} from './data-view';

/**
 * Tabla completa de DATOS de origen (EMPLEADOS, 20 × 12), no el resultado de una consulta:
 * se rotula y se enmarca de otra manera. En escritorio es una sola tabla; si no cabe, las
 * columnas se reparten en grupos con pestañas (ID_EMPLEADO y NOMBRE en todos).
 */
export function DatasetExplorer({
  caption,
  label,
  columns,
  rows,
  schema,
  highlightedColumns = [],
}: {
  readonly caption: string;
  readonly label: DataViewLabel;
  readonly columns: readonly DataColumn[];
  readonly rows: readonly (readonly DataCell[])[];
  readonly schema: DataViewSchema;
  readonly highlightedColumns?: readonly string[];
}) {
  return (
    <DataView
      caption={caption}
      label={label}
      summary={`${rows.length} filas · ${columns.length} columnas`}
      columns={columns}
      rows={rows}
      schema={schema}
      highlightedColumns={highlightedColumns}
      size="compact"
      className="dv--source"
    />
  );
}
