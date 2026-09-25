'use client';

/**
 * Error en el propio layout raíz: reemplaza todo el documento y no recibe los estilos
 * globales, así que lleva los suyos (colores de los tokens) en línea.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: 16,
          color: '#132445',
          background: '#f5f8ff',
          font: '16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <title>Error | SQL SELECT LAB</title>
        <main style={{ maxWidth: 560, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>No fue posible cargar SQL SELECT LAB</h1>
          <p>Vuelve a intentarlo en unos segundos. Si el problema continúa, avisa al profesor.</p>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={retry}
              style={{
                minHeight: 44,
                padding: '0 20px',
                color: '#f7faff',
                background: '#1746b8',
                border: 0,
                borderRadius: 10,
                font: 'inherit',
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            {/* Documento de error sin router: un enlace normal recarga el inicio. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#1746b8' }}>
              Ir al inicio
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
