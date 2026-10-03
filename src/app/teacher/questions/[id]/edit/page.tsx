import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { saveQuestionAction } from '@/composition/assessments/teacher-actions';
import { loadQuestionEditor } from '@/composition/assessments/teacher-pages';
import { toQuestionFormValues } from '@/composition/assessments/teacher-view-models';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { teacherNotice } from '@/features/assessments/application/teacher-notices';
import { QuestionForm } from '@/features/assessments/presentation/question-form';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Editar pregunta · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const question = await loadQuestionEditor(id);
  if (!question || question.origin !== 'teacher') redirect(`/teacher/questions/${id}` as Route);
  const notice = teacherNotice(firstParam(query.aviso));
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={<Link href={`/teacher/questions/${id}` as Route}>Volver a la pregunta</Link>}
        title="Editar pregunta"
        lead="Si la pregunta ya se usó en una evaluación publicada, guardar crea una versión nueva; la evaluación conserva la anterior."
      />
      <div className="site-container teacher-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        <QuestionForm
          action={saveQuestionAction}
          values={toQuestionFormValues(question)}
          sections={Object.entries(SECTION_TITLES).map(([key, title]) => ({ id: key, title }))}
        />
      </div>
    </div>
  );
}
