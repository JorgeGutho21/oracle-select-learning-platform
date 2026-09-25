# Continuidad del proyecto

Actualizado: 24 de septiembre de 2026. Punto de entrada para Codex u otra IA.

## Leer al retomar

1. `AGENTS.md`, este archivo y `README.md`.
2. Los once documentos de `docs/`, empezando por `PROJECT_SPEC.md` y `ROADMAP.md`.
3. El estado real de Git y los archivos de implementación. Este resumen no sustituye comprobar cambios posteriores.

Repositorio único: https://github.com/JorgeGutho21/oracle-select-learning-platform

Copia de desarrollo verificada en el equipo del usuario:
`C:\Users\JORGE GUTIERREZ\Documents\GitHub\oracle-select-learning-platform`.
En otro equipo, usar el clon de ese mismo repositorio. No crear repositorios diferentes por herramienta de IA.

## Objetivo y alcance acordados

SQL SELECT LAB es una plataforma universitaria en español de Jorge Gutierrez Thomas para la asignatura Base de Datos (profesor Amilkar Sierra), programa de Ingeniería de Sistemas de la Universidad Popular del Cesar. Enseña introducción breve a SQL, SELECT, FROM, SELECT *, columnas específicas, expresiones y cálculos, alias con AS, DISTINCT y consultas completas de proyección.

WHERE, BETWEEN, IN, LIKE, NULL, JOIN, ORDER BY, agrupaciones y demás temas avanzados quedan para módulos futuros. Los criterios verificables por módulo están en las especificaciones.

La experiencia incluye Home, Exposición, Estudio, búsqueda Ctrl+K/Cmd+K, vídeo introductorio, explicaciones visuales, tablas interactivas, laboratorio Oracle real, diez misiones de SQL Challenge, arrastre accesible, predicción, detección de errores, reconstrucción, reto escrito, sala por QR, cronómetro, puntos, ranking, estadísticas, vídeo resumen, chuleta y catálogo futuro.

## Estado comprobado

| Elemento                   | Estado                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0: once especificaciones  | Completas y subidas a GitHub.                                                                                                                                                                                                                                                                                                                                                           |
| Estructura por capas       | Next.js App Router y presentación por módulos; límites ESLint; núcleo reservado sin lógica ficticia.                                                                                                                                                                                                                                                                                    |
| README, AGENTS, .gitignore | Creados y versionados.                                                                                                                                                                                                                                                                                                                                                                  |
| R1: Oracle real            | Fase 8: adaptador node-oracledb real, verificado contra Oracle Database 23ai Free local (contenedor con Podman en WSL). Falta una instancia compartida para el despliegue.                                                                                                                                                                                                              |
| R2                         | Cimientos, showcase y Fases 5, 5.1 y 6 (PHASE_5, PHASE_5_1 y PHASE_6 = COMPLETE): Home, Modo Estudio, Modo Exposición de dieciséis escenas, buscador Ctrl/Cmd+K, navegación, reflujo con zoom 200 %, `/resources` completo, catálogo `/modules` e infraestructura de video.                                                                                                             |
| R3–R8                      | R3: laboratorio `/lab` con motor SQL único y ejecución real en Oracle (Fase 8). R4: M01–M10 completas; M10 calificada en Oracle. R6 (Fase 7, PHASE_7 = PARTIAL): sala en vivo funcional, pendiente de Supabase remoto. R5, R7 y R8 pendientes; sin despliegue.                                                                                                                          |
| Pruebas                    | En verde: lint, typecheck, formato, 415 unitarias e integración (21 contra Oracle real y la migración Supabase sobre PostgreSQL embebido), build y 383/384 E2E (el fallo restante, una intermitencia conocida del arrastre en WebKit, pasa 10/10 al repetirse) en Chromium, Edge y WebKit contra el build de producción (puerto 3200). No acredita Supabase remoto ni capacidad medida. |
| Estado detallado           | `docs/PROJECT_STATUS.md`, `docs/CHALLENGE_STATUS.md` y `docs/CODEX_HANDOFF_AUDIT.md` (traspaso de Codex).                                                                                                                                                                                                                                                                               |
| Continuidad y prompt       | Esta entrega añade este archivo y `CODEX_PROMPT.md`.                                                                                                                                                                                                                                                                                                                                    |

Commit inicial documental: `dda7d2b892207d226c78d3f3252827290ccf93dd`. Es una referencia histórica; consultar Git para conocer el último commit y la rama actuales.

La solicitud activa del usuario autoriza exclusivamente cimientos técnicos y DESIGN_SYSTEM: ocho rutas, layouts, componentes y showcase. Se conserva el límite de no implementar todavía contenido, juego ni Supabase. El prompt de desarrollo sigue siendo una plantilla, no amplía este encargo.

## Decisiones que deben conservarse

- Una sola base de trabajo en GitHub, válida para Codex y otras herramientas.
- Presentación, aplicación, dominio e infraestructura separados; no concentrar el producto en una sola página.
- Stack propuesto: Next.js, React, TypeScript estricto, Bootstrap/Sass, CodeMirror y arrastre accesible. Supabase para datos de aplicación, identidad y tiempo real; servicio separado para Oracle. Fijar versiones compatibles al implementar.
- Superficies claras, azul/cian, buena legibilidad en proyector y móvil. Bootstrap, Atera Energy y Spinoff son referencias de diseño; el sitio del compañero solo aporta estructura pedagógica.
- Dataset `empleados-select-v1` de seis empleados y seis columnas, gobernado por `DATABASE_SCHEMA.md`. Se eligió F1: María tiene 30 años; Jorge, 22 y departamento Sistemas. No mezclar los datos divergentes del juego o F2 ni añadir TELEFONO a esta unidad.
- Exactamente diez misiones. La definición de evaluación y puntos está en `GAME_SPEC.md`; máximo 1000 puntos. En sala, el servidor gobierna puntuación y tiempo.
- Laboratorio real significa ejecución comprobada en Oracle. Si falta el servicio, mostrar indisponibilidad; las demostraciones visuales no acreditan este requisito.
- Objetivo de sala: 60 participantes, con prueba adicional a 75 conexiones. Es una meta pendiente de medición.
- Oracle (Fase 8): adaptador `OracledbQueryExecutor` (oracledb 7.0.1, modo Thin) compuesto solo en el servidor; cuenta lectora con `CREATE SESSION` y `READ`, propietario sin inicio de sesión, grupo de 10, cola de 60 y plazo total de 5 s. M10 vigente (GAME_SPEC 2.0) por decisión del responsable, no la consulta alternativa propuesta en el encargo. Local: `npm run oracle:up` y `npm run oracle:setup` (Docker o, si su motor no arranca, Podman en WSL; puerto 1522 porque este equipo tiene un Oracle 18c XE nativo en 1521).
- Sala en vivo 1.1 (Fase 7): a ritmo propio, sin rondas ni pausa; profesor con `PRESENTER_ACCESS_CODE` y estudiantes con token por sala en cookie `httpOnly` (sin cuentas). Supabase solo guarda la actividad de la sala y avisa por Broadcast con la revisión; React nunca lee ni escribe tablas. `CLASSROOM_BACKEND=memory` es solo para desarrollo, pruebas o un único proceso en el aula. Ranking y estadísticas siguen GAME_SPEC (puntos, resueltas, tiempo; ranking de competición; tasas sobre el grupo).

## Fuentes y límites del traspaso

Las especificaciones sintetizan los materiales revisados y sus discrepancias. `PROJECT_SPEC.md` contiene el inventario F1–F7 y `CONTENT_MAP.md` la trazabilidad educativa.

| Fuente                                                                 | Disponibilidad y alcance revisado                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SentenciasSQL_GM.pptx`                                                | 35 diapositivas revisadas; original adjunto en la conversación, no incluido en este repositorio.                               |
| `Oracle_SQL_NTB.pptx`                                                  | 21 diapositivas de imágenes revisadas visualmente; original no incluido en este repositorio.                                   |
| [Juego del usuario](https://claude.ai/artifact/WN1sTa6YEJfuPysmX64qtv) | Se revisaron portada, mapa y primera misión. Código fuente no exportado ni auditado; los niveles bloqueados no se completaron. |
| Capturas Bootstrap/Atera Energy/Spinoff                                | Referencias visuales descritas en DESIGN_SYSTEM; las capturas originales no están versionadas.                                 |
| [Sitio del compañero](https://select-basico-jpatino.vercel.app/)       | Estructura educativa revisada; no copiar diseño, marca, contenido ni componentes.                                              |

Conversaciones de origen: «Diseñar Documentación Plataforma SQL» (`6ab408e7-e70c-83e9-bb3f-986a1d4ecc0b`) y «Diseñar plataforma SELECT» (`6ab3fcaa-8e8c-83e9-bd47-488891234527`). Sus identificadores son referencias, no garantizan acceso desde otra IA. Este archivo es una síntesis, no una exportación literal del historial ni de sus adjuntos.

La última captura muestra una carpeta `Presentacion_SELECT_JorgeGutierrez/Juego_Select`. Su ruta absoluta y contenido no se han verificado. No asumir que contiene el repositorio ni sobrescribirla. Si se necesita reutilizar el código del juego, localizar y revisar esa exportación antes de integrarla.

## Siguiente trabajo

Fases 1 a 6 cerradas (la 5 continúa y completa el trabajo de Codex auditado en `docs/CODEX_HANDOFF_AUDIT.md`); Fase 7 implementada y marcada PARTIAL hasta validarla en Supabase remoto. La rama de trabajo autorizada es `claude-finish-20260923`; no trabajar en `main` ni hacer push a `main`. Siguientes pasos: una instancia Oracle accesible desde el despliegue con la cuenta lectora (`docs/ORACLE_SETUP.md`, opción B), validar la sala con un proyecto Supabase real (`docs/SUPABASE_SETUP.md`, sección «Validación pendiente»: variables, migración, dos móviles reales y ensayo de 60 participantes), R1 (Oracle y adaptador node-oracledb del puerto `OracleQueryExecutor`), despliegue con `NEXT_PUBLIC_SITE_URL`, producción y publicación de V01/V02 (basta completar `src/features/resources/domain/videos.ts`), validación del uso público del emblema y la decisión sobre la bonificación por tiempo (contradice GAME_SPEC y vale 0). Oracle no está simulado.

Pendientes externos concretos: instancia Oracle compartida para el despliegue (la local ya funciona); proyecto Supabase con sus claves (URL, `service_role`, `anon`) y la clave del profesor; vídeos definitivos; permiso de uso del logotipo; tiempo final asignado a la exposición. Documentar qué bloquea cada pendiente y continuar el trabajo independiente.

## Protocolo para evitar pérdida de contexto

Al cerrar cada sesión o hito, la IA que trabaja debe actualizar este archivo con:

- Fecha, rama y último commit conocido, distinguiendo cambios locales de cambios subidos.
- Funciones implementadas y archivos relevantes.
- Decisiones nuevas y documentos afectados.
- Verificaciones ejecutadas, resultado y pruebas todavía pendientes.
- Bloqueos reales y siguiente acción concreta para retomar.

Guardar avances durante el trabajo, sin esperar a que se agote el contexto. Crear commits coherentes y sincronizarlos con el remoto cuando esté autorizado y disponible. Si falla la subida, indicarlo: guardar localmente no equivale a tener copia en GitHub. No incluir secretos ni historiales privados completos.

Otra IA necesita acceso al repositorio actualizado, o a una copia descargada con estos archivos. Este mecanismo conserva el trabajo; no cambia automáticamente de proveedor, no transfiere sesiones y no evita los límites de uso de cada servicio.

## Registro de sesiones

- 2026-09-23: especificaciones y estructura inicial verificadas y publicadas en `main`, commit inicial arriba indicado. Sin código de aplicación.
- 2026-09-23: preparación de continuidad y prompt reutilizable por petición del usuario. Verificación documental: conservación de los once documentos académicos, enlaces locales y formato de cambios; sin pruebas de aplicación aplicables.
- 2026-09-23: implementación local de cimientos y diseño sobre `main`, partiendo de `e1c6c2b`. Stack fijado, ocho rutas base, trece componentes, tokens Sass/CSS y showcase. Decisiones en `docs/IMPLEMENTATION_NOTES.md`. Validación final en curso; cambios todavía no sincronizados con GitHub.
- 2026-09-23: auditoría de estado sin cambios de código. Se crearon `docs/PROJECT_STATUS.md` y `docs/CHALLENGE_STATUS.md`: las misiones M01–M10 están en MISSING. Se detectó una E2E intermitente en WebKit (diálogo, timeout de 30 s).
- 2026-09-23: Fase 1, estabilización técnica, en `claude-finish-20260923`. Causa: el screencast de la traza `retain-on-failure` en WebKit/Windows duplicaba la duración de las pruebas. Solución: el proyecto `webkit` de `playwright.config.ts` graba la traza sin screenshots. Sin cambios de timeouts, pruebas ni componentes. Verificado: lint, typecheck, format:check, 22/22 unitarias, build, 75/75 E2E y 11 repeticiones de la prueba del diálogo en WebKit. Commit `fix: stabilize base test suite`, subido a `origin/claude-finish-20260923`.
- 2026-09-23: Fase 2, núcleo del SQL Challenge, en `claude-finish-20260923`. Dataset único en `src/domain/dataset`, comparación de resultados en `src/domain/results` y módulo `src/features/challenge` con domain (tipos `MissionDefinition`, catálogo público M01–M10, rúbricas privadas, puntuación, estado, resultado y restauración), application (puertos y `ChallengeEngine`) e infrastructure (repositorio `localStorage`, evaluador en proceso, reloj). Sin pantallas ni dependencias nuevas; CodeMirror no se instaló. `timeBonus` queda en 0 por GAME_SPEC. Verificado: lint, typecheck, format:check, 143/143 unitarias, build y 75/75 E2E. Commit `feat: implement challenge domain and game engine`, subido a `origin/claude-finish-20260923`.
- 2026-09-23: Fase 3, Challenge interactivo, en `claude-finish-20260923`. El usuario eligió adoptar sus nuevas M01–M09 como Challenge v2: se actualizaron GAME_SPEC.md 2.0 y TEST_PLAN.md y el catálogo pasó a `select-challenge-v2`. M08 conserva la regla de LAB10 (alias implícito, fallo de objetivo). Se instaló dnd-kit (core 6.3.1, sortable 10.0.0, utilities 3.2.2) y se crearon `SequenceBuilder`, el analizador `src/domain/sql/projection-query.ts`, la presentación del Challenge y la raíz de composición `src/composition` con Server Functions (G15 comprobado en el build). Se corrigió un desbordamiento móvil del `DataTable` base. Verificado: lint, typecheck, format:check, 189 unitarias, build y 126/126 E2E. Commit `feat: implement interactive sql challenge missions`, subido a `origin/claude-finish-20260923`.
- 2026-09-23: Fase 4, motor SQL educativo y laboratorio, en `claude-finish-20260923`. Motor único en `src/domain/sql`: léxico, parser a AST, analizador, evaluador sin `eval`, traductor, anatomía y sentencia canónica, con diagnósticos pedagógicos localizados. Reutilizado por `/lab` y por M05, M08, M09 y M10; se retiraron los analizadores provisionales. Instalado CodeMirror 6 (versiones exactas) con el editor compartido `SqlEditor`. `/lab` tiene seis paneles y separa la vista previa educativa de la ejecución Oracle. Nuevo puerto `OracleQueryExecutor` con el adaptador `UnconfiguredOracleExecutor` («no conectado»). M10 tiene editor, revisión sin puntuar y corrección estructural; su calificación final queda para Oracle. Verificado: lint, typecheck, format:check, 250 unitarias, build y 144/144 E2E. Commit `feat: implement sql parser and interactive laboratory`, subido a `origin/claude-finish-20260923`.
- 2026-09-23: auditoría del traspaso de Codex (Fase 5) en `claude-finish-20260923`. Checkpoint `8932edb` con su estado exacto: 39 archivos, build roto por un `@use` Sass duplicado y 12 archivos sin formato. Se conserva todo (ningún REVERT), se corrigen los errores obvios (Sass, formato, rechazo de pantalla completa, rótulo en inglés y etiquetas de navegación distintas de la especificación) y se normaliza la identidad: Jorge Gutierrez Thomas, profesor Amilkar Sierra, Base de Datos, Ingeniería de Sistemas, Universidad Popular del Cesar, con `src/application/academic-identity.ts` como única fuente. El logotipo se verificó contra `adaggio.unicesar.edu.co` (huella y proporción originales) y se conserva. Detalle en `docs/CODEX_HANDOFF_AUDIT.md`. Commit `chore: audit and preserve codex phase 5 handoff`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 5, experiencia educativa, en `claude-finish-20260923`. Se reutiliza el trabajo de Codex y se completa: Home con hero «ORACLE DATABASE · SQL FUNDAMENTALS», cuatro acciones y bandas alternas; Estudio con esquema central de lecciones (`features/study/domain/lesson-outline.ts`), sintaxis, pasos visuales derivados del motor y progreso validado en aplicación; Exposición de dieciséis escenas en lienzo 16:9 con unidades de contenedor, teclado, pantalla completa, reanudación local (`features/presentation`, con raíz de composición) y QR real hacia la práctica individual (`qrcode-generator` 2.0.4, carga diferida); buscador con conceptos enlazados a la chuleta; barra Inicio, Aprender, Laboratorio, Challenge, En vivo, Recursos y Buscar; pie con la identidad completa. Corregidos errores de Codex en el buscador (ARIA del listbox, coincidencias por palabras cortas, orden activo) y el foco que el diálogo dejaba en un campo oculto. Las E2E pasan a usar el build de producción en el puerto 3200. Documentos actualizados: CONTENT_MAP 1.1 (dieciséis escenas), UX_FLOWS, DESIGN_SYSTEM, PROJECT_SPEC, TEST_PLAN, ROADMAP, README, PROJECT_STATUS y CODEX_HANDOFF_AUDIT. Verificado: lint, typecheck, format:check, 302 unitarias, build (sin rúbricas en el cliente) y 270/270 E2E en 8,3 min; CodeMirror solo en `/lab` y el QR solo en la escena 15. Commit `feat: complete learning presentation and global search`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 5.1, endurecimiento responsive y de accesibilidad, en `claude-finish-20260923`. Causa del desborde con zoom 200 % (180 px CSS): rejillas CSS sin columnas explícitas en el laboratorio (`lab-panel`, `lab-anatomy`, leyenda y pasos) y en el Challenge (`ch-layout__map`, `ch-mission` y otras); su columna implícita `auto` crecía hasta el ancho mínimo del contenido (editor, selector, pedidos entre comillas). Solución solo en estilos: `grid-template-columns: minmax(0, 1fr)`, mínimos `min(Npx, 100%)`, corte de palabras largas y márgenes compactos por debajo de 300 px; el editor compartido ajusta las líneas (`EditorView.lineWrapping`). En WebKit: `contain: paint` en los `<select>` (su texto interno contaba para el ancho de la página) y el panel del menú móvil oculto mientras está cerrado; el menú ya no se cierra al hidratar si se tocó antes. Sin `overflow-x: hidden` y sin cambios de lógica. Identidad académica verificada en el HTML de todas las rutas; la descripción de metadatos usa la fuente única. El QR usa el origen de la página, sin host fijo. Documentado que el uso público del emblema requiere validación del responsable académico. Nueva `tests/e2e/reflow.spec.ts` y 360×800 en la matriz responsive. Verificado: lint, typecheck, format:check, 302 unitarias, build (sin rúbricas en el cliente) y 306/306 E2E en 12,6 min. Commit `fix: harden responsive learning experience`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 6, recursos, catálogo y multimedia, en `claude-finish-20260923`. Catálogo `/modules` desde `src/features/modules/domain/catalog.ts` (SELECT actual con progreso local; WHERE, BETWEEN, IN, LIKE, JOIN, GROUP BY y Funciones «Próximamente», sin contenido); Home y buscador leen la misma fuente. `/resources` rehecho: accesos directos, chuleta de siete conceptos, referencia rápida, ejemplos LAB01–LAB09, videos y fuentes (F7 y material del curso); impresión de chuleta y referencia. Videos: configuración central `src/features/resources/domain/videos.ts` (ambas URLs en `null`) y `VideoPlayer` 16:9 con marcador, carga, error, subtítulos y transcripción; ubicados en Home, inicio y final de `/learn`, escena 14 y Recursos. El esquema de lecciones define también los conceptos de la chuleta, que el buscador ya no duplica. «Video» sin tilde en toda la interfaz. Motor SQL y Challenge sin cambios. Verificado: lint, typecheck, format:check, 314 unitarias, build (sin rúbricas en el cliente) y 357/357 E2E en 16,0 min. Commit `feat: complete learning resources and module catalog`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 7, sala en vivo, en `claude-finish-20260923`. Módulo `src/features/classroom` (dominio: código, alias, estados, ranking y estadísticas; aplicación: `ClassroomService`, puertos y Zod; infraestructura: repositorios Supabase y memoria, Broadcast, tokens) y raíz `src/composition/classroom` (`server-only`, Server Functions con cookies `httpOnly`, Challenge en vivo sobre el mismo `ChallengeEngine`). Rutas `/presenter`, `/presenter/[code]`, `/join/[code]`, `/live` y `/results`; QR con URL pública (`src/application/public-url.ts`). Migración `supabase/migrations/20260924120000_classroom.sql` (naming de DATABASE_SCHEMA; correspondencia con el pedido en ese documento), `.env.example` y `docs/SUPABASE_SETUP.md`. Dependencias exactas: zod 4.6.5, @supabase/supabase-js 2.117.1 y @electric-sql/pglite 0.5.8 (desarrollo). Documentos: REALTIME_SPEC 1.1, DATABASE_SCHEMA 1.1, UX_FLOWS 1.1, GAME_SPEC (tiempo de ranking a ritmo propio), ARCHITECTURE, TEST_PLAN y PROJECT_STATUS. Se alinearon ranking y estadísticas con GAME_SPEC; se corrigieron el foco al cambiar de pantalla, los formularios escritos antes de hidratar (WebKit) y dos defectos intermitentes anteriores: el plazo del foco del buscador y la ayuda contextual enfocada antes de hidratar. Verificado: lint, typecheck, format:check, 377 unitarias e integración, build (G15 y sin clave de servicio en el cliente) y 375/375 E2E en 11,6 min en Chromium, Edge y WebKit. Sin credenciales Supabase: PHASE_7 = PARTIAL (funcional; falta la validación remota y medir capacidad). Commit `feat: implement realtime classroom challenge`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 8, Oracle real y M10, en `claude-finish-20260923`. Adaptador `src/infrastructure/oracle/oracledb-query-executor.ts` (grupo, cola, plazo, límites de filas y bytes, precisión decimal, errores ORA controlados, salud con dataset y privilegios efectivos), configuración `oracle-config.ts`, clasificación de errores y raíz `src/composition/oracle/oracle-server.ts` (`server-only`) compartida por `/lab`, el Challenge y la sala; `oracledb` 7.0.1 fuera del empaquetado. Carga versionada `oracle/empleados-select-v1.sql` y script `scripts/oracle-local.mjs`. Docker Desktop no arrancaba su motor: se instaló Podman en la Ubuntu de WSL y se usó la imagen oficial `database/free:latest-lite`. Corregidos al ejecutar contra Oracle: `close(undefined)` no devolvía conexiones al grupo y `- -SALARIO` se enviaba como comentario `--`. Documentos: ORACLE_SETUP (nuevo), LAB_SPEC 1.1, ARCHITECTURE, DATABASE_SCHEMA, TEST_PLAN, CHALLENGE_STATUS (M10 DONE), PROJECT_STATUS, ROADMAP, README y .env.example. Verificado: lint, typecheck, format:check, 415 unitarias e integración (21 con Oracle real), build y 383/384 E2E en 14,7 min con Oracle real (arrastre de M01 en WebKit intermitente, 10/10 al repetirlo) y 54 pasan + 6 omitidas sin Oracle. PHASE_8 = COMPLETE con Oracle local; falta la instancia compartida del despliegue. Commit `feat: connect real oracle execution and complete boss mission`, subido a `origin/claude-finish-20260923`.
- 2026-09-24: Fase 9, auditoría preproducción, en `claude-finish-20260923`. Informe `docs/FINAL_AUDIT.md`. Ningún CRITICAL. Seis MAJOR corregidos:
  - cabeceras de seguridad y CSP en `next.config.ts`;
  - contraste de `.hl-table .is-dim`;
  - código y sintaxis que ajustan líneas en lugar de desplazarse, y la región enfocable del terminal de la Home;
  - cuadrícula de `.scene` con `minmax(0, 1fr)` y palabras largas en el modo fluido;
  - cabecera de tarjetas de `/modules`;
  - foco del Challenge como estado, con reintento en WebKit al cerrar el diálogo.

  Doce MINOR documentados. Regresiones en `tests/e2e/audit-regressions.spec.ts`. Verificado: lint, typecheck, format:check, 415 unitarias, build y E2E sobre el código final: 479/480, con el único fallo, M02 en WebKit por el reintento de foco, corregido y verificado 120/120. Después, 478/480 y 477/480 con la CPU al 100 % por procesos ajenos; todos esos fallos fueron plazos y pasaron al repetirlos. READY_FOR_DEPLOYMENT = true, con los prerrequisitos de despliegue de la auditoría. Sin deploy. Commit `chore: complete production readiness audit`, subido a `origin/claude-finish-20260923`.

- 2026-09-25: Fase 10, integración final, en `claude-finish-20260923`.
  - **Videos:** los dos MP4 del autor se sirven sin recodificar desde `public/media` (31 MB, H.264/AAC con `moov` al inicio).
    - V01 «Introducción a SELECT en Oracle SQL»: 1:13, vertical 9:16, con subtítulos incrustados. Está en Home y al inicio de `/learn`.
    - V02 «Fundamentos de Oracle SQL»: 4:51, 16:9. Está al final de `/learn`, en la escena 14 y en Recursos.
    - `VideoPlayer` admite ahora la orientación vertical y la duración real. Usa `preload="none"` (F10-03) y detecta un error anterior a la hidratación (F10-02).
  - **Activos:** favicon (ICO, SVG y Apple), OpenGraph sin el emblema, título de Home, `global-error.tsx` y `retry()` en `error.tsx`. Las URL de QR se parten entre partes.
  - **QR en producción:** en Vercel usa el dominio de producción del proyecto (F10-09).
  - **Documentación:**
    - `docs/PRODUCTION_SETUP.md`, con las variables clasificadas REQUIRED/OPTIONAL y AVAILABLE/MISSING;
    - `docs/DEPLOYMENT.md`, con el estado de Vercel y la reversión;
    - `.vercelignore`, porque el CLI no lee `.gitignore`;
    - corregido el puerto local 1522 en ORACLE_SETUP.
  - **Vercel:**
    - El CLI inició sesión con la cuenta del responsable. La sesión se guarda en `.vercel/cli/`, ignorado.
    - Se creó el proyecto `sql-select-lab`.
    - El primer `vercel deploy`, sin `--prod`, salió como producción y con preset «Other». Se retiró el alias `sql-select-lab.vercel.app` y se fijó el preset Next.js (F10-07).
    - Se revirtieron los cambios de `vercel link` en `.gitignore` y `.env.local` (F10-08).
    - Se lanzó una vista previa, pero el sistema de permisos bloqueó seguirla: no está verificada.
  - **Verificado:**
    - lint, typecheck, format:check, 421 unitarias (21 con Oracle real) y build desde cero;
    - QA visual e interactiva con 0 hallazgos en 10 tamaños y zoom 200 %;
    - E2E final completa 487/489 en 43,2 min con 1 worker y la CPU saturada por procesos ajenos; los dos plazos de Edge pasaron 15/15 al repetirlos;
    - tras F10-09, 111/111 en sala, exposición y rutas.
  - **Estado:** READY_FOR_DEPLOYMENT = true y PRODUCTION_READY = false.
  - **Pendiente:**
    - una instancia Oracle alcanzable desde Vercel;
    - un proyecto Supabase;
    - los subtítulos de V02 (F10-01): requiere autorizar la descarga de un modelo Whisper o subtítulos del autor;
    - la vista previa y la prueba de humo;
    - opcionalmente, pausar el despliegue de producción involuntario con `vercel project pause sql-select-lab`.
  - **Commits:** `release: finalize production-ready learning platform` y los anteriores de la fase, subidos a `origin/claude-finish-20260923`.
