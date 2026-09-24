import type { Expression, SelectItem, SelectStatement } from './ast';
import { EMPLEADOS_SCHEMA, type TableSchema } from './schema';

/**
 * Traducción al lenguaje cotidiano derivada del árbol sintáctico (ARCHITECTURE: sin IA
 * generativa). Describe qué se muestra, de dónde sale y qué no cambia.
 */

export interface Translation {
  readonly summary: string;
  readonly steps: readonly string[];
}

const OPERATOR_WORDS = {
  '+': 'más',
  '-': 'menos',
  '*': 'multiplicado por',
  '/': 'dividido entre',
} as const;

export function expressionInWords(expression: Expression): string {
  switch (expression.kind) {
    case 'column':
      return expression.name;
    case 'number':
      return expression.raw;
    case 'group':
      return `(${expressionInWords(expression.expression)})`;
    case 'unary':
      return expression.operator === '-'
        ? `menos ${expressionInWords(expression.operand)}`
        : expressionInWords(expression.operand);
    case 'binary':
      return `${expressionInWords(expression.left)} ${OPERATOR_WORDS[expression.operator]} ${expressionInWords(expression.right)}`;
  }
}

function listInWords(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

function describeItem(item: SelectItem, schema: TableSchema): string {
  if (item.kind === 'star') {
    return `todas las columnas de la tabla (${schema.columns.map(({ name }) => name).join(', ')})`;
  }
  const base =
    item.expression.kind === 'column'
      ? `la columna ${item.expression.name}`
      : `el cálculo ${expressionInWords(item.expression)}`;
  return item.alias ? `${base} con el encabezado ${item.alias.header}` : base;
}

function stepForItem(item: SelectItem): string {
  if (item.kind === 'star') return 'copia todos los valores de la fila';
  const action =
    item.expression.kind === 'column'
      ? `copia el valor de ${item.expression.name}`
      : `calcula ${expressionInWords(item.expression)}`;
  return item.alias ? `${action} y lo muestra como ${item.alias.header}` : action;
}

export function translateStatement(
  statement: SelectStatement,
  rowCount: number,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): Translation {
  const items = statement.items.map((item) => describeItem(item, schema));
  const distinct = statement.distinct ? ', sin repetir filas idénticas' : '';
  const summary = `Para cada fila de la tabla ${statement.table.name}, muestra ${listInWords(items)}${distinct}.`;
  const steps = [
    `FROM ${statement.table.name}: toma las ${rowCount} filas de la tabla ${statement.table.name}.`,
    `SELECT: en cada fila, ${listInWords(statement.items.map(stepForItem))}.`,
  ];
  if (statement.distinct) {
    steps.push(
      'DISTINCT: compara las filas completas del resultado y deja una sola de cada combinación repetida.',
    );
  }
  if (statement.items.some((item) => item.kind === 'expression' && item.alias)) {
    steps.push(
      'AS solo cambia el encabezado del resultado: la columna original conserva su nombre en la tabla.',
    );
  }
  steps.push(`La tabla ${statement.table.name} no cambia: la consulta solo lee datos.`);
  steps.push('Sin ORDER BY, el orden de las filas del resultado no está garantizado.');
  return { summary, steps };
}
