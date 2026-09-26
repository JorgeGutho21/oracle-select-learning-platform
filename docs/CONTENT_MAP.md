# CONTENT_MAP — Contenido y secuencia educativa

Versión 2.0 (25 de septiembre de 2026) · Reingeniería descrita en [CONTENT_REDESIGN_PLAN.md](CONTENT_REDESIGN_PLAN.md) · Fuentes F1–F7 en [PROJECT_SPEC.md](PROJECT_SPEC.md).

Este mapa separa dos cosas que la plataforma nunca mezcla:

- **Contenido actual (Nivel 1, SELECT fundamental):** 22 lecciones en 8 bloques, 29 escenas, laboratorio LAB01–LAB24 y Challenge M01–M10. Todo usa el dataset `empleados-select-v2`.
- **Próximos niveles (2 a 7):** 46 temas con ficha completa y estado «Próximamente». No tienen lecciones, ni escenas, ni misiones, ni cuentan en el progreso.

## Principio de enseñanza

Comprender → visualizar → predecir → consultar → equivocarse → recibir feedback → corregir → combinar conceptos → resolver problemas.

Cada idea se muestra con el mismo patrón visual: **tabla original → consulta → qué hace → resultado**. Las tablas, los recuentos y las respuestas de las comprobaciones no se escriben a mano: los calcula el motor educativo sobre el dataset canónico, y las pruebas de integración comprueban que Oracle real devuelve lo mismo. El recorrido «FROM, WHERE, SELECT, ORDER BY» se presenta como modelo lógico para entender la consulta, no como el plan físico del optimizador.

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

## Modo Exposición: 29 escenas

Ruta `/presentation`; `?scene=N` vuelve al mismo punto. Cada escena tiene una idea central, poco texto (una prueba lo limita a 95 palabras explicativas), código grande y como máximo 8 filas por tabla. Se ve en un lienzo 16:9 que no se desborda a 1920×1080, 1366×768 ni 1280×720 (prueba E2E). Se navega con los botones Anterior y Siguiente, las flechas, Av Pág/Re Pág, Inicio y Fin, y con el selector de escenas. Tiene pantalla completa y se puede reanudar la última escena.

| Escena | Id | Título | Lecciones |
|---|---|---|---|
| 01 | portada | SELECT en Oracle SQL (portada) | — |
| 02 | ruta | Ruta de aprendizaje | — |
| 03 | que-es-sql | Qué es SQL | L00 |
| 04 | empleados | Conoce EMPLEADOS | L01 |
| 05 | select-from | SELECT y FROM | L02, L03 |
| 06 | asterisco | SELECT * | L04 |
| 07 | columnas | Columnas específicas | L05 |
| 08 | expresiones | Expresiones y precedencia | L06, L07 |
| 09 | alias | Alias con AS | L08, L09 |
| 10 | distinct | DISTINCT | L10 |
| 11 | where | WHERE | L11 |
| 12 | comparaciones | Comparaciones | L12 |
| 13 | and-or | AND y OR | L13 |
| 14 | parentesis | Paréntesis y precedencia lógica | L14 |
| 15 | between | BETWEEN | L15 |
| 16 | in | IN | L16 |
| 17 | like | LIKE | L17 |
| 18 | null | NULL e IS NULL | L18 |
| 19 | order-by | ORDER BY | L19 |
| 20 | anatomia | Anatomía de una consulta | L20 |
| 21 | paso-a-paso | Construimos una consulta (seis pasos) | L20 |
| 22 | errores | Errores frecuentes | L21 |
| 23 | laboratorio | Laboratorio (abre el ejemplo y vuelve a la escena) | — |
| 24 | challenge | SQL Challenge | — |
| 25 | aprendimos | Qué aprendimos | — |
| 26 | video | Video resumen | — |
| 27 | reto | Reto en vivo: revelar respuesta, QR y sala en vivo | — |
| 28 | proximos | Próximos temas (enlaza a la ruta) | — |
| 29 | cierre | ¿Preguntas? | — |

Las escenas de WHERE, AND/OR, BETWEEN, IN, LIKE, NULL y ORDER BY muestran siempre la tabla original con la marca de cada fila (✓ cumple, ✗ no cumple, ? desconocido por NULL), la consulta y el resultado. El reto de la escena 27 pregunta por `SELECT DISTINCT departamento FROM empleados WHERE ciudad = 'Bogotá';` (5 filas).

## Laboratorio: LAB01–LAB24 y diagnóstico

Ruta `/lab`. Los ejemplos están en cinco grupos: Proyección (LAB01–LAB07), Filtros (LAB08–LAB14), NULL y orden (LAB15–LAB17), Integración (LAB18) y Errores para analizar (LAB19–LAB24). La especificación está en [LAB_SPEC.md](LAB_SPEC.md).

Cada diagnóstico se muestra en uno de cinco grupos: SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE o ADVERTENCIA. Incluye:

- La línea y la columna.
- El fragmento encontrado y qué significa.
- Una pista.
- La posible corrección, plegada hasta que se pide, con el botón «Aplicar la corrección».
- Un ejemplo mínimo correcto.

Un tema futuro se anuncia como SQL válido en Oracle que pertenece a otro nivel, con enlace a su ficha en Próximamente.

## SQL Challenge v3

`select-challenge-v3`: M01–M10 conservan la puntuación, los intentos, las pistas, la sala en vivo y el ranking ([GAME_SPEC.md](GAME_SPEC.md)). M02, M04, M07, M09 y M10 incorporan WHERE u ORDER BY. M10 se califica con la salida real de Oracle.

## Chuleta y recursos

`/resources` reúne cuatro cosas:

- **Chuleta:** 18 conceptos, cada uno con significado, patrón, ejemplo y enlaces al laboratorio y a la lección.
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
