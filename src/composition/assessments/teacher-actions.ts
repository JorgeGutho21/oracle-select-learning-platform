'use server';

import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canOpenTeacherArea } from '@/features/accounts/domain/account';
import {
  ASSESSMENT_PROBLEM_MESSAGE,
  parseAssessmentForm,
  parseQuestionForm,
  QUESTION_PROBLEM_MESSAGE,
  questionRpcPayload,
} from '@/features/assessments/application/assessment-forms';
import type { TeacherFormState } from '@/features/assessments/application/teacher-notices';
import { OFFICIAL_BANK } from '@/features/assessments/application/official-bank';
import { FEEDBACK_MODES } from '@/features/assessments/domain/assessment';
import {
  callRpc,
  readQuestion,
} from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { currentAccount } from '../accounts/auth-server';
import { notifyAssessmentMonitor } from './monitor-server';

/**
 * Server Functions del profesor. Cada una comprueba sesión y rol aquí y la base lo vuelve a
 * comprobar (private.is_teacher()) en la función que llama. Todas las acciones sensibles
 * quedan en la auditoría de la base.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNAVAILABLE = 'No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.';

async function teacher() {
  const account = await currentAccount();
  if (account.status !== 'authenticated' || !canOpenTeacherArea(account.profile.role)) return null;
  return account;
}

function idFrom(formData: FormData, name = 'id'): string | null {
  const value = String(formData.get(name) ?? '');
  return UUID.test(value) ? value : null;
}

function go(path: string): never {
  redirect(path as Route);
}

function refresh(id?: string) {
  revalidatePath('/teacher/assessments');
  if (id) revalidatePath(`/teacher/assessments/${id}`);
  revalidatePath('/evaluations');
  revalidatePath('/dashboard');
}

function problemsMessage(problems: unknown, messages: Readonly<Record<string, string>>): string {
  const list = Array.isArray(problems) ? problems.map(String) : [];
  return list.map((code) => messages[code] ?? messages.data).join(' ') || UNAVAILABLE;
}

// ---------------------------------------------------------------------------
// Evaluaciones
// ---------------------------------------------------------------------------

export async function saveAssessmentAction(
  _: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const parsed = parseAssessmentForm(formData);
  if (!parsed.ok || !parsed.value) {
    return { status: 'error', message: 'Revisa los campos marcados.', fieldErrors: parsed.errors };
  }
  const account = await teacher();
  if (!account)
    return { status: 'error', message: 'Tu sesión de profesor terminó.', fieldErrors: {} };
  const result = await callRpc(account.client, 'save_assessment', { p: parsed.value });
  if (!result.ok) return { status: 'error', message: UNAVAILABLE, fieldErrors: {} };
  if (result.data.status === 'not-draft') {
    return {
      status: 'error',
      message: 'La evaluación ya se publicó: duplícala para hacer cambios.',
      fieldErrors: {},
    };
  }
  if (result.data.status !== 'saved' || typeof result.data.id !== 'string') {
    return {
      status: 'error',
      message: problemsMessage(result.data.problems, ASSESSMENT_PROBLEM_MESSAGE),
      fieldErrors: {},
    };
  }
  refresh(result.data.id);
  go(`/teacher/assessments/${result.data.id}?aviso=guardada`);
}

async function lifecycle(
  formData: FormData,
  rpc: string,
  args: (id: string) => Record<string, unknown>,
  notice: string,
): Promise<void> {
  const id = idFrom(formData);
  const account = await teacher();
  if (!id || !account) go('/teacher/assessments?aviso=sin-permiso');
  const result = await callRpc(account.client, rpc, args(id));
  refresh(id);
  if (!result.ok) go(`/teacher/assessments/${id}?aviso=error`);
  const status = result.data.status;
  if (status === 'invalid') {
    const problems = Array.isArray(result.data.problems) ? result.data.problems.map(String) : [];
    go(
      `/teacher/assessments/${id}?aviso=no-publicada&motivo=${encodeURIComponent(problems[0] ?? 'data')}`,
    );
  }
  if (status !== 'published' && status !== 'updated' && status !== 'saved') {
    go(`/teacher/assessments/${id}?aviso=no-aplica`);
  }
  await notifyAssessmentMonitor({ kind: 'assessment', id }, status);
  go(`/teacher/assessments/${id}?aviso=${notice}`);
}

export async function publishAssessmentAction(formData: FormData): Promise<void> {
  await lifecycle(formData, 'publish_assessment', (id) => ({ p_assessment: id }), 'publicada');
}

export async function closeEntriesAction(formData: FormData): Promise<void> {
  await lifecycle(
    formData,
    'close_assessment_entries',
    (id) => ({ p_assessment: id }),
    'accesos-cerrados',
  );
}

export async function finalizeAssessmentAction(formData: FormData): Promise<void> {
  await lifecycle(formData, 'finalize_assessment', (id) => ({ p_assessment: id }), 'finalizada');
}

export async function archiveAssessmentAction(formData: FormData): Promise<void> {
  await lifecycle(formData, 'archive_assessment', (id) => ({ p_assessment: id }), 'archivada');
}

export async function setFeedbackModeAction(formData: FormData): Promise<void> {
  const mode = String(formData.get('feedback_mode') ?? '');
  if (!(FEEDBACK_MODES as readonly string[]).includes(mode)) go('/teacher/assessments?aviso=error');
  await lifecycle(
    formData,
    'set_feedback_mode',
    (id) => ({ p_assessment: id, p_mode: mode }),
    'retroalimentacion',
  );
}

export async function duplicateAssessmentAction(formData: FormData): Promise<void> {
  const id = idFrom(formData);
  const account = await teacher();
  if (!id || !account) go('/teacher/assessments?aviso=sin-permiso');
  const result = await callRpc(account.client, 'duplicate_assessment', { p_assessment: id });
  refresh();
  if (!result.ok || typeof result.data.id !== 'string')
    go(`/teacher/assessments/${id}?aviso=error`);
  go(`/teacher/assessments/${result.data.id}?aviso=duplicada`);
}

export async function deleteDraftAction(formData: FormData): Promise<void> {
  const id = idFrom(formData);
  const account = await teacher();
  if (!id || !account) go('/teacher/assessments?aviso=sin-permiso');
  const result = await callRpc(account.client, 'delete_draft_assessment', { p_assessment: id });
  refresh();
  if (!result.ok || result.data.status !== 'deleted')
    go(`/teacher/assessments/${id}?aviso=no-aplica`);
  go('/teacher/assessments?aviso=eliminada');
}

// ---------------------------------------------------------------------------
// Banco de preguntas
// ---------------------------------------------------------------------------

export async function saveQuestionAction(
  _: TeacherFormState,
  formData: FormData,
): Promise<TeacherFormState> {
  const parsed = parseQuestionForm(formData);
  if (!parsed.ok || !parsed.value) {
    return { status: 'error', message: 'Revisa los campos marcados.', fieldErrors: parsed.errors };
  }
  const account = await teacher();
  if (!account)
    return { status: 'error', message: 'Tu sesión de profesor terminó.', fieldErrors: {} };
  const result = await callRpc(account.client, 'save_question', {
    p: questionRpcPayload(parsed.value),
  });
  if (!result.ok) return { status: 'error', message: UNAVAILABLE, fieldErrors: {} };
  if (result.data.status === 'official-readonly') {
    return {
      status: 'error',
      message: 'Las preguntas oficiales de DB LAB no se editan: duplícala para crear tu versión.',
      fieldErrors: {},
    };
  }
  if (typeof result.data.id !== 'string') {
    return {
      status: 'error',
      message: problemsMessage(result.data.problems, QUESTION_PROBLEM_MESSAGE),
      fieldErrors: {},
    };
  }
  revalidatePath('/teacher/questions');
  go(
    `/teacher/questions/${result.data.id}?aviso=${result.data.status === 'unchanged' ? 'sin-cambios' : 'guardada'}`,
  );
}

export async function setQuestionStatusAction(formData: FormData): Promise<void> {
  const id = idFrom(formData);
  const status = String(formData.get('status') ?? '');
  const account = await teacher();
  if (!id || !account || !['draft', 'published', 'retired'].includes(status)) {
    go('/teacher/questions?aviso=sin-permiso');
  }
  const result = await callRpc(account.client, 'set_question_status', {
    p_question: id,
    p_status: status,
  });
  revalidatePath('/teacher/questions');
  go(
    `/teacher/questions/${id}?aviso=${result.ok && result.data.status === 'updated' ? 'estado' : 'error'}`,
  );
}

/** Copia editable (borrador del profesor) de una pregunta, oficial o propia. */
export async function duplicateQuestionAction(formData: FormData): Promise<void> {
  const id = idFrom(formData);
  const account = await teacher();
  if (!id || !account) go('/teacher/questions?aviso=sin-permiso');
  const source = await readQuestion(account.client, id);
  if (!source) go('/teacher/questions?aviso=error');
  const result = await callRpc(account.client, 'save_question', {
    p: questionRpcPayload({
      section: source.section as never,
      topic: source.topic,
      subtopic: source.subtopic,
      type: source.type,
      response: source.response,
      difficulty: source.difficulty as never,
      weight: source.weight,
      prompt: source.prompt,
      ...(source.code ? { code: source.code } : {}),
      ...(source.exhibit ? { exhibit: source.exhibit } : {}),
      options: source.options.map((option) => ({
        body: option.body,
        kind: option.kind,
        ...(option.result ? { result: option.result } : {}),
        correct: option.correct,
        ...(option.order !== null ? { order: option.order } : {}),
        feedback: option.feedback,
      })),
      explanation: source.explanation,
      concept: source.concept,
      review: source.review,
      reference: source.reference,
      tags: source.tags,
      status: 'draft',
    }),
  });
  revalidatePath('/teacher/questions');
  if (!result.ok || typeof result.data.id !== 'string') go(`/teacher/questions/${id}?aviso=error`);
  go(`/teacher/questions/${result.data.id}/edit?aviso=copia`);
}

/** Inserta o actualiza el banco oficial versionado en el repositorio (idempotente). */
export async function syncOfficialBankAction(): Promise<void> {
  const account = await teacher();
  if (!account) go('/teacher/questions?aviso=sin-permiso');
  const payload = Object.values(OFFICIAL_BANK)
    .flat()
    .map((question) => questionRpcPayload(question));
  const result = await callRpc(account.client, 'sync_official_questions', { p_questions: payload });
  revalidatePath('/teacher/questions');
  revalidatePath('/teacher/assessments/new');
  if (!result.ok || result.data.status !== 'synced') go('/teacher/questions?aviso=error');
  const count = (key: string) => Number(result.data[key] ?? 0);
  go(
    `/teacher/questions?aviso=sincronizado&nuevas=${count('created')}&actualizadas=${count('updated')}&iguales=${count('unchanged')}`,
  );
}
