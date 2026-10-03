'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react';
import {
  searchPublicCatalog,
  searchResultGroups,
  type SearchResultDto,
} from '../application/search-index';
import { Dialog } from '@/presentation/components/ui/dialog';
import { SearchField } from '@/presentation/components/ui/search-field';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

const noSubscription = () => () => {};
const platformShortcut = () => (/mac|iphone|ipad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K');

/** Enfoca el destino: la sección del ancla si existe; si no, el título principal. */
function focusDestinationTitle(href: string) {
  const target = new URL(href, window.location.href);
  // Plazo por tiempo, no por fotogramas: la primera visita a una ruta puede tardar más de
  // un segundo en cargar su código y el foco se perdía (60 fotogramas ≈ 1 s).
  const deadline = performance.now() + 5000;

  const tryFocus = () => {
    const atDestination =
      window.location.pathname === target.pathname &&
      (target.search === '' || window.location.search === target.search);
    const anchor = target.hash ? document.getElementById(target.hash.slice(1)) : null;
    const title =
      anchor?.querySelector<HTMLElement>('h2, h3, h4') ??
      anchor ??
      document.querySelector<HTMLElement>('#main-content h1');

    if (atDestination && title) {
      if (!title.hasAttribute('tabindex')) title.tabIndex = -1;
      title.focus();
      if (anchor) anchor.scrollIntoView({ block: 'start' });
      return;
    }

    if (performance.now() < deadline) window.requestAnimationFrame(tryFocus);
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
  const shortcut = useSyncExternalStore(noSubscription, platformShortcut, () => 'Ctrl K');
  // El orden de recorrido con flechas coincide con el orden visible por grupos.
  const results = useMemo(() => {
    const found = searchPublicCatalog(query);
    return searchResultGroups.flatMap((group) => found.filter((result) => result.group === group));
  }, [query]);

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
        aria-label="Buscar"
        onClick={() => setOpen(true)}
      >
        <span className="global-search-trigger__icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8.5" cy="8.5" r="6" />
            <path d="m13 13 5 5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="global-search-trigger__label">Buscar</span>
        <kbd aria-hidden="true">{shortcut}</kbd>
      </button>

      <Dialog
        className="search-dialog"
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
                    {/* Un listbox solo admite grupos y opciones: el rótulo da nombre al grupo. */}
                    <div id={groupId} className="search-results__label" aria-hidden="true">
                      {group}
                    </div>
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
                              className={`search-result__status ${result.status === 'Próximamente' ? 'search-result__status--future' : ''}`.trim()}
                            >
                              {result.status === 'Próximamente' ? 'Próximamente' : 'Abrir'}
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
