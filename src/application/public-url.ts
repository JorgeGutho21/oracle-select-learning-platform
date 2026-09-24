/**
 * URL pública de la plataforma para enlaces y códigos QR, sin dominio fijo en el código:
 * 1. `NEXT_PUBLIC_SITE_URL`, la dirección publicada que configura quien despliega.
 * 2. En despliegues de vista previa, la URL que asigna la plataforma (`NEXT_PUBLIC_VERCEL_URL`).
 * 3. En desarrollo, el origen de la página abierta (localhost o la IP de la red local).
 */

export type PublicUrlSource = 'configured' | 'preview' | 'current-origin' | 'none';

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
  readonly preview?: string | undefined;
  readonly currentOrigin?: string | undefined;
}): PublicBaseUrl {
  const configured = clean(input.configured);
  if (configured)
    return { url: configured, source: 'configured', isLocal: isLocalOrigin(configured) };
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
    preview: process.env.NEXT_PUBLIC_VERCEL_URL,
    currentOrigin,
  });
}
