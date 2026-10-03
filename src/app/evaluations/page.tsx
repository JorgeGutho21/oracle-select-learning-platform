import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { loadStudentAssessments } from '@/composition/assessments/student-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { isPending } from '@/features/assessments/application/student-assessments';
import { StudentAssessmentList } from '@/features/assessments/presentation/student-assessments';
import { SECTION_LIST } from '@/features/sections/application/sections-api';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Mis evaluaciones',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const [data, params] = await Promise.all([loadStudentAssessments(), searchParams]);
  const requested = firstParam(params.seccion);
  const section = SECTION_LIST.find((entry) => entry.id === requested) ?? null;
  const all = (data.assessments ?? []).filter((item) => !section || item.sectionKey === section.id);
  const pending = all.filter(isPending);
  const past = all.filter((item) => !isPending(item));
  return (
    <div className="assessment-page">
      <header className="ds-page-header ds-page-header--night">
        <div className="site-container ds-page-header__inner">
          <p className="ds-page-header__eyebrow">Evaluación</p>
          <h1>Mis evaluaciones</h1>
          <p className="ds-page-header__lead">
            Evaluaciones calificadas de 0.0 a 5.0 que publica el profesor. Son distintas del
            Challenge: el Challenge es práctica y no cuenta para la nota.
          </p>
        </div>
      </header>
      <div className="site-container assessment-page__content">
        {data.isTeacher && (
          <Alert tone="info" title="Estás con una cuenta de profesor.">
            Las evaluaciones se presentan con cuentas de estudiante. Puedes crearlas y supervisarlas
            desde el <Link href={'/teacher/assessments' as Route}>panel docente</Link>.
          </Alert>
        )}
        {data.assessments === null && (
          <Alert tone="warning" title="No pudimos leer tus evaluaciones.">
            Inténtalo de nuevo en unos minutos.
          </Alert>
        )}
        <nav className="assessment-filter" aria-label="Filtrar por sección">
          <Link
            href={'/evaluations' as Route}
            className="assessment-filter__link"
            aria-current={section ? undefined : 'page'}
          >
            Todas
          </Link>
          {SECTION_LIST.map((entry) => (
            <Link
              key={entry.id}
              href={`/evaluations?seccion=${entry.id}` as Route}
              className="assessment-filter__link"
              aria-current={section?.id === entry.id ? 'page' : undefined}
            >
              Sección {entry.number}
            </Link>
          ))}
        </nav>
        <section aria-labelledby="pending-title" className="assessment-block">
          <h2 id="pending-title">Pendientes</h2>
          <StudentAssessmentList
            assessments={pending}
            sectionTitles={SECTION_TITLES}
            now={data.now}
            emptyText={
              section
                ? `No tienes evaluaciones pendientes de la ${SECTION_TITLES[section.id]}.`
                : 'No tienes evaluaciones pendientes.'
            }
          />
        </section>
        <section aria-labelledby="past-title" className="assessment-block">
          <h2 id="past-title">Presentadas y cerradas</h2>
          <StudentAssessmentList
            assessments={past}
            sectionTitles={SECTION_TITLES}
            now={data.now}
            emptyText="Todavía no hay evaluaciones presentadas."
          />
        </section>
      </div>
    </div>
  );
}
