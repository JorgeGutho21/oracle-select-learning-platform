'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const noSubscription = () => () => {};
const currentOrigin = () => window.location.origin;
const serverOrigin = () => '';

interface QrMatrix {
  readonly url: string;
  readonly size: number;
  readonly path: string;
}

/** Convierte la matriz del QR en un único trazado SVG, sin inyectar HTML. */
function toPath(isDark: (row: number, column: number) => boolean, size: number): string {
  let path = '';
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (isDark(row, column)) path += `M${column} ${row}h1v1h-1z`;
    }
  }
  return path;
}

function isLocalHost(url: string): boolean {
  try {
    return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * QR hacia la práctica individual del Challenge en la dirección actual. No representa una
 * sala en vivo: esas salas aún no existen y no se inventan códigos ni enlaces.
 */
export function SceneQr({ path }: { readonly path: string }) {
  const origin = useSyncExternalStore(noSubscription, currentOrigin, serverOrigin);
  const url = origin ? `${origin}${path}` : '';
  const [matrix, setMatrix] = useState<QrMatrix | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;
    // La biblioteca solo se descarga al llegar a esta escena.
    import('qrcode-generator')
      .then(({ default: qrcode }) => {
        if (!active) return;
        const qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const size = qr.getModuleCount();
        setMatrix({ url, size, path: toPath((row, column) => qr.isDark(row, column), size) });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  const ready = matrix && matrix.url === url;
  return (
    <figure className="scene-qr">
      <div className="scene-qr__code">
        {ready ? (
          <svg
            viewBox={`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`}
            role="img"
            aria-label={`Código QR que abre ${url}`}
            shapeRendering="crispEdges"
          >
            <rect x="-2" y="-2" width={matrix.size + 4} height={matrix.size + 4} fill="#fff" />
            <path d={matrix.path} fill="#0b1733" />
          </svg>
        ) : (
          <span className="scene-qr__placeholder">
            {failed ? 'No se pudo generar el QR' : 'Generando QR…'}
          </span>
        )}
      </div>
      <figcaption>
        <strong>Practica en tu móvil</strong>
        <span className="scene-qr__url">{url || path}</span>
        <span>
          Abre el SQL Challenge individual. La sala en vivo con código y ranking aún no está
          disponible.
        </span>
        {url && isLocalHost(url) && (
          <span className="scene-qr__warning">
            Dirección local: otros dispositivos no podrán abrirla hasta publicar la plataforma.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
