import { Fragment, type ReactNode } from 'react';
import { formatCell } from './cell-format';
import { ColumnTabs } from './column-tabs';

/**
 * Vista de datos adaptable (ResponsiveDataView): la única forma de mostrar filas en la
 * plataforma. Una consulta SQL devuelve filas y columnas, así que su representación es
 * siempre tabular:
 *
 * 1. con espacio suficiente, la tabla completa;
 * 2. si no cabe, las columnas se reparten en dos o tres partes (pestañas o, con pocas filas,
 *    bandas apiladas) con las mismas filas y en el mismo orden;
 * 3. en pantallas estrechas, grupos semánticos de como mucho cuatro columnas (Identidad,
 *    Organización, Compensación…), uno a la vista, con ID_EMPLEADO y NOMBRE repetidos para
 *    identificar cada fila.
 *
 * Nunca se encoge la letra ni hay barra horizontal de página. Las fichas por registro solo
 * existen para tablas de referencia que no son resultados SQL (`fallback="records"`).
 *
 * La decisión es de CSS, sin saltos de diseño: el componente calcula el ancho que necesita
 * cada representación (en em, según columnas y contenido) y las consultas de contenedor
 * muestran la primera que cabe en el espacio real disponible. Solo una está visible (y en el
 * árbol de accesibilidad) a la vez.
 *
 * También marca lo didáctico sin depender solo del color: columnas pedidas, filas que
 * cumplen o no una condición, repetidas, coincidencias de LIKE, NULL, estado y orden.
 */

export type DataCell = string | number | null;

export type DataViewSize = 'regular' | 'large' | 'compact';

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

/** Cómo se identifican y agrupan las filas y columnas de una tabla conocida (EMPLEADOS). */
export interface DataViewSchema {
  /** Identificador de cada fila (ID_EMPLEADO): se repite en cada parte o grupo. */
  readonly idColumn?: string;
  /** Nombre legible de cada fila (NOMBRE): también se repite en los grupos. */
  readonly nameColumn?: string;
  /**
   * Grupos semánticos de dos columnas (sin las de identidad) para pantallas estrechas:
   * Identidad, Organización, Compensación, Empleo, Contacto y jefe.
   */
  readonly tabGroups?: readonly DataFieldGroup[];
  /** Fichas (solo tablas de referencia): columnas del título («Ana Rojas»). */
  readonly titleColumns?: readonly string[];
  /** Fichas: columna bajo el título. */
  readonly subtitleColumn?: string;
  /** Fichas: campos del resumen. */
  readonly priorityColumns?: readonly string[];
  /** Fichas: agrupación de los demás campos. */
  readonly fieldGroups?: readonly DataFieldGroup[];
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
  /**
   * Detalle de las fichas (`fallback="records"`): `summary` muestra los campos prioritarios
   * del esquema y pliega el resto; `full`, todos.
   */
  readonly detail?: 'summary' | 'full';
  readonly highlightedColumns?: readonly string[];
  readonly dimOthers?: boolean;
  readonly highlightedRow?: number;
  readonly duplicateRows?: readonly number[];
  readonly rowStates?: readonly DataRowState[];
  readonly cellMarks?: readonly (readonly (DataCellMark | null)[])[];
  readonly sortedBy?: readonly { readonly column: number; readonly direction: 'ASC' | 'DESC' }[];
  readonly columnRoles?: Readonly<Record<string, readonly ColumnRole[]>>;
  /**
   * `compact`: tabla de resultados SQL del laboratorio. Letra de datos de 13–14 px, textos
   * largos (CARGO, DEPARTAMENTO, CORREO) que pueden ocupar dos líneas y encabezado fijo al
   * desplazar la página.
   */
  readonly size?: DataViewSize;
  /** Resumen visible, por ejemplo «8 de 20 filas · 3 columnas». */
  readonly summary?: string;
  /**
   * Cómo se reparten las columnas cuando la tabla no cabe. `groups` (por defecto): pestañas
   * con las partes y, en pantallas estrechas, grupos de como mucho cuatro columnas. `bands`:
   * con pocas filas, las partes se apilan para verlas todas a la vez (los grupos estrechos
   * siguen en pestañas). `records`: fichas, solo para tablas de referencia que no son un
   * resultado SQL.
   */
  readonly fallback?: 'groups' | 'bands' | 'records';
  /** Fuerza una representación (pruebas, lienzo 16:9 y casos especiales). */
  readonly mode?: 'auto' | 'table' | 'bands' | 'groups' | 'records';
  /** Columnas simultáneas de un grupo en pantallas estrechas (con las de identidad). */
  readonly groupColumns?: number;
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
 * Ancho aproximado (em) de cada columna: encabezado en monoespaciada pequeña, datos en la
 * fuente del texto y el relleno de la celda.
 */
function columnWidths(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  options: { readonly size?: DataViewSize; readonly wrap?: readonly string[] } = {},
): number[] {
  if (options.size === 'compact') return compactWidths(columns, rows);
  const padding = options.size === 'large' ? 1.6 : 1.9;
  return columns.map((column, index) => {
    if (options.wrap?.includes(column.name)) return 14 + padding;
    const header = column.name.length * 0.52 + 0.9;
    const longest = rows.reduce((max, row) => {
      const value = row[index] ?? null;
      const length = value === null ? 4.2 : textOf(value).length * 0.58;
      const status = typeof value === 'string' && STATUS_VALUES.has(value) ? 1.6 : 0;
      return Math.max(max, length + status);
    }, 2);
    return Math.max(header, longest) + padding;
  });
}

/** Longitud (caracteres) que un texto no puede partir: su palabra más larga. */
function longestWord(text: string): number {
  return Math.max(
    ...text.split(/[\s@]+/).map((word) => word.length + (text.includes('@') ? 1 : 0)),
  );
}

/** Longitud del encabezado cuando se parte tras cada guion bajo («FECHA_» / «INGRESO»). */
export function headerSegments(name: string): string[] {
  return name.split(/(?<=_)/);
}

/**
 * Anchos de la tabla compacta: encabezados monoespaciados que se parten tras «_», números y
 * fechas enteros, y textos que pueden ocupar dos líneas (hasta 12 caracteres por línea o su
 * palabra más larga). La estimación nunca queda por debajo del ancho mínimo real.
 */
function compactWidths(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
): number[] {
  // Medido en Chromium con la letra del sitio: el ancho mínimo real queda un 5–10 % por debajo.
  const padding = 1.25;
  return columns.map((column, index) => {
    const header = Math.max(...headerSegments(column.name).map((part) => part.length)) * 0.53 + 0.3;
    const longest = rows.reduce((max, row) => {
      const value = row[index] ?? null;
      if (value === null) return Math.max(max, 3.4);
      const text = textOf(value);
      if (typeof value === 'string' && STATUS_VALUES.has(value)) {
        return Math.max(max, text.length * 0.62 + 2.4);
      }
      if (column.type !== 'text') return Math.max(max, text.length * 0.53);
      const chars = /[\s@]/.test(text)
        ? Math.max(longestWord(text), Math.min(text.length, 12))
        : text.length;
      return Math.max(max, chars * 0.52);
    }, 1.5);
    return Math.max(header, longest) + padding;
  });
}

/** Suma las columnas añadidas por la vista (¿Cumple?, repetida) y calibra con el ancho real. */
function finishWidth(
  sum: number,
  options: {
    readonly states?: boolean;
    readonly duplicates?: boolean;
    readonly compact?: boolean;
  },
): number {
  let width = 0.2 + sum;
  if (options.states) width += 7.6;
  if (options.duplicates) width += 5.4;
  // Calibrado con el ancho real de las tablas del sitio (la estimación queda un 8–30 % por
  // encima): 0,93 conserva un margen para no provocar nunca una barra horizontal. La tabla
  // compacta ya estima con margen y no se reduce.
  return Math.round(width * (options.compact ? 1 : 0.93) * 10) / 10;
}

/** Ancho aproximado (em) que necesita la tabla para leerse sin barra. */
export function requiredTableWidth(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  options: {
    readonly states?: boolean;
    readonly duplicates?: boolean;
    readonly size?: DataViewSize;
    readonly wrap?: readonly string[];
  } = {},
): number {
  const sum = columnWidths(columns, rows, options).reduce((total, width) => total + width, 0);
  return finishWidth(sum, { ...options, compact: options.size === 'compact' });
}

export function widthBucket(width: number): number {
  return DATA_VIEW_BUCKETS.find((bucket) => bucket >= width) ?? DATA_VIEW_BUCKETS.at(-1)!;
}

/** Columnas simultáneas en pantallas estrechas: identidad incluida. */
export const GROUP_COLUMNS = 4;

/** A partir de cuántas columnas se ofrecen partes intermedias (tableta). */
export const BAND_MIN_COLUMNS = 7;

/**
 * Columnas que identifican cada fila en las partes y grupos: ID_EMPLEADO y NOMBRE cuando el
 * resultado las tiene; si no, la primera columna.
 */
export function anchorIndexes(
  columns: readonly DataColumn[],
  schema?: Pick<DataViewSchema, 'idColumn' | 'nameColumn'>,
): number[] {
  const find = (name: string | undefined) =>
    name ? columns.findIndex((column) => column.name === name) : -1;
  const found = [find(schema?.idColumn), find(schema?.nameColumn)].filter((index) => index >= 0);
  return found.length > 0 ? found : [0];
}

/** Unidad de reparto: un grupo semántico o unas columnas consecutivas, sin la identidad. */
export interface ColumnUnit {
  /** Nombre visible: el grupo («Compensación») si está completo; si no, sus columnas. */
  readonly label: string;
  /** El nombre es un grupo semántico completo. */
  readonly semantic: boolean;
  readonly indexes: readonly number[];
}

/**
 * Grupos estrechos (como mucho `slots` columnas además de la identidad): cada columna va con
 * su grupo semántico, en el orden del resultado; los trozos vecinos incompletos se unen
 * mientras quepan.
 */
export function columnUnits(
  columns: readonly DataColumn[],
  anchors: readonly number[],
  slots: number,
  groups: readonly DataFieldGroup[] = [],
): ColumnUnit[] {
  const size = Math.max(1, slots);
  const groupOf = (index: number) =>
    groups.find((group) => group.columns.includes(columns[index]!.name));
  const complete = (group: DataFieldGroup | undefined, indexes: readonly number[]) =>
    group !== undefined &&
    group.columns.length === indexes.length &&
    group.columns.every((name) => indexes.some((index) => columns[index]!.name === name));
  const runs: { group: DataFieldGroup | undefined; indexes: number[] }[] = [];
  for (const index of columns.keys()) {
    if (anchors.includes(index)) continue;
    const group = groupOf(index);
    const last = runs.at(-1);
    if (last && last.group === group && last.indexes.length < size) last.indexes.push(index);
    else runs.push({ group, indexes: [index] });
  }
  const merged: { groups: (DataFieldGroup | undefined)[]; indexes: number[] }[] = [];
  for (const run of runs) {
    const last = merged.at(-1);
    const lastComplete = last?.groups.length === 1 && complete(last.groups[0], last.indexes);
    if (
      last &&
      !lastComplete &&
      !complete(run.group, run.indexes) &&
      last.indexes.length + run.indexes.length <= size
    ) {
      last.indexes.push(...run.indexes);
      last.groups.push(run.group);
    } else merged.push({ groups: [run.group], indexes: [...run.indexes] });
  }
  return merged.map(({ groups: owners, indexes }) => {
    const semantic = owners.length === 1 && complete(owners[0], indexes);
    return {
      label: semantic ? owners[0]!.title : indexes.map((index) => columns[index]!.name).join(' · '),
      semantic,
      indexes,
    };
  });
}

/** Reparto en partes contiguas: las mismas filas, en el mismo orden, con la identidad repetida. */
export interface DataPartition {
  /** Columnas repetidas en cada parte (ID_EMPLEADO y NOMBRE, o la primera). */
  readonly anchors: readonly number[];
  readonly parts: readonly { readonly label: string; readonly indexes: readonly number[] }[];
  /** Ancho (em) que necesita la parte más ancha. */
  readonly need: number;
}

const joinLabels = (labels: readonly string[]) =>
  labels.length <= 1
    ? labels.join('')
    : [labels[0], ...labels.slice(1).map((label) => label.toLowerCase())]
        .join(', ')
        .replace(/, ([^,]+)$/, ' y $1');

interface WidthOptions {
  readonly states?: boolean;
  readonly duplicates?: boolean;
  readonly size?: DataViewSize;
  readonly wrap?: readonly string[];
}

/**
 * Parte los grupos en `count` partes contiguas minimizando la más ancha (y, a igualdad de
 * umbral CSS, con el reparto más equilibrado). Las partes se nombran con sus grupos.
 */
export function planPartition(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  units: readonly ColumnUnit[],
  anchors: readonly number[],
  count: number,
  options: WidthOptions = {},
): DataPartition | null {
  if (count < 1 || units.length < count) return null;
  const widths = columnWidths(columns, rows, options);
  const anchorWidth = anchors.reduce((total, index) => total + widths[index]!, 0);
  const partWidth = (part: readonly ColumnUnit[]) =>
    finishWidth(
      anchorWidth +
        part.flatMap((unit) => unit.indexes).reduce((total, index) => total + widths[index]!, 0),
      { ...options, compact: options.size === 'compact' },
    );
  const best: { value: { parts: ColumnUnit[][]; need: number; spread: number } | null } = {
    value: null,
  };
  const split = (start: number, left: number, parts: ColumnUnit[][]): void => {
    if (left === 1) {
      const all = [...parts, units.slice(start)];
      const needs = all.map(partWidth);
      const need = Math.max(...needs);
      const spread = need - Math.min(...needs);
      const current = best.value;
      if (
        !current ||
        widthBucket(need) < widthBucket(current.need) ||
        (widthBucket(need) === widthBucket(current.need) && spread < current.spread)
      ) {
        best.value = { parts: all, need, spread };
      }
      return;
    }
    for (let end = start + 1; end <= units.length - (left - 1); end += 1) {
      split(end, left - 1, [...parts, units.slice(start, end)]);
    }
  };
  split(0, count, []);
  if (!best.value) return null;
  return {
    anchors,
    need: best.value.need,
    parts: best.value.parts.map((part, index) => ({
      label:
        part.length === 1 || part.every((unit) => unit.semantic)
          ? joinLabels(part.map((unit) => unit.label))
          : `Parte ${index + 1} de ${count}`,
      indexes: part.flatMap((unit) => unit.indexes),
    })),
  };
}

/**
 * Grupos estrechos: como mucho `groupColumns` columnas a la vez (identidad incluida), por
 * grupos semánticos. `null` si la tabla ya tiene pocas columnas.
 */
export function planGroups(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  options: WidthOptions & {
    readonly schema?: DataViewSchema | undefined;
    readonly groupColumns?: number;
  } = {},
): DataPartition | null {
  const limit = options.groupColumns ?? GROUP_COLUMNS;
  if (columns.length <= limit) return null;
  const anchors = anchorIndexes(columns, options.schema);
  const units = columnUnits(columns, anchors, limit - anchors.length, options.schema?.tabGroups);
  if (units.length < 2) return null;
  return planPartition(columns, rows, units, anchors, units.length, options);
}

/**
 * Partes intermedias (tableta): los grupos estrechos reunidos en dos o tres partes. Solo con
 * muchas columnas (7–12).
 */
export function planParts(
  columns: readonly DataColumn[],
  rows: readonly (readonly DataCell[])[],
  count: number,
  options: WidthOptions & {
    readonly schema?: DataViewSchema | undefined;
    readonly groupColumns?: number;
  } = {},
): DataPartition | null {
  if (columns.length < BAND_MIN_COLUMNS) return null;
  const anchors = anchorIndexes(columns, options.schema);
  const units = columnUnits(
    columns,
    anchors,
    (options.groupColumns ?? GROUP_COLUMNS) - anchors.length,
    options.schema?.tabGroups,
  );
  if (units.length <= count) return null;
  return planPartition(columns, rows, units, anchors, count, options);
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
    ) : typeof value === 'string' && value.includes('@') ? (
      // Un correo puede partirse tras la arroba sin ensanchar toda la tabla.
      <>
        {value.slice(0, value.indexOf('@') + 1)}
        <wbr />
        {value.slice(value.indexOf('@') + 1)}
      </>
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

/**
 * Clases de visibilidad por contenedor (`_data-view.scss`): la representación se oculta si
 * no cabe (`dv-fit-N`) o si ya cabe la anterior, más fácil de leer (`dv-above-N`).
 */
function fitClasses(fit: number | null, above: number | null): string {
  return [fit !== null ? `dv-fit-${fit}` : '', above !== null ? `dv-above-${above}` : '']
    .filter(Boolean)
    .join(' ');
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
  fallback = 'groups',
  groupColumns = GROUP_COLUMNS,
  className = '',
  rowHeader,
  wrapColumns = [],
  codeColumns = [],
}: DataViewProps) {
  const widthOptions = {
    states: Boolean(rowStates),
    duplicates: duplicateRows.length > 0,
    size,
    wrap: wrapColumns,
  };
  const need = requiredTableWidth(columns, rows, widthOptions);
  const bucket = widthBucket(need);
  const auto = mode === 'auto';
  const records = fallback === 'records';
  const planOptions = { ...widthOptions, schema, groupColumns };

  // Partes intermedias (dos o tres), solo si caben donde la anterior no cabe.
  const parts: DataPartition[] = [];
  if ((auto && !records) || mode === 'bands') {
    let limit = bucket;
    for (const count of [2, 3]) {
      const plan = planParts(columns, rows, count, planOptions);
      if (!plan || (auto && widthBucket(plan.need) >= limit)) continue;
      parts.push(plan);
      limit = widthBucket(plan.need);
      if (mode === 'bands') break;
    }
  }
  // Grupos estrechos: el último recurso, siempre disponible cuando hay muchas columnas.
  const groups =
    (auto && !records) || mode === 'groups' ? planGroups(columns, rows, planOptions) : null;

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

  /** Tabla con las columnas indicadas; en partes y grupos, la identidad encabeza cada fila. */
  const renderTable = (
    indexes: readonly number[],
    tableCaption: string,
    extraClass: string,
    anchors: readonly number[] = [],
  ) => {
    const headerColumn = anchors[0] ?? rowHeader;
    return (
      <div
        className={['dv__table', extraClass].filter(Boolean).join(' ')}
        role="region"
        aria-label={tableCaption}
        tabIndex={0}
      >
        <table>
          <caption className="visually-hidden">{tableCaption}</caption>
          <thead>
            <tr>
              {rowStates && (
                <th scope="col" className="dv__state">
                  ¿Cumple?
                </th>
              )}
              {indexes.map((columnIndex) => {
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
                        anchors.includes(columnIndex) ? 'is-anchor' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    aria-sort={
                      sort ? (sort.direction === 'ASC' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {headerSegments(column.name).map((part, index) => (
                      <Fragment key={index}>
                        {index > 0 && <wbr />}
                        {part}
                      </Fragment>
                    ))}
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
                  {indexes.map((columnIndex, position) => {
                    const column = columns[columnIndex];
                    const mark = cellMarks?.[rowIndex]?.[columnIndex] ?? null;
                    const classes = [
                      column ? state(column.name) : undefined,
                      column?.type === 'number' ? 'is-number' : '',
                      column?.type === 'date' ? 'is-date' : '',
                      mark ? 'is-match' : '',
                      column ? roleClasses(column.name) : '',
                      column && wrapColumns.includes(column.name) ? 'is-wrap' : '',
                      anchors.includes(columnIndex) ? 'is-anchor' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const Cell = columnIndex === headerColumn ? 'th' : 'td';
                    return (
                      <Cell
                        key={columnIndex}
                        className={classes || undefined}
                        {...(columnIndex === headerColumn ? { scope: 'row' as const } : {})}
                      >
                        <CellContent
                          value={row[columnIndex] ?? null}
                          mark={mark}
                          column={column}
                          code={Boolean(column && codeColumns.includes(column.name))}
                        />
                        {duplicate && position === indexes.length - 1 && (
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
  };

  // Cadena: tabla → partes (2, 3) → grupos estrechos. En modo automático cada una se oculta
  // si no cabe en el contenedor o si cabe la anterior; la última no se oculta por falta de
  // espacio (con fichas, las fichas son la última).
  const tiers = [bucket, ...parts.map((plan) => widthBucket(plan.need))];
  const lastIndex = groups ? tiers.length : tiers.length - 1;
  const fit = (index: number) => (auto && !records && index === lastIndex ? null : tiers[index]!);
  const above = (index: number) => (index === 0 ? null : tiers[index - 1]!);
  const showTable =
    auto ||
    mode === 'table' ||
    (mode === 'bands' && parts.length === 0) ||
    (mode === 'groups' && !groups);
  const showRecords = (auto && records) || mode === 'records';
  const anchorNames = (plan: DataPartition) => plan.anchors.map((index) => columns[index]!.name);
  const anchorNote = (plan: DataPartition, text: string) => {
    const names = anchorNames(plan);
    return (
      <p className="dv__bands-note">
        {text}{' '}
        {names.map((name, index) => (
          <Fragment key={name}>
            {index > 0 && ' y '}
            <code>{name}</code>
          </Fragment>
        ))}{' '}
        {names.length > 1 ? 'se repiten' : 'se repite'} para identificar cada fila.
      </p>
    );
  };
  const partCaption = (plan: DataPartition, index: number) =>
    `${caption} · ${plan.parts[index]!.label}: ${[...plan.anchors, ...plan.parts[index]!.indexes]
      .map((column) => columns[column]!.name)
      .join(', ')}`;
  const partTable = (plan: DataPartition, index: number, extra: string) =>
    renderTable(
      [...plan.anchors, ...plan.parts[index]!.indexes],
      partCaption(plan, index),
      extra,
      plan.anchors,
    );
  const tiered = (index: number) => (auto ? fitClasses(fit(index), above(index)) : '');

  const partViews = parts.map((plan, planIndex) => {
    const total = plan.parts.length;
    const tier = planIndex + 1;
    // Con pocas filas (bandas), las partes se apilan; si no, una a la vista con pestañas.
    if (fallback === 'bands' || mode === 'bands') {
      return (
        <div
          key={total}
          className={['dv__bands', `dv__bands--${total}`, tiered(tier)].filter(Boolean).join(' ')}
          role="group"
          aria-label={`${caption}, en ${total} partes`}
        >
          {anchorNote(
            plan,
            `Mismo resultado en ${total} partes, con las mismas filas y en el mismo orden:`,
          )}
          {plan.parts.map((part, index) => (
            <section key={part.label} className="dv__band" aria-label={part.label}>
              <p className="dv__band-title" aria-hidden="true">
                <span>
                  Parte {index + 1} de {total}
                </span>{' '}
                {part.label}
              </p>
              {partTable(plan, index, 'dv__table--band')}
            </section>
          ))}
        </div>
      );
    }
    return (
      <ColumnTabs
        key={total}
        className={['dv__groups--parts', tiered(tier)].filter(Boolean).join(' ')}
        label={`${caption}, en ${total} partes`}
        note={anchorNote(plan, `Mismas ${rows.length} filas en cada parte;`)}
        tabs={plan.parts.map((part, index) => ({
          key: part.label,
          label: part.label,
          panel: partTable(plan, index, 'dv__table--band'),
        }))}
      />
    );
  });

  const groupView = groups && (
    <ColumnTabs
      className={['dv__groups--narrow', tiered(tiers.length)].filter(Boolean).join(' ')}
      label={`${caption}, por grupos de columnas`}
      note={anchorNote(groups, `Mismas ${rows.length} filas en cada grupo;`)}
      tabs={groups.parts.map((part, index) => ({
        key: part.label,
        label: part.label,
        panel: partTable(groups, index, 'dv__table--band'),
      }))}
    />
  );

  return (
    <div
      className={[
        'dv',
        `dv--${size}`,
        `dv--need-${bucket}`,
        `dv--mode-${mode}`,
        records ? '' : 'dv--tabular',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-need={need}
    >
      {header}
      {showTable &&
        renderTable(
          columns.map((_, index) => index),
          caption,
          auto ? fitClasses(records || tiers.length > 1 || groups ? tiers[0]! : null, null) : '',
        )}
      {partViews}
      {groupView}
      {showRecords && (
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
          className={auto ? fitClasses(null, bucket) : ''}
        />
      )}
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
  readonly className?: string;
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
  className = '',
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
    <ol className={['dv__records', className].filter(Boolean).join(' ')} aria-label={caption}>
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
