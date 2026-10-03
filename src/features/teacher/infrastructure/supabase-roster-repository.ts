import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { AccountProfile } from '@/features/accounts/domain/account';
import {
  PROFILE_COLUMNS,
  toProfile,
} from '@/features/accounts/infrastructure/supabase-profile-repository';
import {
  PROGRESS_COLUMNS,
  toRecord,
} from '@/features/progress/infrastructure/supabase-progress-repository';
import type { OwnedProgressRecord, PresenceEntry } from '../application/roster';

/**
 * Consultas del panel docente con la sesión del profesor. No usan la clave secreta: es RLS
 * la que permite a un profesor (y solo a él) leer perfiles, progreso y presencia ajenos.
 * Si alguien sin el rol llamara a estas consultas, solo obtendría sus propias filas.
 */

const PAGE = 1000;
const MAX_ROWS = 20000;

async function paged<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
  map: (row: unknown) => T | null,
): Promise<readonly T[] | null> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1);
    if (error) return null;
    for (const row of data ?? []) {
      const item = map(row);
      if (item) rows.push(item);
    }
    if ((data?.length ?? 0) < PAGE) break;
  }
  return rows;
}

export async function listStudentProfiles(
  client: SupabaseClient,
): Promise<readonly AccountProfile[] | null> {
  return paged(
    (from, to) =>
      client
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('role', 'student')
        .order('last_name')
        .range(from, to),
    toProfile,
  );
}

export async function listAllProgress(
  client: SupabaseClient,
): Promise<readonly OwnedProgressRecord[] | null> {
  return paged(
    (from, to) =>
      client
        .from('learning_progress')
        .select(`user_id, ${PROGRESS_COLUMNS}`)
        .order('user_id')
        .order('section_key')
        .order('mode_key')
        .order('item_key')
        .range(from, to),
    (row) => {
      const record = toRecord(row);
      const userId = (row as { user_id?: unknown }).user_id;
      return record && typeof userId === 'string' ? { ...record, userId } : null;
    },
  );
}

const presenceRow = z.object({ user_id: z.string(), area: z.string(), seen_at: z.string() });

export async function listPresence(
  client: SupabaseClient,
): Promise<readonly PresenceEntry[] | null> {
  return paged(
    (from, to) =>
      client
        .from('learner_presence')
        .select('user_id, area, seen_at')
        .order('user_id')
        .range(from, to),
    (row) => {
      const parsed = presenceRow.safeParse(row);
      if (!parsed.success) return null;
      const seenAt = Date.parse(parsed.data.seen_at);
      return Number.isFinite(seenAt)
        ? { userId: parsed.data.user_id, area: parsed.data.area, seenAt }
        : null;
    },
  );
}
