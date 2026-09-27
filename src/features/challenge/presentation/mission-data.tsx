import { useId } from 'react';
import { conceptCategoryLabel, SQL_CONCEPTS, type ConceptId } from '@/application/sql-concepts';
import { EMPLEADOS_VIEW_SCHEMA } from '@/application/dataset-view';
import { DataView, type DataColumn } from '@/presentation/components/data/data-view';
import { DatasetExplorer } from '@/presentation/components/data/dataset-explorer';
import { EMPLEADOS, type EmpleadosColumn } from '../application/challenge-api';
import type { MissionDataSpec } from './mission-context';

/** Tipo base de Oracle (VARCHAR2 en lugar de VARCHAR2(40 CHAR)) para chips compactos. */
const baseType = (oracleType: string) => oracleType.replace(/\(.*\)$/, '');

const columnsOf = (names: readonly string[]): DataColumn[] =>
  EMPLEADOS.columns
    .filter((column) => names.includes(column.name))
    .map(({ name, type }) => ({ name, type }));

function rowsOf(ids: readonly number[], names: readonly string[]) {
  return EMPLEADOS.rows
    .filter((row) => ids.includes(row.ID_EMPLEADO))
    .map((row) => names.map((name) => row[name as EmpleadosColumn]));
}

/** Concepto clave de la misión, con la definición de la fuente canónica. */
export function ConceptNote({ ids }: { readonly ids: readonly ConceptId[] }) {
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
 * «Datos necesarios para esta misión»: esquema de las columnas que se usan para razonar.
 * La tabla EMPLEADOS completa queda como consulta secundaria, sin barra horizontal.
 */
export function MissionData({
  spec,
  highlighted = [],
}: {
  readonly spec: MissionDataSpec;
  readonly highlighted?: readonly string[];
}) {
  const titleId = useId();
  const total = EMPLEADOS.rows.length;
  const allColumns = EMPLEADOS.columns.length;
  const shownColumns = spec.fullSchema ? allColumns : spec.columns.length;
  const shownRows = spec.rowIds.length || spec.rowCount || 0;
  return (
    <section className="ch-data" aria-labelledby={titleId}>
      <h3 id={titleId} className="ch-data__title">
        Datos necesarios para esta misión
      </h3>
      <p className="ch-data__meta">
        Tabla <strong>EMPLEADOS</strong> · {shownRows > 0 ? `${shownRows} de ${total}` : total}{' '}
        filas · {shownColumns} de {allColumns} columnas
      </p>
      {spec.fullSchema ? (
        <ol className="ch-schema ch-schema--numbered" aria-label="Columnas de EMPLEADOS, en orden">
          {EMPLEADOS.columns.map((column) => (
            <li key={column.name}>
              <code>{column.name}</code>
              <span className="ch-schema__type">{baseType(column.oracleType)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="ch-schema" aria-label="Columnas de EMPLEADOS que usa la misión">
          {EMPLEADOS.columns
            .filter((column) => spec.columns.includes(column.name))
            .map((column) => (
              <li
                key={column.name}
                className={highlighted.includes(column.name) ? 'is-used' : undefined}
              >
                <code>{column.name}</code>
                <span className="ch-schema__type">{baseType(column.oracleType)}</span>
                {highlighted.includes(column.name) && (
                  <span className="ds-sr-only"> (en tu SELECT)</span>
                )}
              </li>
            ))}
        </ul>
      )}
      {spec.note && <p className="ch-data__note">{spec.note}</p>}
      <details className="ch-data__more">
        <summary>
          Ver tabla completa{' '}
          <span className="ch-data__more-size">· {total} filas × 12 columnas</span>
        </summary>
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
      </details>
    </section>
  );
}

/**
 * Vista previa de filas a todo el ancho de la misión (debajo de la interacción): datos de
 * referencia, nunca protagonistas. Solo las columnas relevantes.
 */
export function MissionSample({ spec }: { readonly spec: MissionDataSpec }) {
  if (spec.rowIds.length === 0) return null;
  const total = EMPLEADOS.rows.length;
  return (
    <DataView
      caption={`Vista previa de EMPLEADOS: ${spec.rowIds.length} de ${total} filas`}
      label="Vista previa"
      columns={columnsOf(spec.columns)}
      rows={rowsOf(spec.rowIds, spec.columns)}
      schema={EMPLEADOS_VIEW_SCHEMA}
      summary={`${spec.rowIds.length} de ${total} filas · ${spec.columns.length} columnas`}
      className="ch-sample"
    />
  );
}
