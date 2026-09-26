'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';
import { formatSql } from '@/application/sql-format';
import { SqlLines } from '@/presentation/components/data/sql-code';
import { Button } from './button';

export interface CodeBlockProps {
  code: string;
  label?: string;
  labHref?: Route;
  labDisabled?: boolean;
  /** Lección del Modo Estudio que explica el ejemplo. */
  lessonHref?: Route;
  /** Muestra (y copia) la consulta formateada: una cláusula por línea. */
  format?: boolean;
}

/**
 * Bloque de código con acciones normalizadas: Copiar, Abrir en Lab y Ver lección. Las
 * líneas largas se parten con sangría francesa; nunca hay barra horizontal.
 */
export function CodeBlock({
  code,
  label = 'Ejemplo SQL',
  labHref,
  labDisabled = false,
  lessonHref,
  format = false,
}: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState('');
  const text = format ? formatSql(code) : code;

  async function copyCode() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopyStatus('Código copiado.');
    } catch {
      setCopyStatus('No se pudo copiar. Selecciona el código para copiarlo.');
    }
  }

  return (
    <div className="ds-code">
      <div className="ds-code__toolbar">
        <span className="ds-code__label">{label}</span>
        <Button variant="secondary" className="ds-code__copy" onClick={() => void copyCode()}>
          Copiar<span className="visually-hidden"> el código</span>
        </Button>
      </div>
      <pre className="ds-code__pre" aria-label={label}>
        <code>
          <SqlLines sql={text} />
        </code>
      </pre>
      <div className="ds-code__footer">
        <span className="ds-code__status" role="status">
          {copyStatus}
        </span>
        <span className="ds-code__actions">
          {labDisabled ? (
            <Button variant="text" disabled>
              Abrir en Lab
            </Button>
          ) : labHref ? (
            <Link className="ds-button ds-button--text" href={labHref}>
              Abrir en Lab <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
          {lessonHref && (
            <Link className="ds-button ds-button--text" href={lessonHref}>
              Ver lección <span aria-hidden="true">→</span>
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}
