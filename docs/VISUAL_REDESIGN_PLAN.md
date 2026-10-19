# VISUAL_REDESIGN_PLAN — Rediseño visual con el sistema de agentes

Fecha: 19 de octubre de 2026. Rama: `codex-final-pedagogy-ui-20261004`. Orquestación según `agents/orchestrator.md`.

## Fase 1 — Análisis (agentes ejecutados)

| Agente                                                  | Entregable                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| product-designer + ux-ui-designer                       | Especificación priorizada por pantalla, 19 rutas, 2 anchos   |
| impeccable-design-agent + taste-skill-frontend-director | Dirección visual con tokens exactos                          |
| design-systems-engineer + emil-kowalski-design-engineer | Auditoría de tokens, componentes duplicados y movimiento     |
| accessibility-engineer                                  | Línea base: axe 0/38, foco 30/30, 0 desbordes, 0 animaciones |
| figma-reference-agent                                   | No ejecutado: Figma MCP no está conectado en este entorno    |

Las skills locales de `.claude/skills/` son adaptadores breves; los agentes aplicaron sus criterios, no las skills públicas completas.

## Fase 2 — Propuesta consolidada

### Principios

- Se cambian estilos y composición; **no** se renombran clases, textos de controles, encabezados ni rutas que usan las pruebas.
- El contenido académico, los resultados de Oracle, la puntuación y los datos no cambian.
- Densidad: se resuelve con composición; ningún texto baja de 13 px (datos 14 px).
- Un solo primario por vista; mayúsculas espaciadas solo en rótulos pequeños (13 px, 600, 0.06em).
- Tarjetas sin anidar: lo interior pasa a superficie hundida (`--color-sunken`).
- Movimiento: solo `transform` y `opacity`; 100 / 150 / 200 / 250 ms; nunca `ease-in`; presupuesto 0 = efecto no montado.
- React Bits: un efecto protagonista por pantalla pública; ninguno en Lab, Estudio, Exposición ni Challenge.

### Base (ola 0)

- Fuente Inter Variable autoalojada (`@fontsource-variable/inter`, OFL) con `next/font/local`: mismas medidas en todos los sistemas y en el proyector.
- Tokens: radios 4 / 8 / 12 / 16, `page #F7F9FC`, `border-subtle #DCE3EF`, `border-strong #C3CEE0`, `sunken #EFF3FA`, `ink-2 #2B3A57`, `night-raised #12234A`, `inverse-muted #B8C4D9`.

### Olas por área (propiedad exclusiva de archivos)

1. **Público** (taste + ux + frontend): `_shell`, `_home`, `_sections`, `_effects` y sus componentes. Cabecera de 64 px, Home más corta con una acción primaria, `/sections` y hubs con alturas iguales y rótulos uniformes, pie en columnas S1/S2/S3/Herramientas/Proyecto.
2. **Aprendizaje** (ux + instructional + frontend): `_study`, `_learning`, `_resources`, `_modules`, `_roadmap`, páginas de currículo (no escenas). Índices sin bloques vacíos, cuadrícula continua, práctica con progreso visible.
3. **Herramientas** (ux + design-systems + frontend): `_lab`, `_sql`, `_data-view`, `_challenge`, `_challenge-mission`, `_search`. Lab con editor y resultado a la vista en 1440 × 900; Challenge en cuadrícula.
4. **Cuentas y docencia** (product + a11y + frontend): `_accounts`, `_assessments`, `_classroom`. Panel docente con accesos directos; botón deshabilitado neutro; texto ≥ 12 px.
5. **Exposición** (emil + a11y, con `projector-scenes.spec.ts`): solo tokens y defectos de accesibilidad (etiquetas del eje de la escena 16 S1).

### Gates

lint · typecheck · format · build · Vitest · E2E Chromium completa comparada con el commit base · `projector-scenes` · axe · capturas 390 / 768 / 1024 / 1280 / 1366 / 1440 / 1920 (playwright-visual-qa-agent) · contenido Oracle sin cambios (oracle-validation-engineer) · sin secretos (qa-release-engineer).

## Fase 3 — Ejecución (resultado)

Cinco olas en paralelo, cada una en su worktree y con su rama, integradas con merge en la rama principal:

| Ola                  | Agentes aplicados                                                                                        | Resultado principal                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Público            | product-designer, taste, ux-ui, frontend-architect + nextjs, emil, accessibility                         | Cabecera de 64 px, Home de 6221 a 4475 px con una acción primaria, tarjetas de sección iguales, pie en rejilla sin créditos duplicados              |
| 2 Aprendizaje        | instructional-designer-oracle, ux-ui, impeccable, design-systems, frontend + nextjs, accessibility       | Temario en cuadrícula continua (S3 de 8316 a 5120 px), lección S2/S3 con índice lateral como S1, práctica con progreso fijo, recursos en 2 columnas |
| 3 Herramientas       | ux-ui, design-systems, oracle-validation, emil, frontend + nextjs, accessibility                         | Lab con acciones junto al editor, Challenge en cuadrícula, tablas a 14 px sin barras, búsqueda densa                                                |
| 4 Cuentas y docencia | product-designer, ux-ui, design-systems, frontend + nextjs, accessibility, qa-release                    | Login limpio, panel docente con accesos directos, evaluaciones sin efectos con presupuesto 0, sala En vivo legible                                  |
| 5 Exposición         | instructional-designer-oracle, emil, design-systems, frontend + nextjs, oracle-validation, accessibility | Los 7 fallos de S1 en proyector resueltos, eje de la escena 16 a ≥ 13 px, progreso con `scaleX`, controles a 250 ms                                 |

Decisión: el Lab mantiene el resultado bajo el editor (prueba `lab-result-table`: tabla entera de 12 columnas a 1280 px); a la derecha van ejemplos y acciones.

## Fase 4 — Validación

- Contenido: sin cambios en dominio curricular, resultados Oracle, banco de evaluaciones, dataset, Supabase ni Oracle (diff vacío en esas rutas).
- E2E Chromium completa: 390/391 (antes del rediseño, 368/391). El único fallo, subtítulos del vídeo resumen (`media.spec`), es anterior. Incluye `projector-scenes` 8/8.
- Vitest: 2349 pasan, 7 omitidas, con Oracle 23 local y Supabase local reales (igual que antes del rediseño).
- Accesibilidad (playwright-visual-qa-agent + accessibility-engineer, 19 rutas × 2 anchos): axe 0/38, desbordamiento 0/38, foco 30/30, 0 animaciones con movimiento reducido; texto < 12 px de 12 nodos a 0; objetivos < 24 px de 66 a 0.
- QA visual: defectos corregidos tras la revisión (escena 10 de S1 a 1280 × 720, estado de Práctica en móvil, pie a 1024 px, tablas de Estudio a 320 px).

### Pendientes reales

- `/challenge` de S1 no usa todavía la cabecera, la miga de pan y las pestañas de modo de S2/S3; sus reglas de puntuación difieren (−20 frente a −15/−10) y no se cambian sin decisión del docente.
- `/learn` indica «22 lecciones» del Modo Estudio y la sección cuenta 25 (incluye las 3 de funciones de una fila).
- En Estudio a 390 px, las pestañas de modo ocupan tres filas.
- `aria-describedby` de las piezas arrastrables (dnd-kit) apunta a una descripción no montada en Práctica: lector de pantalla sin instrucciones de arrastre.
- Subtítulos del vídeo resumen ausentes (`media.spec`), anterior al rediseño.
- Escena 7 de S1 a 1280 × 720: 2 px entre contenido e idea clave (no se solapan).
- Edge, WebKit y Firefox: NOT TESTED en este entorno (solo Chromium). Preview y Production: no desplegados desde aquí.
