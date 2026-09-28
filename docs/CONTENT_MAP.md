# CONTENT_MAP — Contenido y secuencia educativa

Versión 2.1 (26 de septiembre de 2026) · Reingeniería descrita en [CONTENT_REDESIGN_PLAN.md](CONTENT_REDESIGN_PLAN.md) · Refinamiento final en [FINAL_UX_PEDAGOGICAL_AUDIT.md](FINAL_UX_PEDAGOGICAL_AUDIT.md) · Fuentes F1–F7 en [PROJECT_SPEC.md](PROJECT_SPEC.md).

Este mapa separa dos cosas que la plataforma nunca mezcla:

- **Contenido actual (Nivel 1, SELECT fundamental):** 22 lecciones en 8 bloques, 30 escenas, laboratorio LAB01–LAB24 y Challenge M01–M10 (`select-challenge-v4`). Todo usa el dataset `empleados-select-v2`.
- **Próximos niveles (2 a 7):** 46 temas con ficha completa y estado «Próximamente». No tienen lecciones, ni escenas, ni misiones, ni cuentan en el progreso.

## Principio de enseñanza

Comprender → visualizar → predecir → consultar → equivocarse → recibir feedback → corregir → combinar conceptos → resolver problemas.

Cada idea sigue la misma cadena: **necesidad → concepto → definición → SQL → qué hace → cambio sobre los datos → resultado → idea clave**.

La definición de cada concepto es única. Está en `src/domain/concepts/sql-concepts.ts`, con 31 conceptos revisados contra Oracle 19c, y su categoría correcta: SELECT es una cláusula; AND, un operador lógico; BETWEEN, una condición; `%`, un comodín de LIKE. La Exposición, el Estudio, los Recursos y el buscador la muestran tal cual.

NULL se define como «ausencia de valor: no es cero ni el texto “NULL”». No se dice que no sea una cadena vacía, porque Oracle guarda `''` como NULL. Ese matiz se explica aparte, en la escena 18 y en la nota de Oracle. Las tablas, los recuentos y las respuestas de las comprobaciones no se escriben a mano: los calcula el motor educativo sobre el dataset canónico, y las pruebas de integración comprueban que Oracle real devuelve lo mismo. El recorrido «FROM, WHERE, SELECT, ORDER BY» se presenta como modelo lógico para entender la consulta, no como el plan físico del optimizador.

## Dataset único: `empleados-select-v2`

Una tabla EMPLEADOS de 12 columnas y 20 filas, definida en `src/domain/dataset/empleados.ts` y cargada en Oracle desde `oracle/empleados-select-v2.sql`. Una prueba unitaria exige que ambos coincidan fila a fila. El detalle de columnas, tipos y restricciones está en [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

Cada fila tiene un propósito pedagógico:

| Rasgo del dataset | Para qué concepto | Dato |
|---|---|---|
| 5 ciudades con repeticiones | DISTINCT, IN, WHERE | Bogotá 7, Cali 5, Medellín 5, Barranquilla 2, Valledupar 1 |
| 5 departamentos | DISTINCT, AND/OR | 16 combinaciones distintas de ciudad y departamento |
| Salarios en los límites de un rango | BETWEEN (límites incluidos) | María 6000000 y Sofía 3000000: `BETWEEN 3000000 AND 6000000` da 12 filas |
| Salarios empatados | ORDER BY con empates | Andrés y Paula 4200000; Mario y Ricardo 3500000 |
| BONO NULL y un BONO 0 | NULL frente a 0 | 6 filas con `bono IS NULL`; Mario tiene bono 0, que sí es un valor |
| Jefe NULL | IS NULL en otra columna | Ana (gerente general) y Esteban no tienen ID_JEFE |
| 3 empleados INACTIVO | AND, NOT | Oscar, Diego y Alicia |
| Fechas DATE entre 2012 y 2025 | comparaciones y BETWEEN con fechas | literales `DATE 'AAAA-MM-DD'` |
| Nombres con tildes y mayúsculas | comparación exacta de textos, LIKE | `'bogota'` no encuentra «Bogotá»; `'_o%'` da Rojas, Mora, Soto y Torres (Gómez y López no, porque ó no es o) |

Recuentos de referencia (verificados en Oracle local 23ai y Oracle Cloud 19c):

| Consulta | Filas |
|---|---:|
| `WHERE ciudad = 'Bogotá'` | 7 |
| `WHERE estado = 'ACTIVO'` | 17 |
| `WHERE salario BETWEEN 3000000 AND 6000000` | 12 |
| `WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')` | 17 |
| `WHERE nombre LIKE '%ar%'` / `'A%'` / `'%a'` | 6 / 3 / 10 |
| `WHERE bono IS NULL` / `bono = NULL` | 6 / 0 |
| `SELECT DISTINCT ciudad` / `DISTINCT ciudad, departamento` | 5 / 16 |
| `ciudad = 'Bogotá' OR ciudad = 'Medellín' AND salario > 5000000` | 9 |
| `(ciudad = 'Bogotá' OR ciudad = 'Medellín') AND salario > 5000000` | 6 |
| Consulta integradora (activos de Bogotá con salario entre 3 y 6 millones, del mayor al menor) | 3: Laura, Andrés, Mario |

Importes sin separadores en SQL y con formato colombiano en pantalla. Sin ORDER BY no se garantiza el orden de las filas: la evaluación compara filas sin depender de su posición, salvo cuando el pedido exige un orden.

## Modo Estudio: 22 lecciones en 8 bloques

Ruta `/learn`. Cada lección sigue la misma plantilla de 12 partes:

1. En una frase.
2. ¿Qué hace?
3. ¿Para qué sirve?
4. Sintaxis.
5. Cómo leerla en español.
6. Ejemplo: pregunta → SQL → lectura.
7. Tabla de origen.
8. Resultado.
9. Qué cambió y qué no.
10. Error frecuente, con la versión con error, la corregida y el enlace al diagnóstico del laboratorio.
11. Mini comprobación.
12. Abrir en el laboratorio.

Las partes 7 y 8 salen del SQL del ejemplo. Algunas lecciones añaden comparaciones («Sin DISTINCT» frente a «Con dos columnas»), notas de Oracle, el término técnico, la construcción paso a paso (L20) o el catálogo de 12 errores (L21).

**Mini comprobación.** Hay cuatro tipos: elegir, contar filas o columnas, calcular un valor y ordenar piezas. La respuesta se calcula con el motor. Tras un fallo aparece la pista 1, conceptual; tras el segundo, la pista 2, más concreta, y el botón «Ver la respuesta»; al tercero se revela. Visitar no completa una lección: se completa al resolverla o al ver la respuesta.

| Lección y ruta | Bloque | Título y contenido | Ejemplo → resultado | Comprobación |
|---|---|---|---|---|
| L00 `/learn/introduccion` | A · Fundamentos | Bases de datos, tablas y SQL | `SELECT nombre FROM empleados;` → 20 filas | elegir |
| L01 `/learn/empleados` | A · Fundamentos | Nuestra tabla EMPLEADOS (diccionario de 12 columnas) | `SELECT * FROM empleados;` → 20 filas | elegir |
| L02 `/learn/select` | B · Primera consulta | SELECT: qué columnas mostrar | `SELECT nombre, correo FROM empleados;` | elegir |
| L03 `/learn/from` | B · Primera consulta | FROM: de qué tabla salen los datos | `SELECT nombre, cargo FROM empleados;` | ordenar |
| L04 `/learn/asterisco` | B · Primera consulta | SELECT *: todas las columnas | `SELECT * FROM empleados;` | contar |
| L05 `/learn/columnas` | B · Primera consulta | Columnas específicas y comas | `SELECT ciudad, nombre, cargo FROM empleados;` | elegir |
| L06 `/learn/expresiones` | B · Primera consulta | Expresiones aritméticas: +, -, *, / | `SELECT nombre, salario, salario * 12 FROM empleados;` | valor |
| L07 `/learn/precedencia` | B · Primera consulta | Precedencia y paréntesis | `(salario + bono) * 12 AS total_anual` | elegir |
| L08 `/learn/alias` | B · Primera consulta | Alias de columna con AS | `salario * 12 AS salario_anual` | elegir |
| L09 `/learn/concatenacion` | B · Primera consulta | Textos fijos y concatenación con \|\| | `nombre \|\| ' ' \|\| apellido AS nombre_completo` | elegir |
| L10 `/learn/distinct` | C · Duplicados | DISTINCT: sin filas repetidas | `SELECT DISTINCT ciudad FROM empleados;` → 5 de 20 | contar |
| L11 `/learn/where` | D · Filtrar filas | WHERE: filtrar filas | `WHERE ciudad = 'Cali'` → 5 de 20 | contar |
| L12 `/learn/comparaciones` | D · Filtrar filas | Operadores de comparación: =, <>, !=, >, >=, <, <= y textos | `WHERE salario >= 5000000` → 7 de 20 | elegir |
| L13 `/learn/and-or` | D · Filtrar filas | AND y OR: combinar condiciones; NOT invierte una condición | `WHERE ciudad = 'Bogotá' AND salario > 5000000` → 4 de 20 | contar |
| L14 `/learn/parentesis` | D · Filtrar filas | Precedencia lógica (NOT, AND, OR) y paréntesis | `(ciudad = 'Bogotá' OR ciudad = 'Medellín') AND salario > 5000000` → 6 | elegir |
| L15 `/learn/between` | E · Operadores de filtro | BETWEEN y NOT BETWEEN: rangos | `WHERE salario BETWEEN 3000000 AND 6000000` → 12 | contar |
| L16 `/learn/in` | E · Operadores de filtro | IN y NOT IN: listas de valores | `WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')` → 17 | elegir |
| L17 `/learn/like` | E · Operadores de filtro | LIKE y NOT LIKE: patrones con % y _ | `WHERE nombre LIKE '%ar%'` → 6 | elegir |
| L18 `/learn/null` | F · NULL | NULL, IS NULL e IS NOT NULL | `WHERE bono IS NULL` → 6 | elegir |
| L19 `/learn/order-by` | G · Ordenar resultados | ORDER BY: ASC, DESC, varias columnas, posición y alias | `ORDER BY salario DESC` → 20 | ordenar |
| L20 `/learn/consulta-completa` | H · Integración | La consulta completa, paso a paso (FROM → SELECT → WHERE → AND → BETWEEN → ORDER BY) | integradora → 3 de 20 | ordenar |
| L21 `/learn/errores-frecuentes` | H · Integración | Errores frecuentes (catálogo de 12) | `SELECT nombre salario FROM empleados;` (coma olvidada) | elegir |

**Alias y AS (L08).** Un alias es un nombre temporal para una columna o expresión dentro del resultado. AS es la palabra, opcional, que hace explícita esa asignación. AS no renombra la columna, no modifica la tabla ni sus datos: solo cambia el encabezado en esa consulta (`SALARIO*12` sin alias, `SALARIO_ANUAL` con alias).

**DISTINCT (L10).** Elimina filas repetidas del resultado. No borra filas de la tabla, no ordena y, con varias columnas, compara la combinación completa.

La navegación entre lecciones cruza los bloques en orden: por ejemplo, de DISTINCT (bloque C) se pasa a WHERE (bloque D). La última lección lleva al SQL Challenge. El progreso guardado de la versión anterior (9 lecciones) se detecta y se ofrece reiniciar; no se mezcla con el actual.

## Modo Exposición: 30 escenas

Ruta `/presentation`; `?scene=N` vuelve al mismo punto.

**Contenido de cada escena:**

- una idea central;
- un bloque «Definición» (o «Propósito» si no introduce un concepto) con la categoría del término;
- la lectura en español cuando aporta;
- la idea clave;
- poco texto: una prueba lo limita a 95 palabras explicativas;
- tablas de 8 filas como máximo, solo con las columnas del concepto (salvo la tabla base de la 04, que muestra EMPLEADOS completa);
- en las escenas de concepto (06–20), el flujo **1 Tabla de origen → 2 Consulta → 3 Qué hace cada parte → 4 Resultado**, con «Qué cambió» (filas y columnas antes → después, orden, tabla completa) en la línea de resumen del resultado, más la idea clave (ver «Proyecciones didácticas»). Cada escena responde: qué es, para qué sirve, cómo se escribe y qué cambia en los datos.

**Lienzo:** 16:9, sin desbordes a 1920×1080, 1366×768, 1280×720 ni 1024×768 (pruebas E2E y visuales).

**Bloques:** Fundamentos (01–05), Consulta (06–11), Filtrado (12–19), Orden e integración (20–23), y Práctica y cierre (24–30).

**Navegación y herramientas:**

- botones Anterior y Siguiente, flechas, Av Pág/Re Pág, Inicio y Fin;
- panel «Escenas» agrupado por bloque;
- «Paso a paso» de cuatro pasos (origen, consulta, partes y resultado) en las escenas 06–13 y 15–20;
- notas del expositor con la tecla N;
- vista del presentador en `/presentation/presentador`;
- pantalla completa con controles que se atenúan;
- reanudar la última escena.

| Escena | Id | Título | Lecciones |
|---|---|---|---|
| 01 | portada | SELECT en Oracle SQL (portada) | — |
| 02 | ruta | Ruta de aprendizaje | — |
| 03 | que-es-sql | Qué es SQL | L00 |
| 04 | tabla-empleados | Tabla EMPLEADOS (la tabla completa, antes de la primera consulta) | L01 |
| 05 | empleados | Conoce EMPLEADOS | L01 |
| 06 | select-from | SELECT y FROM | L02, L03 |
| 07 | asterisco | SELECT * | L04 |
| 08 | columnas | Columnas específicas | L05 |
| 09 | expresiones | Expresiones y precedencia | L06, L07 |
| 10 | alias | Alias con AS | L08, L09 |
| 11 | distinct | DISTINCT | L10 |
| 12 | where | WHERE | L11 |
| 13 | comparaciones | Comparaciones | L12 |
| 14 | and-or | AND y OR | L13 |
| 15 | parentesis | Paréntesis y precedencia lógica | L14 |
| 16 | between | BETWEEN | L15 |
| 17 | in | IN | L16 |
| 18 | like | LIKE | L17 |
| 19 | null | NULL e IS NULL | L18 |
| 20 | order-by | ORDER BY | L19 |
| 21 | anatomia | Anatomía de una consulta | L20 |
| 22 | paso-a-paso | Construimos una consulta (seis pasos) | L20 |
| 23 | errores | Errores frecuentes | L21 |
| 24 | laboratorio | Laboratorio (abre el ejemplo y vuelve a la escena) | — |
| 25 | challenge | SQL Challenge | — |
| 26 | aprendimos | Qué aprendimos | — |
| 27 | video | Video resumen | — |
| 28 | reto | Reto en vivo: qué harás, cómo entrar, qué evalúa y tu resultado; QR | — |
| 29 | proximos | Próximos temas: siguiente ruta recomendada (enlaza a la ruta) | — |
| 30 | cierre | ¿Preguntas? | — |

Cada escena representa su concepto:

| Escenas | Representación |
| --- | --- |
| 02 | Mapa de aprendizaje: 8 bloques A–H con objetivo y conceptos. |
| 26 | «Ahora ya puedes…»: 9 competencias y una consulta integradora con su resultado. |
| 03 | Persona → SQL → base de datos → resultado, y el vocabulario: tabla, fila, columna y consulta. |
| 04 | La tabla EMPLEADOS completa: 20 filas × 12 columnas en una sola tabla, sin barra ni pestañas en el lienzo 16:9 (letra algo menor solo en esta tabla); en el móvil, grupos de columnas con pestañas. |
| 05 | Cifras, fila, columna y celda señaladas, 3 filas representativas y los 12 campos agrupados con su tipo. |
| 06 | «¿Qué quieres?» y «¿De dónde?». |
| 07 | Las 12 columnas por grupo. |
| 08 | Mismos datos, distinto orden. |
| 09 | Orden de cálculo de cada expresión. |
| 10 | Antes y después del alias. |
| 11 | 20 → 5 con las repetidas marcadas. |
| 12 | Embudo de filas. |
| 13 | Escala de comparadores con su recuento. |
| 14 | Tabla de verdad con empleados reales. |
| 15 | Empleados que cambian sin paréntesis. |
| 16 | Recta de salarios con los límites. |
| 17 | La lista como fichas. |
| 18 | Patrones con ejemplos que cumplen y que no. |
| 19 | NULL ≠ 0 ≠ 'NULL'. |
| 20 | Antes y después de ORDER BY. |
| 21 | Anatomía interactiva con color semántico: proyección, fuente, filtro y orden. |
| 22 | Construcción en seis pasos desde la pregunta. |
| 23 | Seis errores: coma, FROM, columna inexistente, = NULL, DISTINCT mal colocado y comillas; error, por qué y corrección. |
| 24 | Vista del laboratorio. |
| 25 | Las diez misiones. |
| 28 | Cómo participar y QR de la práctica. |
| 29 | Diez temas futuros con su nivel, marcados «Próximamente». |
| 30 | Ilustración «Del dato a la consulta», tres ideas finales, preguntas de salida y accesos al laboratorio y al Challenge. |

Las escenas de WHERE, IN, BETWEEN y NULL marcan cada fila: ✓ cumple, ✗ no cumple, ? desconocido por NULL.

En las escenas 06 y 12, cada cláusula de la consulta es un botón que resalta sus columnas y filas.

La consulta integrada (escenas 22 y 24) es `SELECT nombre, ciudad, salario FROM empleados WHERE estado = 'ACTIVO' AND ciudad = 'Bogotá' AND salario BETWEEN 4000000 AND 8000000 ORDER BY salario DESC;` y devuelve 3 filas.

La anatomía (escena 21) usa `SELECT nombre, salario FROM empleados WHERE ciudad = 'Cali' ORDER BY salario DESC;` y la síntesis (escena 26) `SELECT DISTINCT ciudad FROM empleados WHERE salario >= 4000000 ORDER BY ciudad;`.

### Proyecciones didácticas (escenas 06–20, 27 de septiembre de 2026)

Cada escena muestra una muestra real de EMPLEADOS (filas por ID_EMPLEADO y solo las columnas del concepto) y el resultado de la consulta sobre esas mismas filas; el resumen indica además el recuento en la tabla completa. Catálogo: `src/domain/concepts/concept-projections.ts`.

| Escena | Consulta | Columnas de origen | Filas (ID) | Resultado en la muestra · tabla completa |
| --- | --- | --- | --- | --- |
| 06 SELECT y FROM | `SELECT nombre, ciudad FROM empleados` | NOMBRE, CARGO, CIUDAD | 1–4 | 4 · 20 |
| 07 SELECT * | `SELECT * FROM empleados` | las 12 (bandas) | 1, 2 | 2 · 20 |
| 08 Columnas | `SELECT nombre, ciudad` y `SELECT ciudad, nombre` | NOMBRE, CARGO, CIUDAD, SALARIO | 1, 3, 4 | 3 · 20 |
| 09 Expresiones | `salario + bono * 12` y `(salario + bono) * 12` | NOMBRE, SALARIO, BONO | 1, 2, 4 | 3 · 20 |
| 10 Alias | `salario * 12` antes y después de `AS salario_anual` | NOMBRE, SALARIO | 1, 2, 3 | 3 · 20 |
| 11 DISTINCT | `SELECT DISTINCT ciudad` | NOMBRE, CIUDAD | 1, 2, 3, 4, 5, 7 | 3 · 5 |
| 12 WHERE | `SELECT nombre, ciudad, salario … WHERE ciudad = 'Cali'` (mismas columnas: solo cambian las filas) | NOMBRE, CIUDAD, SALARIO | 1, 3, 4, 8, 12, 13 | 3 · 5 |
| 13 Comparaciones | `WHERE salario >= 6000000` | NOMBRE, SALARIO | 1, 2, 3, 5, 6, 15 | 4 · 5 |
| 16 BETWEEN | `WHERE salario BETWEEN 3000000 AND 6000000` | NOMBRE, SALARIO | 3, 6, 9, 11, 15 | 3 · 12 |
| 17 IN | `WHERE ciudad IN ('Medellín', 'Cali')` | NOMBRE, CIUDAD | 1, 3, 4, 12, 17 | 3 · 10 |
| 18 LIKE | `SELECT nombre, ciudad … WHERE nombre LIKE 'A%'` | NOMBRE, CIUDAD | 1, 2, 3, 6, 19 | 3 · 3 |
| 19 IS NULL | `WHERE bono IS NULL` | NOMBRE, BONO | 1, 4, 7, 10, 12 | 3 · 6 |
| 20 ORDER BY | `ORDER BY salario DESC` | NOMBRE, SALARIO | 3, 4, 5, 9, 15 | 5 · 20 |

La 14 (AND y OR) y la 15 (paréntesis) usan tablas de verdad con filas candidatas: cada condición fila por fila y el resultado en la tabla completa. La 04 muestra la tabla EMPLEADOS completa, tal como está en el dataset; la 05 explica cómo leerla: 20 empleados (filas), 12 atributos (columnas) en cinco grupos, los tipos NUMBER, VARCHAR2 y DATE, y BONO que admite NULL.

## Laboratorio: LAB01–LAB24 y diagnóstico

Ruta `/lab`. El SQL es el protagonista, y los paneles van en este orden:

1. editor y resultado;
2. diagnóstico;
3. lectura en español;
4. anatomía;
5. esquema.

El esquema se muestra agrupado. Los 20 registros se abren solo si se piden, con el selector «Resumen / Completa». Los resultados, de 2 a 12 columnas, usan la vista de datos adaptable. Los ejemplos están en cinco grupos: Columnas y cálculos (LAB01–LAB07), Filtros (LAB08–LAB14), NULL y orden (LAB15–LAB17), Integración (LAB18) y Errores para analizar (LAB19–LAB24). La especificación está en [LAB_SPEC.md](LAB_SPEC.md).

Cada diagnóstico se muestra en uno de cinco grupos: SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE o ADVERTENCIA. Sigue este orden:

1. **Categoría y qué ocurrió.**
2. **Dónde:** la línea y la columna, más lo encontrado.
3. **Por qué:** la pista conceptual.
4. **Cómo corregirlo:** plegado hasta que se pide, con «Aplicar la corrección».
5. **Un ejemplo correcto.**

Primero la pista, después la zona; la corrección no se regala.

Un tema futuro se anuncia como SQL válido en Oracle que pertenece a otro nivel, con enlace a su ficha en Próximamente.

## SQL Challenge v4

`select-challenge-v4` (28 de septiembre de 2026): M01–M10 conservan la puntuación, los intentos, las pistas, los tiempos base, la sala en vivo y el ranking ([GAME_SPEC.md](GAME_SPEC.md)). M10 se califica con la salida real de Oracle.

**Muestra de trabajo.** Cada misión razona sobre una tabla real de como mucho 8 registros y 3–4 columnas relevantes; el dataset completo es una consulta secundaria en un diálogo y nunca hace falta para resolver. No hay preguntas de opción única: se observa, predice, construye, compara, corrige y justifica.

| Misión | Concepto | Tarea | Muestra de trabajo | Error esperable | Orientación 1 → 2 |
| --- | --- | --- | --- | --- | --- |
| M01 | SELECT, lista de columnas | elegir columnas para contactar, en orden y sin datos salariales | 6 × NOMBRE, CIUDAD, SALARIO, CORREO | incluir SALARIO, orden, falta CORREO | SELECT decide columnas y orden → comparar con el pedido |
| M02 | SELECT, FROM | construir solo con las piezas necesarias | 6 × NOMBRE, CARGO, CIUDAD, SALARIO | usar WHERE, DISTINCT o * | cuándo sobran WHERE y DISTINCT → revisar cada pieza |
| M03 | `*` | columnas, filas y qué hace y qué no hace | esquema 3 × 4 y 20 registros | «* es una columna», «descarta NULL» | * = todas las columnas → esquema y consulta |
| M04 | WHERE | marcar filas y construir la condición | 8 × ID, NOMBRE, CIUDAD, SALARIO | otra ciudad, texto sin comillas | WHERE filtra filas → columna CIUDAD y comillas |
| M05 | expresión, precedencia | predecir con y sin paréntesis y construir | 4 × NOMBRE, SALARIO, BONO | olvidar los paréntesis | * antes que + → qué se calcula primero |
| M06 | alias, AS | construir con AS y comparar encabezados | 4 × NOMBRE, SALARIO | alias entre comillas simples, sin AS | AS solo cambia el encabezado → posición y comillas |
| M07 | DISTINCT | predecir valores únicos y pares | 6 analistas × NOMBRE, CIUDAD, DEPARTAMENTO | inventar valores, contar ciudades en el par | DISTINCT quita repetidas del resultado → par completo |
| M08 | depuración | clasificar, localizar y corregir (8 variantes) | — | confundir sintaxis, semántica y concepto | tres tipos de error → comas, comillas, paréntesis, palabras clave |
| M09 | WHERE combinado, ORDER BY | traducir con bloques de nivel token | 8 × NOMBRE, CIUDAD, SALARIO | OR en lugar de AND, > en lugar de >=, ASC | AND exige ambas → condiciones y orden |
| M10 | consulta completa | escribir y justificar (Oracle real) | 8 × NOMBRE, CIUDAD, SALARIO, ESTADO | OR sin paréntesis, alias sin AS | papel de cada cláusula → revisar cada parte |

Las pistas y la orientación no escriben la consulta de la solución; la explicación completa solo aparece al cerrar la oportunidad puntuada.

## Chuleta y recursos

`/resources` reúne cuatro cosas:

- **Chuleta:** 18 fichas en seis categorías, más «Futuro».
  - Las categorías son Consultar, Transformar el resultado, Filtrar, Operadores de filtro, Valores ausentes y Ordenar.
  - Cada ficha sigue la misma estructura: nombre y categoría, «En una frase» (definición canónica), «Para qué sirve», «Patrón», los conceptos asociados (coma, paréntesis, AS, OR y NOT, `%` y `_`, IS NULL e IS NOT NULL, ASC y DESC), el ejemplo formateado, «Qué devuelve» (calculado por el motor) y el «Error frecuente» desplegable, con causa y corrección.
  - El ejemplo va una cláusula por línea y sin barra horizontal; «Copiar» copia SQL limpio.
  - Acciones: «Copiar», «Abrir en Lab» y «Repasar lección».
- **Advertencias:** 8 recordatorios.
- **Tabla de referencia:** el tamaño de cada resultado, calculado por el motor.
- **Ejemplos y más:** los ejemplos LAB01–LAB18 (los de errores se estudian en el laboratorio y en L21), los dos videos y las fuentes.

Al imprimir quedan solo la chuleta y la referencia.

## Vídeos

| Video | Archivo | Duración medida | Formato | Subtítulos | Ubicación |
|---|---|---|---|---|---|
| V01 Introducción | `introduccion-select-oracle-sql.mp4` | 1:13 | Vertical 9:16 | Incrustados | Home, índice de `/learn`, `/resources` |
| V02 Resumen | `resumen-fundamentos-oracle-sql.mp4` | 4:51 | 16:9 | WebVTT revisado y transcripción | Final del recorrido (L21), escena 26, `/resources` |

La interfaz no muestra rótulos de duración (el reproductor nativo ya la indica). Los videos cubren la primera parte de la unidad (SELECT, FROM, *, cálculos, AS y DISTINCT) y usan tablas de ejemplo que no son EMPLEADOS; sus descripciones lo advierten. Detalle en `public/media/README.md`.

## Próximos niveles (roadmap)

`/modules` presenta la ruta completa. El Nivel 1 es el actual; los niveles 2 a 7 están en estado «Próximamente». Fuente única: `src/features/modules/domain/curriculum.ts`, que alimenta la ruta, la Home, la escena 28, el buscador y los enlaces «Ver en Próximamente» del laboratorio.

| Nivel | Título | Etapa | Temas |
|---|---|---|---|
| 1 | SELECT fundamental | Ahora | 22 lecciones (arriba) |
| 2 | Funciones SQL | Siguiente nivel | 16: UPPER, LOWER, INITCAP, LENGTH, SUBSTR, ROUND, TRUNC, MOD, SYSDATE, operaciones con fechas, ADD_MONTHS, TO_CHAR, TO_DATE, TO_NUMBER, NVL, COALESCE |
| 3 | Resumen y agrupación | Siguiente nivel | 6: COUNT, SUM, AVG, MIN y MAX, GROUP BY, HAVING |
| 4 | Relacionar tablas (JOIN) | Más adelante | 7: relacionar tablas, INNER JOIN, LEFT/RIGHT/FULL OUTER JOIN, CROSS JOIN, ON y USING |
| 5 | Subconsultas | Más adelante | 4: subconsulta, en WHERE, IN con subconsulta, comparación con un valor escalar |
| 6 | Modificar datos | Más adelante | 4: INSERT INTO, UPDATE, DELETE, COMMIT y ROLLBACK |
| 7 | Estructura de datos (DDL) | Más adelante | 9: CREATE TABLE, ALTER TABLE, DROP TABLE, PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK, DEFAULT |

Cada ficha tiene lo siguiente:

- Título, definición y para qué sirve.
- Sintaxis mínima y ejemplo sobre EMPLEADOS o sobre las tablas anunciadas.
- Prerrequisitos, errores frecuentes, nivel y estado «Próximamente».
- En Modificar datos (DML), además: antes, después y advertencia (UPDATE y DELETE sin WHERE; DDL y COMMIT implícito).

Ningún tema futuro tiene lección, escena, misión ni progreso. El buscador los marca «Próximamente» y lleva a `/modules#tema-<slug>`, que siempre existe (prueba unitaria y E2E).

## Correcciones editoriales de las fuentes

| Evidencia | Tratamiento |
|---|---|
| F1: 3; F2: 2, «SQL no modifica» | Se precisa que las consultas SELECT de esta unidad son de lectura; SQL también escribe (Nivel 6). |
| F1: 5; F2: 4, consulta con tres partes | WHERE no es obligatorio: se enseña después de SELECT y FROM. |
| F2: 4 y 17, anotaciones con `//` | No se enseña `//` como comentario de Oracle; los comentarios son `--`. |
| F1: 6 frente a F2: 3 y el juego | Se sustituyen por el dataset v2, diseñado para la unidad ampliada. |
| F1: 18, Ana como coincidencia de `A_` | Ana tiene tres caracteres: `'A_'` no la encuentra. LIKE usa `'A%'` y `'_o%'` en v2. |
| F1: 27, teléfono NULL | NULL se enseña con BONO e ID_JEFE en v2. |
| F2: 11, SALARIO repetido en BETWEEN | Corregido: `salario BETWEEN 3000000 AND 6000000`. |
| Sitio compañero, orden físico de fases | Solo se toma la estructura didáctica; el paso a paso se presenta como modelo lógico. |

Oracle documenta que AS es opcional en alias de columna y que DISTINCT compara todas las expresiones seleccionadas. La unidad enseña AS explícito por claridad, sin declarar inválido el alias implícito. [Referencia oficial](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html).

## Aceptación editorial

- C01: las 22 lecciones tienen las 12 partes y una comprobación observable.
- C02: todos los ejemplos del Estudio, de la Exposición y del laboratorio dan en Oracle real el mismo resultado que el motor educativo (`tests/integration/oracle-real.test.ts`, 102 casos).
- C03: ninguna misión exige temas de niveles futuros.
- C04: la Home, el Estudio, la Exposición, el laboratorio, el Challenge y la chuleta usan los mismos nombres, importes y resultados.
- C05: corregir las fuentes no modifica sus archivos originales.
