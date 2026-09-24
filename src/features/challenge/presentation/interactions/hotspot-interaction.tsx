'use client';

import { Fragment } from 'react';
import type { InteractionProps } from './types';

/** M08: localizar el hueco donde falta un símbolo en la consulta. */
export function HotspotInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'hotspot-error'>) {
  const { tokens, requirement, insertToken } = mission.publicData;
  const selected = answer.gapIndex;
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
      <p className="ch-muted" aria-live="polite">
        {selected === null
          ? 'Selecciona el hueco donde debería ir el símbolo que falta.'
          : `Insertarás «${insertToken}» entre ${tokens[selected - 1]} y ${tokens[selected]}.`}
      </p>
    </div>
  );
}
