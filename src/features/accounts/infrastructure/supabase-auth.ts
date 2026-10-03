import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicRealtimeConfig } from '@/features/classroom/infrastructure/classroom-config';

/**
 * Cliente de Supabase con la sesión de la persona, solo en el servidor. Usa la clave
 * publicable del proyecto (la misma que ya usaba la sala en vivo) y el token de la sesión:
 * cada consulta pasa por RLS como esa persona. La clave secreta nunca interviene aquí.
 *
 * Las cookies de sesión son httpOnly: el navegador no lee los tokens y DB LAB no usa un
 * cliente de Supabase en el navegador para cuentas ni progreso (todo pasa por el servidor).
 */

export interface AuthConfig {
  readonly url: string;
  readonly publishableKey: string;
}

type Env = Readonly<Record<string, string | undefined>>;

export function authConfig(env: Env): AuthConfig | null {
  const config = publicRealtimeConfig(env);
  return config ? { url: config.url, publishableKey: config.anonKey } : null;
}

export interface CookieToSet {
  readonly name: string;
  readonly value: string;
  readonly options: Readonly<Record<string, unknown>>;
}

/** Acceso a las cookies de la petición y de la respuesta (Next o el proxy). */
export interface CookieJar {
  getAll(): { name: string; value: string }[];
  /** En un Server Component no se pueden escribir cookies: el proxy renueva la sesión. */
  setAll(cookies: readonly CookieToSet[]): void;
}

export function createAuthClient(
  config: AuthConfig,
  jar: CookieJar,
  options: { readonly secure: boolean },
): SupabaseClient {
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookies) => jar.setAll(cookies),
    },
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: options.secure,
      path: '/',
    },
    auth: { flowType: 'pkce', detectSessionInUrl: false },
  });
}

export { SESSION_HINT_COOKIE } from '../application/session-hint';

export function isLocalHost(host: string | null): boolean {
  return /^(localhost|127\.|\[::1\])/.test(host ?? '');
}

/**
 * Traduce un error de Auth a un código estable. Los errores de red no traen código: se
 * reconocen por su tipo o por el estado HTTP 0.
 */
export function authErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const item = error as { code?: unknown; status?: unknown; name?: unknown };
  if (item.name === 'AuthRetryableFetchError' || item.status === 0) return 'network';
  return typeof item.code === 'string' ? item.code : undefined;
}

export interface AuthProviders {
  readonly email: boolean;
  readonly microsoft: boolean;
  readonly signUp: boolean;
}

/**
 * Métodos de acceso habilitados en el proyecto, según su configuración pública de Auth.
 * Así el botón de Microsoft solo se activa cuando el proveedor está configurado y la
 * aplicación compila y funciona sin credenciales de Microsoft.
 */
export async function authProviders(config: AuthConfig): Promise<AuthProviders | null> {
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.publishableKey },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      external?: Record<string, unknown>;
      disable_signup?: unknown;
    };
    return {
      email: body.external?.email === true,
      microsoft: body.external?.azure === true,
      signUp: body.disable_signup !== true,
    };
  } catch {
    return null;
  }
}
