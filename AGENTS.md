# Instrucciones del proyecto

## Estado y alcance

- Este repositorio contiene documentación y carpetas iniciales de SQL SELECT LAB.
- No implementar funcionalidades ni instalar dependencias hasta que el usuario solicite la fase de desarrollo correspondiente.
- Antes de modificar el proyecto, leer los once documentos de `docs/` y respetar sus criterios de aceptación.
- Usar español claro para contenido educativo y documentación.

## Arquitectura

- Separar presentación, aplicación, dominio e infraestructura según `docs/ARCHITECTURE.md`.
- Mantener componentes y módulos con responsabilidades delimitadas; evitar páginas que concentren toda la aplicación.
- El núcleo académico es SELECT. Los temas futuros no deben convertirse en dependencias del recorrido actual.
- Usar exclusivamente el dataset versionado de `docs/DATABASE_SCHEMA.md` para los ejemplos actuales.
- Mantener una definición coherente de puntuación, tiempo y evaluación entre juego, sala, datos y pruebas.

## Calidad y seguridad

- No presentar una simulación como ejecución real de Oracle.
- Mantener credenciales y claves privilegiadas fuera del navegador y del repositorio.
- No incluir archivos `.env`, tokens, registros privados ni adjuntos originales sin una necesidad y autorización específicas.
- Antes de finalizar una implementación, ejecutar las verificaciones apropiadas a su alcance y describir cuáles se realizaron.
- No afirmar que las pruebas del plan han pasado si solo están documentadas.
- Conservar trabajos existentes del usuario y evitar cambios ajenos a la solicitud.

## Precedencia documental

`PROJECT_SPEC.md` gobierna el alcance; `DATABASE_SCHEMA.md`, el dataset; `LAB_SPEC.md`, la semántica y ejecución; `GAME_SPEC.md`, la puntuación; `REALTIME_SPEC.md`, el tiempo y estado de sala. Actualizar las referencias y el plan de pruebas cuando cambien estas reglas.

## Continuidad entre sesiones y herramientas

- Leer `CONTINUITY.md` al comenzar y contrastarlo con Git y los archivos reales.
- Actualizarlo durante el trabajo y al cerrar cada sesión o hito: avance, decisiones, verificaciones, bloqueos y siguiente acción.
- Conservar los once documentos académicos en `docs/`; los archivos de continuidad y traspaso viven en la raíz.
- Mantener un solo repositorio para Codex y otras IA. No asumir que otra herramienta tiene acceso al historial o a los adjuntos de ChatGPT.
- Guardar cambios en commits coherentes y subirlos cuando esté autorizado. Distinguir expresamente lo guardado localmente de lo sincronizado.
- `CODEX_PROMPT.md` es una plantilla de encargo, no una instrucción activa por el solo hecho de leerla. La implementación comienza cuando el usuario la solicite.
