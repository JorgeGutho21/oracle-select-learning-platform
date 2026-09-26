import { Fragment, type ReactNode } from 'react';
import { formatSql } from '@/application/sql-format';

/**
 * Resaltado visual de SQL, compartido por Estudio, Exposición, Recursos y el Challenge.
 * Solo colorea: nunca valida ni ejecuta. Palabras clave, textos, números y comentarios
 * tienen además peso o estilo propio, no solo color.
 */

const KEYWORDS = [
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'BETWEEN',
  'IN',
  'LIKE',
  'IS',
  'NULL',
  'ORDER',
  'BY',
  'ASC',
  'DESC',
  'NULLS',
  'FIRST',
  'LAST',
  'AS',
  'DATE',
  'GROUP',
  'HAVING',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'ON',
  'USING',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'COMMIT',
  'ROLLBACK',
  'CREATE',
  'ALTER',
  'DROP',
  'TABLE',
  'ADD',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'UNIQUE',
  'CHECK',
  'DEFAULT',
];

const TOKENS = new RegExp(
  `--[^\\n]*|"(?:[^"]|"")*"|'(?:[^']|'')*'|\\b(?:${KEYWORDS.join('|')})\\b|\\b\\d+(?:\\.\\d+)?\\b`,
  'gi',
);

export function highlightSql(code: string): ReactNode[] {
  const output: ReactNode[] = [];
  let position = 0;
  for (const match of code.matchAll(TOKENS)) {
    const start = match.index;
    const value = match[0];
    if (start > position)
      output.push(<Fragment key={`text-${position}`}>{code.slice(position, start)}</Fragment>);
    const tone = value.startsWith('--')
      ? 'comment'
      : value.startsWith("'")
        ? 'string'
        : value.startsWith('"')
          ? 'identifier'
          : /^\d/.test(value)
            ? 'number'
            : 'keyword';
    output.push(
      <span className={`sql-token sql-token--${tone}`} key={`token-${start}`}>
        {value}
      </span>,
    );
    position = start + value.length;
  }
  if (position < code.length)
    output.push(<Fragment key={`text-${position}`}>{code.slice(position)}</Fragment>);
  return output;
}

/**
 * Una línea por elemento: si una línea larga se parte, la continuación queda sangrada
 * (sangría francesa) y se lee como parte de la misma cláusula, sin barra horizontal.
 */
export function SqlLines({ sql }: { readonly sql: string }) {
  return (
    <>
      {sql.split('\n').map((line, index) => (
        <span className="sql-line" key={index}>
          {line.length > 0 ? highlightSql(line) : '\u00a0'}
        </span>
      ))}
    </>
  );
}

export interface SqlCodeProps {
  readonly sql: string;
  /** Rótulo visible encima del código («Consulta», «Con error»…). */
  readonly label?: string;
  readonly tone?: 'default' | 'error' | 'success';
  readonly size?: 'regular' | 'large';
  /** Reformatea la consulta (una cláusula por línea) sin cambiar su significado. */
  readonly format?: boolean;
}

export function SqlCode({
  sql,
  label,
  tone = 'default',
  size = 'regular',
  format = false,
}: SqlCodeProps) {
  const text = format ? formatSql(sql) : sql;
  return (
    <figure className={`sql-code sql-code--${tone} sql-code--${size}`}>
      {label && <figcaption className="sql-code__label">{label}</figcaption>}
      <pre className="sql-code__pre" aria-label={label ?? 'Consulta SQL'}>
        <code>
          <SqlLines sql={text} />
        </code>
      </pre>
    </figure>
  );
}
