'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { normalizeRoomCode, ROOM_CODE_SIZE } from '../application/classroom-api';
import { Alert, Button } from '@/presentation/components/ui';

/**
 * `/live`: entrada por código para quien no pudo escanear el QR. El campo no es
 * controlado: lo escrito antes de que la página termine de cargar también se envía.
 */
export function CodeEntry() {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizeRoomCode(String(new FormData(event.currentTarget).get('code') ?? ''));
    if (!code) {
      setError(`El código tiene ${ROOM_CODE_SIZE} letras o números, por ejemplo AB3K9X.`);
      return;
    }
    router.push(`/join/${code}` as Route);
  };

  return (
    <div className="site-container feature-page classroom-page classroom-page--narrow">
      <header className="feature-heading">
        <span className="eyebrow">Participar</span>
        <h1>Sala en vivo</h1>
        <p className="muted">
          Escanea el QR que proyecta el profesor o escribe aquí el código de la sala. Solo necesitas
          un alias: sin cuenta, correo ni contraseña.
        </p>
      </header>
      <form className="classroom-card classroom-form" onSubmit={submit} noValidate>
        <label htmlFor={inputId}>Código de la sala</label>
        <input
          id={inputId}
          className="classroom-code-input"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          enterKeyHint="go"
          spellCheck={false}
          maxLength={ROOM_CODE_SIZE + 4}
          onInput={() => setError(null)}
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          required
        />
        <p id={hintId} className="classroom-hint">
          Son {ROOM_CODE_SIZE} caracteres; no distingue mayúsculas ni espacios.
        </p>
        <Button type="submit">Continuar</Button>
        {error && (
          <Alert tone="danger" title="Código no válido" live>
            {error}
          </Alert>
        )}
      </form>
      <p className="classroom-hint">
        ¿Eres el profesor? <Link href="/presenter">Crea una sala</Link>.
      </p>
    </div>
  );
}
