# QUESTION_BANK_SPEC — Banco de preguntas de DB LAB

Fecha: 3 de octubre de 2026. Modelo de datos en
[ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md#2-modelo).

## 1. Objetivo

50 preguntas por sección (150 en total). Esta fase deja la infraestructura completa para las
tres secciones y el banco oficial de la **Sección 1, Fundamentos SQL: 50 de 50**. Las
secciones 2 y 3 aún no tienen contenido académico publicado (su plan está en
`features/sections`); escribir preguntas sobre JOIN o PL/SQL sin ese contenido y sin su dataset
sería inventar. El profesor puede crear preguntas propias para ellas desde el panel.

| Sección                               | Oficiales                                | Meta |
| ------------------------------------- | ---------------------------------------- | ---- |
| 1 · Fundamentos SQL                   | 50                                       | 50   |
| 2 · Consultas relacionales y análisis | 0 (llega con el contenido de la sección) | 50   |
| 3 · PL/SQL y automatización           | 0 (llega con el contenido de la sección) | 50   |

## 2. Clasificación

Cada pregunta tiene sección, tema (clave de `features/assessments/domain/topics.ts`), subtema,
tipo, forma de respuesta, dificultad interna 1–5 (no se muestra al estudiante), peso, estado
(borrador, publicada, retirada), versión, etiquetas y fuente académica.

Temas de la Sección 1: fundamentos, SELECT y FROM, expresiones y precedencia, alias y
concatenación, DISTINCT, WHERE y comparaciones, AND/OR/NOT, BETWEEN/IN/LIKE, NULL, ORDER BY,
consulta completa y errores frecuentes. Las secciones 2 y 3 tienen sus temas definidos
(relaciones, JOIN, agregación, grupos, subconsultas, conjuntos; bloques, control, cursores,
excepciones, subprogramas, triggers).

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

## 6. Fuentes académicas por grupo

| Grupo                                         | Fuente                                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Fundamentos, SELECT y FROM, consulta completa | Oracle Database SQL Language Reference 19c, «SELECT»; lecciones L00–L05, L20 y L21                       |
| Expresiones, alias y concatenación            | Oracle Database SQL Language Reference 19c, «Operators» (aritméticos y concatenación); lecciones L06–L09 |
| DISTINCT                                      | «SELECT» (DISTINCT); lección L10                                                                         |
| WHERE, AND/OR/NOT, BETWEEN, IN, LIKE          | «Conditions» (comparación, lógicas, BETWEEN, IN, LIKE); lecciones L11–L17                                |
| NULL                                          | «Nulls» y «Null Conditions»; lección L18                                                                 |
| ORDER BY                                      | «SELECT», order_by_clause; lección L19                                                                   |
| Datos de todas las preguntas                  | Dataset EMPLEADOS v2 de DB LAB ([DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)), verificado en Oracle 23ai     |

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

Para las secciones 2 y 3: primero el contenido y el dataset de la sección (plan en
[SECTION_2_MIGRATION_PLAN.md](SECTION_2_MIGRATION_PLAN.md)); después su banco oficial con el
mismo método (resultados del motor o de Oracle, distractores documentados, pruebas que
comprueban cada afirmación).
