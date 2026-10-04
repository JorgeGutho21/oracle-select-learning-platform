# ORACLE_VALIDATION — Validación del contenido en Oracle real (Fase 4)

Fecha de la última verificación: 4 de octubre de 2026. Motor: **Oracle Database 23.26.3.0.0** (Oracle Database Free, imagen `gvenzl/oracle-free:23-slim-faststart`, servicio `FREEPDB1`, puerto local 1522).

## 1. Qué se ejecutó en Oracle

| Contenido                                                                              | Prueba                                                             | Resultado (4-oct-2026)                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 102 ejemplos de la Sección 2                                                           | `tests/integration/curriculum-oracle.test.ts`                      | Ejecutados; resultados guardados y comparados                         |
| 77 ejemplos de la Sección 3 (bloques, procedimientos, funciones, paquetes, triggers)   | ídem                                                               | Ejecutados; los 9 recorridos paso a paso imprimen lo mismo que Oracle |
| 9 ejemplos de «Funciones de una fila» (Sección 1)                                      | ídem (cuenta lectora de `empleados-select-v2`)                     | Ejecutados                                                            |
| 34 consultas y bloques propios del banco (S2-B-_, S3-B-_)                              | ídem                                                               | Ejecutados                                                            |
| **Total del currículo**                                                                | `curriculum-oracle.test.ts`                                        | **222 resultados verificados**                                        |
| Sección 1: lecciones, escenas, laboratorio, misión M10                                 | `tests/integration/oracle-real.test.ts`                            | En verde                                                              |
| Banco de la Sección 1: 78 comprobaciones                                               | `tests/integration/bank-oracle.test.ts`                            | 78/78                                                                 |
| Bancos de las secciones 2 y 3                                                          | Toman cada tabla, salida o error de los 222 resultados verificados | Derivados de Oracle                                                   |
| Notas de conceptos de la Sección 1 (`'A' \|\| NULL \|\| 'B'`, `SELECT 2 * 3` sin FROM) | Consulta directa en Oracle 23.26                                   | Confirmadas                                                           |

## 2. Procedimiento

1. Levantar Oracle (`npm run oracle:up`) y crear las cuentas (`npm run oracle:setup`). La configuración crea:
   - `SQL_LAB_V2_OWNER`, dueño de `empleados-select-v2`;
   - `SQL_LAB_V2_READER`, solo lectura;
   - el esquema de verificación `DBLAB_CURRICULO`, con permisos para crear tablas, procedimientos, triggers, secuencias y vistas, y cuota de 20 MB.

   Las credenciales quedan en `.env.local` y `.env.oracle.local`, que no se versionan.

2. Sesión: `NLS_DATE_FORMAT='YYYY-MM-DD'`, `NLS_NUMERIC_CHARACTERS='.,'`, `NLS_SORT=BINARY`, `NLS_COMP=BINARY`.
3. Para cada bloque PL/SQL, el runner (`tests/support/oracle-curriculum.ts`) hace lo siguiente:
   - borra los objetos del esquema (salvo las secuencias `ISEQ$$` de las columnas identidad);
   - recrea `empresa-relacional-v1`;
   - compila la preparación (si no compila, la prueba falla con el error);
   - lee las tablas «antes»;
   - activa DBMS_OUTPUT, ejecuta el bloque y recoge la salida;
   - lee las tablas «después» y hace ROLLBACK.
4. Los errores de compilación se leen de `USER_ERRORS` en formato SHOW ERRORS (`línea/columna PLS-…`).
5. Para regenerar los resultados se ejecuta `CURRICULUM_UPDATE=1 npx vitest run tests/integration/curriculum-oracle.test.ts`. Sin esa variable, la prueba compara.

## 3. Comprobación cruzada sin Oracle

`tests/integration/curriculum-postgres.test.ts` corre siempre, sin Oracle. Ejecuta en PostgreSQL (PGlite) cada consulta del currículo que no usa construcciones propias de Oracle (SYSDATE, DUAL, `||`, DECODE…), con MINUS traducido a EXCEPT y NVL a COALESCE. Exige el mismo resultado que Oracle y comprueba que las filas de origen visibles bastan para obtenerlo.

Es una red de seguridad: no sustituye a Oracle.

## 4. Diferencias de versión que el contenido refleja

- JOIN sin ON: Oracle 23 responde **ORA-02000**. El contenido lo dice y menciona que 19c respondía ORA-00905.
- Oracle 23ai acepta `SELECT expresión` sin FROM. La ficha de FROM lo explica sin cambiar la regla de 19c para leer tablas.
- ORA-00979 tiene en 23 un texto distinto del de 19c. La interfaz muestra el mensaje textual de Oracle 23.

## 5. Lo que no se probó

- **Oracle 19c / Autonomous Database: NOT TESTED.** Las referencias citan la documentación 19c, pero la ejecución fue en Oracle 23.26.
- **Enlaces profundos a docs.oracle.com: NOT TESTED.** El proxy del entorno bloquea docs.oracle.com; las referencias apuntan a la raíz de cada libro (SQL Language Reference y PL/SQL Language Reference 19c) con el nombre del capítulo.
- **Ejecución de PL/SQL escrito por estudiantes: no existe.** La plataforma muestra resultados verificados; nunca presenta una simulación como ejecución real.
- La Sección 2 y la Sección 3 en navegadores Edge y WebKit: **NOT TESTED** (solo Chromium en este entorno).
