import type { Metadata } from 'next';
import { loadDashboard } from '@/composition/accounts/account-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { LearnerDashboardRoot } from '@/composition/progress/learner-dashboard-root';
import { PendingAssessments } from '@/features/assessments/presentation/student-assessments';
import { accountNotice } from '@/features/accounts/application/auth-forms';
import { SECTION_LIST } from '@/features/sections/application/sections-api';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Mi progreso',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const [data, params] = await Promise.all([loadDashboard(), searchParams]);
  const notice = accountNotice(firstParam(params.aviso));
  return (
    <LearnerDashboardRoot
      userId={data.userId}
      firstName={data.firstName}
      initialRecords={data.records}
      sections={SECTION_LIST}
      now={data.now}
      notice={
        <>
          {notice && <Alert tone={notice.tone} title={notice.text} live />}
          {!data.cloudAvailable && (
            <Alert tone="warning" title="No pudimos leer tu avance de la nube.">
              Se muestra el de este dispositivo y se sincronizará cuando el servicio responda.
            </Alert>
          )}
          {data.isStudent && (
            <section aria-labelledby="dashboard-assessments-title" className="dashboard__block">
              <h2 id="dashboard-assessments-title">Evaluaciones pendientes</h2>
              <PendingAssessments
                assessments={data.assessments}
                sectionTitles={SECTION_TITLES}
                now={data.now}
              />
            </section>
          )}
        </>
      }
    />
  );
}
