'use client';

import { Button } from '@/presentation/components/ui';
import { useHydrated } from '@/presentation/hooks/use-hydrated';

/** Imprime la chuleta con el diálogo del navegador; los estilos de impresión la aíslan. */
export function PrintButton() {
  const hydrated = useHydrated();
  return (
    <Button variant="secondary" disabled={!hydrated} onClick={() => window.print()}>
      Imprimir la chuleta
    </Button>
  );
}
