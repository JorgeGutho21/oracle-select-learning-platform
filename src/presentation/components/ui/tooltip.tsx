'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  function show() {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const trigger = triggerRef.current;
    if (!trigger) return;
    const box = trigger.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 32);
    const left = Math.max(16, Math.min(box.left, window.innerWidth - width - 16));
    setPosition({
      left,
      width,
      ...(window.innerHeight - box.bottom < 120
        ? { bottom: window.innerHeight - box.top + 8 }
        : { top: box.bottom + 8 }),
    });
    setOpen(true);
  }

  const showRef = useRef(show);
  useEffect(() => {
    showRef.current = show;
  });

  useEffect(() => {
    // Si el foco llegó antes de hidratar, `onFocus` nunca se disparó: se abre al montar.
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement === triggerRef.current) showRef.current();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target))
        setOpen(false);
    }
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }
    const hide = () => setOpen(false);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, [open]);

  return (
    <span
      className="ds-tooltip"
      ref={wrapperRef}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') show();
      }}
      onPointerLeave={() => {
        if (!wrapperRef.current?.contains(document.activeElement)) {
          // Keeps the bubble hoverable while crossing the small trigger gap.
          hideTimerRef.current = setTimeout(() => setOpen(false), 150);
        }
      }}
    >
      <button
        className="ds-tooltip__trigger"
        ref={triggerRef}
        type="button"
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={(event) => {
          event.currentTarget.focus();
          show();
        }}
      >
        {children}
      </button>
      {open && (
        <span className="ds-tooltip__bubble" id={id} role="tooltip" style={position}>
          {label}
        </span>
      )}
    </span>
  );
}
