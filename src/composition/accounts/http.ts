import 'server-only';

/** Respuestas de las rutas de API de cuenta: nunca se guardan en cachés compartidas. */
export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
}

/**
 * Escrituras solo desde el propio sitio. Las cookies SameSite=Lax ya impiden el envío desde
 * otro sitio; esta comprobación cierra también los envíos entre subdominios.
 */
export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (!origin) return fetchSite === 'same-origin';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Cuerpo JSON acotado: una petición enorme no llega a validarse. */
export async function readJson(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
