import type { SelectItem, SelectStatement } from './ast';
import type { TableSchema } from './schema';

/** Encabezado que muestra Oracle: alias, nombre de columna o la expresión sin espacios. */
export function itemHeader(
  item: Extract<SelectItem, { kind: 'expression' }>,
  source: string,
): string {
  if (item.alias) return item.alias.header;
  if (item.expression.kind === 'column' && !item.expression.quoted) return item.expression.name;
  return source
    .slice(item.expression.span.start, item.expression.span.end)
    .replace(/\s+/g, '')
    .toUpperCase();
}

/** Columna del resultado y el elemento de SELECT del que sale. */
export interface ResultSlot {
  readonly header: string;
  /** Posición del elemento en la lista de SELECT. */
  readonly itemIndex: number;
  /** Columna de la tabla si el elemento es `*` o una columna sin cálculo. */
  readonly column: string | null;
}

/** Columnas del resultado en orden, con `*` ya expandido. */
export function resultSlots(
  statement: SelectStatement,
  source: string,
  schema: TableSchema,
): ResultSlot[] {
  return statement.items.flatMap((item, itemIndex): ResultSlot[] =>
    item.kind === 'star'
      ? schema.columns.map(({ name }) => ({ header: name, itemIndex, column: name }))
      : [
          {
            header: itemHeader(item, source),
            itemIndex,
            column:
              item.expression.kind === 'column' && !item.expression.quoted
                ? item.expression.name
                : null,
          },
        ],
  );
}
