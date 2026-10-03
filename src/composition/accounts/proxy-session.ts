import { NextResponse, type NextRequest } from 'next/server';
import { loginHref, TEACHER_PATH } from '@/features/accounts/application/redirects';
import {
  authConfig,
  createAuthClient,
  isLocalHost,
  SESSION_HINT_COOKIE,
} from '@/features/accounts/infrastructure/supabase-auth';

/**
 * Comprobación optimista de las rutas privadas (Next «proxy»): renueva la sesión si el token
 * caducó (un Server Component no puede escribir cookies) y, sin sesión, lleva a la pantalla
 * de acceso antes de renderizar nada. La autorización definitiva la hacen la página
 * (sesión y rol leídos en el servidor) y la base de datos (RLS).
 */
function isTeacherPath(pathname: string): boolean {
  return pathname === TEACHER_PATH || pathname.startsWith(`${TEACHER_PATH}/`);
}

export async function guardPrivateRoute(request: NextRequest): Promise<NextResponse> {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const config = authConfig(process.env);
  if (!config) {
    return NextResponse.redirect(new URL(loginHref(path, 'no-disponible'), request.url));
  }
  let response = NextResponse.next({ request });
  const supabase = createAuthClient(
    config,
    {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
    { secure: !isLocalHost(request.headers.get('host')) },
  );
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (userId) {
    if (!isTeacherPath(request.nextUrl.pathname)) return response;
    // Panel docente: el rol se lee de la base con la sesión de la persona (RLS). Sin el rol
    // de profesor se sirve «Acceso denegado» en la misma URL, sin renderizar nada del panel.
    // (El estado HTTP queda en 200: Next ya no cambia el estado de una página reescrita.)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if ((profile as { role?: unknown } | null)?.role === 'teacher') return response;
    const denied = NextResponse.rewrite(new URL('/access-denied', request.url));
    for (const cookie of response.cookies.getAll()) denied.cookies.set(cookie);
    return denied;
  }
  const redirect = NextResponse.redirect(new URL(loginHref(path), request.url));
  // Conserva el borrado de cookies de una sesión que ya no sirve.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  redirect.cookies.delete(SESSION_HINT_COOKIE);
  return redirect;
}
