# S2_S3_PEDAGOGICAL_RESTRUCTURE — Reingeniería pedagógica de las secciones 2 y 3

Fecha: 17 de octubre de 2026; cierre pedagógico y visual el mismo día. Rama: `codex-final-pedagogy-ui-20261004`. Evidencia del cierre: [S2_S3_FINAL_QA.md](S2_S3_FINAL_QA.md).

Fuente: `src/features/curriculum/domain/sections/{s2,s3}/plan.ts`. El orden de esos archivos es el orden de estudio, de clase y de práctica.

## 1. Diagnóstico

La versión anterior tenía contenido válido, pero estaba fragmentada y no respetaba los prerrequisitos:

- 193 y 203 escenas, generadas con el mismo molde para cada lección:
  - una escena por definición;
  - un «modelo mental» con un prerrequisito genérico («repasa la lección anterior»);
  - la sintaxis sola, sin explicar sus partes;
  - el qué cambió y la comprobación.
- Ejemplos que usaban conceptos todavía no enseñados. Por ejemplo:
  - la lección «Estructura» usaba SELECT INTO, una variable y NO_DATA_FOUND;
  - «Variables» usaba IF y BOOLEAN;
  - «%TYPE» usaba SELECT INTO y %ROWTYPE;
  - el trigger de fila de la lección 24 usaba `:NEW` antes de su lección;
  - en S2, los errores de GROUP BY y de HAVING aparecían antes de enseñar esas cláusulas.
- Las cinco tablas se presentaban de golpe al empezar S2, incluida AUDITORIA_SALARIOS, que no se usa hasta los triggers de S3.
- El orden de S3 no era el del profesor:
  - procedimientos antes que funciones;
  - WHILE junto a FOR;
  - %TYPE junto a %ROWTYPE;
  - excepciones en medio del recorrido central.
- Ningún tema distinguía lo central de la ampliación.

## 2. Contrato pedagógico de cada tema

El contrato se extrae de la Sección 1, que no se modifica. Cada lección de S2 y S3 tiene un `TopicPlan` (`domain/types.ts`), y las pruebas exigen cada campo.

| Pregunta del contrato                                            | Dónde se responde                                                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ¿Qué problema queremos resolver?                                 | `problem`: primera línea de la lección y de su primera escena                                  |
| ¿Qué es? ¿Para qué sirve?                                        | Ficha del concepto y `purpose`, en la misma escena                                             |
| ¿Qué necesito saber antes?                                       | `prerequisites` (lecciones anteriores, enlazadas) o `prior` (secciones anteriores)             |
| ¿Con qué tabla trabajamos? ¿Qué significan sus columnas?         | `tables`: papel de la tabla, PK, FK, solo las columnas usadas y hasta 6 filas                  |
| ¿Cómo se escribe? ¿Cómo lo leo en español? ¿Qué hace cada parte? | Sintaxis + `parts` (fragmento → significado) + `reading`                                       |
| Estado inicial → operación → resultado                           | Microejemplo y ejemplo con el dataset: código → visualización → resultado verificado en Oracle |
| ¿Qué cambió? ¿Qué NO cambió?                                     | `changed` y `unchanged`, en dos columnas                                                       |
| Idea clave, error típico y corrección                            | `keyIdea` y `mistakes`; errores de Oracle con explicación humana                               |
| ¿Lo entendí?                                                     | Comprobación de la lección, práctica y misiones                                                |

También hay **avances marcados** (`previews`). Una construcción que un ejemplo necesita antes de su lección solo se admite si se nombra y se explica en esa lección. Por ejemplo:

- INSERT en la lección de PK y FK;
- COUNT en RIGHT/FULL y en CROSS JOIN;
- UPDATE en el cursor implícito;
- RAISE_APPLICATION_ERROR en el código ya creado de los procedimientos y del paquete.

Cada lección tiene además un **nivel**:

- **Núcleo:** lo que pide el profesor.
- **Apoyo:** hace falta para entender un tema central.
- **Ampliación:** contenido válido de siguiente nivel.

La ampliación se identifica en el temario, en la lección y en la clase.

## 3. Sección 2 · Consultas relacionales y análisis

El núcleo es lo que pide el profesor: **INNER JOIN y agregaciones**. Los bloques 0–2 preparan el JOIN; OUTER, SELF y CROSS profundizan; subconsultas y operadores de conjuntos van después, como ampliación.

| Bloque | Tema                         | Lecciones (en orden)                                      | Nivel              |
| ------ | ---------------------------- | --------------------------------------------------------- | ------------------ |
| 0      | De una tabla a varias tablas | L01 PK y FK                                               | Apoyo              |
| 1      | Alias de tabla               | L02                                                       | Apoyo              |
| 2      | Modelo mental del JOIN       | L03 (JOIN y ON)                                           | Apoyo              |
| 3      | INNER JOIN                   | L04 INNER JOIN → L06 JOIN + WHERE → L05 columnas ambiguas | Núcleo             |
| 4      | JOIN de más de dos tablas    | L07 (presenta PROYECTOS y ASIGNACIONES)                   | Núcleo             |
| 5      | OUTER JOIN                   | L08 LEFT · L09 RIGHT y FULL                               | Apoyo · Ampliación |
| 6      | SELF JOIN                    | L10                                                       | Ampliación         |
| 7      | CROSS JOIN                   | L11 (NATURAL y USING como comparación)                    | Ampliación         |
| 8      | Funciones de grupo           | L12 · L13 COUNT y NULL                                    | Núcleo             |
| 9      | GROUP BY                     | L14 · L15                                                 | Núcleo             |
| 10     | WHERE frente a HAVING        | L16 · L17                                                 | Núcleo             |
| 11     | JOIN + agregaciones          | L18 nómina y personas por área · L19 meta con HAVING      | Núcleo             |
| 12     | Ampliación · Subconsultas    | L20 · L21 · L22                                           | Ampliación         |
| 13     | Ampliación · Conjuntos       | L23 · L24                                                 | Ampliación         |
| 14     | Ampliación · Integración     | L25                                                       | Ampliación         |

Cambios de contenido en S2:

- **Bloque 0.** Empieza por la tabla de la Sección 1, con el departamento escrito como texto (`S2-E-S1-TEXTO`, dataset `empleados-v2`). Después llegan la FK y la tabla padre.
- **Presentación de tablas.** DEPARTAMENTOS y EMPLEADOS se presentan en L01; PROYECTOS y ASIGNACIONES, en L07; AUDITORIA_SALARIOS, nunca en S2.
- **ON.** Se define en el modelo mental (L03).
- **INNER JOIN.** El orden es ON → WHERE → columna ambigua. La ambigüedad se explica primero en lenguaje humano y el código ORA-00918 queda como detalle técnico.
- **Errores en su lugar:**
  - la columna sin agrupar (ORA-00937) pasa de L12 a GROUP BY (L14);
  - la función de grupo en WHERE (ORA-00934) pasa de L15 a WHERE frente a HAVING (L17).
- **JOIN + agregación (L18).** Construye paso a paso «¿cuánto cuesta la nómina de cada departamento y cuántos empleados tiene?» (`S2-E-NOMINA-DEPTO`, nuevo): FROM, JOIN, ON, GROUP BY, SUM y COUNT se explican por separado. El LEFT JOIN que conserva Investigación queda como segundo ejemplo.
- **Alias explícitos.** En el modelo del JOIN y en INNER JOIN se dice «e es el alias de EMPLEADOS; d, de DEPARTAMENTOS».

## 4. Sección 3 · PL/SQL y automatización

El núcleo sigue el orden pedido por el profesor:

1. concepto de PL/SQL;
2. bloque anónimo;
3. variables e inicialización;
4. %TYPE;
5. IF;
6. FOR;
7. cursor implícito;
8. cursor explícito;
9. funciones;
10. procedimientos;
11. paquetes;
12. triggers, con momento, evento, nivel y cuerpo.

| Bloque | Tema                           | Lecciones (en orden)                                                                           | Nivel          |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------- | -------------- |
| 0      | De SQL a PL/SQL                | L01 (parte de `SELECT salario … WHERE id_empleado = 6`)                                        | Núcleo         |
| 1      | Bloque anónimo                 | L02: versión 1 BEGIN/END → 2 DECLARE → 3 EXCEPTION                                             | Núcleo         |
| 2      | Variables                      | L04 (declarar, inicializar, `:=` frente a `=`)                                                 | Núcleo         |
| 3      | %TYPE                          | L05 (solo %TYPE)                                                                               | Núcleo         |
| 4      | SQL dentro de PL/SQL           | L07 SELECT INTO                                                                                | Apoyo          |
| 5      | IF                             | L09                                                                                            | Núcleo         |
| 6      | FOR                            | L12 FOR (i = 1…5) → L11 LOOP y WHILE                                                           | Núcleo · Apoyo |
| 7      | Cursor implícito               | L13 → L08 DML, COMMIT y ROLLBACK                                                               | Núcleo · Apoyo |
| 8      | Cursor explícito               | L14 CURSOR/OPEN/FETCH/CLOSE → L15 cursor FOR                                                   | Núcleo · Apoyo |
| 9      | Funciones                      | L20                                                                                            | Núcleo         |
| 10     | Procedimientos                 | L18 → L19 IN/OUT/IN OUT → L03 anónimo o almacenado → L21 ¿procedimiento o función?             | Núcleo · Apoyo |
| 11     | Paquetes                       | L22                                                                                            | Núcleo         |
| 12     | Triggers                       | L23 momento, evento, nivel y cuerpo → L24 sentencia frente a fila → L25 :OLD, :NEW y auditoría | Núcleo         |
| 13     | Ampliación · Más herramientas  | L29 %ROWTYPE (nueva) · L06 alcance · L10 CASE                                                  | Ampliación     |
| 14     | Ampliación · Excepciones       | L16 · L17                                                                                      | Ampliación     |
| 15     | Ampliación · Validar y límites | L26 · L27                                                                                      | Ampliación     |
| 16     | Ampliación · Integración final | L28                                                                                            | Ampliación     |

Cambios de contenido en S3:

- **Ejemplos nuevos, más pequeños.** Cada uno se ejecutó en Oracle:
  - `S3-E-SQL-SALARIO`;
  - `S3-E-DECLARE-SIMPLE` y `S3-E-EXCEPTION-SIMPLE`, con un ZERO_DIVIDE manejado y sin SELECT INTO;
  - `S3-E-VARIABLES-BASICO`, que muestra NULL → asignación y no usa IF;
  - `S3-E-TYPE-BASICO` y `S3-E-TYPE-CORTO`, un ORA-06502 sin SELECT INTO;
  - el microejemplo de FOR pasa a `1..5`;
  - `S3-L29-MICRO`.
- **Ejemplos reubicados:**
  - `S3-E-ESTRUCTURA` → Excepciones;
  - `S3-E-VARIABLES` → IF;
  - `S3-E-ROWTYPE` → %ROWTYPE;
  - `S3-E-TYPE-TAMANO` → SELECT INTO;
  - `S3-E-WHILE` → LOOP y WHILE;
  - `S3-E-UPDATE-ROWCOUNT` → cursor implícito;
  - `S3-E-TRIGGER-BEFORE` (asigna `:NEW`) → :OLD y :NEW.
- **El trigger de fila de L24 ya no usa `:NEW`.** Tiene una versión propia, `TRIGGER_FILA_SIMPLE`. El banco de evaluación conserva la suya, sin cambios.
- **AUDITORIA_SALARIOS** se presenta en L25 y vacía: «La tabla empieza vacía». Después del UPDATE recibe una fila por persona.
- **Misión M02** pide solo variables y %TYPE.
- **Práctica S3-P10 (WHILE)** remite a la lección de LOOP y WHILE.
- **Cierre.** El microejemplo de variables enseña una sola idea (declarar, inicializar y asignar con `:=`). El de %TYPE ya no menciona %ROWTYPE. La comprobación del cursor FOR muestra solo el cuerpo del bloque, con el bloque completo plegado. Las definiciones de trigger y procedimiento son las del profesor. Los modelos de cursor explícito (CURSOR → OPEN → FETCH fila a fila → procesar → CLOSE), función y trigger (MOMENTO, EVENTO, NIVEL, CUERPO) se dibujan como árbol o secuencia.

## 5. Escenas de clase

Una escena transmite una idea completa (`domain/pedagogy.ts`). Por tema:

1. el problema, la definición, para qué sirve, los prerrequisitos y el modelo mental (rotulado «un esquema, no una ejecución de Oracle»);
2. las tablas que el tema usa por primera vez, antes de cualquier código;
3. la sintaxis con la tabla «parte → qué hace» y la lectura en español;
4. el microejemplo;
5. los ejemplos con datos, con sus visualizaciones curadas (JOIN, grupos, cursor, trigger…);
6. antes y después: qué cambió y qué no, con la idea clave;
7. el error frecuente y la comprobación.

Los temas de ampliación se proyectan en 4 o 5 escenas: idea, ejemplo, cambio y comprobación. Se eliminaron las escenas de solo título, las de solo código y las definiciones aisladas.

|               | Antes | Reestructura | Cierre |
| ------------- | ----- | ------------ | ------ |
| Escenas de S2 | 193   | 144          | 145    |
| Escenas de S3 | 203   | 167          | 167    |

La escena nueva de S2 es `join-nomina`: la consulta de nómina por departamento antes del LEFT JOIN con COUNT.

El avance de clase guardado se conserva:

- `release-scenes-20261004.json` y `outline.json` (`releaseScenePositions` y `retiredScenePositions`) llevan cada posición o escena del guion anterior a la escena equivalente de su misma lección.
- El guion vigente se identifica como `pedagogy-20261017`.

## 6. Errores de Oracle

Cada ejemplo que falla a propósito es un **error para aprender** (`domain/error-lessons.ts`):

1. **Qué ocurrió**, en lenguaje humano;
2. **Por qué ocurrió**, con la causa concreta de ese ejemplo;
3. **Cómo corregirlo**;
4. **Ejemplo correcto**, también ejecutado en Oracle (identificador `<error>-OK` o un ejemplo existente);
5. **Detalle técnico**: el código ORA o PLS y el mensaje de Oracle, plegados.

Hay 35 errores para aprender: 10 en S2 y 25 en S3. Las pruebas exigen que cada uno tenga sus tres textos, que el ejemplo correcto exista en la misma sección, que Oracle lo ejecute sin error y que solo use lo enseñado en la lección que lo muestra. Los textos de las lecciones que citaban un código como mensaje principal («Oracle responde ORA-…») dicen ahora primero la causa.

## 7. Verificación

Las cifras y pruebas del cierre están en [S2_S3_FINAL_QA.md](S2_S3_FINAL_QA.md). Resumen:

| Comprobación                                         | Resultado                                              |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Ejemplos ejecutados en Oracle Database 23            | 313/313 (S1 9 · S2 137 · S3 133 · banco S2 20 · S3 14) |
| Contrato pedagógico (`pedagogical-contract.test.ts`) | 36/36                                                  |
| Vitest completo (unitarias e integración)            | 2349 pasan, 7 omitidas (humo remoto)                   |

Los criterios de aceptación comprueban:

- definición, propósito, problema y prerrequisitos anteriores en el 100 % de los temas;
- sintaxis explicada por partes y leída en español;
- microejemplo y ejemplo verificados;
- qué cambió y qué no;
- tablas presentadas antes de usarse;
- ninguna construcción antes de su lección sin un avance marcado, en ejemplos, práctica, Challenge y comprobaciones (`domain/construct-map.ts`);
- escenas sin vacíos y en el orden problema → datos → sintaxis → ejemplo → cambio → comprobación;
- en S2, el núcleo exacto, y subconsultas y conjuntos después del núcleo;
- en S3, el orden del profesor y el trigger con momento, evento, nivel y cuerpo antes de `:OLD` y `:NEW`;
- AUDITORIA_SALARIOS presentada vacía en L25;
- errores con explicación humana.

## 8. Lo que no cambia

- La Sección 1, la autenticación, los exámenes, el banco de evaluación y el panel docente.
- Los identificadores y las rutas de las lecciones. El progreso de Estudiar sigue siendo válido; las lecciones cuyo contenido cambió suben de versión.
- El dataset `empresa-relacional-v1`.

## 9. Pendientes reales

Ver la sección «Limitaciones reales» de [S2_S3_FINAL_QA.md](S2_S3_FINAL_QA.md). Los dos pendientes de la reestructura (`check-S2-L25` y `check-S3-L15`) están resueltos: caben sin desplazar desde 1280 × 720.
