'use client';

import { Button } from '@/presentation/components/ui/button';

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  /** Vuelve a pedir y renderizar el segmento (un fallo temporal del servidor se recupera). */
  retry: () => void;
}) {
  return (
    <div className="site-container feature-page">
      <h1>No fue posible mostrar esta página</h1>
      <p>Puedes volver a intentar cargar la vista.</p>
      <Button onClick={retry}>Reintentar</Button>
    </div>
  );
}
