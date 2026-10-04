# SECTION_3_CURRICULUM — PL/SQL y automatización

Fecha: 3–4 de octubre de 2026. Fuente: `src/features/curriculum/domain/sections/s3/` (`basics.ts`, `programs.ts`, `triggers.ts`, `concepts.ts`, `activities.ts`, `scenes.ts`, `assessment.ts`). Rutas: `/sections/plsql/{study,class,practice,challenge,resources}` y evaluación con el motor de la Fase 3.

## 1. Cifras

| Elemento                           | Cantidad                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Bloques                            | 13                                                                                                          |
| Lecciones                          | 28                                                                                                          |
| Fichas de conceptos (Recursos)     | 33                                                                                                          |
| Ejemplos ejecutados en Oracle      | 77: 72 bloques o sentencias PL/SQL y 5 consultas; 24 terminan con el error de Oracle que la lección explica |
| Prácticas guiadas                  | 26                                                                                                          |
| Misiones del Challenge             | 10 (21 pasos)                                                                                               |
| Escenas de clase                   | 37                                                                                                          |
| Banco de evaluación                | 50 preguntas (ver `QUESTION_BANK_SPEC.md`)                                                                  |
| Bloques propios del banco (S3-B-*) | 14                                                                                                          |

## 2. Recorrido

| Bloque                   | Lecciones                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1 · Qué es PL/SQL        | L01 SQL y PL/SQL                                                                                         |
| 2 · Bloques PL/SQL       | L02 Estructura; L03 Anónimo y DBMS_OUTPUT                                                                |
| 3 · Variables y tipos    | L04 Variables y tipos; L05 %TYPE y %ROWTYPE; L06 Alcance                                                 |
| 4 · SQL dentro de PL/SQL | L07 SELECT INTO; L08 DML y SQL%ROWCOUNT                                                                  |
| 5 · Condicionales        | L09 IF; L10 CASE                                                                                         |
| 6 · Bucles               | L11 LOOP; L12 WHILE y FOR                                                                                |
| 7 · Cursores             | L13 Cursor implícito; L14 Cursor explícito; L15 Cursor FOR                                               |
| 8 · Excepciones          | L16 Excepciones; L17 RAISE                                                                               |
| 9 · Procedimientos       | L18 Procedimientos; L19 IN, OUT, IN OUT                                                                  |
| 10 · Funciones           | L20 Funciones; L21 Procedimiento o función                                                               |
| 11 · Paquetes            | L22 Paquetes                                                                                             |
| 12 · Triggers            | L23 Qué es un trigger; L24 BEFORE/AFTER y filas; L25 :OLD y :NEW; L26 Trigger de validación; L27 Límites |
| 13 · Integración         | L28 Integración                                                                                          |

Misiones:

- M01 Primer bloque
- M02 Variables con ancla
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
