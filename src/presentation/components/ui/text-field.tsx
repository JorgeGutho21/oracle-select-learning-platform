'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly id?: string;
}

/**
 * Campo de formulario con etiqueta visible, ayuda y error asociados por aria-describedby.
 * El error se anuncia con el resumen del formulario, no campo por campo.
 */
export function TextField({ label, hint, error, id, className = '', ...props }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = [hint ? `${inputId}-hint` : '', error ? `${inputId}-error` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={`ds-field ${error ? 'ds-field--invalid' : ''}`.trim()}>
      <label className="ds-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className={`ds-input ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
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

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

/** Contraseña con botón para mostrarla: ayuda a escribirla bien en el móvil. */
export function PasswordField({ label, hint, error, id, ...props }: PasswordFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? `${inputId}-hint` : '', error ? `${inputId}-error` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={`ds-field ${error ? 'ds-field--invalid' : ''}`.trim()}>
      <label className="ds-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ds-password">
        <input
          {...props}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className="ds-input ds-password__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="button"
          className="ds-password__toggle"
          aria-pressed={visible}
          aria-controls={inputId}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
          <span className="visually-hidden"> contraseña</span>
        </button>
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
