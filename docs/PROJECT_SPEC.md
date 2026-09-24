# PROJECT_SPEC — SQL SELECT LAB

Versión documental 1.0 · 23 de septiembre de 2026 · Especificación para implementación posterior.

## Propósito y público

Plataforma universitaria en español para que estudiantes sin experiencia puedan interpretar, construir y ejecutar consultas de proyección en Oracle SQL. Integra explicación, práctica y evaluación en una misma web. El expositor la utiliza como guía y los estudiantes participan desde sus teléfonos.

Identidad confirmada por el responsable del proyecto el 23 de septiembre de 2026: autor Jorge Gutierrez Thomas; profesor Amilkar Sierra; asignatura Base de Datos; programa Ingeniería de Sistemas; Universidad Popular del Cesar. Esta forma exacta, sin tildes en los nombres propios, prevalece sobre las variantes de las fuentes («Amílcar», «Amílkar», «Gutiérrez»). En el código, `src/application/academic-identity.ts` es su única fuente. El logotipo institucional será un recurso oficial, conservando proporciones y colores, no una recreación ni una extracción del sitio del compañero.

Esta entrega contiene únicamente los once documentos solicitados. No contiene aplicación, migraciones, vídeos producidos ni infraestructura desplegada. Los ejemplos SQL son material didáctico, no implementación.

## Fuentes y trazabilidad

| ID | Fuente examinada | Uso y límites |
|---|---|---|
| F1 | `SentenciasSQL_GM.pptx`, 35 diapositivas, adjunto de «Diseñar Documentación Plataforma SQL» | Fuente principal de explicaciones, ejemplos y datos. Núcleo: diapositivas 3–10. Actividades y síntesis: 28–34, adaptadas al alcance. |
| F2 | `Oracle_SQL_NTB.pptx`, 21 diapositivas de imágenes, revisadas visualmente | Fuente principal complementaria. Tabla y proyección: 3–8. Anatomía, detección de errores, reto y chuleta: 17–21, adaptados. |
| F3 | [SQL Oracle Challenge del usuario](https://claude.ai/artifact/WN1sTa6YEJfuPysmX64qtv) | Se verificaron portada, mapa de los diez niveles y primera actividad. No se auditó código fuente ni se completaron los niveles bloqueados. Correspondencias en GAME_SPEC. |
| F4 | Seis capturas adjuntas en «Diseñar plataforma SELECT»: `Screenshot 2026-09-23 113208.png`, `113240.png`, `113717.png`, `113742.png`, `113746.png`, `113751.png` | Bootstrap, Spinoff en `spinoff.es` y Atera Energy. Evidencia visual directa, descrita en DESIGN_SYSTEM. |
| F5 | [Sitio del compañero](https://select-basico-jpatino.vercel.app/) | Se revisaron estructura de lecciones, ejemplos, visualizador, playground y quiz. Solo se toma la secuencia pedagógica; no sus colores, textos, datos, marca ni componentes. |
| F6 | Conversaciones «Diseñar plataforma SELECT» y «Diseñar Documentación Plataforma SQL» | Preferencias: identidad propia, estética azul/cian con superficies claras, más de 50 participantes, dos vídeos y mayor dificultad de las últimas misiones. |
| F7 | [Oracle SQL Language Reference: SELECT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html) | Contraste técnico de alias, proyección y DISTINCT. La documentación oficial prevalece sobre errores de las presentaciones. |

Los archivos fuente permanecen intactos. Los dos PPT discrepan en algunos registros; la decisión canónica y las correcciones quedan en CONTENT_MAP y DATABASE_SCHEMA. Las duraciones, puntuación, capacidad y arquitectura de estos documentos son decisiones propuestas del producto, no características atribuidas a los originales.

## Alcance cerrado de la primera unidad

Incluye introducción breve a SQL, SELECT, FROM, asterisco, columnas específicas y su orden, expresiones aritméticas, alias de columna con AS, DISTINCT y construcción de una consulta completa dentro de ese subconjunto.

WHERE, comparaciones, BETWEEN, IN, LIKE, AND/OR/NOT, NULL, ORDER BY, JOIN, agrupaciones, funciones y subconsultas quedan en «Próximos módulos». No son prerrequisitos, ejercicios puntuados ni pasos obligatorios de la exposición. La palabra «completa» significa que satisface el requerimiento de proyección; no exige filtros ni ordenamiento.

Resultados de aprendizaje: identificar tabla y columnas; distinguir proyección de modificación; calcular resultados sin cambiar el origen; interpretar encabezados; deduplicar combinaciones completas; escribir y justificar una consulta válida.

## Módulos y aceptación funcional

Los identificadores P01–P18 son requisitos. Las pruebas T01–T18 de TEST_PLAN los verifican.

| ID | Módulo | Criterio de aceptación verificable |
|---|---|---|
| P01 | Home | Muestra autor, institución, objetivo y accesos a Exposición, Estudio, Laboratorio, Challenge y Sala en vivo. Todos abren la ruta correcta desde móvil y escritorio. |
| P02 | Modo Exposición | Recorre las dieciséis escenas de CONTENT_MAP con botones y flechas, muestra posición, ofrece pantalla completa y conserva la escena al salir y regresar. Flechas no interfieren con editor o vídeo. |
| P03 | Modo Estudio | Contiene L00–L08, navegación libre y reanudación local. Abrir una página no la marca como aprendida; se registra como completada al resolver su comprobación. |
| P04 | Buscador global | Ctrl+K, Cmd+K y botón visible abren el mismo diálogo. «alias», «asterisco», «video», «quiz» y «chuleta» llevan al contenido correspondiente; Escape devuelve el foco. |
| P05 | Vídeo introductorio | Reproduce 90–120 segundos con subtítulos, controles, transcripción y opción de omitir. No se inicia con audio automáticamente. |
| P06 | Explicaciones visuales | Cada lección SQL enlaza consulta, traducción, tabla fuente y resultado; un avance manual muestra qué columna o expresión interviene. |
| P07 | Tablas interactivas | Usan el mismo dataset versionado, muestran seis filas y permiten resaltar columnas con ratón, toque y teclado. No modifican los datos. |
| P08 | Laboratorio SQL real | Ejecuta en Oracle las consultas permitidas, devuelve metadatos y valores reales y distingue fallo de sintaxis, contenido fuera de alcance y caída del servicio. Cumple LAB_SPEC. |
| P09 | SQL Challenge | Tiene exactamente diez misiones M01–M10 y permite terminarlas sin depender de contenidos futuros. Incluye progreso, intentos, pista y explicación. |
| P10 | Manipulación de bloques | M01, M02, M06 y M09 se resuelven por arrastre o por seleccionar pieza y destino; ambas alternativas producen la misma respuesta evaluada. |
| P11 | Predicción | M03, M04 y M07 exigen construir o completar un resultado antes de revelarlo. No se reducen a elegir A/B/C/D. |
| P12 | Detección de errores | M08 exige localizar y reparar una consulta incorrecta; una consulta válida pero distinta de la solicitada recibe feedback semántico, no un falso error de Oracle. |
| P13 | Reto final escrito | M10 parte de un editor vacío, comprueba consulta, resultado y requisitos mediante el servidor; rechaza respuestas vacías o resultados escritos manualmente. |
| P14 | Sala por QR | QR y código textual permiten entrar con alias, sin correo del estudiante. El presentador controla inicio y avance; cada participante recibe el mismo estado autorizado. |
| P15 | Cronómetro y puntuación | Tiempo y puntaje de la sala provienen del servidor. Reintentar una petición no duplica puntos. Estudio sin límite y sala con cuenta regresiva tienen reglas visibles. |
| P16 | Ranking | Se actualiza después de cada ronda, muestra alias y posición propia y respeta empates y permisos. No mezcla partidas individuales con la sala. |
| P17 | Estadísticas | Presenta aciertos, intentos, tiempo y conceptos a repasar. La vista docente contiene tasas por misión con denominadores visibles; sin datos muestra «Sin resultados». |
| P18 | Cierre y extensión | Incluye vídeo resumen de 3–4 minutos, chuleta imprimible desde el navegador y catálogo de módulos futuros claramente no disponibles, fuera del progreso actual. |

## Reglas de producto

- Dos recorridos comparten contenido: Exposición organiza escenas; Estudio ofrece lectura y práctica autónoma. No se mantienen dos explicaciones diferentes del mismo concepto.
- SQL Challenge constituye la evaluación interactiva. «Quiz» en la búsqueda remite al Challenge; no se crea un segundo cuestionario redundante.
- Práctica individual local y sala competitiva son contextos separados. El resultado local se identifica como práctica y no alimenta el ranking oficial.
- Meta inicial: una sala de 60 estudiantes y un presentador. Validación adicional a 75 conexiones. No se promete capacidad ilimitada ni alojamiento gratuito.
- Internet es requisito de Oracle y de las salas. El contenido ya cargado puede seguir visible ante un corte; no se requiere una aplicación offline.
- El reconocimiento se expresa como puntos y conceptos dominados, sin convertirlo automáticamente en nota oficial universitaria.

## Límites de calidad y exclusiones

Objetivos medibles: contenido principal utilizable en 3 segundos bajo el perfil de TEST_PLAN; búsqueda local en 200 ms p95; ejecución Oracle en 2 segundos p95 a carga objetivo; propagación de sala en 1 segundo p95. Una consulta tiene plazo total máximo de 5 segundos. Son metas de aceptación, no mediciones ya realizadas.

Accesibilidad: navegación por teclado, foco visible, alternativas al arrastre, subtítulos, reducción de movimiento y lectura correcta de tablas. La aceptación incluye móvil de 360 px y proyección de 1920 × 1080.

Fuera de alcance: LMS completo, matrícula institucional, pagos, certificados, chat, redes sociales, avatar, tienda, editor de cursos, IA tutora, clasificación pública global, equipos, múltiples idiomas, app móvil nativa, funciones SQL avanzadas y generación automática de preguntas.

## Documentos y precedencia

| Documento | Responsabilidad |
|---|---|
| [CONTENT_MAP.md](CONTENT_MAP.md) | Lecciones, escenas, fuentes y guiones de vídeo. |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Identidad, componentes, legibilidad y accesibilidad. |
| [UX_FLOWS.md](UX_FLOWS.md) | Rutas, recorridos, estados y recuperación. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Capas, servicios, tecnologías y límites de confianza. |
| [LAB_SPEC.md](LAB_SPEC.md) | Subconjunto SQL, ejecución Oracle y evaluación. |
| [GAME_SPEC.md](GAME_SPEC.md) | Misiones, puntuación, pistas y métricas. |
| [REALTIME_SPEC.md](REALTIME_SPEC.md) | Estados de sala, tiempo y sincronización. |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Datos educativos, persistencia e integridad. |
| [TEST_PLAN.md](TEST_PLAN.md) | Matriz de pruebas y salida a producción. |
| [ROADMAP.md](ROADMAP.md) | Dependencias, hitos y entregables. |

En conflictos: este archivo gobierna alcance; DATABASE_SCHEMA gobierna dataset; LAB_SPEC gobierna semántica y ejecución; GAME_SPEC gobierna puntuación; REALTIME_SPEC gobierna tiempo y estado. Un cambio de esas reglas debe reflejarse en las pruebas antes de implementarse.
