'use client';

import { CodeBlock } from '@/presentation/components/ui';
import type { InteractionProps } from './types';

/** M07: retirar repeticiones de una proyección para obtener el resultado de DISTINCT. */
export function DistinctInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: InteractionProps<'distinct-result'>) {
  const { query, sourceQuery, column, candidateValues } = mission.publicData;
  const kept = new Set(answer.keptIndexes);
  const toggle = (index: number) =>
    onChange({
      type: 'distinct-result',
      keptIndexes: kept.has(index)
        ? answer.keptIndexes.filter((item) => item !== index)
        : [...answer.keptIndexes, index].sort((a, b) => a - b),
    });
  return (
    <div className="ch-stack">
      <CodeBlock code={query} label="Consulta objetivo" />
      <div className="ch-compare">
        <div className="ch-compare__panel">
          <p className="ch-compare__title">
            Antes: {sourceQuery} ({candidateValues.length} filas)
          </p>
          <ul className="ch-rows">
            {candidateValues.map((value, index) => (
              <li key={index}>
                <button
                  type="button"
                  className={`ch-row-toggle${kept.has(index) ? '' : ' ch-row-toggle--removed'}`}
                  aria-pressed={!kept.has(index)}
                  aria-label={`Fila ${index + 1}, ${value}: ${kept.has(index) ? 'se conserva' : 'retirada'}`}
                  onClick={() => toggle(index)}
                  disabled={disabled}
                >
                  <span className="ch-row-toggle__value">{value}</span>
                  <span className="ch-row-toggle__state" aria-hidden="true">
                    {kept.has(index) ? 'Retirar' : 'Retirada · deshacer'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="ch-compare__panel ch-compare__panel--result" aria-live="polite">
          <p className="ch-compare__title">Después: tu resultado ({kept.size} filas)</p>
          <ul className="ch-headers ch-headers--column" aria-label="Resultado construido">
            <li className="ch-headers__focus">{column}</li>
            {answer.keptIndexes.map((index) => (
              <li key={index}>{candidateValues[index]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
