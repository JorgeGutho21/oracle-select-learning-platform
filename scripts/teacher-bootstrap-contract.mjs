/** Administration-only identity contract. Names are labels, never authorization criteria. */
export function teacherIdentities(env) {
  const identities = [
    { key: 'JORGE', first: 'Jorge', last: 'Gutiérrez Thomas' },
    { key: 'AMILKAR', first: 'Amilkar', last: 'Sierra Romano' },
  ].map((teacher) => {
    const email = env[`DBLAB_TEACHER_${teacher.key}_EMAIL`]?.trim().toLowerCase();
    const uuid = env[`DBLAB_TEACHER_${teacher.key}_UUID`]?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Missing verified email for ${teacher.key}. Names cannot grant roles.`);
    }
    if (uuid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      throw new Error(`Invalid UUID for ${teacher.key}.`);
    }
    return { ...teacher, email, ...(uuid ? { uuid } : {}) };
  });
  if (
    identities[0].email === identities[1].email ||
    (identities[0].uuid && identities[0].uuid === identities[1].uuid)
  ) {
    throw new Error('The two authorized teachers must have distinct identities.');
  }
  return identities;
}

export function matchTeacher(teacher, users) {
  const matches = users.filter((user) => user.email?.toLowerCase() === teacher.email);
  if (matches.length > 1) throw new Error(`Ambiguous email identity for ${teacher.key}.`);
  const user = matches[0];
  if (teacher.uuid && user?.id !== teacher.uuid)
    throw new Error(`UUID/email mismatch for ${teacher.key}.`);
  if (user && !user.email_confirmed_at) throw new Error(`Unconfirmed account for ${teacher.key}.`);
  return user ?? null;
}
