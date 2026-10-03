/**
 * Selección del almacenamiento de la sala a partir del entorno del servidor:
 * - `supabase`: requiere SUPABASE_URL y la clave secreta del proyecto (solo servidor):
 *   SUPABASE_SECRET_KEY (`sb_secret_…`) o, en proyectos con claves antiguas,
 *   SUPABASE_SERVICE_ROLE_KEY.
 * - `memory`: solo si CLASSROOM_BACKEND=memory; los datos viven en el proceso.
 * - `unconfigured`: la sala informa que no está disponible, sin simular nada.
 */

export type ClassroomBackend =
  | { readonly kind: 'supabase'; readonly url: string; readonly serviceRoleKey: string }
  | { readonly kind: 'memory' }
  | { readonly kind: 'unconfigured' };

type Env = Readonly<Record<string, string | undefined>>;

/** Primer valor no vacío: las variables modernas tienen prioridad sobre las antiguas. */
function firstValue(...values: readonly (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Una clave que da privilegios de servicio: nunca debe llegar al navegador. */
function isPrivilegedKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  const payload = key.split('.')[1];
  if (!payload) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: unknown;
    };
    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

export function classroomBackend(env: Env): ClassroomBackend {
  const requested = env.CLASSROOM_BACKEND?.trim().toLowerCase();
  const url = env.SUPABASE_URL?.trim();
  const serviceRoleKey = firstValue(env.SUPABASE_SECRET_KEY, env.SUPABASE_SERVICE_ROLE_KEY);
  if (requested === 'memory') return { kind: 'memory' };
  if (
    (requested === undefined || requested === '' || requested === 'supabase') &&
    url &&
    serviceRoleKey
  ) {
    return { kind: 'supabase', url, serviceRoleKey };
  }
  return { kind: 'unconfigured' };
}

/**
 * Datos públicos para el aviso en tiempo real del navegador: la clave publishable
 * (`sb_publishable_…`, o la anónima antigua) es pública por diseño. Si por error se
 * configura una clave secreta, no se entrega y la sala sigue por consulta periódica.
 */
export function publicRealtimeConfig(
  env: Env,
): { readonly url: string; readonly anonKey: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = firstValue(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (!url || !anonKey || isPrivilegedKey(anonKey)) return null;
  return { url, anonKey };
}
