import 'server-only';
import { headers } from 'next/headers';

/**
 * Límite de intentos de las acciones de cuenta, en este proceso. Las llamadas a Auth salen
 * del servidor, así que el límite de Supabase por IP ve la del servidor: este freno local
 * evita que una dirección agote ese cupo o pruebe contraseñas en serie. Hay dos niveles:
 * - por dirección, amplio: todo un salón puede salir por la misma IP del campus;
 * - por dirección y correo, estricto: frena probar contraseñas contra una cuenta.
 */

const WINDOW_MS = 10 * 60 * 1000;
const LIMITS = {
  'sign-in': { address: 300, subject: 10 },
  'sign-up': { address: 120, subject: 5 },
  reset: { address: 60, subject: 5 },
  resend: { address: 60, subject: 5 },
  oauth: { address: 300, subject: 300 },
} as const;
export type LimitedAction = keyof typeof LIMITS;

const attempts = new Map<string, number[]>();

async function clientAddress(): Promise<string> {
  const list = await headers();
  return list.get('x-forwarded-for')?.split(',')[0]?.trim() || list.get('x-real-ip') || 'local';
}

function register(key: string, limit: number, now: number): boolean {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

/** Registra un intento y devuelve `false` si se superó algún límite. */
export async function allowAttempt(
  action: LimitedAction,
  subject = '',
  now = Date.now(),
): Promise<boolean> {
  const address = await clientAddress();
  if (attempts.size > 10000) attempts.clear();
  const limits = LIMITS[action];
  if (!register(`${action}:${address}`, limits.address, now)) return false;
  return !subject || register(`${action}:${address}:${subject}`, limits.subject, now);
}
