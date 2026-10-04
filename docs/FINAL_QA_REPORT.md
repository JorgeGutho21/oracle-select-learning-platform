# QA final de DB LAB — Fase 5

Estado de integración: en curso. Este informe distingue verificaciones ejecutadas de configuración externa pendiente. No declara producción lista.

## Entorno y alcance

Repositorio único y rama `codex-phase5-production-final-20261004`, base `6fda02bec66f4ef5f0837ef0efda5cdd7587b787`. El commit histórico `889716c` es ancestro verificado. Se preservó el trabajo anterior en `01e83ac`, sin tocar `main` ni el documento personal DOCX.

Windows, Node 24.20.0, Playwright 1.63.0, build Next de producción. Supabase local aislado en Podman/WSL; Oracle Free existente, con un esquema nuevo exclusivo para verificar el currículo. Los artefactos privados viven en `output/playwright/phase5/`, fuera de Git y de Vercel.

## Verificaciones ejecutadas

| Verificación                    | Resultado y evidencia local                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest completo                 | 1976 PASS, 0 FAIL, 7 omitidas: 1357 unitarias y 619 integraciones; `release-vitest.json`. Dos omisiones deliberadas; cinco smoke remotas pasaron aparte.    |
| Oracle Free / PGlite            | 599 PASS; `oracle-integration.log`. Incluye 222 ejemplos curriculares, 102 comprobaciones S1 y 79 del banco S1.                                             |
| Oracle Cloud 19c                | 102 PASS de S1; `oracle19c.log`. No se atribuye a 19c la ejecución completa de S2/S3.                                                                       |
| Supabase remoto                 | 7 PASS de cuentas/RLS y 5 PASS de release; `remote-accounts-rls.log`, `remote-release-db.log`.                                                              |
| Banco                           | 50 + 50 + 50 = 150 oficiales, sincronizadas idempotentemente, sin preguntas inválidas.                                                                      |
| Chromium completo               | 346 casos: 344 PASS y dos expectativas antiguas de identidad corregidas. `full-chromium.json`.                                                              |
| Chromium crítico posterior      | 64 PASS y un error de red `ERR_NO_BUFFER_SPACE`; ese caso pasa 3/3 aislado sin cambiar la aplicación. `final-critical-chromium.json`, `isolated-1920.json`. |
| Chromium final dirigido         | 68 PASS, 0 FAIL, 0 omitidas, 0 flaky; `latest-chromium.json`. Incluye las expectativas corregidas, metadata S1 y capturas del examen.                       |
| Edge completo                   | 348 PASS, 0 FAIL, 0 omitidas, 0 flaky; `full-edge.json`.                                                                                                    |
| Comandos finales locales        | lint, typecheck, format:check, Vitest y build QA: código de salida 0. Build con variables de producción pendiente tras WebKit.                              |
| 22 fallos históricos            | Todos pasan 2/2 de forma aislada: 44 PASS, sin retries ni omisiones. `historical-isolated.json`.                                                            |
| Concurrencia progreso/presencia | 40 clientes, 120 registros, 368 ms total; p50 317 ms, p95 353 ms. `concurrency-progress.json`.                                                              |
| Escala real de notas            | 0/20/50/60/80/100% producen 0.0/1.0/2.5/3.0/4.0/5.0 en PostgreSQL.                                                                                          |
| Dependencias de producción      | `npm audit --omit=dev`: 0 vulnerabilidades. `npm-audit.json`.                                                                                               |
| Secretos                        | 0 coincidencias de 14 entradas privadas en repositorio, estáticos y últimos 15 commits; `secret-scan.json`.                                                 |
| Upload Vercel en seco           | 671 archivos; 0 archivos privados seleccionados, sin desplegar. `vercel-upload-safety.json`.                                                                |

Los 40 logins simultáneos repetidos pasan: 3067 ms total, p50 2939 ms y p95 3052 ms (`concurrency-auth.json`); la medición anterior fue 2312/2231/2299 ms. Progreso/presencia repetidos: 538 ms total, p50 480 y p95 530 ms; anteriormente 368/317/353 ms. No son mejoras ni garantías de SLA: son variaciones locales observadas, con cero errores. El listado HTTP local de secciones pasa con 40 peticiones: 605 ms total, p50 525 ms y p95 528 ms (`concurrency-sections.json`). WebKit completo y el cierre remoto se registrarán al terminar. Las cuentas remotas confirmadas por API administrativa no acreditan entrega de correo.

## Fallos encontrados y tratamiento

| Hallazgo                                          | Clasificación        | Corrección o límite                                                                                                                 |
| ------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Comparación CRLF/LF del SQL generado              | TEST_BUG             | Normalización de la lectura; SQL canónico intacto.                                                                                  |
| Prettier en 319 archivos Windows                  | ENVIRONMENT          | Finales LF y `.gitattributes`; no cambio de contenido académico.                                                                    |
| Nota CSV Excel con punto decimal                  | REAL_PRODUCT_BUG     | El formato llega al generador del resumen; ahora usa coma decimal.                                                                  |
| Fórmulas con espacios/control                     | REAL_PRODUCT_BUG     | Neutralización antes de escapar la celda, incluida la clase Unicode de controles.                                                   |
| Identidad con grafía anterior                     | REAL_PRODUCT_BUG     | Amilkar Sierra Romano en producto, alt e imagen social generada desde código.                                                       |
| Expectativas antiguas de identidad                | OBSOLETE_EXPECTATION | Dos aserciones actualizadas; no se relajó la verificación de identidad.                                                             |
| Tablas móviles convertidas en fichas              | REAL_PRODUCT_BUG     | Tablas con grupos de columnas e identidad repetida, teclado y encabezados.                                                          |
| Grupos móviles ocultos por CSS heredado           | REAL_PRODUCT_BUG     | Activación explícita del grupo; E2E exige visibilidad de tabla y filas.                                                             |
| Portada contaba solo 22 lecciones                 | REAL_PRODUCT_BUG     | Resumen real de las 78 lecciones. Se aclara el alcance del medidor del recorrido SELECT inicial.                                    |
| Funciones publicadas S1 también figuraban futuras | REAL_PRODUCT_BUG     | Metadata futura alineada con SECTION_1_AUDIT; contenido académico intacto y aserción de regresión.                                  |
| Selectores raw de filas duplicadas ocultas        | TEST_BUG             | Selectores por rol que comprueban únicamente la representación accesible visible.                                                   |
| Recarga antes de terminar liberar feedback        | TEST_BUG             | Esperar la confirmación visible del servidor.                                                                                       |
| Buffer de red Chromium                            | ENVIRONMENT          | 3/3 repeticiones aisladas pasan. La causa concreta del agotamiento de buffer no se atribuye al producto.                            |
| Firefox no arranca                                | ENVIRONMENT          | Reinstalación oficial y dos lanzamientos aislados fallan antes de abrir la web; SideBySide 33: ensamblado mozglue ausente. BLOCKED. |
| Zoom nativo del Chromium completo                 | ENVIRONMENT          | Dos intentos no completan el arranque. El reflujo equivalente sí se comprueba; zoom nativo queda NOT_TESTED.                        |

## WebKit: investigación y correcciones

El primer WebKit completo dio 342 PASS, cuatro fallos y dos omisiones encadenadas. El arrastre era TEST_BUG: soltar antes de que dnd-kit confirmara la colisión; 5/5 repeticiones tras esperar estado activo y destino. El formulario era REAL_PRODUCT_BUG: leyendas con ancho persistente después de estrechar viewport; se limita su ancho automático al contenedor. El cierre de medición quedó bloqueado por el subsistema multimedia WebKit/Windows: descargar `about:blank` antes de cerrar evita ese bloqueo, con 2/2 PASS. La cancelación RSC no se ocultó con un filtro genérico: el caso de 1440 px pasó aislado y se mantuvo el filtro específico existente. Un dirigido adicional reprodujo el reloj de dispositivo seis horas atrasado; el contador monotónico pasó después 9/9 junto con formularios, Broadcast y performance.

La siguiente suite completa detectó una expectativa obsoleta del emblema (se exige ahora ausencia sin retirar los créditos) y un defecto de redondeo del contador, que mostraba 301 segundos al truncar la referencia `.750Z`. Se conserva esa precisión del servidor y se redondea únicamente el tiempo transcurrido. La nueva referencia, sus pruebas y el Preview sustituto están en validación. No se da por PASS esa ejecución con fallos.

## Los 22 casos históricos, individualmente

La evidencia heredada de `PHASE4_QA.md`, sección 5, registra que los 21 casos de entorno fallaron también contra la base de Fase 3 en el mismo Chromium 1194/Linux. En este Windows se ejecutaron los títulos exactos sin alterar sus aserciones, dos veces cada uno, sin retries: 44 PASS. Eso confirma que hoy no son regresiones reproducibles del producto; **no demuestra que una fuente concreta causara cada fallo Linux**. La clasificación ENVIRONMENT se limita a esa diferencia reproducida entre entornos/versiones. La causa interna del entorno antiguo permanece sin atribución.

| Test (archivo y caso)                                   | Ruta                      | Clasificación / tratamiento                        | Resultado aislado                 |
| ------------------------------------------------------- | ------------------------- | -------------------------------------------------- | --------------------------------- |
| audit-regressions: 180 px, resources                    | /resources                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| audit-regressions: 180 px, modules                      | /modules                  | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| interactions: ayuda con foco, descarte y posición móvil | /dev/design-system        | FLAKY histórico; no reproduce intermitencia actual | 2/2 PASS + 10/10 PASS adicionales |
| lab-result-table: 12 columnas, 5 grupos, 390×844        | /lab                      | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| lab-result-table: 12 columnas, 5 grupos, 360×800        | /lab                      | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| lab-result-table: 12 columnas, 5 grupos, 320×568        | /lab                      | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| media: resumen al final y escena 26                     | /presentation, /resources | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| presentation: 30 escenas, 1920×1080                     | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| presentation: 30 escenas, 1366×768                      | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| presentation: 30 escenas, 1280×720                      | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| presentation: tabla completa, escena 4, 1920×1080       | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| presentation: tabla completa, escena 4, 1366×768        | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| reflow: todas las rutas, 180×400                        | rutas públicas del spec   | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| reflow: laboratorio usable a 200% equivalente           | /lab                      | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-challenge: 10 misiones, 1920 px                  | /challenge                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-challenge: 10 misiones, 1366 px                  | /challenge                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-challenge: 10 misiones, 390 px                   | /challenge                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-challenge: 10 misiones, 320 px                   | /challenge                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-challenge: dataset móvil, máximo 4 columnas      | /challenge                | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-pages: páginas sin desborde, 320×568             | rutas públicas del spec   | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-presentation: escenas clave, 1920×1080           | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |
| visual-presentation: escenas clave, 1366×768            | /presentation             | ENVIRONMENT; aserciones conservadas                | 2/2 PASS                          |

El tooltip tenía 4/10 fallos en Fase 4 y 3/10 en Fase 3, según el registro heredado. Sus diez repeticiones nuevas pasan sin cambios en la aplicación ni aumento de timeout. No se afirma que una intermitencia histórica haya sido eliminada mediante un fix inexistente. Títulos exactos: `historical-cases.json`; ejecuciones: `historical-isolated.json` y `tooltip-isolated.json`.

## Recorridos funcionales verificados

Los recorridos de cuenta locales verifican registro, confirmación Mailpit, inicio y cierre de sesión, recuperación, enlace inválido, perfil, fusión de invitado y otra sesión, roles y paneles. La QA de Fase 5 completa una lección de cada sección y comprueba sincronización de las tres y el resumen 3/78 de la portada.

En S1/S2/S3: profesor sincroniza banco, crea selección automática, publica para estudiante propio; estudiante inicia, responde offline, recupera Guardado, recarga, entrega; profesor libera feedback y estudiante lo ve. La suite heredada comprueba selección manual, monitor Realtime, exportación, aislamiento de otro estudiante y autoentrega por vencimiento. La base verifica revisiones antiguas, entrega doble, respuestas congeladas y notas. Los eventos se presentan como señales, nunca como pruebas de fraude.

## Responsive, accesibilidad y efectos

Matriz pública: 320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1600, 1920 y 2560 px. Paneles autenticados: los trece anchos hasta 1920, con filas visibles, pestañas de 44 px y navegación Inicio/Fin en tablas compactas. Capturas reales de las quince pantallas exigidas, incluido el examen del estudiante, más Exposición: 32 imágenes a 1440 y 390. Se revisan las imágenes, no solo su existencia. Las imágenes anteriores que revelaron el grupo oculto se reemplazan tras la corrección.

Reflujo equivalente a 125/150/200% comprobado. No se presenta como zoom nativo: el intento de automatizarlo no pudo arrancar el Chromium completo. axe WCAG 2.2 AA y teclado se ejecutan en currículo, acceso, paneles e interacciones. Lectura con lector de pantalla, teléfono físico y proyector: NOT_TESTED.

Se conservan Shape Grid, Spotlight Card, Star Border y Pixel Card gratuitos, con atribución y licencia en THIRD_PARTY_NOTICES. No se añadió una biblioteca ni otro efecto sin valor académico. Movimiento reducido: 0 animaciones activas en Home, Lab y S3; efectos táctiles y ahorro de datos tienen pruebas unitarias.

## Performance y límites

Medición local final Chromium a 390 px, movimiento reducido, sin throttling: Home LCP 672 ms, CLS 0 y JS codificado 292400 bytes; Lab 752 ms, CLS 0.04696 y 415285 bytes; S3 592 ms, CLS 0 y 292400 bytes. `performance-chromium.json`. Edge: LCP 772/688/580 ms para Home/Lab/S3 y los mismos límites de CLS (`performance-edge.json`). Se registra disponibilidad de las APIs; un navegador que no las soporte devuelve null, no un cero ficticio. No representa Core Web Vitals de usuarios reales ni una medición de producción.

Pendientes externos: SMTP y buzón autorizado para comprobar entrega/confirmación/recuperación remotas; Microsoft desactivado; Firefox no ejecutable en este Windows. Preview y producción deben registrar sus smoke por separado. No se promueve producción con criterios críticos pendientes.
