'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  label: string;
  items: readonly TabItem[];
  defaultValue?: string;
}

export function Tabs({ label, items, defaultValue }: TabsProps) {
  const groupId = useId();
  const [selectedId, setSelectedId] = useState(defaultValue ?? items[0]?.id);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const activeId = items.some((item) => item.id === selectedId) ? selectedId : items[0]?.id;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = items[nextIndex];
    if (next) {
      setSelectedId(next.id);
      buttons.current.get(next.id)?.focus();
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="ds-tabs">
      <div className="ds-tabs__list" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              if (element) buttons.current.set(item.id, element);
              else buttons.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${groupId}-tab-${item.id}`}
            aria-controls={`${groupId}-panel-${item.id}`}
            aria-selected={activeId === item.id}
            tabIndex={activeId === item.id ? 0 : -1}
            className="ds-tabs__tab"
            onClick={() => setSelectedId(item.id)}
            onKeyDown={(event) => navigate(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          className="ds-tabs__panel"
          id={`${groupId}-panel-${item.id}`}
          aria-labelledby={`${groupId}-tab-${item.id}`}
          hidden={activeId !== item.id}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
