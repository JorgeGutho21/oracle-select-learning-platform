'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { Failure } from '../application/classroom-service';
import { Alert, Button } from '@/presentation/components/ui';

export interface PresenterCreateProps {
  readonly availability: {
    readonly backend: 'supabase' | 'memory' | 'unconfigured';
    readonly presenterAccess: boolean;
  };
  readonly createRoom: (accessCode: string) => Promise<{ ok: true; code: string } | Failure>;
}

/** Crear una sala: solo con la clave del profesor configurada en el servidor. */
export function PresenterCreate({ availability, createRoom }: PresenterCreateProps) {
  const router = useRouter();
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ready = availability.backend !== 'unconfigured' && availability.presenterAccess;

  // Campo no controlado: lo escrito antes de que la página termine de cargar también cuenta.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const accessCode = String(new FormData(event.currentTarget).get('accessCode') ?? '');
    if (accessCode.trim() === '') {
      setError('Escribe la clave del profesor.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await createRoom(accessCode);
      if (result.ok) router.push(`/presenter/${result.code}` as Route);
      else setError(result.message);
    } catch {
      setError('No se pudo crear la sala. Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="site-container feature-page classroom-page">
      <header className="feature-heading">
        <span className="eyebrow">Sala en vivo · Profesor</span>
        <h1>Crear una sala</h1>
        <p className="muted">
          La sala genera un código y un QR. Los estudiantes entran desde el móvil con un alias, sin
          cuenta ni correo, y juegan el SQL Challenge mientras sigues el ranking en tiempo real.
        </p>
      </header>
      {!ready ? (
        <Alert tone="warning" title="Sala en vivo no configurada">
          {availability.backend === 'unconfigured'
            ? 'Falta configurar el almacenamiento de la sala (Supabase) en el servidor.'
            : 'Falta configurar la clave del profesor (PRESENTER_ACCESS_CODE) en el servidor.'}{' '}
          Los pasos están en docs/SUPABASE_SETUP.md.
        </Alert>
      ) : (
        <form
          className="classroom-card classroom-form"
          onSubmit={(event) => void submit(event)}
          noValidate
        >
          {availability.backend === 'memory' && (
            <Alert tone="info" title="Modo local">
              La sala vive en la memoria de este servidor: sirve para una clase en la misma red,
              pero sus datos se pierden al reiniciarlo.
            </Alert>
          )}
          <label htmlFor={inputId}>Clave del profesor</label>
          <input
            id={inputId}
            type="password"
            autoComplete="current-password"
            name="accessCode"
            onInput={() => setError(null)}
            aria-invalid={error ? true : undefined}
            required
            maxLength={200}
          />
          <p className="classroom-hint">
            La clave la define quien administra la plataforma. No la compartas con los estudiantes.
          </p>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creando…' : 'Crear sala'}
          </Button>
          {error && (
            <Alert tone="danger" title="No se pudo crear la sala" live>
              {error}
            </Alert>
          )}
        </form>
      )}
    </div>
  );
}
