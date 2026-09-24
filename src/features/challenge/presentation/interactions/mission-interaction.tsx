'use client';

import type {
  AnswerFor,
  AnyPublicMission,
  InteractionType,
  MissionAnswer,
  PublicMission,
} from '../../application/challenge-api';
import { ColumnsInteraction } from './columns-interaction';
import { DistinctInteraction } from './distinct-interaction';
import { ExpressionInteraction } from './expression-interaction';
import { HotspotInteraction } from './hotspot-interaction';
import { PiecesInteraction, type PieceMissionType } from './pieces-interaction';
import { PredictInteraction } from './predict-interaction';
import { WriteQueryInteraction } from './write-query-interaction';

/** Respuesta vacía inicial de cada tipo de interacción. */
export function emptyAnswer(mission: AnyPublicMission): MissionAnswer {
  const data = mission.publicData;
  switch (data.type) {
    case 'drag-column':
      return { type: data.type, columns: [] };
    case 'reorder-sql':
    case 'alias-builder':
    case 'build-query':
      return { type: data.type, pieceIds: [] };
    case 'predict-result':
      return { type: data.type, headers: [], sourceRowIds: [], rowCount: null };
    case 'expression-builder':
      return {
        type: data.type,
        pieceIds: [],
        predictions: data.predictionEmployeeIds.map((employeeId) => ({ employeeId, value: null })),
      };
    case 'distinct-result':
      return { type: data.type, keptIndexes: data.candidateValues.map((_, index) => index) };
    case 'hotspot-error':
      return { type: data.type, gapIndex: null };
    case 'write-query':
      return { type: data.type, sql: '' };
  }
}

interface Props {
  mission: AnyPublicMission;
  answer: MissionAnswer;
  onChange: (answer: MissionAnswer) => void;
  disabled: boolean;
}

function as<T extends InteractionType>(mission: AnyPublicMission, answer: MissionAnswer) {
  return { mission: mission as PublicMission<T>, answer: answer as AnswerFor<T> };
}

/** Selecciona la interacción de la misión; todas comparten el mismo marco y motor. */
export function MissionInteraction({ mission, answer, onChange, disabled }: Props) {
  if (answer.type !== mission.interactionType) return null;
  const common = { onChange: onChange as never, disabled };
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
