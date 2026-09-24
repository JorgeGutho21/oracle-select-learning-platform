# Estado del proyecto — Auditoría

Fecha: 23 de septiembre de 2026. Rama auditada: `claude-finish`, commit `fe6b8ea` («checkpoint: plataforma antes de continuar con Claude»), sincronizada con `origin/claude-finish`. `main` local apunta al mismo commit y está un commit por delante de `origin/main`. Árbol de trabajo limpio antes de esta auditoría.

Esta auditoría no modifica código. Solo añade este archivo y [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).

**Actualización (Fase 1, estabilización técnica):** rama de trabajo `claude-finish-20260923`. La prueba E2E inestable de WebKit quedó corregida en `playwright.config.ts`; causa, solución y evidencia en [Estabilización de la suite E2E](#estabilización-de-la-suite-e2e). Toda la batería base está en verde. No se añadieron funcionalidades.

**Actualización (Fase 2, núcleo del SQL Challenge):** se implementaron el dataset único, la comparación de resultados, el dominio de las diez misiones con rúbricas privadas, la puntuación, el estado y el motor de la partida individual, y la persistencia local mediante infraestructura. No hay pantallas nuevas. Detalle en [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md). Verificaciones en [Verificaciones tras la Fase 2](#verificaciones-tras-la-fase-2).

**Actualización (Fase 3, Challenge interactivo):** M01–M09 del Challenge v2 son jugables en `/challenge` con arrastre (dnd-kit), toque y teclado. M10 queda bloqueada sin Oracle. La corrección se ejecuta en el servidor mediante Server Functions en una nueva raíz de composición (`src/composition`). Se corrigió un desbordamiento móvil del `DataTable` base. Detalle en [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md) y [Verificaciones tras la Fase 3](#verificaciones-tras-la-fase-3).

**Actualización (Fase 5, experiencia educativa): PHASE_5 = COMPLETE.** Home, Modo Estudio, Modo Exposición de dieciséis escenas, buscador global, navegación de una fila, pie con identidad y revisión responsive y de accesibilidad. Se conserva y reutiliza el trabajo de Codex (auditado en [CODEX_HANDOFF_AUDIT.md](CODEX_HANDOFF_AUDIT.md)); motor SQL, laboratorio y Challenge no se modificaron. Las E2E pasan a ejecutarse contra el build de producción. Verificaciones en [Verificaciones tras la Fase 5](#verificaciones-tras-la-fase-5).

**Actualización (Fase 4, motor SQL educativo y laboratorio):** un único léxico, parser y analizador del subconjunto SELECT en `src/domain/sql` (con AST, diagnósticos pedagógicos, evaluación educativa, traducción, anatomía y sentencia canónica), reutilizado por el laboratorio y por M05, M08, M09 y M10. `/lab` tiene seis paneles y editor CodeMirror 6. La ejecución Oracle es una operación separada tras el puerto `OracleQueryExecutor`, cuyo adaptador vigente declara «no conectado»; nunca se simula. Verificaciones en [Verificaciones tras la Fase 4](#verificaciones-tras-la-fase-4).

## Resumen

El proyecto está en la fase **R2 parcial: cimientos técnicos y sistema de diseño**. Existen la estructura por capas, ocho rutas navegables con estados vacíos, trece componentes de interfaz accesibles, tokens Sass, un showcase interno y una batería de pruebas de componentes, arquitectura y navegación.

No existe ninguna funcionalidad de negocio: no hay contenido académico, lecciones, escenas, dataset en código, buscador funcional, laboratorio, analizador o evaluador SQL, misiones, puntuación, cronómetro, persistencia, Supabase, salas ni resultados. Las capas `domain`, `application` e `infrastructure` solo contienen un `README.md` y un `.gitkeep`. Esto coincide con lo que declaran `CONTINUITY.md`, `README.md` y `docs/IMPLEMENTATION_NOTES.md`.

## Stack instalado

| Elemento                 | Versión fijada                                                                                                   | Estado                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Next.js (App Router)     | 16.3.6                                                                                                           | Instalado y en uso.                                                        |
| React / React DOM        | 19.3.0                                                                                                           | Instalado y en uso.                                                        |
| TypeScript estricto      | 6.0.3                                                                                                            | Instalado y en uso.                                                        |
| Bootstrap + Sass         | 5.3.8 / 1.105                                                                                                    | Instalado; compilado localmente.                                           |
| Vitest / Testing Library | 5.0.1                                                                                                            | Instalado y en uso.                                                        |
| Playwright + axe         | 1.63.0                                                                                                           | Instalado; Chromium, Edge y WebKit.                                        |
| CodeMirror 6             | state 6.7.6, view 6.43.13, commands 6.11.1, lang-sql 6.10.0, language 6.12.4, lint 6.9.7; @lezer/highlight 1.2.3 | Instalado en la Fase 4; `SqlEditor` compartido.                            |
| dnd-kit                  | core 6.3.1, sortable 10.0.0, utilities 3.2.2                                                                     | Instalado en la Fase 3; usado por `SequenceBuilder`.                       |
| Cliente Supabase         | —                                                                                                                | **No instalado.** Sin configuración ni variables.                          |
| node-oracledb            | —                                                                                                                | **No instalado.** Sin servicio Oracle (R1 pendiente).                      |
| Generador de QR          | qrcode-generator 2.0.4 (MIT, sin dependencias)                                                                   | Instalado en la Fase 5; carga diferida solo en la escena 15 de Exposición. |

## Estado por módulo

| Módulo                          | Estado           | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (P01)                      | DONE             | Fase 5: hero azul noche con «ORACLE DATABASE · SQL FUNDAMENTALS», autor, asignatura e institución y cuatro acciones (Iniciar clase, Modo Estudio, Laboratorio SQL, SQL Challenge); identidad con logotipo; qué aprenderás (L00–L08); demostración interactiva de columnas con el motor educativo; Challenge; vídeo introductorio rotulado «en preparación»; progreso; siete módulos futuros «Próximamente». Bandas a sangre completa que alternan superficies.              |
| Modo Exposición (P02)           | DONE             | Fase 5: dieciséis escenas (CONTENT_MAP 1.1) en un lienzo 16:9 que escala con el ancho; botones, flechas, Av Pág/Re Pág, Inicio/Fin, espacio y F; barra de progreso, contador, selector, pantalla completa por acción del usuario (aviso si se rechaza) y reanudación local. Escena 15: reto con respuesta del motor y QR real hacia la práctica individual (las salas no existen y no se simulan). Sin desbordes en 1920×1080 ni 1366×768; modo fluido en móvil y vertical. |
| Modo Estudio (P03)              | DONE             | Fase 5: `/learn` con la ruta de nueve pasos y `/learn/{lección}`. Cada lección: explicación cotidiana, sintaxis, ejemplo, efecto visual paso a paso (tabla fuente, columnas resaltadas, filas repetidas, resultado), traducción, error frecuente y microactividad. Progreso local validado en aplicación; visitar no completa (U02); aviso si el almacenamiento no está disponible.                                                                                         |
| Buscador global (P04)           | DONE             | Fase 5: paleta Ctrl+K/Cmd+K y lupa táctil; índice público único (conceptos, lecciones, práctica y recursos) derivado del esquema de lecciones; flechas, Enter con foco en el destino, Escape con retorno de foco; temas futuros «Próximamente» sin destino. Corregidos el ARIA del listbox y coincidencias espurias por palabras cortas.                                                                                                                                    |
| Vídeos (P05, P18)               | PARTIAL          | Espacios preparados y rotulados «en preparación» en Home, Exposición (02 y 14) y Recursos. Los vídeos V01/V02 siguen siendo un pendiente externo.                                                                                                                                                                                                                                                                                                                           |
| Explicaciones y tablas (P06/7)  | DONE             | Fase 5: `HighlightTable` compartida (columnas, fila y repetidas con texto accesible) y pasos visuales por lección derivados del motor y del dataset único.                                                                                                                                                                                                                                                                                                                  |
| Laboratorio SQL (P08)           | PARTIAL          | Fase 4: `/lab` con esquema, editor, resultado, traducción, anatomía y diagnóstico. El análisis y la vista previa educativa están rotulados como tales. La ejecución real en Oracle depende de R1: hoy informa «Oracle no conectado». P08 no se da por cumplido sin Oracle (ARCHITECTURE).                                                                                                                                                                                   |
| SQL Challenge (P09–P13)         | PARTIAL          | M01–M09 DONE y jugables; M08 y M09 corregidas con el motor SQL compartido. M10 con editor y corrección estructural; su calificación final espera a Oracle real. Detalle en [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).                                                                                                                                                                                                                                                      |
| Sistema de puntuación (P15)     | PARTIAL          | Reglas puras y pruebas G11/G12 para la práctica individual. La puntuación autoritativa de sala en servidor sigue pendiente (R6).                                                                                                                                                                                                                                                                                                                                            |
| Supabase / persistencia         | MISSING          | Sin dependencia, cliente, esquema, RLS, Auth ni `.env.example`.                                                                                                                                                                                                                                                                                                                                                                                                             |
| Sala en vivo / QR (P14–P16)     | MISSING          | `features/rooms/presentation/live-page.tsx` es un placeholder. Sin salas, rondas, tiempo autoritativo ni ranking.                                                                                                                                                                                                                                                                                                                                                           |
| Resultados / estadísticas (P17) | MISSING          | `features/results/presentation/results-page.tsx` muestra «Sin resultados». Sin cálculo ni almacenamiento.                                                                                                                                                                                                                                                                                                                                                                   |
| Recursos / chuleta (P18)        | PARTIAL          | Chuleta por concepto con sintaxis, ejemplo y anclas `#chuleta-*` que usa el buscador; estilos de impresión; vídeos en preparación; fuentes. Falta el catálogo `/modules`.                                                                                                                                                                                                                                                                                                   |
| Sistema de diseño               | DONE (base)      | 13 componentes en `src/presentation/components/ui`, `SequenceBuilder` y, desde la Fase 5, `HighlightTable` en `src/presentation/components/data`. Tokens en `src/styles/_tokens.scss`; showcase `/dev/design-system`.                                                                                                                                                                                                                                                       |
| Navegación y layouts            | DONE             | Fase 5: barra de una fila (Inicio, Aprender, Laboratorio, Challenge, En vivo, Recursos y Buscar) derivada del catálogo público; menú compacto bajo 992 px que se cierra con Escape; pie con la identidad académica completa.                                                                                                                                                                                                                                                |
| Arquitectura por capas          | DONE (base)      | Regla ESLint local `scripts/architecture-boundaries.mjs` y pruebas en `tests/unit/architecture.test.ts`. Capa `composition` (Fase 3): única que une infraestructura con aplicación; solo `app` la importa.                                                                                                                                                                                                                                                                  |
| Responsive                      | DONE (navegador) | Fase 5: E2E a 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932 y 390×844 sin desplazamiento horizontal y con el contenido centrado en su ancho útil; revisión visual con capturas. Reflujo a 180 px (zoom 200 %) en Home, Estudio, Exposición y Recursos. Pendiente: dispositivos físicos, proyector real y el reflujo a 180 px del laboratorio.                                                                                                                  |

## Verificaciones de la auditoría inicial (antes de la Fase 1)

Entorno: Windows 11, Node 24.20.0, npm 11.19.0.

| Comando                                            | Resultado                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run lint`                                     | Correcto, 0 advertencias.                                                             |
| `npm run typecheck`                                | Correcto (`next typegen` + `tsc --noEmit`).                                           |
| `npm run test:unit`                                | Correcto: 2 archivos, 22 pruebas.                                                     |
| `npm run format:check`                             | Correcto.                                                                             |
| `npm run build`                                    | Correcto: 11 páginas estáticas (`/`, 7 módulos, `/dev/design-system`, `/_not-found`). |
| `npm run test:e2e` (`npm test` incluye unit + e2e) | **Falla: 74 aprobadas, 1 fallida.** Detalle abajo.                                    |

`npm test` equivale a `npm run tests` (Vitest y después Playwright), por lo que su resultado global es fallido por la prueba E2E indicada.

### Error encontrado: E2E intermitente en WebKit

- Prueba: `tests/e2e/interactions.spec.ts:4` — «el diálogo contiene el foco, cierra con Escape y restaura su activador», proyecto `webkit`.
- Síntoma: `Test timeout of 30000ms exceeded`. Al repetirla tres veces fallaron dos; en otra repetición la pasada correcta tardó **29,9 s**, a 0,1 s del límite.
- Diagnóstico: no se observó un fallo de aserción ni de comportamiento; la prueba es lenta en WebKit sobre Windows con el servidor `next dev` (compilación bajo demanda) y un análisis axe completo dentro de la misma prueba. Pasa en Chromium y Edge.
- Clasificación: prueba inestable (flaky) por tiempo, no defecto funcional demostrado. Bloquea que `npm test` salga en verde.
- Estado: **corregido en la Fase 1**. Ver la sección siguiente.

## Estabilización de la suite E2E

### Causa real

La grabación de trazas de Playwright (`trace: 'retain-on-failure'`) registra la traza de **todas** las pruebas y solo la descarta si pasan. En WebKit sobre Windows, la parte de screencast de esa traza consume mucha CPU y duplica la duración de cada acción; con dos workers de WebKit en paralelo sobre `next dev` el renderizador queda saturado. En la traza del fallo, cada pulsación de tecla tardaba ≈0,5 s y cada comprobación de estabilidad de un clic 1–1,7 s. La prueba del diálogo es la más larga del archivo (dos ciclos de apertura, axe con una página auxiliar y la hidratación previa del activador), por eso era la que superaba los 30 s.

Mediciones de la prueba del diálogo en WebKit (servidor de producción, 2 workers, 4 repeticiones):

| Configuración de traza                    | Duración por prueba |
| ----------------------------------------- | ------------------- |
| Por defecto (screencast + snapshots DOM)  | 14,1–15,8 s         |
| Solo screencast                           | 14,0–14,7 s         |
| Solo snapshots DOM                        | 8,0–9,2 s           |
| Sin traza                                 | 5,8–7,2 s           |
| Por defecto con `reducedMotion: 'reduce'` | 12,5–15,1 s         |

Hipótesis descartadas con evidencia:

- **Spinner y animaciones CSS del showcase:** detenerlos con movimiento reducido apenas cambia la duración, y la página mantiene 60 fps en WebKit fuera de la traza.
- **Diálogo y selectores:** no hubo errores de aserción. Todos los selectores resuelven al primer intento y el foco se comporta igual que en Chromium y Edge.
- **Análisis axe:** tarda ≈1,2–1,4 s en WebKit. Aporta tiempo, pero no explica el exceso.
- **Hidratación:** el primer clic espera correctamente a que `useHydrated` habilite el botón. Es una espera legítima y más lenta en `next dev`, pero no es la causa principal.
- **Bucle de render:** el diálogo solo reacciona a cambios de `open`; no se observaron renders continuos.

### Solución

Cambio mínimo en `playwright.config.ts`, solo para el proyecto `webkit`: `trace: { mode: 'retain-on-failure', screenshots: false }`. La traza de un fallo conserva los snapshots DOM, la red y los pasos, y `screenshot: 'only-on-failure'` mantiene la captura final. No se modificaron timeouts, la prueba ni los componentes. Chromium y Edge conservan la traza completa, porque su screencast es barato.

### Evidencia tras la corrección

- Prueba del diálogo en WebKit con la configuración real (`next dev`, 2 workers): 6/6 aprobadas, 12,2–16,4 s. Antes: 20–30 s, con timeouts intermitentes.
- La misma prueba con un worker: 5/5 aprobadas, 5,4–7,2 s.
- Suite E2E completa: 75/75 aprobadas en 2,7 min (antes: 74/75 en 6,4 min). La prueba más lenta de WebKit tardó 15,7 s, la mitad del límite de 30 s.

## Verificaciones tras la Fase 1

| Comando                | Resultado                 |
| ---------------------- | ------------------------- |
| `npm run lint`         | Correcto, 0 advertencias. |
| `npm run typecheck`    | Correcto.                 |
| `npm run format:check` | Correcto.                 |
| `npm run test:unit`    | Correcto: 22/22.          |
| `npm run build`        | Correcto: 11 páginas.     |
| `npm run test:e2e`     | Correcto: 75/75.          |

Observación: `reuseExistingServer` reutiliza fuera de CI cualquier servidor que ya escuche en el puerto 3100. Durante esta fase había un `next dev` de este mismo repositorio activo en ese puerto, y las pruebas lo reutilizaron.

## Verificaciones tras la Fase 2

| Comando                | Resultado                                                           |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run lint`         | Correcto, 0 advertencias.                                           |
| `npm run typecheck`    | Correcto.                                                           |
| `npm run format:check` | Correcto.                                                           |
| `npm run test:unit`    | Correcto: 8 archivos, 143 pruebas (22 previas y 121 del Challenge). |
| `npm run build`        | Correcto: 11 páginas.                                               |
| `npm run test:e2e`     | Correcto: 75/75 (incluye `/challenge` en Chromium, Edge y WebKit).  |

## Verificaciones tras la Fase 3

| Comando                | Resultado                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run lint`         | Correcto, 0 advertencias.                                        |
| `npm run typecheck`    | Correcto.                                                        |
| `npm run format:check` | Correcto.                                                        |
| `npm run test:unit`    | Correcto: 11 archivos, 189 pruebas.                              |
| `npm run build`        | Correcto: 11 páginas. Sin rúbricas en `.next/static`.            |
| `npm run test:e2e`     | Correcto: 126/126 (51 del Challenge) en Chromium, Edge y WebKit. |

## Verificaciones tras la Fase 4

| Comando                | Resultado                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run lint`         | Correcto, 0 advertencias.                                                                         |
| `npm run typecheck`    | Correcto.                                                                                         |
| `npm run format:check` | Correcto.                                                                                         |
| `npm run test:unit`    | Correcto: 12 archivos, 250 pruebas.                                                               |
| `npm run build`        | Correcto: 11 páginas. Sin rúbricas en `.next/static`; `/challenge` no carga CodeMirror de inicio. |
| `npm run test:e2e`     | Correcto: 144/144 en Chromium, Edge y WebKit (18 del laboratorio).                                |

## Verificaciones tras la Fase 5

| Comando                | Resultado                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`         | Correcto, 0 advertencias.                                                                                                                                                                                                                                    |
| `npm run typecheck`    | Correcto.                                                                                                                                                                                                                                                    |
| `npm run format:check` | Correcto.                                                                                                                                                                                                                                                    |
| `npm run test:unit`    | Correcto: 16 archivos, 302 pruebas (30 nuevas de búsqueda, Estudio, progreso y escenas).                                                                                                                                                                     |
| `npm run build`        | Correcto: 20 páginas; nueve lecciones estáticas; `/lab` y `/presentation` dinámicas por sus parámetros. Sin rúbricas en `.next/static` (G15).                                                                                                                |
| `npm run test:e2e`     | Correcto: 270/270 en Chromium, Edge y WebKit en 8,3 min, contra el build de producción. 42 pruebas nuevas por navegador: Home, Estudio, Exposición (16 escenas sin desborde a 1920×1080 y 1366×768), buscador, navegación y responsive en los siete tamaños. |

Comprobaciones adicionales:

- Carga en producción: CodeMirror solo se descarga en `/lab` (y, dentro del Challenge, al abrir M10); el generador de QR, solo en la escena 15.
- Revisión visual con capturas a 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932 y 390×844 de Home, Estudio, Exposición, laboratorio, Challenge, Recursos y buscador. Reflujo sin desplazamiento horizontal a 180 px (zoom 200 % de 360 px) en Home, Estudio, Exposición y Recursos.
- axe (WCAG 2 A/AA) sin violaciones en Home (escritorio y móvil), una lección, seis escenas claras y oscuras y la paleta de búsqueda abierta.
- Primera ejecución completa: 262/270. Se corrigieron el reflujo a 180 px del showcase, la hidratación de la Exposición en WebKit y el foco que el diálogo dejaba en un campo oculto; una prueba existente del showcase usaba `count()` sin esperar al revelado diferido de React (repetida 15/15 tras corregirla).

## Riesgos

| Riesgo                                         | Impacto                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oracle real (R1) sin instancia ni credenciales | Bloquea P08, M10 y las pruebas LAB11–LAB16. Según AGENTS.md no se puede sustituir por un simulador rotulado como Oracle.                                                                                                                                                   |
| M10 sin Oracle                                 | El reto escrito se analiza con el motor compartido, pero su calificación final exige R1; sin Oracle, un envío correcto es técnico y no consume intento.                                                                                                                    |
| Corrección de misiones confiada al navegador   | Resuelto para la práctica: rúbricas en el servidor (Server Functions) y comprobación de que no están en `.next/static`. La práctica local sigue siendo informativa y manipulable por diseño (ARCHITECTURE).                                                                |
| Dependencias nuevas sin fijar                  | CodeMirror, dnd-kit y Supabase deben instalarse con versión exacta (`.npmrc` lo exige) y validarse con Next 16 / React 19.                                                                                                                                                 |
| Bonificación por tiempo                        | Pedida en la Fase 2, pero contraria a GAME_SPEC («No hay bonificación por rapidez»). Implementada en la política de puntuación con valor 0; activarla exige actualizar GAME_SPEC, TEST_PLAN y la versión de la política.                                                   |
| Server Function intermitente en desarrollo     | Con `next dev` y la suite completa, algunas Server Functions superaban las esperas en Edge. Desde la Fase 5 las E2E usan el build de producción (puerto 3200), sin ampliar tiempos, y esos fallos desaparecieron. Sigue siendo un riesgo solo al probar contra `next dev`. |
| Revelado diferido de Suspense                  | En producción React revela en diferido el contenido transmitido por streaming; justo después de `load` puede seguir oculto. Las pruebas deben usar aserciones que esperan, no `count()` inmediato.                                                                         |
| QR de la escena 15                             | Codifica la dirección actual: en local avisa que otros dispositivos no la abrirán. Las salas con código siguen pendientes (R6).                                                                                                                                            |
| Reflujo del laboratorio a 180 px               | Preexistente: a zoom 200 % en un teléfono de 360 px (180 px CSS) el panel de esquema del laboratorio desborda. No se tocó el laboratorio en la Fase 5; queda para su revisión.                                                                                             |
| Margen de tiempo en WebKit/Windows             | Corregido en la Fase 1. La prueba más lenta usa la mitad del límite; conviene vigilarlo al añadir pruebas más largas.                                                                                                                                                      |
| Ramas divergentes respecto al remoto           | `main` local está un commit por delante de `origin/main`. La rama de trabajo autorizada es `claude-finish-20260923`.                                                                                                                                                       |
| Pendientes externos                            | Vídeos, permiso de uso del logotipo, alojamiento y medición de capacidad. La identidad académica quedó confirmada.                                                                                                                                                         |

## Siguiente orden recomendado

1. ~~Estabilizar la prueba E2E de WebKit~~ (hecho en la Fase 1).
2. ~~Dominio compartido: dataset `empleados-select-v1` versionado~~ (hecho en la Fase 2). Falta el contenido L00–L08 (C01–C05).
3. ~~Tablas interactivas y explicaciones visuales (P06, P07)~~ (hecho en la Fase 5).
4. ~~Modo Estudio (P03) y Modo Exposición (P02) sobre el mismo contenido~~ (hecho en la Fase 5).
5. ~~Buscador global Ctrl+K (P04) con índice público~~ (hecho en la Fase 5).
6. ~~Analizador y validador del subconjunto SELECT v1~~ (hecho en la Fase 4, con casos S01–S14 y LAB01–LAB10).
7. SQL Challenge individual (R4): M01–M09 hechas (Fase 3); M10 pendiente de Oracle y editor.
8. En paralelo, cuando haya infraestructura: R1 Oracle real y adaptador node-oracledb del puerto `OracleQueryExecutor` (P08, calificación final de M10).
9. Resultados locales en `/results`, catálogo `/modules` y vídeos cuando existan los activos (P17, P18).
10. Supabase, salas, tiempo autoritativo, ranking y estadísticas (R6).

El orden del ROADMAP sitúa R3 (contenido y laboratorio) antes de R4 (Challenge). Si se decide adelantar el Challenge, las misiones M01–M09 pueden avanzar con el dataset y el comparador de resultados en dominio; M10 seguirá dependiendo de Oracle.
