import type { Expression, SelectStatement } from './ast';
import { EMPLEADOS_SCHEMA, findColumn, type TableSchema } from './schema';

/**
 * Sentencia canónica construida desde el árbol validado (LAB_SPEC, validación, paso 4).
 * Los identificadores salen del catálogo permitido y los alias se serializan de forma
 * segura; nunca se reenvía el texto original del usuario. Sin terminador final.
 */

function renderExpression(expression: Expression, schema: TableSchema): string {
  switch (expression.kind) {
    case 'column': {
      const column = findColumn(schema, expression.name);
      if (!column || expression.quoted) throw new Error(`Columna no validada: ${expression.raw}`);
      return column.name;
    }
    case 'number':
      if (!Number.isFinite(expression.value))
        throw new Error(`Número no validado: ${expression.raw}`);
      return expression.raw;
    case 'group':
      return `(${renderExpression(expression.expression, schema)})`;
    case 'unary': {
      const operand = renderExpression(expression.operand, schema);
      // "- -SALARIO" nunca se escribe "--SALARIO": para Oracle, "--" abre un comentario.
      return `${expression.operator}${/^[-+]/.test(operand) ? ' ' : ''}${operand}`;
    }
    case 'binary':
      return `${renderExpression(expression.left, schema)} ${expression.operator} ${renderExpression(expression.right, schema)}`;
  }
}

export function renderStatement(
  statement: SelectStatement,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): string {
  if (statement.table.name !== schema.name)
    throw new Error(`Tabla no validada: ${statement.table.raw}`);
  const items = statement.items.map((item) => {
    if (item.kind === 'star') return '*';
    const expression = renderExpression(item.expression, schema);
    if (!item.alias) return expression;
    const alias = item.alias.quoted
      ? `"${item.alias.raw.replaceAll('"', '""')}"`
      : item.alias.header;
    return `${expression} AS ${alias}`;
  });
  return `SELECT ${statement.distinct ? 'DISTINCT ' : ''}${items.join(', ')} FROM ${schema.name}`;
}
