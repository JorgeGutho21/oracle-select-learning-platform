import { unwrap, type Expression, type SelectStatement } from './ast';
import { diagnostic, type SqlDiagnostic } from './diagnostics';
import type { TableSchema } from './schema';

/**
 * Resolución de ORDER BY según Oracle: un número es la posición de una columna del
 * resultado, un nombre puede ser un alias de SELECT o una columna de la tabla, y con
 * DISTINCT solo se ordena por lo que se seleccionó (ORA-01791).
 */

export interface OrderTarget {
  /** Columna del resultado (con `*` expandido) por la que se ordena, si lo es. */
  readonly slot: number | null;
  /** El criterio nombra un alias de la lista de SELECT. */
  readonly viaAlias: boolean;
  /** El criterio es una posición (ORDER BY 2). */
  readonly position: boolean;
}

interface Slot {
  readonly name: string | null;
  readonly aliased: boolean;
  readonly expression: Expression | null;
}

/** Igualdad estructural de expresiones, sin paréntesis exteriores ni posiciones. */
export function sameExpression(left: Expression, right: Expression): boolean {
  const a = unwrap(left);
  const b = unwrap(right);
  switch (a.kind) {
    case 'column':
      return b.kind === 'column' && a.name === b.name && a.quoted === b.quoted;
    case 'number':
      return b.kind === 'number' && a.value === b.value;
    case 'string':
    case 'date':
      return b.kind === a.kind && a.value === b.value;
    case 'null':
      return b.kind === 'null';
    case 'unary':
      return (
        b.kind === 'unary' && a.operator === b.operator && sameExpression(a.operand, b.operand)
      );
    case 'binary':
      return (
        b.kind === 'binary' &&
        a.operator === b.operator &&
        sameExpression(a.left, b.left) &&
        sameExpression(a.right, b.right)
      );
    case 'group':
      return sameExpression(a.expression, b);
  }
}

function slotsOf(statement: SelectStatement, schema: TableSchema): Slot[] {
  return statement.items.flatMap((item): Slot[] =>
    item.kind === 'star'
      ? schema.columns.map(({ name }) => ({
          name,
          aliased: false,
          expression: { kind: 'column', name, raw: name, quoted: false, span: item.span },
        }))
      : [
          {
            name: item.alias
              ? item.alias.header
              : item.expression.kind === 'column'
                ? item.expression.name
                : null,
            aliased: item.alias !== null,
            expression: item.expression,
          },
        ],
  );
}

export function resolveOrderBy(
  statement: SelectStatement,
  schema: TableSchema,
  source = '',
): { readonly targets: readonly OrderTarget[]; readonly diagnostics: readonly SqlDiagnostic[] } {
  const found: SqlDiagnostic[] = [];
  const slots = slotsOf(statement, schema);
  const targets = (statement.orderBy?.items ?? []).map((item): OrderTarget => {
    const expression = unwrap(item.expression);
    const none: OrderTarget = { slot: null, viaAlias: false, position: false };
    if (expression.kind === 'number' && /^\d+$/.test(expression.raw)) {
      const position = expression.value;
      if (position >= 1 && position <= slots.length) {
        return { slot: position - 1, viaAlias: false, position: true };
      }
      found.push(
        diagnostic(source, {
          code: 'order-position',
          category: 'oracle',
          span: expression.span,
          message: `ORDER BY ${position} indica la columna número ${position} del resultado, pero el resultado tiene ${slots.length}.`,
          hint: 'En Oracle, un número en ORDER BY es una posición de la lista de SELECT. Escribe el nombre de la columna para que sea más claro.',
        }),
      );
      return none;
    }
    if (item.expression.kind === 'column') {
      const name = item.expression.name;
      const matches = slots
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => slot.name === name);
      const distinctMatches = matches.filter(
        (match, index) =>
          matches.findIndex(
            (other) =>
              other.slot.expression &&
              match.slot.expression &&
              sameExpression(other.slot.expression, match.slot.expression),
          ) === index,
      );
      if (distinctMatches.length > 1) {
        found.push(
          diagnostic(source, {
            code: 'ambiguous-order',
            category: 'oracle',
            span: item.expression.span,
            message: `${item.expression.raw} es ambiguo en ORDER BY: varias columnas del resultado se llaman ${name}.`,
            hint: 'Usa alias distintos en SELECT o indica la posición de la columna.',
          }),
        );
        return none;
      }
      const match = matches[0];
      if (match) return { slot: match.index, viaAlias: match.slot.aliased, position: false };
    } else {
      const index = slots.findIndex(
        (slot) => slot.expression !== null && sameExpression(slot.expression, item.expression),
      );
      if (index >= 0) return { slot: index, viaAlias: false, position: false };
    }
    if (statement.distinct) {
      found.push(
        diagnostic(source, {
          code: 'order-by-not-selected',
          category: 'oracle',
          span: item.expression.span,
          message: `Con DISTINCT, Oracle solo ordena por columnas que aparecen en SELECT, y ${source.slice(item.expression.span.start, item.expression.span.end) || 'este criterio'} no está en la lista (ORA-01791).`,
          hint: 'Añádelo a la lista de SELECT u ordena por una columna seleccionada.',
        }),
      );
    }
    return none;
  });
  return { targets, diagnostics: found };
}
