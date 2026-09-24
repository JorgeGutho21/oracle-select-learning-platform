'use client';

import { useEffect, useState } from 'react';

interface QrMatrix {
  readonly value: string;
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

/** Código QR accesible; la biblioteca se descarga solo cuando se muestra. */
export function QrCode({ value, label }: { readonly value: string; readonly label: string }) {
  const [matrix, setMatrix] = useState<QrMatrix | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!value) return;
    let active = true;
    import('qrcode-generator')
      .then(({ default: qrcode }) => {
        if (!active) return;
        const qr = qrcode(0, 'M');
        qr.addData(value);
        qr.make();
        const size = qr.getModuleCount();
        setMatrix({ value, size, path: toPath((row, column) => qr.isDark(row, column), size) });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [value]);

  if (!matrix || matrix.value !== value) {
    return (
      <span className="qr-code__placeholder">
        {failed ? 'No se pudo generar el QR' : 'Generando QR…'}
      </span>
    );
  }
  return (
    <svg
      className="qr-code"
      viewBox={`-2 -2 ${matrix.size + 4} ${matrix.size + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={matrix.size + 4} height={matrix.size + 4} fill="#fff" />
      <path d={matrix.path} fill="#0b1733" />
    </svg>
  );
}
