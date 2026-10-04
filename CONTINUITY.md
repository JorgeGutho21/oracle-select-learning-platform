# Continuidad del proyecto

Actualizado: 4 de octubre de 2026 (Colombia). Fase 5 en curso en `codex-phase5-production-final-20261004`, creada desde la Fase 4 verificada `6fda02b`. El encargo actual de integración, QA y producción prevalece sobre las instrucciones históricas de alcance que aparecen más abajo.

## Fase 5: estado de trabajo

- Se preservaron los cuatro archivos de QA locales anteriores en el checkpoint `01e83ac`, en la rama anterior. El documento personal `docs/Guia_herramientas_SQL_SELECT_LAB.docx` se conserva sin incorporarlo.
- Base: lint, typecheck y build pasan. Se corrigieron el formato de finales de línea en Windows y una comparación de SQL generado; las primeras pruebas dieron 1351 unitarias correctas, un fallo de finales de línea y dos omisiones deliberadas; 298 integraciones pasaron con 313 omitidas por servicios no configurados.
- Oracle Free existente está iniciado. Se creó únicamente el esquema local nuevo `DBLAB_CURRICULO`; se preservaron las cuentas y tablas del laboratorio. La integración Oracle/PGlite pasó 599 pruebas; Oracle Cloud 19c pasó 102 pruebas de S1. El currículo completo de S2/S3 se comprobó en Free, no en 19c.
- Supabase remoto: migraciones `20261002120000` y `20261003120000` aplicadas el 3 de octubre por conexión TLS con CA oficial y verificación de nombre. Las 18 tablas públicas tienen RLS. Recuentos de salas, participantes, intentos, pistas y resultados preservados. Microsoft desactivado.
- Los 140 E2E históricos seleccionados pasan. La suite completa Chromium dio 344 PASS y dos fallos de expectativas antiguas de identidad; ambas pruebas se actualizaron. Los 11 recorridos de evaluación y progreso por sección pasaron antes del ajuste visual final. La revisión de capturas encontró `.dv__groups` oculta en las tablas móviles: corregido y añadido control de visibilidad. La portada ahora suma las 78 lecciones. Validación final de esos cambios en curso.
- Vitest completo con Oracle y Supabase locales: 1974 PASS, cero fallos, siete omisiones (dos deliberadas y cinco smoke remotas que ya pasaron aparte). Los 40 logins simultáneos pasan; p95 2299 ms en la última ejecución local. Progreso/presencia: 40 clientes, 120 registros, 368 ms total y p95 353 ms; no es medición de producción.
- Edge completo pasa 348/348 sin omisiones ni retries. Chromium dirigido final pasa 68/68, incluida metadata S1 y el examen del estudiante; WebKit completo sigue en curso. Firefox oficial reinstalado no arranca: `spawn UNKNOWN`, dos repeticiones aisladas y evento SideBySide 33 por ensamblado `mozglue` ausente. No se parchearon binarios ni el sistema. El informe debe marcarlo BLOCKED.
- CSV: la nota del resumen ahora respeta la coma decimal en el formato para Excel y neutraliza fórmulas precedidas por espacios o caracteres de control.
- Producción comprobada: `dpl_8EjVpuRWJfYvuqocHZR6nWA17ou2`, commit `874f7748acf030f62dbb02bbaea0b204bdd36441`; DB LAB aún no se ha desplegado. No hay integración Git conectada en el proyecto Vercel. No promover hasta validar el Preview y cumplir los criterios críticos del encargo.
- Evidencia local en `output/playwright/phase5/` (ignorada). Supabase local ya funciona en Podman/WSL, separado del remoto. `scripts/run-local-qa.mjs` fija todas las claves locales y la sala en memoria. El servidor QA propio usa 127.0.0.1:3200.
- SMTP y buzón autorizado pendientes de respuesta del responsable (preguntas asíncronas enviadas). La confirmación y recuperación Mailpit locales pasan; no atribuirles entrega remota. Un sondeo con dirección QA reservada devolvió correo inválido y no demuestra configuración SMTP. Microsoft remoto está desactivado. No promover producción hasta cerrar los criterios críticos.
- Código y QA guardados en commits `cb9bfd1` (CSV), `21ac3c2` (identidad/progreso/tablas) y `33f5f91` (QA local/remota protegida). Aún no subidos. QA remota preparada con bypass solo para el Preview READY del proyecto verificado, sin trazas; las cuentas/exámenes/sala temporales se limpian por IDs propios. Documentación de release y despliegue Preview pendientes.

## Leer al retomar

1. `AGENTS.md`, este archivo y `README.md`.
2. Los once documentos de `docs/`, empezando por `PROJECT_SPEC.md` y `ROADMAP.md`.
3. El estado real de Git y los archivos de implementación. Este resumen no sustituye comprobar cambios posteriores.

Repositorio único: https://github.com/JorgeGutho21/oracle-select-learning-platform

Copia de desarrollo verificada en el equipo del usuario:
`C:\Users\JORGE GUTIERREZ\Documents\GitHub\oracle-select-learning-platform`.
En otro equipo, usar el clon de ese mismo repositorio. No crear repositorios diferentes por herramienta de IA.

## Objetivo y alcance acordados

**DB LAB (desde el 3 de octubre de 2026):**

- La plataforma se llama **DB LAB, Plataforma interactiva de Bases de Datos con Oracle**. Créditos: desarrollado por Jorge Gutiérrez Thomas; docente Amilkar Sierra Romano; contexto, Bases de Datos.
- Se organiza en tres secciones (`/sections`):
  1. **Fundamentos SQL:** disponible; es todo lo que se describe abajo.
  2. **Consultas relacionales y análisis:** disponible desde la Fase 4 (`docs/SECTION_2_CURRICULUM.md`).
  3. **PL/SQL y automatización:** disponible desde la Fase 4 (`docs/SECTION_3_CURRICULUM.md`).
- Fase 2 (rama `claude-phase2-auth-progress-20261002`):
  - cuentas con Supabase Auth (invitado, correo y contraseña, Microsoft cuando se configure);
  - roles `student` y `teacher`, este último asignado solo con `scripts/assign-role.mjs` o `admin_set_role`;
  - progreso sincronizado con fusión del progreso de invitado;
  - `/dashboard`, `/profile` y `/teacher`;
  - RLS en todas las tablas nuevas.
  - Detalle en `docs/AUTH_ARCHITECTURE.md`.
- Fase 3 (rama `claude-phase3-assessments-20261003`):
  - banco de preguntas (diez tipos, versionado) con 50 preguntas oficiales de Fundamentos SQL;
  - evaluaciones del profesor, examen con tiempo del servidor y autoguardado, nota 0.0–5.0 calculada en la base, retroalimentación liberada por el profesor;
  - supervisión de eventos del navegador con monitor en vivo, resultados, análisis por pregunta y exportación CSV;
  - detalle en `docs/ASSESSMENT_ARCHITECTURE.md`.
- Fuera de la Fase 3: contenido y banco de las secciones 2 y 3, preguntas de SQL ejecutado en Oracle, grupos o cursos.
- Fase 4 (rama `claude-phase4-curriculum-20261003`):
  - fuente curricular única en `src/features/curriculum/` (`docs/CURRICULUM_ARCHITECTURE.md`);
  - secciones 2 y 3 completas con sus seis modos;
  - auditoría de la Sección 1 con el bloque I «Funciones de una fila» (`docs/SECTION_1_AUDIT.md`);
  - bancos oficiales de 50 + 50 preguntas;
  - 222 resultados verificados en Oracle Database 23.26 (`docs/ORACLE_VALIDATION.md`);
  - QA en `docs/PHASE4_QA.md`.
- Decisiones en `docs/ARCHITECTURE.md` (sección DB LAB) y `docs/DESIGN_SYSTEM.md` 3.0.

SQL SELECT LAB es una plataforma universitaria en español de Jorge Gutierrez Thomas para la asignatura Base de Datos (profesor Amilkar Sierra), programa de Ingeniería de Sistemas de la Universidad Popular del Cesar. Desde la reingeniería del 25 de septiembre de 2026 enseña el **Nivel 1, SELECT fundamental** completo: base de datos, tabla, fila, columna y SQL; SELECT, FROM, `*`, columnas, expresiones, precedencia, alias con AS, concatenación, DISTINCT, WHERE, comparaciones, AND/OR/NOT, paréntesis, BETWEEN, IN, LIKE, NULL, ORDER BY, la consulta completa y los errores frecuentes (22 lecciones, 29 escenas).

Funciones, agrupación, JOIN, subconsultas, INSERT/UPDATE/DELETE con COMMIT/ROLLBACK y DDL son los niveles 2 a 7: 46 fichas «Próximamente» en `/modules`, sin lecciones ni misiones. Mapa completo en `docs/CONTENT_MAP.md`.

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
- Dataset `empleados-select-v2` (12 columnas, 20 filas diseñadas para cada concepto), gobernado por `DATABASE_SCHEMA.md` 2.0. Fuente única: `src/domain/dataset/empleados.ts`, cargada en Oracle desde `oracle/empleados-select-v2.sql` (una prueba exige que coincidan). v1 (6 filas) se conserva en su script y en los esquemas Oracle `SQL_LAB_OWNER`/`SQL_LAB_READER` para volver atrás. En Oracle, v2 vive en `SQL_LAB_V2_OWNER` (sin inicio de sesión) y `SQL_LAB_V2_READER` (solo `CREATE SESSION` y `READ`).
- El motor educativo (`src/domain/sql`) es la referencia del Estudio, la Exposición, el laboratorio y el Challenge; `tests/integration/oracle-real.test.ts` exige que Oracle devuelva lo mismo en cada consulta del contenido. Ningún tema de los niveles 2 a 7 entra al recorrido actual.
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

**DB LAB:**

- **Fase 1:** implementada y verificada en `claude/gallant-cori-4rp11r`. Pendientes:
  - la vista previa en Vercel, con el CLI desde el equipo del responsable;
  - su revisión;
  - después, decidir la producción.
- **Fase 2:** cuentas, progreso en servidor y evaluaciones. Seguir los contratos descritos en ARCHITECTURE.md.
- **Fase 4:** implementada en `claude-phase4-curriculum-20261003`. Pendientes:
  - revisión humana del profesor sobre los bancos 2 y 3;
  - vista previa (bloqueada en este entorno);
  - pruebas en Edge y WebKit, y con Oracle 19c o Autonomous (no probadas);
  - decidir la Fase 5.
- No editar `oracle-results.json` a mano: se regenera con `CURRICULUM_UPDATE=1 npx vitest run tests/integration/curriculum-oracle.test.ts` contra Oracle real.

**Histórico de fases anteriores:**

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
- 2026-09-25: Fase 11, cierre con servicios reales, en `claude-finish-20260923`.
  - **Secretos:**
    - `PASSWORD.txt` y `.secrets/` quedaron fuera de Git y de `.vercelignore` antes de integrar (commit `38ddc02`).
    - Ningún valor secreto aparece en el historial ni en producción.
  - **Supabase real:**
    - Migración aplicada con el CLI a través del pooler IPv4 de us-west-2; la conexión directa es solo IPv6.
    - Con la clave publishable responde `42501`.
    - Suite de la sala 15/15 contra el proyecto real; Realtime conectado.
    - Código adaptado a las claves publishable y secret, y `.env.local` normalizado.
  - **Oracle Cloud:**
    - SQLSelectLab, 19.33, Always Free, sa-bogota-1, con mTLS.
    - La cartera nueva en `.secrets/` y las contraseñas en `.env.oracle.local` las aportó el usuario.
    - `scripts/oracle-cloud.mjs setup` creó `SQL_LAB_OWNER.EMPLEADOS` y `SQL_LAB_READER`.
    - El adaptador lee `ORACLE_WALLET_PEM_BASE64` y `ORACLE_WALLET_PASSWORD`.
    - 21/21 pruebas reales; `/lab` y M10 funcionan en la nube.
  - **Subtítulos V02:** Whisper small local, revisado a mano; 110 subtítulos y transcripción.
  - **Vercel:**
    - 12 variables por entorno, cargadas por stdin y como _sensitive_. En Preview, la clave de profesor es de prueba.
    - La CSP admite la barra de Vercel solo en vistas previas.
    - Vista previa `sql-select-k0pfbzctk…`: 22/22.
    - Producción `dpl_61KPNiQv…` en https://sql-select-lab.vercel.app: 24/24.
  - **Verificado:**
    - lint, typecheck, format y 426 unitarias;
    - build en local y en Vercel;
    - E2E 482/489 (los 7 fallos, plazos de WebKit con la CPU al 100 %; repetidos 40/42, sin fallo lógico);
    - QA visual en producción con 0 hallazgos.
  - **Estado:** PRODUCTION_READY = true.
  - **Pendiente del usuario:**
    - crear una sala en producción con su clave;
    - cambiar la contraseña de ADMIN de Oracle Cloud, que se escribió en el chat;
    - la escucha final de los subtítulos;
    - validar el uso del emblema;
    - opcional: ensayo con 50–60 móviles.
  - **Commits:** `release: finalize production learning platform` y los anteriores de la fase, subidos a `origin/claude-finish-20260923`.
- 2026-09-25: reingeniería educativa (unidad Oracle SQL fundamental) en `claude-finish-20260923`. Plan en `docs/CONTENT_REDESIGN_PLAN.md`.
  - **Dataset v2:** `empleados-select-v2`, 12 columnas y 20 filas; fuente única en `src/domain/dataset/empleados.ts` y `oracle/empleados-select-v2.sql`.
  - **Motor SQL:** WHERE, comparaciones, AND/OR/NOT, paréntesis, BETWEEN, IN, LIKE, IS NULL, ORDER BY, textos, `||` y fechas DATE, con lógica de tres valores y orden BINARY como Oracle. Diagnóstico en cinco grupos con posición, pista y corrección aplicable (plegada).
  - **Contenido:** 22 lecciones en 8 bloques (plantilla de 12 partes, mini comprobaciones con pistas), 29 escenas, LAB01–LAB24, Challenge `select-challenge-v3` (M02, M04, M05, M07, M09 y M10 renovadas; M10 en Oracle), ruta `/modules` con 46 temas futuros y buscador de temas actuales y futuros. Videos sin rótulos de duración.
  - **Oracle:** `SQL_LAB_V2_OWNER` y `SQL_LAB_V2_READER` creados de forma aditiva en Oracle local 23ai (`npm run oracle:setup`) y en Oracle Cloud 19c (`node scripts/oracle-cloud.mjs setup`); las cuentas v1 quedan como `ORACLE_PREVIOUS_*` y `ORACLE_CLOUD_PREVIOUS_*` en los archivos ignorados.
  - **Bugs encontrados y corregidos:** decimales `.1` de Oracle; visitas del Estudio que no se guardaban; retorno del laboratorio limitado a 16 escenas y 9 lecciones; desbordes con zoom 200 % en las páginas nuevas; tablas cortadas en las escenas 05, 11, 15 y 21; lecciones con muros de tablas (ahora muestras de 10 filas rotuladas); en WebKit, el número escrito en la mini comprobación antes de hidratar se perdía (ahora es un campo no controlado).
  - **Verificado:** lint, typecheck, format:check, `npm run test:unit` 632/632 (508 unitarias, 102 contra Oracle local v2 y la sala en PostgreSQL embebido), integración contra Oracle Cloud 102/102, build, E2E en Chromium 199/199, Edge y WebKit en las rutas afectadas (153/164 y las 11 restantes en verde al repetirlas) y QA visual de 42 capturas (1920×1080 a 180×400).
  - **Documentos:** CONTENT_MAP 2.0, DATABASE_SCHEMA 2.0, LAB_SPEC 2.0, GAME_SPEC 3.0, ORACLE_SETUP 2.0, README, PROJECT_STATUS, CONTENT_REDESIGN_PLAN y referencias en UX_FLOWS, PROJECT_SPEC, ROADMAP, TEST_PLAN, PRODUCTION_SETUP e IMPLEMENTATION_NOTES.
  - **No versionado a propósito:** `docs/Guia_herramientas_SQL_SELECT_LAB.docx` (documento personal, excluido también en `.vercelignore`).
  - **Vercel:** variables Oracle de Preview en v2 y vista previa `sql-select-l0pnwv46e-jorge-gutierrez1.vercel.app` (commit `45c3a70`) con prueba de humo 19/19 sobre Oracle Cloud v2. **Producción siguió en v1 ese día** (resuelto el 26 de septiembre, ver abajo): el cambio de `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` en Production lo bloqueó el sistema de permisos de la sesión. Siguiente acción: el responsable cambia esas tres variables (o autoriza hacerlo) y se despliega con `--prod` desde el commit v2; procedimiento y vuelta atrás en `docs/DEPLOYMENT.md`.
- 2026-09-26: **producción v2 activada** en `claude-finish-20260923`.
  - Variables de Production `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` cambiadas a la cuenta v2 por la entrada estándar. `NEXT_PUBLIC_SITE_URL` confirmada en `https://sql-select-lab.vercel.app`.
  - Despliegue nuevo `dpl_3NAgTPb2pFztqa6Mxx4oHNNK2c7w` del commit `37a2271` (huellas verificadas), con el alias de producción.
  - Prueba de humo 14/14 en el dominio público y sala en vivo contra el Supabase real 5/5 (servidor local, clave de prueba).
  - Vuelta atrás: `vercel promote dpl_61KPNiQvtuk6NAKFag4tonXAG2Fd` y variables `ORACLE_CLOUD_PREVIOUS_*`; v1 sigue intacta en Oracle.
  - Pendiente del responsable: crear una sala en el dominio público con su clave (no se escribe en pruebas automáticas).
- 2026-09-26: **refinamiento pedagógico y visual final** en `claude-final-ui-polish-20260926` (sin tocar `main`). Commits `ac39977`, `173261d`, `1e32dff`, `5fd5eda` y `023581c`, más la documentación de cierre.
  - **Qué se hizo:**
    - fuente conceptual única de 35 conceptos con glosas;
    - vista de datos adaptable (tabla o fichas) sin barra horizontal;
    - formateador SQL;
    - Exposición con definición o propósito en las 29 escenas, navegador por bloques, «Paso a paso», notas, vista del presentador y pantalla completa;
    - Challenge con densidad propia y feedback pedagógico (GAME_SPEC 3.1; la puntuación no cambia);
    - Recursos por fichas completas y Estudio con términos relacionados;
    - color semántico de SQL.
  - **Evidencia:** `docs/FINAL_UX_PEDAGOGICAL_AUDIT.md`, que incluye la auditoría inicial, la segunda pasada y los resultados con la tabla de las 29 escenas.
  - **Verificado:**
    - lint, typecheck, format y 676/676 unitarias e integración;
    - build;
    - E2E en Chromium 223/223, y en Edge y WebKit en las suites afectadas, en verde tras corregir tres fallos reales de Safari;
    - vista previa `dpl_CQCuhceYxVh2e4jq19yC3B6b68VY` 138/138;
    - producción `dpl_2Bx2nGrZaKLEX8x8e7i8K3Cjon9b` 104/104;
    - 246 + 123 mediciones visuales sin problemas.
  - **Sin cambios:** Oracle, Supabase, Realtime, la puntuación, el protocolo de salas y las variables de producción. Vuelta atrás: `vercel promote dpl_3NAgTPb2pFztqa6Mxx4oHNNK2c7w`.
  - **No versionado a propósito:**
    - `docs/Guia_herramientas_SQL_SELECT_LAB.docx`;
    - la QA remota de otra herramienta (`tests/remote/`, `scripts/audit-responsive.mjs` y los cambios locales de `playwright.remote.config.ts`), que se conservan en el árbol de trabajo.
  - **Nota de entorno:** el contenedor Oracle local puede detenerse; `npm run oracle:up` lo reinicia sin tocar datos.
  - **Pendiente del responsable:**
    - crear una sala en producción con su clave (no se escribe en pruebas automáticas);
    - revisar las notas del expositor antes de clase.
- 2026-09-27/28: **rediseño pedagógico de la representación de datos y del Challenge** en `claude-final-ui-polish-20260926` (sin tocar `main`). Checkpoint `cf8d6f3` (etiqueta `checkpoint-pre-challenge-redesign-20260927`); commits `74fd5b3`, `55d8959`, `fd5ffbe`, `e7382cd`, `f62b15a`, `98b2586`, `3d3aba2`, `3dfcbd5` y `daa4dfd`.
  - **Qué se hizo:**
    - vista de datos siempre tabular: tabla, partes con pestañas y grupos de ≤ 4 columnas (ID_EMPLEADO y NOMBRE repetidos); fichas solo en tablas de referencia;
    - Challenge v4 (GAME_SPEC 4): muestra de trabajo ≤ 8 × 3–4 como tabla original, dataset completo en un diálogo, M01–M10 rediseñadas (observar, predecir, construir, comparar, corregir), ocho variantes de M08, feedback con tipo de error, qué está bien, qué revisar y pista;
    - Exposición: «Qué cambió» bajo el resultado de las escenas de concepto; WHERE y LIKE solo cambian filas;
    - teléfonos: tablas de 12 px como mínimo sin barra hasta 320 px; página sin desborde a 180 px.
  - **Verificado:** 732/732 unitarias e integración (Oracle local); E2E Chromium 252/252, Edge 186/186 y WebKit 186/186 en las suites afectadas; vista previa `dpl_9oRqwJsZYXTLFtQ8f2eo7dSjovqz` 230/230; producción `dpl_5N1YJrvvWABzHFJWJPHQBPRsigdd` 160/160 con Oracle Cloud; mediciones visuales de páginas, 29 escenas, 10 misiones y el laboratorio en hasta 17 tamaños sin problemas.
  - **Sin cambios:** Oracle, Supabase, Realtime, la puntuación, los tiempos base, el protocolo de salas y las variables de producción. Las partidas guardadas con `select-challenge-v3` se descartan (cambió la versión). Vuelta atrás: `vercel promote dpl_2Bx2nGrZaKLEX8x8e7i8K3Cjon9b`.
  - **No versionado a propósito:** `docs/Guia_herramientas_SQL_SELECT_LAB.docx` y la QA remota de otra herramienta (`tests/remote/`, `scripts/audit-responsive.mjs`, cambios locales de `playwright.remote.config.ts`).
  - **Pendiente del responsable:** crear una sala en producción con su clave (la sala real de Supabase no se prueba con la clave docente en las pruebas automáticas).
- 2026-10-03: **DB LAB, Fase 1** en `claude/gallant-cori-4rp11r` (merge de `claude-final-ui-polish-20260926` en `7f69de9`, que sirve de checkpoint; `main` sin tocar).
  - **Qué se hizo:**
    - Marca DB LAB y AppShell.
    - Secciones `/sections` y `/sections/[section]`.
    - «Secciones» en la navegación.
    - Portada nueva.
    - DESIGN_SYSTEM 3.0, con tokens, StatusBadge, Breadcrumb, PageHeader y QueryTransformation.
    - Color de SQL para JOIN, agrupación y funciones.
    - Cuatro efectos de React Bits gratuitos (`THIRD_PARTY_NOTICES.md`).
    - CLS del pie corregido.
  - **Verificado:**
    - lint, typecheck y format;
    - 644/644 unitarias e integración (Oracle real omitido);
    - build;
    - E2E en Chromium: 248 pasan. Los 21 fallos también fallan en la base sin cambios en este contenedor (fuentes y navegador); la rama corrige 4 fallos previos.
  - **Sin cambios:** Supabase, Oracle, credenciales, claves de almacenamiento, rutas existentes y QR.
  - **Pendiente:** la vista previa en Vercel. Sin sesión del CLI ni acceso a Vercel desde el contenedor.

## Sesión del 3 de octubre de 2026: DB LAB, Fase 2

**Rama y checkpoint**

- Rama `claude-phase2-auth-progress-20261002`, subida a GitHub.
- Checkpoint: etiqueta local `phase1-checkpoint-20261003` en `9180bf5`.

**Hecho**

- Migración `20261002120000_learner_accounts.sql`: perfiles, progreso, presencia, dominios institucionales, RLS y `admin_set_role`.
- `supabase/config.toml` y plantillas de correo en español.
- Sesión en el servidor con `@supabase/ssr` 0.12.7 y cookies httpOnly; proxy en las rutas privadas.
- Pantallas de acceso, menú de cuenta, panel del estudiante, perfil y panel docente.
- Sincronización del progreso: repositorios locales envueltos, fusión monótona y limpieza del dispositivo al cerrar sesión.

**Verificado:** ver la tabla de la Fase 2 en `docs/PROJECT_STATUS.md`.

- Supabase local real con Docker y la CLI 2.119 (`SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`).
- 11 E2E de cuentas, RLS en PostgreSQL y en Supabase real.
- Las 21 E2E que fallan son las mismas de la base en este entorno.

**Pendiente del responsable (detalle en `docs/AUTH_ARCHITECTURE.md`, apartado 12)**

1. Aplicar la migración en Supabase. El mismo proyecto atiende Production y Preview.
2. Configurar Site URL, redirecciones, plantillas, SMTP propio y límites de Auth.
3. Desplegar la vista previa desde esta rama.
4. Asignar el rol de profesor cuando Amilkar Sierra Romano tenga cuenta.
5. Validar el dominio institucional.
6. Opcional: Microsoft en Entra y Supabase.

**Siguiente: Fase 3, evaluaciones.** Contratos en `docs/ARCHITECTURE.md` (Fase 2). Hecha el mismo día (ver abajo).

## Sesión del 3 de octubre de 2026: DB LAB, Fase 3

**Rama y checkpoint**

- Rama `claude-phase3-assessments-20261003`, subida a GitHub.
- Checkpoint: etiqueta local `phase2-checkpoint-20261003` en `3e1bcfd`.

**Hecho**

- Migración `20261003120000_assessments.sql`: banco, evaluaciones, preguntas congeladas, intentos, respuestas, eventos, auditoría, RLS solo para el profesor y funciones seguras (el estudiante no lee tablas).
- Banco oficial de la Sección 1 (50) en `src/features/assessments/domain/bank`, verificado con el motor educativo.
- Panel docente: Evaluaciones, Banco de preguntas, monitor en vivo, resultados, revisión de intentos, exportación CSV.
- Estudiante: `/evaluations`, pantalla previa, examen y resultado; pendientes en «Mi progreso»; modo Evaluación de la Sección 1 activo.
- CSP: `connect-src` admite un Supabase local de loopback (pruebas) además del `wss://` del proyecto.

**Verificado:** ver la tabla de la Fase 3 en `docs/PROJECT_STATUS.md` (E2E 266/21/2 con las mismas 21 fallas de entorno; integración 75/75 con Supabase local; 182 combinaciones responsive y axe sin problemas).

**Pendiente del responsable**

1. Aplicar `20261003120000_assessments.sql` en Supabase después de la de cuentas (mismo proyecto para Production y Preview).
2. Con la cuenta del profesor, «Sincronizar banco oficial de DB LAB».
3. Desplegar la vista previa desde esta rama.
4. Los pendientes de la Fase 2 (Auth, SMTP, rol de profesor, dominio institucional, Microsoft).

**Siguiente: Fase 4.** Contenido y banco de las secciones 2 y 3; contratos en `docs/ARCHITECTURE.md` (Fase 3).

## Sesión del 3–4 de octubre de 2026: DB LAB, Fase 4

- Rama `claude-phase4-curriculum-20261003`, creada desde el tag `phase3-checkpoint-20261003`. Todo está subido al remoto salvo lo que indique `git status`.
- **Commits:**
  - dataset relacional;
  - fuente curricular con verificación en Oracle;
  - Sección 2 (contenido y modos);
  - escenario 16:9 para ejemplos largos;
  - Sección 3;
  - auditoría de la Sección 1 con «Funciones de una fila»;
  - bancos 2 y 3;
  - QA y documentación.
- **Entorno de verificación:**
  - Oracle Database Free 23.26 en Docker (`dblab-oracle`, puerto 1522; si el entorno se reinicia: `dockerd`, `docker start dblab-oracle` y esperar «DATABASE IS READY»);
  - Supabase local;
  - servidor de producción en 3200.
  - Las claves locales solo están en `.env.local` y `.env.oracle.local`, que no se versionan.
- **Decisiones:**
  - Las tablas, salidas y errores nunca se escriben a mano; salen de Oracle.
  - La Sección 1 conserva su motor y sus modos; la ampliación de funciones es una «extensión curricular».
  - El banco 2/3 vive en la capa de aplicación de evaluaciones.
  - Los enlaces a docs.oracle.com apuntan a la raíz del libro (el proxy bloquea la verificación de enlaces profundos).
- **Verificaciones (4 de octubre, build final):**
  - lint, tipos y formato: PASS;
  - unitarias: 1352 pasan (2 omitidas a propósito);
  - integración 611/611 con Oracle real (currículo 222, Sección 1 102, banco de la Sección 1 79), PGlite y Supabase local;
  - build: PASS;
  - E2E completa en Chromium con Supabase y Oracle: 302 pasan, 22 fallan, 0 omitidas. Las 22 fallan igual en el build de la etiqueta de la Fase 3 (21 de entorno y 1 intermitente del tooltip de `/dev/design-system`);
  - barrido de 66 rutas × 6 anchos y 71 escenas × 3 anchos sin problemas;
  - axe WCAG 2.2 AA sin infracciones.
  - Detalle en `docs/PHASE4_QA.md`.
- **Hallazgos de la QA final, corregidos:**
  - 19 desbordes en el móvil (identificadores largos, mapa y diccionario del dataset, tablas compactas);
  - 2 barras horizontales en la clase;
  - `/sections` contaba 22 lecciones en la Sección 1 y no mostraba avance en las secciones 2 y 3;
  - `bank-oracle.test.ts` recreaba el esquema que usa `curriculum-oracle.test.ts`: en paralelo se pisaban.
- **Aviso de entorno:** compilar con `NEXT_PUBLIC_SUPABASE_URL`. La CSP se fija en el build; sin la variable, el monitor en vivo no conecta con Realtime (`PRODUCTION_SETUP.md`).
- **No probado:**
  - Edge, WebKit, Oracle 19c y Autonomous Database;
  - vista previa;
  - producción, que no se tocó.
