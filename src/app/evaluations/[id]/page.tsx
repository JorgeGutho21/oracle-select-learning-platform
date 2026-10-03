import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { ConnectionStatus } from '@/composition/assessments/connection-status';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { startAssessmentAction } from '@/composition/assessments/student-actions';
import { loadAttempt, loadStudentAssessment } from '@/composition/assessments/student-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { finishedAttempts } from '@/features/assessments/application/student-assessments';
import { studentNotice } from '@/features/assessments/application/teacher-notices';
import { AssessmentIntro } from '@/features/assessments/presentation/assessment-intro';
import { AttemptResult } from '@/features/assessments/presentation/attempt-result';
import { Alert } from '@/presentation/components/ui';
import { SubmitButton } from '@/composition/assessments/submit-button';

export const metadata: Metadata = {
  title: 'Evaluación',
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
  const data = await loadStudentAssessment(id);
  const notice = studentNotice(firstParam(query.aviso));
  if (!data.assessment) {
    return (
      <div className="site-container feature-page">
        <h1>Evaluación</h1>
        <Alert tone="warning" title="No pudimos leer la evaluación.">
          Inténtalo de nuevo en unos minutos.
        </Alert>
      </div>
    );
  }
  const assessment = data.assessment;
  const latest = finishedAttempts(assessment).at(-1);
  const result = latest ? await loadAttempt(id, latest.id) : null;
  return (
    <div className="assessment-page">
      <header className="ds-page-header ds-page-header--night">
        <div className="site-container ds-page-header__inner">
          <p className="ds-page-header__eyebrow">
            <Link href={'/evaluations' as Route}>Mis evaluaciones</Link> ·{' '}
            {SECTION_TITLES[assessment.sectionKey]}
          </p>
          <h1>{assessment.title}</h1>
        </div>
      </header>
      <div className="site-container assessment-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        <AssessmentIntro
          assessment={assessment}
          sectionTitle={SECTION_TITLES[assessment.sectionKey] ?? assessment.sectionKey}
          now={data.now}
          connection={<ConnectionStatus />}
          startForm={(label) => (
            <form action={startAssessmentAction} className="assessment-start">
              <input type="hidden" name="assessment" value={assessment.id} />
              <SubmitButton label={label} pendingLabel="Preparando tu evaluación…" />
            </form>
          )}
          result={
            result?.status === 'ok' && result.view.status === 'finished' ? (
              <AttemptResult view={result.view} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
