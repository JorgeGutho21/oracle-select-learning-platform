import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import {
  duplicateQuestionAction,
  setQuestionStatusAction,
} from '@/composition/assessments/teacher-actions';
import { loadQuestion } from '@/composition/assessments/teacher-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { teacherNotice } from '@/features/assessments/application/teacher-notices';
import { QuestionDetail } from '@/features/assessments/presentation/question-detail';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Pregunta · Panel docente',
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
  const question = await loadQuestion(id);
  const notice = teacherNotice(firstParam(query.aviso));
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={<Link href={'/teacher/questions' as Route}>Banco de preguntas</Link>}
        title={question.externalKey ?? 'Pregunta propia'}
      />
      <div className="site-container teacher-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        <QuestionDetail
          question={question}
          sectionTitle={SECTION_TITLES[question.section] ?? question.section}
          actions={{ setStatus: setQuestionStatusAction, duplicate: duplicateQuestionAction }}
        />
      </div>
    </div>
  );
}
