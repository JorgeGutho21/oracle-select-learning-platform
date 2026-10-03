# GAME_SPEC — SQL Oracle Challenge

Versión 4 · Diez misiones · Dataset `empleados-select-v2` · Catálogo `select-challenge-v4`.

La versión 4 (27 de septiembre de 2026) rediseña el modelo pedagógico de las diez misiones sin tocar la puntuación, los intentos, las pistas, los tiempos base, la sala en vivo ni el ranking. Cada misión razona sobre una **muestra de trabajo** de EMPLEADOS —como mucho 8 registros y 3–4 columnas relevantes (5 solo si hace falta)— que se muestra siempre como tabla real; el dataset completo (20 × 12) es una consulta secundaria en un diálogo («Consultar dataset EMPLEADOS completo») y la misión se resuelve sin abrirlo. Las misiones piden observar, predecir, construir, comparar, corregir y justificar; no hay preguntas de opción única. El feedback de una respuesta incorrecta indica el **tipo de error**, **qué está bien**, **qué debes revisar** y una pista conceptual (primer intento) o localizada (segundo); nunca revela la solución completa. Nuevo tipo de error: concepto. Las partidas guardadas con `select-challenge-v3` se descartan.

La versión 3.1 (26 de septiembre de 2026) da al Challenge su propia densidad de datos y un feedback pedagógico. Cada misión muestra el pedido, el concepto clave de la fuente canónica y los «datos necesarios» (4–7 columnas y pocas filas); la tabla EMPLEADOS completa queda como consulta secundaria («Ver tabla completa») y nunca se pide desplazar una tabla horizontalmente. M01 (versión 3) ofrece 7 columnas; M04 (versión 4) se resuelve sobre una muestra de 10 registros que contiene a los 5 empleados de Cali y 5 de otras ciudades, así que la respuesta no depende de filas ocultas. Una respuesta incorrecta indica su tipo (sintaxis, semántica, orden, columna, condición, operador, resultado o alcance educativo), qué está bien y qué necesita ajuste, y una orientación progresiva: conceptual en el primer intento y localizada después; la pista con descuento no cambia. Un acierto explica por qué es correcto. La puntuación, los intentos, el tiempo, la sala en vivo y el ranking no cambian. El punto y coma sigue siendo opcional.

La versión 3 (25 de septiembre de 2026) acompaña la unidad ampliada con WHERE y ORDER BY y el dataset de 20 filas. Se conservan las diez posiciones, los tipos de interacción, la puntuación, los intentos, las pistas, el tiempo, la sala en vivo y el ranking. Cambian el contenido y la versión de M02, M04, M05, M07, M09 y M10. M01, M03, M06 y M08 conservan su pedido; se ajustaron sus datos (12 columnas, 20 filas). La partida guardada con una versión anterior de una misión se descarta.

La versión 2 (23 de septiembre de 2026) redefine M01–M09 por decisión del responsable del proyecto: pedidos en lenguaje natural, SELECT *, predicción de resultado, columna calculada, alias, DISTINCT sobre una columna, detección de una coma ausente y traducción de un pedido a bloques. M10, la puntuación, el tiempo y las estadísticas no cambian. Las partidas guardadas con la versión 1 se descartan.

## Continuidad con el juego existente

Se verificó el mapa público del [juego del usuario](https://claude.ai/artifact/WN1sTa6YEJfuPysmX64qtv) y se abrió SELECT Visual. El mapa contiene los siguientes niveles. Las interacciones internas de los niveles bloqueados no se dan por auditadas.

| Nivel original observado | Adaptación para la unidad SELECT |
|---|---|
| 01 SELECT Visual, 100 XP | Conservar selección de columnas mediante arrastre y ejecución. M01. |
| 02 Constructor de Consultas, 150 XP | Conservar reconstrucción de piezas; limitar a SELECT/FROM. M02. |
| 03 Filtro WHERE, 150 XP | Reservar el nivel de filtros para futuro; posición actual dedicada a interpretar *. M03. |
| 04 BETWEEN + IN, 200 XP | Reservar rangos/listas; posición actual dedicada a predecir una proyección. M04. |
| 05 LIKE Lab, 200 XP | Reservar patrones; posición actual dedicada a cálculos. M05. |
| 06 Logic Lab, 250 XP | Reservar lógica; posición actual dedicada a alias. M06. |
| 07 NULL Detective, 250 XP | Reservar NULL; posición actual dedicada a DISTINCT. M07. |
| 08 Debug Terminal, 300 XP | Conservar diagnóstico y reparación, solo con conceptos actuales. M08. |
| 09 ORDER BY Data Race, 300 XP | Reservar ordenamiento de filas; reconstruir una consulta con DISTINCT y alias. M09. |
| 10 Final Boss: Query Master, 500 XP | Conservar reto integrador; exigir escribir SQL y razonar sobre cálculos. M10. |

La tabla anterior describe la adaptación de la versión 1; las misiones vigentes son las de la versión 2 descritas abajo. Se conserva nombre, identidad azul/cian, tabla EMPLEADOS, mapa, progresión y diez posiciones. Se adapta el temario y aumenta la exigencia de construcción. Los valores de XP originales se reemplazan por una escala uniforme de 100 puntos por misión para que el resultado sea interpretable sobre 1000. No se copia ni se supone reutilizable el código del Artifact.

## Estructura de una misión

Definición versionada: ID, versión, título, objetivo, lecciones relacionadas, dificultad, tipo de interacción, enunciado, piezas o datos visibles, rúbrica privada, pista, explicación final y duración base. El servidor no entrega soluciones a una ronda abierta.

Tipos mínimos: seleccionar columnas; ordenar piezas; construir resultado; construir expresión; asignar alias; localizar y reparar error; escribir consulta. Una misión puede combinar dos acciones de un mismo tipo de evaluación sin crear otro motor de juego.

## Misiones y soluciones de referencia

Las duraciones corresponden a la sala con perfil estándar. Estudio no impone límite. En todas las tablas de resultados se ignora el orden de filas y se conserva el orden de columnas. Las misiones de piezas se corrigen analizando la consulta construida y comparando su resultado lógico sobre el dataset canónico; esa comparación didáctica no se presenta como ejecución en Oracle.

### M01 — Columnas a la vista (versión 4)

- Pedido: «Recursos Humanos necesita una lista para contactar a los empleados: el nombre, la ciudad y el correo, en ese orden. No debe aparecer información salarial». L02, L05. Fácil; 45 s.
- Muestra: 6 registros × NOMBRE, CIUDAD, SALARIO, CORREO. Paleta de 8 columnas (ID_EMPLEADO, NOMBRE, APELLIDO, CARGO, CIUDAD, SALARIO, BONO, CORREO).
- Acción: arrastrar o tocar columnas hacia la lista de SELECT y ordenarlas. El resultado se calcula en vivo sobre las mismas 6 filas, con «Qué cambió: filas sin cambios · columnas 12 → N».
- Solución: `SELECT nombre, ciudad, correo FROM empleados;`.
- Feedback: SALARIO o BONO → información salarial excluida; columnas de más o que faltan («Seleccionaste NOMBRE y CIUDAD correctamente; el pedido también necesita CORREO»); orden («SELECT las devuelve en el mismo orden en que las escribes»). Acierto: «SELECT decide qué columnas aparecen; las filas siguen siendo las mismas porque todavía no usamos WHERE».

### M02 — El orden de SQL (versión 4)

- Pedido: «Para una lista de asistencia necesito el nombre y la ciudad de todos los empleados, sin quitar ninguno». L02, L03. Fácil; 60 s.
- Acción: construir con piezas SELECT, nombre, coma, ciudad, FROM, empleados y el terminador; sobran WHERE, DISTINCT y `*`. El resultado sobre la muestra se ve al formar una consulta válida.
- Solución: `SELECT nombre, ciudad FROM empleados;`.
- Feedback: WHERE sobra (no se descarta ninguna fila), DISTINCT sobra (no se quitan repetidas), `*` traería 12 columnas, FROM antes de SELECT, columnas invertidas.

### M03 — ¿Qué trae el asterisco? (versión 3)

- Pedido: «Necesito ver todo lo que guarda la tabla EMPLEADOS», con `SELECT * FROM empleados;`. L04. Fácil; 60 s.
- Datos: esquema compacto de 12 columnas con su tipo (3 × 4 en escritorio, por grupos en el móvil) y el total de 20 registros; no se muestran 240 celdas.
- Acción: indicar columnas y filas del resultado y clasificar cinco afirmaciones como «Lo hace» o «No lo hace»: aparece una columna llamada * (no), las columnas salen en el orden de la tabla (sí), descarta a los empleados con BONO en NULL (no), ordena por nombre (no), para ver solo NOMBRE y CIUDAD se cambia el * por esas columnas (sí).
- Solución: 12 columnas, 20 filas y la clasificación anterior. Comprueba tres ideas: * representa todas las columnas, SELECT controla las columnas y sin WHERE no se eliminan filas.
- Feedback: por cada afirmación mal clasificada, una pregunta que orienta sin dar la respuesta («¿Hay alguna condición WHERE que descarte filas?»).

### M04 — Predice las filas (versión 5)

- Pedido: «Necesitamos únicamente a los empleados de Cali», con `SELECT nombre, ciudad, salario FROM empleados ▢;`. L11, L12. Media; 75 s.
- Muestra: 8 registros × ID_EMPLEADO, NOMBRE, CIUDAD, SALARIO (IDs 1, 3, 4, 6, 11, 12, 16, 17: tres de Cali).
- Acción: paso 1, marcar en la tabla (casillas; toda la fila se puede tocar) las filas que cumplirán; paso 2, construir la condición con piezas (WHERE, ciudad, =, `'Cali'`; sobran `Cali` sin comillas, salario y >).
- Solución: Jorge, Valentina y Julián; `WHERE ciudad = 'Cali'`.
- Al acertar (o cerrar): ANTES, las 8 filas con las conservadas resaltadas y las descartadas atenuadas (✓/✗ con texto); DESPUÉS, el resultado de 3 filas, y «Filas 8 → 3 · Columnas 4 → 3». Feedback: «WHERE selecciona FILAS; SELECT selecciona COLUMNAS».
- Feedback de error: filas de más (se nombran), filas que faltan (sin nombrarlas), texto sin comillas, columna equivocada, WHERE ausente.

### M05 — Expresiones y precedencia (versión 4)

- Pedido: «Finanzas quiere el ingreso anual de cada empleado: cada mes recibe su salario más su bono, durante 12 meses», con `SELECT nombre, salario, bono, ▢ FROM empleados;`. L06, L07. Media; 90 s.
- Muestra: 4 registros × NOMBRE, SALARIO, BONO, sin BONO en NULL.
- Acción: paso 1, predecir para Ana `salario + bono * 12` y `(salario + bono) * 12`; paso 2, construir la expresión con piezas reutilizables (salario, bono, 12, +, *, paréntesis). Mientras se construye se ve el orden de cálculo («① bono * 12 ② salario + ①»), sin valores. Al cerrar, las dos columnas calculadas sobre la muestra.
- Solución: 19800000 y 118800000; `(salario + bono) * 12` o cualquier expresión equivalente.
- Feedback: sin paréntesis, * se calcula antes que +; falta el bono; predicción errónea con una pregunta sobre qué calcula Oracle primero.

### M06 — Encabezados con AS (versión 3)

- Pedido: «Muestra el nombre y el salario anual de cada empleado. El encabezado de la columna calculada debe ser SALARIO_ANUAL, escrito con AS». L08. Media; 90 s.
- Acción: construir con piezas (AS y `salario_anual` por separado; sobra `'salario_anual'` entre comillas simples). Se comparan dos tablas sobre la misma muestra: ANTES (sin AS, encabezado SALARIO*12) y DESPUÉS (tu consulta), con los mismos valores.
- Solución: `SELECT nombre, salario * 12 AS salario_anual FROM empleados;`.
- Feedback: comillas simples (un texto no es un nombre), alias sin AS, alias junto a NOMBRE o tras la tabla. Idea: AS no renombra la columna guardada ni cambia la tabla; solo cambia el encabezado del resultado.

### M07 — Valores únicos con DISTINCT (versión 4)

- Pedido: «¿En qué ciudades trabajan los analistas? Cada ciudad una sola vez», con `SELECT DISTINCT ciudad FROM empleados WHERE cargo = 'Analista';`. L10, L11. Media; 90 s.
- Muestra: los 6 analistas × NOMBRE, CIUDAD, DEPARTAMENTO.
- Acción: paso 1, marcar las ciudades del resultado entre las cinco de la tabla (Barranquilla y Valledupar no aparecen); paso 2, predecir cuántas filas devuelve `SELECT DISTINCT ciudad, departamento …`.
- Solución: Bogotá, Medellín y Cali; 6 pares (ningún par se repite).
- Al cerrar: ANTES con las repetidas marcadas → DISTINCT → DESPUÉS, con una columna y con el par.
- Feedback: valores que no están en las filas, ciudades que faltan, y que con dos columnas DISTINCT compara el par completo.

### M08 — Detecta el error (versión 3)

- Pedido: el de la variante. L05, L11, L16, L18. Difícil; 90 s.
- Variantes (una por partida, elegida por la sesión; estable al recargar): coma faltante (concepto), FROM faltante (sintaxis), texto sin comillas (semántica), doble coma (sintaxis), paréntesis sin cerrar (sintaxis), `= NULL` (concepto), IN sin paréntesis (sintaxis) y DISTINCT mal ubicado (sintaxis).
- Acción: paso 1, clasificar el error (sintaxis: Oracle no puede leerla; semántica: nombra algo que no existe; concepto: se ejecuta pero no hace lo pedido); paso 2, tocar la parte de la consulta donde está; paso 3, escribir la consulta corregida. «Probar la corrección» revisa sin puntuar y muestra hasta 6 filas.
- Aceptación G08: tipo correcto, pieza dentro de la zona del error y consulta corregida con el resultado pedido (se comparan valores, no el texto). Una corrección idéntica a la original no consume intento.
- Feedback: un tipo equivocado se orienta con preguntas, sin revelarlo; el acierto explica el tipo y por qué.

### M09 — Del lenguaje al SQL (versión 4)

- Pedido: «Muestra el nombre, la ciudad y el salario de los empleados de Bogotá o Cali que ganan al menos 4.200.000, del salario más alto al más bajo». L05, L12, L13, L16, L19. Difícil; 120 s.
- Muestra: 8 registros × NOMBRE, CIUDAD, SALARIO (incluye a Andrés, que gana exactamente 4.200.000).
- Acción: construir con 24 bloques de nivel token (varios sobran: OR, >, ASC, DISTINCT). No se adelanta el resultado; al cerrar se ve sobre la muestra.
- Solución de referencia: `SELECT nombre, ciudad, salario FROM empleados WHERE ciudad IN ('Bogotá', 'Cali') AND salario >= 4200000 ORDER BY salario DESC;` (7 filas). Se acepta cualquier consulta con el mismo resultado y el mismo orden.
- Feedback: OR en lugar de AND (sobran filas), > en lugar de >= (falta quien gana el límite), sin WHERE, sin ORDER BY, ASC, DISTINCT.

### M10 — Final Boss: Query Master (versión 3)

- Enunciado: «Para los empleados ACTIVOS de Bogotá o de Cali, muestra NOMBRE, CIUDAD y su salario anual si recibieran 100000 más cada mes, con el encabezado PROYECCION_ANUAL, de la proyección más alta a la más baja». L07, L08, L13, L14, L16, L19. Difícil; 180 s.
- Muestra: 8 registros × NOMBRE, CIUDAD, SALARIO, ESTADO (incluye a Oscar, de Cali e INACTIVO).
- Acción: editor CodeMirror vacío. «Revisar sintaxis» no puntúa; «Enviar para evaluar» ejecuta realmente en Oracle; nunca se simula.
- Solución de referencia: `SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad IN ('Bogotá', 'Cali') ORDER BY proyeccion_anual DESC;` (10 filas, de Ana 109200000 a Felipe 26400000).
- Aceptación G10: la salida real de Oracle con las 10 filas, las tres columnas, el encabezado PROYECCION_ANUAL, los valores y el orden descendente. Se aceptan formas equivalentes (OR entre paréntesis, `12 * (100000 + salario)`, `ORDER BY 3 DESC`). `estado = 'ACTIVO' AND ciudad = 'Bogotá' OR ciudad = 'Cali'` devuelve 11 filas (entra Oscar) y el feedback recuerda que AND se evalúa antes que OR.

## Intentos, pistas y puntaje

Cada misión tiene dos intentos académicos puntuados y una pista opcional. Una respuesta correcta cierra la misión para ese participante. Fallar dos veces o vencer el tiempo cierra con cero puntos; en práctica individual permite continuar ensayando sin puntos. Una respuesta correcta no se puede reemplazar para conseguir otro premio.

Fórmula normativa, aplicada solo al primer acierto: **puntos = 100 − 20 × (número de intento − 1) − 20 × pistas usadas**. Intento es 1 o 2; pistas, 0 o 1. Sin acierto: cero. No hay bonificación por rapidez.

| Situación | Puntos |
|---|---:|
| Acierto primero, sin pista | 100 |
| Acierto segundo, sin pista | 80 |
| Acierto primero, con pista | 80 |
| Acierto segundo, con pista | 60 |
| Dos errores, omitida o vencida sin acierto | 0 |

Total máximo 1000. La pista cuenta al ser entregada y confirmada por el servidor; pedirla dos veces con la misma solicitud no duplica descuento. No se puede solicitar una pista mientras hay evaluación pendiente o después de resolver. Errores de validación de la respuesta académica, como SQL incorrecto, sí consumen intento; errores de red, saturación o motor no disponible no lo consumen. El servidor identifica esos casos.

La práctica individual usa las mismas reglas con resultado guardado localmente y rotulado «Práctica». Ese resultado no es una calificación confiable del servidor y nunca se incorpora a la sala.

## Tiempo y ranking de sala

Tiempos base M01–M10: 45, 60, 60, 75, 90, 90, 90, 90, 120 y 180 segundos, total 900 segundos. Antes de abrir inscripciones el presentador elige estándar o ampliado ×2; el perfil queda fijo para toda la sala. Estudio ofrece práctica sin límite.

El servidor calcula tiempo activo desde el inicio hasta recibir la respuesta que obtiene el acierto, descontando pausas. Para una misión no resuelta asigna la duración activa total de la ronda. Esperar la corrección no aumenta el tiempo de una respuesta ya recibida.

Orden del ranking: puntos descendentes, luego número de misiones resueltas descendente y finalmente suma de tiempos activos ascendente. Si los tres valores coinciden, comparten posición; ordenar visualmente por alias no rompe el empate. Se usa ranking de competición: 1, 2, 3, 3, 5. Se muestran ranking y cambios de posición al cierre de cada ronda. No hay ranking global histórico.

Sala v1.1 a ritmo propio ([REALTIME_SPEC](REALTIME_SPEC.md) 1.1): sin rondas, el tercer criterio es el tiempo desde el inicio de la sala hasta el último acierto de cada participante, medido por el servidor. Puntos, intentos, pistas, orden y empates son los de esta especificación; el ranking se actualiza con cada intento evaluado en lugar de al cierre de ronda.

## Estadísticas y feedback

Para cada misión: participantes inscritos al comenzar la sala; personas que enviaron al menos un intento académico; personas que acertaron; aciertos al primer intento; respuestas fallidas; solicitudes de pista; no respuestas; tiempo medio hasta acierto entre quienes acertaron. Mostrar el denominador de cada tasa.

Tasa de acierto por misión = personas que acertaron / participantes del grupo fijado al iniciar. Tasa al primer intento usa el mismo denominador. «Sin respuesta» significa cero intentos académicos recibidos. «Pendiente técnico» se muestra por separado hasta resolver una incidencia. El tiempo medio sin aciertos se presenta como «Sin datos», no cero.

Promedio de puntos de sala = suma de totales / número de participantes del grupo. El dominio orientativo de un concepto usa misiones relacionadas con él y declara esa relación; no equivale a una nota institucional. Mostrar la misión más difícil según menor tasa de acierto, con empates explícitos.

Aceptación G11: la tabla de puntuación anterior y sus combinaciones se verifican sin redondeos. G12: 10 aciertos iniciales dan 1000 y no se acumulan al reenviar. G13: empate completo produce posición compartida. G14: toda misión permite teclado y toque sin arrastre. G15: las soluciones completas solo aparecen cuando ya no existe oportunidad puntuada de responder o cuando el presentador cierra la ronda.
