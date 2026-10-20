'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

/** El GET sigue siendo nativo; las filas previas dejan de presentarse como resultados nuevos. */
export function TeacherStudentSearch({
  query,
  children,
}: {
  readonly query: string;
  readonly children: ReactNode;
}) {
  const hydrated = useHydrated();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Volver con el historial puede restaurar este documento desde la caché del navegador.
    const restore = () => setPending(false);
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  return (
    <>
      <form
        className="teacher-search"
        role="search"
        action="/teacher"
        method="get"
        onSubmit={() => setPending(true)}
      >
        <label htmlFor="teacher-search-input">Buscar por nombre, apellido o correo</label>
        <div className="teacher-search__row">
          <input
            id="teacher-search-input"
            className="ds-input"
            type="search"
            name="q"
            defaultValue={query}
            maxLength={80}
            autoComplete="off"
            readOnly={pending}
          />
          <button
            type="submit"
            className="ds-button ds-button--primary"
            disabled={!hydrated || pending}
          >
            Buscar
          </button>
          {query && (
            <Link href="/teacher" className="ds-button ds-button--text">
              Ver todos
            </Link>
          )}
        </div>
      </form>
      {pending && (
        <p className="teacher-results" role="status">
          Buscando estudiantes…
        </p>
      )}
      <div aria-busy={pending}>
        <div hidden={pending}>{children}</div>
      </div>
    </>
  );
}
