# PRODUCTION_SETUP — Servicios, variables y alojamiento

Versión 1.0 · Fase 10 · 24 de septiembre de 2026. Relacionado con [DEPLOYMENT.md](DEPLOYMENT.md), [ORACLE_SETUP.md](ORACLE_SETUP.md), [SUPABASE_SETUP.md](SUPABASE_SETUP.md) y [FINAL_AUDIT.md](FINAL_AUDIT.md).

Este documento no contiene secretos. Los valores reales se escriben en `.env.local` para desarrollo y en el panel del proveedor para despliegue. Ninguno de los dos se versiona.

## Qué necesita producción

| Servicio              | Para qué                                                  | Estado en este equipo                                        | Estado para producción                                 |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| Hosting Node (Vercel) | Páginas, Server Functions, videos y portadas              | El build de producción pasa                                  | Falta vincular un proyecto (requiere iniciar sesión)   |
| Oracle alcanzable     | `/lab` y la calificación de M10                           | Oracle 23ai Free en Podman/WSL, solo en `127.0.0.1:1522`     | **Falta:** Vercel no puede llegar a la instancia local |
| Supabase              | Sala en vivo: salas, participantes, intentos y resultados | Sin proyecto. Las pruebas usan memoria y PostgreSQL embebido | **Falta:** proyecto, migración y claves                |
| Videos                | V01 y V02                                                 | En `public/media`, 31 MB                                     | Listos: viajan con el despliegue                       |

Sin Oracle ni Supabase la plataforma se despliega y funciona. Home, Estudio, Exposición, buscador, módulos, recursos, videos y las misiones M01–M09 no dependen de ellos. En ese caso, `/lab` y M10 informan «Oracle no conectado» y `/presenter` informa que la sala no está configurada. Nunca se simula el servicio.

## Variables de entorno

Lista obtenida del código (`process.env` en `src/`, `next.config.ts` y `scripts/`), no de suposiciones.

Tipos:

- **REQUIRED:** imprescindible para que la función correspondiente exista en producción.
- **OPTIONAL:** tiene un valor por defecto o una alternativa.

Estados:

- **AVAILABLE:** existe un valor utilizable.
- **MISSING:** falta.
- **LOCAL:** existe en `.env.local`, pero solo sirve en esta máquina.

| Variable                        | Tipo                                         | Ámbito                       | Función                                                                                                                                                                          | Local                     | Producción                                                                 |
| ------------------------------- | -------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `ORACLE_USER`                   | REQUIRED                                     | Servidor                     | Cuenta lectora del laboratorio                                                                                                                                                   | LOCAL                     | MISSING                                                                    |
| `ORACLE_PASSWORD`               | REQUIRED                                     | Servidor, secreta            | Contraseña de esa cuenta                                                                                                                                                         | LOCAL                     | MISSING                                                                    |
| `ORACLE_CONNECT_STRING`         | REQUIRED                                     | Servidor                     | `host:puerto/servicio` o descriptor TLS                                                                                                                                          | LOCAL (`127.0.0.1:1522`)  | MISSING                                                                    |
| `ORACLE_SCHEMA`                 | OPTIONAL                                     | Servidor                     | Propietario de `EMPLEADOS` si no es la cuenta lectora                                                                                                                            | LOCAL                     | MISSING (necesaria si se replica la instalación local)                     |
| `ORACLE_POOL_MAX`               | OPTIONAL                                     | Servidor                     | Conexiones del grupo (10)                                                                                                                                                        | Por defecto               | Por defecto                                                                |
| `ORACLE_QUEUE_MAX`              | OPTIONAL                                     | Servidor                     | Peticiones en espera (60)                                                                                                                                                        | Por defecto               | Por defecto                                                                |
| `ORACLE_TIMEOUT_MS`             | OPTIONAL                                     | Servidor                     | Plazo total por consulta (5000 ms)                                                                                                                                               | Por defecto               | Por defecto; subir si la base está lejos                                   |
| `SUPABASE_URL`                  | REQUIRED                                     | Servidor                     | URL del proyecto para la sala                                                                                                                                                    | MISSING                   | MISSING                                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | REQUIRED                                     | Servidor, secreta            | Clave de servicio. **Nunca** con prefijo `NEXT_PUBLIC_`                                                                                                                          | MISSING                   | MISSING                                                                    |
| `PRESENTER_ACCESS_CODE`         | REQUIRED                                     | Servidor, secreta            | Clave del profesor para crear salas                                                                                                                                              | Solo la de las E2E        | MISSING                                                                    |
| `NEXT_PUBLIC_SITE_URL`          | OPTIONAL en Vercel, REQUIRED fuera de Vercel | Pública, se fija en el build | Dirección de los QR y de OpenGraph. En un despliegue de producción de Vercel sin ella se usa el dominio de producción del proyecto (`NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`) | No aplica (usa el origen) | MISSING. Hace falta si se usa un dominio propio o se aloja fuera de Vercel |
| `NEXT_PUBLIC_SUPABASE_URL`      | OPTIONAL                                     | Pública, se fija en el build | Aviso en tiempo real; además abre ese origen en la CSP                                                                                                                           | MISSING                   | MISSING (sin ella, la sala consulta cada pocos segundos)                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | OPTIONAL                                     | Pública, se fija en el build | Clave `anon`: no da acceso a tablas ni funciones                                                                                                                                 | MISSING                   | MISSING                                                                    |
| `CLASSROOM_BACKEND`             | OPTIONAL                                     | Servidor                     | Vacía en producción; `memory` solo en desarrollo y pruebas                                                                                                                       | `memory` en las E2E       | Vacía                                                                      |

Variables que no se configuran a mano:

- `NEXT_PUBLIC_VERCEL_URL`, `NEXT_PUBLIC_VERCEL_ENV` y `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` las inyecta Vercel en cada despliegue. El QR usa la segunda y la tercera en producción, y la primera en las vistas previas.
- `NODE_ENV` y `NEXT_RUNTIME` las fija Next.
- `CI` solo afecta a Playwright.
- `ORACLE_LOCAL_ENGINE`, `ORACLE_LOCAL_PORT` y `ORACLE_LOCAL_WSL_DISTRO` solo las usa `scripts/oracle-local.mjs`.

Las variables `NEXT_PUBLIC_*` se incrustan al compilar: tras cambiarlas hay que volver a desplegar. En particular, la CSP solo permite conectar con Supabase si `NEXT_PUBLIC_SUPABASE_URL` existía durante el build.

## Alojamiento: Vercel

La aplicación es compatible con Vercel sin archivos de configuración propios:

- Next.js 16 con App Router.
- Páginas estáticas donde es posible.
- Server Functions en el runtime Node.js.
- `oracledb` en modo Thin (JavaScript puro, sin Oracle Client) declarado en `serverExternalPackages`.

Comprobaciones hechas en el repositorio:

- **Node:** `engines` admite 22.12+ y 24; Vercel elige 24.x.
- **Archivos subidos:** el CLI de Vercel no lee `.gitignore`. El archivo [`.vercelignore`](../.vercelignore) excluye `.env*`, compilaciones, capturas y registros. La subida queda en unos 34 MB, bajo el límite de 100 MB del plan Hobby.
- **Cabeceras:** CSP, `X-Frame-Options`, HSTS y demás salen de `next.config.ts` y Vercel las respeta. `/media/*` usa `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
- **Mapas de código:** no se publican (`productionBrowserSourceMaps` conserva su valor por defecto, desactivado). El build no contiene valores de `.env.local`: se verificó buscándolos en `.next`.
- **Región de funciones:** elegir la más cercana a Oracle y a Supabase (Project Settings → Functions). La latencia entre función y base cuenta dentro de `ORACLE_TIMEOUT_MS`.
- **Arranque en frío:** `src/instrumentation.ts` precalienta Oracle y espera como máximo 8 s. Si Oracle está configurado pero caído, el primer arranque de cada instancia tarda esos 8 s.

### Videos

Los dos MP4 del autor (H.264/AAC, índice `moov` al inicio, 9,5 MB y 21 MB) se sirven desde `public/media` como archivos estáticos del CDN, con rangos HTTP. Motivos para no usar un servicio externo:

- No hay cuenta de video contratada.
- Una plataforma de terceros añadiría seguimiento y dominios a la CSP.
- El tamaño está muy por debajo de los límites de Git (100 MB por archivo) y de Vercel.

Cada reproducción completa consume unos 10 o 21 MB de la transferencia incluida. Si el tráfico crece, basta con cambiar `source` en `src/features/resources/domain/videos.ts` por una URL HTTPS externa.

## Oracle en producción

`ORACLE_CONNECT_STRING=127.0.0.1:1522/FREEPDB1` apunta a la máquina de desarrollo. Desde Vercel esa dirección es la propia función, así que el laboratorio mostraría «Oracle no conectado». No hay forma legítima de reutilizar la instancia local para producción: exponer este PC a Internet dependería de que esté encendido y abriría un puerto de administración.

Requisitos de la instancia de producción:

1. **Red:** un puerto TCP o TCPS alcanzable desde Internet. Las funciones de Vercel (plan Hobby) no tienen IP de salida fija, así que no sirve una lista de IP permitidas. La protección es la cuenta lectora sin privilegios y, preferiblemente, TLS.
2. **Datos:** esquema propietario con `EMPLEADOS` cargada desde [`oracle/empleados-select-v1.sql`](../oracle/empleados-select-v1.sql).
3. **Cuenta:** cuenta lectora con solo `CREATE SESSION` y `READ ON <propietario>.EMPLEADOS`. El servidor la verifica cada 30 s y se niega a ejecutar si tiene más privilegios o si los datos difieren del dataset.

Opciones viables:

- **Oracle Autonomous Database, nivel Always Free de Oracle Cloud.**
  - Requiere una cuenta de Oracle Cloud; el registro pide verificar una tarjeta, aunque el nivel Always Free no genera cargos. Crear esa cuenta es una decisión del responsable.
  - En la consola de la base, activar el acceso TLS sin cartera («mutual TLS not required»). Esa opción exige definir una lista de acceso; como Vercel no tiene IP fija, la lista debe admitir cualquier origen.
  - Copiar la cadena de conexión **TLS** del panel tal cual en `ORACLE_CONNECT_STRING`. El modo Thin de `oracledb` acepta el descriptor completo y el certificado público de Oracle, sin cartera ni cambios de código.
- **Instancia de la universidad** publicada en un puerto accesible desde Internet, con las mismas cuentas.

Preparación de la base como administrador, desde SQL Developer Web o SQL\*Plus. En Autonomous Database el tablespace es `DATA`; en otras instalaciones, el tablespace permanente por defecto:

```sql
CREATE USER SQL_LAB_OWNER NO AUTHENTICATION DEFAULT TABLESPACE DATA QUOTA 10M ON DATA;
ALTER SESSION SET CURRENT_SCHEMA = SQL_LAB_OWNER;
-- Pegar aquí el contenido de oracle/empleados-select-v1.sql (CREATE TABLE, 6 INSERT y COMMIT).
ALTER SESSION SET CURRENT_SCHEMA = ADMIN;
CREATE USER SQL_LAB_READER IDENTIFIED BY "<contraseña larga y aleatoria>";
GRANT CREATE SESSION TO SQL_LAB_READER;
GRANT READ ON SQL_LAB_OWNER.EMPLEADOS TO SQL_LAB_READER;
```

Después se configuran cuatro variables:

- `ORACLE_USER=SQL_LAB_READER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_SCHEMA=SQL_LAB_OWNER`

**M10 solo es plenamente funcional en producción cuando `/lab` muestra «Conectado» en ese despliegue.** Hasta entonces, M10 revisa la estructura sin puntuar y lo dice.

## Supabase en producción

Guía completa en [SUPABASE_SETUP.md](SUPABASE_SETUP.md): crear el proyecto (plan gratuito), aplicar `supabase/migrations/20260924120000_classroom.sql` y definir las variables.

En Vercel **no** debe usarse `CLASSROOM_BACKEND=memory`: cada petición puede caer en una instancia distinta y la sala se perdería.

`PRESENTER_ACCESS_CODE` es la clave que el profesor escribe en `/presenter`. Debe ser larga y no adivinable, y se configura solo en el servidor.

## Seguridad en producción

- **Secretos solo en el servidor:** `ORACLE_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` y `PRESENTER_ACCESS_CODE`. Las únicas variables públicas son la URL del sitio y el par URL/anon de Supabase. La clave `anon` no abre ninguna tabla gracias a RLS sin políticas y a funciones ejecutables solo por `service_role`.
- **Cookies de la sala:** `httpOnly`, `SameSite=Lax` y `Secure` fuera de `localhost`. Guardan un token de 256 bits; la base solo guarda su huella SHA-256.
- **Códigos de sala:** se generan con `crypto.randomBytes`.
- **Clave del profesor:** se compara en tiempo constante, con un límite de intentos por dirección y por instancia. En Vercel la dirección sale de `x-forwarded-for`, que fija la plataforma.
- **Laboratorio:** sin límite de peticiones por usuario (MINOR M-03). Cada consulta pasa el analizador y usa la cuenta lectora, el grupo de 10 conexiones, la cola de 60 y el plazo de 5 s. Si hiciera falta frenar abusos, el firewall de Vercel permite reglas por IP sin tocar el código.

## Lista previa a producción

1. Instancia Oracle alcanzable preparada y las cuatro variables Oracle en Vercel (Production y Preview).
2. Proyecto Supabase con la migración aplicada, sus variables y `PRESENTER_ACCESS_CODE`.
3. Con un dominio propio, `NEXT_PUBLIC_SITE_URL` con ese dominio y un nuevo despliegue. Sin él, el QR de producción usa el dominio `*.vercel.app` del proyecto.
4. Vista previa con la prueba de humo de [DEPLOYMENT.md](DEPLOYMENT.md): `/lab` «Conectado», M10 puntuado, sala creada, QR abierto desde dos móviles reales, ranking y resultados.
5. Validación del uso público del emblema institucional por el responsable académico ([public/identity/README.md](../public/identity/README.md)). No bloquea técnicamente el sitio.
