'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface ColumnTab {
  readonly key: string;
  /** Texto de la pestaña: grupo semántico («Compensación») o sus columnas. */
  readonly label: string;
  readonly panel: ReactNode;
}

/**
 * Grupos de columnas de una misma tabla, uno a la vista: pestañas accesibles (flechas,
 * Inicio y Fin) sobre tablas reales con las mismas filas. Se usa cuando la tabla completa no
 * cabe; nunca convierte las filas en fichas.
 */
export function ColumnTabs({
  label,
  note,
  tabs,
  className = '',
}: {
  readonly label: string;
  readonly note?: ReactNode;
  readonly tabs: readonly ColumnTab[];
  readonly className?: string;
}) {
  const baseId = useId();
  const [selected, setSelected] = useState(0);
  const current = Math.min(selected, tabs.length - 1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setSelected(next);
    buttons.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const target = {
      ArrowRight: current + 1,
      ArrowDown: current + 1,
      ArrowLeft: current - 1,
      ArrowUp: current - 1,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    move(target);
  };

  return (
    <div
      className={['dv__groups', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      <div className="dv-tabs__bar">
        <span className="dv-tabs__legend" id={`${baseId}-legend`}>
          Columnas
        </span>
        <div className="dv-tabs__list" role="tablist" aria-labelledby={`${baseId}-legend`}>
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              className="dv-tabs__tab"
              aria-selected={index === current}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={index === current ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={onKeyDown}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {note}
      {tabs.map((tab, index) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          className="dv-tabs__panel"
          hidden={index !== current}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
