# GAME_SPEC — SQL Oracle Challenge

Versión 3.0 · Diez misiones · Dataset `empleados-select-v2` · Catálogo `select-challenge-v3`.

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

### M01 — Columnas a la vista

- Pedido: «Muéstrame solamente nombre y salario». L02, L05. Fácil; 45 s.
- Acción: arrastrar columnas de EMPLEADOS a la lista de SELECT, o pulsarlas; reordenar con arrastre o botones.
- Solución: `SELECT nombre, salario FROM empleados;`.
- Aceptación G01: resultado con NOMBRE y SALARIO en ese orden y 20 filas. Incluir ID_EMPLEADO, * u otras columnas no cumple el pedido.
- Pista: el pedido menciona dos datos; el orden de la lista es el orden de las columnas. Feedback: las columnas restantes siguen en la tabla.

### M02 — El orden de SQL

- Pedido: «Muéstrame el nombre y la ciudad de los empleados de TI». L03, L11. Fácil; 60 s. Versión 3.
- Acción: ordenar todas las piezas SELECT, nombre, coma, ciudad, FROM, empleados, WHERE y `departamento = 'TI'`. Terminador opcional.
- Solución: `SELECT nombre, ciudad FROM empleados WHERE departamento = 'TI';` (5 filas).
- Aceptación G02: se evalúa el resultado de la consulta armada; columnas invertidas, una columna después de FROM, WHERE antes de FROM o piezas sin usar no cumplen.
- Pista: primero qué mostrar (SELECT), después de dónde (FROM) y al final qué filas (WHERE).

### M03 — ¿Qué trae el asterisco?

- Pedido: «Muéstrame todo lo que guarda la tabla EMPLEADOS». L04. Fácil; 60 s.
- Acción: construir los 12 encabezados del resultado de `SELECT * FROM empleados;` en orden (entre las opciones hay un distractor `*`) e introducir el número de filas.
- Solución: ID_EMPLEADO, NOMBRE, APELLIDO, CARGO, DEPARTAMENTO, CIUDAD, SALARIO, BONO, FECHA_INGRESO, ESTADO, CORREO, ID_JEFE; 20 filas.
- Aceptación G03: los 12 encabezados en el orden del esquema y el número 20. No se interpreta * como una columna.
- Pista: observa el esquema completo. Feedback: * expande todas las columnas visibles del dataset.

### M04 — Predice las filas

- Pedido: «¿Qué tabla devuelve esta consulta?» sobre `SELECT nombre, salario FROM empleados WHERE ciudad = 'Cali';`. L11, L12. Media; 75 s. Versión 3.
- Acción: construir los encabezados del resultado y marcar en la tabla de origen (ID_EMPLEADO, NOMBRE, CIUDAD, SALARIO) qué empleados cumplen la condición.
- Solución: NOMBRE, SALARIO y los 5 empleados de Cali: Jorge, Oscar, Valentina, Camila y Julián.
- Aceptación G04: encabezados en el orden de SELECT (CIUDAD no se muestra aunque WHERE la use) y exactamente esas 5 filas. Marcar a alguien de otra ciudad o dejar fuera a alguien de Cali es incorrecto y el feedback lo nombra.
- Pista: WHERE conserva solo las filas cuya ciudad es Cali; SELECT decide qué columnas se ven.

### M05 — Columnas calculadas

- Pedido: «Muéstrame el salario mensual de cada empleado y cuánto gana al año», sobre `SELECT nombre, salario, ▢ FROM empleados;`. L05. Media; 90 s.
- Acción: construir la tercera columna con piezas reutilizables (salario, bono, 12, 100, *, +) y escribir el valor calculado para Ana, Sofía y Felipe. Versión 3.
- Solución: `salario * 12` (también `12 * salario`); Ana 108000000, Sofía 36000000, Felipe 25200000.
- Aceptación G05: expresión equivalente evaluada sobre las 20 filas, basada en SALARIO, y los tres valores exactos. `salario + 12`, `salario * 100` o `bono * 12` no cumplen.
- Pista: un año tiene doce meses. Feedback: señala el empleado cuyo valor es incorrecto; la columna SALARIO no cambia.

### M06 — Encabezados con AS

- Pedido: «Muestra el nombre y el salario anual con el encabezado SALARIO_ANUAL». L08. Media; 90 s.
- Acción: ordenar las piezas, incluido `AS salario_anual`. La interfaz muestra los encabezados del resultado junto a las columnas intactas de EMPLEADOS.
- Solución: `SELECT nombre, salario * 12 AS salario_anual FROM empleados;`.
- Aceptación G06: alias asociado a la expresión, no a NOMBRE ni a EMPLEADOS; resultado anual intacto. La misión exige AS explícito y lo anuncia.
- Pista: la etiqueta va después de aquello que describe. Feedback: AS cambia el encabezado mostrado, no la tabla.

### M07 — Valores únicos con DISTINCT

- Pedido: «¿Qué departamentos tienen empleados en Bogotá? Sin repetir ninguno». L10, L11. Media; 90 s. Versión 3.
- Acción: partir de las 7 filas de `SELECT departamento FROM empleados WHERE ciudad = 'Bogotá';` (antes) y retirar repeticiones hasta obtener el resultado de `SELECT DISTINCT departamento FROM empleados WHERE ciudad = 'Bogotá';` (después).
- Solución: Operaciones, TI, Recursos Humanos, Ventas y Finanzas, una vez cada uno.
- Aceptación G07: multiconjunto exacto de 5 departamentos; cualquier fila conservada de cada uno es válida. Dejar repeticiones o eliminar un departamento por completo no cumple.
- Pista: cada departamento debe aparecer una vez. Feedback: DISTINCT conserva un ejemplar de cada valor.

### M08 — Detecta el error

- Pedido: «Muéstrame el nombre y el salario de cada empleado», con la consulta `SELECT nombre salario FROM empleados;`. L05, L08. Difícil; 90 s.
- Acción: seleccionar en la consulta el hueco donde falta la coma (hotspot); no se ofrecen opciones de respuesta.
- Solución: coma entre nombre y salario.
- Aceptación G08: la consulta reparada devuelve NOMBRE y SALARIO. Conforme a LAB19, la consulta original es SQL válido: sin coma, SALARIO es un alias implícito de NOMBRE. El feedback describe un incumplimiento del pedido, no un error de sintaxis.
- Pista: cuenta cuántas columnas pide el pedido y cuántas separa la lista. Feedback: explica el alias implícito.

### M09 — Del lenguaje al SQL

- Pedido: «Muéstrame el nombre, la ciudad y el salario de todos los empleados, del salario más alto al más bajo». L05, L19. Difícil; 120 s. Versión 3.
- Acción: construir la consulta con bloques, entre ellos distractores (bono, *, DISTINCT, ASC), dos comas intercambiables y dos bloques `salario` (uno para la lista y otro para el orden).
- Solución de referencia: `SELECT nombre, ciudad, salario FROM empleados ORDER BY salario DESC;`.
- Aceptación G09: se analiza la estructura de los bloques y se compara su resultado y su orden (entre salarios empatados cualquier orden vale); no se compara una cadena exacta. DISTINCT se rechaza porque el pedido dice «todos los empleados». Sin ORDER BY el feedback explica que Oracle no garantiza el orden; con ASC, que el orden está invertido.
- Pista: cada dato mencionado es una columna, en ese orden; el orden de las filas se pide al final.

### M10 — Final Boss: Query Master

- Objetivo: escribir una consulta completa desde un pedido, con filtro, cálculo, alias y orden. L07, L08, L11, L13, L19, L20. Difícil; 180 s. Versión 2.
- Enunciado: «Para los empleados ACTIVOS de Bogotá, muestra NOMBRE, CARGO y su salario anual proyectado tras aumentar 100000 al salario mensual, con el encabezado PROYECCION_ANUAL, de la proyección más alta a la más baja».
- Acción: editor vacío, sin bloques ni solución inicial. «Revisar sintaxis» no puntúa; «Enviar para evaluar» ejecuta realmente en Oracle. La rúbrica anuncia WHERE, AS explícito, una expresión basada en SALARIO y ORDER BY.
- Solución de referencia: `SELECT nombre, cargo, (salario + 100000) * 12 AS proyeccion_anual FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' ORDER BY proyeccion_anual DESC;`.
- Resultado (6 filas): Ana 109200000, Carlos 91200000, Laura 70800000, Andrés 51600000, Mario 43200000 y Felipe 26400000, con su cargo.
- Aceptación G10: la salida real de Oracle tiene las 6 filas, las tres columnas en el orden requerido, el encabezado PROYECCION_ANUAL, los valores correctos y el orden descendente. Se aceptan expresiones, filtros y órdenes equivalentes (`12 * (100000 + salario)`, `ciudad IN ('Bogotá')`, `ORDER BY 3 DESC`). Con OR en lugar de AND o sin ORDER BY no cumple. Sin Oracle disponible no se simula la corrección: es un fallo técnico que no consume intento.
- Pista: filtra primero las filas (activos y de Bogotá), calcula el nuevo salario mensual antes de multiplicar por 12 y ordena por la proyección.

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
