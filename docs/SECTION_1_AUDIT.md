# SECTION_1_AUDIT — Auditoría de la Sección 1 (Fase 4)

Fecha: 3–4 de octubre de 2026. Alcance: auditar Fundamentos SQL frente al recorrido de Oracle Academy (_Database Programming with SQL_) y cubrir solo vacíos reales, sin rediseñar la sección.

## 1. Cobertura frente a Oracle Academy

| Tema de Oracle Academy                                                   | Sección 1 de DB LAB | Estado                                                   |
| ------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------- |
| Tablas, filas, columnas; SELECT y FROM                                   | L00–L05             | Cubierto                                                 |
| Expresiones aritméticas, precedencia, NULL en cálculos                   | L06–L07             | Cubierto (se añadió la división entre cero, ORA-01476)   |
| Alias, concatenación, DISTINCT                                           | L08–L10             | Cubierto                                                 |
| WHERE, comparaciones, AND/OR/NOT y precedencia                           | L11–L14             | Cubierto                                                 |
| BETWEEN, IN, LIKE, IS NULL                                               | L15–L18             | Cubierto                                                 |
| ORDER BY (ASC, DESC, varias columnas, NULL)                              | L19–L20             | Cubierto (se añadió el orden por posición, `ORDER BY 2`) |
| Errores frecuentes y consulta completa                                   | L21                 | Cubierto                                                 |
| **Funciones de una fila**: carácter, número, fecha, NULL                 | —                   | **Vacío real → bloque I, lecciones 23–25**               |
| Conversión (TO_CHAR, TO_DATE, TO_NUMBER), NVL2, NULLIF, COALESCE, DECODE | —                   | Ampliación futura (sigue «Próximamente» en `/modules`)   |
| Funciones de grupo, GROUP BY, JOIN, subconsultas                         | Sección 2           | Fuera del alcance de la Sección 1                        |

## 2. Vacío cubierto: «Funciones de una fila»

Es una ampliación curricular (ver `CURRICULUM_ARCHITECTURE.md`). El motor educativo de la Sección 1 no ejecuta funciones, así que sus 9 ejemplos usan el dataset `empleados-select-v2`, se ejecutan en Oracle y se cruzan con PostgreSQL.

| Lección                  | Ruta                                                  | Contenido                                                                                        |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 23 · Funciones de texto  | `/sections/fundamentos-sql/study/funciones-de-texto`  | UPPER, LOWER, INITCAP, LENGTH, SUBSTR; función en WHERE                                          |
| 24 · Funciones numéricas | `/sections/fundamentos-sql/study/funciones-numericas` | ROUND (incluido el redondeo a millones), TRUNC, MOD                                              |
| 25 · Fechas y NVL        | `/sections/fundamentos-sql/study/fechas-y-nvl`        | Fecha ± número, resta de fechas, SYSDATE (con una fecha fija verificable), NVL y NVL con TO_CHAR |

Se integra en:

- el temario de `/learn` (bloque I);
- la página de la sección;
- el progreso de la Sección 1 (22 + 3 = 25 lecciones);
- el buscador;
- `/modules`, cuyos temas UPPER…NVL ahora enlazan a la lección.

El banco de la Sección 1 sigue en 50 preguntas.

## 3. Banco de la Sección 1: defectos verificados y corregidos

Un auditor independiente (subagente) revisó las 50 preguntas: las 50 claves eran correctas y señaló 20 defectos en 16 preguntas. Cada defecto se comprobó contra el dataset y Oracle antes de corregirlo.

| Pregunta                                                                                                     | Defecto                                                              | Corrección                                                                |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| S1-LOG-01                                                                                                    | El distractor decía 13 personas en Bogotá y Medellín; son 12         | «12: todos los de Bogotá y Medellín»                                      |
| S1-ORD-02                                                                                                    | La retroalimentación atribuía a DESC el orden «Jorge, Mario, Andrés» | Ese orden es `NULLS FIRST`; con DESC sería Jorge, Andrés, Mario           |
| S1-COM-07                                                                                                    | La explicación decía que BETWEEN «también sirve»                     | No es equivalente: incluye los extremos (María gana 6.000.000)            |
| S1-DIS-03                                                                                                    | Distractor inverosímil («más el total»)                              | «0: DISTINCT no admite NULL y la consulta falla»                          |
| S1-EXP-03                                                                                                    | La división entre cero no se enseñaba                                | Nota en la lección de expresiones (ORA-01476) y explicación con el código |
| S1-ORD-05, S1-COM-05                                                                                         | El orden por posición no se enseñaba                                 | Nota «Ordenar por posición» en la lección ORDER BY                        |
| S1-SEL-04, S1-WHE-05                                                                                         | Exigían recordar datos del dataset                                   | El enunciado da el dato necesario                                         |
| S1-FUN-01, S1-WHE-02, S1-WHE-03, S1-BIL-02, S1-NUL-02, S1-NUL-03, S1-COM-04, S1-ORD-05, S1-COM-07, S1-WHE-05 | La opción correcta era la más larga (pista)                          | Longitudes equilibradas                                                   |

Las 78 comprobaciones (`checks`) del banco se ejecutan ahora también en Oracle real: `tests/integration/bank-oracle.test.ts`, 78/78.

## 4. Fichas de conceptos corregidas (`src/domain/concepts/sql-concepts.ts`)

- `_`: «un carácter cualquiera (letra, número o espacio)», no «cualquier letra».
- Expresión: el NULL anula la aritmética; la concatenación `||` lo trata como texto vacío (verificado en Oracle).
- SELECT: «no quita filas (DISTINCT sí quita las repetidas)».
- Paréntesis y precedencia: `(salario + bono) * 12` es NULL para las 6 personas sin bono.
- FROM: obligatorio en 19c. Oracle 23ai acepta `SELECT 2 * 3` sin FROM, pero nunca para leer columnas de una tabla (verificado en Oracle 23.26).

## 5. Lo que no se cambió

No se cambiaron las 22 lecciones (solo dos notas nuevas), la clase de 30 escenas, el laboratorio, el Challenge de 10 misiones ni el motor educativo. Los resultados de la Sección 1 siguen verificándose en Oracle: `oracle-real.test.ts`, en verde el 4 de octubre de 2026.
