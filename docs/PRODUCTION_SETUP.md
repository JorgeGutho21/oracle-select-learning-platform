# PRODUCTION_SETUP — Servicios, variables y alojamiento

Versión 1.1 · Fase 11 · 25 de septiembre de 2026. Relacionado con [DEPLOYMENT.md](DEPLOYMENT.md), [ORACLE_SETUP.md](ORACLE_SETUP.md), [SUPABASE_SETUP.md](SUPABASE_SETUP.md) y [FINAL_AUDIT.md](FINAL_AUDIT.md).

Este documento no contiene secretos. Los valores reales viven en archivos locales ignorados por Git y por Vercel, y en el panel de Vercel:

- `.env.local`: Supabase, clave del profesor y Oracle local.
- `.env.oracle.local`: Oracle Cloud.
- `.env.vercel-preview.local`: clave de prueba de las vistas previas y secreto de automatización.
- `.secrets/`: cartera de Oracle.

## Servicios de producción

| Servicio                                                  | Para qué                                                                    | Estado                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Vercel (Hobby, gratuito)                                  | Páginas, Server Functions, videos, subtítulos y portadas                    | En producción: <https://sql-select-lab.vercel.app>                            |
| Oracle Autonomous Database 19c (Always Free, sa-bogota-1) | `/lab` y la calificación de M10                                             | Conectado con mTLS; 21/21 pruebas reales y prueba de humo en producción       |
| Supabase (plan gratuito, us-west-2)                       | Sala en vivo: salas, participantes, intentos, pistas y resultados; Realtime | Migración aplicada, RLS verificado y sala completa probada en la vista previa |
| Videos                                                    | V01 (introducción) y V02 (resumen, con subtítulos)                          | En `public/media`, viajan con el despliegue                                   |

Si Oracle o Supabase fallan, la función afectada se declara no disponible («Oracle no conectado», «sala no configurada») y el resto sigue funcionando: Home, Estudio, Exposición, buscador, módulos, recursos, videos y M01–M09. Nunca se simula el servicio.

## Variables de entorno

Lista obtenida del código (`process.env` en `src/`, `next.config.ts` y `scripts/`).

Tipos:

- **REQUIRED:** imprescindible para su función.
- **OPTIONAL:** tiene un valor por defecto o una alternativa.

Estados:

- **AVAILABLE:** configurada en Vercel.
- **LOCAL:** solo existe en archivos de esta máquina.
- **NO USADA:** el código no la necesita en ese entorno.

| Variable                                 | Tipo               | Ámbito                       | Función                                                     | Vercel Production                   | Vercel Preview                                |
| ---------------------------------------- | ------------------ | ---------------------------- | ----------------------------------------------------------- | ----------------------------------- | --------------------------------------------- |
| `ORACLE_USER`                            | REQUIRED           | Servidor                     | Cuenta lectora `SQL_LAB_V2_READER`                          | AVAILABLE                           | AVAILABLE                                     |
| `ORACLE_PASSWORD`                        | REQUIRED           | Servidor, secreta            | Contraseña de la cuenta lectora                             | AVAILABLE (sensitive)               | AVAILABLE (sensitive)                         |
| `ORACLE_CONNECT_STRING`                  | REQUIRED           | Servidor, secreta            | Descriptor TCPS del servicio `sqlselect_tp`                 | AVAILABLE (sensitive)               | AVAILABLE (sensitive)                         |
| `ORACLE_SCHEMA`                          | OPTIONAL           | Servidor                     | Propietario de `EMPLEADOS` (`SQL_LAB_OWNER`)                | AVAILABLE                           | AVAILABLE                                     |
| `ORACLE_WALLET_PEM_BASE64`               | REQUIRED con mTLS  | Servidor, secreta            | `ewallet.pem` de la cartera, en base64                      | AVAILABLE (sensitive)               | AVAILABLE (sensitive)                         |
| `ORACLE_WALLET_PASSWORD`                 | REQUIRED con mTLS  | Servidor, secreta            | Contraseña de la cartera                                    | AVAILABLE (sensitive)               | AVAILABLE (sensitive)                         |
| `ORACLE_POOL_MAX`                        | OPTIONAL           | Servidor                     | Conexiones por instancia (10 por defecto)                   | `4`                                 | `4`                                           |
| `ORACLE_QUEUE_MAX` / `ORACLE_TIMEOUT_MS` | OPTIONAL           | Servidor                     | Cola (60) y plazo (5000 ms)                                 | Por defecto                         | Por defecto                                   |
| `SUPABASE_URL`                           | REQUIRED           | Servidor                     | URL del proyecto                                            | AVAILABLE                           | AVAILABLE                                     |
| `SUPABASE_SECRET_KEY`                    | REQUIRED           | Servidor, secreta            | Clave `sb_secret_…`. **Nunca** `NEXT_PUBLIC_`               | AVAILABLE (sensitive)               | AVAILABLE (sensitive)                         |
| `SUPABASE_SERVICE_ROLE_KEY`              | OPTIONAL           | Servidor, secreta            | Nombre antiguo de la clave secreta                          | NO USADA                            | NO USADA                                      |
| `NEXT_PUBLIC_SUPABASE_URL`               | OPTIONAL           | Pública, se fija en el build | Realtime en el navegador y origen de la CSP                 | AVAILABLE                           | AVAILABLE                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | OPTIONAL           | Pública, se fija en el build | Clave `sb_publishable_…` para Realtime; sin acceso a tablas | AVAILABLE                           | AVAILABLE                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | OPTIONAL           | Pública                      | Nombre antiguo de la clave publishable                      | NO USADA                            | NO USADA                                      |
| `PRESENTER_ACCESS_CODE`                  | REQUIRED           | Servidor, secreta            | Clave del profesor para crear salas                         | AVAILABLE, la real (sensitive)      | AVAILABLE, una de prueba distinta (sensitive) |
| `NEXT_PUBLIC_SITE_URL`                   | OPTIONAL en Vercel | Pública, se fija en el build | Dirección de los QR y de OpenGraph                          | `https://sql-select-lab.vercel.app` | NO USADA (usa la URL de la vista previa)      |
| `CLASSROOM_BACKEND`                      | OPTIONAL           | Servidor                     | `memory` solo en desarrollo y pruebas                       | NO USADA (vacía)                    | NO USADA (vacía)                              |

Variables que no se configuran a mano:

- `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_VERCEL_ENV`, `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` y `VERCEL_ENV` las inyecta Vercel. Los QR usan las tres primeras cuando falta `NEXT_PUBLIC_SITE_URL`. `VERCEL_ENV=preview` añade a la CSP los orígenes de la barra de Vercel, solo en vistas previas.
- `NODE_ENV` y `NEXT_RUNTIME` las fija Next.
- `CI` solo afecta a Playwright.
- `ORACLE_LOCAL_*` las usa `scripts/oracle-local.mjs`.
- `ORACLE_CLOUD_*` las escribe y lee `scripts/oracle-cloud.mjs` en `.env.oracle.local`; nunca van a Vercel con ese nombre.

Las `NEXT_PUBLIC_*` se incrustan al compilar: tras cambiarlas hay que volver a desplegar.

## Alojamiento: Vercel

- **Compatibilidad:** Next.js 16 (App Router), Server Functions en Node 24 y `oracledb` en modo Thin (JavaScript puro) como `serverExternalPackages`. La cartera llega como `walletContent`, sin archivos.
- **Subida:** el CLI de Vercel no lee `.gitignore`. [`.vercelignore`](../.vercelignore) excluye `.env*`, `.secrets/`, `PASSWORD.txt`, carteras, certificados, compilaciones, capturas y registros. La subida ronda los 36 MB, bajo el límite de 100 MB del plan Hobby.
- **Cabeceras:** CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy` y COOP. `/media/*` tiene caché de un día; `.vtt` y `.txt` se sirven en UTF-8.
- **Secretos:** ningún valor secreto aparece en los 31 archivos HTML, JS y CSS que sirve producción (búsqueda automatizada, 25 de septiembre). No hay mapas de código públicos, y `/.env*`, `/PASSWORD.txt`, `/.secrets/*` y `/.git/*` responden 404.
- **Región de funciones:** `iad1` (Washington), a medio camino entre Oracle (Bogotá) y Supabase (Oregón). En la vista previa, un acierto tardó unos 3 s en llegar al ranking del profesor.
- **Arranque en frío:** `src/instrumentation.ts` precalienta Oracle y espera como máximo 8 s.

### Videos

Los dos MP4 del autor (H.264/AAC, índice `moov` al inicio, 9,5 MB y 21 MB) se sirven desde `public/media` por el CDN de Vercel, con peticiones por rangos y `preload="none"`: nada se descarga hasta pulsar reproducir.

V02 lleva además subtítulos WebVTT revisados y una transcripción. Cada reproducción completa consume unos 10 o 21 MB de la transferencia incluida en el plan.

## Seguridad en producción

- **Secretos solo en el servidor:**
  - `ORACLE_PASSWORD`, `ORACLE_WALLET_*`, `SUPABASE_SECRET_KEY` y `PRESENTER_ACCESS_CODE`.
  - Públicas solo son la URL del sitio y el par URL/publishable de Supabase.
  - La clave publishable no abre ninguna tabla ni función (`42501`, verificado en el proyecto real).
  - Si por error se configura una clave secreta como publishable, el servidor no la entrega al navegador.
- **Oracle:** la cuenta lectora solo tiene `CREATE SESSION` y `READ`; ADMIN se rechaza como usuario de la aplicación. La contraseña de ADMIN solo se usó para preparar el esquema y conviene cambiarla.
- **Cookies de la sala:** `httpOnly`, `SameSite=Lax` y `Secure`, con un token de 256 bits; la base guarda su huella SHA-256.
- **Códigos de sala:** se generan con `crypto.randomBytes`.
- **Clave del profesor:** se compara en tiempo constante, con límite de intentos por dirección.
- **Laboratorio:** sin límite de peticiones por IP a propósito (MINOR M-03). En un aula, todos los estudiantes salen por la misma IP pública y un límite por IP los bloquearía. Protegen la cuenta lectora, el analizador, el grupo de 4 conexiones por instancia, la cola y el plazo.

## Pendiente del responsable

1. Crear una sala en producción con la clave real en `/presenter` y abrir su QR con un móvil. Es la única parte de la sala que no se ejecutó en producción.
2. Cambiar la contraseña de ADMIN de Oracle Cloud, que quedó escrita en una conversación; la aplicación no la usa.
3. Validar el uso público del emblema institucional ([public/identity/README.md](../public/identity/README.md)).
4. Opcional: ensayo de carga con 50–60 móviles ([SUPABASE_SETUP.md](SUPABASE_SETUP.md)).
