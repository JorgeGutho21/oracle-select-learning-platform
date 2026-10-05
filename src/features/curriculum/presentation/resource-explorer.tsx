'use client';

import { useState, type ReactNode } from 'react';

const CATEGORIES = [
  ['all', 'Todo'],
  ['concept', 'Conceptos'],
  ['syntax', 'Sintaxis'],
  ['example', 'Ejemplos'],
  ['error', 'Errores frecuentes'],
  ['reference', 'Oracle oficial'],
  ['guide', 'Guías rápidas'],
] as const;

/** Filters server-rendered reference fragments without duplicating curriculum in client JS. */
export function ResourceExplorer({ children }: { readonly children: ReactNode }) {
  const [category, setCategory] = useState<string>('all');
  return (
    <div className="db-resource-explorer" data-category={category}>
      <div className="db-resource-filter" role="group" aria-label="Tipo de recurso">
        {CATEGORIES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="ds-chip db-resource-filter__button"
            aria-pressed={category === id}
            onClick={() => setCategory(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="db-resource-help" role="status">
        {category === 'all'
          ? 'Referencia completa'
          : CATEGORIES.find(([id]) => id === category)?.[1]}{' '}
        · Elige un bloque del temario y abre sus fichas.
      </p>
      {children}
    </div>
  );
}
