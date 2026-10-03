/**
 * Reloj del examen. El servidor fija `started_at` y `expires_at`; el navegador solo calcula
 * lo que queda con su reloj corregido por la diferencia con el servidor. Recargar, cambiar
 * de pestaña o perder la conexión no cambia el final: siempre es `expires_at`.
 */

/** Diferencia entre el reloj del servidor y el del dispositivo, en milisegundos. */
export function clockOffset(serverNow: string, receivedAt: number): number {
  const server = Date.parse(serverNow);
  return Number.isFinite(server) ? server - receivedAt : 0;
}

export function remainingMs(expiresAt: string, now: number, offset: number): number {
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, end - (now + offset));
}

/** «18:34» o «1:02:05». */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Texto para lectores de pantalla: «18 minutos y 34 segundos». */
export function spokenClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  if (seconds > 0 || minutes === 0)
    parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' y ');
}

const ANNOUNCEMENTS: readonly { readonly at: number; readonly text: string }[] = [
  { at: 10 * 60_000, text: 'Quedan 10 minutos.' },
  { at: 5 * 60_000, text: 'Quedan 5 minutos.' },
  { at: 60_000, text: 'Queda 1 minuto.' },
];

/**
 * Aviso al cruzar 10, 5 y 1 minuto (nunca cada segundo). `previous` y `next` son el tiempo
 * restante antes y después del último tic.
 */
export function timeAnnouncement(previous: number, next: number): string | null {
  for (const { at, text } of ANNOUNCEMENTS) {
    if (previous > at && next <= at) return text;
  }
  return null;
}

/** Nivel visual del reloj: normal, aviso (≤ 5 min) o final (≤ 1 min). */
export function clockTone(ms: number): 'normal' | 'warning' | 'final' {
  if (ms <= 60_000) return 'final';
  if (ms <= 5 * 60_000) return 'warning';
  return 'normal';
}

/**
 * Texto de la región de avisos según el tramo de tiempo. Solo cambia al cruzar 10, 5 y 1
 * minuto (y al terminar), así el lector de pantalla no anuncia cada segundo.
 */
export function thresholdAnnouncement(ms: number): string {
  if (ms <= 0) return 'Se acabó el tiempo. Entregando tu evaluación.';
  for (const { at, text } of [...ANNOUNCEMENTS].reverse()) {
    if (ms <= at) return text;
  }
  return '';
}
