import type { Metadata, Route } from 'next';
import { redirect } from 'next/navigation';
import { ExamRoot } from '@/composition/assessments/exam-root';
import { loadAttempt } from '@/composition/assessments/student-pages';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Evaluación en curso',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadAttempt(id);
  if (data.status === 'no-open-attempt') redirect(`/evaluations/${id}` as Route);
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Evaluación en curso</h1>
        <Alert tone="warning" title="Error temporal: no pudimos abrir tu evaluación.">
          Tu tiempo sigue corriendo en el servidor y lo guardado se conserva. Recarga la página en
          unos segundos.
        </Alert>
      </div>
    );
  }
  if (data.view.status !== 'in_progress') redirect(`/evaluations/${id}?aviso=tiempo` as Route);
  return <ExamRoot view={data.view} />;
}
