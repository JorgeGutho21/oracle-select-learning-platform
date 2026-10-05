// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { teacherIdentities, matchTeacher } from '../../../scripts/teacher-bootstrap-contract.mjs';

const emailEnv = {
  DBLAB_TEACHER_JORGE_EMAIL: 'jorge@example.test',
  DBLAB_TEACHER_AMILKAR_EMAIL: 'amilkar@example.test',
};
describe('Administrative teacher identity boundary', () => {
  it('cannot authorize by a display name or missing email', () => {
    expect(() => teacherIdentities({ full_name: 'Jorge Gutiérrez Thomas' })).toThrow(
      'verified email',
    );
    const [teacher] = teacherIdentities(emailEnv);
    expect(
      matchTeacher(teacher!, [
        { id: 'x', email: 'other@example.test', user_metadata: { name: 'Jorge Gutiérrez Thomas' } },
      ]),
    ).toBeNull();
  });
  it('requires distinct identities and UUID/email agreement before mutation', () => {
    expect(() =>
      teacherIdentities({
        ...emailEnv,
        DBLAB_TEACHER_AMILKAR_EMAIL: emailEnv.DBLAB_TEACHER_JORGE_EMAIL,
      }),
    ).toThrow('distinct');
    const [teacher] = teacherIdentities({
      ...emailEnv,
      DBLAB_TEACHER_JORGE_UUID: '00000000-0000-0000-0000-000000000001',
    });
    expect(() =>
      matchTeacher(teacher!, [
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'jorge@example.test',
          email_confirmed_at: '2026-10-04',
        },
      ]),
    ).toThrow('mismatch');
  });
  it('does not accept an unconfirmed email or an ambiguous identity', () => {
    const [teacher] = teacherIdentities(emailEnv);
    expect(() => matchTeacher(teacher!, [{ id: 'x', email: 'jorge@example.test' }])).toThrow(
      'Unconfirmed',
    );
    expect(() =>
      matchTeacher(teacher!, [
        { id: 'a', email: 'jorge@example.test' },
        { id: 'b', email: 'jorge@example.test' },
      ]),
    ).toThrow('Ambiguous');
  });
  it('resolves a confirmed identity by email and actual UUID', () => {
    const [teacher] = teacherIdentities(emailEnv);
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'jorge@example.test',
      email_confirmed_at: '2026-10-04',
    };
    expect(matchTeacher(teacher!, [user])).toBe(user);
  });
});
