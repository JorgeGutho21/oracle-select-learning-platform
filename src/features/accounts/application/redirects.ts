/**
 * Destinos internos después de iniciar sesión. Un parámetro `next` manipulado nunca lleva
 * fuera del sitio (redirección abierta) ni de vuelta a las pantallas de acceso (bucle).
 */

export const ACCOUNT_HOME = '/dashboard';
export const LOGIN_PATH = '/login';

/** Rutas que exigen una sesión. El panel docente además exige el rol de profesor. */
export const PRIVATE_PATHS = [
  '/dashboard',
  '/profile',
  '/teacher',
  '/evaluations',
  '/reset-password',
] as const;
export const TEACHER_PATH = '/teacher';

const ACCESS_PATHS = ['/login', '/register', '/forgot-password', '/auth'];
const SITE = 'https://db-lab.invalid';

function matchesPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function hasControl(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((base) => matchesPath(pathname, base));
}

/** Ruta interna saneada (ruta y consulta, sin fragmento) o el destino por defecto. */
export function safeNextPath(raw: unknown, fallback: string = ACCOUNT_HOME): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 300) return fallback;
  // Solo rutas absolutas del propio sitio: nada de «//otro.sitio», «/\otro» ni esquemas.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || hasControl(raw)) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(raw, SITE);
  } catch {
    return fallback;
  }
  if (url.origin !== SITE) return fallback;
  if (ACCESS_PATHS.some((base) => matchesPath(url.pathname, base))) return fallback;
  return `${url.pathname}${url.search}`;
}

/** Enlace a la pantalla de acceso que vuelve a `path` al terminar, con un aviso opcional. */
export function loginHref(path: string, notice?: string): string {
  const params = new URLSearchParams();
  const next = safeNextPath(path, '');
  if (next) params.set('next', next);
  if (notice) params.set('aviso', notice);
  const query = params.toString();
  return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
