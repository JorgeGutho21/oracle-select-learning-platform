'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { publicUrlFromEnvironment } from '@/application/public-url';
import { QrCode } from '@/presentation/components/media/qr-code';

const noSubscription = () => () => {};
const currentOrigin = () => window.location.origin;
const serverOrigin = () => '';

/**
 * QR hacia la práctica individual del Challenge. La URL sale de la configuración pública
 * (o del origen de la página en desarrollo); la sala en vivo proyecta su propio QR.
 */
export function SceneQr({ path }: { readonly path: string }) {
  const origin = useSyncExternalStore(noSubscription, currentOrigin, serverOrigin);
  const base = publicUrlFromEnvironment(origin || undefined);
  const url = base.url ? `${base.url}${path}` : '';
  return (
    <figure className="scene-qr">
      <div className="scene-qr__code">
        {url ? (
          <QrCode value={url} label={`Código QR que abre ${url}`} />
        ) : (
          <span className="scene-qr__placeholder">Generando QR…</span>
        )}
      </div>
      <figcaption>
        <strong>Practica en tu móvil</strong>
        <span className="scene-qr__url">{url || path}</span>
        <span>
          Abre el SQL Challenge individual. Para jugar todos juntos, crea una sala en{' '}
          <Link href="/presenter">Sala en vivo</Link>: proyecta su propio código.
        </span>
        {base.isLocal && (
          <span className="scene-qr__warning">
            Dirección local: otros dispositivos no podrán abrirla. Configura NEXT_PUBLIC_SITE_URL
            con la dirección publicada.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
