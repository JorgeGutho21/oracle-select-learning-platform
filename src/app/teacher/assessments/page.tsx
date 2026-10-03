import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import {
  closeEntriesAction,
  duplicateAssessmentAction,
  publishAssessmentAction,
} from '@/composition/assessments/teacher-actions';
import { loadAssessmentList } from '@/composition/assessments/teacher-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { teacherNotice } from '@/features/assessments/application/teacher-notices';
import { TeacherAssessmentList } from '@/features/assessments/presentation/teacher-assessment-list';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Evaluaciones · Panel docente',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const [data, params] = await Promise.all([loadAssessmentList(), searchParams]);
  const notice = teacherNotice(firstParam(params.aviso));
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow="Panel docente"
        title="Evaluaciones"
        lead="Crea evaluaciones con el banco de preguntas, publícalas cuando estén listas, supervisa el examen y revisa los resultados en la escala 0.0 a 5.0."
        actions={
          <Link className="ds-button ds-button--primary" href={'/teacher/assessments/new' as Route}>
            Nueva evaluación
          </Link>
        }
      />
      <div className="site-container teacher-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        {data.status === 'error' ? (
          <Alert tone="warning" title="No pudimos leer las evaluaciones.">
            Inténtalo de nuevo en unos minutos.
          </Alert>
        ) : (
          <TeacherAssessmentList
            now={data.now}
            cards={data.cards.map(({ record, phase, audienceSize, finished, open }) => ({
              id: record.id,
              title: record.title,
              sectionTitle: SECTION_TITLES[record.sectionKey] ?? record.sectionKey,
              phase,
              durationMinutes: record.durationMinutes,
              questionCount: record.questionCount,
              opensAt: record.opensAt,
              closesAt: record.closesAt,
              updatedAt: record.updatedAt,
              audienceSize,
              finished,
              open,
            }))}
            actions={{
              duplicate: duplicateAssessmentAction,
              publish: publishAssessmentAction,
              closeEntries: closeEntriesAction,
            }}
          />
        )}
      </div>
    </div>
  );
}
