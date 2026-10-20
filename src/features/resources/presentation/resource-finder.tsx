'use client';

import { useId, useMemo, useState, type ReactNode } from 'react';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

interface ResourceEntry {
  readonly id: string;
  readonly title: string;
  readonly terms: string;
  readonly children: ReactNode;
}

/** Filtros de presentación: conserva las fichas y las fuentes académicas del servidor. */
export function ResourceFinder({ entries }: { readonly entries: readonly ResourceEntry[] }) {
  const hydrated = useHydrated();
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const matching = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (category === 'all' || entry.id === category) &&
          entry.terms.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')),
      ),
    [entries, query, category],
  );
  return (
    <div className="resource-finder">
      <div className="resource-finder__tools">
        <label htmlFor={inputId}>
          Buscar en la chuleta
          <input
            id={inputId}
            type="search"
            disabled={!hydrated}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Concepto, cláusula o palabra clave…"
          />
        </label>
        <p role="status">
          {matching.length} de {entries.length} categorías
        </p>
      </div>
      <div className="resource-finder__filters" aria-label="Filtrar por categoría">
        <button
          type="button"
          disabled={!hydrated}
          aria-pressed={category === 'all'}
          onClick={() => setCategory('all')}
        >
          Todas
        </button>
        {entries.map((entry) => (
          <button
            type="button"
            disabled={!hydrated}
            key={entry.id}
            aria-pressed={category === entry.id}
            onClick={() => setCategory(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>
      {matching.length === 0 && (
        <div className="resource-finder__empty">
          <p>No hay categorías que coincidan.</p>
          <button
            type="button"
            disabled={!hydrated}
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
      {entries.map((entry) => (
        <div key={entry.id} hidden={!matching.includes(entry)}>
          {entry.children}
        </div>
      ))}
    </div>
  );
}
