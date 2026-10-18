# Product

<!-- project-local product context for Claude/Codex agents -->

## Platform
DB LAB — plataforma web educativa de Bases de Datos con Oracle para estudiantes principiantes de Ingeniería de Sistemas de la Universidad Popular del Cesar.

## Users
- Estudiantes que pueden llegar sin conocimientos previos de SQL/PL/SQL.
- Docente: Amilkar Sierra Romano.
- Autor/desarrollador académico: Jorge Gutiérrez Thomas.

## Product principles
1. Enseñar de menos a más: definición → tabla de partida → sintaxis → microejemplo → ejemplo → resultado → explicación paso a paso → comprobación.
2. La Sección 1 (Fundamentos SQL) es la referencia pedagógica y visual para S2 y S3.
3. No presentar simulaciones como ejecución real de Oracle.
4. Mantener un único dataset versionado por sección y explicar siempre qué tablas/columnas se usan.
5. La clase proyectada (1920×1080/1366×768) y el estudio autónomo móvil tienen la misma prioridad.
6. Evitar pantallas genéricas, vacías o saturadas. La interacción debe ayudar a aprender, no competir con el contenido.
7. Accesibilidad WCAG 2.2 AA, teclado, movimiento reducido, foco visible y sin desbordamiento horizontal.
8. Mantener intactos autenticación, roles, evaluaciones, progreso, Oracle, Supabase y seguridad salvo que el cambio sea imprescindible y esté probado.

## Brand / UI
- Identidad: DB LAB.
- Paleta vigente y tokens: docs/DESIGN_SYSTEM.md.
- React Bits gratuitos ya integrados: Shape Grid, Spotlight Card, Star Border y Pixel Card. Usarlos con moderación.
- Las nuevas animaciones deben ser breves, con propósito pedagógico y respetar prefers-reduced-motion.
- No introducir dependencias pesadas solo por decoración.

## Curriculum
- S1: Fundamentos SQL / SELECT; patrón pedagógico canónico.
- S2: Consultas relacionales y análisis.
- S3: PL/SQL y automatización.
- Seguir el orden del profesor y los contratos documentados en docs/SECTION_2_CURRICULUM.md, docs/SECTION_3_CURRICULUM.md y docs/S2_S3_FINAL_QA.md.

## Non-negotiables
- No inventar resultados Oracle.
- No exponer secretos, tokens ni credenciales.
- No romper rutas, progreso, evaluaciones ni panel docente.
- No reducir texto por debajo de los mínimos del sistema para “hacer que quepa”.
- Resolver densidad cambiando composición, no ocultando contenido esencial.
- Antes de cerrar: lint, typecheck, format, build y pruebas relevantes; documentar cualquier bloqueo externo real.
