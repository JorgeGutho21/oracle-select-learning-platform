import 'server-only';
import { notFound } from 'next/navigation';
import { readAttemptView } from '@/features/assessments/application/exam-wire';
import { openAttempt } from '@/features/assessments/application/student-assessments';
import {
  attemptView,
  listStudentAssessments,
  readStudentAssessment,
} from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { canOpenTeacherArea } from '@/features/accounts/domain/account';
import { requireAccount } from '../accounts/auth-server';

/** Datos de las pantallas de evaluación del estudiante. Cada una exige sesión. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadStudentAssessments(path = '/evaluations') {
  const account = await requireAccount(path);
  const assessments = await listStudentAssessments(account.client);
  return {
    assessments,
    isTeacher: canOpenTeacherArea(account.profile.role),
    now: Date.now(),
  };
}

export async function loadStudentAssessment(id: string) {
  if (!UUID.test(id)) notFound();
  const account = await requireAccount(`/evaluations/${id}`);
  const assessment = await readStudentAssessment(account.client, id);
  if (assessment === 'not-found') notFound();
  return { assessment, now: Date.now(), firstName: account.profile.firstName };
}

/**
 * Intento leído con la sesión (la base comprueba que sea propio). Sin `attemptId`, el
 * intento abierto de la evaluación: los identificadores no viajan en la URL.
 */
export async function loadAttempt(assessmentId: string, attemptId?: string) {
  if (!UUID.test(assessmentId)) notFound();
  const account = await requireAccount(`/evaluations/${assessmentId}`);
  let id = attemptId;
  if (!id) {
    const assessment = await readStudentAssessment(account.client, assessmentId);
    if (assessment === 'not-found') notFound();
    if (!assessment) return { status: 'error' as const };
    id = openAttempt(assessment)?.id;
    if (!id) return { status: 'no-open-attempt' as const };
  }
  if (!UUID.test(id)) notFound();
  const result = await attemptView(account.client, id);
  if (!result.ok) return { status: 'error' as const };
  if (result.data.status === 'not-found') notFound();
  const view = readAttemptView(result.data);
  if (!view || view.assessment.id !== assessmentId) notFound();
  return { status: 'ok' as const, view, receivedAt: Date.now() };
}
