import { ASSESSMENT_TIME_ZONE } from '../application/assessment-api';

/** Fechas y duraciones de las evaluaciones, siempre en hora de Colombia. */

const dateTime = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: ASSESSMENT_TIME_ZONE,
});

const time = new Intl.DateTimeFormat('es-CO', {
  timeStyle: 'short',
  timeZone: ASSESSMENT_TIME_ZONE,
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const value = Date.parse(iso);
  return Number.isFinite(value) ? dateTime.format(value) : '—';
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const value = Date.parse(iso);
  return Number.isFinite(value) ? time.format(value) : '—';
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} min ${rest} s` : `${rest} s`;
}

export function minutesLabel(minutes: number): string {
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
}

export function questionsLabel(count: number): string {
  return `${count} ${count === 1 ? 'pregunta' : 'preguntas'}`;
}

/** «Abre el …», «Cierra el …» o «Sin fecha de cierre». */
export function windowLabel(opensAt: string | null, closesAt: string | null, now: number): string {
  if (opensAt && Date.parse(opensAt) > now) return `Abre el ${formatDateTime(opensAt)}`;
  if (closesAt)
    return `${Date.parse(closesAt) > now ? 'Cierra' : 'Cerró'} el ${formatDateTime(closesAt)}`;
  return 'Sin fecha de cierre';
}
