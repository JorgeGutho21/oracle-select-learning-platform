'use server';

import type { EvaluationRequest } from '@/features/challenge/application/ports';
import {
  INTERACTION_TYPES,
  MISSION_IDS,
  type EvaluationOutcome,
  type MissionId,
} from '@/features/challenge/domain/types';
import { InProcessMissionEvaluator } from '@/features/challenge/infrastructure/in-process-mission-evaluator';

/**
 * Corrección de la práctica individual en el servidor: las rúbricas, pistas y
 * explicaciones no se incluyen en los recursos del navegador (G15). Las Server Functions
 * son accesibles por POST directo, así que cada entrada se valida aquí.
 */

const evaluator = new InProcessMissionEvaluator();
const MAX_ANSWER_BYTES = 4000;

const INVALID: EvaluationOutcome = {
  kind: 'invalid-input',
  message: 'La respuesta no tiene un formato válido.',
};

function isMissionId(value: unknown): value is MissionId {
  return typeof value === 'string' && (MISSION_IDS as readonly string[]).includes(value);
}

function isAnswerShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const type = (value as { type?: unknown }).type;
  if (typeof type !== 'string' || !(INTERACTION_TYPES as readonly string[]).includes(type)) {
    return false;
  }
  return JSON.stringify(value).length <= MAX_ANSWER_BYTES;
}

export async function evaluatePracticeAnswer(
  request: EvaluationRequest,
): Promise<EvaluationOutcome> {
  if (
    typeof request !== 'object' ||
    request === null ||
    !isMissionId(request.missionId) ||
    !Number.isInteger(request.missionVersion) ||
    !isAnswerShape(request.answer)
  ) {
    return INVALID;
  }
  try {
    return await evaluator.evaluate(request);
  } catch {
    // Una respuesta con campos malformados no llega a ser un intento académico.
    return INVALID;
  }
}

export async function getPracticeHint(missionId: MissionId): Promise<string> {
  if (!isMissionId(missionId)) throw new Error('Misión desconocida.');
  return evaluator.getHint(missionId);
}

export async function getPracticeExplanation(missionId: MissionId): Promise<string> {
  if (!isMissionId(missionId)) throw new Error('Misión desconocida.');
  return evaluator.getExplanation(missionId);
}
