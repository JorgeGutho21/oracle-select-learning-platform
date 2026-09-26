# DEPLOYMENT — Estado del despliegue, procedimiento y reversión

Versión 2.0 · Producción v2 · 26 de septiembre de 2026. Requisitos y variables en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md).

## Estado actual

**URL pública de producción: <https://sql-select-lab.vercel.app>**

| Elemento            | Estado                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rama y código       | `claude-finish-20260923`, sin fusionar con `main`. El código desplegado corresponde al commit `37a2271` (dataset v2); los commits posteriores solo cambian documentación.                                                                                                                                     |
| Proyecto Vercel     | `sql-select-lab` en el equipo personal `jorge-gutierrez1` (plan Hobby, gratuito). Preset Next.js, Node 24.x y funciones en `iad1` (Washington, D.C.).                                                                                                                                                         |
| Producción          | **v2:** `dpl_3NAgTPb2pFztqa6Mxx4oHNNK2c7w` (`sql-select-7z5254ibo-jorge-gutierrez1.vercel.app`), publicada en `sql-select-lab.vercel.app` desde el 26 de septiembre. Prueba de humo: 14/14 (más la sala real 5/5). Vuelta atrás: `dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd` (v1).                                     |
| Vista previa        | **v2:** `sql-select-l0pnwv46e-jorge-gutierrez1.vercel.app` (`dpl_GpSFNR32nxPh8RXZPrXgDQJMudbB`), código del commit `45c3a70` con Oracle Cloud v2. Prueba de humo: 19/19. Protegida por la autenticación de Vercel.                                                                                            |
| Oracle              | Oracle Autonomous Database 19c (Always Free, sa-bogota-1), con mTLS y cartera en variables de servidor ([ORACLE_SETUP.md](ORACLE_SETUP.md), opción C). Production y Preview usan v2 (`SQL_LAB_V2_OWNER`/`SQL_LAB_V2_READER`); v1 (`SQL_LAB_OWNER`/`SQL_LAB_READER`, 6 filas) sigue intacta para volver atrás. |
| Supabase            | Proyecto real con la migración aplicada, RLS verificado y Realtime conectado ([SUPABASE_SETUP.md](SUPABASE_SETUP.md)).                                                                                                                                                                                        |
| Variables en Vercel | 12 por entorno (Production y Preview) más `NEXT_PUBLIC_SITE_URL` en Production. Los secretos son variables _sensitive_. Clasificación en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#variables-de-entorno).                                                                                                     |

### Despliegues

| Fecha (2026) | Despliegue                                         | Destino    | Resultado                                                                                          |
| ------------ | -------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 24 sep.      | `dpl_J2N2BAFzWSjGH7hGt5DkURQtLCMs`                 | Producción | Involuntario, con preset «Other» (ver incidencia). Alias retirado; no sirve la aplicación.         |
| 24 sep.      | Vista previa sin variables                         | Preview    | Lanzada sin verificar (bloqueo de permisos de aquella sesión).                                     |
| 25 sep.      | `sql-select-9shg68ptn-jorge-gutierrez1.vercel.app` | Preview    | 20/22: la barra de Vercel chocaba con la CSP y había un error en el guion de prueba.               |
| 25 sep.      | `sql-select-k0pfbzctk-jorge-gutierrez1.vercel.app` | Preview    | 22/22.                                                                                             |
| 25 sep.      | `dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd`                 | Producción | 24/24 en `sql-select-lab.vercel.app`.                                                              |
| 25 sep.      | `dpl_GpSFNR32nxPh8RXZPrXgDQJMudbB`                 | Preview    | v2 (commit `45c3a70`, variables Oracle de Preview en v2): 19/19.                                   |
| 26 sep.      | `dpl_3NAgTPb2pFztqa6Mxx4oHNNK2c7w`                 | Producción | v2 (commit `37a2271`, variables Oracle de Production en v2): 14/14 en `sql-select-lab.vercel.app`. |

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

### Activación de v2 en producción (26 de septiembre de 2026)

1. **Variables (solo Production, por la entrada estándar, sin mostrar valores):** `ORACLE_USER` = `SQL_LAB_V2_READER`, `ORACLE_SCHEMA` = `SQL_LAB_V2_OWNER` y `ORACLE_PASSWORD` = contraseña de la cuenta lectora v2 (`ORACLE_CLOUD_PASSWORD` de `.env.oracle.local`, comprobada iniciando sesión como `SQL_LAB_V2_READER`; no es la de ADMIN). Las tres quedaron como variables secretas. No cambiaron la cartera, el descriptor, Supabase, `PRESENTER_ACCESS_CODE` ni `NEXT_PUBLIC_SITE_URL`, que es `https://sql-select-lab.vercel.app`.
2. **Despliegue nuevo:** `vercel deploy --prod` desde el repositorio en `37a2271` con el árbol limpio, sin redesplegar uno anterior. Vercel no registra metadatos de Git en despliegues del CLI. Las huellas SHA-1 de los archivos publicados (API de Vercel) coinciden con las del commit, incluido `mini-check.tsx`, que solo cambió en `37a2271`.
3. **Alias:** `sql-select-lab.vercel.app` apunta al despliegue nuevo.

**Prueba de humo en `https://sql-select-lab.vercel.app` (14/14):**

- **Sin problemas técnicos:** ningún error de JavaScript, bloqueo de CSP, respuesta 500 ni llamada a localhost.
- **Rutas:** las 10 rutas públicas, con sus estilos, scripts, logotipo e identidad académica.
- **Dataset v2:** `SELECT *` devuelve 12 columnas y 20 filas en Oracle Database 19.
- **Laboratorio:** 18 consultas en Oracle Cloud v2 con los recuentos del dataset: SELECT/FROM, columnas, expresión, alias, DISTINCT, WHERE, `>=`, `<>`, AND, OR, NOT, BETWEEN, IN, LIKE, IS NULL, IS NOT NULL, DATE y ORDER BY. Además, `ORA-01476` real y DELETE sin enviar.
- **Diagnóstico:** 10 errores con grupo, posición, lo encontrado, pista y corrección.
- **Challenge:** M01; M10 calificada con la salida real de Oracle (primero incorrecta por valores, luego correcta); las diez misiones abren.
- **Exposición:** 29 escenas en 16:9 sin tablas cortadas, con anterior, siguiente, teclado, selector y pantalla completa.
- **QR:** el de la escena 27 codifica `https://sql-select-lab.vercel.app/challenge`.
- **Estudio:** 22 lecciones en 8 bloques; alias y AS; mini comprobación con pistas; navegación entre bloques.
- **Buscador:** los 16 términos; los 7 futuros, «Próximamente» con su ficha en `/modules` (46 fichas).
- **Videos y subtítulos:** los dos videos, subtítulos WebVTT en español, rangos HTTP y ningún rótulo de duración.
- **Sala:** los códigos no válidos; una sala inexistente consultada en el Supabase real; el formulario del profesor; `/results`.
- **Seguridad:** cabeceras correctas, y ningún secreto local aparece en el HTML ni en los scripts públicos.
- **Responsive:** 1920×1080, 1366×768 y 390×844 sin desbordes.

**Sala en vivo con Supabase real (5/5).** Se probó desde un servidor local con la clave de prueba de los fixtures, contra el proyecto Supabase de producción. Cubre:

- crear la sala, el QR y la entrada desde el móvil;
- la espera, el Challenge en vivo y el ranking por Realtime;
- el cierre y los resultados;
- el alias repetido, la recarga y la llegada tardía;
- la accesibilidad.

No se creó una sala en el dominio público: exige la clave real del profesor, que no se escribe en pruebas automáticas. Basta con crearla una vez en `/presenter`.

**Volver a v1** si fuera necesario:

1. `vercel promote dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd`: conserva sus variables v1 y no recompila.
2. Restaurar `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` de Production desde `ORACLE_CLOUD_PREVIOUS_*` para los despliegues futuros.

Los esquemas v1 no se borraron. **No** usar `vercel rollback` hacia `dpl_J2N2BAFz…` (el despliegue roto del 24 de septiembre).

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

| Situación                           | Acción                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un despliegue de producción falla   | `vercel promote <url>` publica de nuevo un despliegue de producción anterior que funcionaba, sin recompilar. **No** usar `vercel rollback` hacia `dpl_J2N2BAFz…`: es el despliegue roto del 24 de septiembre. Hoy producción es `dpl_3NAgTPb2…` (v2) y la vuelta atrás a v1 es `dpl_61KPNiQv…`. |
| Hay que retirar la web de inmediato | `vercel project pause sql-select-lab` en una terminal propia (pide confirmación); `vercel project resume sql-select-lab` la reactiva.                                                                                                                                                           |
| Una variable incorrecta             | `vercel env add <NOMBRE> <entorno> --force` y volver a desplegar: todas las variables se fijan en cada despliegue, y las `NEXT_PUBLIC_*` además se incrustan al compilar.                                                                                                                       |
| Supabase                            | La migración solo añade tablas y funciones. Volver a una versión anterior de la web no exige tocar la base.                                                                                                                                                                                     |
| Oracle                              | La web solo lee `EMPLEADOS`: no hay datos que revertir. Si la salud falla, `/lab` se declara no disponible por sí solo. `node scripts/oracle-cloud.mjs setup` recrea el esquema y rota la contraseña de la cuenta lectora, que después hay que actualizar en Vercel.                            |
| Código                              | Cada fase es un commit en `claude-finish-20260923`. `git revert <commit>` y un nuevo despliegue.                                                                                                                                                                                                |
