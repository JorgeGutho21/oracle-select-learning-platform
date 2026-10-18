# Sistema portable de agentes — DB LAB

Esta carpeta contiene los agentes canónicos del proyecto para Claude Code, Codex, Antigravity u otra IA con acceso al repositorio.

## Rama bloqueada
`codex-final-pedagogy-ui-20261004`

## Uso
1. Cargar `PRODUCT.md`, `AGENTS.md` y `CONTINUITY.md`.
2. Leer `agents/manifest.json`.
3. Para trabajos amplios, empezar por `agents/orchestrator.md`.
4. El orquestador selecciona especialistas. Si la IA no soporta subagentes, adopta los roles secuencialmente.
5. Antes del cierre, usar `qa-release-engineer` y, para UI, `playwright-visual-qa-agent`.

## Equipo base
orchestrator · product-designer · ux-ui-designer · frontend-architect · nextjs-typescript-engineer · design-systems-engineer · instructional-designer-oracle · oracle-validation-engineer · accessibility-engineer · qa-release-engineer

## Stack visual del video / Claude
También están adaptados como agentes:
- `emil-kowalski-design-engineer` → skills públicas de Emil Kowalski.
- `impeccable-design-agent` → usa la skill local Impeccable cuando existe.
- `taste-skill-frontend-director` → usa `design-taste-frontend`.
- `figma-reference-agent` → usa Figma MCP cuando está conectado.
- `playwright-visual-qa-agent` → abre y valida la web real con Playwright.

Importante: Emil/Taste/Impeccable son originalmente skills o integraciones, no “agentes” nativos. Aquí se encapsulan como agentes portables. Cuando la skill original está instalada, el wrapper exige leerla/usarla como fuente de verdad; cuando no está disponible, debe declararlo.
