'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

export function SearchField({
  label = 'Buscar tema o recurso',
  hint,
  error,
  id,
  className = '',
  ...props
}: SearchFieldProps) {
  const generatedId = useId();
  const hydrated = useHydrated();
  const inputId = id ?? generatedId;
  const description = [
    props['aria-describedby'],
    hint ? `${inputId}-hint` : '',
    error ? `${inputId}-error` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ds-field">
      <label className="ds-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ds-search">
        <svg className="ds-search__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          {...props}
          disabled={props.disabled || !hydrated}
          id={inputId}
          type="search"
          className={`ds-search__input ${className}`.trim()}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={description || undefined}
        />
      </div>
      {hint && (
        <p className="ds-field__hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ds-field__error" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
