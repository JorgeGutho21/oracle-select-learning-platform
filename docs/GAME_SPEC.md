# GAME_SPEC — SQL Oracle Challenge

Versión 1.0 · Diez misiones · Dataset `empleados-select-v1`.

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

Se conserva nombre, identidad azul/cian, tabla EMPLEADOS, mapa, progresión y diez posiciones. Se adapta el temario y aumenta la exigencia de construcción. Los valores de XP originales se reemplazan por una escala uniforme de 100 puntos por misión para que el resultado sea interpretable sobre 1000. No se copia ni se supone reutilizable el código del Artifact.

## Estructura de una misión

Definición versionada: ID, versión, título, objetivo, lecciones relacionadas, dificultad, tipo de interacción, enunciado, piezas o datos visibles, rúbrica privada, pista, explicación final y duración base. El servidor no entrega soluciones a una ronda abierta.

Tipos mínimos: seleccionar columnas; ordenar piezas; construir resultado; construir expresión; asignar alias; localizar y reparar error; escribir consulta. Una misión puede combinar dos acciones de un mismo tipo de evaluación sin crear otro motor de juego.

## Misiones y soluciones de referencia

Las duraciones corresponden a la sala con perfil estándar. Estudio no impone límite. En todas las tablas de resultados se ignora el orden de filas y se conserva el orden de columnas.

### M01 — SELECT Visual

- Objetivo: escoger solo NOMBRE y SALARIO, en ese orden, sobre EMPLEADOS. L01, L04. Fácil; 45 s.
- Acción: arrastrar encabezados o seleccionar pieza y destino. Botón para ejecutar la construcción.
- Solución: `SELECT nombre, salario FROM empleados;`.
- Aceptación G01: lista exacta de dos columnas, seis empleados y Ana con 3000000. Incluir ID o * no cumple el pedido.
- Pista: el pedido menciona dos datos de cada empleado. Feedback: las columnas restantes siguen en la tabla fuente.

### M02 — Constructor de Consultas

- Objetivo: mostrar CIUDAD y después NOMBRE desde EMPLEADOS. L02, L04. Fácil; 60 s.
- Acción: ordenar piezas SELECT, ciudad, coma, nombre, FROM y empleados. Terminador opcional.
- Solución: `SELECT ciudad, nombre FROM empleados;`.
- Aceptación G02: orden de cláusulas y columnas correcto; no basta reunir todas las piezas sin ordenarlas.
- Pista: primero qué mostrar, después de dónde. Feedback: FROM recibe el nombre de la tabla, no una columna.

### M03 — ¿Qué devuelve el asterisco?

- Objetivo: interpretar `SELECT * FROM empleados;`. L03. Fácil; 60 s.
- Acción: construir los seis encabezados del resultado en orden e introducir el número de filas.
- Solución: ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO; seis filas.
- Aceptación G03: los seis encabezados y el número 6 son correctos. No se interpreta * como una columna llamada asterisco.
- Pista: observa el esquema, no cuentes solo las columnas más llamativas. Feedback: * expande todas las columnas visibles del dataset.

### M04 — Predice la proyección

- Objetivo: anticipar `SELECT ciudad FROM empleados;` sin eliminar repeticiones. L04. Media; 75 s.
- Acción: construir una columna de seis filas usando fichas Bogotá, Cali y Medellín repetibles.
- Solución: Bogotá tres veces, Cali dos y Medellín una; encabezado CIUDAD.
- Aceptación G04: multiconjunto exacto de seis valores. Tres ciudades únicas es incorrecto porque no se pidió DISTINCT.
- Pista: hay una fila de resultado por empleado. Feedback: elegir menos columnas no elimina duplicados.

### M05 — El cálculo correcto

- Objetivo: proyectar un salario anual después de sumar 100000 al salario mensual. L05. Media; 90 s.
- Acción: construir la expresión con SALARIO, 100000, 12, operadores y paréntesis; completar el resultado para Ana.
- Solución: `(salario + 100000) * 12`; Ana, 37200000. También es válida `12 * (salario + 100000)`.
- Aceptación G05: expresión equivalente y valor exacto. `salario + 100000 * 12` produce 4200000 para Ana y no cumple.
- Pista: el incremento también se aplica durante doce meses. Feedback: los paréntesis cambian la operación realizada primero.

### M06 — Encabezados con sentido

- Objetivo: nombrar una columna calculada SALARIO_ANUAL usando AS. L06. Media; 90 s.
- Acción: colocar el bloque `AS salario_anual` tras `salario * 12` y asignar la etiqueta al encabezado correcto de la vista previa.
- Solución: `SELECT nombre, salario * 12 AS salario_anual FROM empleados;`.
- Aceptación G06: alias asociado a la expresión, no a NOMBRE ni a EMPLEADOS; resultado anual intacto. Esta misión exige AS explícito y lo anuncia.
- Pista: la etiqueta va después de aquello que describe. Feedback: la columna original sigue llamándose SALARIO.

### M07 — DISTINCT sobre combinaciones

- Objetivo: comprender `SELECT DISTINCT ciudad, depto FROM empleados;`. L07. Media; 90 s.
- Acción: construir el resultado arrastrando pares completos de ciudad/departamento, retirando solo repeticiones idénticas.
- Solución: los cinco pares definidos en CONTENT_MAP. Bogotá/Sistemas aparece una vez aunque lo comparten Laura y Jorge.
- Aceptación G07: cinco pares exactos, sin reducir Bogotá a un único departamento. El orden no importa.
- Pista: compara toda la fila que saldrá, no únicamente CIUDAD. Feedback: dos filas con igual ciudad y diferente departamento son distintas.

### M08 — Debug Terminal

- Objetivo: localizar y reparar el error en `SELECT nombre, salario * 12 AS salario_anual, FROM empleados;`. L04–L06. Difícil; 90 s.
- Acción: seleccionar la coma sobrante y editar la consulta. Mostrar requisito: nombres y salario anual, sin columna adicional.
- Solución: retirar la coma inmediatamente anterior a FROM.
- Aceptación G08: localización correcta y consulta reparada con dos columnas y valores anuales. Borrar la expresión para hacer compilar la consulta no satisface el objetivo.
- Pista: una coma anuncia otro elemento de la lista. Feedback: distinguir consulta sintácticamente válida de consulta que cumple el pedido.

### M09 — Reconstrucción de un reporte

- Objetivo: obtener pares únicos de ciudad y departamento con etiquetas CIUDAD_ORIGEN y DEPARTAMENTO. L02, L06, L07. Difícil; 120 s.
- Acción: reconstruir piezas mezcladas y después introducir el número de filas esperado.
- Solución: `SELECT DISTINCT ciudad AS ciudad_origen, depto AS departamento FROM empleados;`; cinco filas.
- Aceptación G09: DISTINCT en lugar correcto, alias asociados a sus columnas, encabezados en el orden pedido y predicción 5.
- Pista: forma primero la lista de salida y después identifica cuáles filas son repetidas. Feedback: los alias no cambian la regla de comparación de valores.

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
