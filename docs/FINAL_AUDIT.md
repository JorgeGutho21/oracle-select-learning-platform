# FINAL_AUDIT — Auditoría preproducción

Versión 1.0 · Fase 9 · 24 de septiembre de 2026 · Rama `claude-finish-20260923`, base `aa54a80`.

**READY_FOR_DEPLOYMENT = true.** No queda ningún hallazgo CRITICAL ni MAJOR abierto: los seis MAJOR encontrados se corrigieron y tienen prueba de regresión. Desplegar exige configurar los servicios externos de la sección [Prerrequisitos de despliegue](#prerrequisitos-de-despliegue); sin ellos, el laboratorio, M10 y la sala informan «no disponible» y no simulan nada.

## Método

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

## Hallazgos

### CRITICAL

Ninguno.

### MAJOR (todos corregidos)

| ID   | Área                       | Hallazgo                                                                                                                                                                                                                                                                                                                                                                       | Corrección y prueba                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Seguridad                  | Sin cabeceras de seguridad. Cualquier sitio podía incrustar la plataforma, incluida la consola del profesor (_clickjacking_). Tampoco había CSP ni `nosniff` ni política de referente, aunque el código de sala viaja en la URL.                                                                                                                                               | `next.config.ts`: CSP sin nonces (scripts solo del propio sitio, `frame-ancestors 'none'`, `object-src 'none'`, `connect-src` con Supabase si se configura), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP y HSTS. Se omite `upgrade-insecure-requests` para no romper la sala local por http. E2E: cabeceras presentes y ningún bloqueo de CSP en rutas clave.                                                                                         |
| A-02 | Accesibilidad (WCAG 1.4.3) | Las columnas no pedidas de la tabla didáctica se atenuaban con opacidad: contraste 2,14:1 en 15 celdas de la lección 9 (y en Exposición y Home, que usan la misma tabla).                                                                                                                                                                                                      | Atenuación con color `muted`, peso y fondo: unos 6:1. E2E con axe `color-contrast`.                                                                                                                                                                                                                                                                                                                                                                                                         |
| A-03 | Accesibilidad (WCAG 2.1.1) | Regiones desplazables sin foco: la sintaxis de Estudio, incluso a 1440 px en la lección 9, y la de Recursos; el SQL de los pasos de Estudio; el terminal de la Home; el código de las escenas 9, 11, 12 y 15 a 390 px. El teclado no podía desplazarlas para leerlas.                                                                                                          | El código y la sintaxis ajustan las líneas (`pre-wrap`) y ya no se desplazan. El resultado del terminal pasa a ser una región etiquetada y enfocable, como las demás tablas. E2E con axe `scrollable-region-focusable` a 360 y 180 px por ruta y por escena.                                                                                                                                                                                                                                |
| A-04 | Responsive (WCAG 1.4.10)   | Con zoom 200 % en móvil, las escenas quedaban más anchas que el lienzo y se desplazaban por dentro. La cuadrícula de la escena no declaraba columnas, y títulos, nombres y conceptos largos no podían partirse.                                                                                                                                                                | `.scene` con `grid-template-columns: minmax(0, 1fr)` (la misma regla de la Fase 5.1). El texto de la cabecera puede encogerse y, en el modo fluido, se permite partir palabras. El lienzo 16:9 del proyector no cambia (80/80 combinaciones exactas). E2E a 180 px por escena.                                                                                                                                                                                                              |
| A-05 | Responsive (WCAG 1.4.10)   | `/modules` desbordaba 7 px a 180 px CSS: la cabecera de la tarjeta no se reorganizaba.                                                                                                                                                                                                                                                                                         | La cabecera se reorganiza en varias líneas y el título puede partir palabras. E2E de desborde a 180 px.                                                                                                                                                                                                                                                                                                                                                                                     |
| A-06 | Accesibilidad (WCAG 2.4.3) | En el Challenge (práctica y sala en vivo), el foco se perdía en la página al acertar, al omitir y al pulsar «Siguiente misión». También se perdía al corregir y al pedir pista, porque el botón se deshabilita durante la espera. El destino del foco se guardaba en una referencia que podía aplicarse tarde, y en WebKit el foco se ignoraba al cerrar el diálogo de omitir. | La petición de foco es estado y se aplica cuando el destino existe: título, «Siguiente misión», el botón de enviar tras un intento, el de pista o el resumen. En WebKit se repite en el siguiente fotograma, solo si el foco quedó perdido: la primera versión lo repetía siempre y quitaba el foco a una pieza recién elegida, lo que hizo fallar M02 en WebKit en la primera ejecución completa final. E2E de foco tras acertar, intento fallido, pista y omitir en los tres navegadores. |

### MINOR (documentados, sin corregir en esta fase)

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

## Verificación por área

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

## Verificaciones ejecutadas

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
4. **Alojamiento:** servidor Node de Next.js (no exportación estática) con red hasta Oracle y Supabase.
5. **Contenido pendiente:** videos V01 y V02 (hoy «Video en preparación») y validación del uso público del emblema.
