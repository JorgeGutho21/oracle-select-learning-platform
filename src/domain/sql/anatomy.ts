import type { SelectStatement } from './ast';
import type { Span } from './source';

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
  | 'terminator';

export interface AnatomyPart {
  readonly role: AnatomyRole;
  readonly label: string;
  readonly text: string;
  readonly explanation: string;
  readonly span: Span;
}

export function describeAnatomy(statement: SelectStatement, source: string): AnatomyPart[] {
  const text = (span: Span) => source.slice(span.start, span.end);
  const parts: AnatomyPart[] = [
    {
      role: 'select',
      label: 'SELECT',
      text: text(statement.selectKeyword),
      explanation: 'Indica qué se va a mostrar.',
      span: statement.selectKeyword,
    },
  ];
  if (statement.distinct) {
    parts.push({
      role: 'distinct',
      label: 'DISTINCT',
      text: text(statement.distinct),
      explanation: 'Elimina del resultado las filas repetidas.',
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
    parts.push(
      expression.kind === 'column'
        ? {
            role: 'column',
            label: 'Columna',
            text: text(expression.span),
            explanation: `Copia el valor de ${expression.name} en cada fila.`,
            span: expression.span,
          }
        : {
            role: 'expression',
            label: 'Expresión calculada',
            text: text(expression.span),
            explanation: 'Se calcula fila por fila; no modifica la tabla.',
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
  for (const comma of statement.commas) {
    parts.push({
      role: 'separator',
      label: 'Coma',
      text: ',',
      explanation: 'Separa los elementos de la lista de SELECT.',
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
