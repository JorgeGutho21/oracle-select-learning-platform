'use client';

import { RecordTable } from '@/presentation/components/data/record-table';
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
    <RecordTable
      className="monitor-table"
      caption="Intentos en la evaluación"
      columns={[
        'Estudiante',
        'Estado',
        'Pregunta',
        'Progreso',
        'Tiempo',
        'Conexión',
        'Último evento',
        'Eventos relevantes',
      ]}
      rows={rows.map((row) => {
        const open = row.status === 'in_progress';
        const remaining = Date.parse(row.expiresAt) - current;
        const online = open && current - Date.parse(row.lastSeenAt) <= EXAM_ONLINE_WINDOW_MS;
        return {
          key: row.attemptId,
          className: open ? 'is-open' : 'is-done',
          cells: [
            <span key="identity">
              <span className="monitor-table__name">{row.name}</span>
              <span className="monitor-table__email">{row.email}</span>
            </span>,
            PARTICIPANT_LABEL[row.status],
            open ? row.currentPosition + '/' + row.questionTotal : '—',
            row.answered +
              '/' +
              row.questionTotal +
              ' respondidas' +
              (row.flagged > 0 ? ' · ' + row.flagged + ' marcadas' : ''),
            open
              ? hydrated
                ? clock(remaining) + ' restantes'
                : '—'
              : 'Entregó ' + formatTime(row.submittedAt),
            open ? (
              <span
                key="connection"
                className={'monitor-dot monitor-dot--' + (online ? 'on' : 'off')}
              >
                {online ? 'Conectado' : 'Sin señal desde ' + formatTime(row.lastSeenAt)}
              </span>
            ) : (
              '—'
            ),
            row.lastEvent
              ? (EVENT_LABEL[row.lastEvent.type as EventType] ?? row.lastEvent.type) +
                ' · ' +
                formatTime(row.lastEvent.at)
              : '—',
            <span key="events">
              <span className="monitor-table__count">{relevantEventCount(row.counts)}</span>
              <span className="monitor-table__detail">{eventSummary(row.counts)}</span>
            </span>,
          ],
        };
      })}
    />
  );
}
