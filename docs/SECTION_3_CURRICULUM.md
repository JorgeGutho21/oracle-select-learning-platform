# SECTION_3_CURRICULUM — PL/SQL y automatización

Fecha: 3–4 de octubre de 2026; reestructurada el 17 de octubre de 2026 (ver [S2_S3_PEDAGOGICAL_RESTRUCTURE.md](S2_S3_PEDAGOGICAL_RESTRUCTURE.md)). Fuente: `src/features/curriculum/domain/sections/s3/` (`basics.ts`, `programs.ts`, `triggers.ts`, `concepts.ts`, `activities.ts`, `scenes.ts`, `assessment.ts`). Rutas: `/sections/plsql/{study,class,practice,challenge,resources}` y evaluación con el motor de la Fase 3.

## 1. Cifras

| Elemento                       | Cantidad                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Bloques                        | 17 (0–16): el núcleo sigue el orden del profesor; los bloques 13–16 son ampliación |
| Lecciones                      | 29: 15 de núcleo, 6 de apoyo y 8 de ampliación (nueva: L29 %ROWTYPE)               |
| Fichas de conceptos (Recursos) | 34 (nueva: %ROWTYPE, separada de %TYPE)                                            |
| Ejemplos ejecutados en Oracle  | 110 en la sección (lecciones, microejemplos y práctica)                            |
| Prácticas guiadas              | 26                                                                                 |
| Misiones del Challenge         | 10 (21 pasos)                                                                      |
| Escenas de clase               | 167 (antes 203)                                                                    |
| Banco de evaluación            | 50 preguntas (ver `QUESTION_BANK_SPEC.md`)                                         |
| Bloques propios del banco      | 14 (S3-B)                                                                          |

## 2. Recorrido

| Bloque                              | Lecciones (en orden)                                                                           | Nivel          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| 0 · De SQL a PL/SQL                 | L01 SQL y PL/SQL                                                                               | Núcleo         |
| 1 · Bloque anónimo                  | L02 Bloque anónimo (BEGIN/END → DECLARE → EXCEPTION)                                           | Núcleo         |
| 2 · Variables                       | L04 Variables                                                                                  | Núcleo         |
| 3 · %TYPE                           | L05 %TYPE                                                                                      | Núcleo         |
| 4 · SQL dentro de PL/SQL            | L07 SELECT INTO                                                                                | Apoyo          |
| 5 · IF                              | L09 IF                                                                                         | Núcleo         |
| 6 · FOR                             | L12 FOR; L11 LOOP y WHILE                                                                      | Núcleo · Apoyo |
| 7 · Cursor implícito                | L13 Cursor implícito; L08 DML y ROLLBACK                                                       | Núcleo · Apoyo |
| 8 · Cursor explícito                | L14 Cursor explícito; L15 Cursor FOR                                                           | Núcleo · Apoyo |
| 9 · Funciones                       | L20 Funciones                                                                                  | Núcleo         |
| 10 · Procedimientos                 | L18 Procedimientos; L19 IN, OUT, IN OUT; L03 Anónimo o almacenado; L21 Procedimiento o función | Núcleo · Apoyo |
| 11 · Paquetes                       | L22 Paquetes                                                                                   | Núcleo         |
| 12 · Triggers                       | L23 Momento, evento, nivel y cuerpo; L24 BEFORE/AFTER y filas; L25 :OLD y :NEW                 | Núcleo         |
| 13 · Ampliación · Más herramientas  | L29 %ROWTYPE; L06 Alcance; L10 CASE                                                            | Ampliación     |
| 14 · Ampliación · Excepciones       | L16 Excepciones; L17 RAISE                                                                     | Ampliación     |
| 15 · Ampliación · Validar y límites | L26 Trigger de validación; L27 Límites                                                         | Ampliación     |
| 16 · Ampliación · Integración final | L28 Integración                                                                                | Ampliación     |

Misiones:

- M01 Primer bloque
- M02 Variables con ancla (variables y %TYPE)
- M03 Leer una fila
- M04 Decisiones
- M05 Repetir
- M06 Recorrer filas
- M07 Errores bajo control
- M08 Programas guardados
- M09 Auditoría automática
- M10 PL/SQL Master

Ampliación futura, publicada como plan: registros y colecciones, SQL dinámico, BULK COLLECT y FORALL, triggers INSTEAD OF y compuestos.

## 3. Triggers, el tema central

| Lección | Qué se ve, con datos reales                                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L23     | Un trigger AFTER INSERT de sentencia que se dispara solo                                                                                                                         |
| L24     | Un UPDATE de tres filas dispara 3 veces el trigger de fila y 1 vez el de sentencia; BEFORE INSERT normaliza «nora PEÑA» a «Nora Peña» y el bono NULL a 0                         |
| L25     | Auditoría de salarios con :OLD y :NEW: Recursos Humanos +10 % deja 3 filas en AUDITORIA_SALARIOS; INSERTING/UPDATING/DELETING; ORA-04082 al usar :NEW en un trigger de sentencia |
| L26     | Validación BEFORE con RAISE_APPLICATION_ERROR (ORA-20010, ORA-06512, ORA-04088): el salario no cambia                                                                            |
| L27     | Cuándo no usarlos: tabla mutante (ORA-04091), COMMIT en un trigger (ORA-04092), lógica de negocio escondida y efectos en cascada                                                 |
| L28     | Procedimiento `aplicar_aumentos` (cursor FOR, validación, OUT) y trigger de auditoría juntos: con 5 % cambian 2 filas; con 30 % falla con ORA-20020 y la auditoría queda vacía   |

## 4. Cómo se muestra un bloque PL/SQL

- **Antes se crea**: procedimientos, funciones, paquetes y triggers que el ejemplo necesita. En la clase se pliegan.
- **Antes / después**: tablas leídas con una consulta de comprobación, que se muestra junto a la tabla.
- **Recorrido paso a paso**: línea actual, nota, variables, fila del cursor y salida acumulada de DBMS_OUTPUT. La prueba de Oracle exige que la salida del recorrido sea idéntica a la real.
- **Salida y error**: DBMS_OUTPUT y el mensaje de Oracle tal como llegan. Los errores de compilación se muestran en formato SHOW ERRORS (`línea/columna PLS-…`).
- Cada ejemplo indica que son datos obtenidos al ejecutar el código en Oracle, no una ejecución en vivo.

## 5. Ejecución y aislamiento

Los ejemplos se ejecutan en el esquema de verificación `DBLAB_CURRICULO`. Antes de cada bloque se borran sus objetos y se recrea el dataset `empresa-relacional-v1`. Al final, ROLLBACK. Ver `ORACLE_VALIDATION.md`.

La aplicación publicada no ejecuta PL/SQL de los estudiantes: muestra los resultados verificados.
