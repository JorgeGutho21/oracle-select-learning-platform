import { z } from 'zod';
import { INTERACTION_TYPES, MISSION_IDS } from '@/features/challenge/domain/types';
import { NICKNAME_MAX } from '../domain/nickname';
import { normalizeRoomCode } from '../domain/room-code';

/**
 * Validación de toda entrada que llega por Server Functions: son accesibles por POST
 * directo, así que nada se da por válido solo porque la interfaz lo envía bien.
 */

export const roomCodeSchema = z
  .string()
  .max(16)
  .transform((value, context) => {
    const code = normalizeRoomCode(value);
    if (!code) {
      context.addIssue({ code: 'custom', message: 'El código tiene seis letras o números.' });
      return z.NEVER;
    }
    return code;
  });

// El saneado fino del alias lo hace el dominio; aquí solo se acota el tamaño recibido.
export const nicknameInputSchema = z.string().max(NICKNAME_MAX * 4);

export const accessCodeSchema = z.string().min(1).max(200);

const MAX_ANSWER_CHARS = 4000;

export const liveAnswerSchema = z.object({
  missionId: z.enum(MISSION_IDS),
  missionVersion: z.number().int().min(1).max(1000),
  requestId: z.uuid(),
  answer: z
    .looseObject({ type: z.enum(INTERACTION_TYPES) })
    .refine((answer) => JSON.stringify(answer).length <= MAX_ANSWER_CHARS, {
      message: 'La respuesta es demasiado grande.',
    }),
});

export type LiveAnswerInput = z.infer<typeof liveAnswerSchema>;

export const missionIdSchema = z.enum(MISSION_IDS);
