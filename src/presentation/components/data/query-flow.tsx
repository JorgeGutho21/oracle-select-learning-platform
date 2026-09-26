import type { ExplainedQuery, FlowTable } from '@/features/laboratory/application/lab-api';
import { HighlightTable } from './highlight-table';
import { SqlCode } from './sql-code';

/**
 * Patrón visual TABLA ORIGINAL → CONSULTA → QUÉ HACE → RESULTADO, compartido por Estudio y
 * Exposición. Todo lo que muestra sale del motor educativo: filas que cumplen, repetidas,
 * coincidencias y orden. En escritorio aprovecha el ancho; en móvil se apila.
 */

function rowsLabel(count: number): string {
  return `${count} ${count === 1 ? 'fila' : 'filas'}`;
}

export function flowSummary(table: FlowTable): string {
  const columns = `${table.columns.length} ${table.columns.length === 1 ? 'columna' : 'columnas'}`;
  return table.rows.length < table.totalRows
    ? `${table.rows.length} de ${rowsLabel(table.totalRows)} · ${columns}`
    : `${rowsLabel(table.totalRows)} · ${columns}`;
}

export function FlowTableView({
  table,
  caption,
  size = 'regular',
  summary,
}: {
  readonly table: FlowTable;
  readonly caption: string;
  readonly size?: 'regular' | 'large';
  readonly summary?: string;
}) {
  return (
    <HighlightTable
      caption={caption}
      size={size}
      columns={table.columns}
      rows={table.rows}
      highlightedColumns={table.highlightedColumns}
      dimOthers={table.highlightedColumns.length > 0}
      {...(table.rowStates ? { rowStates: table.rowStates } : {})}
      {...(table.cellMarks ? { cellMarks: table.cellMarks } : {})}
      {...(table.duplicateRows ? { duplicateRows: table.duplicateRows } : {})}
      {...(table.sortedBy ? { sortedBy: table.sortedBy } : {})}
      summary={summary ?? flowSummary(table)}
    />
  );
}

/** Frase corta que resume la transformación: «20 → 5 filas», «Quedan 7 de 20». */
export function transformationLabel(explained: ExplainedQuery): string {
  const { counts, clauses } = explained;
  if (clauses.where) return `Pasan ${counts.kept} de ${counts.source} filas`;
  if (clauses.distinct) return `${counts.source} → ${counts.result} filas sin repetir`;
  if (clauses.orderBy) return `${counts.result} filas reordenadas`;
  return `${counts.result} filas · ${counts.columns} ${counts.columns === 1 ? 'columna' : 'columnas'}`;
}

export interface QueryFlowProps {
  readonly explained: ExplainedQuery;
  /** Necesidad que motiva la consulta. */
  readonly question?: string;
  /** Lectura en español; por defecto, la del traductor. */
  readonly reading?: string;
  readonly headingLevel?: 'h3' | 'h4';
  readonly id?: string;
}

export function QueryFlow({
  explained,
  question,
  reading,
  headingLevel: Heading = 'h3',
  id,
}: QueryFlowProps) {
  const read = reading ?? explained.translation?.summary;
  const steps = explained.translation?.steps ?? [];
  return (
    <div className="query-flow" id={id}>
      <ol className="query-flow__stages">
        <li className="query-flow__stage query-flow__stage--source">
          <Heading className="query-flow__title">
            <span className="query-flow__number" aria-hidden="true">
              1
            </span>
            Tabla original
          </Heading>
          <FlowTableView table={explained.source} caption="Tabla EMPLEADOS de origen" />
          {explained.source.rowStates && (
            <p className="query-flow__legend">
              <span aria-hidden="true">✓</span> cumple la condición ·{' '}
              <span aria-hidden="true">✗</span> se descarta · <span aria-hidden="true">?</span>{' '}
              desconocido por NULL
            </p>
          )}
        </li>
        <li className="query-flow__stage query-flow__stage--query">
          <Heading className="query-flow__title">
            <span className="query-flow__number" aria-hidden="true">
              2
            </span>
            Consulta SQL
          </Heading>
          {question && (
            <p className="query-flow__question">
              <span>Pregunta</span> {question}
            </p>
          )}
          <SqlCode sql={explained.sql} />
          {read && (
            <p className="query-flow__reading">
              <span>Leída en español</span> {read}
            </p>
          )}
        </li>
        <li className="query-flow__stage query-flow__stage--steps">
          <Heading className="query-flow__title">
            <span className="query-flow__number" aria-hidden="true">
              3
            </span>
            Qué hace
          </Heading>
          <p className="query-flow__badge">{transformationLabel(explained)}</p>
          <ol className="query-flow__steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </li>
        <li className="query-flow__stage query-flow__stage--result">
          <Heading className="query-flow__title">
            <span className="query-flow__number" aria-hidden="true">
              4
            </span>
            Resultado
          </Heading>
          {explained.beforeDistinct && (
            <div className="query-flow__before">
              <p className="query-flow__caption">Antes de DISTINCT: las repetidas se marcan</p>
              <FlowTableView
                table={explained.beforeDistinct}
                caption="Resultado antes de quitar repetidas"
              />
            </div>
          )}
          {explained.result ? (
            <FlowTableView table={explained.result} caption="Resultado de la consulta" />
          ) : (
            <p className="query-flow__empty">
              La consulta no produce resultado: revisa el diagnóstico en el laboratorio.
            </p>
          )}
        </li>
      </ol>
    </div>
  );
}
