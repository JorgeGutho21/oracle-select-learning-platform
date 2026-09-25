import type { NextConfig } from 'next';
import path from 'node:path';

const isDev = process.env.NODE_ENV === 'development';

/** Origen HTTPS y WebSocket del proyecto Supabase para el aviso en tiempo real (opcional). */
function supabaseOrigins(): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configured) return '';
  try {
    const url = new URL(configured);
    return url.protocol === 'https:' ? ` ${url.origin} wss://${url.host}` : '';
  } catch {
    return '';
  }
}

/**
 * Política de contenido sin nonces (guía de Next «Without Nonces»): las páginas estáticas
 * siguen siéndolo. Los scripts solo salen del propio sitio; 'unsafe-inline' lo exigen los
 * scripts de hidratación de Next. Imagen, audio/video e iframes admiten HTTPS para el
 * proveedor de los videos de la unidad, que aún no está elegido (videos.ts). No se añade
 * upgrade-insecure-requests: la sala local por http en la red del aula dejaría de cargar.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "media-src 'self' https:",
  "frame-src 'self' https:",
  `connect-src 'self'${supabaseOrigins()}${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Nadie puede incrustar la plataforma (consola del profesor incluida) en otro sitio.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // El código de la sala va en la URL: a otros sitios solo se envía el origen.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Solo tiene efecto en respuestas HTTPS; por http (desarrollo, aula local) se ignora.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // El driver de Oracle se carga desde node_modules en el servidor, sin empaquetarlo.
  serverExternalPackages: ['oracledb'],
  sassOptions: {
    quietDeps: true,
    // Rutas nativas también para imports internos de Bootstrap en Windows.
    loadPaths: [path.resolve('node_modules'), path.resolve('node_modules/bootstrap/scss')],
    silenceDeprecations: ['import'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Videos y portadas de public/media: nombres estables, así que caché de un día y
      // revalidación en segundo plano en lugar de «immutable».
      {
        source: '/media/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // Subtítulos y transcripción en UTF-8 aunque el servidor no conozca la extensión.
      {
        source: '/media/:file([^/]+\.vtt)',
        headers: [{ key: 'Content-Type', value: 'text/vtt; charset=utf-8' }],
      },
      {
        source: '/media/:file([^/]+\.txt)',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
    ];
  },
};

export default nextConfig;
