'use client';

import {
  errorVariantFor,
  variantSql,
  type AnswerFor,
  type AnyPublicMission,
  type InteractionType,
  type MissionAnswer,
  type PublicMission,
} from '../../application/challenge-api';
import { ColumnsInteraction } from './columns-interaction';
import { DistinctInteraction } from './distinct-interaction';
import { ExpressionInteraction } from './expression-interaction';
import { HotspotInteraction } from './hotspot-interaction';
import { PiecesInteraction, type PieceMissionType } from './pieces-interaction';
import { PredictInteraction } from './predict-interaction';
import { WriteQueryInteraction } from './write-query-interaction';

/**
 * Respuesta vacía inicial de cada tipo de interacción. `seed` (la sesión de la partida)
 * elige la variante de M08, estable al recargar.
 */
export function emptyAnswer(mission: AnyPublicMission, seed = ''): MissionAnswer {
  const data = mission.publicData;
  switch (data.type) {
    case 'drag-column':
      return { type: data.type, columns: [] };
    case 'reorder-sql':
    case 'alias-builder':
    case 'build-query':
      return { type: data.type, pieceIds: [] };
    case 'predict-result':
      return {
        type: data.type,
        headers: [],
        sourceRowIds: [],
        rowCount: null,
        ...(data.asks.columnCount ? { columnCount: null } : {}),
        ...(data.asks.claims
          ? { claims: (data.claims ?? []).map(({ id }) => ({ id, value: null })) }
          : {}),
        ...(data.asks.condition ? { conditionPieceIds: [] } : {}),
      };
    case 'expression-builder':
      return {
        type: data.type,
        pieceIds: [],
        predictions: data.predictionEmployeeIds.flatMap((employeeId) =>
          data.comparisons
            ? data.comparisons.map((expression) => ({ employeeId, expression, value: null }))
            : [{ employeeId, value: null }],
        ),
      };
    case 'distinct-result':
      return { type: data.type, values: [], pairCount: null };
    case 'hotspot-error': {
      const variant = errorVariantFor(data, seed);
      return {
        type: data.type,
        variantId: variant.id,
        kind: null,
        tokenIndex: null,
        sql: variantSql(variant),
      };
    }
    case 'write-query':
      return { type: data.type, sql: '' };
  }
}

interface Props {
  mission: AnyPublicMission;
  answer: MissionAnswer;
  onChange: (answer: MissionAnswer) => void;
  disabled: boolean;
  reveal?: boolean;
  solved?: boolean;
}

function as<T extends InteractionType>(mission: AnyPublicMission, answer: MissionAnswer) {
  return { mission: mission as PublicMission<T>, answer: answer as AnswerFor<T> };
}

/** Selecciona la interacción de la misión; todas comparten el mismo marco y motor. */
export function MissionInteraction({
  mission,
  answer,
  onChange,
  disabled,
  reveal = false,
  solved = false,
}: Props) {
  if (answer.type !== mission.interactionType) return null;
  const common = { onChange: onChange as never, disabled, reveal, solved };
  switch (mission.interactionType) {
    case 'drag-column':
      return <ColumnsInteraction {...as<'drag-column'>(mission, answer)} {...common} />;
    case 'reorder-sql':
    case 'alias-builder':
    case 'build-query':
      return <PiecesInteraction {...as<PieceMissionType>(mission, answer)} {...common} />;
    case 'predict-result':
      return <PredictInteraction {...as<'predict-result'>(mission, answer)} {...common} />;
    case 'expression-builder':
      return <ExpressionInteraction {...as<'expression-builder'>(mission, answer)} {...common} />;
    case 'distinct-result':
      return <DistinctInteraction {...as<'distinct-result'>(mission, answer)} {...common} />;
    case 'hotspot-error':
      return <HotspotInteraction {...as<'hotspot-error'>(mission, answer)} {...common} />;
    case 'write-query':
      return <WriteQueryInteraction {...as<'write-query'>(mission, answer)} {...common} />;
  }
}
