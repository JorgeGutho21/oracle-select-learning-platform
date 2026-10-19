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
