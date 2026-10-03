import type { NextRequest } from 'next/server';
import { guardPrivateRoute } from '@/composition/accounts/proxy-session';

/** Solo las rutas privadas pasan por aquí; el contenido educativo sigue siendo estático. */
export function proxy(request: NextRequest) {
  return guardPrivateRoute(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/teacher/:path*',
    '/evaluations/:path*',
    '/reset-password',
  ],
};
