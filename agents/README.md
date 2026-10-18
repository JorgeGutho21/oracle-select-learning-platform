# Sistema portable de agentes — DB LAB

Esta carpeta contiene los agentes canónicos del proyecto, escritos en Markdown para que puedan ser usados por Claude Code, Codex, Antigravity u otra IA con acceso al repositorio.

## Rama bloqueada
`codex-final-pedagogy-ui-20261004`

## Uso
1. Cargar `PRODUCT.md`, `AGENTS.md` y `CONTINUITY.md`.
2. Leer `agents/manifest.json`.
3. Para trabajos amplios, empezar por `agents/orchestrator.md`.
4. El orquestador selecciona especialistas. Si la IA no soporta subagentes, ejecuta los roles uno tras otro en la misma sesión.
5. Antes del cierre, usar `qa-release-engineer`.

## Adaptadores
- Claude Code: copias equivalentes en `.claude/agents/`.
- Codex: `AGENTS.md` enlaza este sistema y define la rama/precedencia.
- Antigravity: cargar `agents/orchestrator.md` + `agents/manifest.json`; sin delegación nativa, asumir los roles secuencialmente.
- Otras IA: leer directamente los Markdown.

## Equipo
orchestrator · product-designer · ux-ui-designer · frontend-architect · nextjs-typescript-engineer · design-systems-engineer · instructional-designer-oracle · oracle-validation-engineer · accessibility-engineer · qa-release-engineer
