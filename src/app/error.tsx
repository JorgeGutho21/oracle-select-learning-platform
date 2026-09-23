'use client';

import { Button } from '@/presentation/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="site-container feature-page">
      <h1>No fue posible mostrar esta página</h1>
      <p>Puedes volver a intentar cargar la vista.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
