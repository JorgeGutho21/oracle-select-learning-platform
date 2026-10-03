'use server';

import { cookies, headers } from 'next/headers';
import type {
  Failure,
  ParticipantView,
  PresenterView,
} from '@/features/classroom/application/classroom-service';
import { roomCodeSchema } from '@/features/classroom/application/schemas';
import type { RoomCommand } from '@/features/classroom/domain/room';
import type { EvaluationOutcome } from '@/features/challenge/domain/types';
import { classroomRuntime } from './classroom-server';

/**
 * Server Functions de la sala en vivo. Son accesibles por POST directo: el servicio valida
 * cada entrada con Zod. La identidad de profesor y participante viaja en cookies httpOnly
 * con un token aleatorio; la base solo guarda su huella.
 */

const MAX_AGE_SECONDS = 4 * 60 * 60;
const UNCONFIGURED: Failure = {
  ok: false,
  reason: 'unconfigured',
  message: 'La sala en vivo no está configurada en este servidor.',
};

function presenterCookie(code: string): string {
  return `ssl-presenter-${code}`;
}

function participantCookie(code: string): string {
  return `ssl-participant-${code}`;
}

async function isLocalRequest(): Promise<boolean> {
  const host = (await headers()).get('host') ?? '';
  return /^(localhost|127\.|\[::1\])/.test(host);
}

async function setToken(name: string, token: string): Promise<void> {
  (await cookies()).set(name, token, {
    httpOnly: true,
    sameSite: 'lax',
    // En la máquina local (desarrollo y pruebas) se sirve por http.
    secure: !(await isLocalRequest()),
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

async function readToken(name: string): Promise<string | null> {
  return (await cookies()).get(name)?.value ?? null;
}

function normalized(code: unknown): string | null {
  const parsed = roomCodeSchema.safeParse(code);
  return parsed.success ? parsed.data : null;
}

// Límite de claves de profesor incorrectas por dirección, en este proceso: frena la prueba
// de claves sin impedir que el profesor cree varias salas seguidas.
const accessFailures = new Map<string, number[]>();
const ACCESS_WINDOW_MS = 10 * 60 * 1000;
const ACCESS_LIMIT = 10;

async function clientKey(): Promise<string> {
  const list = await headers();
  return list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'local';
}

function recentFailures(client: string, now: number): number[] {
  const recent = (accessFailures.get(client) ?? []).filter((time) => now - time < ACCESS_WINDOW_MS);
  if (recent.length > 0) accessFailures.set(client, recent);
  else accessFailures.delete(client);
  return recent;
}

export async function createRoomAction(
  accessCode: string,
): Promise<{ ok: true; code: string } | Failure> {
  const { service } = classroomRuntime();
  if (!service) return UNCONFIGURED;
  const client = await clientKey();
  const now = Date.now();
  const failures = recentFailures(client, now);
  if (failures.length >= ACCESS_LIMIT) {
    return { ok: false, reason: 'forbidden', message: 'Demasiados intentos. Espera unos minutos.' };
  }
  const created = await service.createRoom(accessCode);
  if (!created.ok) {
    if (created.reason === 'forbidden') accessFailures.set(client, [...failures, now]);
    return created;
  }
  await setToken(presenterCookie(created.room.code), created.presenterToken);
  return { ok: true, code: created.room.code };
}

export async function presenterViewAction(code: string): Promise<PresenterView | Failure> {
  const { service } = classroomRuntime();
  const room = normalized(code);
  if (!service) return UNCONFIGURED;
  if (!room) return { ok: false, reason: 'invalid', message: 'Código de sala no válido.' };
  return service.presenterView(room, await readToken(presenterCookie(room)));
}

export async function presenterCommandAction(
  code: string,
  command: RoomCommand,
): Promise<PresenterView | Failure> {
  const { service } = classroomRuntime();
  const room = normalized(code);
  if (!service) return UNCONFIGURED;
  if (!room || !['start', 'finish', 'cancel'].includes(command)) {
    return { ok: false, reason: 'invalid', message: 'Orden no válida.' };
  }
  return service.command(command, room, await readToken(presenterCookie(room)));
}

export async function checkRoomCodeAction(code: string) {
  const { service } = classroomRuntime();
  if (!service) return UNCONFIGURED;
  return service.checkCode(code);
}

export async function joinRoomAction(
  code: string,
  nickname: string,
): Promise<{ ok: true; code: string } | Failure> {
  const { service } = classroomRuntime();
  if (!service) return UNCONFIGURED;
  const joined = await service.joinRoom(code, nickname);
  if (!joined.ok) return joined;
  await setToken(participantCookie(joined.code), joined.participantToken);
  return { ok: true, code: joined.code };
}

export async function participantViewAction(code: string): Promise<ParticipantView | Failure> {
  const { service } = classroomRuntime();
  const room = normalized(code);
  if (!service) return UNCONFIGURED;
  if (!room) return { ok: false, reason: 'invalid', message: 'Código de sala no válido.' };
  return service.participantView(room, await readToken(participantCookie(room)));
}

export async function leaveRoomAction(code: string): Promise<{ ok: true } | Failure> {
  const { service } = classroomRuntime();
  const room = normalized(code);
  if (!service) return UNCONFIGURED;
  if (!room) return { ok: false, reason: 'invalid', message: 'Código de sala no válido.' };
  const left = await service.leaveRoom(room, await readToken(participantCookie(room)));
  (await cookies()).delete(participantCookie(room));
  return left;
}

export async function liveSubmitAction(code: string, request: unknown): Promise<EvaluationOutcome> {
  const { service } = classroomRuntime();
  if (!service) {
    return { kind: 'technical', reason: 'service-unavailable', message: UNCONFIGURED.message };
  }
  const room = normalized(code) ?? '';
  return service.submitAnswer(room, await readToken(participantCookie(room)), request);
}

export async function liveHintAction(code: string, missionId: string): Promise<string> {
  const { service } = classroomRuntime();
  if (!service) throw new Error(UNCONFIGURED.message);
  const room = normalized(code) ?? '';
  return service.hint(room, await readToken(participantCookie(room)), missionId);
}

export async function liveExplanationAction(code: string, missionId: string): Promise<string> {
  const { service } = classroomRuntime();
  if (!service) throw new Error(UNCONFIGURED.message);
  const room = normalized(code) ?? '';
  return service.explanation(room, await readToken(participantCookie(room)), missionId);
}
