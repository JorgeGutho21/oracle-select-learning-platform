# Continuidad del proyecto

Actualizado: 23 de septiembre de 2026. Punto de entrada para Codex u otra IA.

## Leer al retomar

1. `AGENTS.md`, este archivo y `README.md`.
2. Los once documentos de `docs/`, empezando por `PROJECT_SPEC.md` y `ROADMAP.md`.
3. El estado real de Git y los archivos de implementación. Este resumen no sustituye comprobar cambios posteriores.

Repositorio único: https://github.com/JorgeGutho21/oracle-select-learning-platform

Copia de desarrollo verificada en el equipo del usuario:
`C:\Users\JORGE GUTIERREZ\Documents\GitHub\oracle-select-learning-platform`.
En otro equipo, usar el clon de ese mismo repositorio. No crear repositorios diferentes por herramienta de IA.

## Objetivo y alcance acordados

SQL SELECT LAB es una plataforma universitaria en español de Jorge Gutiérrez Thomas, Universidad Popular del Cesar. Enseña introducción breve a SQL, SELECT, FROM, SELECT *, columnas específicas, expresiones y cálculos, alias con AS, DISTINCT y consultas completas de proyección.

WHERE, BETWEEN, IN, LIKE, NULL, JOIN, ORDER BY, agrupaciones y demás temas avanzados quedan para módulos futuros. Los criterios verificables por módulo están en las especificaciones.

La experiencia incluye Home, Exposición, Estudio, búsqueda Ctrl+K/Cmd+K, vídeo introductorio, explicaciones visuales, tablas interactivas, laboratorio Oracle real, diez misiones de SQL Challenge, arrastre accesible, predicción, detección de errores, reconstrucción, reto escrito, sala por QR, cronómetro, puntos, ranking, estadísticas, vídeo resumen, chuleta y catálogo futuro.

## Estado comprobado

| Elemento | Estado |
|---|---|
| R0: once especificaciones | Completas y subidas a GitHub. |
| Estructura por capas | Carpetas iniciales con `.gitkeep`; sin aplicación. |
| README, AGENTS, .gitignore | Creados y versionados. |
| R1: Oracle real | Pendiente; instancia, credenciales y conectividad no verificadas. |
| R2–R8 | Pendientes; no hay implementación ni despliegue. |
| Pruebas del producto | Planificadas; ninguna se ha ejecutado sobre una aplicación. |
| Continuidad y prompt | Esta entrega añade este archivo y `CODEX_PROMPT.md`. |

Commit inicial documental: `dda7d2b892207d226c78d3f3252827290ccf93dd`. Es una referencia histórica; consultar Git para conocer el último commit y la rama actuales.

La solicitud actual prepara el traspaso y conserva el contexto. El prompt de desarrollo es una plantilla para enviar como siguiente encargo; su presencia en el repositorio no inicia tareas por sí sola.

## Decisiones que deben conservarse

- Una sola base de trabajo en GitHub, válida para Codex y otras herramientas.
- Presentación, aplicación, dominio e infraestructura separados; no concentrar el producto en una sola página.
- Stack propuesto: Next.js, React, TypeScript estricto, Bootstrap/Sass, CodeMirror y arrastre accesible. Supabase para datos de aplicación, identidad y tiempo real; servicio separado para Oracle. Fijar versiones compatibles al implementar.
- Superficies claras, azul/cian, buena legibilidad en proyector y móvil. Bootstrap, Atera Energy y Spinoff son referencias de diseño; el sitio del compañero solo aporta estructura pedagógica.
- Dataset `empleados-select-v1` de seis empleados y seis columnas, gobernado por `DATABASE_SCHEMA.md`. Se eligió F1: María tiene 30 años; Jorge, 22 y departamento Sistemas. No mezclar los datos divergentes del juego o F2 ni añadir TELEFONO a esta unidad.
- Exactamente diez misiones. La definición de evaluación y puntos está en `GAME_SPEC.md`; máximo 1000 puntos. En sala, el servidor gobierna puntuación y tiempo.
- Laboratorio real significa ejecución comprobada en Oracle. Si falta el servicio, mostrar indisponibilidad; las demostraciones visuales no acreditan este requisito.
- Objetivo de sala: 60 participantes, con prueba adicional a 75 conexiones. Es una meta pendiente de medición.

## Fuentes y límites del traspaso

Las especificaciones sintetizan los materiales revisados y sus discrepancias. `PROJECT_SPEC.md` contiene el inventario F1–F7 y `CONTENT_MAP.md` la trazabilidad educativa.

| Fuente | Disponibilidad y alcance revisado |
|---|---|
| `SentenciasSQL_GM.pptx` | 35 diapositivas revisadas; original adjunto en la conversación, no incluido en este repositorio. |
| `Oracle_SQL_NTB.pptx` | 21 diapositivas de imágenes revisadas visualmente; original no incluido en este repositorio. |
| [Juego del usuario](https://claude.ai/artifact/WN1sTa6YEJfuPysmX64qtv) | Se revisaron portada, mapa y primera misión. Código fuente no exportado ni auditado; los niveles bloqueados no se completaron. |
| Capturas Bootstrap/Atera Energy/Spinoff | Referencias visuales descritas en DESIGN_SYSTEM; las capturas originales no están versionadas. |
| [Sitio del compañero](https://select-basico-jpatino.vercel.app/) | Estructura educativa revisada; no copiar diseño, marca, contenido ni componentes. |

Conversaciones de origen: «Diseñar Documentación Plataforma SQL» (`6ab408e7-e70c-83e9-bb3f-986a1d4ecc0b`) y «Diseñar plataforma SELECT» (`6ab3fcaa-8e8c-83e9-bd47-488891234527`). Sus identificadores son referencias, no garantizan acceso desde otra IA. Este archivo es una síntesis, no una exportación literal del historial ni de sus adjuntos.

La última captura muestra una carpeta `Presentacion_SELECT_JorgeGutierrez/Juego_Select`. Su ruta absoluta y contenido no se han verificado. No asumir que contiene el repositorio ni sobrescribirla. Si se necesita reutilizar el código del juego, localizar y revisar esa exportación antes de integrarla.

## Siguiente trabajo

Al recibir el encargo de implementación, comprobar el estado del repositorio y empezar según ROADMAP: resolver R1 (viabilidad de Oracle) y avanzar R2 (base visual y navegación) en lo que no dependa de infraestructura externa. Continuar con los hitos dependientes cuando sus condiciones sean verificables.

Pendientes externos concretos: instancia Oracle, servicio y conectividad; configuración de Supabase; vídeos definitivos; logotipo oficial; nombre exacto de asignatura y ortografía del docente; tiempo final asignado a la exposición. Documentar qué bloquea cada pendiente y continuar el trabajo independiente.

## Protocolo para evitar pérdida de contexto

Al cerrar cada sesión o hito, la IA que trabaja debe actualizar este archivo con:

- Fecha, rama y último commit conocido, distinguiendo cambios locales de cambios subidos.
- Funciones implementadas y archivos relevantes.
- Decisiones nuevas y documentos afectados.
- Verificaciones ejecutadas, resultado y pruebas todavía pendientes.
- Bloqueos reales y siguiente acción concreta para retomar.

Guardar avances durante el trabajo, sin esperar a que se agote el contexto. Crear commits coherentes y sincronizarlos con el remoto cuando esté autorizado y disponible. Si falla la subida, indicarlo: guardar localmente no equivale a tener copia en GitHub. No incluir secretos ni historiales privados completos.

Otra IA necesita acceso al repositorio actualizado, o a una copia descargada con estos archivos. Este mecanismo conserva el trabajo; no cambia automáticamente de proveedor, no transfiere sesiones y no evita los límites de uso de cada servicio.

## Registro de sesiones

- 2026-09-23: especificaciones y estructura inicial verificadas y publicadas en `main`, commit inicial arriba indicado. Sin código de aplicación.
- 2026-09-23: preparación de continuidad y prompt reutilizable por petición del usuario. Verificación documental: conservación de los once documentos académicos, enlaces locales y formato de cambios; sin pruebas de aplicación aplicables.
