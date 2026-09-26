# LAB_SPEC — Laboratorio de Oracle SQL real

Versión 2.0 (25 de septiembre de 2026) · Requisito P08. Datos en [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). La 2.0 amplía el subconjunto a WHERE y ORDER BY, pasa al dataset `empleados-select-v2` y reorganiza el diagnóstico en cinco grupos.

## Qué significa ejecución real

El estudiante escribe SQL. El servidor valida un subconjunto permitido y lo ejecuta en un motor Oracle conectado al dataset educativo. El navegador no se conecta directamente a Oracle y no recibe sus credenciales.

El laboratorio tiene dos acciones distintas:

- **«Analizar»:** usa el motor educativo de `src/domain/sql`. Da la vista previa, la traducción, la anatomía y el diagnóstico, y está rotulada «Vista previa educativa · No es una ejecución en Oracle».
- **«Ejecutar en Oracle»:** envía la sentencia al motor real.

Si Oracle no está disponible, se dice. Nunca se sustituye en silencio la ejecución real por un resultado simulado. `tests/integration/oracle-real.test.ts` comprueba que ambos devuelven lo mismo sobre las consultas del contenido.

## Interfaz

Seis paneles:

1. **Esquema:** columnas, tipo y «admite NULL», con la tabla EMPLEADOS de 20 filas y resaltado de las columnas que lee la consulta, incluidas las de WHERE.
2. **Editor:** CodeMirror, ejemplos en grupos, Analizar (Ctrl+Enter), Ejecutar en Oracle y Restablecer.
3. **Resultado:** vista previa educativa y ejecución en Oracle, cada una rotulada.
4. **En lenguaje cotidiano:** traducción de la consulta, con el recorrido lógico FROM → WHERE → SELECT → DISTINCT → ORDER BY.
5. **Anatomía:** cada parte coloreada con su función.
6. **Diagnóstico.**

Estados: vacío, editando, analizada (válida o con errores), ejecutando, resultado de Oracle, error ORA, rechazada, servicio no disponible. Un resultado previo queda identificado como anterior si la consulta cambia.

## Subconjunto SELECT v2

| Elemento | Permitido |
|---|---|
| Sentencia | Una sola consulta: `SELECT [DISTINCT] lista FROM empleados [WHERE condición] [ORDER BY criterios]`. Espacios, saltos de línea, mayúsculas y minúsculas, comentarios `--` y un `;` final se toleran. |
| Proyección | `*` solo, o de 1 a 12 columnas o expresiones separadas por comas. |
| Origen | `FROM empleados`, sin alias de tabla, esquema ni enlaces. |
| Columnas | ID_EMPLEADO, NOMBRE, APELLIDO, CARGO, DEPARTAMENTO, CIUDAD, SALARIO, BONO, FECHA_INGRESO, ESTADO, CORREO, ID_JEFE. |
| Expresiones | `+ - * /`, signo unario y paréntesis (hasta 8 niveles); textos entre comillas simples (`''` escapa una comilla; `''` vacío es NULL como en Oracle); `NULL`; literales `DATE 'AAAA-MM-DD'`; concatenación con `\|\|`. |
| Alias | Con AS o implícito. Sin comillas: empieza por letra, usa letras, dígitos y `_`, y no es palabra reservada. Entre comillas dobles: conserva mayúsculas, espacios y tildes. |
| DISTINCT | Justo después de SELECT; compara la fila completa. |
| WHERE | Comparaciones `= <> != ^= < <= > >=` entre números, textos o fechas; `[NOT] BETWEEN … AND …`; `[NOT] IN (…)` con hasta 20 valores; `[NOT] LIKE 'patrón'` con `%` y `_`; `IS [NOT] NULL`; `NOT`, `AND`, `OR` y paréntesis, con precedencia NOT > AND > OR. |
| ORDER BY | Hasta 6 criterios: columna, expresión, alias del SELECT o posición (`ORDER BY 2`), cada uno con `ASC` (por defecto) o `DESC` y opcionalmente `NULLS FIRST` o `NULLS LAST`. |

Queda fuera del subconjunto, aunque sea válido en Oracle: funciones (UPPER, ROUND, SYSDATE, NVL…), agregación y GROUP BY/HAVING, JOIN, subconsultas, UNION, WITH, `LIKE … ESCAPE`, pseudocolumnas, DUAL, catálogos y bloqueos. Reciben el mensaje «es SQL válido en Oracle, pero se estudia en el Nivel N de esta plataforma», con enlace a su ficha en Próximamente, nunca «Oracle no lo soporta». INSERT, UPDATE, DELETE, COMMIT, ROLLBACK, DDL y PL/SQL no se ejecutan jamás.

## Semántica que se conserva (igual en el motor y en Oracle)

- **Columnas:** el orden es el de la proyección. `*` devuelve las 12 del esquema. AS cambia el encabezado, no la tabla.
- **Encabezados sin alias:** son la expresión en mayúsculas sin espacios, por ejemplo `SALARIO*12` o `NOMBRE||''||APELLIDO`. Los alias sin comillas se muestran en mayúsculas.
- **Lógica de tres valores:** una comparación con NULL es desconocida y la fila no pasa WHERE. `= NULL` no devuelve filas. `NOT IN` con un NULL en la lista no devuelve filas. `x NOT IN (…)` descarta las filas donde x es NULL.
- **Operaciones con NULL:** `salario + bono` es NULL si BONO es NULL. `'Ana' || NULL` es `'Ana'`.
- **Textos:** se comparan exactamente (orden BINARY): `'bogota'` no es `'Bogotá'` y `LIKE 'a%'` no encuentra «Ana».
- **BETWEEN:** incluye los dos límites. Con los límites al revés no devuelve filas.
- **ORDER BY:** NULL va al final en ASC y al principio en DESC, salvo NULLS FIRST o LAST. Entre filas empatadas cualquier orden es válido. Un alias del SELECT tiene prioridad sobre una columna de igual nombre (verificado en Oracle). Con DISTINCT, el criterio debe estar en el SELECT (regla de Oracle).
- **Sin ORDER BY** no se promete orden. La consulta enviada a Oracle nunca añade un ORDER BY oculto.
- **Números:** conservan su precisión. Un decimal que no cabe en un número de JavaScript, como `bono / salario`, se conserva con los dígitos de Oracle; Oracle escribe `.1` sin cero inicial y el adaptador lo convierte en `0.1`. Las fechas se muestran como `AAAA-MM-DD`.

## Ejemplos LAB01–LAB24

| Id | Grupo | Consulta | Resultado verificado en Oracle |
|---|---|---|---|
| LAB01 | Proyección | `SELECT * FROM empleados;` | 20 filas × 12 columnas |
| LAB02 | Proyección | `select ciudad, nombre from EMPLEADOS` | 20 × 2, en ese orden |
| LAB03 | Proyección | `SELECT nombre, salario * 12 AS salario_anual FROM empleados;` | Ana 108000000 |
| LAB04 | Proyección | `(salario + bono) * 12 AS total_anual` | NULL donde BONO es NULL |
| LAB05 | Proyección | `nombre \|\| ' ' \|\| apellido AS nombre_completo, cargo` | «Ana Rojas» |
| LAB06 | Proyección | `SELECT DISTINCT ciudad FROM empleados;` | 5 ciudades |
| LAB07 | Proyección | `SELECT DISTINCT ciudad, departamento FROM empleados;` | 16 pares |
| LAB08 | Filtros | `WHERE ciudad = 'Cali'` | 5 filas |
| LAB09 | Filtros | `WHERE salario >= 5000000` | 7 filas |
| LAB10 | Filtros | `WHERE (ciudad = 'Bogotá' OR ciudad = 'Medellín') AND salario > 5000000` | 6 filas |
| LAB11 | Filtros | `WHERE salario BETWEEN 3000000 AND 6000000` | 12 filas (límites incluidos) |
| LAB12 | Filtros | `WHERE ciudad IN ('Bogotá', 'Medellín', 'Cali')` | 17 filas |
| LAB13 | Filtros | `WHERE nombre LIKE '%ar%'` | 6 filas |
| LAB14 | Filtros | `WHERE fecha_ingreso >= DATE '2022-01-01'` | 5 filas |
| LAB15 | NULL y orden | `WHERE bono IS NULL` | 6 filas |
| LAB16 | NULL y orden | `ORDER BY salario DESC` | Ana primero; empates de 4200000 y 3500000 |
| LAB17 | NULL y orden | `ORDER BY departamento ASC, salario DESC` | Finanzas primero |
| LAB18 | Integración | Activos de Bogotá con salario entre 3 y 6 millones, `ORDER BY salario DESC` | Laura, Andrés, Mario |
| LAB19 | Errores | `SELECT nombre salario FROM empleados;` | Válida: una columna SALARIO (ADVERTENCIA de coma olvidada) |
| LAB20 | Errores | `WHERE ciudad = Bogotá;` | SINTAXIS: texto sin comillas; no llega a Oracle |
| LAB21 | Errores | `WHERE bono = NULL;` | Válida, 0 filas (ADVERTENCIA: usar IS NULL) |
| LAB22 | Errores | `WHERE salario BETWEEN 6000000 AND 3000000;` | Válida, 0 filas (ADVERTENCIA: límites al revés) |
| LAB23 | Errores | `WHERE ciudad IN 'Bogotá', 'Cali';` | SINTAXIS: IN sin paréntesis |
| LAB24 | Errores | `WHERE estado = 'ACTIVO' OR departamento = 'TI' AND salario > 5000000;` | Válida (ADVERTENCIA: precedencia AND/OR) |

La integración ejecuta en Oracle todos los ejemplos válidos, 64 consultas por concepto y todas las consultas del Estudio y de la Exposición, y exige que Oracle devuelva exactamente lo mismo que el motor: encabezados, tipos, filas y orden. Los ejemplos con errores de sintaxis deben quedar rechazados sin llegar a Oracle.

## Diagnóstico pedagógico

Cada mensaje pertenece a uno de cinco grupos visibles, con texto y color:

| Grupo | Significa | Ejemplos |
|---|---|---|
| SINTAXIS | La consulta no está bien escrita y no se puede ejecutar. | SELECT faltante, FROM faltante, coma sobrante, texto sin comillas, IN sin paréntesis, patrón de LIKE sin comillas, ORDER sin BY, `==` |
| SEMÁNTICA | Está bien escrita, pero usa algo que no existe o no encaja. | columna o tabla desconocida (con sugerencia), texto en aritmética, fecha frente a texto |
| ALCANCE EDUCATIVO | SQL de Oracle que esta unidad todavía no enseña o no permite. | UPPER, GROUP BY, JOIN, INSERT, DELETE, varias sentencias |
| ORACLE | Regla propia de Oracle que la base rechazaría. | alias en WHERE, ORDER BY no seleccionado con DISTINCT, posición de ORDER BY inexistente |
| ADVERTENCIA | Se ejecuta, pero quizá no es lo que buscas. | coma olvidada (alias implícito), `= NULL`, BETWEEN al revés, AND/OR sin paréntesis, LIKE sin comodines, mayúsculas o tildes que dejan el resultado vacío, AND contradictorio |

Cada tarjeta muestra:

- El grupo, la línea y la columna.
- Lo encontrado (la línea con el problema) y qué significa.
- La pista.
- La explicación del grupo.
- «Ver la posible corrección», plegada: la línea corregida y el botón «Aplicar la corrección», que reanaliza.
- «Ver un ejemplo correcto».
- Si el tema es de un nivel futuro, «Ver en Próximamente: TEMA · Nivel N», con enlace a `/modules#tema-<slug>`.

La corrección no se muestra de entrada: primero la pista.

Solo se muestra un código ORA si Oracle lo devuelve (por ejemplo, ORA-01476 al dividir entre cero). Los errores detectados antes tienen códigos propios.

## Validación y aislamiento

1. Límites: 4000 caracteres, 500 tokens, 12 elementos de salida, 8 niveles de paréntesis, 20 valores en IN y 6 criterios de orden.
2. El análisis construye un árbol sintáctico completo. Hay una lista positiva de construcciones y nombres. Un prefijo SELECT o una expresión regular no bastan.
3. Se rechazan los tokens sobrantes y las sentencias múltiples, también las ocultas tras comentarios.
4. La sentencia enviada a Oracle se construye desde el árbol (`renderStatement`). Tablas y columnas salen del catálogo y los textos se reescriben con comillas seguras. No se concatenan fragmentos sin analizar.
5. Cuenta lectora propia: `SQL_LAB_V2_READER`, con solo `CREATE SESSION` y `READ` sobre `SQL_LAB_V2_OWNER.EMPLEADOS`. Nunca propietario, ADMIN, SYSTEM ni SYS. La salud comprueba los privilegios efectivos.
6. Límites de ejecución: grupo de 10 conexiones, cola de 60 y plazo total de 5 s desde la recepción. Máximo 100 filas y 100 KB; si se superan, no se muestra ni se califica.
7. La conexión se libera siempre. Si el plazo se agota o la conexión falla, se retira del grupo.

## Corrección del SQL escrito en misiones

Tres capas: estructura permitida, requisitos pedagógicos explícitos y salida real. Nunca se compara la cadena.

El comparador exige los mismos encabezados en el mismo orden, tipos compatibles y el mismo multiconjunto de filas. Si el pedido indica un orden, las filas deben seguirlo; entre empates, cualquier orden vale. Se acepta una expresión equivalente, como `12 * (100000 + salario)`, o un orden equivalente, como `ORDER BY 3 DESC`. M10 se califica con la salida real de Oracle ([GAME_SPEC.md](GAME_SPEC.md)).

## Criterios de aceptación

- **LAB11:** todos los ejemplos válidos LAB01–LAB24 dan en Oracle lo mismo que el motor, con tipos. Los inválidos no llegan a Oracle.
- **LAB12:** espacios, mayúsculas, comentarios y el terminador no cambian el resultado.
- **LAB13:** los datos y los permisos quedan intactos tras intentos de escritura, funciones o varias sentencias. Un `UPDATE` directo con la cuenta lectora devuelve ORA-01031 u ORA-41900.
- **LAB14:** fallos, plazos y saturación no filtran credenciales ni agotan el grupo de conexiones.
- **LAB15:** el mismo contenido en otro orden de filas es equivalente; quitar una fila no lo es.
- **LAB16:** una consulta válida que no responde al pedido recibe feedback del objetivo, separado del diagnóstico.
- **LAB17:** cada diagnóstico tiene grupo, posición, fragmento, explicación y, cuando existe, corrección aplicable. Los temas futuros enlazan con su ficha.

Todos se verifican en `tests/unit/sql/*`, `tests/integration/oracle-real.test.ts` (102 casos, Oracle local 23ai y Oracle Cloud 19c) y `tests/e2e/lab.spec.ts` y `oracle-real.spec.ts`.

## Implementación

- **Adaptador:** `OracledbQueryExecutor` (`src/infrastructure/oracle`) con `oracledb` 7 en modo Thin, compuesto solo en el servidor (`server-only`). Configuración en [ORACLE_SETUP.md](ORACLE_SETUP.md).
- **Sesión:** cada sesión fija `NLS_DATE_FORMAT`, `NLS_SORT` y `NLS_COMP` y, si hay `ORACLE_SCHEMA`, `CURRENT_SCHEMA`.
- **Salud:** exige que EMPLEADOS coincida fila a fila con `empleados-select-v2`.
- **NUMBER:** se lee como texto decimal y se convierte en número solo si no pierde precisión.
- **Arranque:** el servidor crea el grupo y comprueba la salud al iniciar (`src/instrumentation.ts`).
