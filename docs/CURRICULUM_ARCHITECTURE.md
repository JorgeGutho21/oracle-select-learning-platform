# CURRICULUM_ARCHITECTURE — Fuente curricular única (Fase 4)

Fecha: 4 de octubre de 2026. Rama: `claude-phase4-curriculum-20261003`.

## 1. Idea central

Cada sección se describe una sola vez en `src/features/curriculum/domain/sections/`. Todos los modos leen de esa fuente:

```text
currículo → lecciones → ejemplos → clase → práctica → Challenge → recursos → evaluación
```

Un mismo ejemplo verificado alimenta la lección, la escena de clase, las actividades y las preguntas del banco que lo citan. Si el código de un ejemplo cambia sin volver a ejecutarse en Oracle, las pruebas fallan (huella FNV-1a en `oracle-results.json`).

## 2. Piezas

| Pieza                | Archivo                                                                 | Qué contiene                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos                | `curriculum/domain/types.ts`                                            | `CurriculumUnit`, `SectionCurriculum` (con misiones y escenas), `CurriculumExtension` (solo lecciones), `QueryExample`, `PlsqlExample`, `Activity`, `Mission`, `CurriculumScene`, `ExampleVisual` |
| Constructores        | `curriculum/domain/builders.ts`                                         | `query()`, `plsql()`, `source()`, `lines()`, referencias a la documentación de Oracle 19c                                                                                                         |
| Registro             | `curriculum/domain/registry.ts`                                         | `CURRICULA` (S2, S3), `EXTENSIONS` (S1 · Funciones de una fila), `UNITS`, `ASSESSMENT_EXAMPLES` (S2-B-_, S3-B-_), `ALL_EXAMPLES`                                                                  |
| Resultados de Oracle | `curriculum/application/oracle-results.json` + `verified-results.ts`    | Tabla, error, salida de DBMS_OUTPUT y tablas antes/después de cada ejemplo, con motor y fecha                                                                                                     |
| Índice ligero        | `curriculum/application/outline.json` + `outline.ts`                    | Lecciones, prácticas, misiones y escenas (sin contenido) para el progreso, el buscador y las rutas                                                                                                |
| API de vistas        | `curriculum/application/curriculum-api.ts`                              | Vistas de lección, ejemplo, actividad, escena, recursos y dataset                                                                                                                                 |
| Presentación         | `curriculum/presentation/`                                              | Lección, ejemplo, visualizaciones (JOIN, GROUP BY, pipeline, comparación, cursor, trigger), recorrido paso a paso, actividades, escenas                                                           |
| Composición          | `src/composition/curriculum/`                                           | Progreso del navegador, práctica, Challenge, clase                                                                                                                                                |
| Rutas                | `src/app/sections/[section]/{study,practice,challenge,resources,class}` | Rutas estáticas generadas desde el índice ligero                                                                                                                                                  |

## 3. Secciones y ampliaciones

- **Sección completa** (`SectionCurriculum`): bloques, conceptos, lecciones, ejemplos, práctica, 10 misiones y escenas de clase. Son S2 y S3, con los seis modos bajo `/sections/{id}/…`.
- **Ampliación** (`CurriculumExtension`): solo lecciones y ejemplos. La Sección 1 conserva su Modo Estudio, su motor educativo, su clase y su Challenge. Sus lecciones 23–25 («Funciones de una fila») viven en `/sections/fundamentos-sql/study/{slug}` y aparecen en el temario de `/learn` (bloque I), en la página de la sección, en el catálogo de progreso de la Sección 1 y en el buscador.
- **Ejemplos de evaluación** (`ASSESSMENT_EXAMPLES`): consultas y bloques que solo usa el banco. No se estudian, pero se verifican igual.

## 4. Verificación

1. `tests/integration/curriculum-oracle.test.ts` ejecuta cada ejemplo en Oracle real. Con `CURRICULUM_UPDATE=1` escribe los resultados; sin esa variable, los compara. Los recorridos paso a paso deben imprimir exactamente lo mismo que Oracle.
2. `tests/integration/curriculum-postgres.test.ts` repite en PostgreSQL (PGlite) cada consulta sin construcciones propias de Oracle. Comprueba además que las filas de origen visibles bastan para obtener el resultado.
3. `tests/unit/curriculum/curriculum-integrity.test.ts` revisa la integridad interna:
   - identificadores únicos;
   - referencias entre lecciones, ejemplos, conceptos, actividades, misiones y escenas;
   - que no haya ejemplos huérfanos;
   - respuestas bien formadas;
   - tablas que existen;
   - resultados al día.
4. `tests/unit/curriculum/outline.test.ts` exige que el índice ligero coincida con el contenido. Con `CURRICULUM_UPDATE=1` se regenera.

Detalles del entorno en `ORACLE_VALIDATION.md`.

## 5. Progreso

Se usa el mismo `ProgressRecord` de la Fase 2. Los registros del currículo se guardan en `localStorage` (`dblab:curriculum-progress:v1`) y se sincronizan con `ProgressSync` como fuente local adicional. El catálogo de progreso suma:

- por sección completa: Estudiar, Practicar, Challenge (100 puntos por misión, −15 por pista, −10 por intento fallido, mínimo 40, 0 si se revela la respuesta) y la posición en la clase;
- para la Sección 1: sus 22 lecciones más las 3 de la ampliación (25).

## 6. Reglas de diseño

- Ningún resultado se escribe a mano: las tablas, recuentos, salidas y errores salen de Oracle.
- La interfaz nunca presenta un resultado guardado como ejecución en vivo. Cada ejemplo muestra «Vista educativa… obtenidos al ejecutar este código en Oracle Database 23… No es una ejecución en vivo».
- Los mensajes de error son los de Oracle, textuales (incluidos ORA-04091, ORA-04092, PLS-00363, etc.).
- Las tablas siguen siendo tablas (DataView/ColumnTabs). En pantallas estrechas, las tablas de origen pasan a identidad + una columna por pestaña, y los encabezados muy largos pueden partirse. No hay barra horizontal.
- Las visualizaciones pedagógicas son componentes propios. React Bits solo aporta efectos funcionales gratuitos (THIRD_PARTY_NOTICES).
