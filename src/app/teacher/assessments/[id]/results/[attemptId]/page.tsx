import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { loadAttemptReview } from '@/composition/assessments/teacher-pages';
import {
  AttemptAnswers,
  AttemptSummary,
  EventTimeline,
} from '@/features/assessments/presentation/attempt-review';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Intento · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const data = await loadAttemptReview(id, attemptId);
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Intento</h1>
        <Alert tone="warning" title="No pudimos leer el intento.">
          Inténtalo de nuevo en unos minutos.
        </Alert>
      </div>
    );
  }
  const name = data.student
    ? `${data.student.firstName} ${data.student.lastName}`.trim()
    : 'Estudiante';
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={
          <>
            <Link href={`/teacher/assessments/${id}/results` as Route}>
              Resultados de {data.record.title}
            </Link>
          </>
        }
        title={name}
        lead={data.student?.email}
      />
      <div className="site-container teacher-page__content">
        <section className="teacher-block" aria-labelledby="attempt-summary-title">
          <h2 id="attempt-summary-title">Resumen del intento</h2>
          <AttemptSummary attempt={data.attempt} />
        </section>
        <section className="teacher-block" aria-labelledby="attempt-answers-title">
          <h2 id="attempt-answers-title">Respuestas</h2>
          <AttemptAnswers items={data.items} />
        </section>
        <section className="teacher-block" aria-labelledby="attempt-events-title">
          <h2 id="attempt-events-title">Eventos del navegador</h2>
          <EventTimeline events={data.events} />
        </section>
      </div>
    </div>
  );
}
