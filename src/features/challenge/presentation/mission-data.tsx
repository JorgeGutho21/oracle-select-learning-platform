'use client';

import { useId, useState } from 'react';
import { conceptCategoryLabel, SQL_CONCEPTS, type ConceptId } from '@/application/sql-concepts';
import { EMPLEADOS_FIELD_GROUP_LIST, EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import { DataView, type DataColumn } from '@/presentation/components/data/data-view';
import { DatasetExplorer } from '@/presentation/components/data/dataset-explorer';
import { Button, Dialog } from '@/presentation/components/ui';
import { EMPLEADOS, type EmpleadosColumn } from '../application/challenge-api';
import type { MissionSampleSpec } from './mission-context';

/** Tipo base de Oracle (VARCHAR2 en lugar de VARCHAR2(40 CHAR)) para el esquema compacto. */
const baseType = (oracleType: string) => oracleType.replace(/\(.*\)$/, '');

export const columnsOf = (names: readonly string[]): DataColumn[] =>
  names.map((name) => ({
    name,
    type: EMPLEADOS.columns.find((column) => column.name === name)?.type ?? 'text',
  }));

/** Filas de la muestra, en el orden de la tabla, con las columnas pedidas. */
export function rowsOf(ids: readonly number[], names: readonly string[]) {
  return EMPLEADOS.rows
    .filter((row) => ids.includes(row.ID_EMPLEADO))
    .map((row) => names.map((name) => row[name as EmpleadosColumn]));
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Concepto clave de la misión, con la definición de la fuente canónica. */
export function ConceptNote({ ids }: { readonly ids: readonly ConceptId[] }) {
  if (ids.length === 0) return null;
  return (
    <section className="ch-concept" aria-label="Concepto clave">
      <p className="ch-concept__label">Concepto clave</p>
      <dl className="ch-concept__list">
        {ids.map((id) => (
          <div key={id} className="ch-concept__item">
            <dt>
              <span className="ch-concept__name">{SQL_CONCEPTS[id].name}</span>
              <span className="ch-concept__category">{conceptCategoryLabel(id)}</span>
            </dt>
            <dd>{SQL_CONCEPTS[id].definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Acceso secundario a EMPLEADOS completa (20 × 12): un enlace discreto que abre la tabla en
 * un diálogo. La misión se resuelve sin abrirlo.
 */
export function FullDataset() {
  const [open, setOpen] = useState(false);
  return (
    <div className="ch-dataset">
      <span className="ch-dataset__size">
        Dataset completo: {plural(EMPLEADOS.rows.length, 'registro', 'registros')} ·{' '}
        {plural(EMPLEADOS.columns.length, 'columna', 'columnas')}
      </span>
      <Button variant="text" className="ch-dataset__open" onClick={() => setOpen(true)}>
        Consultar dataset EMPLEADOS completo
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Dataset EMPLEADOS completo"
        description="Consulta de referencia: la misión se resuelve con la muestra de trabajo."
        className="ch-dataset-dialog"
      >
        {open && (
          <DatasetExplorer
            caption="Tabla EMPLEADOS completa"
            label="Datos de origen · EMPLEADOS"
            columns={columnsOf(EMPLEADOS.columns.map((column) => column.name))}
            rows={rowsOf(
              EMPLEADOS.rows.map((row) => row.ID_EMPLEADO),
              EMPLEADOS.columns.map((column) => column.name),
            )}
            schema={EMPLEADOS_VIEW_SCHEMA}
          />
        )}
      </Dialog>
    </div>
  );
}

/**
 * Muestra de trabajo de la misión: una tabla real con los registros y las columnas que
 * importan para razonar (hasta 8 × 4). Las columnas que el estudiante ya usa se resaltan.
 */
export function WorkingSample({
  spec,
  highlighted = [],
}: {
  readonly spec: MissionSampleSpec;
  readonly highlighted?: readonly string[];
}) {
  const titleId = useId();
  return (
    <section className="ch-data" aria-labelledby={titleId}>
      <h3 id={titleId} className="ch-data__title">
        {spec.title ?? 'Tabla original · EMPLEADOS'}
      </h3>
      <DataView
        caption={`Muestra de trabajo: ${spec.title ?? 'tabla EMPLEADOS'}`}
        columns={columnsOf(spec.columns)}
        rows={rowsOf(spec.rowIds, spec.columns)}
        schema={EMPLEADOS_VIEW_SCHEMA}
        size="compact"
        summary={`Muestra de trabajo: ${plural(spec.rowIds.length, 'registro', 'registros')} · ${plural(spec.columns.length, 'columna relevante', 'columnas relevantes')}`}
        highlightedColumns={highlighted}
        className="dv--source ch-sample"
      />
      {spec.note && <p className="ch-data__note">{spec.note}</p>}
      <FullDataset />
    </section>
  );
}

/**
 * Esquema compacto de EMPLEADOS (M03): las 12 columnas con su tipo, numeradas en el orden
 * de la tabla, en 3 filas de 4 en escritorio y por grupos en el móvil.
 */
export function SchemaOverview() {
  const titleId = useId();
  const position = (name: string) =>
    EMPLEADOS.columns.findIndex((column) => column.name === name) + 1;
  const item = (name: string) => {
    const column = EMPLEADOS.columns.find((entry) => entry.name === name)!;
    return (
      <li key={name} className="ch-schema__item">
        <span className="ch-schema__number" aria-hidden="true">
          {position(name)}
        </span>
        <code>
          {name.split(/(?<=_)/).map((part, index) => (
            <span key={index}>
              {index > 0 && <wbr />}
              {part}
            </span>
          ))}
        </code>
        <span className="ch-schema__type">{baseType(column.oracleType)}</span>
        {column.nullable && <span className="ch-schema__null">admite NULL</span>}
      </li>
    );
  };
  return (
    <section className="ch-data" aria-labelledby={titleId}>
      <h3 id={titleId} className="ch-data__title">
        Esquema de EMPLEADOS
      </h3>
      <p className="ch-data__meta">
        Tabla <strong>EMPLEADOS</strong> · {plural(EMPLEADOS.rows.length, 'registro', 'registros')}
      </p>
      <ol className="ch-schema ch-schema--grid" aria-label="Columnas de EMPLEADOS, en orden">
        {EMPLEADOS.columns.map((column) => item(column.name))}
      </ol>
      <div className="ch-schema ch-schema--groups">
        {EMPLEADOS_FIELD_GROUP_LIST.map((group) => (
          <section key={group.id} className="ch-schema__group" aria-label={group.title}>
            <p className="ch-schema__group-title" aria-hidden="true">
              {group.title}
            </p>
            <ul>{group.columns.map((name) => item(name))}</ul>
          </section>
        ))}
      </div>
    </section>
  );
}
