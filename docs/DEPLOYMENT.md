# DEPLOYMENT — Estado del despliegue, procedimiento y reversión

Versión 1.2 · Reingeniería v2 · 25 de septiembre de 2026. Requisitos y variables en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md).

## Estado actual

**URL pública de producción: <https://sql-select-lab.vercel.app>**

| Elemento            | Estado                                                                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rama y código       | `claude-finish-20260923`, sin fusionar con `main`. El código desplegado corresponde al commit `ebf8555`; los commits posteriores solo cambian documentación.                                                                                                                              |
| Proyecto Vercel     | `sql-select-lab` en el equipo personal `jorge-gutierrez1` (plan Hobby, gratuito). Preset Next.js, Node 24.x y funciones en `iad1` (Washington, D.C.).                                                                                                                                     |
| Producción          | `dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd` (`sql-select-4n3tg9rsx-jorge-gutierrez1.vercel.app`), publicada en `sql-select-lab.vercel.app`. Prueba de humo: 24/24.                                                                                                                                 |
| Vista previa        | **v2:** `sql-select-l0pnwv46e-jorge-gutierrez1.vercel.app` (`dpl_GpSFNR32nxPh8RXZPrXgDQJMudbB`), código del commit `45c3a70` con Oracle Cloud v2. Prueba de humo: 19/19. Protegida por la autenticación de Vercel.                                                                        |
| Oracle              | Oracle Autonomous Database 19c (Always Free, sa-bogota-1), con mTLS y cartera en variables de servidor ([ORACLE_SETUP.md](ORACLE_SETUP.md), opción C). Esquemas v1 (`SQL_LAB_OWNER`/`SQL_LAB_READER`, producción actual) y v2 (`SQL_LAB_V2_OWNER`/`SQL_LAB_V2_READER`, Preview) conviven. |
| Supabase            | Proyecto real con la migración aplicada, RLS verificado y Realtime conectado ([SUPABASE_SETUP.md](SUPABASE_SETUP.md)).                                                                                                                                                                    |
| Variables en Vercel | 12 por entorno (Production y Preview) más `NEXT_PUBLIC_SITE_URL` en Production. Los secretos son variables _sensitive_. Clasificación en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#variables-de-entorno).                                                                                 |

### Despliegues

| Fecha (2026) | Despliegue                                         | Destino    | Resultado                                                                                  |
| ------------ | -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| 24 sep.      | `dpl_J2N2BAFzWSjGH7hGt5DkURQtLCMs`                 | Producción | Involuntario, con preset «Other» (ver incidencia). Alias retirado; no sirve la aplicación. |
| 24 sep.      | Vista previa sin variables                         | Preview    | Lanzada sin verificar (bloqueo de permisos de aquella sesión).                             |
| 25 sep.      | `sql-select-9shg68ptn-jorge-gutierrez1.vercel.app` | Preview    | 20/22: la barra de Vercel chocaba con la CSP y había un error en el guion de prueba.       |
| 25 sep.      | `sql-select-k0pfbzctk-jorge-gutierrez1.vercel.app` | Preview    | 22/22.                                                                                     |
| 25 sep.      | `dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd`                 | Producción | 24/24 en `sql-select-lab.vercel.app`.                                                      |
| 25 sep.      | `dpl_GpSFNR32nxPh8RXZPrXgDQJMudbB`                 | Preview    | v2 (commit `45c3a70`, variables Oracle de Preview en v2): 19/19.                           |

### Prueba de humo de producción (25 de septiembre)

Todo lo siguiente pasó, sin errores de consola ni de red:

- las rutas `/`, `/learn`, `/presentation`, `/modules`, `/resources`, `/lab`, `/challenge`, `/presenter`, `/results` y `/live`, con la identidad académica completa;
- el video introductorio y el resumen se reproducen, con 110 subtítulos activos;
- Ctrl+K y la exposición 16:9 con teclado;
- `/lab` en «Oracle Database 19 (19.33.0.1.0)», con `ORA-01476` real;
- M01, y M10 calificada en Oracle Cloud;
- los códigos de sala no válidos;
- el QR de la escena 15 apunta a `https://sql-select-lab.vercel.app/challenge`;
- la CSP de producción no incluye orígenes de la barra de Vercel;
- la clave del profesor está configurada: una incorrecta se rechaza.

**No se creó una sala en producción:** exige la clave real del profesor, que no se escribe en pruebas automáticas. El flujo completo de la sala se verificó sobre la vista previa, contra el mismo proyecto Supabase: crear, QR, Realtime, dos móviles, recarga, llegada tardía, ranking, fin y resultados. Para cerrarlo en producción basta con crear una sala en `/presenter` con la clave real y abrir el QR con un móvil.

### Incidencia del primer despliegue

El 24 de septiembre de 2026 se ejecutó `vercel deploy` sin `--prod`. Al ser el primer despliegue de un proyecto sin Git conectado, el CLI 60.0.1 lo creó como producción (`dpl_J2N2BAFzWSjGH7hGt5DkURQtLCMs`) y le asignó `sql-select-lab.vercel.app`. Además, `vercel project add` había dejado el preset en «Other», así que solo se publicaba la carpeta `public/`.

Medidas tomadas:

- Se retiró el alias.
- Se fijó el preset Next.js.
- Desde entonces, cada vista previa lleva `--target preview`.

El 25 de septiembre, el despliegue de producción correcto recuperó el alias.

### Activación de v2 en producción (pendiente)

La vista previa v2 pasó la prueba de humo completa:

- las 12 rutas;
- 22 lecciones, 29 escenas y 46 fichas;
- el buscador con temas futuros;
- el QR;
- el laboratorio con SELECT, DISTINCT, WHERE, AND, OR, BETWEEN, IN, LIKE, IS NULL, DATE y ORDER BY en Oracle Database 19, más `ORA-01476` real y DELETE rechazado;
- M01, y M10 calificada con la salida real de Oracle;
- la sala por código;
- las cabeceras de seguridad.

Producción sigue sirviendo v1 (`dpl_61KPNiQv…` con `SQL_LAB_READER`). El cambio de las variables de Production no se ejecutó: el sistema de permisos de la sesión lo bloqueó. Pasos para activarla, en este orden:

1. Cambiar en Production `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` por los valores v2 (`ORACLE_CLOUD_USER`, `ORACLE_CLOUD_PASSWORD` y `ORACLE_CLOUD_SCHEMA` de `.env.oracle.local`), por la entrada estándar, como en «Cómo se despliega»:
   - `ORACLE_USER` y `ORACLE_SCHEMA` como configuración;
   - `ORACLE_PASSWORD` con `--sensitive`.
2. Desplegar en producción desde el commit v2: `npx vercel@60.0.1 --global-config .vercel/cli deploy --prod`.
3. Repetir la prueba de humo sobre `https://sql-select-lab.vercel.app`.

El código v2 exige EMPLEADOS v2 en su salud, así que variables y despliegue van juntos. No desplegar v2 con las variables v1.

Volver atrás:

- `vercel promote dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd`: cada despliegue conserva las variables con que se creó.
- Restaurar las tres variables con `ORACLE_CLOUD_PREVIOUS_*` para futuros despliegues.
- No se borra ningún esquema.

## Cómo se despliega

El CLI se ejecuta con `npx`, sin instalación global. La sesión se guarda en `.vercel/cli/`, que Git ignora y el CLI no sube. Todas las órdenes llevan `--global-config .vercel/cli`.

1. **Variables.** El valor se pasa por la entrada estándar, nunca como argumento:

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli env add ORACLE_PASSWORD production --sensitive --force
   ```

   Repetir con `preview`. La lista completa y su clasificación están en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#variables-de-entorno).

   En Preview, `PRESENTER_ACCESS_CODE` es una clave de prueba distinta de la real, guardada en `.env.vercel-preview.local` (ignorado).

2. **Vista previa.** Siempre con destino explícito:

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli deploy --target preview
   ```

   Las vistas previas quedan protegidas por la autenticación de Vercel. Para las pruebas automáticas se usa el secreto de «Protection Bypass for Automation», guardado también en `.env.vercel-preview.local`. Solo se envía a peticiones del propio despliegue.

3. **Prueba de humo.** Mismas comprobaciones que la de producción, más la sala completa con la clave de prueba.

4. **Producción:**

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli deploy --prod
   ```

   `NEXT_PUBLIC_SITE_URL` en Production es `https://sql-select-lab.vercel.app`. Con un dominio propio habría que cambiarla y volver a desplegar, porque se incrusta al compilar.

Para desplegar en cada `git push`, se puede conectar el repositorio con `vercel git connect`. Mientras la rama de trabajo no se fusione, conviene no hacerlo: la rama de producción de Vercel sería `main`.

## Reversión

| Situación                           | Acción                                                                                                                                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un despliegue de producción falla   | `vercel promote <url>` publica de nuevo un despliegue de producción anterior que funcionaba, sin recompilar. **No** usar `vercel rollback` hacia `dpl_J2N2BAFz…`: es el despliegue roto del 24 de septiembre. Hoy el único bueno es `dpl_61KPNiQv…`.                 |
| Hay que retirar la web de inmediato | `vercel project pause sql-select-lab` en una terminal propia (pide confirmación); `vercel project resume sql-select-lab` la reactiva.                                                                                                                                |
| Una variable incorrecta             | `vercel env add <NOMBRE> <entorno> --force` y volver a desplegar: todas las variables se fijan en cada despliegue, y las `NEXT_PUBLIC_*` además se incrustan al compilar.                                                                                            |
| Supabase                            | La migración solo añade tablas y funciones. Volver a una versión anterior de la web no exige tocar la base.                                                                                                                                                          |
| Oracle                              | La web solo lee `EMPLEADOS`: no hay datos que revertir. Si la salud falla, `/lab` se declara no disponible por sí solo. `node scripts/oracle-cloud.mjs setup` recrea el esquema y rota la contraseña de la cuenta lectora, que después hay que actualizar en Vercel. |
| Código                              | Cada fase es un commit en `claude-finish-20260923`. `git revert <commit>` y un nuevo despliegue.                                                                                                                                                                     |
