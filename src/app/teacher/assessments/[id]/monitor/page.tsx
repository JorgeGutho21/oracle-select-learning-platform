import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { MonitorRefresher } from '@/composition/assessments/monitor-root';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { loadMonitor } from '@/composition/assessments/teacher-pages';
import { toMonitorRows } from '@/composition/assessments/teacher-view-models';
import { PHASE_LABEL } from '@/features/assessments/application/assessment-api';
import { MonitorTable } from '@/features/assessments/presentation/monitor-view';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Supervisión · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadMonitor(id);
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Supervisión</h1>
        <Alert tone="warning" title="No pudimos leer el estado del examen.">
          Inténtalo de nuevo en unos segundos.
        </Alert>
      </div>
    );
  }
  const open = data.rows.filter(({ entry }) => entry.status === 'in_progress').length;
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={
          <>
            <Link href={`/teacher/assessments/${id}` as Route}>{data.record.title}</Link> ·{' '}
            {SECTION_TITLES[data.record.sectionKey]}
          </>
        }
        title="Supervisión"
        lead={`${PHASE_LABEL[data.phase]} · ${open} en curso · ${data.rows.length - open} entregados · ${data.notStarted.length} sin iniciar.`}
      />
      <div className="site-container teacher-page__content">
        <MonitorRefresher realtime={data.realtime} />
        <Alert tone="info" title="Los eventos son señales del navegador, no pruebas de fraude.">
          Una pérdida de foco puede ser una notificación o un cambio de ventana. Interprétalos con
          el contexto de cada estudiante.
        </Alert>
        <section className="teacher-block" aria-labelledby="monitor-title">
          <h2 id="monitor-title">Intentos</h2>
          <MonitorTable rows={toMonitorRows(data.rows)} serverNow={data.serverNow} />
        </section>
        <section className="teacher-block" aria-labelledby="not-started-title">
          <h2 id="not-started-title">Sin iniciar ({data.notStarted.length})</h2>
          {data.notStarted.length === 0 ? (
            <p className="assessment-empty">Todos los estudiantes de la audiencia comenzaron.</p>
          ) : (
            <ul className="monitor-pending">
              {data.notStarted.map((student) => (
                <li key={student.id}>
                  {student.firstName} {student.lastName}{' '}
                  <span className="monitor-table__email">{student.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
