# CONTENT_MAP — Contenido y secuencia educativa

Versión 1.0 · Fuentes F1–F7 definidas en [PROJECT_SPEC.md](PROJECT_SPEC.md).

## Principio de enseñanza

Primero formular una necesidad cotidiana, después observar la tabla, leer la consulta, anticipar el resultado y comprobarlo. La animación ilustra una transformación lógica; no afirma mostrar el plan físico del optimizador de Oracle.

Cada lección contiene objetivo, explicación breve, ejemplo copiable, tabla fuente, resultado, traducción, error frecuente, interacción y comprobación. Se evita introducir terminología técnica antes de mostrar su significado.

## Mapa de lecciones

| ID y ruta de estudio | Objetivo y ejemplo | Fuentes primarias | Interacción, error y aceptación |
|---|---|---|---|
| L00 `/learn/introduccion` | SQL permite trabajar con bases de datos; hoy consultamos datos. Distinguir tabla, fila y columna. | F1: 3–4; F2: 2–3 | Señalar una fila, una columna y su encabezado. Completa al acertar los tres. Error: afirmar que todo SQL es solo lectura. |
| L01 `/learn/select` | Elegir qué mostrar: `SELECT nombre, salario FROM empleados;`. | F1: 4; F2: 4, 6 | Resaltar NOMBRE y SALARIO sin quitar empleados. Aceptación: seis filas y dos columnas; la fuente permanece igual. |
| L02 `/learn/from` | Identificar el origen EMPLEADOS; completar `SELECT nombre FROM empleados;`. | F1: 5; F2: 4 | Ubicar FROM y tabla después de la lista. Aceptación: orden sintáctico correcto y reconocimiento de tabla frente a columna. |
| L03 `/learn/asterisco` | `SELECT * FROM empleados;` muestra todas las columnas del dataset visible. | F1: 6; F2: 5 | Expandir * en los seis encabezados. Aceptación: seis columnas y seis filas. Error: interpretar * como multiplicación en esta posición. |
| L04 `/learn/columnas` | `SELECT ciudad, nombre FROM empleados;`; columnas separadas por coma y en el orden solicitado. | F1: 7; F2: 6 | Reordenar encabezados. Aceptación: CIUDAD antes de NOMBRE con seis filas. Error: creer que proyectar elimina filas duplicadas automáticamente. |
| L05 `/learn/expresiones` | `SELECT nombre, salario * 12 FROM empleados;`. Aritmética +, -, *, / y paréntesis. | F1: 8; F2: 8 | Completar salario anual y comparar `salario + 100000 * 12` con `(salario + 100000) * 12`. Aceptación para Ana: 4200000 frente a 37200000. |
| L06 `/learn/alias` | `SELECT nombre, salario * 12 AS salario_anual FROM empleados;`. | F1: 9; F2: 8 como motivación del cálculo | Asignar etiquetas a resultados. Aceptación: encabezado SALARIO_ANUAL, Ana 36000000 y fuente SALARIO intacta. Error: confundir alias con renombrar la columna almacenada. |
| L07 `/learn/distinct` | `SELECT DISTINCT ciudad FROM empleados;` y luego `SELECT DISTINCT ciudad, depto FROM empleados;`. | F1: 10; F2: 7 | Agrupar duplicados de la proyección. Aceptación: tres ciudades y cinco pares ciudad/depto. Error: eliminar por una sola columna cuando se seleccionan dos. |
| L08 `/learn/consulta-completa` | Traducir un pedido a `SELECT nombre, ciudad, salario * 12 AS salario_anual FROM empleados;`. | F1: 4, 7–9 y estrategia 26; F2: 17, 20, adaptadas | Construir sin piezas y explicar qué cambia en el resultado. Aceptación: seis filas, tres columnas en ese orden, alias correcto y valores anuales válidos. |

Tiempo orientativo de estudio: 45–60 minutos con prácticas. No se bloquean lecciones por orden. Se recomiendan L00–L08 secuencialmente, con revisión libre posterior.

## Dataset único y resultados de referencia

La tabla completa y tipos están en [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), dataset `empleados-select-v1`. Se adopta F1, diapositiva 6: María tiene 30 años; Jorge, 22 y departamento Sistemas. F2 y el juego muestran María 31, Jorge 29 y Ventas. Es una decisión editorial explícita a favor del PPT principal; no se mezclan versiones.

Se usan seis columnas: ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO. TELEFONO queda para una futura versión sobre NULL. La etiqueta Departamento puede acompañar a DEPTO, pero los ejemplos usan el identificador DEPTO. Importes numéricos en SQL sin separadores de miles; presentación visual en formato colombiano. Se conservan Bogotá, Medellín y María con sus tildes.

| Nombre | Salario mensual | Resultado de salario × 12 |
|---|---:|---:|
| Ana | 3000000 | 36000000 |
| Carlos | 5000000 | 60000000 |
| Laura | 4200000 | 50400000 |
| Pedro | 1800000 | 21600000 |
| María | 3700000 | 44400000 |
| Jorge | 2800000 | 33600000 |

DISTINCT CIUDAD produce Bogotá, Cali y Medellín. DISTINCT CIUDAD, DEPTO produce (Bogotá, Ventas), (Cali, Sistemas), (Bogotá, Sistemas), (Medellín, Ventas), (Cali, Contabilidad). Las listas aquí tienen orden expositivo; sin ORDER BY no se garantiza el orden de las filas. La evaluación compara filas sin depender de su posición y sí respeta el orden de columnas.

## Exposición E01–E14

Ruta `/presentation`; un identificador de escena permite volver al mismo punto. La exposición principal propuesta dura unos 20 minutos, sin contar el Challenge en vivo ni la discusión. Como no existe una duración exacta confirmada, se permite omitir vídeos o demostraciones sin alterar el contenido del modo Estudio.

| Escena | Contenido | Duración orientativa | Acción del expositor |
|---|---|---:|---|
| E01 | Portada, autor y objetivo | 0:30 | Explicar qué podrá hacer la clase. |
| E02 | Vídeo introductorio | 2:00 | Reproducir u omitir. |
| E03 | Tabla, fila, columna y SQL, L00 | 1:00 | Señalar un registro y un encabezado. |
| E04 | SELECT y FROM, L01–L02 | 2:00 | Traducir «qué» y «de dónde». |
| E05 | Asterisco, L03 | 1:00 | Expandir todas las columnas. |
| E06 | Columnas y su orden, L04 | 1:30 | Alternar la proyección manteniendo filas. |
| E07 | Expresiones, L05 | 2:00 | Calcular salario anual y comprobar Ana. |
| E08 | Alias, L06 | 1:30 | Cambiar encabezado, observar origen intacto. |
| E09 | DISTINCT, L07 | 2:00 | Contrastar duplicados de ciudades y pares. |
| E10 | Consulta completa, L08 | 2:00 | Resolver un pedido con la clase. |
| E11 | Laboratorio real | 2:00 | Ejecutar una variante escrita en directo. |
| E12 | Síntesis visual y acceso al vídeo resumen | 0:30 | Ofrecer repaso, sin reproducción forzada. |
| E13 | Entrada a sala mediante QR | 1:00 | Esperar conexiones e iniciar Challenge. |
| E14 | Resultados, chuleta y próximos módulos | Flexible | Revisar el concepto con menor acierto. |

Las diez rondas suman 15 minutos de respuesta con tiempos base, más transiciones y explicación. Una sesión completa requiere aproximadamente 40–45 minutos; es una planificación, no un dato confirmado del horario. El cronómetro de exposición, que puede pausarse, es independiente de la cuenta regresiva de sala.

## Vídeos

**V01 — Introducción, 90–120 segundos.** Guion de contenido: 0:00–0:20, una tabla de empleados y la necesidad de consultar; 0:20–0:45, qué es SQL y qué aprenderemos; 0:45–1:15, SELECT elige información y FROM indica el origen; 1:15–1:40, vista de columnas y un cálculo; cierre hasta 2:00, invitación a predecir resultados. No explicar filtros ni resolver las misiones finales.

**V02 — Resumen, 3–4 minutos.** Recapitular en este orden: SELECT/FROM; * frente a columnas; cálculo; alias; DISTINCT; lectura de una consulta completa. Usar exactamente `empleados-select-v1`. Terminar con una invitación al Challenge o al repaso, según el contexto de entrada. El vídeo debe poder verse después de la clase.

Ambos: voz en español, subtítulos revisados, transcripción accesible, imagen de portada, controles nativos y ningún autoplay con sonido. NotebookLM es la herramienta de producción sugerida por el usuario; revisar sus resultados contra este mapa. Vídeos alojados externamente, con enlace alternativo si falla la inserción. No están producidos en esta entrega.

## Chuleta

Una página web imprimible con significado, patrón y ejemplo para SELECT, FROM, *, lista de columnas, expresiones, AS y DISTINCT. Añadir las advertencias: SELECT no altera el dataset del laboratorio; AS cambia la etiqueta; DISTINCT compara la fila proyectada; no hay orden garantizado de filas sin una cláusula de ordenamiento. No incluir una pared de filtros futuros ni exigir descargar un PDF.

## Correcciones editoriales de las fuentes

| Evidencia | Tratamiento requerido |
|---|---|
| F1: 3; F2: 2, «SQL no modifica» | Precisar que las consultas SELECT permitidas aquí son de lectura. SQL también tiene operaciones de escritura. |
| F1: 5; F2: 4, consulta básica con tres partes | No enseñar WHERE como obligatorio. El núcleo actual consulta una tabla con SELECT y FROM. |
| F2: 4 y 17 contienen anotaciones con `//` | Pasarlas a texto explicativo fuera del editor. No enseñar `//` como comentario Oracle SQL. |
| F1: 6 frente a F2: 3 y juego | Resolver edades, DEPTO y TELEFONO conforme al dataset elegido; no extraer datos al azar de cada pantalla. |
| F1: 18 muestra a Ana como coincidencia de `A_` y luego lo niega | Registrar corrección para el módulo futuro: Ana tiene tres caracteres. No importar la diapositiva como contenido válido. |
| F1: 27 muestra inicialmente a Carlos aunque su teléfono es NULL | Mantener como advertencia editorial del módulo futuro, nunca como resultado de referencia actual. |
| F2: 11 repite SALARIO en el ejemplo BETWEEN | Corregir antes de reutilizar en una unidad posterior. |
| Sitio compañero presenta fases como orden físico y antepone DISTINCT a proyección | Tomar solo estructura didáctica. La visualización propia deduplica los valores proyectados y se identifica como modelo conceptual. |

Oracle documenta que AS es opcional para alias de columna y DISTINCT compara todas las expresiones seleccionadas. Enseñamos AS explícito por claridad, sin declarar inválido el alias implícito. [Referencia oficial](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html).

## Extensión futura y aceptación editorial

Catálogo futuro: filtros y comparaciones; rangos/listas/patrones; lógica y NULL; ordenamiento; JOIN; agrupaciones y subconsultas. Solo fichas de título, propósito y prerrequisito. No aparecen como lecciones incompletas del curso actual.

- C01: las nueve lecciones tienen objetivo, fuente, ejemplo, feedback y comprobación observable.
- C02: todos los ejemplos y resultados coinciden con el dataset canónico y el motor Oracle objetivo antes de publicar.
- C03: cero misiones obligatorias requieren cláusulas futuras.
- C04: vídeo, tabla interactiva, juego y chuleta muestran los mismos nombres, importes y resultados.
- C05: corregir errores de las fuentes no modifica sus archivos originales; el contenido de plataforma es una adaptación independiente.
