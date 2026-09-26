'use client';

import { useState } from 'react';
import { DataView, type DataViewProps } from './data-view';

/**
 * Vista de datos con selector «Resumen / Completa». Resumen muestra los campos prioritarios
 * (el resto se abre por registro); Completa, todos los campos. Ninguna de las dos necesita
 * barra horizontal: la vista cambia de tabla a fichas cuando no cabe.
 */
export function DataViewToggle({
  defaultDetail = 'summary',
  ...props
}: Omit<DataViewProps, 'detail'> & { readonly defaultDetail?: 'summary' | 'full' }) {
  const [detail, setDetail] = useState(defaultDetail);
  return (
    <div className="dv-toggle">
      <div className="dv-toggle__bar" role="group" aria-label={`Detalle de ${props.caption}`}>
        <button
          type="button"
          aria-pressed={detail === 'summary'}
          onClick={() => setDetail('summary')}
        >
          Resumen
        </button>
        <button type="button" aria-pressed={detail === 'full'} onClick={() => setDetail('full')}>
          Completa
        </button>
      </div>
      <DataView {...props} detail={detail} />
    </div>
  );
}
