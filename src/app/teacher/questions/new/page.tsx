import type { Metadata } from 'next';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { saveQuestionAction } from '@/composition/assessments/teacher-actions';
import { loadQuestionEditor } from '@/composition/assessments/teacher-pages';
import { NEW_QUESTION } from '@/composition/assessments/teacher-view-models';
import { QuestionForm } from '@/features/assessments/presentation/question-form';
import { PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Nueva pregunta · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page() {
  await loadQuestionEditor();
  return (
    <div className="teacher-page">
      <PageHeader tone="night" eyebrow="Banco de preguntas" title="Nueva pregunta" />
      <div className="site-container teacher-page__content">
        <QuestionForm
          action={saveQuestionAction}
          values={NEW_QUESTION}
          sections={Object.entries(SECTION_TITLES).map(([id, title]) => ({ id, title }))}
        />
      </div>
    </div>
  );
}
