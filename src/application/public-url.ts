/**
 * URL pública de la plataforma para enlaces y códigos QR, sin dominio fijo en el código:
 * 1. `NEXT_PUBLIC_SITE_URL`, la dirección publicada que configura quien despliega.
 * 2. En producción en Vercel, el dominio de producción del proyecto
 *    (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`): la URL única de cada despliegue está
 *    protegida por la autenticación de Vercel y un móvil no podría abrirla.
 * 3. En despliegues de vista previa, la URL que asigna la plataforma (`NEXT_PUBLIC_VERCEL_URL`).
 * 4. En desarrollo, el origen de la página abierta (localhost o la IP de la red local).
 */

export type PublicUrlSource = 'configured' | 'production' | 'preview' | 'current-origin' | 'none';

export interface PublicBaseUrl {
  readonly url: string | null;
  readonly source: PublicUrlSource;
  /** El QR no sirve a otros dispositivos si apunta a esta misma máquina. */
  readonly isLocal: boolean;
}

function clean(value: string | undefined, assumeHttps = false): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : assumeHttps
      ? `https://${trimmed}`
      : null;
  if (!withScheme) return null;
  try {
    const url = new URL(withScheme);
    return url.origin;
  } catch {
    return null;
  }
}

export function isLocalOrigin(origin: string): boolean {
  try {
    return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function resolvePublicBaseUrl(input: {
  readonly configured?: string | undefined;
  readonly production?: string | undefined;
  readonly preview?: string | undefined;
  readonly currentOrigin?: string | undefined;
}): PublicBaseUrl {
  const configured = clean(input.configured);
  if (configured)
    return { url: configured, source: 'configured', isLocal: isLocalOrigin(configured) };
  const production = clean(input.production, true);
  if (production) return { url: production, source: 'production', isLocal: false };
  const preview = clean(input.preview, true);
  if (preview) return { url: preview, source: 'preview', isLocal: false };
  const current = clean(input.currentOrigin);
  if (current) return { url: current, source: 'current-origin', isLocal: isLocalOrigin(current) };
  return { url: null, source: 'none', isLocal: false };
}

/** Variables públicas inyectadas en el build; en el navegador se completan con el origen. */
export function publicUrlFromEnvironment(currentOrigin?: string): PublicBaseUrl {
  return resolvePublicBaseUrl({
    configured: process.env.NEXT_PUBLIC_SITE_URL,
    // Vercel define el dominio de producción también en las vistas previas: solo se usa
    // cuando el despliegue es de producción, para que el QR de una vista previa la abra a ella.
    production:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
        ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        : undefined,
    preview: process.env.NEXT_PUBLIC_VERCEL_URL,
    currentOrigin,
  });
}
