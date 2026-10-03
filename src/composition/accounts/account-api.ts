import 'server-only';
import { displayName, initials } from '@/features/accounts/domain/account';
import { isTrackedKey } from '@/features/progress/application/catalog';
import {
  presenceSchema,
  progressResetSchema,
  progressUploadSchema,
} from '@/features/progress/application/progress-dto';
import {
  deleteOwnProgress,
  readOwnProgress,
  touchPresence,
  upsertOwnProgress,
} from '@/features/progress/infrastructure/supabase-progress-repository';
import { currentAccount, currentSession, setSessionHint } from './auth-server';
import { isSameOrigin, json, readJson } from './http';

/** Rutas de API de la cuenta. Cada una vuelve a comprobar la sesión con Auth. */

export interface SessionAccountDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly initials: string;
  readonly email: string;
  readonly role: 'student' | 'teacher';
}

export type SessionDto =
  | { readonly status: 'guest' | 'unavailable' | 'error' }
  | { readonly status: 'authenticated'; readonly account: SessionAccountDto };

export async function sessionResponse(): Promise<Response> {
  const account = await currentAccount();
  if (account.status === 'authenticated') {
    const { profile } = account;
    const body: SessionDto = {
      status: 'authenticated',
      account: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: displayName(profile),
        initials: initials(profile),
        email: profile.email,
        role: profile.role,
      },
    };
    return json(body);
  }
  if (account.status === 'guest') await setSessionHint(false);
  const body: SessionDto = { status: account.status };
  return json(body, account.status === 'error' ? 503 : 200);
}

async function authenticated() {
  const session = await currentSession();
  if (session.status === 'authenticated') return session;
  return json(
    { error: session.status === 'guest' ? 'unauthenticated' : 'unavailable' },
    session.status === 'guest' ? 401 : 503,
  );
}

export async function readProgress(): Promise<Response> {
  const session = await authenticated();
  if (session instanceof Response) return session;
  const result = await readOwnProgress(session.client, session.user.id);
  return result.ok ? json({ records: result.records }) : json({ error: 'unavailable' }, 503);
}

export async function writeProgress(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const parsed = progressUploadSchema.safeParse(await readJson(request));
  if (!parsed.success || !parsed.data.records.every(isTrackedKey)) {
    return json({ error: 'invalid' }, 400);
  }
  const session = await authenticated();
  if (session instanceof Response) return session;
  const result = await upsertOwnProgress(session.client, session.user.id, parsed.data.records);
  return result.ok ? json({ records: result.records }) : json({ error: 'unavailable' }, 503);
}

export async function deleteProgress(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const url = new URL(request.url);
  const parsed = progressResetSchema.safeParse({
    section: url.searchParams.get('section'),
    mode: url.searchParams.get('mode'),
  });
  if (!parsed.success) return json({ error: 'invalid' }, 400);
  const session = await authenticated();
  if (session instanceof Response) return session;
  const ok = await deleteOwnProgress(
    session.client,
    session.user.id,
    parsed.data.section,
    parsed.data.mode,
  );
  return ok ? json({ ok: true }) : json({ error: 'unavailable' }, 503);
}

export async function reportPresence(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: 'forbidden' }, 403);
  const parsed = presenceSchema.safeParse(await readJson(request, 1024));
  if (!parsed.success) return json({ error: 'invalid' }, 400);
  const session = await authenticated();
  if (session instanceof Response) return session;
  const ok = await touchPresence(session.client, session.user.id, parsed.data.area);
  return ok
    ? new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    : json({ error: 'unavailable' }, 503);
}
