# DEPLOYMENT — Estado del despliegue, procedimiento y reversión

Versión 1.0 · Fase 10 · 24 de septiembre de 2026. Requisitos y variables en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md).

## Estado actual

| Elemento            | Estado                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rama y código       | `claude-finish-20260923`. Sin fusionar con `main`.                                                                                                                                     |
| Proyecto Vercel     | `sql-select-lab` en el equipo personal `jorge-gutierrez1` (plan Hobby). Preset Next.js, Node 24.x y funciones en `iad1` (Washington, D.C.).                                            |
| Producción          | **No hay producción funcional publicada.** Ver «Incidencia del primer despliegue».                                                                                                     |
| Vista previa        | Se lanzó un despliegue `--target preview`, pero su resultado **no se verificó**: el sistema de permisos de la sesión bloqueó seguir ese paso. Queda para una decisión del responsable. |
| Prueba de humo      | Pendiente sobre Vercel. La prueba equivalente contra el build de producción local está en [FINAL_AUDIT.md](FINAL_AUDIT.md).                                                            |
| Oracle alcanzable   | Falta ([PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#oracle-en-producción)).                                                                                                               |
| Supabase            | Falta ([SUPABASE_SETUP.md](SUPABASE_SETUP.md)).                                                                                                                                        |
| Variables en Vercel | Ninguna configurada: no hay valores legítimos para producción todavía.                                                                                                                 |

### Incidencia del primer despliegue

El 24 de septiembre de 2026 se ejecutó `vercel deploy` sin `--prod`. Al ser el primer despliegue de un proyecto sin Git conectado, el CLI 60.0.1 lo creó como producción (`dpl_J2N2BAFzWSjGH7hGt5DkURQtLCMs`) y le asignó `sql-select-lab.vercel.app`.

Además, `vercel project add` había dejado el preset en «Other», así que ese despliegue solo publicaba la carpeta `public/`: la raíz daba 404 y se servían los videos, las portadas y el logo.

Medidas tomadas:

1. Se retiró el alias con `vercel alias rm sql-select-lab.vercel.app --yes`. El dominio responde 404 y el despliegue no se borró.
2. Se fijó el preset Next.js con `vercel project update sql-select-lab --framework nextjs --yes`.

La URL única del despliegue sigue protegida por la autenticación de Vercel. Para ocultarlo por completo sin borrarlo, el responsable puede ejecutar `vercel project pause sql-select-lab` en una terminal propia: el CLI exige teclear el nombre del proyecto para confirmar.

## Cómo se despliega

El CLI se ejecuta con `npx`, sin instalación global. La sesión se guarda en `.vercel/cli/`, que Git ignora y el CLI no sube. Todas las órdenes llevan `--global-config .vercel/cli`.

1. **Variables.** Para cada una, con su valor sin mostrarlo en pantalla:

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli env add ORACLE_PASSWORD production
   ```

   Repetir con `preview`. La lista completa y su clasificación están en [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#variables-de-entorno).

2. **Vista previa.** Siempre con destino explícito:

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli deploy --target preview
   ```

   Las vistas previas quedan protegidas por la autenticación de Vercel. Para peticiones automáticas, `vercel curl <ruta> --deployment <url>` salta la protección sin cambiar su configuración.

3. **Prueba de humo** sobre la vista previa. Todo debe pasar:
   - Rutas `/`, `/learn`, `/presentation`, `/modules`, `/resources`, `/lab`, `/challenge`, `/presenter` y `/results`: respuesta 200 y sin errores de consola ni de red.
   - Videos: portada, reproducción y respuesta 206 a peticiones por rangos.
   - Ctrl+K, las 16 escenas, M01–M10 y CodeMirror.
   - `/lab` con «Conectado» y M10 puntuado.
   - Sala: crear, QR, entrar desde dos móviles reales, enviar, ranking, resultados, recargar y reconectar.
4. **Producción.** Solo si se cumple la lista de [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#lista-previa-a-producción):

   ```bash
   npx vercel@60.0.1 --global-config .vercel/cli deploy --prod
   ```

   Sin `NEXT_PUBLIC_SITE_URL`, los QR y OpenGraph usan el dominio de producción del proyecto en Vercel. Con un dominio propio, hay que definirla y volver a desplegar.

Para desplegar en cada `git push`, se puede conectar el repositorio con `vercel git connect`. Mientras la rama de trabajo no se fusione, conviene no hacerlo: la rama de producción de Vercel sería `main`.

## Reversión

| Situación                           | Acción                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Un despliegue de producción falla   | `vercel rollback` vuelve al anterior en segundos, sin recompilar. `vercel promote <url>` publica un despliegue concreto. |
| Hay que retirar la web de inmediato | `vercel project pause sql-select-lab` en una terminal propia; `vercel project resume sql-select-lab` la reactiva.        |
| Una variable incorrecta             | `vercel env rm <NOMBRE> <entorno>`, `vercel env add` y volver a desplegar: las `NEXT_PUBLIC_*` se fijan al compilar.     |
| Supabase                            | La migración solo añade tablas y funciones. Volver a una versión anterior de la web no exige tocar la base.              |
| Oracle                              | La web solo lee `EMPLEADOS`: no hay datos que revertir. Si la salud falla, `/lab` se declara no disponible por sí solo.  |
| Código                              | Cada fase es un commit en `claude-finish-20260923`. `git revert <commit>` y un nuevo despliegue.                         |
