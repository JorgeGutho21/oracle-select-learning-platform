# AGENT_SYSTEM — Sistema de agentes de DB LAB

## Objetivo
Hacer portable el equipo de agentes usado durante el desarrollo de DB LAB para que Claude, Codex, Antigravity u otra IA trabajen con los mismos roles y gates.

## Arquitectura
- `agents/`: definición canónica neutral al proveedor.
- `.claude/agents/`: adaptadores para Claude Code.
- `AGENTS.md`: reglas globales y entrada para Codex.
- `PRODUCT.md`: contexto de producto.
- `agents/manifest.json`: índice legible por herramientas.

## Cadena general
Orchestrator → Product/Instructional → UX/UI/Design System → Frontend/Next.js → Oracle Validation → Accessibility → QA/Release.

## Cadena visual opcional del video
Impeccable → Emil Kowalski Design Engineer → Taste (solo donde encaje) → Figma Reference → Playwright Visual QA.

No todos se ejecutan siempre:
- Taste no debe gobernar dashboards/paneles densos.
- Figma solo si hay referencia y MCP disponible.
- Emil/Impeccable solo se consideran “ejecutados” si su skill está instalada/cargada.
- Playwright sirve para validar el resultado real, no para reemplazar los tests.

## Independencia de proveedor
Si la IA soporta subagentes, puede delegar. Si no, adopta los roles uno a uno leyendo los mismos archivos.

## Rama
Todos los agentes trabajan sobre `codex-final-pedagogy-ui-20261004`. Verificarla antes de escribir.

## Cierre
Compilar no basta: pruebas, responsive, accesibilidad, coherencia curricular/Oracle y QA visual proporcional al alcance.
