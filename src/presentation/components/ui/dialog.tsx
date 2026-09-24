'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Clase adicional para variantes de composición, como la paleta de búsqueda. */
  className?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, description, className, children }: DialogProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      const trigger = triggerRef.current;
      if (trigger && trigger !== document.body && trigger.isConnected) trigger.focus();
      // Sin activador enfocable (atajo de teclado), el foco no se queda en un control oculto.
      else if (
        document.activeElement instanceof HTMLElement &&
        dialog.contains(document.activeElement)
      )
        document.activeElement.blur();
    }
  }, [open]);

  useEffect(
    () => () => {
      triggerRef.current?.focus();
    },
    [],
  );

  return (
    <dialog
      className={className ? `ds-dialog ${className}` : 'ds-dialog'}
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="ds-dialog__header">
        <h2 id={`${id}-title`} className="ds-dialog__title">
          {title}
        </h2>
        <Button variant="text" aria-label="Cerrar diálogo" onClick={onClose}>
          Cerrar <span aria-hidden="true">×</span>
        </Button>
      </div>
      {description && (
        <p id={`${id}-description`} className="ds-dialog__description">
          {description}
        </p>
      )}
      <div className="ds-dialog__body">{children}</div>
    </dialog>
  );
}
