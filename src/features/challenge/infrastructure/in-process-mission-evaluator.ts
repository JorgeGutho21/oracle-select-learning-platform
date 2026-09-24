import type { OracleQueryExecutor } from '@/application/oracle-executor';
import type { EvaluationRequest, MissionEvaluator } from '../application/ports';
import { evaluateMissionAnswer, getMissionDefinition } from '../domain/missions/definitions';
import type { EvaluationOutcome, MissionId } from '../domain/types';

/**
 * Corrección con las rúbricas versionadas en el mismo proceso. Debe componerse en el
 * servidor para que rúbricas y explicaciones no se incluyan en recursos del navegador (G15).
 * Las misiones que exigen salida real (M10) se ejecutan mediante el puerto Oracle; si el
 * servicio falta, el resultado es técnico y no consume intento. Nunca se simula Oracle.
 */
export class InProcessMissionEvaluator implements MissionEvaluator {
  constructor(private readonly oracle: OracleQueryExecutor) {}

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
    const verdict = evaluateMissionAnswer(definition, answer);
    if (verdict.kind !== 'requires-execution') return verdict;

    const execution = await this.oracle.execute({ statement: verdict.statement });
    switch (execution.status) {
      case 'unavailable':
        return {
          kind: 'technical',
          reason: 'oracle-unavailable',
          message:
            'La consulta cumple la estructura pedida, pero la corrección final la ejecuta en Oracle y el servicio no está disponible. No se consumió ningún intento.',
        };
      case 'oracle-error':
        return {
          kind: 'incorrect',
          feedback: `Oracle devolvió el error ${execution.code}: ${execution.message}`,
        };
      case 'ok': {
        const grade = definition.rubric.gradeExecution;
        if (!grade)
          throw new Error(`La misión ${missionId} no define cómo calificar su ejecución.`);
        return grade({ columns: execution.columns.map(({ name }) => name), rows: execution.rows });
      }
    }
  }

  async getHint(missionId: MissionId): Promise<string> {
    return getMissionDefinition(missionId).hint;
  }

  async getExplanation(missionId: MissionId): Promise<string> {
    return getMissionDefinition(missionId).explanation;
  }
}
