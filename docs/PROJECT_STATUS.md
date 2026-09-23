# Estado del proyecto — Auditoría

Fecha: 23 de septiembre de 2026. Rama auditada: `claude-finish`, commit `fe6b8ea` («checkpoint: plataforma antes de continuar con Claude»), sincronizada con `origin/claude-finish`. `main` local apunta al mismo commit y está un commit por delante de `origin/main`. Árbol de trabajo limpio antes de esta auditoría.

Esta auditoría no modifica código. Solo añade este archivo y [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).

## Resumen

El proyecto está en la fase **R2 parcial: cimientos técnicos y sistema de diseño**. Existen la estructura por capas, ocho rutas navegables con estados vacíos, trece componentes de interfaz accesibles, tokens Sass, un showcase interno y una batería de pruebas de componentes, arquitectura y navegación.

No existe ninguna funcionalidad de negocio: no hay contenido académico, lecciones, escenas, dataset en código, buscador funcional, laboratorio, analizador o evaluador SQL, misiones, puntuación, cronómetro, persistencia, Supabase, salas ni resultados. Las capas `domain`, `application` e `infrastructure` solo contienen un `README.md` y un `.gitkeep`. Esto coincide con lo que declaran `CONTINUITY.md`, `README.md` y `docs/IMPLEMENTATION_NOTES.md`.

## Stack instalado

| Elemento                 | Versión fijada | Estado                                                |
| ------------------------ | -------------- | ----------------------------------------------------- |
| Next.js (App Router)     | 16.3.6         | Instalado y en uso.                                   |
| React / React DOM        | 19.3.0         | Instalado y en uso.                                   |
| TypeScript estricto      | 6.0.3          | Instalado y en uso.                                   |
| Bootstrap + Sass         | 5.3.8 / 1.105  | Instalado; compilado localmente.                      |
| Vitest / Testing Library | 5.0.1          | Instalado y en uso.                                   |
| Playwright + axe         | 1.63.0         | Instalado; Chromium, Edge y WebKit.                   |
| CodeMirror 6             | —              | **No instalado.** Previsto en ARCHITECTURE.           |
| dnd-kit                  | —              | **No instalado.** Previsto en ARCHITECTURE.           |
| Cliente Supabase         | —              | **No instalado.** Sin configuración ni variables.     |
| node-oracledb            | —              | **No instalado.** Sin servicio Oracle (R1 pendiente). |
| Generador de QR          | —              | **No instalado.**                                     |

## Estado por módulo

| Módulo                          | Estado      | Evidencia                                                                                                                                                                                                            |
| ------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home (P01)                      | PARTIAL     | `src/presentation/pages/home-page.tsx`: identidad, dos acciones y directorio de rutas. Falta la demostración de selección de columnas prevista en DESIGN_SYSTEM y el aviso «en preparación» debe retirarse al final. |
| Modo Exposición (P02)           | MISSING     | `features/presentation/presentation/presentation-page.tsx` es un `FeaturePlaceholder`. El layout reserva tamaños de proyección. Sin escenas E01–E14, flechas, contador ni pantalla completa.                         |
| Modo Estudio (P03)              | MISSING     | `features/study/presentation/learn-page.tsx` es un placeholder. Sin L00–L08, subrutas `/learn/*`, comprobaciones ni reanudación local.                                                                               |
| Buscador global (P04)           | MISSING     | `site-header.tsx` muestra un campo rotulado «Próximamente». `SearchField` existe como componente visual. Sin Ctrl+K/Cmd+K, diálogo de resultados ni índice.                                                          |
| Vídeos (P05, P18)               | MISSING     | Sin reproductor ni recursos. Los vídeos V01/V02 son un pendiente externo.                                                                                                                                            |
| Explicaciones y tablas (P06/7)  | MISSING     | `DataTable` existe como componente genérico. El dataset `empleados-select-v1` no está codificado en ningún módulo.                                                                                                   |
| Laboratorio SQL (P08)           | MISSING     | `features/laboratory/presentation/lab-page.tsx` declara «Servicio no disponible». Sin editor, analizador, validador, servicio Oracle ni resultados. Estado honesto, conforme a AGENTS.md.                            |
| SQL Challenge (P09–P13)         | MISSING     | Placeholder «Las misiones están en preparación». Detalle en [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).                                                                                                              |
| Sistema de puntuación (P15)     | MISSING     | Sin reglas de dominio ni pruebas G11/G12.                                                                                                                                                                            |
| Supabase / persistencia         | MISSING     | Sin dependencia, cliente, esquema, RLS, Auth ni `.env.example`.                                                                                                                                                      |
| Sala en vivo / QR (P14–P16)     | MISSING     | `features/rooms/presentation/live-page.tsx` es un placeholder. Sin salas, rondas, tiempo autoritativo ni ranking.                                                                                                    |
| Resultados / estadísticas (P17) | MISSING     | `features/results/presentation/results-page.tsx` muestra «Sin resultados». Sin cálculo ni almacenamiento.                                                                                                            |
| Recursos / chuleta (P18)        | MISSING     | Placeholder en `features/resources`.                                                                                                                                                                                 |
| Sistema de diseño               | DONE (base) | 13 componentes en `src/presentation/components/ui`, tokens en `src/styles/_tokens.scss`, showcase `/dev/design-system`.                                                                                              |
| Navegación y layouts            | DONE (base) | `site-header.tsx` con menú móvil, `module-layout.tsx` con modos `standard`/proyección, `error.tsx`, `loading.tsx`, `not-found.tsx`.                                                                                  |
| Arquitectura por capas          | DONE (base) | Regla ESLint local `scripts/architecture-boundaries.mjs` y pruebas en `tests/unit/architecture.test.ts`. Las capas de negocio están vacías.                                                                          |
| Responsive                      | PARTIAL     | Verificado solo sobre rutas vacías y showcase: 360–1920 px y reflow a 180/720 px sin scroll global. No aplica todavía a lecciones, tablas reales, editor ni misiones. Sin dispositivos físicos ni proyector.         |

## Verificaciones ejecutadas en esta auditoría

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
- Corrección posible (no aplicada): ampliar el timeout de esa prueba o del proyecto WebKit, o ejecutar E2E contra `next build && next start` en lugar de `next dev`.

## Riesgos

| Riesgo                                         | Impacto                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oracle real (R1) sin instancia ni credenciales | Bloquea P08, M10 y las pruebas LAB11–LAB16. Según AGENTS.md no se puede sustituir por un simulador rotulado como Oracle.                           |
| Expectativa de que el Challenge ya existe      | El juego de referencia vive en un Artifact externo; su código no está en este repositorio ni se ha auditado. Todo el Challenge está por construir. |
| Corrección de misiones confiada al navegador   | ARCHITECTURE exige corrección en servidor y rúbricas privadas (G15). Una implementación solo cliente expondría soluciones.                         |
| Dependencias nuevas sin fijar                  | CodeMirror, dnd-kit y Supabase deben instalarse con versión exacta (`.npmrc` lo exige) y validarse con Next 16 / React 19.                         |
| Prueba E2E inestable                           | `npm test` falla de forma intermitente y puede ocultar regresiones reales.                                                                         |
| Ramas divergentes respecto al remoto           | `main` local está un commit por delante de `origin/main`; el trabajo vive en `claude-finish`.                                                      |
| Pendientes externos                            | Vídeos, logotipo oficial, nombre del docente y asignatura, alojamiento y medición de capacidad.                                                    |

## Siguiente orden recomendado

1. Estabilizar la prueba E2E de WebKit para dejar `npm test` en verde.
2. Dominio compartido: dataset `empleados-select-v1` versionado en `src/domain` con pruebas de huella, más contenido L00–L08 (C01–C05).
3. Tablas interactivas y explicaciones visuales (P06, P07), reutilizando `DataTable`.
4. Modo Estudio (P03) y Modo Exposición (P02) sobre el mismo contenido.
5. Buscador global Ctrl+K (P04) con índice público.
6. Analizador y validador del subconjunto SELECT v1 en dominio, con casos S01–S14 (necesario para laboratorio y M08/M10).
7. SQL Challenge individual (R4), según el orden de [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).
8. En paralelo, cuando haya infraestructura: R1 Oracle real y laboratorio (P08).
9. Recursos, chuleta y catálogo futuro (P18); vídeos cuando existan los activos.
10. Supabase, salas, tiempo autoritativo, ranking y estadísticas (R6).

El orden del ROADMAP sitúa R3 (contenido y laboratorio) antes de R4 (Challenge). Si se decide adelantar el Challenge, las misiones M01–M09 pueden avanzar con el dataset y el comparador de resultados en dominio; M10 seguirá dependiendo de Oracle.
