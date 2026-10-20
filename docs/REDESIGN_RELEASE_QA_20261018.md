# DB LAB — QA del rediseño visual, 18–20 de octubre de 2026

Estado: **COMPLETE**. `FINAL_VISUAL_READY=true`; `FINAL_RELEASE_READY=true`. QA local, Preview y Production completadas con los alcances y las limitaciones documentados. El encargo vigente es la capa visual integral; se preserva el currículo estabilizado de S1/S2/S3, los permisos, las reglas de evaluación, Oracle y Supabase.

## Preview y promoción — 20 de octubre

Preview **READY**, fuente exacta `414d5495cdc61041ff7371ae015b3902d1949209`, deployment `dpl_2AAgKbBAAVxJy4e8XTCmtfrwyf3t`: [Preview verificado](https://sql-select-bw0mrnpss-jorge-gutierrez1.vercel.app). El orquestador verificó SHA/rama por API antes de las comprobaciones.

- Público **42/42 PASS**, 21 rutas a 390/1440 px, incluidas las tres clases; 16 vistas con Axe sin violaciones. Oracle real HTTP 200, `available:true`, `reason:null`. Evidencia `output/playwright/redesign-20261019/preview-smoke-2026-10-20T15-05-00-449Z/report.json`, `complete:true`, cero fallos.
- Acceso de dos docentes humanos: **28/28 lecturas HTTP 200** en el origen exacto del Preview; UUID cotejado con la identidad histórica, ambos roles `teacher`, contenido/editor presentes y progreso HTTP 200, cero errores de página. Evidencia `output/playwright/redesign-20261020/remote-auth-preview/report.json`, `passed:true`. Login mediante enlace administrativo sin envío de correo; no acredita la contraseña ni una cuenta de alumno real remota. No se cambiaron contraseñas ni roles; las escrituras de aplicación permanecieron bloqueadas.
- Rendimiento remoto final **8/8 PASS**, LCP observado **1636–2248 ms**, CLS máximo **0,06365** (Lab), cero errores de consola/aplicación y cero animaciones activas observadas. Evidencia `output/playwright/redesign-20261019/preview-performance.json`, `complete:true` y cero fallos. No se comparan los bytes del proxy con la compresión del build local.
- Se conserva el primer muestreo **7 PASS/1 fallo de integración** en `preview-performance-before-cookie-7pass-1integration-fail.json`. Un follow-up `/dashboard` del navegador de pruebas perdía la autorización y redirigía a Vercel SSO. Se corrigió el control de acceso del helper usando la cookie oficial de bypass, limitada al host y solo en memoria, establecida desde el documento inicial. El pase final conserva la toolbar y la CSP de la aplicación; no se atribuye el fallo a la toolbar ni se modificó producto para ocultarlo.

La promoción configurada desde el Preview exacto creó Production **READY**, `dpl_9vm9D1TsMMBgpKbgejxf5cEqRzTi`, con la misma fuente `414d549`; el orquestador verificó los aliases y SHA mediante API. Canónico: [DB LAB Production](https://sql-select-lab.vercel.app). Gate guardado en `output/playwright/redesign-20261020/production-gate-414d549.json`. Deployment anterior **READY** conservado para reversión: `dpl_7UoxANWpMZz1Txnc5TVG756E6fVy`, fuente `66a0093`.

**QA de Production completada**:

- Público **20/20 PASS**, salida 0 y `complete:true`: diez rutas en dos anchos, 20 PNG, diez vistas Axe sin violaciones, suma de errores de consola/página cero y las tres clases listas en ambos anchos. Oracle HTTP 200, `available:true`, `reason:null`. Evidencia `output/playwright/redesign-20261019/production-smoke-2026-10-20T15-20-58-607Z/report.json`. El gate API confirma ID `dpl_9vm9D1TsMMBgpKbgejxf5cEqRzTi` y fuente `414d549` en el alias canónico.
- Acceso autenticado **28/28 PASS** en la primera ejecución final, dos sesiones de docentes humanos: UUID histórico y rol correctos, 14 rutas HTTP 200 por sesión, progreso HTTP 200, cero avisos de backend, errores de página o desbordamientos observados. Veintitrés escrituras de aplicación bloqueadas; sin bypass de protección en Production. Evidencia `output/playwright/redesign-20261020/remote-auth-production/report.json`, `passed:true`, y 28 PNG.
- La fuente de aplicación desplegada y subida a la rama `codex-final-pedagogy-ui-20261004` es `414d5495cdc61041ff7371ae015b3902d1949209`. El commit posterior de cierre contiene solamente documentación y no cambia la fuente del deployment. El rollback `dpl_7UoxANWpMZz1Txnc5TVG756E6fVy` (`66a0093`) sigue conservado READY.

Limitaciones externas explícitas: no se facilitó login remoto por contraseña ni una cuenta real de alumno remoto; el acceso remoto validado corresponde a los dos docentes mediante el mecanismo administrativo descrito. Figma MCP no estaba conectado, era opcional y no se usó. Estas limitaciones no se presentan como pruebas ejecutadas ni como bloqueos pendientes del cierre aprobado. Se conservan los resultados reales: full previo 2359 PASS/7 pendientes, 13 unitarias nuevas dirigidas PASS, 64 rechecks E2E PASS y diagnósticos originales rojos; no se afirma un nuevo full de 1185 E2E verde ni una suite completa de 2372 unitarias.

## Resultado local vigente — 20 de octubre

Fuente final `414d5495cdc61041ff7371ae015b3902d1949209`; build `p56hRpY4ubPnCfKrMNxLv`, comprobados directamente. El orquestador confirmó build salida 0 con 132 rutas/TypeScript PASS, lint global PASS y formato global PASS. Tras el full de compatibilidad 2359 PASS/7 pendientes se comprobaron además 13 unitarias dirigidas de los cambios docentes, todas PASS; no se suman ambas cifras como una suite nueva.

**64 ejecuciones dirigidas PASS, 0 FAIL, 0 omitidas y 0 flaky**, sin retries ni cambios en las expectativas o presupuestos originales. Es cobertura de recuperación por alcance: las 54 públicas se ejecutaron sobre 29ec1c8 con el mismo CSS final; las 10 privadas sobre 414d549 con paginación y estado de búsqueda. No se presenta como una nueva ejecución íntegra de 1185 casos.

| Comprobación original                                                            | Fuente  | PASS | Evidencia JSON                      |
| -------------------------------------------------------------------------------- | ------- | ---: | ----------------------------------- |
| S1: 30 escenas, tabla completa, escenas clave/móvil/fullscreen, tres navegadores | 29ec1c8 |   27 | `s1-final-geometry.json`            |
| S2: 147 escenas y pasos en cuatro proyectores, tres navegadores                  | 29ec1c8 |   12 | `s2-final-projector.json`           |
| Navegación S2 conserva escena en URL, tres navegadores                           | 29ec1c8 |    3 | `compat-curriculum-url.json`        |
| Reflujo equivalente 125/150/200 %, tres navegadores                              | 29ec1c8 |    9 | `scene12-reflow.json`               |
| 18 rutas a 414 px, tres navegadores                                              | 29ec1c8 |    3 | `exact414-e2e.json`                 |
| Búsqueda docente, Chromium/Edge/WebKit, un worker aislado                        | 414d549 |    3 | `teacher-search-final.json`         |
| Dos confirmaciones adicionales originales de búsqueda WebKit, aisladas           | 414d549 |    2 | `teacher-search-final-confirm.json` |
| Archivo íntegro original de cuentas/evaluación por sección WebKit, aislado       | 414d549 |    5 | `phase5-webkit-final.json`          |

Los JSON están en `output/playwright/redesign-20261019/`, separados de los diagnósticos rojos. Búsqueda WebKit pasó tres veces en total; se conservaron las dos reproducciones anteriores del fallo. El archivo original de Fase 5 terminó en 305,126 s: sincronización 55,516 s; S1 170,456 s; S2 26,469 s; S3 26,823 s; señal de intento terminado 21,978 s. **S1 conserva su límite original de 180000 ms**, con 9,544 s de margen en esta ejecución. Las tres dependencias omitidas antes ahora se ejecutaron y pasaron.

El full diagnóstico permanece **1156 PASS/26 FAIL/3 omitidos** sobre 8baf241; la tanda intermedia permanece **143 PASS/7 FAIL** sobre 839a756. Sus archivos no se sobrescribieron. Recuperación: los 15 fallos S1 escena 12 quedan cubiertos por la regresión S1 final; los siete crashes History de WebKit y los dos fallos de Recursos por la tanda pública posterior al fix; la búsqueda y el timeout por los originales privados finales. Los siete fallos CSS descubiertos después (seis escena 15 y uno S2 escena 54) quedan cubiertos por 27 S1 + 12 S2 finales. Se describe esta cadena de evidencia, no un full verde ficticio.

Capturas reales finales CSS de S1 escenas 7/15 y S2 escena 54 en 1920/1366/1280/1024/390 y geometría de proyector 0 spill/0 scroll interno están disponibles en `final-scene-fixes-geometry.json` y `final-{s1-7,s1-15,s2-54}-*.png`. La revisión visual independiente conserva el alcance anterior y revisa los controles docentes finales. Capturas y métricas finales se detallan a continuación. Preview y promoción quedaron comprobadas en la sección remota superior.

### Comprobación docente final y rendimiento

El helper adicional final pasó en **WebKit con DPR 2, a 390 y 1440 px** sobre 414d549/build p56h. Evidencia `teacher-final-bounded/evidence.json` y diez PNG: listado completo, viewport, pager con foco, búsqueda pendiente y resultado filtrado por cada ancho. Verifica 25 estudiantes renderizados por página; siguiente por Enter a `page=2` y rango 26–50; anterior por Enter a página 1; búsqueda real del correo único desde página 2 reinicia página y muestra una fila. El enlace medido ocupa 178,55 × 47,59 px, sobre el mínimo de 44 px en ambos ejes. Dos fixtures propios creados y eliminados; no se borraron fixtures anteriores.

Para **capturar** el estado pendiente, el helper cancela una única acción nativa de submit mediante `preventDefault`, dejando ejecutarse el handler React real: comprueba «Buscando estudiantes…», `aria-busy` y resultados anteriores ocultos. Después recarga y comprueba el GET real sin interceptar ni cancelar. La imagen no acredita un GET retenido. Se preservaron intentos anteriores del helper: servidor apagado, gestión de route y consulta de DOM bloqueada por navegación; son incidencias de orquestación, no resultados de producto ni repeticiones para ocultar un fallo. Los cinco E2E originales de búsqueda permanecen PASS.

Comparación del dashboard en WebKit/DPR 2: antes 10128 nodos/759 filas y Axe a 390 px 20,913 s; después 1264 nodos/78 filas y Axe a 390 px **3,187 s**, a 1440 px **2,686 s**, cero violaciones WCAG 2.2 AA en ambos recorridos. Las 78 filas incluyen las representaciones responsivas; el listado de estudiantes contiene 25. No equivale a una certificación manual de accesibilidad.

Medición de ocho rutas en build de producción **local**, Chromium 390×844, contexto nuevo por ruta, movimiento reducido, observación de tres segundos tras h1 visible y fuentes listas, sin throttling de CPU/red y sin otra QA simultánea. Evidencia `final-performance.json/.log`. Son mediciones de laboratorio locales, no datos de campo ni prueba de mejora frente a un baseline comparable.

| Ruta                                           | LCP observado (ms) | CLS observado | JS encodedBodySize (bytes) |
| ---------------------------------------------- | -----------------: | ------------: | -------------------------: |
| Inicio `/`                                     |                748 |             0 |                     284044 |
| `/lab`                                         |                732 |       0,06365 |                     353057 |
| `/sections/plsql`                              |                300 |             0 |                     233860 |
| `/sections/consultas-relacionales/class`       |                604 |             0 |                     226867 |
| `/sections/plsql/class`                        |                668 |             0 |                     226867 |
| `/sections/plsql/study/variables-y-constantes` |                424 |             0 |                     228187 |
| `/sections/consultas-relacionales/resources`   |                668 |             0 |                     194999 |
| `/sections/plsql/challenge`                    |                404 |             0 |                     228187 |

En las ocho rutas: respuesta HTTP 200, cero errores `pageerror` observados y cero animaciones DOM activas con movimiento reducido. Una fuente autoalojada por contexto, 48256 bytes encodedBodySize. Inicio conserva un canvas; las otras siete rutas no tienen canvas. El muestreo corto no cuantifica bucles de JavaScript ni rendimiento de una red móvil real.

## Reanudación y comprobaciones finales — 20 de octubre

Fuente de aplicación `29ec1c871de0d46b699ff9223d7ae79186ed6da2`, build `XLHNXXxob2_U3Lv1vpOGI`, iniciado en 5190 tras salida0 confirmada del build del orquestador (132rutas y TypeScript PASS). Agrega únicamente los ajustes de CSS acotados a S1 escenas7/15 y S2 `left-faltantes` respecto a la lógica ya comprobada en839. No se atribuyen los diagnósticos anteriores a esta compilación.

- Recuperados los ocho contenedores EXISTENTES apagados durante la noche, sin reset/recreación ni borrado: Oracle y Postgres primero; `pg_isready` acepta conexiones; después seis dependientes. Ocho running, siete healthy; REST no define healthcheck. Auth54321 y Mailpit54324 HTTP200.
- Búsqueda docente original `accounts.spec.ts:335`, WebKit, un worker y sin otra QA: **FAIL en27,1s**, mismo strict11filas justo después de enviar. Snapshot final muestra el filtro correcto y «1 de251 estudiantes coinciden» con la fila del correo único. Evidencia `teacher-search-first.json/.log` y `teacher-search-first-results/`. Se detuvo el plan de dos confirmaciones porque la primera repetición no pasó; no se modificaron selectores, esperas, datos ni aserciones para obtener verde.
- Archivo original `phase5-accounts.spec.ts`, cinco casos aislados WebKit: **1 PASS, 1 timeout a180000ms, 3 dependientes omitidos**, 4,1min; original intacto. S1 llegó al dashboard docente después de entregar, liberar retroalimentación y capturar resultados; expiró durante Axe. Evidencia `phase5-webkit-isolated.*`.
- Copia exclusivamente diagnóstica instrumentada, mismo límite180000ms y aserciones, falló luego en el control de pestañas del dashboard. Navegación/Axe/capturas cronometrados en `phase5-timed.log` y `phase5-timing-summary.json`. Capturas previas: banco16,47s; formulario29,96s; evaluaciones alumno27,62s; examen7,39s; monitor12,84s; resultado8,63s; resultados docente11,41s. Dashboard390:10128nodos/759filas medidos, preparación6,915s y Axe20,913s (termina); no se demostró hang del analizador. El coste acumulado deja insuficiente presupuesto para completar el dashboard. Sin borrado de fixtures ni ampliación de tiempo.
- Regresión original de geometría del CSS final: **27/27 S1 PASS en4,6min y12/12 proyector S2 PASS en2,7min**, tres navegadores, dos workers y cero retries. Capturas reales de S1escenas7/15 y S2escena54 en1920/1366/1280/1024/390; geometría de proyector0spill/0scroll interno y página. Revisión independiente avisada.
- Oracle local tras recuperar servicios: `/api/oracle/status` HTTP200, `available:true`, `reason:null`. URL S2 **3/3 PASS**, reflujo equivalente125/150/200% **9/9 PASS** y exact414 **3/3 PASS**, con18rutas por navegador y cero errores JS observados. Total de la tanda pública final29ec **54 PASS, 0 FAIL, 0 omitidos, 0 flaky**. Métricas pospuestas al build docente final para medir una vez sin otra QA.

## Estado vigente — 19 de octubre

Candidato final con el lote del revisor: `8baf24185dac95099f4de91a96396da59107d851`, en `codex-final-pedagogy-ui-20261004`; integrado anterior `abeacb9`, merge `ce32568edaec572a93a9c0b3a20a66c57112243d`. Combina el avance remoto de Claude hasta `a2d6827` y el rediseño local, conserva Inter autoalojada y las composiciones integradas. Los resultados del 18 de octubre no se heredan como PASS de este candidato.

- Servicios locales restaurados iniciando exclusivamente los ocho contenedores existentes, sin reset ni recreación. Postgres `pg_isready` PASS; Auth y Mailpit HTTP 200; Auth administrativo y lectura PostgREST local PASS.
- Oracle: primer intento tras iniciar devolvió `ORA-01109` mientras la base abría; repetición real `SELECT 1 AS HEALTH FROM DUAL` devuelve `[[1]]`. No se ejecutó DDL ni se modificaron esquemas.
- Vercel: **bloqueo de la credencial anterior resuelto**. El orquestador renovó OAuth y verificó API de usuario HTTP 200. Preview y Production todavía pendientes de gates; no se afirma despliegue.
- Evidencia nueva separada en `output/playwright/redesign-20261019/`. Configuraciones de suite completa de tres navegadores, preflight, captura final, rendimiento de ocho rutas y prueba adicional del ancho exacto 414 px preparadas.
- Build final **PASS**, 132 rutas y TypeScript PASS, identificador `od7R28WXROlC2unoqTYrk`, fuente de aplicación congelada en `8baf241`. HEAD y build comprobados directamente al iniciar 5190. Lint PASS comunicado por el orquestador. El primer build del integrado `abeacb9` (`1WKHmFkqmBzR9VzpnqZx4`) conserva alcance previo al lote visual final.
- Vitest del lote visual inicial: **2353 PASS, 0 FAIL, 7 pendientes**, JSON con `success: true`; total 2360 casos. Desglose comprobado directamente de `testResults`: **unitarias 1609 PASS/2 pendientes en 64 archivos; integración 744 PASS/5 pendientes en 10 archivos**. El campo agregado informa 230 suites contando grupos, en 74 archivos. Omisiones: cinco casos remotos de `release-supabase` opt-in y dos casos no aplicables a la extensión S1 (sin escenas/misiones). No se confunde con los 2350 PASS del candidato del 18 de octubre.
- Formato completo **PASS** comunicado por el orquestador; push de `8baf241` completado.
- Preflight del integrado: **5/5 Chromium PASS, 3,7 minutos, cero retries**. Incluye el flujo original S1 de crear/publicar/responder sin conexión/entregar/liberar retroalimentación y los cuatro recorridos nuevos de Recursos.
- Capturas del integrado: 46 completas, 46 de viewport y dos de búsqueda, con fixtures propios eliminados. Doce capturas de examen, resultados, monitor y banco se conservaron en `redesign-20261019/preflight-screens/`.
- Suite completa iniciada con 1185 casos/35 specs/tres navegadores/dos workers/cero retries y **detenida por el orquestador para aplicar el lote final de correcciones visuales del revisor**. No hay PASS de suite. Evidencia parcial preservada en `aborted-integration-results/` y `aborted-integration-run.json`: cinco PASS observados, un fallo al esperar el aviso de banco en 5000 ms y seis dependientes sin ejecutar; resto no completado.
- Repetición aislada de la prueba original del banco: **1/1 PASS, 15,3 s**, sin modificar la aserción de 5000 ms ni reintentos. La causa del fallo inicial bajo ejecución simultánea no se demostró. Se conservan ambas evidencias; el nuevo full deberá volver a cubrirla.
- El servidor 5190 se detuvo para el rebuild del lote visual final y se volvió a iniciar tras su salida 0. Recaptura final **completa**: 46 imágenes completas, 46 de viewport y dos de búsqueda en `redesign-20261019/final-visual/`, conservando las anteriores. Dos fixtures locales propios eliminados al terminar. Revisor independiente avisado.
- Full diagnóstico finalizado sobre **8baf241**, build `od7R28WXROlC2unoqTYrk`: **1156 PASS, 26 FAIL, 3 omitidos; cero retries y cero flaky; 89,9 minutos**, 1185 casos en 35 specs. Chromium: 390 PASS/5 FAIL; Edge: 390 PASS/5 FAIL; WebKit: 376 PASS/16 FAIL/3 omitidos. JSON autoritativo `redesign-20261019/final-e2e.json`, log `final-e2e.log`. No se declara suite verde ni se atribuye este diagnóstico a las correcciones posteriores.
- Regresión reproducida en el full: escena 12 de S1, tabla de origen con desplazamiento horizontal interno. Fallan las pruebas originales `presentation.spec.ts` en 1920×1080, 1366×768 y 1280×720 y `visual-presentation.spec.ts` en 1920/1366. Probe independiente con carga directa, fuentes listas y movimiento reducido reproduce ancho interno 589/582, 407/401 y 376/370 px respectivamente. Resultado de la consulta sin desbordamiento. Evidencia: `scene12-geometry.json` y `scene12-{1920,1366,1280}.png`. Se coordina una corrección CSS acotada sin reducir contenido ni modificar aserciones. La suite completó el diagnóstico de los tres navegadores; no se declara PASS mientras permanezcan los fallos.
- Corrección `75c4acf` preparada por el orquestador: ocho líneas CSS limitadas al padding horizontal de las celdas fuente de la escena 12 de S1 en proyector. El full sirvió el build anterior sin recompilarlo y terminó; no se atribuyen sus resultados a esta corrección. El nuevo lote `2caafbd` agrega la protección de hidratación en Recursos S1/S3 y un escritor de URL limitado a 750 ms para evitar la cuota History de WebKit. El probe del build antiguo reproduce `SecurityError` en la llamada 101 de `history.replaceState`; evidencia `output/redesign19/webkit-history-original.json`. El orquestador reconstruye este lote antes de las regresiones originales.
- Desglose de los 26 fallos: 15 desbordamientos internos de la escena 12 S1; siete recorridos de proyector WebKit terminan sin la escena esperada y con la página del navegador «This page couldn’t load» (S2 escena 51; S3 escenas 122/145); dos búsquedas de Recursos S3 WebKit conservan elementos anteriores; una búsqueda docente WebKit resuelve diez filas antes de que el snapshot muestre la fila filtrada correcta; un flujo de evaluación S1 WebKit agota 180000 ms durante Axe después de capturar entrega/resultado. Los tres casos seriales posteriores se omiten por ese timeout. No se alteraron expectativas ni presupuestos para obtener verde.
- Repeticiones aisladas originales preparadas, con reportes separados: búsqueda docente WebKit (una ejecución y dos confirmaciones si pasa); archivo completo `phase5-accounts.spec.ts` WebKit con 180 s intactos; Recursos WebKit; regresión de presentación/proyector en tres navegadores (138 casos), reflujo (9) y ancho exacto 414 (3). Se ejecutarán únicamente tras el nuevo build coordinado.
- Nuevo build de compatibilidad `DTRUd9u7XjMRKhbdHyGGU`, fuente `839a75633e528677c5fc3e76d96f6ad771ff2cd1`, iniciado en 5190 tras build y TypeScript PASS comunicados por el orquestador. Regresión pública finalizada: **143 PASS, 7 FAIL, 0 omitidos, 0 flaky; 21,5 minutos**, reportes `compat-public.*`, distinta del full diagnóstico. Pasan los 12 recorridos de Recursos y todos los recorridos de S3 y de History. Fallan seis visuales S1 escena15 y un proyector S2 WebKit1280, escena54, con scroll interno3px. Se conservan esos fallos para la regresión del lote CSS final. Capturas reales `final-scene12-{1920,1366,1280,1024,390}.png` y medidas `final-scene12-geometry.json`: no hay scroll horizontal de región ni página; fuentes y alturas conservadas. El revisor independiente confirmó el ajuste de escena12.
- Al superar escena12, `visual-presentation.spec.ts` descubre spill de contenido en escena15 (23,14 px en Chromium1920; también1366). Este recorrido antes se detenía en12. Se conserva el fallo original y se coordina un barrido completo S1 para un ajuste posterior acotado; no se declara verde el nuevo lote.
- Vitest de compatibilidad `compat-vitest.json`, comunicado por el orquestador tras salida0: **2359 PASS, 0 FAIL, 7 pendientes** de2366; unitarias1615PASS/2pendientes, integración744PASS/5pendientes. No se atribuye este resultado a cambios posteriores de lógica; el delta final pendiente es CSS acotado.
- Figma MCP ausente; no se consultó ni se afirma usado.

## Evidencia histórica — 18 de octubre

Candidato anterior: `9600b8511b351090cf71d6be2fa67e641dd09baf`; build `h--149NisNNLQ9-Nlj9CL`. Build y HEAD comprobados directamente antes de abrir el servidor 5190. El orquestador confirmó salida 0 del build, con 132 rutas. Las capturas after y la regresión del candidato se guardaron separadas del baseline.

Resultados recuperados de ese candidato: Vitest **2350 PASS, 0 FAIL, 7 pendientes**. Preflight Chromium **4 PASS y 1 timeout a 180000 ms**, sin retries. Pasaron los cuatro recorridos nuevos de Recursos. El flujo original de evaluación S1 agotó el presupuesto después de entregar: snapshot con nota y retroalimentación visibles, pero sin acreditar el final del recorrido ni una causa concreta del timeout. Se conserva el fallo para repetirlo aisladamente sobre el nuevo candidato. `final-e2e.json` de esa fecha corresponde a `--list` (1173 casos sin ejecutar), no a la suite completa.

Capturas after anteriores: **46 completas, 46 de viewport y 2 de búsqueda**, con dos fixtures locales propios eliminados al finalizar. No son evidencia del merge del 19 de octubre.

### Entorno y disponibilidad comprobados el 18 de octubre

- Rama obligatoria: `codex-final-pedagogy-ui-20261004`. El orquestador sincronizó `41baa2c` antes de implementar el nuevo diseño.
- Baseline visual servido con `next start` en `127.0.0.1:5190`, build existente `Yd9Fn6LREpTy8alySv7Y_`. No se atribuye este build al HEAD sincronizado sin una huella de fuente comprobada.
- Node `24.20.0`, npm `11.19.0`, npx disponible; Playwright del proyecto instalado. Inicio real de los tres navegadores comprobado: Chromium `153.0.8010.12`, Microsoft Edge `155.0.4283.45`, WebKit `26.6`.
- Supabase local: `auth/v1/health` HTTP 200, GoTrue `v2.186.0`. Lectura administrativa del Supabase remoto autorizada y ejecutada sin mutaciones ni exportación de usuarios.
- Oracle local: contenedor `running`; `GET /api/oracle/status` HTTP 200, Oracle Database 23 (`23.26.3.0.0`) disponible con `empleados-select-v2`. Esto acredita salud, no la ejecución de todos los ejemplos.
- Figma MCP no aparece entre las herramientas conectadas. No se consultó Figma ni se instaló una integración opcional.
- Vercel, incidencia histórica: credencial existente en `.vercel/cli/auth.json` rechazada con HTTP 403 `forbidden`, «Not authorized». Repetido en `/v2/user` y en la inspección del deployment público, con y sin contexto del equipo. Resuelta el 19 de octubre mediante renovación, según el estado vigente superior.

### Baseline ejecutado

`node scripts/run-local-qa.mjs playwright --config=output/playwright/redesign-20261018/baseline.config.mjs --project=chromium --grep 'páginas públicas|reflujo equivalente|acceso y secciones cumplen'`

Resultado: **19 PASS, 0 FAIL, 0 omisiones, 0 retries; 3,4 minutos**. No sustituye la regresión del diseño nuevo.

- Quince tamaños de página: 320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1366, 1440, 1536, 1600, 1920 y 2560 px.
- Nueve destinos por tamaño: Inicio, Secciones, S1, S2, S3, acceso, presentación, laboratorio y Challenge.
- Tres pruebas de reflujo equivalente a 125/150/200 %; no es zoom nativo ni dispositivo físico.
- Axe WCAG 2.2 AA en once rutas públicas/de acceso, sin violaciones reportadas por este recorrido automatizado. No equivale a certificación ni prueba manual de lector de pantalla.
- Home 390/1440 capturado con Playwright real, sin desbordamiento horizontal de página.
- Evidencia ignorada por Git: `output/playwright/redesign-20261018/baseline-e2e.json`, `before-home-390.png`, `before-home-1440.png`; capturas adicionales e índice en el mismo directorio.
- Capturas adicionales antes del rediseño: 36 entradas indexadas (once rutas públicas y siete privadas a 390/1440), más dos de búsqueda y dos de Home: **40 PNG**. Las privadas incluyen alumno (dashboard, perfil y evaluaciones) y docente (resumen, evaluaciones, nueva evaluación y banco). Se autenticaron dos fixtures locales propios y se eliminaron ambos al terminar; no se modificaron cuentas reales.
- Revisión visual inicial: composición larga por bandas en Inicio; seis paneles apilados de igual peso en Lab; repetición del título en portada de clase; tabla docente móvil extensa por los fixtures locales preexistentes. Son hallazgos de jerarquía/densidad para el equipo de diseño. La captura docente completa alcanza 33223 px: en la revisión final se deben añadir capturas de viewport y revisar las bandas a resolución legible.
- Servidor baseline detenido al acabar las capturas para permitir el nuevo build; no se cambió `.next` mientras sirvió QA.

### Plan de gates definido para el candidato anterior

Pendientes: lint, formato, typecheck, build final, Vitest unitario/integración, regresión E2E del candidato en Chromium/Edge/WebKit, comparación visual antes/después, clases/proyector, teclado/foco/reduced motion, métricas de rendimiento y QA de Preview. Ningún PASS histórico se hereda como resultado del diseño nuevo.

Preparación local reproducible, sin modificar las expectativas existentes:

```powershell
node scripts/run-local-qa.mjs vitest --reporter=json --outputFile=output/playwright/redesign-20261018/final-vitest.json
node scripts/run-local-qa.mjs build
node scripts/run-local-qa.mjs start --port 5190
node scripts/run-local-qa.mjs playwright --config=output/playwright/redesign-20261018/final.config.mjs
```

El build debe ejecutarse cuando ningún servidor QA use `.next`; después se congela la fuente durante la suite. El runner limita Supabase a loopback, reutiliza las credenciales QA ignoradas por Git y activa las pruebas de cuentas/correo local. La configuración final ejecuta todas las specs originales en los tres navegadores con un worker y sin retries. Los fallos se repiten y se conservan con su alcance; no se rebajan aserciones para conseguir verde.

Se añadió `tests/e2e/redesign-resources.spec.ts`: cuatro recorridos nuevos (390/1440 px en las dos implementaciones de Recursos), ejecutables en los tres navegadores. Verifican búsqueda real, resultados vacíos, recuperación, categorías, estado accesible, teclado y axe. Pasaron en el preflight Chromium del candidato anterior; necesitan regresión sobre el merge. Las pruebas originales no se modificaron. La suite incluye `projector-scenes.spec.ts` de Claude, con todas las escenas de S2/S3 en 1920×1080, 1366×768, 1280×720 y 1024×768 y todos los pasos de los recorridos.

Para la evidencia visual final se preparó `capture-before.mjs after`, que produce capturas de viewport además de las completas, y `performance.mjs`, que mide ocho rutas a 390×844 con contexto nuevo, movimiento reducido y observación de tres segundos. Se ejecutarán contra el build congelado. Las métricas históricas conservan su alcance original; no son un baseline de rendimiento del HEAD actual.

No se ha hecho deploy ni commit por parte del agente QA. La decisión Preview → QA → promoción del mismo candidato corresponde al orquestador y requiere gates verdes.
