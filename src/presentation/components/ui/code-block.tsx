'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Fragment, useState, type ReactNode } from 'react';
import { Button } from './button';

export interface CodeBlockProps {
  code: string;
  label?: string;
  labHref?: Route;
  labDisabled?: boolean;
}

// Visual highlighting only: this never validates or executes SQL.
function highlightSql(code: string): ReactNode[] {
  const tokens =
    /--[^\n]*|"(?:[^"]|"")*"|'(?:[^']|'')*'|\b(?:SELECT|FROM|AS|DISTINCT)\b|\b\d+(?:\.\d+)?\b/gi;
  const output: ReactNode[] = [];
  let position = 0;
  for (const match of code.matchAll(tokens)) {
    const start = match.index;
    const value = match[0];
    if (start > position)
      output.push(<Fragment key={`text-${position}`}>{code.slice(position, start)}</Fragment>);
    const tone = value.startsWith('--')
      ? 'comment'
      : /^["']/.test(value)
        ? 'string'
        : /^\d/.test(value)
          ? 'number'
          : 'keyword';
    output.push(
      <span className={`ds-code__${tone}`} key={`token-${start}`}>
        {value}
      </span>,
    );
    position = start + value.length;
  }
  if (position < code.length)
    output.push(<Fragment key={`text-${position}`}>{code.slice(position)}</Fragment>);
  return output;
}

export function CodeBlock({
  code,
  label = 'Ejemplo SQL',
  labHref,
  labDisabled = false,
}: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState('');

  async function copyCode() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setCopyStatus('Código copiado.');
    } catch {
      setCopyStatus('No se pudo copiar. Selecciona el código para copiarlo.');
    }
  }

  return (
    <div className="ds-code">
      <div className="ds-code__toolbar">
        <span className="ds-code__label">{label}</span>
        <Button variant="secondary" onClick={() => void copyCode()}>
          Copiar código
        </Button>
      </div>
      <pre className="ds-code__pre" tabIndex={0} aria-label={label}>
        <code>{highlightSql(code)}</code>
      </pre>
      <div className="ds-code__footer">
        <span className="ds-code__status" role="status">
          {copyStatus}
        </span>
        {labDisabled ? (
          <Button variant="text" disabled>
            Abrir en laboratorio
          </Button>
        ) : labHref ? (
          <Link className="ds-button ds-button--text" href={labHref}>
            Abrir en laboratorio <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
