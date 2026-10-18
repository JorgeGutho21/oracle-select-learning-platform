'use client';

import { createContext, useContext, useId, useState, type ReactNode } from 'react';

const ResourceQuery = createContext('');
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

export function ResourceSearchItem({
  text,
  children,
}: {
  readonly text: string;
  readonly children: ReactNode;
}) {
  const query = useContext(ResourceQuery);
  const matches = normalize(text).includes(normalize(query.trim()));
  return (
    <div className="db-resource-item" hidden={!matches}>
      {children}
    </div>
  );
}

export function ResourceSearchBlock({
  label,
  defaultOpen,
  children,
}: {
  readonly label: string;
  readonly defaultOpen: boolean;
  readonly children: ReactNode;
}) {
  const query = useContext(ResourceQuery);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="db-resource-block"
      open={Boolean(query.trim()) || open}
      onToggle={(event) => {
        if (!query.trim()) setOpen(event.currentTarget.open);
      }}
    >
      <summary>{label}</summary>
      {children}
    </details>
  );
}

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
  const [query, setQuery] = useState('');
  const searchId = useId();
  return (
    <ResourceQuery.Provider value={query}>
      <div className="db-resource-explorer" data-category={category}>
        <div className="db-resource-search">
          <label htmlFor={searchId}>¿Qué necesitas recordar?</label>
          <div className="db-resource-search__control">
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar concepto, sintaxis o error…"
            />
            {query && (
              <button
                type="button"
                className="ds-button ds-button--secondary"
                onClick={() => setQuery('')}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>
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
          ·{' '}
          {query.trim()
            ? `Resultados para «${query.trim()}».`
            : 'Elige un bloque del temario y abre sus fichas.'}
        </p>
        {children}
        <p className="db-resource-no-results" role="status">
          No hay fichas que coincidan con tu búsqueda. Prueba con otra palabra o limpia la búsqueda.
        </p>
      </div>
    </ResourceQuery.Provider>
  );
}
