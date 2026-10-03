import type { Metadata } from 'next';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { saveAssessmentAction } from '@/composition/assessments/teacher-actions';
import { loadAssessmentEditor } from '@/composition/assessments/teacher-pages';
import { NEW_ASSESSMENT } from '@/composition/assessments/teacher-view-models';
import { AssessmentForm } from '@/features/assessments/presentation/assessment-form';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Nueva evaluación · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const data = await loadAssessmentEditor();
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow="Evaluaciones"
        title="Nueva evaluación"
        lead="Se guarda como borrador. Nadie la ve hasta que la publiques desde su ficha."
      />
      <div className="site-container teacher-page__content">
        {data.status === 'error' ? (
          <Alert tone="warning" title="No pudimos leer el banco de preguntas.">
            Inténtalo de nuevo en unos minutos.
          </Alert>
        ) : (
          <AssessmentForm
            action={saveAssessmentAction}
            values={NEW_ASSESSMENT}
            sections={Object.entries(SECTION_TITLES).map(([id, title]) => ({ id, title }))}
            bank={data.bank}
            topicCounts={data.topicCounts}
            students={data.students}
          />
        )}
      </div>
    </div>
  );
}
