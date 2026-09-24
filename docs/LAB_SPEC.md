# LAB_SPEC — Laboratorio de Oracle SQL real

Versión 1.1 · Requisito P08. Datos en [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). La 1.1 añade la [implementación](#implementación-fase-8) del adaptador Oracle real.

## Qué significa ejecución real

El estudiante escribe SQL; el servidor valida un subconjunto permitido y lo ejecuta en un motor Oracle conectado a un dataset educativo. Los resultados del editor proceden de ese motor. El navegador no se conecta directamente a Oracle y no recibe sus credenciales.

La animación de una lección puede utilizar resultados didácticos previamente verificados, rotulados como «Ejemplo». El botón «Ejecutar» del laboratorio nunca sustituye silenciosamente Oracle por un resultado simulado. La disponibilidad de una instancia Oracle conectable es condición de lanzamiento, detallada en ROADMAP.

## Interfaz mínima

Fuente EMPLEADOS con seis registros, esquema legible, editor, Ejecutar, Restablecer ejemplo, resultado, traducción al español y anatomía de consulta. Mostrar versión de dataset en información del laboratorio. No crear explorador de archivos, múltiples pestañas de base de datos, administración SQL o consola de escritura.

Estados: vacío; editando; validando; ejecutando; correcto; error de SQL; fuera de alcance; ocupado; servicio no disponible. Un resultado previo permanece identificable como anterior durante una nueva ejecución y no se presenta como salida del SQL modificado.

## Subconjunto SELECT v1

| Elemento | Permitido y comportamiento |
|---|---|
| Sentencia | Una sola consulta SELECT sobre EMPLEADOS. Se toleran espacios, saltos de línea, mayúsculas/minúsculas y un punto y coma final. |
| Proyección | Asterisco solo, o lista de 1–12 columnas/expresiones separadas por comas. El asterisco sin calificador no se mezcla con otros elementos en v1. |
| Origen | FROM empleados, sin alias de tabla, nombres de esquema ni enlaces de base de datos. El servidor resuelve a la tabla autorizada. |
| Columnas | ID, NOMBRE, EDAD, CIUDAD, SALARIO y DEPTO. Identificadores no entrecomillados. |
| Aritmética | +, -, *, /, signos unarios y paréntesis sobre columnas numéricas y números decimales simples. Multiplicación y división preceden a suma y resta. |
| Literales numéricos | Enteros o decimales con punto; máximo 12 dígitos enteros y 4 decimales en el texto introducido. Sin moneda, separadores de miles ni notación científica en v1. |
| Alias de columna | AS explícito recomendado; alias implícito válido también aceptado. No entrecomillado: letras ASCII iniciales, letras/dígitos/guion bajo, hasta 30 caracteres y sin palabras reservadas. Con comillas dobles: etiqueta de 1–40 caracteres alfanuméricos, espacios, guion o guion bajo, incluyendo tildes. |
| DISTINCT | Opcional inmediatamente después de SELECT; compara la combinación completa de valores de salida. |
| Comentarios | Solo comentarios de línea con `--`, reconocidos por el analizador. Bloques de comentarios y directivas de optimización quedan fuera del subconjunto. |

No admitir funciones, concatenación, literales de texto independientes, parámetros suministrados por el usuario, DUAL, pseudocolumnas, secuencias, subconsultas, UNION, WITH, consultas de catálogo, llamadas a paquetes ni cláusulas de bloqueo. Las construcciones futuras, aunque sean válidas en Oracle, reciben «SQL válido fuera del alcance de esta unidad», no «Oracle no lo soporta». DDL, DML y PL/SQL no se ejecutan.

Se adopta sintaxis compatible con Oracle 19c para este curso; FROM es requisito de este subconjunto sobre una tabla, sin formular una regla universal para todas las versiones y formas posibles de SELECT.

## Semántica que debe conservarse

El orden de las columnas es el escrito en la proyección. La multiplicidad de filas se conserva salvo DISTINCT. AS etiqueta la salida y no cambia el esquema. En esta tabla todas las columnas son visibles y * devuelve seis. Oracle documenta alias y deduplicación por todos los valores seleccionados. [Oracle SELECT](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html).

Sin ORDER BY, la interfaz y el evaluador no prometen orden de filas. Si una lección presenta filas en un orden didáctico, lo señala como orden de visualización. La consulta enviada a Oracle no incorpora un ORDER BY oculto para hacer pasar pruebas.

Valores numéricos se devuelven con precisión decimal preservada, no mediante redondeo binario arbitrario. Metadatos distinguen tipos numéricos de texto. Los números pueden mostrarse con formato colombiano sin modificar su valor de evaluación. Cualquier límite de decimales visibles se indica como formato y permite consultar el valor completo.

Alias no entrecomillados se comparan normalizados a mayúsculas; los entrecomillados conservan caja y espacios. Por ejemplo, SALARIO_ANUAL y `salario_anual` sin comillas representan la misma etiqueta; `"Salario anual"` es otra etiqueta. Una misión que exige SALARIO_ANUAL debe decirlo explícitamente.

## Ejemplos y salidas de aceptación

| Caso | Entrada didáctica | Salida esperada |
|---|---|---|
| LAB01 | `SELECT * FROM empleados;` | Seis columnas en orden del esquema, seis filas. |
| LAB02 | `select ciudad, nombre from EMPLEADOS` | Dos columnas en ese orden, seis filas. |
| LAB03 | `SELECT nombre, salario * 12 AS salario_anual FROM empleados;` | Seis pares, con Ana 36000000 y Carlos 60000000. |
| LAB04 | `SELECT DISTINCT ciudad FROM empleados;` | Tres ciudades, sin dependencia del orden de filas. |
| LAB05 | `SELECT DISTINCT ciudad, depto FROM empleados;` | Cinco pares del CONTENT_MAP. |
| LAB06 | `SELECT salario + 100000 * 12 AS total FROM empleados;` | Para Ana, 4200000. |
| LAB07 | `SELECT (salario + 100000) * 12 AS total FROM empleados;` | Para Ana, 37200000. |
| LAB08 | `SELECT salario / 2 AS mitad FROM empleados;` | Ana 1500000, Pedro 900000. |
| LAB09 | `SELECT nombre AS "Nombre empleado" FROM empleados;` | Etiqueta exacta Nombre empleado, seis valores de texto. |
| LAB10 | `SELECT nombre salario FROM empleados;` | Consulta válida: una columna NOMBRE con alias SALARIO. No inventar error por una coma ausente. Si el ejercicio pedía dos columnas, falla su objetivo semántico. |

## Validación y aislamiento

1. Limitar entrada a 4000 caracteres, 500 tokens, doce elementos de salida y ocho niveles de paréntesis.
2. Analizar la consulta completa en un árbol sintáctico. Lista positiva de construcciones y nombres. Un prefijo SELECT o una expresión regular aislada no bastan.
3. Rechazar tokens remanentes y múltiples sentencias, incluyendo los ocultos tras comentarios. Retirar únicamente el terminador final admitido antes de pasar al driver.
4. Construir la sentencia de ejecución desde el árbol validado. Los únicos identificadores de tabla y columna proceden del catálogo permitido; las etiquetas se serializan de forma segura. No concatenar fragmentos sin analizar.
5. Ejecutar con usuario lector específico en esquema educativo. No usar propietario, SYSTEM, SYS ni permisos generales. El servicio solo alcanza esa base.
6. Aplicar límites de tiempo total, conexiones y tamaño de respuesta. Límite de 100 filas y 100 KB; si se alcanzara en una versión futura, indicarlo y no calificar un resultado truncado.
7. Liberar/cancelar conexiones incluso en fallo. Una sesión que no pueda cancelarse con certeza se retira del grupo antes de reutilizarla.

Valores iniciales propuestos: una ejecución activa por identidad, 20 solicitudes/minuto por identidad, grupo de diez conexiones y máximo 60 peticiones en espera; plazo total cinco segundos desde la recepción, incluyendo cola. El límite agregado por red debe tolerar al menos la prueba de 60 estudiantes con una misma salida a Internet. Ajustar recursos con mediciones, sin relajar aislamiento ni plazos.

Las tablas de aplicación nunca están disponibles para el editor. Se revisan permisos efectivos de la cuenta Oracle y permisos heredados; no basta con declarar la intención de lectura.

## Corrección del SQL escrito en misiones

Se valida por tres capas: estructura permitida; requisitos pedagógicos explícitos; salida real sobre el dataset versionado. Nunca se compara solo la cadena literal contra una solución.

Comparador: encabezados según la rúbrica, mismo número y orden de columnas, tipos compatibles, multiconjunto de filas que preserve repeticiones y números decimales equivalentes. No ignorar duplicados salvo que el resultado esperado ya los haya eliminado. No quitar tildes de los datos ni de alias entrecomillados.

La misión puede exigir uso explícito de AS o DISTINCT y una expresión basada en SALARIO. Si lo exige, se anuncia en el enunciado y se comprueba en el árbol. Esto evita que un resultado accidentalmente coincidente demuestre una habilidad que no se utilizó. Una expresión equivalente, como 12 * salario, se acepta cuando cumple los mismos requisitos.

Ejecutar una consulta y evaluar un intento son operaciones distintas. En el laboratorio no se generan puntos. En M10, «Enviar para evaluar» usa Oracle y cuenta como intento solo cuando recibe una corrección académica, no ante fallos del servicio.

## Errores y mensajes

| Categoría | Ejemplo | Respuesta |
|---|---|---|
| Sintaxis | `SELECT nombre, FROM empleados;` | Falta una columna o expresión después de la coma; indicar ubicación. |
| Identificador | `SELECT sueldo FROM empleados;` | SUELDO no pertenece a EMPLEADOS; mostrar columnas disponibles. |
| Tabla | `SELECT * FROM usuarios;` | Tabla no disponible en este laboratorio. |
| Operación | `SELECT salario / 0 FROM empleados;` | No se puede dividir entre cero; no mostrar resultado parcial. |
| Alcance futuro | Consulta con WHERE o JOIN. | Concepto reservado a una unidad futura; editor intacto. |
| Seguridad | Varias sentencias o llamada a paquete. | Consulta no permitida; ninguna sentencia llega al motor. |
| Infraestructura | Oracle caído, cola llena o plazo excedido. | Explicar que no se pudo ejecutar; conservar consulta y no descontar intentos. |

Solo mostrar un código ORA si realmente lo devuelve Oracle; los errores detectados antes tienen códigos propios de validación. No devolver detalles internos de conexión.

## Criterios de aceptación adicionales

- LAB11: todos los casos LAB01–LAB10 se ejecutan contra la instancia objetivo, con evidencia de valores y metadatos.
- LAB12: variantes de espacios, caja, comentarios permitidos y terminador final no cambian semántica.
- LAB13: datos y permisos permanecen intactos tras intentos de escritura, llamadas a funciones y múltiples sentencias.
- LAB14: fallos, cancelación y saturación no filtran credenciales ni agotan permanentemente el grupo de conexiones.
- LAB15: dos respuestas con igual contenido en distinto orden de filas son equivalentes; eliminar una fila repetida sin DISTINCT produce resultado distinto.
- LAB16: una consulta válida que no satisface el pedido recibe feedback de objetivo, separado del diagnóstico del motor.

## Implementación (Fase 8)

Adaptador `OracledbQueryExecutor` (`src/infrastructure/oracle`) con el driver oficial `oracledb` 7.0.1 en modo Thin, compuesto solo en el servidor (`src/composition/oracle/oracle-server.ts`, marcado `server-only`). Configuración por entorno y pasos de instalación en [ORACLE_SETUP.md](ORACLE_SETUP.md).

| Regla de esta especificación | Cómo se cumple |
|---|---|
| Validación previa y sentencia desde el árbol (pasos 1–4) | `executeOnOracle` analiza con el motor único de `src/domain/sql` y envía `renderStatement`; lo rechazado no llega al driver. `- -SALARIO` se escribe con espacio para que Oracle no lo lea como comentario `--`. |
| Cuenta lectora (paso 5) | Se rechazan SYS, SYSTEM y demás cuentas administrativas, y que la lectora sea la propietaria. La salud comprueba privilegios efectivos: solo `CREATE SESSION`, sin tablas propias y solo lectura sobre `EMPLEADOS`. |
| Límites (paso 6) | Grupo de 10 conexiones, cola de 60 y plazo total de 5 s que incluye la espera (`queueTimeout` y `callTimeout`). Se piden 101 filas: con más de 100 o más de 100 KB no se muestra ni se califica. |
| Arranque | El servidor crea el grupo y comprueba la salud al iniciar (`src/instrumentation.ts`): la primera consulta no agota el plazo por la conexión inicial. |
| Liberación (paso 7) | La conexión se devuelve siempre; si el plazo se agota o la conexión falla, se retira del grupo (`drop`). |
| Precisión decimal | `NUMBER` se lee como texto decimal y se convierte a número solo si no pierde precisión; si no, se conserva el texto exacto. |
| Errores | Código ORA real con mensaje pedagógico (por ejemplo `ORA-01476`); conexión, credenciales, cola y plazo son «servicio no disponible», sin detalles internos y sin consumir intentos. |
| Dataset | Salud: `EMPLEADOS` debe coincidir fila a fila con `empleados-select-v1`. Script de carga versionado en `oracle/empleados-select-v1.sql`. |
