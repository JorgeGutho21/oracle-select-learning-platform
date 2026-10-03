# DATABASE_SCHEMA — Datos educativos y persistencia

Versión 2.0 · Dataset `empleados-select-v2`, modelo lógico y diccionario. La migración de la sala en vivo 1.1 está en `supabase/migrations`.

## Separación de bases

Oracle contiene el dataset consultado por estudiantes. PostgreSQL de Supabase contiene identidad de sala, respuestas y resultados. No se ejecuta el SQL de estudiantes sobre PostgreSQL y no se exponen sus tablas en el laboratorio.

## Dataset educativo canónico

ID de versión: `empleados-select-v2` (25 de septiembre de 2026). Sustituye a `empleados-select-v1` (6 filas × 6 columnas), que se conserva en `oracle/empleados-select-v1.sql` y en los esquemas Oracle anteriores para volver atrás. Datos didácticos inventados, sin relación con personas reales; los correos usan el dominio reservado `empresa.example`.

Una tabla EMPLEADOS de **12 columnas y 20 filas**, diseñada para que cada concepto de la unidad tenga un caso visible: repeticiones para DISTINCT, límites de rango para BETWEEN, empates para ORDER BY, NULL frente a 0, fechas e inactivos. Motivo de cada fila en [CONTENT_MAP.md](CONTENT_MAP.md#dataset-único-empleados-select-v2).

| Posición | Columna | Tipo Oracle | NULL | Regla |
|---:|---|---|---|---|
| 1 | ID_EMPLEADO | NUMBER(4) | No | Clave primaria (`EMPLEADOS_PK`), positiva. |
| 2 | NOMBRE | VARCHAR2(40 CHAR) | No | Conserva tildes. |
| 3 | APELLIDO | VARCHAR2(40 CHAR) | No | Conserva tildes. |
| 4 | CARGO | VARCHAR2(40 CHAR) | No | |
| 5 | DEPARTAMENTO | VARCHAR2(30 CHAR) | No | 5 valores: Operaciones, TI, Ventas, Finanzas, Recursos Humanos. |
| 6 | CIUDAD | VARCHAR2(30 CHAR) | No | 5 valores: Bogotá, Medellín, Cali, Barranquilla, Valledupar. |
| 7 | SALARIO | NUMBER(10) | No | Mayor que 0; pesos por mes. |
| 8 | BONO | NUMBER(10) | Sí | 0 o más; 6 filas NULL y una con 0. |
| 9 | FECHA_INGRESO | DATE | No | Solo fecha (hora 00:00:00). |
| 10 | ESTADO | VARCHAR2(8 CHAR) | No | `CHECK (ESTADO IN ('ACTIVO', 'INACTIVO'))`; 17 activos. |
| 11 | CORREO | VARCHAR2(60 CHAR) | No | Único (`EMPLEADOS_CORREO_UNICO`): `nombre.apellido@empresa.example` sin tildes. |
| 12 | ID_JEFE | NUMBER(4) | Sí | Clave foránea a `EMPLEADOS (ID_EMPLEADO)`; NULL para Ana y Esteban. |

| ID | Nombre | Apellido | Cargo | Departamento | Ciudad | Salario | Bono | Ingreso | Estado | Jefe |
|---:|---|---|---|---|---|---:|---:|---|---|---:|
| 1 | Ana | Rojas | Gerente general | Operaciones | Bogotá | 9000000 | 900000 | 2012-02-01 | ACTIVO | NULL |
| 2 | Carlos | Gómez | Líder de área | TI | Bogotá | 7500000 | 600000 | 2014-06-16 | ACTIVO | 1 |
| 3 | María | Ruiz | Líder de área | Ventas | Medellín | 6000000 | 500000 | 2015-03-02 | ACTIVO | 1 |
| 4 | Jorge | Díaz | Líder de área | Finanzas | Cali | 6800000 | NULL | 2016-09-12 | ACTIVO | 1 |
| 5 | Laura | Mora | Líder de área | Recursos Humanos | Bogotá | 5800000 | 400000 | 2017-01-23 | ACTIVO | 1 |
| 6 | Andrés | Pérez | Analista | TI | Bogotá | 4200000 | 300000 | 2019-04-08 | ACTIVO | 2 |
| 7 | Paula | Castro | Analista | TI | Medellín | 4200000 | NULL | 2020-08-03 | ACTIVO | 2 |
| 8 | Oscar | Vega | Analista | TI | Cali | 3800000 | 250000 | 2021-02-15 | INACTIVO | 2 |
| 9 | Sofía | López | Representante comercial | Ventas | Medellín | 3000000 | 450000 | 2018-11-19 | ACTIVO | 3 |
| 10 | Mario | Soto | Representante comercial | Ventas | Bogotá | 3500000 | 0 | 2019-07-01 | ACTIVO | 3 |
| 11 | Valentina | Ríos | Representante comercial | Ventas | Cali | 2900000 | 350000 | 2022-05-09 | ACTIVO | 3 |
| 12 | Ricardo | Herrera | Representante comercial | Ventas | Barranquilla | 3500000 | NULL | 2023-01-16 | ACTIVO | 3 |
| 13 | Camila | Cruz | Analista | Finanzas | Cali | 4500000 | 200000 | 2020-03-10 | ACTIVO | 4 |
| 14 | Diego | Ortiz | Analista | Finanzas | Bogotá | 5200000 | 300000 | 2016-10-24 | INACTIVO | 4 |
| 15 | Daniela | Suárez | Especialista | Finanzas | Medellín | 6100000 | 350000 | 2015-12-01 | ACTIVO | 4 |
| 16 | Julián | Luna | Asistente | Recursos Humanos | Cali | 2300000 | NULL | 2024-02-05 | ACTIVO | 5 |
| 17 | Carolina | Vargas | Analista | Recursos Humanos | Medellín | 3900000 | 150000 | 2021-09-13 | ACTIVO | 5 |
| 18 | Felipe | Mejía | Asistente | Operaciones | Bogotá | 2100000 | NULL | 2025-01-20 | ACTIVO | 1 |
| 19 | Alicia | Paz | Especialista | Operaciones | Valledupar | 4800000 | 250000 | 2013-05-06 | INACTIVO | 1 |
| 20 | Esteban | Torres | Asistente | TI | Barranquilla | 2500000 | NULL | 2025-03-03 | ACTIVO | NULL |

La columna CORREO (`nombre.apellido@empresa.example`) no se repite en la tabla anterior.

### Una sola fuente y su verificación

- **Definición:** `src/domain/dataset/empleados.ts`, con el orden, los tipos, las etiquetas y la nulabilidad de las columnas y los valores de las filas. De ahí salen la Exposición, el Estudio, el laboratorio, el Challenge y la chuleta.
- **Carga Oracle:** [`oracle/empleados-select-v2.sql`](../oracle/empleados-select-v2.sql). Usa literales `DATE 'AAAA-MM-DD'`, que no dependen de `NLS_DATE_FORMAT`, e incluye PK, FK, UNIQUE, CHECK y NOT NULL. No contiene cuentas ni contraseñas.
- **Prueba unitaria** (`tests/unit/oracle/dataset-sql.test.ts`): las 20 filas del script coinciden con el módulo y las 12 columnas con sus tipos y su nulabilidad.
- **Comprobación en tiempo de ejecución:** antes de ejecutar, el servidor lee las 12 columnas `ORDER BY ID_EMPLEADO` y las compara con el dataset (salud de `OracledbQueryExecutor`). Si no coinciden, el laboratorio no ejecuta.
- **Integración** (`tests/integration/oracle-real.test.ts`): cada consulta del contenido da en Oracle el mismo resultado que el motor educativo.
- **Sesión Oracle:** `ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD' NLS_SORT = BINARY NLS_COMP = BINARY`. Las fechas se muestran como `AAAA-MM-DD` y los textos se comparan y ordenan exactamente, igual que el motor educativo. Los números que no caben en un número de JavaScript sin perder precisión, como los decimales periódicos, se conservan con los dígitos de Oracle.

### Esquemas Oracle y privilegios

La migración a v2 es **aditiva**: se crean esquemas nuevos y los de v1 quedan intactos para volver atrás.

| Esquema o cuenta | Versión | Tipo | Privilegios |
|---|---|---|---|
| `SQL_LAB_V2_OWNER` | v2 | Sin inicio de sesión (`NO AUTHENTICATION`) | Dueño de EMPLEADOS; cuota de 10 MB. |
| `SQL_LAB_V2_READER` | v2 | Cuenta de la aplicación | Solo `CREATE SESSION` y `READ` sobre `SQL_LAB_V2_OWNER.EMPLEADOS` (READ impide `SELECT … FOR UPDATE`). |
| `SQL_LAB_OWNER` / `SQL_LAB_READER` | v1 | Anteriores | Sin cambios; `EMPLEADOS` con 6 filas. |

`ADMIN` (Autonomous Database) y `SYSTEM` (Oracle local) solo se usan en los scripts de instalación, nunca en la aplicación: `oracleConfigFromEnv` rechaza esas cuentas. Los scripts `scripts/oracle-local.mjs setup` y `scripts/oracle-cloud.mjs setup` crean los esquemas v2 desde el archivo canónico, guardan la cuenta anterior como `*_PREVIOUS_*` en archivos ignorados por Git y no imprimen ningún secreto ([ORACLE_SETUP.md](ORACLE_SETUP.md)).

No se permite editar el dataset desde la plataforma. Un cambio produce una versión nueva (v3) con esquemas nuevos y no altera las salas activas.

## Entidades de la plataforma

El modelo lógico de esta sección corresponde a la sala 1.0 con rondas y cuenta docente. La migración implementada en la Fase 7 cubre la sala 1.1 a ritmo propio: ver [Implementación de la sala 1.1](#implementación-de-la-sala-11-fase-7).

Tipos indicados conceptualmente: UUID para identidad, texto acotado, entero para puntos, booleano para indicadores, timestamp con zona horaria para instantes UTC y documento estructurado para respuestas heterogéneas. Fechas, puntos y autoridad de rol provienen del servidor.

### presenters

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| user_id | UUID, no nulo | PK y referencia a identidad Auth. |
| enabled | Booleano, no nulo | Solo administración de servidor modifica. |
| display_name | Texto 80, no nulo | Etiqueta docente, nunca fuente de permisos. |
| created_at | Timestamp, no nulo | Generado en servidor. |

Un participante anónimo no puede crearse como presentador mediante una escritura del cliente.

### content_releases

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| id | Texto 40, no nulo | PK, versión inmutable de publicación. |
| dataset_version | Texto 40, no nulo | Referencia al dataset aprobado. |
| mission_version | Texto 40, no nulo | Conjunto de exactamente diez misiones. |
| scoring_version | Texto 40, no nulo | Identifica reglas de GAME_SPEC. |
| manifest_hash | Texto, no nulo | Huella de contenido y rúbricas desplegadas. |
| published_at | Timestamp, no nulo | Auditoría de publicación. |

Las definiciones públicas y rúbricas se mantienen en recursos versionados de la aplicación; las rúbricas se distribuyen solo al servidor. Esta tabla acredita qué versión usa una sala, sin requerir un CMS ni almacenar código ejecutable. Conservar recursos antiguos mientras existan salas o resultados dentro de retención.

### rooms

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| id | UUID, no nulo | PK. |
| presenter_id | UUID, no nulo | FK presenters.user_id. |
| release_id | Texto, no nulo | FK content_releases.id. |
| join_code | Texto 6, no nulo | Único mientras esté vigente, comparación normalizada a mayúsculas. |
| state | Enumerado, no nulo | lobby, running, paused, finished, cancelled, expired. |
| time_multiplier | Entero, no nulo | Solo 1 o 2; inmutable tras creación. |
| capacity | Entero, no nulo | 60 en v1. |
| active_round_id | UUID, nulo en lobby | Referencia a una ronda de esta misma sala. |
| revision | Entero largo, no nulo | Monotónico, solo servidor. |
| roster_count | Entero, nulo antes de inicio | Se fija al iniciar; no cambia por desconexión. |
| created_at / expires_at | Timestamp, no nulos | Caducidad cuatro horas después de creación. |
| started_at / ended_at | Timestamp, opcionales | Coherentes con estado. |
| pause_started_at / pause_reason | Timestamp / texto, opcionales | presentes si hay pausa activa. |

Índices: código vigente único; presenter_id con created_at; state con expires_at para mantenimiento. La aplicación no reutiliza un código mientras otra sala con ese código admita acceso vigente.

### participants

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| id | UUID, no nulo | PK. |
| room_id | UUID, no nulo | FK rooms.id. |
| auth_user_id | UUID, no nulo | FK identidad Auth, incluido acceso anónimo. |
| nickname | Texto 24, no nulo | 2–24 caracteres tras recortar espacios; tratado como texto. |
| nickname_key | Texto normalizado, no nulo | Unicidad por sala, ignorando caja y espacios exteriores. |
| joined_at | Timestamp, no nulo | Servidor; antes del inicio. |
| last_seen_at | Timestamp, opcional | Presencia aproximada; no modifica puntaje. |

Unicidades: (room_id, auth_user_id), (room_id, nickname_key) y (room_id, id) para referencias compuestas. Todas las inscripciones se verifican transaccionalmente contra capacidad y estado lobby. No almacenar correo, documento, contraseña o teléfono del participante.

### rounds

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| id | UUID, no nulo | PK. |
| room_id | UUID, no nulo | FK rooms.id. |
| mission_id | Texto 3, no nulo | M01–M10 de release_id de la sala. |
| ordinal | Entero, no nulo | 1–10, coherente con misión. |
| state | Enumerado, no nulo | pending, open, grading, review, closed. |
| duration_ms | Entero, no nulo | Base por multiplicador de sala. |
| opened_at / deadline_at | Timestamp, opcionales | Obligatorios desde apertura salvo vencimiento recalculado en pausa. |
| remaining_ms | Entero, opcional | Tiempo restante guardado durante pausa. |
| paused_total_ms | Entero largo, no nulo | Acumulado de pausas finalizadas; no negativo. |
| closed_at | Timestamp, opcional | Instante de cierre. |
| incident_started_at | Timestamp, opcional | Recuperación de fallo Oracle. |

Unicidades: (room_id, ordinal), (room_id, mission_id), (room_id, id). Máximo una ronda no pending/closed activa por sala, controlado por transacción e índice parcial cuando sea aplicable. active_round_id no puede apuntar a otra sala.

### attempts

| Campo | Tipo / nulabilidad | Restricción |
|---|---|---|
| id | UUID, no nulo | PK. |
| room_id / round_id / participant_id | UUID, no nulos | FKs compuestas aseguran que ronda y participante pertenecen a room_id. |
| request_id | UUID, no nulo | Único por participante para reintentos de red. |
| payload_hash | Texto, no nulo | Impide cambiar la respuesta conservando request_id. |
| answer | Documento estructurado, no nulo | Esquema por misión; máximo 8 KB, SQL máximo 4000 caracteres. |
| status | Enumerado, no nulo | pending, evaluated, technical_error. |
| try_number | Entero, nullable | 1 o 2 al evaluarse académicamente; nulo en fallo técnico. |
| received_at | Timestamp, no nulo | Recepción persistida, determina plazo. |
| elapsed_active_ms | Entero largo, no nulo | Tiempo activo a recepción, calculado por servidor. |
| hint_used | Booleano, no nulo | Instantánea de pista confirmada al aceptar envío. |
| is_correct / awarded_points | Booleano / entero, nullable | Solo definidos en evaluated; puntos 0, 60, 80 o 100 según rúbrica. |
| feedback_code | Texto, opcional | Diagnóstico pedagógico o técnico. |
| evaluated_at | Timestamp, opcional | Auditoría de corrección. |

Unicidades: (participant_id, request_id); (participant_id, round_id, try_number) cuando no sea nulo. Máximo un pending por participante/ronda. Índices sobre round_id y status para recuperación, y participant_id para historial autorizado. Una reserva pendiente bloquea envíos nuevos hasta terminar, pero solo evaluated consume intento. Un fallo técnico se reintenta con nuevo request_id después de recuperar su estado; repetir el anterior devuelve el mismo fallo registrado.

### hints

Campos: id UUID PK; room_id, round_id y participant_id con las mismas FKs compuestas; request_id; delivered_at del servidor. Unicidad por participante/ronda y por participante/request_id. Existe como máximo una pista entregada por misión. Insertar pista y validar ausencia de corrección pendiente ocurre bajo el mismo bloqueo transaccional del participante/ronda.

### results

Una fila por participante y ronda, nunca una fila por reenvío. Campos: room_id, participant_id y round_id con FKs compuestas; outcome (solved, exhausted, timeout, omitted); score; successful_attempt_id nullable; academic_attempts; hint_used; rank_time_ms; finalized_at.

PK compuesta (participant_id, round_id). score entre 0 y 100, academic_attempts entre 0 y 2. successful_attempt_id debe ser un intento correcto de ese mismo participante/ronda. Si outcome no es solved, score es cero y no hay intento exitoso. rank_time_ms usa tiempo hasta acierto o duración activa de ronda, según GAME_SPEC. En sala v1 omitted se reserva para cancelación/resultado parcial; la ausencia normal al cierre usa timeout.

Mientras una ronda está abierta, resultado puede quedar resuelto anticipadamente; el ranking público solo incorpora rondas en review/closed. Cancelación identifica los resultados parciales por estado de sala y no rellena rondas nunca abiertas con falsos ceros finales.

### command_receipts

Registro mínimo de idempotencia para comandos del presentador: room_id, actor_user_id, request_id, action, payload_hash, resulting_revision, created_at. PK (actor_user_id, request_id). Es privado del servidor. Evita que repetir inicio, pausa, reanudación o finalización ejecute dos veces la transición. La transacción de comando y su recibo se confirma conjuntamente.

## Relaciones e invariantes

Un presentador tiene muchas salas; una publicación sirve a muchas salas; una sala tiene hasta 60 participantes y diez rondas; cada participante tiene intentos, hasta una pista y hasta un resultado por ronda. Las referencias compuestas impiden asociar un intento de la sala A a una ronda de B.

Puntuaciones totales, número de aciertos y ranking se obtienen de resultados por ronda; no se mantienen copias editables en participants. Estadísticas derivan de attempts, hints y results con el grupo fijado al inicio. Si se añade una caché, será regenerable y no autoritativa.

No hay tablas de progreso individual ni borradores en servidor en v1. Se guardan localmente con versión. El contenido didáctico no se duplica como tablas de cursos, unidades y CMS.

## Permisos

| Datos | Visitante sin sesión | Participante inscrito | Presentador propietario | Servidor autorizado |
|---|---|---|---|---|
| Contenido público | Leer | Leer | Leer | Publicar versión. |
| Estado público de sala | Solo validación limitada del código mediante API | Leer snapshot de su sala | Leer | Mutar tras autorización. |
| Alias/ranking | No | Leer proyección pública de su sala | Leer | Calcular. |
| Identidades internas | No | Solo propia identidad | Acceso mínimo necesario de su sala | Administrar. |
| Intentos, pistas y resultados detallados | No | Leer propios | Leer de su sala | Escribir y corregir. |
| Rúbricas y secretos | No | No mientras la misión admita respuesta | Explicación publicada en revisión | Leer para corregir. |
| Salas/rondas/puntajes | No escribir | No escribir directamente | Solo comandos autorizados | Mutaciones transaccionales. |

RLS activada en tablas expuestas, sin políticas amplias de lectura anónima. El cliente no recibe columnas internas al solicitar el ranking: una proyección autorizada devuelve solo alias, puntos, posición y tiempo. La clave privilegiada permanece en servidor. Pruebas de acceso directo deben fallar igual que por interfaz.

## Implementación de la sala 1.1 (Fase 7)

Migración: [`supabase/migrations/20260924120000_classroom.sql`](../supabase/migrations/20260924120000_classroom.sql). Se reutiliza el naming de este documento (`rooms`, `join_code`, `state`, `ended_at`) en lugar del propuesto en la solicitud de la Fase 7, que es compatible:

| Nombre pedido en la Fase 7 | Implementado | Nota |
|---|---|---|
| sessions (id, code, status, created_at, started_at, finished_at) | `rooms` (id, join_code, state, created_at, started_at, ended_at) | Además: `presenter_token_hash`, `revision` y `expires_at`. |
| participants (id, session_id, nickname, joined_at) | `participants` (id, room_id, nickname, joined_at) | Además: `nickname_key`, `token_hash`, `last_seen_at`, `left_at`. |
| attempts (id, participant_id, mission_id, attempt_number, correct, score, duration_ms, hint_used, created_at) | `attempts` con los mismos campos | Además: `room_id`, `request_id`, `payload_hash`, `status`, `outcome`, `measured_from`, `evaluated_at`. |
| results (id, session_id, participant_id, total_score, total_time_ms, accuracy, completed_at) | `results` (room_id, participant_id PK, total_score, total_time_ms, accuracy, completed_at) | Además: `solved_missions`, `attempts`, `hints_used`. Una fila por participante; la PK es `participant_id`. |
| — | `hints` | Primera pista por participante y misión (descuento de GAME_SPEC). |

Diferencias con el modelo 1.0: no existen `presenters`, `content_releases`, `rounds` ni `command_receipts` (la sala 1.1 no tiene rondas ni cuentas docentes); el profesor y los participantes se identifican por la huella SHA-256 de un token aleatorio guardado en una cookie `httpOnly`, no por `auth_user_id`. No se guarda la respuesta completa del estudiante: solo su huella (`payload_hash`) para la idempotencia y la corrección devuelta (`outcome`) para repetirla.

Invariantes en la base, además de las de la aplicación: código con el alfabeto sin ambigüedades; huellas hexadecimales de 64 caracteres; alias de 2–24 caracteres únicos por sala sin distinguir mayúsculas (`nickname_key`); `attempt_number` 1 o 2 y único por participante y misión entre los evaluados; un solo intento pendiente por participante; `request_id` único por participante; referencias compuestas `(room_id, participant_id)` que impiden mezclar salas; `results.total_score` entre 0 y 1000.

Permisos: RLS activada en las cinco tablas y sin políticas; `anon` y `authenticated` no tienen privilegios sobre tablas ni funciones; solo `service_role` (servidor) ejecuta las funciones `classroom_*`, que fijan `search_path` vacío. Verificado en PostgreSQL embebido con los privilegios por defecto de Supabase (`tests/integration/classroom-postgres.test.ts`); el proyecto remoto queda pendiente de credenciales ([SUPABASE_SETUP.md](SUPABASE_SETUP.md)).

Estado de DB02, DB03 y DB05 para la sala 1.1: verificados en esa base (cupo 61, alias duplicado, tercer intento, acceso directo de `anon`). DB04 (recalcular desde intentos) se cumple por diseño: ranking y estadísticas se calculan siempre desde `attempts` y `hints`; `results` es una copia regenerable al finalizar.

## Retención, mantenimiento y aceptación

Salas, participantes, intentos, pistas, resultados y recibos se eliminan conjuntamente a los 30 días del estado terminal. Si una sala caduca, se fija ended_at. Publicaciones referenciadas no se eliminan durante retención. Eliminar identidades anónimas huérfanas mediante mantenimiento cuando no conserven salas asociadas; no eliminar la cuenta del docente. Copias de seguridad y registros operativos deben respetar una política de vencimiento documentada antes de producción.

- DB01: la carga v2 produce exactamente 20 filas y 12 columnas, con los valores, tipos y nulabilidad de la copia visual (verificado en Oracle local 23ai y Oracle Cloud 19c).
- DB02: se rechazan duplicación de identidad/alias en sala, cupo 61 y referencias cruzadas entre salas.
- DB03: no puede existir tercer intento académico ni doble resultado para una misión.
- DB04: restaurar datos permite recalcular los mismos totales y empates.
- DB05: acceso directo de un estudiante no modifica score, estado o tiempo ni lee intentos ajenos.
- DB06: limpieza elimina dependencias sin huérfanos y no afecta otra sala dentro de retención.
- DB07: esquema y permisos de Oracle impiden cambios al dataset mediante la identidad de ejecución (`UPDATE` con `SQL_LAB_V2_READER` devuelve ORA-01031 u ORA-41900).
