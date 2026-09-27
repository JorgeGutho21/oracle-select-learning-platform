'use client';

import { Fragment } from 'react';
import { DataView } from '@/presentation/components/data/data-view';
import { previewResult } from '../../application/challenge-api';
import type { InteractionProps } from './types';

/**
 * M08: localizar el hueco donde falta un símbolo. Se muestra qué devuelve ahora la consulta
 * (el diagnóstico) con un esquema mínimo, sin tabla completa.
 */
export function HotspotInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'hotspot-error'>) {
  const { tokens, requirement, insertToken } = mission.publicData;
  const selected = answer.gapIndex;
  const current = previewResult(tokens.join(' '), 3);
  return (
    <div className="ch-stack">
      <p className="ch-requirement">
        <strong>Requisito:</strong> {requirement}
      </p>
      <div className="ch-hotspot" role="group" aria-label="Consulta con huecos seleccionables">
        {tokens.map((token, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <button
                type="button"
                className={`ch-gap${selected === index ? ' ch-gap--selected' : ''}`}
                aria-pressed={selected === index}
                aria-label={`Hueco entre ${tokens[index - 1]} y ${token}`}
                onClick={() =>
                  onChange({ type: 'hotspot-error', gapIndex: selected === index ? null : index })
                }
                disabled={disabled}
              >
                <span aria-hidden="true">{selected === index ? insertToken : '·'}</span>
              </button>
            )}
            <span className={`ch-token${/^[A-Z]+$/.test(token) ? ' ch-token--keyword' : ''}`}>
              {token}
            </span>
          </Fragment>
        ))}
      </div>
      {current && (
        <DataView
          caption="Resultado actual de la consulta con error"
          label="Qué devuelve ahora"
          columns={current.columns.map((name, index) => ({
            name,
            type: typeof current.rows[0]?.[index] === 'number' ? 'number' : 'text',
          }))}
          rows={current.rows}
          summary={`${current.rows.length} de ${current.total} filas · ${current.columns.length} columna${current.columns.length === 1 ? '' : 's'}`}
          className="ch-diagnosis"
        />
      )}
      <p className="ch-muted" aria-live="polite">
        {selected === null
          ? 'Selecciona el hueco donde debería ir el símbolo que falta.'
          : `Insertarás «${insertToken}» entre ${tokens[selected - 1]} y ${tokens[selected]}.`}
      </p>
    </div>
  );
}
