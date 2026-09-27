'use client';

import { useId, useState } from 'react';
import {
  DataView,
  type DataCell,
  type DataColumn,
  type DataViewLabel,
  type DataViewSchema,
} from './data-view';

/**
 * Explorador de una tabla completa (EMPLEADOS, 20 × 12): una sola tabla con todas sus filas
 * y un selector de columnas por grupos semánticos (Identidad, Organización…). El número de
 * empleado se muestra siempre, como identidad de cada fila. Es la tabla de DATOS de origen,
 * no el resultado de una consulta: se rotula y se enmarca de otra manera.
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
  const groups = schema.fieldGroups;
  const [active, setActive] = useState<readonly string[]>(groups.map(({ title }) => title));
  const legendId = useId();
  const anchor = schema.idColumn;
  const visible = new Set([
    ...(anchor ? [anchor] : []),
    ...groups.filter(({ title }) => active.includes(title)).flatMap((group) => group.columns),
  ]);
  const indexes = columns
    .map((_, index) => index)
    .filter((index) => visible.has(columns[index]!.name));
  const all = active.length === groups.length;

  const toggle = (title: string) =>
    setActive((current) => {
      if (!current.includes(title))
        return groups
          .map((group) => group.title)
          .filter((name) => [...current, title].includes(name));
      // Siempre queda al menos un grupo a la vista.
      return current.length > 1 ? current.filter((name) => name !== title) : current;
    });

  return (
    <div className="dv-explorer">
      <div className="dv-explorer__bar" role="group" aria-labelledby={legendId}>
        <span id={legendId} className="dv-explorer__legend">
          Columnas a la vista
        </span>
        <button
          type="button"
          aria-pressed={all}
          onClick={() => setActive(groups.map(({ title }) => title))}
        >
          Todas
        </button>
        {groups.map((group) => (
          <button
            key={group.title}
            type="button"
            aria-pressed={!all && active.includes(group.title)}
            onClick={() => (all ? setActive([group.title]) : toggle(group.title))}
          >
            {group.title}
          </button>
        ))}
      </div>
      <DataView
        caption={caption}
        label={label}
        summary={`${rows.length} filas · ${indexes.length} de ${columns.length} columnas`}
        columns={indexes.map((index) => columns[index]!)}
        rows={rows.map((row) => indexes.map((index) => row[index] ?? null))}
        schema={schema}
        highlightedColumns={highlightedColumns}
        size="compact"
        fallback="bands"
        className="dv--source"
      />
    </div>
  );
}
