import { Fragment, type ReactNode } from 'react';
import { formatSql } from '@/application/sql-format';
import { sqlRole } from './sql-semantics';

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

// Los operadores de comparación y aritméticos se marcan aparte (color ámbar); `-` solo con
// espacios alrededor, para no confundirlo con un comentario o un número negativo.
const TOKENS = new RegExp(
  `--[^\\n]*|"(?:[^"]|"")*"|'(?:[^']|'')*'|\\b(?:${KEYWORDS.join('|')})\\b|\\b\\d+(?:\\.\\d+)?\\b|<>|!=|>=|<=|\\|\\||[=<>+/*]|(?<= )-(?= )`,
  'gi',
);

export function highlightSql(code: string): ReactNode[] {
  const output: ReactNode[] = [];
  let position = 0;
  let previous = '';
  for (const match of code.matchAll(TOKENS)) {
    const start = match.index;
    const value = match[0];
    const between = code.slice(position, start);
    if (start > position) output.push(<Fragment key={`text-${position}`}>{between}</Fragment>);
    // `*` justo tras SELECT o DISTINCT es el comodín de columnas, no una multiplicación.
    const star = value === '*' && between.trim() === '' && /^(?:SELECT|DISTINCT)$/i.test(previous);
    const tone = value.startsWith('--')
      ? 'comment'
      : value.startsWith("'")
        ? 'string'
        : value.startsWith('"')
          ? 'identifier'
          : /^\d/.test(value)
            ? 'number'
            : /^\w/.test(value)
              ? 'keyword'
              : star
                ? 'star'
                : 'operator';
    const role = tone === 'keyword' ? sqlRole(value) : null;
    output.push(
      <span
        className={`sql-token sql-token--${tone}${role ? ` sql-token--${role}` : ''}`}
        key={`token-${start}`}
      >
        {value}
      </span>,
    );
    previous = value;
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
