import 'server-only';
import { z } from 'zod';
import {
  attemptView,
  logAttemptEvents,
  saveAnswers,
  submitAttempt,
} from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { CLIENT_EVENT_TYPES } from '@/features/assessments/domain/assessment';
import {
  MAX_ANSWERS_PER_BATCH,
  MAX_EVENTS_PER_BATCH,
} from '@/features/assessments/application/exam-wire';
import { isSameOrigin, json, readJson } from '../accounts/http';
import { currentSession } from '../accounts/auth-server';

/**
 * API del examen. Cada petición usa la sesión de la persona (cookie httpOnly) y una función
 * de la base que comprueba que el intento es suyo, que sigue abierto y que no venció. Aquí
 * solo se acota la forma de la petición; la clave de respuestas nunca pasa por aquí.
 */

const attemptId = z.string().uuid();
const optionId = z.string().uuid();

const answerSchema = z
  .union([
    z.object({ choice: optionId }).strict(),
    z.object({ choices: z.array(optionId).max(8) }).strict(),
    z.object({ order: z.array(optionId).max(8) }).strict(),
  ])
  .nullable();

const saveSchema = z.object({
  position: z.number().int().min(1).max(100),
  answers: z
    .array(
      z.object({
        position: z.number().int().min(1).max(100),
        answer: answerSchema,
        flagged: z.boolean(),
        revision: z.number().int().min(1).max(1_000_000_000),
      }),
    )
    .max(MAX_ANSWERS_PER_BATCH),
});

const eventsSchema = z.object({
  position: z.number().int().min(1).max(100),
  events: z
    .array(
      z.object({
        type: z.enum(CLIENT_EVENT_TYPES),
        ago_ms: z.number().int().min(0).max(600_000),
        position: z.number().int().min(1).max(100).optional(),
        duration_ms: z.number().int().min(0).max(86_400_000).optional(),
      }),
    )
    .max(MAX_EVENTS_PER_BATCH),
});

const submitSchema = z.object({ reason: z.enum(['student', 'timer']) });

async function session() {
  const current = await currentSession();
  if (current.status === 'authenticated') return current.client;
  if (current.status === 'guest') return 'unauthenticated' as const;
  return 'unavailable' as const;
}

function denied(reason: 'unauthenticated' | 'unavailable'): Response {
  return reason === 'unauthenticated'
    ? json({ status: 'unauthenticated' }, 401)
    : json({ status: 'unavailable' }, 503);
}

export async function attemptViewResponse(id: string): Promise<Response> {
  if (!attemptId.safeParse(id).success) return json({ status: 'not-found' }, 404);
  const client = await session();
  if (typeof client === 'string') return denied(client);
  const result = await attemptView(client, id);
  if (!result.ok) return json({ status: 'unavailable' }, 503);
  if (result.data.status === 'not-found') return json(result.data, 404);
  return json(result.data);
}

async function guardedWrite<T>(
  request: Request,
  id: string,
  schema: z.ZodType<T>,
  maxBytes: number,
  run: (
    client: Exclude<Awaited<ReturnType<typeof session>>, string>,
    body: T,
  ) => Promise<{
    ok: boolean;
    data?: Record<string, unknown>;
  }>,
): Promise<Response> {
  if (!isSameOrigin(request)) return json({ status: 'forbidden' }, 403);
  if (!attemptId.safeParse(id).success) return json({ status: 'not-found' }, 404);
  const parsed = schema.safeParse(await readJson(request, maxBytes));
  if (!parsed.success) return json({ status: 'invalid' }, 400);
  const client = await session();
  if (typeof client === 'string') return denied(client);
  const result = await run(client, parsed.data);
  if (!result.ok || !result.data) return json({ status: 'unavailable' }, 503);
  return json(result.data);
}

export function saveAnswersResponse(request: Request, id: string): Promise<Response> {
  return guardedWrite(request, id, saveSchema, 64 * 1024, (client, body) =>
    saveAnswers(client, id, body.position, body.answers),
  );
}

export function attemptEventsResponse(request: Request, id: string): Promise<Response> {
  return guardedWrite(request, id, eventsSchema, 16 * 1024, (client, body) =>
    logAttemptEvents(client, id, body.position, body.events),
  );
}

export function submitAttemptResponse(request: Request, id: string): Promise<Response> {
  return guardedWrite(request, id, submitSchema, 1024, (client, body) =>
    submitAttempt(client, id, body.reason),
  );
}
