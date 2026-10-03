import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AUTH_METHODS, USER_ROLES, type AccountProfile } from '../domain/account';

/** Lectura y edición del perfil propio. RLS decide qué filas se ven y qué se puede cambiar. */

export const PROFILE_COLUMNS = 'id, first_name, last_name, email, role, auth_method, institutional';

const profileRow = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  auth_method: z.enum(AUTH_METHODS),
  institutional: z.boolean(),
});

export function toProfile(row: unknown): AccountProfile | null {
  const parsed = profileRow.safeParse(row);
  if (!parsed.success) return null;
  const item = parsed.data;
  return {
    id: item.id,
    firstName: item.first_name,
    lastName: item.last_name,
    email: item.email,
    role: item.role,
    authMethod: item.auth_method,
    institutional: item.institutional,
  };
}

export type ProfileRead =
  | { readonly status: 'found'; readonly profile: AccountProfile }
  | { readonly status: 'missing' | 'error' };

export async function readProfile(client: SupabaseClient, userId: string): Promise<ProfileRead> {
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) return { status: 'error' };
  const profile = data ? toProfile(data) : null;
  return profile ? { status: 'found', profile } : { status: 'missing' };
}

export async function updateProfileNames(
  client: SupabaseClient,
  userId: string,
  names: { readonly firstName: string; readonly lastName: string },
): Promise<boolean> {
  const { error } = await client
    .from('profiles')
    .update({ first_name: names.firstName, last_name: names.lastName })
    .eq('id', userId);
  return !error;
}
