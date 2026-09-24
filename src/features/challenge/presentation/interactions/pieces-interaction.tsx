'use client';

import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import {
  EMPLEADOS,
  previewHeaders,
  type AnswerFor,
  type PublicMission,
} from '../../application/challenge-api';

export type PieceMissionType = 'reorder-sql' | 'alias-builder' | 'build-query';

const labels: Record<PieceMissionType, { label: string; palette: string }> = {
  'reorder-sql': { label: 'Tu consulta', palette: 'Piezas para ordenar' },
  'alias-builder': { label: 'Tu consulta', palette: 'Piezas disponibles' },
  'build-query': { label: 'Tu consulta', palette: 'Bloques (algunos sobran)' },
};

/** M02, M06 y M09: construir una consulta ordenando piezas. */
export function PiecesInteraction({
  mission,
  answer,
  onChange,
  disabled,
}: {
  mission: PublicMission<PieceMissionType>;
  answer: AnswerFor<PieceMissionType>;
  onChange: (answer: AnswerFor<PieceMissionType>) => void;
  disabled: boolean;
}) {
  const { pieces } = mission.publicData;
  const type = answer.type;
  const texts = answer.pieceIds.map((id) => pieces.find((piece) => piece.id === id)?.text ?? '');
  const headers = type === 'alias-builder' ? previewHeaders(texts) : null;
  return (
    <div className="ch-stack">
      <SequenceBuilder
        label={labels[type].label}
        paletteLabel={labels[type].palette}
        pieces={pieces}
        value={answer.pieceIds}
        onChange={(pieceIds) => onChange({ type, pieceIds })}
        emptyText="Arrastra o pulsa piezas para formar la consulta"
        disabled={disabled}
      />
      {type === 'alias-builder' && (
        <div className="ch-compare" aria-live="polite">
          <div className="ch-compare__panel">
            <p className="ch-compare__title">Tabla EMPLEADOS (no cambia)</p>
            <ul className="ch-headers" aria-label="Columnas de la tabla">
              {EMPLEADOS.columns.map(({ name }) => (
                <li key={name} className={name === 'SALARIO' ? 'ch-headers__focus' : undefined}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="ch-compare__panel ch-compare__panel--result">
            <p className="ch-compare__title">Encabezados del resultado</p>
            {headers ? (
              <ul className="ch-headers" aria-label="Encabezados del resultado">
                {headers.map((header, index) => (
                  <li key={`${header}-${index}`}>{header}</li>
                ))}
              </ul>
            ) : (
              <p className="ch-muted">Completa una consulta válida para ver sus encabezados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
