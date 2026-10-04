# QUESTION_BANK_SPEC — Banco de preguntas de DB LAB

Fecha: 3 de octubre de 2026. Modelo de datos en
[ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md#2-modelo).

## 1. Objetivo

50 preguntas por sección: **150 de 150** desde la Fase 4 (4 de octubre de 2026). El profesor
puede además crear preguntas propias desde el panel.

| Sección                               | Oficiales | Dónde vive                                                        |
| ------------------------------------- | --------- | ----------------------------------------------------------------- |
| 1 · Fundamentos SQL                   | 50        | `features/assessments/domain/bank/fundamentos-sql.ts`             |
| 2 · Consultas relacionales y análisis | 50        | `features/assessments/application/bank/consultas-relacionales.ts` |
| 3 · PL/SQL y automatización           | 50        | `features/assessments/application/bank/plsql.ts`                  |

`OFFICIAL_BANK` se arma en `features/assessments/application/official-bank.ts`. Las secciones
2 y 3 viven en la capa de aplicación porque toman sus resultados de la fuente curricular
verificada en Oracle (`curriculum/application/oracle-results.json`).

## 2. Clasificación

Cada pregunta tiene sección, tema (clave de `features/assessments/domain/topics.ts`), subtema,
tipo, forma de respuesta, dificultad interna 1–5 (no se muestra al estudiante), peso, estado
(borrador, publicada, retirada), versión, etiquetas y fuente académica.

Temas de la Sección 1: fundamentos, SELECT y FROM, expresiones y precedencia, alias y
concatenación, DISTINCT, WHERE y comparaciones, AND/OR/NOT, BETWEEN/IN/LIKE, NULL, ORDER BY,
consulta completa y errores frecuentes, y funciones de una fila (tema nuevo de la ampliación,
sin preguntas oficiales todavía). Sección 2: relaciones, JOIN, otros JOIN, agregación, grupos,
subconsultas, conjuntos. Sección 3: bloques, variables, control, bucles y cursores, excepciones,
subprogramas, paquetes, triggers. Cada tema coincide con el `topic` de sus lecciones.

**Nivel cognitivo** (secciones 2 y 3): etiqueta `nivel:recordar`, `nivel:aplicar` o
`nivel:analizar`. Meta: 15 % / 40 % / 45 % con una pregunta de margen. La dificultad 1–5 sigue
siendo interna.

## 3. Tipos y formas de respuesta

| Tipo                       | Forma            | Presentación                                                        |
| -------------------------- | ---------------- | ------------------------------------------------------------------- |
| Selección única            | única            | Enunciado y opciones de texto                                       |
| Selección múltiple         | múltiple         | «Elige todas las correctas»; crédito parcial con penalización       |
| Predicción de resultado    | única            | Tabla de origen, consulta y opciones que son tablas de resultado    |
| Identificación de error    | única            | Consulta con error y opciones que explican la causa o la corrección |
| Elección de consulta       | única            | Pedido y opciones que son consultas                                 |
| Interpretación de consulta | única            | Consulta y opciones que describen qué devuelve                      |
| Ordenamiento de fragmentos | ordenar          | Fragmentos SQL que se mueven con botones (teclado y toque)          |
| Comparación de resultados  | única o múltiple | Dos consultas lado a lado                                           |
| Concepto Oracle            | única o múltiple | Comportamiento propio de Oracle                                     |
| Caso corto                 | única o múltiple | Situación de trabajo y consultas candidatas                         |

Añadir un tipo: añadirlo a `QUESTION_TYPES` y a la restricción de `question_bank`. Añadir una
forma de respuesta (texto, SQL ejecutado en Oracle): además, su normalización y calificación en
la base (`private.normalize_response`, `private.item_credit`).

Las opciones admiten texto, código SQL o tabla de resultado. El material admite tablas de
origen y consultas a comparar. Todo se guarda como datos (JSON validado y acotado), nunca
como HTML.

## 4. Calidad

- Comprobar comprensión, no memoria: se predicen resultados, se explican errores, se comparan
  consultas.
- Distractores plausibles: cada uno representa una confusión frecuente documentada en las
  lecciones (NULL como 0, `=` frente a `IS`, `BETWEEN` sin extremos, `DISTINCT` sobre una sola
  columna, precedencia de AND/OR, alias con comillas simples…) y trae su explicación.
- Antes → consulta → después: las de predicción muestran las filas de origen necesarias y la
  consulta; la retroalimentación muestra la respuesta propia y la correcta como tablas.
- Retroalimentación completa en todas: por qué, concepto, qué revisar (lección exacta de DB
  LAB) y referencia.
- Comportamientos propios de Oracle señalados con la etiqueta `oracle`: texto vacío como NULL,
  concatenación con NULL, NULL al final en ASC, división por cero.

## 5. Verificación

El banco oficial vive en el repositorio (`features/assessments/domain/bank/fundamentos-sql.ts`)
y las pruebas (`tests/unit/assessments/official-bank.test.ts`, 142 comprobaciones) exigen:

- 50 preguntas con claves únicas y estables, los diez tipos (al menos dos de cada uno) y
  varias dificultades;
- forma válida para la base (una correcta, al menos una correcta y una incorrecta, orden 1…n),
  retroalimentación en cada opción y límites de longitud;
- en las de predicción, la opción correcta **es el resultado del motor educativo** sobre las
  filas mostradas, y los distractores difieren de ella y entre sí;
- 78 comprobaciones de afirmaciones con el motor: número de filas, consultas que fallan o son
  válidas, títulos de columnas y equivalencia de consultas.

El motor educativo se compara con Oracle real en `tests/integration/oracle-real.test.ts`. Las
pruebas encontraron y corrigieron tres recuentos mal escritos a mano (SALARIO > 4.200.000,
jefes 1 y 2, ciudades con salario ≥ 4.000.000) antes de publicar el banco.

Distribución de la Sección 1:

| Tipo                       | n   | Tema                  | n   | Dificultad | n   |
| -------------------------- | --- | --------------------- | --- | ---------- | --- |
| Predicción de resultado    | 12  | Consulta completa     | 7   | 1          | 5   |
| Interpretación de consulta | 8   | BETWEEN, IN y LIKE    | 6   | 2          | 16  |
| Selección múltiple         | 6   | NULL                  | 6   | 3          | 21  |
| Concepto Oracle            | 5   | WHERE                 | 5   | 4          | 8   |
| Identificación de error    | 5   | ORDER BY              | 5   |            |     |
| Elección de consulta       | 4   | SELECT y FROM         | 4   |            |     |
| Comparación de resultados  | 3   | AND, OR y NOT         | 4   |            |     |
| Ordenamiento               | 3   | Alias y concatenación | 4   |            |     |
| Selección única            | 2   | Fundamentos           | 3   |            |     |
| Caso corto                 | 2   | Expresiones           | 3   |            |     |
|                            |     | DISTINCT              | 3   |            |     |

### Secciones 2 y 3 (Fase 4)

Ningún resultado se escribe a mano. Cada tabla de opción, recuento, salida de DBMS_OUTPUT o
código de error que cita una pregunta se lee del resultado que Oracle devolvió para un ejemplo
de la fuente curricular (`verified-bank.ts`: `tableOf`, `rowCount`, `outputOf`, `errorOf`,
`afterOf`). Las consultas de elección marcan como correcta la opción cuyo resultado en Oracle es
idéntico al de la consulta objetivo. Las consultas y bloques que solo usa el banco (20 S2-B-* y
14 S3-B-*) se verifican como el resto (`ORACLE_VALIDATION.md`).

Pruebas (`tests/unit/assessments/curriculum-bank.test.ts`):

- 50 preguntas por sección con claves únicas, 150 en total sin repetir claves;
- distribución por tema exacta y mezcla cognitiva 15/40/45 (±1);
- al menos 7 tipos y 4 dificultades;
- forma válida para la base y retroalimentación en cada opción;
- repaso que apunta a una lección publicada de su sección;
- distractores de resultado distintos entre sí y con las columnas de la correcta;
- **ninguna opción correcta se delata por ser mucho más larga** (más del 25 % sobre el distractor
  más largo, en las opciones de texto);
- ningún código de cliente importa el banco: las respuestas correctas no llegan al navegador;
- cada consulta o bloque propio del banco se usa en alguna pregunta.

La sincronización real con Supabase local acepta las 150 preguntas sin ninguna inválida
(`tests/integration/assessments-supabase.test.ts`).

Distribución de la Sección 2:

| Tema                    | n   | Nivel    | n   | Dificultad | n   |
| ----------------------- | --- | -------- | --- | ---------- | --- |
| Relaciones              | 5   | Recordar | 7   | 1          | 7   |
| JOIN / otros JOIN       | 15  | Aplicar  | 20  | 2          | 12  |
| Agregación / grupos     | 15  | Analizar | 23  | 3          | 15  |
| Subconsultas            | 8   |          |     | 4          | 12  |
| Conjuntos e integración | 7   |          |     | 5          | 4   |

Tipos: los diez (identificación de error 9, selección única 8, concepto 7, predicción 7,
comparación 5, caso corto 4, elección de consulta 4, interpretación 3, ordenamiento 2, selección
múltiple 1).

Distribución de la Sección 3:

| Tema              | n   | Nivel    | n   | Dificultad | n   |
| ----------------- | --- | -------- | --- | ---------- | --- |
| Bloques           | 6   | Recordar | 8   | 1          | 8   |
| Variables         | 7   | Aplicar  | 20  | 2          | 8   |
| Control           | 7   | Analizar | 22  | 3          | 22  |
| Bucles y cursores | 7   |          |     | 4          | 12  |
| Excepciones       | 5   |          |     |            |     |
| Subprogramas      | 7   |          |     |            |     |
| Paquetes          | 4   |          |     |            |     |
| Triggers          | 7   |          |     |            |     |

Tipos: predicción de salida 15, identificación de error 10, interpretación 10, concepto 8,
caso corto 4, selección única 2, ordenamiento 1.

## 6. Fuentes académicas por grupo

| Grupo                                         | Fuente                                                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fundamentos, SELECT y FROM, consulta completa | Oracle Database SQL Language Reference 19c, «SELECT»; lecciones L00–L05, L20 y L21                                                                                                                         |
| Expresiones, alias y concatenación            | Oracle Database SQL Language Reference 19c, «Operators» (aritméticos y concatenación); lecciones L06–L09                                                                                                   |
| DISTINCT                                      | «SELECT» (DISTINCT); lección L10                                                                                                                                                                           |
| WHERE, AND/OR/NOT, BETWEEN, IN, LIKE          | «Conditions» (comparación, lógicas, BETWEEN, IN, LIKE); lecciones L11–L17                                                                                                                                  |
| NULL                                          | «Nulls» y «Null Conditions»; lección L18                                                                                                                                                                   |
| ORDER BY                                      | «SELECT», order_by_clause; lección L19                                                                                                                                                                     |
| Datos de todas las preguntas                  | Dataset EMPLEADOS v2 de DB LAB ([DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)), verificado en Oracle 23ai                                                                                                       |
| Sección 2                                     | SQL Language Reference 19c: «Constraints», «Joins», «Aggregate Functions», «Using Subqueries», «The UNION [ALL], INTERSECT, MINUS Operators»; lecciones S2-L01–L25                                         |
| Sección 3                                     | PL/SQL Language Reference 19c: «Blocks», «Declarations», «IF/CASE Statement», «LOOP Statements», «PL/SQL Error Handling», «PL/SQL Subprograms», «PL/SQL Packages», «PL/SQL Triggers»; lecciones S3-L01–L28 |
| Datos de las secciones 2 y 3                  | Dataset `empresa-relacional-v1`; resultados obtenidos en Oracle Database 23.26                                                                                                                             |

Todas las preguntas son originales de DB LAB sobre su propio dataset: no reproducen preguntas
de certificación ni de bancos propietarios.

## 7. Versionado y sincronización

- Cada pregunta guarda una huella de su contenido. Guardar el mismo contenido no cambia nada;
  cambiarlo sube la versión. Las evaluaciones publicadas conservan la copia que congelaron.
- Las preguntas oficiales (`origin = 'dblab'`) no se editan desde el panel: se duplican como
  borrador propio. Así una próxima sincronización no pisa el trabajo del profesor.
- «Sincronizar banco oficial de DB LAB» (panel del profesor) es idempotente: añade las nuevas,
  actualiza las que cambiaron en el repositorio (nueva versión) y deja igual el resto. Respeta
  las que el profesor retiró.
- No se borran preguntas: se retiran. Una pregunta retirada no se puede usar en evaluaciones
  nuevas.

## 8. Siguiente contenido

- Preguntas oficiales para el tema «Funciones de una fila» de la Sección 1 (sus ejemplos ya
  están verificados en Oracle), sin superar la meta de 50 o reemplazando preguntas existentes.
- Revisión humana de los bancos 2 y 3 por el profesor antes de usarlos en evaluaciones
  calificadas.
