# GAME_SPEC — SQL Oracle Challenge

Versión 2.0 · Diez misiones · Dataset `empleados-select-v1` · Catálogo `select-challenge-v2`.

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

- Pedido: «Muéstrame solamente nombre y salario». L01, L04. Fácil; 45 s.
- Acción: arrastrar columnas de EMPLEADOS a la lista de SELECT, o pulsarlas; reordenar con arrastre o botones.
- Solución: `SELECT nombre, salario FROM empleados;`.
- Aceptación G01: resultado con NOMBRE y SALARIO en ese orden y seis filas. Incluir ID, * u otras columnas no cumple el pedido.
- Pista: el pedido menciona dos datos; el orden de la lista es el orden de las columnas. Feedback: las columnas restantes siguen en la tabla.

### M02 — El orden de SQL

- Pedido: «Muéstrame el nombre y la ciudad de cada empleado». L02, L04. Fácil; 60 s.
- Acción: ordenar todas las piezas SELECT, nombre, coma, ciudad, FROM y empleados. Terminador opcional.
- Solución: `SELECT nombre, ciudad FROM empleados;`.
- Aceptación G02: se evalúa el resultado de la consulta armada; columnas invertidas, una columna después de FROM o piezas sin usar no cumplen.
- Pista: primero qué mostrar, después de dónde. Feedback: FROM recibe el nombre de la tabla, no una columna.

### M03 — ¿Qué trae el asterisco?

- Pedido: «Muéstrame todo lo que guarda la tabla EMPLEADOS». L03. Fácil; 60 s.
- Acción: construir los seis encabezados del resultado de `SELECT * FROM empleados;` en orden e introducir el número de filas.
- Solución: ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO; seis filas.
- Aceptación G03: los seis encabezados en el orden del esquema y el número 6. No se interpreta * como una columna.
- Pista: observa el esquema completo. Feedback: * expande todas las columnas visibles del dataset.

### M04 — Predice el resultado

- Pedido: «¿Qué tabla devuelve esta consulta?» sobre `SELECT nombre, salario FROM empleados;`. L01, L04. Media; 75 s.
- Acción: construir los encabezados del resultado y marcar en la tabla fuente qué empleados aparecen.
- Solución: NOMBRE, SALARIO y los seis empleados.
- Aceptación G04: encabezados en el orden de SELECT y las seis filas. Omitir empleados es incorrecto porque la proyección no filtra filas.
- Pista: la consulta elige columnas, no filas. Feedback: sin una condición de filtro se devuelven todas las filas.

### M05 — Columnas calculadas

- Pedido: «Muéstrame el salario mensual de cada empleado y cuánto gana al año», sobre `SELECT nombre, salario, ▢ FROM empleados;`. L05. Media; 90 s.
- Acción: construir la tercera columna con piezas reutilizables (salario, edad, 12, 100, *, +) y escribir el valor calculado para Ana, Pedro y María.
- Solución: `salario * 12` (también `12 * salario`); Ana 36000000, Pedro 21600000, María 44400000.
- Aceptación G05: expresión equivalente evaluada sobre las seis filas, basada en SALARIO, y los tres valores exactos. `salario + 12` o `salario * 100` no cumplen.
- Pista: un año tiene doce meses. Feedback: señala el empleado cuyo valor es incorrecto; la columna SALARIO no cambia.

### M06 — Encabezados con AS

- Pedido: «Muestra el nombre y el salario anual con el encabezado SALARIO_ANUAL». L06. Media; 90 s.
- Acción: ordenar las piezas, incluido `AS salario_anual`. La interfaz muestra los encabezados del resultado junto a las columnas intactas de EMPLEADOS.
- Solución: `SELECT nombre, salario * 12 AS salario_anual FROM empleados;`.
- Aceptación G06: alias asociado a la expresión, no a NOMBRE ni a EMPLEADOS; resultado anual intacto. La misión exige AS explícito y lo anuncia.
- Pista: la etiqueta va después de aquello que describe. Feedback: AS cambia el encabezado mostrado, no la tabla.

### M07 — Valores únicos con DISTINCT

- Pedido: «¿En qué ciudades hay empleados? Sin repetir ninguna». L07. Media; 90 s.
- Acción: partir de las seis filas de `SELECT ciudad FROM empleados;` (antes) y retirar repeticiones hasta obtener el resultado de `SELECT DISTINCT ciudad FROM empleados;` (después).
- Solución: Bogotá, Cali y Medellín, una vez cada una.
- Aceptación G07: multiconjunto exacto de tres ciudades; cualquier fila conservada de cada ciudad es válida. Dejar repeticiones o eliminar una ciudad por completo no cumple.
- Pista: cada ciudad debe aparecer una vez. Feedback: DISTINCT conserva un ejemplar de cada valor.

### M08 — Detecta el error

- Pedido: «Muéstrame el nombre y el salario de cada empleado», con la consulta `SELECT nombre salario FROM empleados;`. L04, L06. Difícil; 90 s.
- Acción: seleccionar en la consulta el hueco donde falta la coma (hotspot); no se ofrecen opciones de respuesta.
- Solución: coma entre nombre y salario.
- Aceptación G08: la consulta reparada devuelve NOMBRE y SALARIO. Conforme a LAB10, la consulta original es SQL válido: sin coma, SALARIO es un alias implícito de NOMBRE. El feedback describe un incumplimiento del pedido, no un error de sintaxis.
- Pista: cuenta cuántas columnas pide el pedido y cuántas separa la lista. Feedback: explica el alias implícito.

### M09 — Del lenguaje al SQL

- Pedido: «Muéstrame el nombre, ciudad y salario de todos los empleados». L02, L04, L08. Difícil; 120 s.
- Acción: construir la consulta con bloques, entre ellos distractores (edad, depto, *, DISTINCT) y dos comas intercambiables.
- Solución de referencia: `SELECT nombre, ciudad, salario FROM empleados;`.
- Aceptación G09: se analiza la estructura de los bloques y se compara su resultado; no se compara una cadena exacta. DISTINCT se rechaza porque el pedido dice «todos los empleados»; una coma ausente se explica como alias implícito.
- Pista: cada dato mencionado es una columna, en ese orden. Feedback: columnas de más, faltantes o desordenadas.

### M10 — Final Boss: Query Master

- Objetivo: escribir una consulta completa desde un pedido. L01–L08. Difícil; 180 s.
- Enunciado: «Para cada empleado, muestra NOMBRE, CIUDAD y su salario anual proyectado tras aumentar 100000 al salario mensual. Usa AS para llamar PROYECCION_ANUAL a la tercera columna. Conserva a todos los empleados y ese orden de columnas».
- Acción: editor vacío, sin bloques ni solución inicial. Enviar para evaluar ejecuta realmente en Oracle. La rúbrica anuncia AS y una expresión basada en SALARIO.
- Solución de referencia: `SELECT nombre, ciudad, (salario + 100000) * 12 AS proyeccion_anual FROM empleados;`.
- Resultado: Ana 37200000; Carlos 61200000; Laura 51600000; Pedro 22800000; María 45600000; Jorge 34800000, con su ciudad respectiva.
- Aceptación G10: seis filas, tres columnas en el orden requerido, encabezado PROYECCION_ANUAL y valores correctos; AS explícito y cálculo que referencia SALARIO. Expresiones equivalentes se aceptan. No se requiere DISTINCT porque este pedido no busca eliminar duplicados.
- Pista: calcula primero el nuevo salario mensual. Feedback: explica proyección, origen, cálculo y etiqueta; remite a la lección del error encontrado.

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

## Estadísticas y feedback

Para cada misión: participantes inscritos al comenzar la sala; personas que enviaron al menos un intento académico; personas que acertaron; aciertos al primer intento; respuestas fallidas; solicitudes de pista; no respuestas; tiempo medio hasta acierto entre quienes acertaron. Mostrar el denominador de cada tasa.

Tasa de acierto por misión = personas que acertaron / participantes del grupo fijado al iniciar. Tasa al primer intento usa el mismo denominador. «Sin respuesta» significa cero intentos académicos recibidos. «Pendiente técnico» se muestra por separado hasta resolver una incidencia. El tiempo medio sin aciertos se presenta como «Sin datos», no cero.

Promedio de puntos de sala = suma de totales / número de participantes del grupo. El dominio orientativo de un concepto usa misiones relacionadas con él y declara esa relación; no equivale a una nota institucional. Mostrar la misión más difícil según menor tasa de acierto, con empates explícitos.

Aceptación G11: la tabla de puntuación anterior y sus combinaciones se verifican sin redondeos. G12: 10 aciertos iniciales dan 1000 y no se acumulan al reenviar. G13: empate completo produce posición compartida. G14: toda misión permite teclado y toque sin arrastre. G15: las soluciones completas solo aparecen cuando ya no existe oportunidad puntuada de responder o cuando el presentador cierra la ronda.
