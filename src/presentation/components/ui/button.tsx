'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  pending?: boolean;
  pendingLabel?: string;
}

export function Button({
  variant = 'primary',
  pending = false,
  pendingLabel = 'Enviando…',
  type = 'button',
  className = '',
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const hydrated = useHydrated();
  return (
    <button
      {...props}
      type={type}
      className={`ds-button ds-button--${variant} ${className}`.trim()}
      disabled={disabled || pending || !hydrated}
      aria-busy={pending || undefined}
      aria-label={pending ? pendingLabel : props['aria-label']}
      onClick={(event) => {
        // WebKit no enfoca botones al pulsarlos: normalizar también el retorno
        // del foco cuando la acción abre un diálogo.
        event.currentTarget.focus();
        onClick?.(event);
      }}
    >
      <span className="ds-button__label" aria-hidden={pending || undefined}>
        {children}
      </span>
      {pending && (
        <span className="ds-button__pending" aria-hidden="true">
          <span className="ds-spinner" />
        </span>
      )}
    </button>
  );
}
