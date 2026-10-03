import 'server-only';
import { displayName } from '@/features/accounts/application/account-api';
import { listStudentAssessments } from '@/features/assessments/infrastructure/supabase-assessment-repository';
import { learnerProgress } from '@/features/progress/application/summary';
import type { ProgressRecord } from '@/features/progress/domain/progress';
import { readOwnProgress } from '@/features/progress/infrastructure/supabase-progress-repository';
import {
  buildRoster,
  filterStudents,
  type RosterSummary,
  type StudentRow,
} from '@/features/teacher/application/roster';
import {
  listAllProgress,
  listPresence,
  listStudentProfiles,
} from '@/features/teacher/infrastructure/supabase-roster-repository';
import { requireAccount, requireTeacher } from './auth-server';

/** Datos de las páginas privadas. Cada función comprueba la sesión (y el rol) primero. */

export async function loadDashboard() {
  const account = await requireAccount('/dashboard');
  const isStudent = account.profile.role === 'student';
  const [cloud, assessments] = await Promise.all([
    readOwnProgress(account.client, account.user.id),
    isStudent ? listStudentAssessments(account.client) : Promise.resolve(null),
  ]);
  return {
    userId: account.user.id,
    firstName: account.profile.firstName,
    records: cloud.ok ? cloud.records : ([] as readonly ProgressRecord[]),
    cloudAvailable: cloud.ok,
    isStudent,
    assessments,
    now: Date.now(),
  };
}

export async function loadProfile() {
  const account = await requireAccount('/profile');
  const cloud = await readOwnProgress(account.client, account.user.id);
  return {
    profile: account.profile,
    overall: cloud.ok ? learnerProgress(cloud.records).overall : null,
  };
}

export type TeacherData =
  | { readonly status: 'error' }
  | {
      readonly status: 'ready';
      readonly teacherName: string;
      readonly roster: RosterSummary;
      readonly students: readonly StudentRow[];
      readonly query: string;
    };

export async function loadTeacherDashboard(rawQuery: string | undefined): Promise<TeacherData> {
  // Sesión y rol leídos en el servidor; un estudiante recibe 403 sin ver nada del panel.
  const account = await requireTeacher('/teacher');
  const [profiles, progress, presence] = await Promise.all([
    listStudentProfiles(account.client),
    listAllProgress(account.client),
    listPresence(account.client),
  ]);
  if (!profiles || !progress || !presence) return { status: 'error' };
  const query = (rawQuery ?? '').trim().slice(0, 80);
  const roster = buildRoster({ profiles, progress, presence, now: Date.now() });
  return {
    status: 'ready',
    teacherName: displayName(account.profile),
    roster,
    students: filterStudents(roster.students, query),
    query,
  };
}
