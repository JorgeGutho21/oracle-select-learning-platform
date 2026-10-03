import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { PROGRESS_STATUSES, type ProgressRecord } from '../domain/progress';

/**
 * Tabla `learning_progress` con la sesión de la persona (RLS). La fusión monótona la
 * repite el disparador de la base, así que estas escrituras son seguras aunque lleguen
 * atrasadas o repetidas.
 */

export const PROGRESS_COLUMNS =
  'section_key, mode_key, item_key, status, progress_percent, content_version, state, last_activity_at';

const stateValue = z.union([z.number(), z.string(), z.boolean()]);
const progressRow = z.object({
  section_key: z.string(),
  mode_key: z.string(),
  item_key: z.string(),
  status: z.enum(PROGRESS_STATUSES),
  progress_percent: z.number().int(),
  content_version: z.number().int().nullable(),
  state: z.record(z.string(), stateValue).catch({}),
  last_activity_at: z.string(),
});

export function toRecord(row: unknown): ProgressRecord | null {
  const parsed = progressRow.safeParse(row);
  if (!parsed.success) return null;
  const item = parsed.data;
  const at = Date.parse(item.last_activity_at);
  return {
    section: item.section_key,
    mode: item.mode_key,
    item: item.item_key,
    status: item.status,
    percent: item.progress_percent,
    contentVersion: item.content_version,
    state: item.state,
    lastActivityAt: Number.isFinite(at) && at > 0 ? at : 0,
  };
}

export function toRows(records: readonly ProgressRecord[]): readonly Record<string, unknown>[] {
  return records.map((record) => ({
    section_key: record.section,
    mode_key: record.mode,
    item_key: record.item,
    status: record.status,
    progress_percent: record.percent,
    content_version: record.contentVersion,
    state: record.state,
    last_activity_at: new Date(record.lastActivityAt).toISOString(),
  }));
}

function rowsToRecords(rows: readonly unknown[] | null): readonly ProgressRecord[] {
  return (rows ?? []).flatMap((row) => {
    const record = toRecord(row);
    return record ? [record] : [];
  });
}

export type ProgressQuery =
  { readonly ok: true; readonly records: readonly ProgressRecord[] } | { readonly ok: false };

export async function readOwnProgress(
  client: SupabaseClient,
  userId: string,
): Promise<ProgressQuery> {
  const { data, error } = await client
    .from('learning_progress')
    .select(PROGRESS_COLUMNS)
    .eq('user_id', userId)
    .limit(1000);
  return error ? { ok: false } : { ok: true, records: rowsToRecords(data) };
}

export async function upsertOwnProgress(
  client: SupabaseClient,
  userId: string,
  records: readonly ProgressRecord[],
): Promise<ProgressQuery> {
  const rows = toRows(records).map((row) => ({ ...row, user_id: userId }));
  const { data, error } = await client
    .from('learning_progress')
    .upsert(rows, { onConflict: 'user_id,section_key,mode_key,item_key' })
    .select(PROGRESS_COLUMNS);
  return error ? { ok: false } : { ok: true, records: rowsToRecords(data) };
}

export async function deleteOwnProgress(
  client: SupabaseClient,
  userId: string,
  section: string,
  mode: string,
): Promise<boolean> {
  const { error } = await client
    .from('learning_progress')
    .delete()
    .eq('user_id', userId)
    .eq('section_key', section)
    .eq('mode_key', mode);
  return !error;
}

export async function touchPresence(
  client: SupabaseClient,
  userId: string,
  area: string,
): Promise<boolean> {
  const { error } = await client
    .from('learner_presence')
    .upsert({ user_id: userId, area }, { onConflict: 'user_id' });
  return !error;
}
