export interface TeacherIdentity {
  readonly key: string;
  readonly first: string;
  readonly last: string;
  readonly email: string;
  readonly uuid?: string;
}
export interface AuthIdentity {
  readonly id: string;
  readonly email?: string;
  readonly email_confirmed_at?: string;
  readonly user_metadata?: Readonly<Record<string, unknown>>;
}
export function teacherIdentities(
  env: Readonly<Record<string, string | undefined>>,
): readonly TeacherIdentity[];
export function matchTeacher(
  teacher: TeacherIdentity,
  users: readonly AuthIdentity[],
): AuthIdentity | null;
export function missingTeacherCredential(env: Readonly<Record<string, string | undefined>>): string;
