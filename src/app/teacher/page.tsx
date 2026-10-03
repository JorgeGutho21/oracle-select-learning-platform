import type { Metadata } from 'next';
import { loadTeacherDashboard } from '@/composition/accounts/account-pages';
import { AutoRefresh } from '@/composition/accounts/auto-refresh';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { TeacherDashboard } from '@/features/teacher/presentation/teacher-dashboard';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await loadTeacherDashboard(firstParam(params.q));
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Panel docente</h1>
        <Alert tone="warning" title="No pudimos leer los datos del grupo.">
          Inténtalo de nuevo en unos minutos.
        </Alert>
      </div>
    );
  }
  return (
    <TeacherDashboard
      teacherName={data.teacherName}
      roster={data.roster}
      students={data.students}
      query={data.query}
      refresher={<AutoRefresh />}
    />
  );
}
