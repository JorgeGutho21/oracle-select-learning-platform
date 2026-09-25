# FINAL_AUDIT — Auditoría preproducción

Versión 1.1 · Fase 10 · 25 de septiembre de 2026 · Rama `claude-finish-20260923`. La Fase 9 (24 de septiembre, base `aa54a80`) se conserva debajo.

**READY_FOR_DEPLOYMENT = true · PRODUCTION_READY = false.**

- El código compila, pasa todas las verificaciones y puede desplegarse. No hay CRITICAL ni MAJOR de código abiertos.
- La publicación en producción está bloqueada por tres dependencias externas:
  - una instancia Oracle alcanzable desde el alojamiento;
  - un proyecto Supabase;
  - los subtítulos del video resumen (F10-01), que requieren una autorización.
- Sin esas dependencias, el laboratorio, M10 y la sala informan «no disponible» y no simulan nada.

## Fase 10: integración final

Se integraron los dos videos del autor y los activos finales: favicon, OpenGraph y página de error global. Se revisaron Oracle, Supabase, las variables y la preparación para Vercel ([PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)), y se repitieron la QA visual, la de accesibilidad y la de seguridad. Estado del despliegue en [DEPLOYMENT.md](DEPLOYMENT.md). Sin funciones nuevas ni cambios de temario.

### Hallazgos de la Fase 10

| ID     | Severidad                       | Hallazgo                                                                                                                                                                                                                                    | Estado                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F10-01 | MAJOR (WCAG 1.2.2, contenido)   | El video resumen V02 (4:51) no tiene subtítulos. V01 los trae incrustados en la imagen.                                                                                                                                                     | **Abierto.** El reconocimiento de voz de Windows (es-ES), probado en local, dio una transcripción con demasiados errores para publicarla. Hace falta autorizar la descarga de un modelo Whisper (unos 250 MB) o que el autor aporte los subtítulos. El reproductor ya acepta una pista WebVTT y una transcripción desde `videos.ts`. Todo el contenido del video está en texto en las lecciones L01–L09 y en la chuleta. |
| F10-02 | MAJOR (latente)                 | Con fuentes reales, «Cargando video…» dependía de eventos que el navegador puede emitir antes de la hidratación. En navegadores que no descargan por adelantado (iOS) no desaparecía nunca.                                                 | **Corregido.** El aviso solo aparece tras pulsar reproducir y mientras faltan datos. Un error anterior a la hidratación se detecta al montar. Hay pruebas unitarias de ambos casos.                                                                                                                                                                                                                                      |
| F10-03 | MINOR (introducido y corregido) | Con `preload="metadata"` cada visita descargaba datos de video. En WebKit, el evento `load` de la página esperaba 1,8–3 s y una pasada E2E agotó el plazo en `/resources`.                                                                  | **Corregido** con `preload="none"`: la portada y la duración escrita sustituyen a los metadatos. La E2E reproduce cada video silenciado y comprueba que avanza. El WebKit de Playwright en Windows sigue descargando pese a `none`; Chromium lo respeta, igual que Safari en macOS e iOS.                                                                                                                                |
| F10-04 | MINOR (contenido)               | Los videos no siguen del todo CONTENT_MAP. Duran 1:13 y 4:51 frente a lo previsto. Sus tablas de ejemplo no son `empleados-select-v1`. V01 menciona «los empleados de Bogotá» sin WHERE, y V02 muestra tres rótulos en inglés.              | Documentado. Las descripciones advierten que las tablas son ejemplos. Cambiarlo exige volver a producir los videos (decisión del autor).                                                                                                                                                                                                                                                                                 |
| F10-05 | MINOR (documentación)           | ORACLE_SETUP indicaba el puerto local 1521; el script usa 1522.                                                                                                                                                                             | **Corregido.**                                                                                                                                                                                                                                                                                                                                                                                                           |
| F10-06 | MINOR (pruebas)                 | La E2E de accesibilidad de `/modules` hacía dos análisis axe en una prueba y agotaba el plazo en Edge (2 de 5 repeticiones) con la CPU saturada.                                                                                            | **Corregido** sin subir plazos: una prueba por ancho. 10/10 en Edge.                                                                                                                                                                                                                                                                                                                                                     |
| F10-07 | Operación                       | El primer `vercel deploy`, sin `--prod`, salió como producción por ser el primer despliegue de un proyecto sin Git. El preset había quedado en «Other», así que `sql-select-lab.vercel.app` solo servía `public/`: videos, portadas y logo. | Mitigado: se retiró el alias (el dominio responde 404) y se fijó el preset Next.js. El despliegue no se borró y su URL única sigue protegida. Pausar el proyecto exige confirmación del responsable en su terminal. Detalle en [DEPLOYMENT.md](DEPLOYMENT.md#incidencia-del-primer-despliegue).                                                                                                                          |
| F10-08 | Operación                       | `vercel link` añadió `.env*` a `.gitignore`, lo que habría dejado `.env.example` fuera de Git, y escribió un token OIDC temporal en `.env.local`.                                                                                           | Revertido: `.gitignore` sin cambios y `.env.local` con sus cuatro variables originales. El nuevo `.vercelignore` excluye `.env*`, compilaciones y capturas, porque el CLI no lee `.gitignore`.                                                                                                                                                                                                                           |
| F10-09 | MAJOR (latente)                 | En un despliegue de producción de Vercel sin `NEXT_PUBLIC_SITE_URL`, el QR usaba `NEXT_PUBLIC_VERCEL_URL`. Esa es la URL única del despliegue, protegida por la autenticación de Vercel, así que los móviles no habrían podido abrirla.     | **Corregido.** En producción se usa `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`, y en las vistas previas se mantiene su propia URL. Hay pruebas unitarias del orden y de ambos entornos.                                                                                                                                                                                                                                 |

### Estado de los MINOR de la Fase 9

| ID   | Estado en la Fase 10                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | **Corregido.** `favicon.ico` (16, 32 y 48 px), `icon.svg` y `apple-icon.png` a partir de la marca `>_`, sin tocar el emblema institucional. OpenGraph con imagen de texto y título de Home.                     |
| M-02 | **Corregido.** `global-error.tsx` con documento propio y estilos en línea. `error.tsx` usa `retry()` de Next 16.3.                                                                                              |
| M-03 | Sin cambios. Riesgo acotado por la cuenta lectora, el grupo, la cola y el plazo. En producción se puede limitar con el firewall de Vercel ([PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#seguridad-en-producción)). |
| M-04 | Sin cambios. En Vercel, `x-forwarded-for` lo fija la plataforma.                                                                                                                                                |
| M-05 | Sin cambios.                                                                                                                                                                                                    |
| M-06 | **Corregido.** Las URL del QR (escena 15 y consola del profesor) se parten tras «/», «.» y «-» (`BreakableUrl`).                                                                                                |
| M-07 | Sin cambios.                                                                                                                                                                                                    |
| M-08 | Sin cambios.                                                                                                                                                                                                    |
| M-09 | No apareció en la pasada completa de la Fase 10.                                                                                                                                                                |
| M-10 | Sin cambios.                                                                                                                                                                                                    |
| M-11 | Sin cambios: 570 KB (173 KB gzip) de JavaScript inicial en Home, sin contar los polyfills `noModule`.                                                                                                           |
| M-12 | La pasada completa se ejecuta con un solo worker para reducir los plazos agotados por la CPU saturada ([Verificaciones de la Fase 10](#verificaciones-de-la-fase-10)).                                          |

### QA de la Fase 10

- **QA visual** sobre el build de producción, con Oracle real y la sala en memoria: **0 hallazgos**.
  - Tamaños: 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844 y 360×800, más zoom 200 % (180×400, 720×450 y 960×540).
  - Rutas: `/`, `/learn`, dos lecciones, `/modules`, `/resources`, `/lab`, `/challenge`, `/live`, `/presenter`, `/results` y `/join/[code]`.
  - Exposición: las 16 escenas en 12 tamaños (192 combinaciones), con el lienzo 16:9 exacto en proyector.
  - Se midieron desbordes, contenedores descentrados, errores de consola y CSP, y axe WCAG 2.2 AA a 1440 y 390 px.
- **Estados interactivos: 0 hallazgos.** Paleta Ctrl+K; M01–M10, con M10 en CodeMirror calificada en Oracle; laboratorio con Oracle a 1440 y 360 px; consola del profesor con QR y ranking; ingreso y resultado en el móvil. Axe de escenas a 390, 180 y 720 px: 0.
- **Videos en Edge** (H.264 real), en los 10 tamaños más el zoom 200 % y en Home, inicio y final de `/learn`, Recursos y escena 14:
  - proporción exacta (9:16 y 16:9), sin error y sin marcos fuera de la ventana;
  - reproducción comprobada en Home y en la escena 14;
  - respuesta 206 a peticiones por rangos.
- **Seguridad:**
  - Cabeceras de la Fase 9 vigentes.
  - Sin mapas de código en `.next/static`, y ningún valor de `.env.local` en `.next/static` ni en `.next/server` (búsqueda automatizada que no imprime valores).
  - Sin `dangerouslySetInnerHTML`.
  - Códigos de sala con `crypto.randomBytes`, tokens de 256 bits y comparación en tiempo constante.
  - Solo variables públicas previstas.

### Verificaciones de la Fase 10

| Comando                | Resultado                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run lint`         | Correcto, 0 advertencias.                                                   |
| `npm run typecheck`    | Correcto.                                                                   |
| `npm run format:check` | Correcto.                                                                   |
| `npm run test:unit`    | Correcto: 26 archivos, 421 pruebas (21 contra Oracle Database 23ai real).   |
| `npm run build`        | Correcto en local, desde cero. En Vercel (`iad1`, Node 24) también compiló. |
| `npm run test:e2e`     | Ver abajo.                                                                  |

Todas las pasadas se hicieron en Chromium, Edge y WebKit contra el build de producción, con Oracle real y un solo worker.

1. **Primera pasada completa** (videos todavía con `preload="metadata"`): 483/486 en 68,4 min. Los tres fallos fueron plazos agotados:
   - `/resources` en WebKit, por el retraso del evento `load` (F10-03, corregido);
   - las nueve lecciones en WebKit, que pasaron 45/45 al repetirlas junto con los ocho tamaños responsive;
   - `/modules` en Edge, que falló 2 de 5 veces al repetirlo (F10-06, corregido).
2. **Pasada completa final**, tras F10-03 y F10-06: **487/489 en 43,2 min**, con la CPU al 100 %; más de la mitad la consumían procesos ajenos (WMI, antivirus, `git`). Los dos fallos fueron plazos en Edge: «lo escrito antes de cargar también se envía» (sala) y axe de Home en móvil. Al repetirlos 5 veces cada uno, pasaron 15/15.
3. **Tras F10-09**, que solo cambia la URL del QR dentro de Vercel: build nuevo desde cero, 421 pruebas unitarias y **111/111** en sala, exposición y rutas en los tres navegadores.

Ninguna prueba falla de forma reproducible. El arrastre de M01 en WebKit (M-09) no apareció. En esta máquina, con la CPU saturada por procesos ajenos, no se consiguió una pasada completa 100 % verde en una sola ejecución (M-12).

### Lista de finalización

| Elemento           | Resultado            | Evidencia o limitación                                                                                                                                                         |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home               | PASS                 | QA visual, E2E y axe.                                                                                                                                                          |
| Learn              | PASS                 | Nueve lecciones, progreso, videos al inicio y al final.                                                                                                                        |
| Presentation       | PASS                 | 16 escenas, lienzo 16:9 exacto, teclado y pantalla completa.                                                                                                                   |
| Search             | PASS                 | Ctrl+K, grupos, foco y axe.                                                                                                                                                    |
| Modules            | PASS                 | Catálogo y progreso; axe por ancho.                                                                                                                                            |
| Resources          | PASS                 | Chuleta, referencia, ejemplos, videos e impresión.                                                                                                                             |
| Intro video        | PASS                 | V01 vertical 9:16, reproducción real en tres navegadores, subtítulos incrustados.                                                                                              |
| Summary video      | PASS WITH LIMITATION | V02 16:9 reproducible, pero sin subtítulos (F10-01).                                                                                                                           |
| Lab                | PASS WITH LIMITATION | Ejecución real en Oracle local. Sin instancia de producción, en un despliegue informa «Oracle no conectado».                                                                   |
| Oracle             | PASS WITH LIMITATION | 21 pruebas de integración y E2E contra 23ai Free local. Instancia de producción: MISSING.                                                                                      |
| Challenge M01–M10  | PASS WITH LIMITATION | M01–M09 en cualquier despliegue. M10 se califica en Oracle solo donde Oracle sea alcanzable.                                                                                   |
| Presenter          | PASS WITH LIMITATION | Flujo completo con almacenamiento en memoria. En producción requiere Supabase y `PRESENTER_ACCESS_CODE`.                                                                       |
| QR                 | PASS WITH LIMITATION | QR legible a 320 px y URL partida sin cortar palabras. En producción en Vercel apunta al dominio del proyecto (F10-09); con un dominio propio requiere `NEXT_PUBLIC_SITE_URL`. |
| Join               | PASS WITH LIMITATION | Alias, espera, juego, reconexión y resultado en 360–430 px con memoria.                                                                                                        |
| Supabase           | BLOCKED              | Sin proyecto ni credenciales. Migración, RLS y adaptador probados en PostgreSQL embebido.                                                                                      |
| Realtime           | BLOCKED              | Depende de Supabase. Mientras tanto, las pantallas consultan la sala cada pocos segundos.                                                                                      |
| Ranking            | PASS WITH LIMITATION | Probado en navegador con memoria y en PostgreSQL embebido.                                                                                                                     |
| Results            | PASS WITH LIMITATION | Por rol y práctica local. La sala remota depende de Supabase.                                                                                                                  |
| Mobile             | PASS                 | 430, 390 y 360 px, y zoom 200 %.                                                                                                                                               |
| Desktop            | PASS                 | De 1920 a 1024 px.                                                                                                                                                             |
| Projector          | PASS                 | 16:9 exacto de 1920×1080 a 960×540.                                                                                                                                            |
| Accessibility      | PASS WITH LIMITATION | Axe WCAG 2.2 AA limpio y foco del Challenge. Falta F10-01.                                                                                                                     |
| Security           | PASS                 | Cabeceras, secretos solo en el servidor y ausentes del build, `.vercelignore`.                                                                                                 |
| Production build   | PASS                 | Local y en Vercel.                                                                                                                                                             |
| Preview deployment | BLOCKED              | Incidencia F10-07. El segundo despliegue, de vista previa, se lanzó pero no se verificó: el sistema de permisos de la sesión bloqueó ese paso.                                 |
| Smoke test         | BLOCKED              | Sobre Vercel, pendiente de la vista previa. La prueba equivalente contra el build de producción local está completa (QA de la Fase 10).                                        |

## Fase 9: auditoría preproducción

Veredicto de la Fase 9: READY_FOR_DEPLOYMENT = true, sin CRITICAL ni MAJOR abiertos. Los seis MAJOR encontrados se corrigieron y tienen prueba de regresión.

### Método

- Verificaciones del proyecto: lint, typecheck, formato, pruebas unitarias y de integración (incluidas Oracle real y PostgreSQL embebido), build y todas las E2E en Chromium, Edge y WebKit contra el build de producción.
- QA visual automatizada contra el build de producción, con Oracle real y la sala en memoria: 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844 y 360×800, más zoom alto (180×400 = 360 px al 200 %, 720×450 y 960×540).
- En cada ruta y tamaño se midió:
  - desborde horizontal, con el elemento culpable;
  - contenedores principales descentrados (márgenes laterales desiguales);
  - errores de consola y bloqueos de CSP;
  - axe WCAG 2.0/2.1/2.2 A y AA;
  - JavaScript transferido y LCP.
- Revisión visual de capturas: proyector, QR, ranking, CodeMirror, paleta y móvil.
- Revisión de código: capas, tipos, APIs de Next y React, estilos, contenido, seguridad y dependencias (`npm audit --omit=dev`: 0 vulnerabilidades).

Criterios:

- **CRITICAL:** pérdida o exposición de datos, credenciales, función central inutilizable.
- **MAJOR:** incumplimiento de WCAG 2.2 AA, desborde o recorte de contenido, defecto de seguridad explotable o flujo principal degradado.
- **MINOR:** mejora recomendable sin impacto funcional o con impacto acotado.

### Hallazgos

#### CRITICAL

Ninguno.

#### MAJOR (todos corregidos)

| ID   | Área                       | Hallazgo                                                                                                                                                                                                                                                                                                                                                                       | Corrección y prueba                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Seguridad                  | Sin cabeceras de seguridad. Cualquier sitio podía incrustar la plataforma, incluida la consola del profesor (_clickjacking_). Tampoco había CSP ni `nosniff` ni política de referente, aunque el código de sala viaja en la URL.                                                                                                                                               | `next.config.ts`: CSP sin nonces (scripts solo del propio sitio, `frame-ancestors 'none'`, `object-src 'none'`, `connect-src` con Supabase si se configura), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP y HSTS. Se omite `upgrade-insecure-requests` para no romper la sala local por http. E2E: cabeceras presentes y ningún bloqueo de CSP en rutas clave.                                                                                         |
| A-02 | Accesibilidad (WCAG 1.4.3) | Las columnas no pedidas de la tabla didáctica se atenuaban con opacidad: contraste 2,14:1 en 15 celdas de la lección 9 (y en Exposición y Home, que usan la misma tabla).                                                                                                                                                                                                      | Atenuación con color `muted`, peso y fondo: unos 6:1. E2E con axe `color-contrast`.                                                                                                                                                                                                                                                                                                                                                                                                         |
| A-03 | Accesibilidad (WCAG 2.1.1) | Regiones desplazables sin foco: la sintaxis de Estudio, incluso a 1440 px en la lección 9, y la de Recursos; el SQL de los pasos de Estudio; el terminal de la Home; el código de las escenas 9, 11, 12 y 15 a 390 px. El teclado no podía desplazarlas para leerlas.                                                                                                          | El código y la sintaxis ajustan las líneas (`pre-wrap`) y ya no se desplazan. El resultado del terminal pasa a ser una región etiquetada y enfocable, como las demás tablas. E2E con axe `scrollable-region-focusable` a 360 y 180 px por ruta y por escena.                                                                                                                                                                                                                                |
| A-04 | Responsive (WCAG 1.4.10)   | Con zoom 200 % en móvil, las escenas quedaban más anchas que el lienzo y se desplazaban por dentro. La cuadrícula de la escena no declaraba columnas, y títulos, nombres y conceptos largos no podían partirse.                                                                                                                                                                | `.scene` con `grid-template-columns: minmax(0, 1fr)` (la misma regla de la Fase 5.1). El texto de la cabecera puede encogerse y, en el modo fluido, se permite partir palabras. El lienzo 16:9 del proyector no cambia (80/80 combinaciones exactas). E2E a 180 px por escena.                                                                                                                                                                                                              |
| A-05 | Responsive (WCAG 1.4.10)   | `/modules` desbordaba 7 px a 180 px CSS: la cabecera de la tarjeta no se reorganizaba.                                                                                                                                                                                                                                                                                         | La cabecera se reorganiza en varias líneas y el título puede partir palabras. E2E de desborde a 180 px.                                                                                                                                                                                                                                                                                                                                                                                     |
| A-06 | Accesibilidad (WCAG 2.4.3) | En el Challenge (práctica y sala en vivo), el foco se perdía en la página al acertar, al omitir y al pulsar «Siguiente misión». También se perdía al corregir y al pedir pista, porque el botón se deshabilita durante la espera. El destino del foco se guardaba en una referencia que podía aplicarse tarde, y en WebKit el foco se ignoraba al cerrar el diálogo de omitir. | La petición de foco es estado y se aplica cuando el destino existe: título, «Siguiente misión», el botón de enviar tras un intento, el de pista o el resumen. En WebKit se repite en el siguiente fotograma, solo si el foco quedó perdido: la primera versión lo repetía siempre y quitaba el foco a una pieza recién elegida, lo que hizo fallar M02 en WebKit en la primera ejecución completa final. E2E de foco tras acertar, intento fallido, pista y omitir en los tres navegadores. |

#### MINOR (documentados, sin corregir en esta fase; estado actual arriba)

| ID   | Área        | Hallazgo                                                                                                                                                                                                                                                                      |
| ---- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | Identidad   | No hay favicon ni `app/icon`: el navegador pide `/favicon.ico` y recibe 404.                                                                                                                                                                                                  |
| M-02 | Next.js     | No hay `global-error.tsx`: un error en el layout raíz mostraría la página por defecto de Next, en inglés. Las rutas sí tienen `error.tsx` en español.                                                                                                                         |
| M-03 | Seguridad   | Sin límite de peticiones por identidad al laboratorio (LAB_SPEC propone 20/min). El grupo de 10 conexiones, la cola de 60 y el plazo de 5 s acotan el impacto (respuesta «ocupado»). Conviene limitar en el proxy del despliegue sin penalizar la salida compartida del aula. |
| M-04 | Seguridad   | El límite de claves de profesor incorrectas es por proceso y se basa en `x-forwarded-for`; detrás del proxy del proveedor es fiable, sin proxy puede falsearse.                                                                                                               |
| M-05 | Realtime    | El canal Broadcast es público y solo transporta la revisión; un aviso falso provoca como mucho una consulta por segundo. Canales privados quedan como endurecimiento opcional.                                                                                                |
| M-06 | Exposición  | En la escena 15, la URL del QR se parte a mitad de palabra cuando no cabe (cosmético).                                                                                                                                                                                        |
| M-07 | Sass        | Bootstrap 5.3 usa `@import` de Sass (aviso silenciado). Habrá que revisarlo cuando Dart Sass 3 lo retire.                                                                                                                                                                     |
| M-08 | Rutas       | `/dev/design-system` es público (con `noindex`); es el escaparate interno de componentes.                                                                                                                                                                                     |
| M-09 | Pruebas     | La E2E de arrastre con ratón de M01 en WebKit es intermitente bajo carga (pasa 10/10 aislada). Hay una tarea separada propuesta.                                                                                                                                              |
| M-10 | Seguridad   | La CSP admite `'unsafe-inline'` en scripts (los que inyecta Next). Con nonces, todas las páginas pasarían a ser dinámicas; se prefirió conservar las estáticas.                                                                                                               |
| M-11 | Rendimiento | JavaScript inicial de unos 172 KB gzip en Home (React y Next); `/lab` añade CodeMirror bajo demanda. LCP local entre 50 y 370 ms. Aceptable; revisar si se añaden dependencias.                                                                                               |
| M-12 | Pruebas     | Con la CPU del equipo saturada por procesos ajenos, algunas E2E con axe o con la sala agotan su plazo (distintas en cada pasada; pasan al repetirlas). Conviene ejecutar la suite en un runner de CI dedicado.                                                                |

### Verificación por área

| Área                            | Resultado                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquitectura                    | Regla ESLint de capas en verde (presentación no importa dominio ni infraestructura; solo `app` importa composición). Raíces de servidor `server-only` para Oracle y la sala.           |
| TypeScript                      | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; sin `any`, `@ts-ignore` ni `eslint-disable` en `src`.                                                              |
| Next.js                         | App Router, rutas tipadas, `poweredByHeader: false`, `oracledb` fuera del empaquetado, precalentamiento en `instrumentation.ts`, páginas estáticas donde no hay datos de petición.     |
| React                           | Modo estricto; sin `dangerouslySetInnerHTML` ni `eval`; alias y nombres siempre como texto.                                                                                            |
| Bootstrap/Sass                  | Build sin avisos; tokens únicos en `_tokens.scss`; ver M-07.                                                                                                                           |
| Contenido                       | Identidad académica verificada por E2E en todas las rutas; «video» coherente; sin URLs de video inventadas.                                                                            |
| Home, Learn, Modules, Resources | Sin desborde ni contenedores descentrados en los once tamaños; axe limpio tras A-02, A-03 y A-05.                                                                                      |
| Presentation                    | Lienzo 16:9 exacto, centrado y sin recortes en 1920×1080, 1440×900, 1366×768, 1024×768 y 960×540 (16 escenas). Móvil fluido sin desborde y axe limpio a 390 y 180 px tras A-03 y A-04. |
| Lab y CodeMirror                | Ejecución real en Oracle a 1440 y 360 px sin desborde; el editor ajusta las líneas; axe limpio.                                                                                        |
| Challenge M01–M10               | Las diez misiones a 1440 y 360 px sin desborde y con axe limpio; M10 con CodeMirror corregida en Oracle; foco corregido (A-06).                                                        |
| Search                          | Paleta a 1440 y 390 px: foco en el campo, resultados por grupos, axe limpio.                                                                                                           |
| Presenter, Join, Results        | Consola a 1920, 1366, 1024 y 768 px sin desborde; QR de 320 px en proyector; ranking legible; ingreso y resultado en 360–430 px; resultados por rol; axe limpio.                       |
| Supabase y RLS                  | Migración con RLS sin políticas y funciones solo para `service_role`; `anon` y `authenticated` sin acceso (pruebas de integración). Proyecto remoto sin validar (prerrequisito).       |
| Realtime                        | Solo la revisión en el canal; la vista siempre la da el servidor; ver M-05.                                                                                                            |
| Oracle                          | Cuenta lectora con `CREATE SESSION` y `READ`; salud con dataset y privilegios; 21 pruebas contra Oracle Database 23ai Free.                                                            |
| Performance                     | Ver M-11.                                                                                                                                                                              |
| Seguridad                       | A-01 corregido; 0 vulnerabilidades en dependencias de producción; credenciales fuera del cliente (comprobado en `.next/static`) y del repositorio.                                     |
| Accesibilidad                   | Axe WCAG 2.2 AA limpio en unos 150 análisis (rutas, estados interactivos y escenas) tras A-02, A-03 y A-06.                                                                            |
| Responsive                      | 0 desbordes y 0 contenedores descentrados en 11 tamaños × 12 rutas y 80 combinaciones de escenas.                                                                                      |

### Verificaciones ejecutadas

| Comando                | Resultado                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `npm run lint`         | Correcto, 0 advertencias.                                   |
| `npm run typecheck`    | Correcto.                                                   |
| `npm run format:check` | Correcto.                                                   |
| `npm run test:unit`    | Correcto: 26 archivos, 415 pruebas (21 contra Oracle real). |
| `npm run build`        | Correcto.                                                   |
| `npm run test:e2e`     | Ver abajo.                                                  |

Sobre el código final, en Chromium, Edge y WebKit contra el build de producción con Oracle real:

- 479/480 antes del último ajuste: M02 falló en WebKit porque el reintento de foco quitaba el foco a una pieza. Se corrigió y M02 más las pruebas de foco pasaron 120/120 (8 repeticiones).
- 478/480 (43,5 min) y 477/480 (30,1 min) con la CPU del equipo al 100 % por procesos ajenos (antivirus, actualizador, WMI, git). Los fallos fueron plazos o esperas en Edge, distintos en cada pasada, y todos pasaron al repetirlos: M09 y M10 24/24; sala y catálogo 3/3.

Ninguna prueba falla de forma reproducible con el código final.

Línea base antes de corregir: 384/384 E2E en 13,9 min. Nueva: `tests/e2e/audit-regressions.spec.ts` (32 pruebas por navegador).

## Prerrequisitos de despliegue

No son defectos del código; sin ellos, la función afectada se declara no disponible.

1. **Oracle:** instancia accesible desde el servidor con la cuenta lectora y EMPLEADOS ([ORACLE_SETUP.md](ORACLE_SETUP.md), opción B).
2. **Supabase:** proyecto con la migración, variables del servidor y validación con móviles reales ([SUPABASE_SETUP.md](SUPABASE_SETUP.md#validación-pendiente)). La memoria del servidor no sirve en despliegues con varias instancias.
3. **Variables:** `PRESENTER_ACCESS_CODE`, `NEXT_PUBLIC_SITE_URL` (QR) y, si se usa el aviso en tiempo real, `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` antes del build: la CSP incorpora ese origen al compilar.
4. **Alojamiento:** servidor Node de Next.js (no exportación estática) con red hasta Oracle y Supabase. Vercel cumple ([PRODUCTION_SETUP.md](PRODUCTION_SETUP.md#alojamiento-vercel)).
5. **Contenido:** los videos V01 y V02 están publicados desde la Fase 10. Siguen pendientes los subtítulos de V02 (F10-01) y la validación del uso público del emblema.
