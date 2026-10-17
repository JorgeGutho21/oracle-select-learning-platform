# SECTION_2_CURRICULUM — Consultas relacionales y análisis

Fecha: 3–4 de octubre de 2026; reestructurada y cerrada el 17 de octubre de 2026 (ver [S2_S3_FINAL_QA.md](S2_S3_FINAL_QA.md) y [S2_S3_PEDAGOGICAL_RESTRUCTURE.md](S2_S3_PEDAGOGICAL_RESTRUCTURE.md)). Fuente: `src/features/curriculum/domain/sections/s2/`. Rutas: `/sections/consultas-relacionales/{study,class,practice,challenge,resources}` y evaluación con el motor de la Fase 3.

## 1. Cifras

| Elemento                       | Cantidad                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloques                        | 15 (0–14): núcleo INNER JOIN y agregaciones; los bloques 12–14 son ampliación                                                                  |
| Lecciones                      | 25: 12 de núcleo, 4 de apoyo y 9 de ampliación                                                                                                 |
| Fichas de conceptos (Recursos) | 32                                                                                                                                             |
| Ejemplos verificados en Oracle | 137 en la sección (lecciones, microejemplos, práctica y 8 ejemplos correctos de «error para aprender»), todos ejecutados en Oracle Database 23 |
| Prácticas guiadas              | 22                                                                                                                                             |
| Misiones del Challenge         | 10 (20 pasos)                                                                                                                                  |
| Escenas de clase               | 145 (antes 193)                                                                                                                                |
| Banco de evaluación            | 50 preguntas (ver `QUESTION_BANK_SPEC.md`)                                                                                                     |
| Consultas propias del banco    | 20 (S2-B)                                                                                                                                      |

## 2. Recorrido

| Bloque                                    | Lecciones (en orden)                                                | Nivel              |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------ |
| 0 · De una tabla a varias tablas          | L01 PK y FK                                                         | Apoyo              |
| 1 · Alias de tabla                        | L02 Alias de tabla                                                  | Apoyo              |
| 2 · Modelo mental del JOIN                | L03 Modelo del JOIN (JOIN y ON)                                     | Apoyo              |
| 3 · INNER JOIN                            | L04 INNER JOIN; L06 JOIN + WHERE; L05 Columnas de 2 tablas          | Núcleo             |
| 4 · JOIN de más de dos tablas             | L07 Joins múltiples                                                 | Núcleo             |
| 5 · OUTER JOIN                            | L08 LEFT JOIN; L09 RIGHT y FULL                                     | Apoyo · Ampliación |
| 6 · SELF JOIN                             | L10 SELF JOIN                                                       | Ampliación         |
| 7 · CROSS JOIN                            | L11 CROSS y NATURAL                                                 | Ampliación         |
| 8 · Funciones de grupo                    | L12 Funciones de grupo; L13 COUNT y NULL                            | Núcleo             |
| 9 · GROUP BY                              | L14 GROUP BY; L15 GROUP BY varias                                   | Núcleo             |
| 10 · WHERE frente a HAVING                | L16 HAVING; L17 WHERE vs HAVING                                     | Núcleo             |
| 11 · JOIN + agregaciones                  | L18 nómina y personas por área; L19 JOIN + HAVING                   | Núcleo             |
| 12 · Ampliación · Subconsultas            | L20 Subconsulta simple; L21 IN con subconsulta; L22 Correlacionadas | Ampliación         |
| 13 · Ampliación · Operadores de conjuntos | L23 UNION; L24 INTERSECT y MINUS                                    | Ampliación         |
| 14 · Ampliación · Integración final       | L25 Integración                                                     | Ampliación         |

Misiones:

- M01 El mapa de la empresa
- M02 La condición correcta
- M03 Nómina de Finanzas
- M04 Equipos de TI
- M05 Áreas sin proyectos
- M06 Primer resumen
- M07 El salario más alto de cada área
- M08 Áreas sobre la meta
- M09 Personas y áreas sin asignar
- M10 Query Master relacional

Ampliación futura, publicada como plan y no como contenido: ROLLUP y CUBE, consultas jerárquicas, funciones analíticas y vistas.

## 3. Estructura de cada lección

Cada lección tiene estas partes:

- propósito;
- sintaxis;
- explicación;
- mini predicción, que va antes del ejemplo para no revelar el resultado;
- ejemplo principal y adicionales;
- qué cambió;
- errores frecuentes;
- idea clave;
- trazabilidad hacia la práctica y las misiones.

Cada ejemplo muestra las tablas de origen (solo las filas que importan), la consulta, la visualización y el resultado obtenido en Oracle.

## 4. Visualizaciones

| Visualización | Qué muestra                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| JOIN          | Fichas de las dos tablas, condición ON y estado de cada fila: con pareja, conservada con NULL o descartada |
| GROUP BY      | Una caja por grupo con sus filas y su recuento                                                             |
| Pipeline      | FROM → WHERE → GROUP BY → HAVING → ORDER BY, con filas por etapa                                           |
| Comparación   | Dos consultas y sus resultados lado a lado (ON frente a WHERE, COUNT(*) frente a COUNT(columna))           |

## 5. Dataset `empresa-relacional-v1`

Lo usan las secciones 2 y 3. Reutiliza las 20 personas de la Sección 1 y añade claves foráneas. Los casos están diseñados para enseñar:

- Esteban (20) no tiene departamento: el INNER JOIN lo pierde y el LEFT JOIN lo conserva.
- Investigación (60) no tiene personas ni proyectos.
- El proyecto 106 no tiene asignaciones.
- Camila (Finanzas) trabaja en un proyecto de TI.
- ID_JEFE apunta a la misma tabla (SELF JOIN).

Script descargable: `/datasets/dblab-empresa-v1.sql`. Esquema en `DATABASE_SCHEMA.md`.

## 6. Errores de Oracle que la sección enseña

Se citan textuales, como los devuelve Oracle Database 23:

| Código    | Situación                                               |
| --------- | ------------------------------------------------------- |
| ORA-00001 | Clave primaria duplicada                                |
| ORA-02291 | Clave padre no encontrada                               |
| ORA-00918 | Columna ambigua                                         |
| ORA-02000 | JOIN sin ON; en 19c el mensaje era ORA-00905            |
| ORA-00937 | Columna sin agrupar junto a una función de grupo        |
| ORA-00979 | GROUP BY incompleto                                     |
| ORA-00934 | Función de grupo en WHERE                               |
| ORA-01427 | Subconsulta de una fila que devuelve varias             |
| ORA-01789 | Distinto número de columnas en un operador de conjuntos |
| ORA-01790 | Tipos incompatibles en un operador de conjuntos         |
