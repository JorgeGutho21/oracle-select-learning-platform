# CONTENT_REDESIGN_PLAN — Reingeniería pedagógica de la unidad SELECT

Versión 1.0 · 25 de septiembre de 2026 · Rama `claude-finish-20260923`. Informe interno previo a la implementación: qué hay, qué falta y qué cambia. Fuente de comportamiento SQL: [Oracle Database 19c SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/).

## 1. Estado de partida

| Pieza           | Estado actual                                                                                                      | Problema                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposición      | 16 escenas (`src/features/presentation/domain/scenes.ts`), identificadas solo por número                           | Solo proyección: SELECT, FROM, `*`, columnas, expresiones, AS y DISTINCT. AS y DISTINCT se muestran, pero no se explican (qué cambia y qué no).                                                                                                   |
| Estudio         | 9 lecciones L00–L08 con actividad propia cada una, escritas para 6 filas                                           | Faltan WHERE, comparaciones, AND/OR, paréntesis, BETWEEN, IN, LIKE, NULL, ORDER BY e integración. Las actividades tienen valores de v1 fijos en el código (3 ciudades, 5 pares, Ana 4.200.000). Todo el contenido viaja en JavaScript de cliente. |
| Dataset         | `empleados-select-v1`: 6 filas × 6 columnas (ID, NOMBRE, EDAD, CIUDAD, SALARIO, DEPTO), sin NULL ni fechas         | No sirve para filtros, rangos, listas, patrones, nulos ni ordenamiento múltiple.                                                                                                                                                                  |
| Motor SQL       | Léxico → parser → analizador → evaluador → sentencia canónica → traducción → anatomía (`src/domain/sql`)           | Solo `SELECT [DISTINCT] lista FROM empleados`. WHERE, ORDER BY, literales de texto, `                                                                                                                                                             |     | `, comparaciones y NULL se rechazan como «unidad futura». `CellValue` no admite NULL. Comparación de resultados solo como multiconjunto (sin orden). |
| Laboratorio     | Editor, diagnóstico, vista previa, Oracle real, traducción, anatomía; LAB01–LAB10                                  | El diagnóstico da mensaje y pista, pero no fragmento encontrado, corrección posible ni ejemplo. Categorías internas (8) sin la distinción SINTAXIS / SEMÁNTICA / ALCANCE / ORACLE / ADVERTENCIA.                                                  |
| Challenge       | M01–M10 (`select-challenge-v2`), rúbricas por resultado, M10 en Oracle                                             | Coherente con v1. Con el dataset v2 y el nuevo temario, M04, M07 y M09 se vuelven tediosos (marcar 20 filas) y ninguna misión usa lo nuevo.                                                                                                       |
| Catálogo futuro | `/modules`: 7 fichas (WHERE, BETWEEN, IN, LIKE, JOIN, GROUP BY, Funciones)                                         | WHERE–LIKE pasan a ser contenido actual. Las fichas no tienen definición, sintaxis ni ejemplo; no hay niveles 5–7.                                                                                                                                |
| Buscador        | Catálogo público derivado de lecciones y módulos                                                                   | No encuentra `order by`, `null`, `upper`, `insert`… Los temas futuros no tienen destino.                                                                                                                                                          |
| Home            | Hero, identidad, ruta de 9 pasos, demo, Challenge, video, próximos módulos                                         | «Duración: 1:13» visible bajo el video (lo pinta `VideoPlayer` en Home, Estudio, Exposición y Recursos). Textos «seis personas y seis columnas».                                                                                                  |
| Oracle          | Local 23ai Free y Autonomous 19c con `SQL_LAB_OWNER.EMPLEADOS` v1 y `SQL_LAB_READER`; la salud compara fila a fila | Producción (`sql-select-lab.vercel.app`) usa hoy ese esquema v1. Cambiar la tabla rompería la producción actual.                                                                                                                                  |

Escenas actuales: 1 Portada · 2 Qué aprenderemos · 3 Qué es SQL · 4 La tabla EMPLEADOS · 5 SELECT y FROM · 6 SELECT * · 7 Columnas específicas · 8 Expresiones · 9 Alias con AS · 10 DISTINCT · 11 Anatomía · 12 Laboratorio · 13 SQL Challenge · 14 Resumen · 15 Reto y QR · 16 Cierre.

Redundancias detectadas: la ruta de lecciones se repite en Home, `/learn`, escena 2 y `/modules`; hay dos escenas de resumen (14 y 16); SELECT y FROM se tratan en dos lecciones sin contenido propio suficiente para FROM.

Componentes reutilizables: `HighlightTable` (columnas resaltadas y atenuadas, filas repetidas), `DatasetTable`/`DataTable`, `SequenceBuilder` (arrastre accesible), `VideoPlayer`, `SceneQr`, `SqlEditor` (CodeMirror dinámico), deck 16:9 con teclado y pantalla completa, motor educativo único y catálogo tipado de módulos.

## 2. Decisiones

### 2.1 Dataset canónico v2 (`empleados-select-v2`)

Una sola definición en `src/domain/dataset/empleados.ts`, cargada en Oracle por `oracle/empleados-select-v2.sql` (una prueba verifica que coinciden) y usada por Exposición, Estudio, Laboratorio, Challenge, Home, Recursos y pruebas.

12 columnas: `ID_EMPLEADO NUMBER(4)`, `NOMBRE`, `APELLIDO`, `CARGO`, `DEPARTAMENTO`, `CIUDAD` (`VARCHAR2`), `SALARIO NUMBER(10)` mensual en pesos, `BONO NUMBER(10)` mensual y opcional, `FECHA_INGRESO DATE`, `ESTADO` (`ACTIVO`/`INACTIVO`), `CORREO` (dominio reservado `empresa.example`) e `ID_JEFE NUMBER(4)` (referencia a `ID_EMPLEADO`, opcional).

20 filas diseñadas para cada concepto:

| Concepto      | Casos del dataset                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ciudades      | Bogotá 7, Medellín 5, Cali 5, Barranquilla 2, Valledupar 1 → `IN ('Bogotá','Medellín','Cali')` deja 17 y excluye 3 visibles.                           |
| Departamentos | TI 5, Ventas 5, Finanzas 4, Operaciones 3, Recursos Humanos 3 (ningún nombre se ordena distinto por mayúsculas en orden binario).                      |
| Salarios      | 2.100.000 a 9.000.000; exactamente 3.000.000 y 6.000.000 (límites de BETWEEN), 2.900.000 y 6.100.000 justo fuera; empates 4.200.000 ×2 y 3.500.000 ×2. |
| BONO          | 6 NULL, uno en 0 (NULL ≠ 0), el resto 150.000–900.000.                                                                                                 |
| ID_JEFE       | NULL para la gerente general y para un ingreso de 2025 aún sin jefe.                                                                                   |
| Nombres       | Empiezan por A: Ana, Andrés, Alicia; contienen «ar»: Carlos, María, Mario, Oscar, Ricardo, Carolina; `'A__'` solo Ana.                                 |
| Apellidos     | `'_o%'`: Rojas, Mora, Soto, Torres (Gómez y López no, porque ó no es o); `'R___'`: Ruiz y Ríos frente a `'R%'` con Rojas.                              |
| Estado        | 17 ACTIVO, 3 INACTIVO (uno de Bogotá dentro del rango salarial, para AND).                                                                             |
| Fechas        | Ingresos de 2012 a 2025.                                                                                                                               |
| Cargos        | Gerente general, Líder de área ×4, Analista ×6, Representante comercial ×4, Asistente ×3, Especialista ×2.                                             |

Consulta integradora: activos de Bogotá con salario entre 3.000.000 y 6.000.000, del mayor al menor → Laura, Andrés y Mario (Diego queda fuera por INACTIVO).

### 2.2 Estrategia Oracle sin romper producción

Producción sigue sirviendo el código anterior contra `SQL_LAB_OWNER` (v1). La v2 se carga en esquemas nuevos y aislados, `SQL_LAB_V2_OWNER` y `SQL_LAB_V2_READER`, en Oracle local y en Autonomous Database. Los scripts toman los nombres de la versión del dataset. La salud del servidor compara las 12 columnas de la v2.

La sesión fija `NLS_DATE_FORMAT='YYYY-MM-DD'` y `NLS_SORT`/`NLS_COMP` en `BINARY`: fechas y orden de textos iguales en Oracle y en la vista educativa. Las fechas se leen como texto; NULL llega como `null` y ya no como cadena vacía.

Activar la v2 en Vercel solo requiere cambiar `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` y volver a desplegar. Esa acción queda para el responsable: esta tarea no la ejecuta.

### 2.3 Motor SQL educativo v2 (mismo motor para Lab, Estudio, Exposición y Challenge)

Subconjunto nuevo, sintaxis Oracle 19c:

```
SELECT [DISTINCT] { * | expr [[AS] alias], … }
FROM empleados
[WHERE condición]
[ORDER BY { expr | alias | posición } [ASC | DESC] [NULLS FIRST | LAST], …] [;]
```

- **Expresiones:** columnas; números; textos `'…'` (con `''`); `NULL`; literal `DATE 'AAAA-MM-DD'`; `+ - * /`, signo y paréntesis; `||` con la precedencia de `+` y `-`.
- **Condiciones:** `= <> != ^= < <= > >=`, `[NOT] BETWEEN … AND …`, `[NOT] IN (…)`, `[NOT] LIKE`, `IS [NOT] NULL`, `NOT`, `AND` y `OR` con precedencia de Oracle (NOT, luego AND, luego OR) y paréntesis.
- **Semántica de Oracle:** lógica de tres valores; `= NULL` nunca es verdadero; NULL en aritmética da NULL; `'a' || NULL` da `'a'`; `''` es NULL; LIKE distingue mayúsculas; BETWEEN incluye los extremos; NULLS LAST en ASC y NULLS FIRST en DESC; alias no válido en WHERE (ORA-00904); con DISTINCT, ORDER BY solo usa expresiones seleccionadas (ORA-01791).
- **Fuera de alcance, con nivel y enlace al roadmap:** funciones, GROUP BY, HAVING, JOIN, subconsultas, DML, DDL y transacciones. Nunca «no existe»: «válido en Oracle SQL; pertenece al Nivel N».
- **Diagnóstico:** cada hallazgo lleva grupo visible (SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE, ADVERTENCIA), línea, columna, fragmento, explicación, sugerencia, corrección posible y ejemplo mínimo.
- **Casos cubiertos:** coma ausente, `SELECT nombre, FROM`, `SELECT nombre empleados`, `SELECT FROM`, `FROM;`, texto sin comillas, comillas dobles para texto, `= NULL`, BETWEEN invertido, IN sin paréntesis, patrón LIKE sin comillas, AND/OR sin paréntesis, alias en WHERE, `==`, comparaciones encadenadas, texto frente a número y fecha frente a texto.
- **Después de ejecutar:** avisos de resultado vacío por mayúsculas o tildes (`'bogota'`, `'a%'`).
- **Traza para las vistas:** qué filas cumplen, cuáles no y cuáles dan UNKNOWN; repetidas eliminadas; orden aplicado; tramos de coincidencia de LIKE.
- **Resultados:** `compareResults` sigue ignorando el orden. Se añade `isSortedBy` para misiones con ORDER BY, que tolera empates.

### 2.4 Estudio: 22 lecciones con plantilla de 12 partes

Cada lección tiene estas partes:

1. En una frase.
2. ¿Qué hace?
3. ¿Para qué sirve?
4. Sintaxis.
5. Cómo leerla.
6. Ejemplo (pregunta → SQL → lectura en español).
7. Tabla de origen.
8. Resultado.
9. Qué cambió y qué no.
10. Error frecuente.
11. Mini comprobación con pistas graduales.
12. Abrir en el laboratorio.

Las tablas 7 y 8 se calculan con el motor. Se renderiza en el servidor; solo la mini comprobación y el progreso son islas de cliente.

| Bloque                 | Lecciones                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Fundamentos          | L00 `introduccion` (base de datos, tabla, fila, columna; SQL consulta y modifica) · L01 `empleados`                                                                     |
| B Primera consulta     | L02 `select` · L03 `from` · L04 `asterisco` · L05 `columnas` (y comas) · L06 `expresiones` · L07 `precedencia` · L08 `alias` · L09 `concatenacion` (literales y `\|\|`) |
| C Duplicados           | L10 `distinct`                                                                                                                                                          |
| D Filtrar filas        | L11 `where` (y `=`) · L12 `comparaciones` (y textos entre comillas) · L13 `and-or` · L14 `parentesis`                                                                   |
| E Operadores de filtro | L15 `between` · L16 `in` · L17 `like`                                                                                                                                   |
| F NULL                 | L18 `null`                                                                                                                                                              |
| G Ordenar              | L19 `order-by`                                                                                                                                                          |
| H Integración          | L20 `consulta-completa` (anatomía, orden de escritura, modelo lógico, construcción paso a paso) · L21 `errores-frecuentes`                                              |

Se conservan las rutas `/learn/{introduccion, select, from, asterisco, columnas, expresiones, alias, distinct, consulta-completa}`. El progreso pasa a `select-study-v2`, por lo que el progreso v1 del navegador se reinicia.

### 2.5 Exposición: 29 escenas, una idea por escena

01 Portada · 02 Ruta · 03 Qué es SQL · 04 Conoce EMPLEADOS · 05 SELECT y FROM · 06 SELECT * · 07 Columnas específicas · 08 Expresiones y precedencia · 09 Alias con AS · 10 DISTINCT · 11 WHERE · 12 Comparaciones · 13 AND y OR · 14 Paréntesis · 15 BETWEEN · 16 IN · 17 LIKE · 18 NULL · 19 ORDER BY · 20 Anatomía · 21 Paso a paso · 22 Errores frecuentes · 23 Laboratorio · 24 SQL Challenge · 25 Qué aprendimos · 26 Video resumen · 27 Reto en vivo · 28 Próximos temas · 29 Cierre.

Se añade «Errores frecuentes» (22) al guion sugerido, porque el error clásico se trabaja mejor en clase que solo en Estudio. Cada escena usa el patrón tabla → consulta → qué hace → resultado, muestra «N de 20 filas» y lleva un identificador estable (`id`) además del número. La concatenación con `||` queda solo en Estudio.

### 2.6 Roadmap estructurado

Un catálogo tipado de temas (`src/features/modules/domain/curriculum.ts`). Campos de cada tema: `id`, `slug`, `title`, `shortDefinition`, `purpose`, `level`, `status`, `prerequisites`, `syntax`, `example`, `commonErrors`, `availableInLab`, `availableInChallenge`, `presentationScene` y `lesson`.

| Nivel | Tema                                                                                                                                          | Estado          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1     | SELECT fundamental                                                                                                                            | Actual (AHORA)  |
| 2     | Funciones: UPPER, LOWER, INITCAP, LENGTH, SUBSTR, ROUND, TRUNC, MOD, SYSDATE, fechas, ADD_MONTHS, TO_CHAR, TO_DATE, TO_NUMBER, NVL y COALESCE | SIGUIENTE NIVEL |
| 3     | Agrupación: COUNT, SUM, AVG, MIN, MAX, GROUP BY y HAVING                                                                                      | SIGUIENTE NIVEL |
| 4     | JOIN: INNER, LEFT, RIGHT, FULL, CROSS, ON y USING                                                                                             | MÁS ADELANTE    |
| 5     | Subconsultas                                                                                                                                  | MÁS ADELANTE    |
| 6     | Modificar datos: INSERT, UPDATE, DELETE, COMMIT y ROLLBACK                                                                                    | MÁS ADELANTE    |
| 7     | DDL: CREATE, ALTER, DROP, PK, FK, NOT NULL, UNIQUE, CHECK y DEFAULT                                                                           | MÁS ADELANTE    |

`/modules` muestra niveles y fichas con ancla (`#tema-<slug>`). El buscador y el diagnóstico del laboratorio enlazan a esas anclas: nunca a rutas inexistentes.

### 2.7 Laboratorio

- Tarjeta de diagnóstico con grupo, posición, «Encontrado», explicación, «Posible corrección», ejemplo mínimo y enlace al tema futuro cuando corresponde.
- Ejemplos LAB01–LAB24 agrupados: proyección, filtros, NULL y orden, integración y «Errores para analizar».
- Esquema con tipo (número, texto, fecha) y marca «admite NULL».
- Vista previa limitada a 100 filas, como Oracle.

### 2.8 Challenge (`select-challenge-v3`)

Se conservan M01–M10, sus tipos de interacción, la puntuación, la sala y los tiempos base.

| Misión              | Cambio                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| M01, M03, M06 y M08 | Mismo contenido, con textos derivados del dataset (20 filas y 12 encabezados en M03).                                        |
| M02                 | Añade WHERE: nombre y ciudad de TI.                                                                                          |
| M04                 | Predice qué filas deja `WHERE ciudad = 'Cali'`.                                                                              |
| M05                 | El distractor EDAD pasa a BONO.                                                                                              |
| M07                 | DISTINCT de los departamentos de Bogotá: 7 → 5.                                                                              |
| M09                 | Incluye ORDER BY salario DESC.                                                                                               |
| M10                 | Activos de Bogotá, `(salario + 100000) * 12 AS proyeccion_anual`, ordenado de mayor a menor; se sigue calificando en Oracle. |

Después del segundo error sin acierto se muestra la estructura aproximada antes de la explicación completa.

### 2.9 Home y detalles

- Se quita la duración del video de `VideoPlayer` en todos sus estados, incluido «Video en preparación»; la configuración conserva solo la duración medida como dato del catálogo.
- Nuevo texto de la ruta: 22 lecciones en 8 bloques.
- Consulta del hero con WHERE y ORDER BY.
- La demo muestra «8 de 20 filas».
- Sección AHORA / SIGUIENTE NIVEL / MÁS ADELANTE en lugar de fichas sin contenido.

## 3. Impacto

| Área          | Impacto                                                                                                                       | Mitigación                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lab           | Nuevos diagnósticos, grupos y ejemplos; NULL y fechas en tablas                                                               | Pruebas por diagnóstico; el Oracle real sigue recibiendo solo la sentencia canónica.                                                                            |
| Challenge     | Rúbricas M02, M04, M05, M07, M09 y M10; textos «seis»                                                                         | Pruebas de rúbrica y E2E M01–M10. Las partidas guardadas con v2 se descartan (mecanismo de versión existente).                                                  |
| Sala en vivo  | Ninguno en el esquema ni en la puntuación                                                                                     | Contrato de sala y PGlite sin cambios de lógica.                                                                                                                |
| Oracle        | Esquema v2 aislado; NLS de sesión; fechas y NULL                                                                              | Pruebas del adaptador con driver simulado y reales contra 23ai local y Autonomous 19c.                                                                          |
| Pruebas       | Motor, laboratorio, estudio, exposición, buscador, módulos, misiones y dataset: casi todas las expectativas numéricas cambian | Se reescriben con los valores v2 y se añaden pruebas de contenido (títulos, definiciones, ejemplos válidos, estados futuros, IDs únicos, destinos de búsqueda). |
| Documentación | CONTENT_MAP, DATABASE_SCHEMA, LAB_SPEC, GAME_SPEC, README, CONTINUITY y PROJECT_STATUS                                        | Se actualizan con versión y fecha.                                                                                                                              |

Riesgo principal: producción queda en la versión anterior hasta que el responsable active el esquema v2 y vuelva a desplegar. Mientras tanto, nada se rompe allí. Estado al cierre: v2 activa en producción desde el 26 de septiembre de 2026, con prueba de humo 14/14 ([DEPLOYMENT.md](DEPLOYMENT.md#activación-de-v2-en-producción-26-de-septiembre-de-2026)); v1 queda como vuelta atrás.

## 4. Ejecución y verificación (25 de septiembre de 2026)

Todo lo decidido arriba está implementado en la rama `claude-finish-20260923`. Desviaciones y hallazgos respecto del plan:

| Tema                           | Resultado                                                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Temas futuros                  | Son **46**, no 44: el Nivel 2 tiene 16 temas (incluye «Operaciones con fechas») y el Nivel 5, 4. El informe anterior los contó mal; la documentación usa la cifra real.                                                                                                 |
| Oracle v2                      | Esquemas `SQL_LAB_V2_OWNER` y `SQL_LAB_V2_READER` creados de forma aditiva en Oracle local 23ai y Oracle Cloud 19c; v1 intacta (6 filas) en ambos. Columnas, tipos, nulabilidad, restricciones y las 20 filas verificados contra el dataset canónico.                   |
| Integración real               | `tests/integration/oracle-real.test.ts`: 102/102 en local y 102/102 en la nube. Compara con Oracle cada consulta de las 22 lecciones, de las 29 escenas, LAB01–LAB24 y 64 consultas por concepto (encabezados, tipos, filas y orden entre empates).                     |
| Bug del adaptador              | Oracle escribe los decimales menores que 1 sin cero inicial (`.1`) y el adaptador no los convertía en número. Corregido con prueba.                                                                                                                                     |
| Bug del progreso               | La visita a una lección no se guardaba: el efecto del hijo registraba la visita en el mismo ciclo en que el proveedor terminaba de leer, y la marca `dirty` se perdía. Ahora se compara con el último estado guardado. Hay una prueba que falla con la lógica anterior. |
| Bug de retorno del laboratorio | `safeLabReturn` solo admitía las escenas 1–16 y las 9 lecciones antiguas; ahora se deriva de las 29 escenas y las 22 lecciones.                                                                                                                                         |
| Diagnóstico                    | La corrección queda plegada tras la pista («no regalar la respuesta»); SELECT faltante propone la corrección.                                                                                                                                                           |
| Reflujo con zoom 200 %         | Las páginas nuevas desbordaban a 180 px (rejillas sin columna explícita, el campo de la mini comprobación y palabras largas). Corregido en estilos.                                                                                                                     |
| Exposición                     | La escena 21 mostraba 12 columnas cortadas en el paso FROM: ahora muestra la tabla de origen con las columnas que usará la consulta. La escena 18 muestra la consulta `IS NULL`.                                                                                        |
| Duración de los videos         | Retirada también del estado «Video en preparación».                                                                                                                                                                                                                     |
