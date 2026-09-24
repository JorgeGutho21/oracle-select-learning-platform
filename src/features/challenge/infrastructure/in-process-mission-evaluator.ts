import type { EvaluationRequest, MissionEvaluator } from '../application/ports';
import { evaluateMissionAnswer, getMissionDefinition } from '../domain/missions/definitions';
import type { EvaluationOutcome, MissionId } from '../domain/types';

/**
 * Corrección con las rúbricas versionadas en el mismo proceso. Debe componerse en el
 * servidor para que rúbricas y explicaciones no se incluyan en recursos del navegador (G15).
 */
export class InProcessMissionEvaluator implements MissionEvaluator {
  async evaluate({
    missionId,
    missionVersion,
    answer,
  }: EvaluationRequest): Promise<EvaluationOutcome> {
    const definition = getMissionDefinition(missionId);
    if (definition.version !== missionVersion) {
      return {
        kind: 'technical',
        reason: 'service-unavailable',
        message:
          'La versión de la misión cambió. Recarga la partida; no se consumió ningún intento.',
      };
    }
    return evaluateMissionAnswer(definition, answer);
  }

  async getHint(missionId: MissionId): Promise<string> {
    return getMissionDefinition(missionId).hint;
  }

  async getExplanation(missionId: MissionId): Promise<string> {
    return getMissionDefinition(missionId).explanation;
  }
}
