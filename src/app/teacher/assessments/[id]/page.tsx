import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { SECTION_TITLES } from '@/composition/assessments/section-titles';
import {
  archiveAssessmentAction,
  closeEntriesAction,
  deleteDraftAction,
  duplicateAssessmentAction,
  finalizeAssessmentAction,
  publishAssessmentAction,
  saveAssessmentAction,
  setFeedbackModeAction,
} from '@/composition/assessments/teacher-actions';
import {
  loadAssessmentDetail,
  loadAssessmentEditor,
} from '@/composition/assessments/teacher-pages';
import { toDetailRecord, toFormValues } from '@/composition/assessments/teacher-view-models';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { teacherNotice } from '@/features/assessments/application/teacher-notices';
import { AssessmentForm } from '@/features/assessments/presentation/assessment-form';
import {
  AssessmentActions,
  AssessmentSettings,
  AuditList,
  DraftQuestionList,
  FrozenQuestionList,
} from '@/features/assessments/presentation/assessment-detail';
import { Alert, PageHeader } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Evaluación · Panel docente',
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
  const data = await loadAssessmentDetail(id);
  const notice = teacherNotice(firstParam(query.aviso), {
    reason: firstParam(query.motivo) ?? 'data',
  });
  if (data.status === 'error') {
    return (
      <div className="site-container feature-page">
        <h1>Evaluación</h1>
        <Alert tone="warning" title="No pudimos leer la evaluación.">
          Inténtalo de nuevo en unos minutos.
        </Alert>
      </div>
    );
  }
  const record = toDetailRecord(data.record);
  const editor = data.phase === 'draft' ? await loadAssessmentEditor(id) : null;
  return (
    <div className="teacher-page">
      <PageHeader
        tone="night"
        eyebrow={
          <>
            <Link href={'/teacher/assessments' as Route}>Evaluaciones</Link> · {record.sectionTitle}
          </>
        }
        title={record.title}
      />
      <div className="site-container teacher-page__content">
        {notice && <Alert tone={notice.tone} title={notice.text} live />}
        <AssessmentActions
          record={record}
          phase={data.phase}
          actions={{
            publish: publishAssessmentAction,
            closeEntries: closeEntriesAction,
            finalize: finalizeAssessmentAction,
            setFeedback: setFeedbackModeAction,
            duplicate: duplicateAssessmentAction,
            archive: archiveAssessmentAction,
            deleteDraft: deleteDraftAction,
          }}
        />
        <AssessmentSettings
          record={record}
          phase={data.phase}
          audienceSize={data.audienceSize}
          assignedNames={data.assigned.map((student) =>
            `${student.firstName} ${student.lastName}`.trim(),
          )}
          counts={data.counts}
        />
        {editor?.status === 'ready' && editor.record && editor.selection && (
          <section className="teacher-block" aria-labelledby="draft-editor-title">
            <h2 id="draft-editor-title">Editar borrador</h2>
            <AssessmentForm
              action={saveAssessmentAction}
              values={toFormValues(editor.record, editor.selection)}
              sections={Object.entries(SECTION_TITLES).map(([key, title]) => ({ id: key, title }))}
              bank={editor.bank}
              topicCounts={editor.topicCounts}
              students={editor.students}
            />
          </section>
        )}
        <section className="teacher-block" aria-labelledby="assessment-questions-title">
          <h2 id="assessment-questions-title">
            {data.phase === 'draft' ? 'Preguntas elegidas' : 'Preguntas congeladas al publicar'}
          </h2>
          {data.phase === 'draft' ? (
            <DraftQuestionList questions={data.draftQuestions} sectionKey={record.sectionKey} />
          ) : (
            <FrozenQuestionList questions={data.frozen} sectionKey={record.sectionKey} />
          )}
        </section>
        <AuditList entries={data.audit} />
      </div>
    </div>
  );
}
