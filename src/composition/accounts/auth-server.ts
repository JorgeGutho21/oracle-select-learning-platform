import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Route } from 'next';
import { cookies, headers } from 'next/headers';
import { forbidden, redirect } from 'next/navigation';
import { connection } from 'next/server';
import type { AccountProfile } from '@/features/accounts/domain/account';
import { canOpenTeacherArea } from '@/features/accounts/domain/account';
import { loginHref } from '@/features/accounts/application/redirects';
import {
  authConfig,
  authProviders,
  createAuthClient,
  isLocalHost,
  SESSION_HINT_COOKIE,
} from '@/features/accounts/infrastructure/supabase-auth';
import { readProfile } from '@/features/accounts/infrastructure/supabase-profile-repository';

/**
 * Raíz de composición de las cuentas (solo servidor). Une las cookies de Next con el
 * cliente de Supabase de la sesión. La autorización real está en la base (RLS) y en estas
 * comprobaciones de servidor; el navegador nunca decide el rol.
 */

export type ServerSession =
  | { readonly status: 'unavailable' }
  | { readonly status: 'guest' }
  | { readonly status: 'error' }
  | { readonly status: 'authenticated'; readonly user: User; readonly client: SupabaseClient };

export async function isSecureRequest(): Promise<boolean> {
  const list = await headers();
  return !isLocalHost(list.get('x-forwarded-host') ?? list.get('host'));
}

/** Cliente con la sesión de la petición, o `null` si Supabase no está configurado. */
export async function authClient(): Promise<SupabaseClient | null> {
  // La configuración y la sesión se leen al servir la petición, nunca al compilar.
  await connection();
  const config = authConfig(process.env);
  if (!config) return null;
  const store = await cookies();
  return createAuthClient(
    config,
    {
      getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Un Server Component no puede escribir cookies: el proxy renueva la sesión en
          // las rutas privadas y las Server Functions y rutas de API sí pueden escribirlas.
        }
      },
    },
    { secure: await isSecureRequest() },
  );
}

/** Origen de la petición actual, para los enlaces de vuelta de Auth (correo y Microsoft). */
export async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get('x-forwarded-host') ?? list.get('host') ?? '';
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) && !/^\[[0-9a-f:]+\](:\d{1,5})?$/i.test(host)) {
    return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
  }
  const forwarded = list.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol =
    forwarded === 'http' || forwarded === 'https'
      ? forwarded
      : isLocalHost(host)
        ? 'http'
        : 'https';
  return `${protocol}://${host}`;
}

/** Sesión verificada con el servidor de Auth (getUser), no solo leída de la cookie. */
export async function currentSession(): Promise<ServerSession> {
  const client = await authClient();
  if (!client) return { status: 'unavailable' };
  const { data, error } = await client.auth.getUser();
  if (data.user) return { status: 'authenticated', user: data.user, client };
  if (error && (error.status === 0 || error.name === 'AuthRetryableFetchError')) {
    return { status: 'error' };
  }
  return { status: 'guest' };
}

export type ServerAccount =
  | Exclude<ServerSession, { status: 'authenticated' }>
  | {
      readonly status: 'authenticated';
      readonly user: User;
      readonly client: SupabaseClient;
      readonly profile: AccountProfile;
    };

export async function currentAccount(): Promise<ServerAccount> {
  const session = await currentSession();
  if (session.status !== 'authenticated') return session;
  const read = await readProfile(session.client, session.user.id);
  if (read.status !== 'found') return { status: 'error' };
  return { ...session, profile: read.profile };
}

/** Rutas privadas: sin sesión, a la pantalla de acceso (con vuelta a `path`). */
export async function requireAccount(path: string) {
  const account = await currentAccount();
  if (account.status === 'authenticated') return account;
  if (account.status === 'unavailable' || account.status === 'error') {
    redirect(loginHref(path, 'no-disponible') as Route);
  }
  redirect(loginHref(path) as Route);
}

/** Panel docente: además de la sesión, el rol leído de la base (no de la cookie). */
export async function requireTeacher(path: string) {
  const account = await requireAccount(path);
  if (!canOpenTeacherArea(account.profile.role)) forbidden();
  return account;
}

/** Marca sin datos que permite al navegador saber si hay sesión sin leer los tokens. */
export async function setSessionHint(active: boolean): Promise<void> {
  const store = await cookies();
  if (active) {
    store.set(SESSION_HINT_COOKIE, '1', {
      httpOnly: false,
      sameSite: 'lax',
      secure: await isSecureRequest(),
      path: '/',
      maxAge: 400 * 24 * 60 * 60,
    });
  } else {
    store.delete(SESSION_HINT_COOKIE);
  }
}

export interface AccessContext {
  /** Supabase configurado y su servicio de Auth responde. */
  readonly available: boolean;
  readonly microsoft: boolean;
  readonly signUp: boolean;
  readonly authenticated: boolean;
}

/** Estado de las pantallas de acceso: qué métodos ofrecer y si ya hay sesión. */
export async function accessContext(): Promise<AccessContext> {
  await connection();
  const config = authConfig(process.env);
  if (!config) return { available: false, microsoft: false, signUp: false, authenticated: false };
  const [providers, session] = await Promise.all([authProviders(config), currentSession()]);
  return {
    available: providers !== null && providers.email,
    microsoft: providers?.microsoft ?? false,
    signUp: providers?.signUp ?? false,
    authenticated: session.status === 'authenticated',
  };
}
