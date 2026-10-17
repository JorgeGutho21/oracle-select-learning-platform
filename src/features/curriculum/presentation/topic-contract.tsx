import type { Route } from 'next';
import Link from 'next/link';
import type {
  SyntaxPart,
  TopicPreview,
  TopicTableView,
  TopicTier,
} from '../application/curriculum-api';
import { CurriculumTable } from './example-parts';

/**
 * Piezas del contrato pedagógico de un tema (S2_S3_PEDAGOGICAL_RESTRUCTURE.md): nivel del
 * tema, tablas presentadas antes del código, sintaxis leída por partes, avances marcados y
 * qué cambió frente a qué no. Las usan el Modo Estudio y las escenas de clase.
 */

export function TierBadge({ tier, label }: { readonly tier: TopicTier; readonly label: string }) {
  return (
    <span className={`cu-tier cu-tier--${tier}`}>
      {label}
      {tier === 'extension' && (
        <span className="visually-hidden"> · contenido de siguiente nivel</span>
      )}
    </span>
  );
}

/** Una tabla tal como la usa el tema: qué representa, sus claves y las columnas que importan. */
export function TopicTables({
  tables,
  headingLevel = 3,
  compact = false,
}: {
  readonly tables: readonly TopicTableView[];
  readonly headingLevel?: 2 | 3;
  /** Lienzo de clase: columnas en una lista breve y como mucho cuatro filas. */
  readonly compact?: boolean;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const rows = compact ? 4 : 6;
  return (
    <ul className={`cu-topic-tables${compact ? ' cu-topic-tables--compact' : ''}`}>
      {tables.map((table) => (
        <li key={table.name} className="cu-topic-table">
          <Heading className="cu-topic-table__name">{table.name}</Heading>
          <p className="cu-topic-table__role">{table.role}</p>
          <p className="cu-topic-table__keys">
            <span>
              PK: <code>{table.primaryKey.join(' + ')}</code>
            </span>
            {table.foreignKeys.map((key) => (
              <span key={key.columns}>
                FK: <code>{key.columns}</code> <span aria-hidden="true">→</span>
                <span className="visually-hidden">apunta a</span> <code>{key.references}</code>
              </span>
            ))}
          </p>
          {compact ? (
            <ul
              className="cu-topic-table__columns"
              aria-label={`Columnas de ${table.name} que usa este tema`}
            >
              {table.columns.map((column) => (
                <li key={column.name}>
                  <code>{column.name}</code> {column.description}
                </li>
              ))}
            </ul>
          ) : (
            <ColumnDictionary table={table} />
          )}
          {table.rowCount === 0 ? (
            <p className="cu-topic-table__empty">
              La tabla empieza vacía: todavía no tiene ninguna fila.
            </p>
          ) : (
            <CurriculumTable
              table={{ ...table.sample, rows: table.sample.rows.slice(0, rows) }}
              label={`Filas de ${table.name} (${Math.min(rows, table.rowCount)} de ${table.rowCount})`}
              caption={`Filas representativas de ${table.name} antes de consultar`}
              size="compact"
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function ColumnDictionary({ table }: { readonly table: TopicTableView }) {
  return (
    <table className="cu-dictionary">
      <caption className="visually-hidden">Columnas de {table.name} que usa este tema</caption>
      <thead>
        <tr>
          <th scope="col">Columna</th>
          <th scope="col">Qué significa</th>
        </tr>
      </thead>
      <tbody>
        {table.columns.map((column) => (
          <tr key={column.name}>
            <th scope="row">
              <code>{column.name}</code>
              <span className="cu-dictionary__type">
                <code>{column.type}</code>
              </span>
            </th>
            <td>{column.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** La sintaxis mínima parte por parte y leída en español. */
export function SyntaxParts({
  parts,
  reading,
}: {
  readonly parts: readonly SyntaxPart[];
  /** Sin lectura, la escena de clase la coloca junto al código. */
  readonly reading?: string;
}) {
  return (
    <div className="cu-syntax-parts">
      <table className="cu-dictionary cu-syntax-parts__table">
        <caption className="visually-hidden">Qué hace cada parte de la sintaxis</caption>
        <thead>
          <tr>
            <th scope="col">Parte</th>
            <th scope="col">Qué hace</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.code}>
              <th scope="row">
                <code>{part.code}</code>
              </th>
              <td>{part.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {reading && (
        <p className="cu-syntax-parts__reading">
          <span className="study-part">Se lee así</span> {reading}
        </p>
      )}
    </div>
  );
}

/** Construcciones que un ejemplo usa antes de su lección propia, marcadas y explicadas. */
export function TopicPreviews({ previews }: { readonly previews: readonly TopicPreview[] }) {
  if (previews.length === 0) return null;
  return (
    <aside className="cu-previews" aria-label="Aparece aquí antes de su lección">
      <p className="study-part">Aparece antes de su lección</p>
      <ul>
        {previews.map((preview) => (
          <li key={preview.term}>
            <strong>{preview.term}</strong>: {preview.explanation}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function Prerequisites({
  prerequisites,
  prior,
}: {
  readonly prerequisites: readonly { readonly title: string; readonly href: string }[];
  readonly prior: string | null;
}) {
  return (
    <>
      {prior && <p>{prior}</p>}
      {prerequisites.length > 0 && (
        <ul className="cu-prerequisites">
          {prerequisites.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href as Route}>{entry.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Antes → después: qué cambió y qué se mantuvo. */
export function ChangeColumns({
  changed,
  unchanged,
  headingId,
}: {
  readonly changed: readonly string[];
  readonly unchanged: readonly string[];
  readonly headingId?: string;
}) {
  return (
    <>
      <div className="study-changes__col study-changes__col--changed">
        <p className="study-part">Qué cambió</p>
        {headingId && (
          <h2 id={headingId} className="visually-hidden">
            Qué cambió y qué no
          </h2>
        )}
        <ul>
          {changed.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {unchanged.length > 0 && (
        <div className="study-changes__col study-changes__col--kept">
          <p className="study-part">Qué no cambió</p>
          <ul>
            {unchanged.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
