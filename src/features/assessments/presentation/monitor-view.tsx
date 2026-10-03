'use client';

import { useHydrated } from '@/presentation/hooks/use-hydrated';
import { useServerClock } from '@/presentation/hooks/use-server-clock';
import {
  EVENT_LABEL,
  EXAM_ONLINE_WINDOW_MS,
  PARTICIPANT_LABEL,
  relevantEventCount,
  type EventType,
} from '../application/assessment-api';
import { formatTime } from './format';

/**
 * Monitor del profesor. Hechos, no juicios: «2 pérdidas de foco», nunca «hizo trampa».
 * Colores neutros; el reloj de cada fila se calcula con la hora del servidor.
 */

export interface MonitorRow {
  readonly attemptId: string;
  readonly name: string;
  readonly email: string;
  readonly status: 'in_progress' | 'submitted' | 'auto_submitted';
  readonly currentPosition: number;
  readonly questionTotal: number;
  readonly answered: number;
  readonly flagged: number;
  readonly expiresAt: string;
  readonly submittedAt: string | null;
  readonly lastSeenAt: string;
  readonly lastEvent: { readonly type: string; readonly at: string } | null;
  readonly counts: Readonly<Record<string, number>>;
}

const PLURAL: Partial<Record<EventType, readonly [string, string]>> = {
  focus_lost: ['pérdida de foco', 'pérdidas de foco'],
  visibility_hidden: ['pestaña oculta', 'pestañas ocultas'],
  fullscreen_exited: ['salida de pantalla completa', 'salidas de pantalla completa'],
  copy_attempt: ['intento de copiar', 'intentos de copiar'],
  paste_attempt: ['intento de pegar', 'intentos de pegar'],
  context_menu: ['menú contextual', 'menús contextuales'],
  offline: ['desconexión', 'desconexiones'],
  page_exit: ['salida de la página', 'salidas de la página'],
  reloaded: ['recarga', 'recargas'],
  entered: ['reingreso', 'reingresos'],
};

export function eventSummary(counts: Readonly<Record<string, number>>): string {
  const parts = Object.entries(PLURAL).flatMap(([type, [one, many]]) => {
    const value = counts[type] ?? 0;
    return value > 0 ? [`${value} ${value === 1 ? one : many}`] : [];
  });
  return parts.length > 0 ? parts.join(' · ') : 'Sin eventos relevantes';
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

export function MonitorTable({
  rows,
  serverNow,
}: {
  readonly rows: readonly MonitorRow[];
  readonly serverNow: string;
}) {
  // Hora del servidor (corrige el reloj del navegador del profesor).
  const current = useServerClock(serverNow);
  const hydrated = useHydrated();
  if (rows.length === 0) {
    return <p className="assessment-empty">Nadie ha comenzado todavía.</p>;
  }
  return (
    <div
      className="monitor-table"
      role="region"
      aria-label="Intentos en la evaluación"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Estudiante</th>
            <th scope="col">Estado</th>
            <th scope="col">Pregunta</th>
            <th scope="col">Progreso</th>
            <th scope="col">Tiempo</th>
            <th scope="col">Conexión</th>
            <th scope="col">Último evento</th>
            <th scope="col">Eventos relevantes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const open = row.status === 'in_progress';
            const remaining = Date.parse(row.expiresAt) - current;
            const online = open && current - Date.parse(row.lastSeenAt) <= EXAM_ONLINE_WINDOW_MS;
            const relevant = relevantEventCount(row.counts);
            return (
              <tr key={row.attemptId} className={open ? 'is-open' : 'is-done'}>
                <th scope="row" data-label="Estudiante">
                  <span className="monitor-table__name">{row.name}</span>
                  <span className="monitor-table__email">{row.email}</span>
                </th>
                <td data-label="Estado">{PARTICIPANT_LABEL[row.status]}</td>
                <td data-label="Pregunta">
                  {open ? `${row.currentPosition}/${row.questionTotal}` : '—'}
                </td>
                <td data-label="Progreso">
                  {row.answered}/{row.questionTotal} respondidas
                  {row.flagged > 0 ? ` · ${row.flagged} marcadas` : ''}
                </td>
                <td data-label="Tiempo">
                  {open
                    ? hydrated
                      ? `${clock(remaining)} restantes`
                      : '—'
                    : `Entregó ${formatTime(row.submittedAt)}`}
                </td>
                <td data-label="Conexión">
                  {open ? (
                    <span className={`monitor-dot monitor-dot--${online ? 'on' : 'off'}`}>
                      {online ? 'Conectado' : `Sin señal desde ${formatTime(row.lastSeenAt)}`}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td data-label="Último evento">
                  {row.lastEvent
                    ? `${EVENT_LABEL[row.lastEvent.type as EventType] ?? row.lastEvent.type} · ${formatTime(row.lastEvent.at)}`
                    : '—'}
                </td>
                <td data-label="Eventos relevantes">
                  <span className="monitor-table__count">{relevant}</span>
                  <span className="monitor-table__detail">{eventSummary(row.counts)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
