# DATABASE_SCHEMA — Datos educativos y persistencia

Versión 1.1 · Modelo lógico y diccionario. La migración de la sala en vivo 1.1 está en `supabase/migrations`.

## Separación de bases

Oracle contiene el dataset consultado por estudiantes. PostgreSQL de Supabase contiene identidad de sala, respuestas y resultados. No se ejecuta el SQL de estudiantes sobre PostgreSQL y no se exponen sus tablas en el laboratorio.

## Dataset educativo canónico

ID de versión: `empleados-select-v1`. Fuente de valores: `SentenciasSQL_GM.pptx`, diapositiva 6. Datos didácticos de las presentaciones, sin relación con registros reales de estudiantes. Todas las columnas son visibles y no admiten NULL en esta versión.

| Posición | Columna Oracle | Tipo propuesto | Regla |
|---|---|---|---|
| 1 | ID | NUMBER(4,0) | Clave primaria, positiva. |
| 2 | NOMBRE | VARCHAR2(40 CHAR) | Obligatorio; conservar tildes. |
| 3 | EDAD | NUMBER(3,0) | Entero de 0 a 120. |
| 4 | CIUDAD | VARCHAR2(50 CHAR) | Obligatorio. |
| 5 | SALARIO | NUMBER(12,2) | No negativo; unidades monetarias del ejemplo. |
| 6 | DEPTO | VARCHAR2(40 CHAR) | Obligatorio, etiqueta de interfaz Departamento. |

| ID | NOMBRE | EDAD | CIUDAD | SALARIO | DEPTO |
|---:|---|---:|---|---:|---|
| 1 | Ana | 25 | Bogotá | 3000000 | Ventas |
| 2 | Carlos | 35 | Cali | 5000000 | Sistemas |
| 3 | Laura | 28 | Bogotá | 4200000 | Sistemas |
| 4 | Pedro | 19 | Medellín | 1800000 | Ventas |
| 5 | María | 30 | Cali | 3700000 | Contabilidad |
| 6 | Jorge | 22 | Bogotá | 2800000 | Sistemas |

Decisión de reconciliación: F2 y el juego usan María 31, Jorge 29 y Ventas y añaden TELEFONO. No se trasladan esas diferencias al dataset v1. TELEFONO y ejemplos de NULL quedan para otra versión. No utilizar DEPARTAMENTO como un identificador alternativo silencioso: el esquema muestra DEPTO claramente.

Una única definición versionada origina la carga administrativa de Oracle y la copia de visualización. Al publicar, comparar esquema, filas y huella de contenido. No permitir editar el dataset desde la plataforma. Cambios producen una nueva versión y no alteran salas activas. El usuario lector Oracle posee solo permiso de lectura sobre la tabla aprobada; un usuario distinto administra el esquema.

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

- DB01: carga v1 produce exactamente seis filas y seis columnas, con valores y huella iguales a la copia visual.
- DB02: se rechazan duplicación de identidad/alias en sala, cupo 61 y referencias cruzadas entre salas.
- DB03: no puede existir tercer intento académico ni doble resultado para una misión.
- DB04: restaurar datos permite recalcular los mismos totales y empates.
- DB05: acceso directo de un estudiante no modifica score, estado o tiempo ni lee intentos ajenos.
- DB06: limpieza elimina dependencias sin huérfanos y no afecta otra sala dentro de retención.
- DB07: esquema y permisos de Oracle impiden cambios al dataset mediante la identidad de ejecución.
