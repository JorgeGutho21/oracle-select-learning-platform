import { createClient } from '@supabase/supabase-js';
import { teacherIdentities, matchTeacher } from './teacher-bootstrap-contract.mjs';

// Run with --env-file=.env.local. All inputs stay in the administration environment.
// Default: inspect only. --apply assigns roles; missing users additionally require
// DBLAB_BOOTSTRAP_MISSING_TEACHERS=1. Existing passwords are never changed.
async function run() {
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some((arg) => !['--apply', '--check'].includes(arg)))
    throw new Error('Use --check or --apply.');
  const teachers = teacherIdentities(process.env);
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || new URL(url).hostname !== 'byjkkxrrkodyduskdimg.supabase.co' || !key)
    throw new Error('Authorized DB LAB project and administration key required.');
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const users = [];
  for (let page = 1; ; page++) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw new Error('Cannot inspect Auth identities.');
    users.push(...result.data.users);
    if (result.data.users.length < 1000) break;
  }
  // Resolve both identities before mutating either. A bad UUID cannot partially grant access.
  const resolved = teachers.map((teacher) => ({ teacher, user: matchTeacher(teacher, users) }));
  if (
    apply &&
    resolved.some(({ user }) => !user) &&
    (process.env.DBLAB_BOOTSTRAP_MISSING_TEACHERS !== '1' || !process.env.PRESENTER_ACCESS_CODE)
  ) {
    throw new Error(
      'Missing accounts need explicit bootstrap mode and the existing presenter credential in the server environment.',
    );
  }
  for (const entry of resolved) {
    const { teacher } = entry;
    let user = entry.user;
    if (!user && apply) {
      const created = await admin.auth.admin.createUser({
        email: teacher.email,
        password: process.env.PRESENTER_ACCESS_CODE,
        email_confirm: true,
        user_metadata: { first_name: teacher.first, last_name: teacher.last },
      });
      if (created.error || !created.data.user)
        throw new Error(`Cannot bootstrap ${teacher.key}; no credentials logged.`);
      user = created.data.user;
    }
    if (!user) {
      console.log(`${teacher.key}: account missing; no change.`);
      continue;
    }
    if (apply) {
      const { data, error } = await admin.rpc('admin_set_role', {
        p_email: teacher.email,
        p_role: 'teacher',
      });
      if (error || data?.status !== 'updated')
        throw new Error(`Role assignment failed for ${teacher.key}.`);
    }
    const profile = await admin.from('profiles').select('id,role').eq('id', user.id).single();
    if (profile.error || !profile.data || (apply && profile.data.role !== 'teacher'))
      throw new Error(`Profile/role verification failed for ${teacher.key}.`);
    console.log(
      `${teacher.key}: UUID ${user.id}; role ${profile.data.role}; ${apply ? 'verified' : 'read-only'}.`,
    );
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrative bootstrap failed.');
  process.exitCode = 1;
});
