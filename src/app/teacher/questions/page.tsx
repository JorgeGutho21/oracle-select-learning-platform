import type { Metadata } from 'next';
import { Suspense, use } from 'react';
import { requireTeacher } from '@/composition/accounts/auth-server';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import { syncOfficialBankAction } from '@/composition/assessments/teacher-actions';
import { loadQuestionBank } from '@/composition/assessments/teacher-pages';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { teacherNotice } from '@/features/assessments/application/teacher-notices';
import {
  OfficialBankPanel,
  QuestionBankView,
} from '@/features/assessments/presentation/question-bank-view';
import { Alert, LoadingState, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Banco de preguntas · Panel docente',
  robots: { index: false, follow: false },
};

function count(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(500, count(firstParam(params.page)) || 1));
  const filter = {
    section: firstParam(params.section) || undefined,
    topic: firstParam(params.topic) || undefined,
    type: firstParam(params.type) || undefined,
    status: firstParam(params.status) || undefined,
    search: (firstParam(params.q) ?? '').trim().slice(0, 80) || undefined,
    page,
  };
  const account = await requireTeacher('/teacher/questions');
  const bank = loadQuestionBank(filter, account);
  const notice = teacherNotice(firstParam(params.aviso), {
    counts: [
      count(firstParam(params.nuevas)),
      count(firstParam(params.actualizadas)),
      count(firstParam(params.iguales)),
    ],
  });
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow="Panel docente"
        title="Banco de preguntas"
        lead="Preguntas por sección, tema, tipo y dificultad interna. Cada cambio crea una versión nueva; las evaluaciones publicadas conservan la que usaron."
      />
      <div className="site-container teacher-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        <Suspense fallback={<LoadingState label="Cargando banco de preguntas…" />}>
          <BankContent pending={bank} filter={filter} />
        </Suspense>
      </div>
    </div>
  );
}

function BankContent({
  pending,
  filter,
}: {
  pending: ReturnType<typeof loadQuestionBank>;
  filter: Parameters<typeof loadQuestionBank>[0];
}) {
  const data = use(pending);
  return data.status === 'error' ? (
    <Alert tone="warning" title="No pudimos leer el banco.">
      Inténtalo de nuevo en unos minutos.
    </Alert>
  ) : (
    <>
      <OfficialBankPanel
        official={data.official}
        sectionTitles={SECTION_TITLES}
        sync={syncOfficialBankAction}
      />
      <QuestionBankView
        rows={data.rows}
        total={data.total}
        pages={data.pages}
        filter={filter}
        sections={Object.entries(SECTION_TITLES).map(([id, title]) => ({ id, title }))}
      />
    </>
  );
}
