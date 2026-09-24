/**
 * Selección del almacenamiento de la sala a partir del entorno del servidor:
 * - `supabase`: requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (solo servidor).
 * - `memory`: solo si CLASSROOM_BACKEND=memory; los datos viven en el proceso.
 * - `unconfigured`: la sala informa que no está disponible, sin simular nada.
 */

export type ClassroomBackend =
  | { readonly kind: 'supabase'; readonly url: string; readonly serviceRoleKey: string }
  | { readonly kind: 'memory' }
  | { readonly kind: 'unconfigured' };

export function classroomBackend(
  env: Readonly<Record<string, string | undefined>>,
): ClassroomBackend {
  const requested = env.CLASSROOM_BACKEND?.trim().toLowerCase();
  const url = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
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

/** Datos públicos para el aviso en tiempo real del navegador (la clave anónima es pública). */
export function publicRealtimeConfig(
  env: Readonly<Record<string, string | undefined>>,
): { readonly url: string; readonly anonKey: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}
