import { unwrap, type Condition, type SelectStatement } from './ast';
import { EMPLEADOS_SCHEMA, type TableSchema } from './schema';
import type { Span } from './source';
import { conditionInWords, orderInWords } from './translator';

/** Partes de una consulta válida, en el orden del texto, para la «anatomía de consulta». */

export type AnatomyRole =
  | 'select'
  | 'distinct'
  | 'star'
  | 'column'
  | 'expression'
  | 'alias'
  | 'separator'
  | 'from'
  | 'table'
  | 'where'
  | 'condition'
  | 'logical'
  | 'order'
  | 'order-item'
  | 'terminator';

export interface AnatomyPart {
  readonly role: AnatomyRole;
  readonly label: string;
  readonly text: string;
  readonly explanation: string;
  readonly span: Span;
}

const LOGICAL_EXPLANATION = {
  AND: 'Une dos condiciones: la fila pasa solo si se cumplen ambas.',
  OR: 'Une dos condiciones: la fila pasa si se cumple al menos una.',
} as const;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function describeAnatomy(
  statement: SelectStatement,
  source: string,
  schema: TableSchema = EMPLEADOS_SCHEMA,
): AnatomyPart[] {
  const text = (span: Span) => source.slice(span.start, span.end);
  const parts: AnatomyPart[] = [
    {
      role: 'select',
      label: 'SELECT',
      text: text(statement.selectKeyword),
      explanation: 'Indica qué columnas se van a mostrar.',
      span: statement.selectKeyword,
    },
  ];
  if (statement.distinct) {
    parts.push({
      role: 'distinct',
      label: 'DISTINCT',
      text: text(statement.distinct),
      explanation: 'Quita del resultado las filas repetidas.',
      span: statement.distinct,
    });
  }
  for (const item of statement.items) {
    if (item.kind === 'star') {
      parts.push({
        role: 'star',
        label: 'Todas las columnas',
        text: '*',
        explanation: 'El asterisco se expande en todas las columnas de la tabla.',
        span: item.span,
      });
      continue;
    }
    const expression = item.expression;
    const bare = unwrap(expression);
    const literal =
      bare.kind === 'string' ||
      bare.kind === 'number' ||
      bare.kind === 'null' ||
      bare.kind === 'date';
    parts.push(
      bare.kind === 'column'
        ? {
            role: 'column',
            label: 'Columna',
            text: text(expression.span),
            explanation: `Copia el valor de ${bare.name} en cada fila.`,
            span: expression.span,
          }
        : {
            role: 'expression',
            label: literal
              ? 'Valor fijo'
              : bare.kind === 'binary' && bare.operator === '||'
                ? 'Concatenación'
                : 'Expresión calculada',
            text: text(expression.span),
            explanation: literal
              ? 'Se repite igual en todas las filas del resultado.'
              : 'Se calcula fila por fila; no modifica la tabla.',
            span: expression.span,
          },
    );
    if (item.alias) {
      parts.push({
        role: 'alias',
        label: item.alias.explicit ? 'Alias (AS)' : 'Alias implícito',
        text: text(item.alias.span),
        explanation: `Nombra el encabezado del resultado: ${item.alias.header}.`,
        span: item.alias.span,
      });
    }
  }
  const commas = [...statement.commas, ...(statement.orderBy?.commas ?? [])];
  for (const comma of commas) {
    parts.push({
      role: 'separator',
      label: 'Coma',
      text: ',',
      explanation: 'Separa los elementos de una lista.',
      span: comma,
    });
  }
  parts.push({
    role: 'from',
    label: 'FROM',
    text: text(statement.fromKeyword),
    explanation: 'Indica de qué tabla salen los datos.',
    span: statement.fromKeyword,
  });
  parts.push({
    role: 'table',
    label: 'Tabla de origen',
    text: text(statement.table.span),
    explanation: `${statement.table.name}: sus filas son la fuente del resultado.`,
    span: statement.table.span,
  });
  if (statement.where) {
    parts.push({
      role: 'where',
      label: 'WHERE',
      text: text(statement.where.keyword),
      explanation: 'Decide qué filas se conservan.',
      span: statement.where.keyword,
    });
    const visit = (condition: Condition) => {
      switch (condition.kind) {
        case 'logical':
          visit(condition.left);
          parts.push({
            role: 'logical',
            label: condition.operator,
            text: text(condition.operatorSpan),
            explanation: LOGICAL_EXPLANATION[condition.operator],
            span: condition.operatorSpan,
          });
          visit(condition.right);
          return;
        case 'not':
          parts.push({
            role: 'logical',
            label: 'NOT',
            text: text(condition.keywordSpan),
            explanation: 'Invierte la condición que le sigue.',
            span: condition.keywordSpan,
          });
          visit(condition.condition);
          return;
        case 'condition-group':
          visit(condition.condition);
          return;
        default:
          parts.push({
            role: 'condition',
            label: 'Condición',
            text: text(condition.span),
            explanation: `Pasan las filas ${conditionInWords(condition, schema).replace(/^en los que/, 'en las que')}.`,
            span: condition.span,
          });
      }
    };
    visit(statement.where.condition);
  }
  if (statement.orderBy) {
    parts.push({
      role: 'order',
      label: 'ORDER BY',
      text: text(statement.orderBy.keyword),
      explanation: 'Ordena las filas del resultado.',
      span: statement.orderBy.keyword,
    });
    statement.orderBy.items.forEach((item) => {
      const single: SelectStatement = {
        ...statement,
        orderBy: { ...statement.orderBy!, items: [item], commas: [] },
      };
      parts.push({
        role: 'order-item',
        label: item.direction ? `Criterio (${item.direction})` : 'Criterio (ASC por defecto)',
        text: text(item.span),
        explanation: `${capitalize(orderInWords(single, schema)?.replace(/^ordenados /, 'Ordena ') ?? 'Ordena el resultado')}.`,
        span: item.span,
      });
    });
  }
  if (statement.terminator) {
    parts.push({
      role: 'terminator',
      label: 'Punto y coma',
      text: ';',
      explanation: 'Marca el final de la sentencia; es opcional.',
      span: statement.terminator,
    });
  }
  return parts.sort((left, right) => left.span.start - right.span.start);
}
