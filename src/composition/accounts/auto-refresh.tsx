'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Vuelve a pedir el panel cada minuto con la pestaña visible (estado lento, sin sondeo agresivo). */
export function AutoRefresh({ intervalMs = 60_000 }: { readonly intervalMs?: number }) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      router.refresh();
      setUpdatedAt(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);
  return (
    <p className="teacher-refresh">
      Se actualiza cada minuto{updatedAt ? ` · última vez a las ${updatedAt}` : ''}.
    </p>
  );
}
