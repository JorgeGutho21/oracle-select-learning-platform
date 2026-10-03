import type { Condition, Expression, OrderItem, SelectStatement } from './ast';
import { resolveOrderBy } from './order';
import { EMPLEADOS_SCHEMA, findColumn, type TableSchema } from './schema';

/**
 * Sentencia canónica construida desde el árbol validado (LAB_SPEC, validación, paso 4).
 * Los identificadores salen del catálogo permitido, los textos y alias se serializan de
 * forma segura y nunca se reenvía el texto original del usuario. Sin terminador final.
 */

export function quoteText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function renderExpression(expression: Expression, schema: TableSchema): string {
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
    case 'string':
      return quoteText(expression.value);
    case 'null':
      return 'NULL';
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expression.value))
        throw new Error(`Fecha no validada: ${expression.raw}`);
      return `DATE '${expression.value}'`;
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

export function renderCondition(condition: Condition, schema: TableSchema): string {
  const expr = (expression: Expression) => renderExpression(expression, schema);
  const not = (negated: boolean) => (negated ? 'NOT ' : '');
  switch (condition.kind) {
    case 'comparison':
      return `${expr(condition.left)} ${condition.operator} ${expr(condition.right)}`;
    case 'between':
      return `${expr(condition.expression)} ${not(condition.negated)}BETWEEN ${expr(condition.low)} AND ${expr(condition.high)}`;
    case 'in':
      return `${expr(condition.expression)} ${not(condition.negated)}IN (${condition.values.map(expr).join(', ')})`;
    case 'like':
      return `${expr(condition.expression)} ${not(condition.negated)}LIKE ${expr(condition.pattern)}`;
    case 'is-null':
      return `${expr(condition.expression)} IS ${not(condition.negated)}NULL`;
    case 'logical':
      return `${renderCondition(condition.left, schema)} ${condition.operator} ${renderCondition(condition.right, schema)}`;
    case 'not':
      return `NOT ${renderCondition(condition.condition, schema)}`;
    case 'condition-group':
      return `(${renderCondition(condition.condition, schema)})`;
  }
}

function renderAlias(alias: {
  readonly quoted: boolean;
  readonly raw: string;
  readonly header: string;
}) {
  return alias.quoted ? `"${alias.raw.replaceAll('"', '""')}"` : alias.header;
}

function renderOrderItem(
  item: OrderItem,
  statement: SelectStatement,
  aliasTarget: boolean,
  schema: TableSchema,
): string {
  let base: string;
  if (aliasTarget && item.expression.kind === 'column') {
    // Un alias de SELECT usado en ORDER BY: se escribe como el alias validado.
    const name = item.expression;
    const target = statement.items.find(
      (candidate) =>
        candidate.kind === 'expression' &&
        candidate.alias &&
        (name.quoted
          ? candidate.alias.quoted && candidate.alias.raw === name.name
          : candidate.alias.header === name.name),
    );
    if (!target || target.kind !== 'expression' || !target.alias)
      throw new Error(`Alias no validado: ${name.raw}`);
    base = renderAlias(target.alias);
  } else {
    base = renderExpression(item.expression, schema);
  }
  const direction = item.direction ? ` ${item.direction}` : '';
  const nulls = item.nulls ? ` NULLS ${item.nulls}` : '';
  return `${base}${direction}${nulls}`;
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
    return item.alias ? `${expression} AS ${renderAlias(item.alias)}` : expression;
  });
  let sql = `SELECT ${statement.distinct ? 'DISTINCT ' : ''}${items.join(', ')} FROM ${schema.name}`;
  if (statement.where) sql += ` WHERE ${renderCondition(statement.where.condition, schema)}`;
  if (statement.orderBy) {
    const { targets } = resolveOrderBy(statement, schema);
    const parts = statement.orderBy.items.map((item, index) =>
      renderOrderItem(item, statement, targets[index]?.viaAlias ?? false, schema),
    );
    sql += ` ORDER BY ${parts.join(', ')}`;
  }
  return sql;
}
