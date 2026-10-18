# AGENT_SYSTEM — Sistema de agentes de DB LAB

## Objetivo
Hacer portable el equipo de agentes usado durante el desarrollo de DB LAB para que distintas IAs trabajen con el mismo reparto de responsabilidades y los mismos gates.

## Arquitectura
- `agents/`: definición canónica y neutral al proveedor.
- `.claude/agents/`: adaptador para Claude Code.
- `AGENTS.md`: punto de entrada para Codex y reglas globales.
- `PRODUCT.md`: contexto de producto.
- `agents/manifest.json`: índice legible por herramientas.

## Cadena recomendada
Orchestrator → Product/Instructional → UX/UI/Design System → Frontend/Next.js → Oracle Validation → Accessibility → QA/Release.

No todas las tareas necesitan todos los agentes. El orquestador selecciona los necesarios.

## Independencia de proveedor
Ningún agente canónico depende de un modelo o API concreta. Si una IA no soporta subagentes, adopta los roles secuencialmente.

## Rama
Todos los agentes están configurados para `codex-final-pedagogy-ui-20261004`. Verificarla antes de escribir. No usar ramas anteriores silenciosamente.

## Cierre
Compilar no basta: se exige evidencia proporcional de pruebas, responsive, accesibilidad y coherencia curricular/Oracle según el alcance.
