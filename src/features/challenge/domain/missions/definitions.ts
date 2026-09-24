import type {
  AnyMissionDefinition,
  MissionAnswer,
  MissionDefinition,
  MissionId,
  RubricVerdict,
} from '../types';
import { PUBLIC_MISSIONS } from './public-catalog';
import { MISSION_PRIVATE } from './rubrics';

/** PRIVADO. Definiciones completas para el servicio de corrección. */

function compose(): readonly AnyMissionDefinition[] {
  return PUBLIC_MISSIONS.map((mission) => {
    const hidden = MISSION_PRIVATE[mission.id];
    if (hidden.interactionType !== mission.interactionType) {
      throw new Error(`La rúbrica de ${mission.id} no corresponde a su tipo de interacción.`);
    }
    return {
      ...mission,
      hint: hidden.hint,
      explanation: hidden.explanation,
      rubric: hidden.rubric,
    } as AnyMissionDefinition;
  });
}

export const MISSION_DEFINITIONS: readonly AnyMissionDefinition[] = Object.freeze(compose());

export function getMissionDefinition(id: MissionId): AnyMissionDefinition {
  const definition = MISSION_DEFINITIONS.find((mission) => mission.id === id);
  if (!definition) throw new Error(`Misión desconocida: ${id}`);
  return definition;
}

/** Corrige una respuesta con la rúbrica versionada; un tipo de respuesta ajeno no consume intento. */
export function evaluateMissionAnswer(
  definition: AnyMissionDefinition,
  answer: MissionAnswer,
): RubricVerdict {
  if (answer.type !== definition.interactionType) {
    return { kind: 'invalid-input', message: 'La respuesta no corresponde a esta misión.' };
  }
  return (definition as MissionDefinition<typeof answer.type>).rubric.validate(answer as never);
}
