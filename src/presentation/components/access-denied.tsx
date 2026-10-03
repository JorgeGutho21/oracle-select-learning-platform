import type { Route } from 'next';
import Link from 'next/link';

/** 403: la sesión es válida pero el rol no alcanza (por ejemplo, un estudiante en /teacher). */
export function AccessDenied() {
  return (
    <div className="site-container feature-page">
      <header className="feature-heading">
        <span className="eyebrow">Cuenta</span>
        <h1>Acceso denegado</h1>
        <p className="readable muted">Esta página es solo para el profesor del curso.</p>
      </header>
      <section className="empty-state" aria-labelledby="forbidden-title">
        <span className="empty-mark" aria-hidden="true">
          403
        </span>
        <h2 id="forbidden-title">Tu cuenta no tiene permiso para verla</h2>
        <p className="readable muted">
          Si crees que es un error, pide al profesor que revise tu rol. Mientras tanto, puedes
          seguir con tu aprendizaje.
        </p>
        <Link href={'/dashboard' as Route} className="inline-action">
          Ir a mi progreso <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
