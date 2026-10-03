'use client';

import { ChangeSummary } from '@/presentation/components/data/change-summary';
import { SequenceBuilder } from '@/presentation/components/interaction/sequence-builder';
import {
  EMPLEADOS,
  sampleResult,
  type AnswerFor,
  type PublicMission,
} from '../../application/challenge-api';
import { MISSION_CONTEXT } from '../mission-context';
import { SampleTable, sizeOf } from './sample-table';

export type PieceMissionType = 'reorder-sql' | 'alias-builder' | 'build-query';

const labels: Record<PieceMissionType, { label: string; palette: string }> = {
  'reorder-sql': { label: 'Tu consulta', palette: 'Piezas (algunas sobran)' },
  'alias-builder': { label: 'Tu consulta', palette: 'Piezas (algunas sobran)' },
  'build-query': { label: 'Tu consulta', palette: 'Bloques (varios sobran)' },
};

/** Consulta de M06 sin alias: el «antes» con el que se compara el encabezado. */
const WITHOUT_ALIAS = 'SELECT nombre, salario * 12 FROM empleados';

/**
 * M02, M06 y M09: construir una consulta con piezas. M02 muestra en vivo qué devuelve la
 * consulta sobre la muestra; M06 compara el encabezado sin alias y con alias (mismos
 * valores); M09 no adelanta el resultado: se ve al cerrar la misión.
 */
export function PiecesInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
}: {
  mission: PublicMission<PieceMissionType>;
  answer: AnswerFor<PieceMissionType>;
  onChange: (answer: AnswerFor<PieceMissionType>) => void;
  disabled: boolean;
  reveal?: boolean;
}) {
  const { pieces } = mission.publicData;
  const type = answer.type;
  const sample = MISSION_CONTEXT[mission.id].sample;
  const sql = answer.pieceIds
    .map((id) => pieces.find((piece) => piece.id === id)?.text ?? '')
    .join(' ');
  const showLive = type !== 'build-query' || reveal;
  const result =
    sample && answer.pieceIds.length > 0 && showLive ? sampleResult(sql, sample.rowIds) : null;
  const before =
    type === 'alias-builder' && sample ? sampleResult(WITHOUT_ALIAS, sample.rowIds) : null;

  return (
    <div className="ch-stack">
      <SequenceBuilder
        label={labels[type].label}
        paletteLabel={labels[type].palette}
        pieces={pieces}
        value={answer.pieceIds}
        onChange={(pieceIds) => onChange({ type, pieceIds })}
        emptyText="Arrastra o toca piezas para formar la consulta"
        disabled={disabled}
      />
      {type === 'alias-builder' && before ? (
        <div className="ch-stack" aria-live="polite">
          <div className="ch-compare ch-compare--flow ch-compare--tables">
            <div className="ch-compare__panel">
              <SampleTable
                caption="Resultado sin alias sobre la muestra"
                label="Antes · sin AS"
                result={before}
              />
            </div>
            <p className="ch-compare__arrow" aria-hidden="true">
              <span>AS</span>
            </p>
            <div className="ch-compare__panel ch-compare__panel--result">
              {result ? (
                <SampleTable
                  caption="Resultado de tu consulta sobre la muestra"
                  label="Después · tu consulta"
                  result={result}
                  highlightedColumns={result.columns.slice(1)}
                />
              ) : (
                <p className="ch-muted">
                  Completa una consulta válida para ver su encabezado junto a los mismos valores.
                </p>
              )}
            </div>
          </div>
          <p className="ch-rule">
            <strong>Compara:</strong> los valores son los mismos; solo cambia el encabezado del
            resultado. La tabla EMPLEADOS sigue teniendo su columna SALARIO.
          </p>
        </div>
      ) : (
        showLive &&
        sample && (
          <div className="ch-result" aria-live="polite">
            {result ? (
              <>
                <ChangeSummary
                  rows={[sample.rowIds.length, result.rows.length]}
                  columns={[EMPLEADOS.columns.length, result.columns.length]}
                />
                <SampleTable
                  caption="Resultado de tu consulta sobre la muestra de trabajo"
                  label={
                    reveal && type === 'build-query'
                      ? 'Tu consulta sobre la muestra'
                      : 'Resultado de tu consulta'
                  }
                  result={result}
                  summary={`${sizeOf(result.rows.length, result.columns.length)} · sobre la muestra`}
                />
              </>
            ) : (
              <p className="ch-calc">
                Cuando las piezas formen una consulta válida, aquí verás qué devuelve sobre la
                muestra.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
