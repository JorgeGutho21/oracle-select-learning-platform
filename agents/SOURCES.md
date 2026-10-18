# Fuentes públicas de referencia

Los agentes de DB LAB son adaptaciones específicas del proyecto.

## Agentes generales

- https://github.com/VoltAgent/awesome-claude-code-subagents
- https://github.com/msitarzewski/agency-agents
- https://github.com/github/awesome-copilot

## Stack visual usado en Claude/TikTok

- Emil Kowalski Skills: https://github.com/emilkowalski/skills
  - `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `animation-vocabulary`, `break-ui`, `pick-ui-library`, `prototype`.
- Taste Skill: https://github.com/Leonxlnx/taste-skill
  - skill principal actual: `design-taste-frontend`.
- Impeccable: en este proyecto se usa como skill instalada localmente; el agente wrapper solo la declara disponible si existe `.claude/skills/impeccable/SKILL.md`.
- Figma MCP: integración externa; requiere autenticación/conexión.
- Playwright: integración/herramienta de navegador para QA visual y funcional.

Los wrappers no deben afirmar que ejecutaron una skill o MCP ausente. La lógica académica, Oracle, seguridad y gates de DB LAB tienen prioridad.
