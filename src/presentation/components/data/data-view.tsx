import { Fragment, type ReactNode } from 'react';
import { formatCell } from './cell-format';

/**
 * Vista de datos adaptable (ResponsiveDataView): la única forma de mostrar filas en la
 * plataforma. Con espacio suficiente es una tabla completa; cuando las columnas dejarían de
 * leerse, cambia de representación y cada fila pasa a ser una ficha con sus campos
 * agrupados. Los datos son los mismos: nunca se encoge la letra ni se añade una barra
 * horizontal.
 *
 * La decisión es de CSS, sin JavaScript ni saltos de diseño: el componente calcula el ancho
 * que necesita la tabla (en em, según columnas y contenido) y una consulta de contenedor
 * oculta la tabla y muestra las fichas cuando el contenedor es más estrecho. Solo una de las
 * dos representaciones está visible (y en el árbol de accesibilidad) a la vez.
 *
 * También marca lo didáctico sin depender solo del color: columnas pedidas, filas que
 * cumplen o no una condición, repetidas, coincidencias de LIKE, NULL, estado y orden.
 */

export type DataCell = string | number | null;

export interface DataColumn {
  readonly name: string;
  readonly type: 'number' | 'text' | 'date';
}

export type DataRowState = 'kept' | 'discarded' | 'unknown';

export type DataCellMark =
  | { readonly kind: 'match' }
  | {
      readonly kind: 'like';
      readonly segments: readonly {
        readonly text: string;
        readonly kind: 'literal' | 'one' | 'any';
      }[];
    };

/** Papel de una columna en la consulta, para enlazar el código con los datos. */
export type ColumnRole = 'select' | 'where' | 'order';

export interface DataFieldGroup {
  readonly title: string;
  readonly columns: readonly string[];
}

/** Cómo se presentan los registros de una tabla conocida (EMPLEADOS) en fichas. */
export interface DataViewSchema {
  /** Columnas que forman el título de la ficha («Ana Rojas»). */
  readonly titleColumns: readonly string[];
  /** Identificador visible como insignia («#1»). */
  readonly idColumn?: string;
  /** Columna que se muestra bajo el título («Gerente general»). */
  readonly subtitleColumn?: string;
  /** Columnas del resumen; el resto se abre con «Ver registro completo». */
  readonly priorityColumns: readonly string[];
  readonly fieldGroups: readonly DataFieldGroup[];
}

/** Rótulos canónicos de contexto (nunca una tabla sin decir qué es). */
export type DataViewLabel =
  | 'Tabla original'
  | 'Vista educativa'
  | 'Resultado'
  | 'Resultado esperado'
  | 'Resultado Oracle'
  | 'Antes'
  | 'Después'
  | (string & {});

export interface DataViewProps {
  /** Nombre accesible de la tabla o de la lista de fichas. */
  readonly caption: string;
  /** Rótulo visible encima de los datos. */
  readonly label?: DataViewLabel;
  readonly columns: readonly DataColumn[];
  readonly rows: readonly (readonly DataCell[])[];
  readonly schema?: DataViewSchema;
  /** `summary`: solo las columnas prioritarias del esquema; `full`: todas. */
  readonly detail?: 'summary' | 'full';
  readonly highlightedColumns?: readonly string[];
  readonly dimOthers?: boolean;
  readonly highlightedRow?: number;
  readonly duplicateRows?: readonly number[];
  readonly rowStates?: readonly DataRowState[];
  readonly cellMarks?: readonly (readonly (DataCellMark | null)[])[];
  readonly sortedBy?: readonly { readonly column: number; readonly direction: 'ASC' | 'DESC' }[];
  readonly columnRoles?: Readonly<Record<string, readonly ColumnRole[]>>;
  readonly size?: 'regular' | 'large';
  /** Resumen visible, por ejemplo «8 de 20 filas · 3 columnas». */
  readonly summary?: string;
  /** Fuerza una representación (pruebas y casos especiales). */
  readonly mode?: 'auto' | 'table' | 'records';
  readonly className?: string;
  /** Columna que encabeza cada fila (`<th scope="row">`). */
  readonly rowHeader?: number;
  /** Columnas de texto largo: se parten en varias líneas en lugar de ensanchar la tabla. */
  readonly wrapColumns?: readonly string[];
  /** Columnas cuyo contenido es SQL o un nombre técnico: se muestran como código. */
  readonly codeColumns?: readonly string[];
}

const STATE_TEXT: Readonly<Record<DataRowState, { symbol: string; label: string }>> = {
  kept: { symbol: '✓', label: 'Cumple' },
  discarded: { symbol: '✗', label: 'No cumple' },
  unknown: { symbol: '?', label: 'Desconocido (NULL)' },
};

/** Umbrales de ancho (em) con regla CSS propia en `_data-view.scss`. */
export const DATA_VIEW_BUCKETS = [
  12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58,
  60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120,
] as const;

const STATUS_VALUES = new Set(['ACTIVO', 'INACTIVO']);

function textOf(value: DataCell): string {
  return value === null ? 'NULL' : formatCell(value);
}

/**
 * Ancho aproximado (em) que necesita la tabla para leerse sin barra: encabezados en
 * monoespaciada pequeña, datos en la fuente del texto y el relleno de cada celda.
 */
export function requiredTableWidth(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  options: {
    readonly states?: boolean;
    readonly duplicates?: boolean;
    readonly size?: 'regular' | 'large';
    readonly wrap?: readonly string[];
  } = {},
): number {
  const padding = options.size === 'large' ? 1.6 : 1.9;
  let width = 0.2;
  columns.forEach((column, index) => {
    if (options.wrap?.includes(column.name)) {
      width += 14 + padding;
      return;
    }
    const header = column.name.length * 0.52 + 0.9;
    const longest = rows.reduce((max, row) => {
      const value = row[index] ?? null;
      const length = value === null ? 4.2 : textOf(value).length * 0.58;
      const status = typeof value === 'string' && STATUS_VALUES.has(value) ? 1.6 : 0;
      return Math.max(max, length + status);
    }, 2);
    width += Math.max(header, longest) + padding;
  });
  if (options.states) width += 7.6;
  if (options.duplicates) width += 5.4;
  // Calibrado con el ancho real de las tablas del sitio (la estimación queda un 8–30 % por
  // encima): 0,93 conserva un margen para no provocar nunca una barra horizontal.
  return Math.round(width * 0.93 * 10) / 10;
}

export function widthBucket(width: number): number {
  return DATA_VIEW_BUCKETS.find((bucket) => bucket >= width) ?? DATA_VIEW_BUCKETS.at(-1)!;
}

export function NullBadge() {
  return (
    <span className="dv-null">
      NULL<span className="visually-hidden"> (valor nulo)</span>
    </span>
  );
}

function StatusChip({ value }: { readonly value: string }) {
  const active = value === 'ACTIVO';
  return (
    <span className={`dv-status dv-status--${active ? 'on' : 'off'}`}>
      <span aria-hidden="true">{active ? '●' : '○'}</span> {value}
    </span>
  );
}

function CellContent({
  value,
  mark,
  column,
  code = false,
}: {
  readonly value: DataCell;
  readonly mark: DataCellMark | null;
  readonly column: DataColumn | undefined;
  readonly code?: boolean;
}) {
  if (value === null) return <NullBadge />;
  if (code) return <code className="dv-code">{String(value)}</code>;
  if (mark?.kind === 'like') {
    return (
      <span className="dv-like">
        {mark.segments.map((segment, index) =>
          segment.kind === 'literal' ? (
            <mark key={index} className="dv-like__literal">
              {segment.text}
            </mark>
          ) : segment.kind === 'one' ? (
            <span key={index} className="dv-like__one" title="_ : un carácter">
              {segment.text}
            </span>
          ) : (
            <Fragment key={index}>{segment.text}</Fragment>
          ),
        )}
        <span className="visually-hidden"> (coincide con el patrón)</span>
      </span>
    );
  }
  const content =
    column?.name === 'ESTADO' && typeof value === 'string' && STATUS_VALUES.has(value) ? (
      <StatusChip value={value} />
    ) : (
      formatCell(value)
    );
  return (
    <>
      {content}
      {mark?.kind === 'match' && <span className="visually-hidden"> (cumple)</span>}
    </>
  );
}

export function DataView({
  caption,
  label,
  columns,
  rows,
  schema,
  detail = 'full',
  highlightedColumns = [],
  dimOthers = false,
  highlightedRow,
  duplicateRows = [],
  rowStates,
  cellMarks,
  sortedBy = [],
  columnRoles,
  size = 'regular',
  summary,
  mode = 'auto',
  className = '',
  rowHeader,
  wrapColumns = [],
  codeColumns = [],
}: DataViewProps) {
  // Columnas visibles en la tabla: en resumen, solo las prioritarias del esquema.
  const tableIndexes = columns
    .map((_, index) => index)
    .filter(
      (index) =>
        detail === 'full' || !schema || schema.priorityColumns.includes(columns[index]!.name),
    );
  const tableColumns = tableIndexes.map((index) => columns[index]!);
  const tableRows = rows.map((row) => tableIndexes.map((index) => row[index] ?? null));
  const need = requiredTableWidth(tableColumns, tableRows, {
    states: Boolean(rowStates),
    duplicates: duplicateRows.length > 0,
    size,
    wrap: wrapColumns,
  });
  const bucket = widthBucket(need);

  const state = (name: string) =>
    highlightedColumns.includes(name)
      ? 'is-on'
      : dimOthers && highlightedColumns.length > 0
        ? 'is-dim'
        : undefined;
  const sortOf = (index: number) => sortedBy.find((entry) => entry.column === index);
  const roleClasses = (name: string) =>
    (columnRoles?.[name] ?? []).map((role) => `dv-col--${role}`).join(' ');
  const rowClass = (rowIndex: number) =>
    [
      rowIndex === highlightedRow ? 'is-row' : '',
      duplicateRows.includes(rowIndex) ? 'is-duplicate' : '',
      rowStates?.[rowIndex] ? `is-${rowStates[rowIndex]}` : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const header =
    label || summary ? (
      <div className="dv__header">
        {label && <p className="dv__label">{label}</p>}
        {summary && <p className="dv__summary">{summary}</p>}
      </div>
    ) : null;

  const table = (
    <div className="dv__table" role="region" aria-label={caption} tabIndex={0}>
      <table>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {rowStates && (
              <th scope="col" className="dv__state">
                ¿Cumple?
              </th>
            )}
            {tableIndexes.map((columnIndex) => {
              const column = columns[columnIndex]!;
              const sort = sortOf(columnIndex);
              return (
                <th
                  key={`${column.name}-${columnIndex}`}
                  scope="col"
                  className={
                    [
                      state(column.name),
                      column.type === 'number' ? 'is-number' : '',
                      sort ? 'is-sorted' : '',
                      roleClasses(column.name),
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  aria-sort={
                    sort ? (sort.direction === 'ASC' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {column.name}
                  {sort && (
                    <span className="dv__sort" aria-hidden="true">
                      {sort.direction === 'ASC' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                  {state(column.name) === 'is-on' && (
                    <span className="visually-hidden"> (resaltada)</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowState = rowStates?.[rowIndex];
            const duplicate = duplicateRows.includes(rowIndex);
            return (
              <tr key={rowIndex} className={rowClass(rowIndex)}>
                {rowState && (
                  <td className="dv__state">
                    <span aria-hidden="true">{STATE_TEXT[rowState].symbol}</span>{' '}
                    <span className="dv__state-label">{STATE_TEXT[rowState].label}</span>
                  </td>
                )}
                {tableIndexes.map((columnIndex, position) => {
                  const column = columns[columnIndex];
                  const mark = cellMarks?.[rowIndex]?.[columnIndex] ?? null;
                  const classes = [
                    column ? state(column.name) : undefined,
                    column?.type === 'number' ? 'is-number' : '',
                    mark ? 'is-match' : '',
                    column ? roleClasses(column.name) : '',
                    column && wrapColumns.includes(column.name) ? 'is-wrap' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const Cell = columnIndex === rowHeader ? 'th' : 'td';
                  return (
                    <Cell
                      key={columnIndex}
                      className={classes || undefined}
                      {...(columnIndex === rowHeader ? { scope: 'row' as const } : {})}
                    >
                      <CellContent
                        value={row[columnIndex] ?? null}
                        mark={mark}
                        column={column}
                        code={Boolean(column && codeColumns.includes(column.name))}
                      />
                      {duplicate && position === tableIndexes.length - 1 && (
                        <span className="dv__badge">repetida</span>
                      )}
                      {rowIndex === highlightedRow && position === 0 && (
                        <span className="visually-hidden"> (fila resaltada)</span>
                      )}
                    </Cell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const records = (
    <Records
      caption={caption}
      columns={columns}
      rows={rows}
      schema={schema}
      detail={detail}
      state={state}
      sortOf={sortOf}
      rowClass={rowClass}
      rowStates={rowStates}
      cellMarks={cellMarks}
      duplicateRows={duplicateRows}
      roleClasses={roleClasses}
      codeColumns={codeColumns}
    />
  );

  return (
    <div
      className={['dv', `dv--${size}`, `dv--need-${bucket}`, `dv--mode-${mode}`, className]
        .filter(Boolean)
        .join(' ')}
      data-need={need}
    >
      {header}
      {mode !== 'records' && table}
      {mode !== 'table' && records}
    </div>
  );
}

interface RecordsProps {
  readonly caption: string;
  readonly columns: readonly DataColumn[];
  readonly rows: readonly (readonly DataCell[])[];
  readonly schema: DataViewSchema | undefined;
  readonly detail: 'summary' | 'full';
  readonly state: (name: string) => string | undefined;
  readonly sortOf: (index: number) => { readonly direction: 'ASC' | 'DESC' } | undefined;
  readonly rowClass: (index: number) => string | undefined;
  readonly rowStates: readonly DataRowState[] | undefined;
  readonly cellMarks: readonly (readonly (DataCellMark | null)[])[] | undefined;
  readonly duplicateRows: readonly number[];
  readonly roleClasses: (name: string) => string;
  readonly codeColumns: readonly string[];
}

/** Fichas por registro: título, campos prioritarios y el resto agrupado y plegable. */
function Records({
  caption,
  columns,
  rows,
  schema,
  detail,
  state,
  sortOf,
  rowClass,
  rowStates,
  cellMarks,
  duplicateRows,
  roleClasses,
  codeColumns,
}: RecordsProps) {
  const indexOf = (name: string) => columns.findIndex((column) => column.name === name);
  const titleIndexes = (schema?.titleColumns ?? ['NOMBRE', 'APELLIDO'])
    .map(indexOf)
    .filter((index) => index >= 0);
  // Sin columnas de título conocidas, la primera columna de texto hace de título.
  if (titleIndexes.length === 0) {
    const firstText = columns.findIndex((column) => column.type === 'text');
    titleIndexes.push(firstText >= 0 ? firstText : 0);
  }
  const idIndex = schema?.idColumn ? indexOf(schema.idColumn) : -1;
  const subtitleIndex = schema?.subtitleColumn ? indexOf(schema.subtitleColumn) : -1;
  const reserved = new Set([...titleIndexes, idIndex, subtitleIndex]);
  const fieldIndexes = columns.map((_, index) => index).filter((index) => !reserved.has(index));
  // Resumen: campos prioritarios a la vista y el resto plegado. Completa: todo a la vista,
  // agrupado cuando son muchos campos (IDENTIDAD, ORGANIZACIÓN…).
  const summaryMode = detail === 'summary' && Boolean(schema);
  const priority = new Set(schema?.priorityColumns ?? []);
  const upFront = summaryMode
    ? fieldIndexes.filter((index) => priority.has(columns[index]!.name))
    : fieldIndexes.length > 6 && schema
      ? []
      : fieldIndexes;
  const later = fieldIndexes.filter((index) => !upFront.includes(index));
  const groups = (schema?.fieldGroups ?? [])
    .map((group) => ({
      title: group.title,
      indexes: later.filter((index) => group.columns.includes(columns[index]!.name)),
    }))
    .filter((group) => group.indexes.length > 0);
  const grouped = new Set(groups.flatMap((group) => group.indexes));
  const ungrouped = later.filter((index) => !grouped.has(index));
  if (ungrouped.length > 0) groups.push({ title: 'Otros datos', indexes: ungrouped });
  const titleLabel = titleIndexes.map((index) => columns[index]!.name).join(' y ');

  const field = (rowIndex: number, columnIndex: number): ReactNode => {
    const column = columns[columnIndex]!;
    const sort = sortOf(columnIndex);
    const mark = cellMarks?.[rowIndex]?.[columnIndex] ?? null;
    const classes = [
      'dv-field',
      state(column.name),
      column.type === 'number' ? 'is-number' : '',
      mark ? 'is-match' : '',
      roleClasses(column.name),
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <div key={columnIndex} className={classes}>
        <dt>
          {column.name}
          {sort && (
            <span className="dv__sort">
              {sort.direction === 'ASC' ? ' ↑' : ' ↓'}
              <span className="visually-hidden">
                {sort.direction === 'ASC' ? ' (orden ascendente)' : ' (orden descendente)'}
              </span>
            </span>
          )}
        </dt>
        <dd>
          <CellContent
            value={rows[rowIndex]![columnIndex] ?? null}
            mark={mark}
            column={column}
            code={codeColumns.includes(column.name)}
          />
        </dd>
      </div>
    );
  };

  return (
    <ol className="dv__records" aria-label={caption}>
      {rows.map((row, rowIndex) => {
        const rowState = rowStates?.[rowIndex];
        return (
          <li
            key={rowIndex}
            className={['dv-record', rowClass(rowIndex)].filter(Boolean).join(' ')}
          >
            <div className="dv-record__head">
              {rowState && (
                <span className={`dv-record__state dv-record__state--${rowState}`}>
                  <span aria-hidden="true">{STATE_TEXT[rowState].symbol}</span>{' '}
                  {STATE_TEXT[rowState].label}
                </span>
              )}
              <p className="dv-record__title">
                <span className="visually-hidden">{titleLabel}: </span>
                {titleIndexes.map((index, position) => (
                  <span
                    key={index}
                    className={[
                      'dv-record__name',
                      state(columns[index]!.name),
                      cellMarks?.[rowIndex]?.[index] ? 'is-match' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {position > 0 && ' '}
                    <CellContent
                      value={row[index] ?? null}
                      mark={cellMarks?.[rowIndex]?.[index] ?? null}
                      column={columns[index]}
                    />
                  </span>
                ))}
                {idIndex >= 0 && (
                  <span className="dv-record__id">
                    <span className="visually-hidden">{columns[idIndex]!.name} </span>#
                    {formatCell(row[idIndex] ?? null)}
                  </span>
                )}
              </p>
              {subtitleIndex >= 0 && (
                <p className="dv-record__subtitle">
                  <span className="visually-hidden">{columns[subtitleIndex]!.name}: </span>
                  {formatCell(row[subtitleIndex] ?? null)}
                </p>
              )}
              {duplicateRows.includes(rowIndex) && <span className="dv__badge">repetida</span>}
            </div>
            {upFront.length > 0 && (
              <dl className="dv-record__fields">
                {upFront.map((columnIndex) => field(rowIndex, columnIndex))}
              </dl>
            )}
            {groups.length > 0 &&
              (!summaryMode ? (
                groups.map((group) => (
                  <div key={group.title} className="dv-record__group">
                    <p className="dv-record__group-title">{group.title}</p>
                    <dl className="dv-record__fields">
                      {group.indexes.map((columnIndex) => field(rowIndex, columnIndex))}
                    </dl>
                  </div>
                ))
              ) : (
                <details className="dv-record__more">
                  <summary>Ver registro completo</summary>
                  {groups.map((group) => (
                    <div key={group.title} className="dv-record__group">
                      <p className="dv-record__group-title">{group.title}</p>
                      <dl className="dv-record__fields">
                        {group.indexes.map((columnIndex) => field(rowIndex, columnIndex))}
                      </dl>
                    </div>
                  ))}
                </details>
              ))}
          </li>
        );
      })}
    </ol>
  );
}
