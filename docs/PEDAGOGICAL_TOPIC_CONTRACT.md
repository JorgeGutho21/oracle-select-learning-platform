# Contrato pedagógico de un tema

Derivado del Estudio y la Exposición de S1: definir una pieza, identificar el problema y los datos, leer la sintaxis, anticipar el resultado, observar el cambio y comprobarlo. Se conserva S1; no se impone un número arbitrario de escenas a S2/S3.

Cada tema responde: qué es, para qué sirve, qué problema resuelve, qué debe saber el estudiante, qué tablas/columnas usa, cómo se relacionan, cuál es la sintaxis, el ejemplo mínimo, la aplicación al dataset, qué hace cada parte, el resultado real, qué cambió, qué recordar, qué error evitar, cómo corregirlo y cómo practicar/comprobar.

Secuencia: **definición → modelo mental → datos → sintaxis → microejemplo → ejemplo del dataset → resultado → explicación → error → práctica → comprobación**. La comprobación puede usarse también como predicción, como en S1; nunca sustituye la explicación posterior.

## Capas y fuente única

`domain/pedagogy.ts` contiene el contrato y 53 modelos mentales específicos. Genera definiciones, orientación, sintaxis, explicación y comprobación alrededor de ejemplos existentes. Las definiciones salen de las fichas curriculares únicas.

`domain/micro-examples.ts` añade 51 microejemplos ejecutables; las primeras dos lecciones PL/SQL reutilizan el saludo mínimo. Cada microejemplo tiene una lectura específica de sus líneas. Oracle produjo sus resultados en el esquema local aislado: **273 ejemplos ejecutados, 273 PASS el 4 de octubre de 2026**, Oracle Database 23.26.3.0.0. No se redactan salidas ni se presenta el paso a paso como ejecución nueva del navegador.

Aplicación combina contrato/diccionario/verificación con las vistas; presentación muestra tablas semánticas/código/salida/errores/actividades; composición conserva progreso y puntuación. S2 presenta las cinco tablas, propósito, PK/FK, relaciones, columnas y primeras filas antes del JOIN. S3 define PL/SQL y comienza con un saludo sin variables, SELECT INTO ni IF. El error de columna ambigua se estudia después del modelo de JOIN y ON. Los integradores permanecen disponibles; ampliaciones se revelan gradualmente.

## Oracle y precisión

Sintaxis compatible con 19c. Se consultó además documentación oficial actual, con paráfrasis y sin copiar capítulos:

- [JOIN](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Joins.html): condiciones, ambigüedad y filas sin pareja.
- [Cursores](https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/cursors-overview.html), [OPEN](https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/OPEN-statement.html), [FETCH](https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/FETCH-statement.html), [CLOSE](https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/CLOSE-statement.html): ciclo de vida antes de un bucle completo.
- [CREATE TRIGGER](https://docs.oracle.com/en/database/oracle/oracle-database/26/lnpls/CREATE-TRIGGER-statement.html): evento, momento y nivel antes de la reacción automática.
- [SQL Reference 23c](https://docs.oracle.com/cd/F82042_01/sqlrf/sql-language-reference.pdf): BOOLEAN también en SQL desde 23c; se distingue de 19c.

No se habilita ejecución libre de PL/SQL. Los resultados verificados y la práctica guiada se identifican como tales.

## Gates

Pruebas: definiciones antes de ejemplos; propósitos/modelos/prácticas no vacíos; referencias e identificadores válidos; hashes Oracle; errores explicados para personas. La comprensión de principiantes no se deduce solo de compilar: debe revisarse cada tema, escena y flujo en navegador.
