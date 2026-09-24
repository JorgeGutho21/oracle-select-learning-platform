# ROADMAP — Implementación por hitos

Versión 1.0 · Plan sin programación ni despliegue en esta entrega.

## Enfoque

Construir una unidad completa sobre SELECT antes de abrir temas futuros. Validar temprano el laboratorio Oracle, porque es una dependencia real que una web estática no resuelve. Incorporar la sala después de tener contenido y evaluación consistentes, pero diseñar sus contratos desde el inicio.

No se asignan fechas inventadas: no se confirmó duración exacta de exposición, fecha de entrega ni disponibilidad de servidor Oracle. Los hitos tienen dependencias y condiciones de salida verificables. El responsable del proyecto es Jorge Gutierrez Thomas; roles técnicos y revisión académica se asignarán al iniciar implementación.

## Hitos

| Hito | Trabajo y entregables futuros | Dependencias | Puerta de salida |
|---|---|---|---|
| R0 — Especificación | Los once documentos solicitados, mapa de fuentes, dataset, alcance, misiones y criterios de aceptación. | PowerPoint, juego y referencias recuperadas. | Nombres correctos de los once archivos, enlaces internos válidos y reglas coherentes. Entrega documental actual. |
| R1 — Viabilidad Oracle y datos | Selección de instancia Oracle y alojamiento del servicio, fijación de versiones, carga administrativa de dataset, permisos lectores y primera ejecución integrada de prueba. | R0. Disponibilidad de infraestructura y credenciales de quien la administre. | LAB01–LAB10 correctos en Oracle objetivo; aislamiento probado; estimación de recursos/costos documentada. Si no hay Oracle, este hito sigue pendiente. |
| R2 — Base visual y navegación | Rutas, estructura por capas, tokens, componentes accesibles, Home, índice, buscador y modo Exposición. | R0; puede avanzarse mientras se resuelve R1. | T01–T04 y D01–D08 en recorridos construidos; versión móvil y proyección legibles. |
| R3 — Contenido y laboratorio | L00–L08, las dieciséis escenas de Exposición, tablas, traducción, anatomía, editor y ejecución segura con errores pedagógicos. | R1 y R2. | C01–C05, T06–T08 y LAB11–LAB16 verificados. Mismo dataset en todos los ejemplos. |
| R4 — Challenge individual | Diez misiones, construcción, predicción, reparación, reto escrito, pista, intentos, cronómetro y resultado local. | R3. | T09–T13 y G01–G15 en modo individual; ninguna misión necesita temas futuros. |
| R5 — Vídeos y recursos | Producción de V01 y V02, revisión de narración y subtítulos, transcripciones, chuleta imprimible y catálogo futuro. | Contenido de R3 congelado; puede ejecutarse junto con R4. | T05 y T18; vídeos usan datos y términos canónicos y duraciones acordadas. |
| R6 — Persistencia y sala | Auth docente/anónima, esquema de aplicación, RLS, QR, inscripciones, rondas, corrección en servidor, ranking y estadísticas. | R4 y contratos de R1; no exige duplicar motores de corrección. | T14–T17, DB01–DB07 y R01–R11; 60 inscritos sin pérdidas, tiempo autoritativo e idempotencia. |
| R7 — Validación y ensayo | Seguridad, accesibilidad, carga, restauración, recuperación de cortes y ensayo completo de exposición. | R5 y R6. | TEST_PLAN completo, sin bloqueos críticos; prueba en teléfonos y proyector del contexto real. |
| R8 — Publicación funcional | Publicación de web, API, servicio Oracle, configuración de canales, dominio/QR definitivo y verificación de recursos. | R7 y acceso al alojamiento seleccionado. | Recorrido completo desde enlace público con estudiante nuevo; SQL real, vídeos y diez rondas operativos. |

Estado de R5 (Fase 6): chuleta imprimible, catálogo `/modules` e infraestructura de video terminados; la producción de V01 y V02 sigue pendiente.

Estado de R6 (Fase 7): sala en vivo 1.1 a ritmo propio implementada (esquema, RLS, QR, inscripciones, corrección y puntos en servidor, ranking y estadísticas), verificada en memoria y en PostgreSQL embebido. Pendientes: validación en un proyecto Supabase remoto, ensayo de 60 inscritos (R10) y, para una versión posterior, rondas guiadas, pausa y cuenta docente ([REALTIME_SPEC](REALTIME_SPEC.md) 1.1).

R0 está entregado al producir estos archivos. R1–R8 son trabajo futuro, no iniciado por esta solicitud. Las puertas de calidad no implican pedir aprobación para cada actividad rutinaria; describen qué evidencia debe existir antes de avanzar.

## Decisiones y dependencias pendientes concretas

| Tema | Decisión por defecto en documentos | Qué falta antes de implementar/publicar |
|---|---|---|
| Oracle real | Servicio aislado con cuenta lectora y sintaxis compatible con 19c. | Instancia disponible, versión exacta, red, driver y alojamiento; no presumir acceso desde Vercel. |
| Datos divergentes | F1 diapositiva 6 prevalece; seis columnas, María 30, Jorge 22/Sistemas. | Aplicar esa versión al adaptar el juego y validar resultados; sin mezclar datos del Artifact. |
| Juego existente | Conservar identidad, diez posiciones y mecánicas; sustituir temas fuera del alcance. | Si se reutiliza código, obtener exportación y auditarlo. No bloquea una implementación propia de la especificación. |
| Identidad universitaria | Confirmada: Jorge Gutierrez Thomas; profesor Amilkar Sierra; Base de Datos; Ingeniería de Sistemas; Universidad Popular del Cesar. Logotipo del sitio institucional adaggio.unicesar.edu.co. | Confirmar el permiso de uso del logotipo con la universidad antes de una publicación abierta. |
| Duración de la exposición | Núcleo de unos 20 minutos y Challenge con 15 minutos de respuestas. | Ajustar guion al tiempo asignado; la ruta de estudio conserva contenido completo. |
| Vídeos | Introducción 90–120 s y resumen 3–4 min. | Producir, revisar, alojar y aportar URLs/activos definitivos. |
| Capacidad | 60 estudiantes por sala, prueba adicional a 75 conexiones. | Medición real de cuotas, latencias y recursos del alojamiento. |
| Versiones de dependencias | Stack propuesto en ARCHITECTURE. | Verificar versiones soportadas y compatibilidad en R1–R2; fijarlas antes de desarrollar. |

## Riesgos y mitigación incorporada

| Riesgo | Consecuencia | Medida y evidencia de cierre |
|---|---|---|
| Oracle no está disponible o es inaccesible desde el servicio | El laboratorio no cumple el requisito de ejecución real. | Resolver en R1; prueba extremo a extremo. No renombrar un simulador como Oracle. |
| Dataset cambia entre tabla, vídeo y misiones | Resultados contradictorios y evaluación injusta. | Versión y huella únicas; comparaciones C02/C04/DB01. |
| Puntuación o reloj confiados al navegador | Ranking inconsistente o manipulable. | Autoridad de servidor, transacciones e idempotencia; SEC03, INT03/04 y RT01/02. |
| Realtime pierde notificaciones | Participantes muestran rondas diferentes. | Snapshots con revisión y recuperación; RT04 y prueba de desconexión. |
| SQL arbitrario alcanza Oracle | Exposición del servicio o consultas no previstas. | Árbol de sintaxis con lista positiva, usuario lector, límites y aislamiento; SEC01/02. |
| Las últimas misiones vuelven a ser selección trivial | No demuestran comprensión. | Construcción, reparación y SQL escrito con rúbricas G07–G10. |
| Interfaz demasiado oscura o pequeñas tablas | Lectura difícil en proyección y móvil. | Superficies claras, tamaños de texto y pruebas D05/D06. |
| Vídeos incluyen filtros o datos distintos | Se desborda el alcance o aparecen contradicciones. | Producir después de congelar contenido y revisar contra CONTENT_MAP. |
| Falla Internet en la clase | Sala y laboratorio quedan temporalmente fuera de servicio. | Mensajes y recuperación definidos; las explicaciones ya cargadas permiten continuar. No se promete ejecución offline. |

## Extensión posterior al lanzamiento

Solo después de aprobar la unidad SELECT: módulo de filtros y comparaciones; módulo de BETWEEN/IN/LIKE; lógica y NULL; ORDER BY; luego JOIN y agrupaciones. Cada unidad debe añadir contenidos, dataset si cambia, rúbricas, reglas permitidas del laboratorio y pruebas correspondientes. No basta habilitar una palabra clave en el analizador.

Los niveles originales de filtros, LIKE, lógica, NULL y ORDER BY son material de partida para esas unidades, pendientes de revisión. Mantener nombres/versiones para no cambiar resultados históricos de SELECT. Las fichas futuras ya previstas no suponen compromiso de fecha ni implementación anticipada.

## Definición de terminado

**Documentación actual:** exactamente PROJECT_SPEC.md, CONTENT_MAP.md, DESIGN_SYSTEM.md, UX_FLOWS.md, ARCHITECTURE.md, LAB_SPEC.md, GAME_SPEC.md, REALTIME_SPEC.md, DATABASE_SCHEMA.md, TEST_PLAN.md y ROADMAP.md; fuentes identificadas, decisiones diferenciadas de observaciones, ejemplos y criterios verificables; sin código de plataforma ni cambios a los originales.

**Producto futuro:** todos los módulos obligatorios operativos, datos y Oracle comprobados, vídeos publicados, diez misiones accesibles, sala probada con carga objetivo, ranking y estadísticas consistentes, criterios de TEST_PLAN superados y ningún tema futuro convertido en dependencia del recorrido actual.
