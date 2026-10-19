# DB LAB — Dirección del rediseño visual

Encargo vigente: misión visual final del 18 de octubre de 2026. Base sincronizada: `41baa2c`, rama `codex-final-pedagogy-ui-20261004`. Las correcciones académicas y de proyector de Claude se conservan; el currículo no forma parte de esta intervención.

## Integración vigente — 19 de octubre de 2026

La base vigente incorpora el rediseño remoto `a2d6827` mediante el merge `ce32568`. Sus superficies, composición, Inter Variable autoalojada y tokens tienen precedencia sobre las decisiones históricas de abajo. Se retienen la búsqueda de recursos, el progreso real en el inicio, las correcciones de accesibilidad y los estados de interacción compatibles. El sistema vigente se documenta en `DESIGN.md` y `.impeccable/design.json`; la auditoría inicial describe el punto de partida. Los resultados del 18 de octubre requieren nuevas capturas y gates para acreditar la versión integrada.

## Auditoría y prioridad

| Prioridad | Problema observado en la base                                             | Intervención                                                                      |
| --------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P1        | Inicio presenta el progreso después de varias pantallas de contenido      | Traer avance real y continuación al primer bloque funcional                       |
| P1        | La presentación de herramientas exige recorrer bandas de explicación      | Accesos explícitos a Lab, Challenge, evaluación y recursos junto a la ruta        |
| P1        | Recursos es una colección larga de fichas                                 | Índice por bloques y búsqueda sobre contenido real, sin nuevas fuentes académicas |
| P2        | Secciones y modos repiten cajas equivalentes                              | Ruta editorial, contenidos y acciones en columnas con lectura secuencial móvil    |
| P2        | La navegación docente compite con la navegación pública                   | Espacio docente con rail propio y acciones agrupadas por tarea                    |
| P2        | Hero oscuro, rótulos en mayúsculas y marcos repetidos dominan el producto | Superficies claras de trabajo, código oscuro y color reservado para significado   |
| P3        | Controles con feedback dispar                                             | Tokens comunes de duración, foco y presión; sin atenuar texto                     |

No se ha confirmado un P0 funcional en esta auditoría inicial. Esto no sustituye la regresión final.

## Direction contract

**THESIS:** El cuaderno de trabajo de una clase de bases de datos: origen, consulta y resultado son la unidad visual; cada pantalla conduce a una acción académica concreta.

**OWN-WORLD:** Superficies claras azuladas, tinta azul noche, azul de acción y cian reservado a código/superficies oscuras. Reutilizar colores semánticos SQL. Inter Variable autoalojada y monoespaciada exclusivamente para código y datos. Una retícula, radios controlados, superficies antes que sombras.

**STORY:** Reconocer DB LAB, localizar el propio avance, elegir una sección y estudiar o practicar. Los espacios docentes y de evaluación tienen una densidad operativa propia dentro del mismo sistema.

**FIRST VIEWPORT:** Identidad y propósito a la izquierda, consulta y tabla real del motor educativo a la derecha. Progreso auténtico y continuación visibles cerca de las acciones principales. En móvil, flujo vertical con objetivos táctiles completos.

**FORM:** Composición guiada por código. Referencia Impeccable `seed:247d45123755e633`, generada después de la implementación; no dirigió esta composición. La comprobación local descartó la atribución previa de unavailable. La extracción Taste «One motif» consta en la evidencia histórica del 18 de octubre y no se atribuye como seed de Impeccable. La composición se adapta a la unidad tabular del producto; se omiten siluetas gigantes, fotografías genéricas, vídeo en bucle y mínimos decorativos porque el encargo exige una aplicación académica ligera. Emil gobierna interacción y continuidad; Impeccable revisa composición y contraste. La identidad existente prevalece sobre las preferencias genéricas de las Skills.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Contratos del sistema

- Contenedores de 1320 px y lectura de hasta 72ch; columnas `minmax(0, 1fr)`.
- Espaciado 4/8/12/16/24/32/48/64/96 px. Sin tipografía comprimida para resolver densidad.
- Tres superficies: página, trabajo y código. Estados semánticos acompañados de texto o forma.
- Botones primario, secundario y textual; objetivo de producto 44 px; foco de 3 px separado del control.
- Feedback 150 ms, transiciones 250 ms; `--ease-out`. No animar texto con opacidad ni navegación frecuente por teclado. Reduced motion desactiva transiciones no esenciales.
- Tablas con título y encabezados semánticos; distinguir fuente, resultado y comparación. Código conserva los colores y resultados existentes.
- Auth, UUID/roles, RLS, bancos, puntuación, tiempos, dataset y persistencia no cambian.

## Responsabilidades reales

Orquestador: sincronización, alcance, Home/shell, docente/evaluación y decisión de release. Design App: Emil/Impeccable/UX/Design Systems, entradas y modos del currículo. Especialista de laboratorio: presentación del Lab, búsqueda, tablas y S1. QA: Playwright, accesibilidad, regresión, disponibilidad de servicios y evidencia visual. Figma MCP no está conectado; no se utiliza ni se declara utilizado.

## Intervención UI de secciones y modos

Design App aplicó los roles locales Emil Kowalski, Impeccable y Design Systems. Leyó las dos Skills instaladas, PRODUCT, continuidad y los contratos de diseño; reutilizó el contexto Impeccable ejecutado por el orquestador. La intervención conserva los contratos académicos, identificadores, enlaces y contenido estabilizado por Claude en `41baa2c`.

| Antes                                                           | Después                                                                                       | Motivo                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Tres tarjetas de sección equivalentes                           | Ruta vertical con objetivo y acción a la izquierda, temas y práctica a la derecha             | Hacer visible la secuencia y dar espacio a los nombres reales         |
| Seis modos con composición uniforme de tarjeta                  | Filas con icono, descripción y acción en dos columnas                                         | Comparar tareas sin repetir seis paneles altos                        |
| Banda nocturna y navegación horizontal en todos los modos S2/S3 | Cabecera clara y rail lateral de herramientas en escritorio; retícula táctil en móvil         | Distinguir el espacio de trabajo de la portada y mantener orientación |
| Temario distribuido en tarjetas                                 | Bloques separados y filas de lecciones numeradas                                              | Facilitar lectura secuencial sin comprimir la tipografía              |
| Recursos con filtros de categoría únicamente                    | Búsqueda por término, explicación, sintaxis y errores, sin sensibilidad a tildes              | Encontrar contenido existente sin duplicar currículo                  |
| Bloques cerrados durante una búsqueda                           | Bloques de resultados abiertos automáticamente, fichas no coincidentes ocultas y estado vacío | Hacer que la búsqueda conduzca a una respuesta visible                |

Los estilos viven en `_learning-workspace.scss`, importado después de los estilos existentes. Las reglas de layout se limitan a las portadas y modos curriculares; no se cambia la geometría de las escenas de proyector. Los controles mantienen targets de 44 px o más, foco visible y reduced motion. No se añaden dependencias ni animaciones decorativas.

Verificación específica añadida: `tests/unit/curriculum/resource-explorer.test.tsx` comprueba búsqueda sin tildes, apertura de un bloque cerrado, limpieza y selección de categoría. Su ejecución y la revisión visual se registran en el informe QA final, sin atribuir aprobación antes de obtener sus resultados.

La exploración pedagógica de la primera solicitud se detuvo al recibirse la misión visual final; sus cambios de dominio se retiran para preservar la fuente remota.
