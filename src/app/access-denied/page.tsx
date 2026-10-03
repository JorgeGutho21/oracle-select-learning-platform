import type { Metadata } from 'next';
import { AccessDenied } from '@/presentation/components/access-denied';

export const metadata: Metadata = {
  title: 'Acceso denegado',
  robots: { index: false, follow: false },
};

/** Destino del proxy cuando una cuenta sin el rol pide el panel docente (respuesta 403). */
export default function Page() {
  return <AccessDenied />;
}
