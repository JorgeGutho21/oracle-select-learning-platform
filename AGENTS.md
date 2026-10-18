# Instrucciones del proyecto

## Estado y alcance
- Antes de modificar, leer la documentación aplicable.
- Usar español claro para contenido educativo y documentación.

## Arquitectura
- Separar presentación, aplicación, dominio e infraestructura según `docs/ARCHITECTURE.md`.
- Mantener responsabilidades delimitadas y una fuente académica coherente.
- No romper auth, roles, evaluaciones, progreso, laboratorio, sala ni Oracle.

## Calidad y seguridad
- No presentar una simulación como Oracle real.
- No exponer secretos ni credenciales.
- No afirmar pruebas no ejecutadas.
- Conservar trabajo existente fuera del alcance.

## Continuidad
- Leer `CONTINUITY.md` al comenzar.
- Mantener la rama `codex-final-pedagogy-ui-20261004` salvo orden explícita.
- Actualizar continuidad y evidencias al cerrar hitos.

## Sistema portable de agentes
- Definición canónica: `agents/`.
- Índice: `agents/manifest.json`.
- Orquestación: `agents/orchestrator.md`.
- Adaptadores Claude: `.claude/agents/`.
- Codex/Antigravity/otras IA: leer los mismos archivos; si no soportan subagentes, adoptar roles secuencialmente.
- Stack visual adicional del video: Emil Kowalski, Impeccable, Taste Skill, Figma MCP y Playwright están representados por wrappers en `agents/`.
- Una skill/MCP solo cuenta como usada si está realmente instalada/conectada en el entorno.
- `docs/AGENT_SYSTEM.md` documenta el sistema.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
