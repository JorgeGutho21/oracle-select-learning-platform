'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  searchPublicCatalog,
  searchResultGroups,
  type SearchResultDto,
} from '../application/search-index';
import { Dialog } from '@/presentation/components/ui/dialog';
import { SearchField } from '@/presentation/components/ui/search-field';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

function focusDestinationTitle(href: string) {
  const target = new URL(href, window.location.href);
  let attempts = 0;

  const tryFocus = () => {
    attempts += 1;
    const atDestination =
      window.location.pathname === target.pathname &&
      (target.search === '' || window.location.search === target.search);
    const title = document.querySelector<HTMLElement>('#main-content h1');

    if (atDestination && title) {
      if (!title.hasAttribute('tabindex')) title.tabIndex = -1;
      title.focus();
      return;
    }

    if (attempts < 60) window.requestAnimationFrame(tryFocus);
  };

  window.requestAnimationFrame(tryFocus);
}

export function SearchPalette() {
  const hydrated = useHydrated();
  const router = useRouter();
  const listboxId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => searchPublicCatalog(query), [query]);

  useEffect(() => {
    if (!hydrated) return;

    const openFromShortcut = (event: KeyboardEvent) => {
      if (event.altKey || (!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== 'k') {
        return;
      }
      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener('keydown', openFromShortcut);
    return () => window.removeEventListener('keydown', openFromShortcut);
  }, [hydrated]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(inputId)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [inputId, open]);

  const activeResult = results[activeIndex];

  useEffect(() => {
    if (!open || !activeResult) return;
    document
      .getElementById(`${listboxId}-${activeResult.id}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeResult, listboxId, open]);

  const navigate = (result: SearchResultDto) => {
    if (!result.href) return;
    setOpen(false);
    router.push(result.href as Route);
    focusDestinationTitle(result.href);
  };

  const moveActiveResult = (direction: 1 | -1) => {
    if (results.length === 0) return;
    setActiveIndex((current) => (current + direction + results.length) % results.length);
  };

  return (
    <>
      <button
        type="button"
        className="global-search-trigger"
        disabled={!hydrated}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => setOpen(true)}
      >
        <span className="global-search-trigger__icon" aria-hidden="true">
          ⌕
        </span>
        <span>Buscar</span>
        <kbd aria-hidden="true">Ctrl K</kbd>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Buscar en SQL SELECT LAB"
        description="Encuentra conceptos, lecciones, prácticas y recursos públicos."
      >
        <div className="search-palette">
          <SearchField
            id={inputId}
            value={query}
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            placeholder="Prueba «alias», «*», «quiz» o «WHERE»"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={activeResult ? `${listboxId}-${activeResult.id}` : undefined}
            hint="Usa ↑ y ↓ para recorrer resultados, Enter para abrir y Escape para cerrar."
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                moveActiveResult(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                moveActiveResult(-1);
              } else if (event.key === 'Enter' && activeResult) {
                event.preventDefault();
                navigate(activeResult);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
              }
            }}
          />

          {query.trim() === '' ? (
            <div className="search-palette__empty">
              <p>Escribe un tema, una actividad o un recurso.</p>
              <span>También puedes buscar contenidos futuros para ver su disponibilidad.</span>
            </div>
          ) : results.length === 0 ? (
            <div className="search-palette__empty" role="status">
              <p>No hay resultados para esta búsqueda.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveIndex(0);
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div id={listboxId} className="search-results" role="listbox" aria-label="Resultados">
              {searchResultGroups.map((group) => {
                const groupResults = results.filter((result) => result.group === group);
                if (groupResults.length === 0) return null;
                const groupId = `${listboxId}-${group.toLocaleLowerCase('es')}`;

                return (
                  <section
                    className="search-results__group"
                    role="group"
                    key={group}
                    aria-labelledby={groupId}
                  >
                    <h3 id={groupId}>{group}</h3>
                    <div className="search-results__items">
                      {groupResults.map((result) => {
                        const index = results.indexOf(result);
                        const active = index === activeIndex;
                        const content = (
                          <>
                            <span className="search-result__copy">
                              <strong>{result.title}</strong>
                              <span>{result.description}</span>
                            </span>
                            <span
                              className={`search-result__status ${result.href ? '' : 'search-result__status--future'}`.trim()}
                            >
                              {result.href ? 'Abrir' : result.status}
                            </span>
                          </>
                        );

                        return result.href ? (
                          <button
                            type="button"
                            id={`${listboxId}-${result.id}`}
                            className="search-result"
                            role="option"
                            aria-selected={active}
                            tabIndex={-1}
                            key={result.id}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => navigate(result)}
                          >
                            {content}
                          </button>
                        ) : (
                          <div
                            id={`${listboxId}-${result.id}`}
                            className="search-result search-result--future"
                            role="option"
                            aria-selected={active}
                            aria-disabled="true"
                            key={result.id}
                            onMouseEnter={() => setActiveIndex(index)}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
