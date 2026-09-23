# REALTIME_SPEC — Sala de clase en vivo

Versión 1.0 · P14–P17 · Relacionado con [GAME_SPEC.md](GAME_SPEC.md) y [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Roles y capacidad

Un presentador autenticado dirige su sala. Hasta 60 participantes entran con identidad anónima y alias. La prueba de margen llega a 75 conexiones, pero el cupo de producto sigue en 60. Solo el presentador crea, inicia, pausa, reanuda, cierra o cancela. La vista de proyección muestra QR, ronda, reloj, avances agregados y ranking, sin respuestas privadas ni controles de credenciales.

Código de ingreso de seis caracteres alfanuméricos sin caracteres confundibles, generado aleatoriamente y único entre salas vigentes. QR contiene únicamente URL pública y código, nunca claves del anfitrión. Caducidad máxima de sala: cuatro horas desde creación. Una sala en espera también caduca. Identificadores internos no sustituyen comprobación de permisos.

## Estados persistidos

| Estado de sala | Operaciones permitidas | Transición |
|---|---|---|
| lobby | Inscripción, mostrar QR, configuración de tiempo ya elegida, ver participantes. | running al iniciar primera ronda con al menos un participante; cancelled por docente; expired al caducar. |
| running | Ronda activa o revisión; comandos docentes autorizados. Inscripción nueva cerrada. | paused, finished después de M10 evaluada, cancelled o expired. |
| paused | Leer estado y conservar borradores; no aceptar nuevas respuestas. | running por reanudación; cancelled o expired. |
| finished | Ranking final, estadísticas y revisión. | Sin reapertura en v1. |
| cancelled | Resultados parciales rotulados. | Terminal. |
| expired | Informar vencimiento, conservar datos hasta retención. | Terminal. |

Rondas: pending → open → grading → review → closed. `grading` impide nuevos envíos pero espera que terminen los aceptados a tiempo. Después de `review`, el presentador avanza y cierra la ronda anterior. En la última, finalizar cierra M10 y la sala. Solo hay una ronda open/grading/review activa por sala. La pausa es un estado de sala que conserva la fase de ronda y el tiempo restante.

La expiración prevalece incluso durante una pausa y deja resultado parcial. Un mantenimiento del servidor recupera estos estados tras reiniciar procesos.

## Protocolo de sincronización

Al entrar, recuperar instantánea autorizada: room_id, revisión monotónica, estado, hora del servidor, participantes agregados, ronda y versión de misión, apertura, vencimiento o tiempo restante pausado, estado propio de respuesta y ranking publicado. El código de sala no autoriza lectura por sí solo: se requiere pertenencia o propiedad.

Las mutaciones se confirman en base de datos antes de notificar. Cada cambio relevante aumenta revisión de sala. El aviso contiene room_id, revisión y tipo de cambio; los clientes obtienen la instantánea o el detalle autorizado. No necesitan interpretar una secuencia incompleta de eventos para reconstruir puntajes.

| Aviso conceptual | Audiencia | Efecto |
|---|---|---|
| participante inscrito/conectado | Miembros y presentador, solo agregado público | Actualizar conteo; lista administrativa separada. |
| ronda abierta | Miembros | Mostrar enunciado, duración y hora autoritativa. |
| respuesta registrada/evaluada | Propietario de la respuesta; agregado al docente | Confirmar envío y feedback permitido. |
| sala pausada/reanudada | Miembros | Congelar o recalcular cuenta regresiva. |
| ronda en revisión | Miembros | Revelar explicación y ranking confirmado. |
| sala finalizada/cancelada/caducada | Miembros | Mostrar estado terminal correcto. |

Canales privados autorizados por identidad y pertenencia. Un canal común no contiene SQL de estudiantes, pistas privadas, soluciones anticipadas ni datos de autenticación. La presencia online es informativa, nunca prueba de inscripción o finalización. [Supabase: autorización de canales](https://supabase.com/docs/guides/realtime/authorization).

## Autoridad temporal

El servidor guarda apertura y vencimiento en UTC. El cliente representa la diferencia con la hora del servidor y un reloj monotónico local; sincroniza periódicamente y al recuperar foco. Cambiar el reloj del dispositivo no modifica la validez del intento.

La transacción de admisión fija `received_at` con el reloj de la base de aplicación después de obtener el bloqueo de participante/ronda; apertura, vencimiento y pausas usan esa misma autoridad. Se mide y limita la espera por bloqueo. No se mezcla ese instante con la hora de Oracle ni con la del navegador.

Un envío es puntual solo si su recepción validada y persistida por el servicio de aplicación ocurre con ronda abierta, antes del vencimiento y sin pausa activa. Llegar exactamente al vencimiento es tardío. El timestamp enviado por el cliente se ignora. La evaluación puede terminar después del vencimiento si el envío fue aceptado antes.

Al pausar se guarda tiempo restante; al reanudar se fija un nuevo vencimiento desde el reloj del servidor. Se acumulan intervalos de pausa para descontarlos de tiempo activo. Las solicitudes ya aceptadas se evalúan normalmente; el tiempo de su respuesta sigue siendo el de recepción.

Por defecto la ronda cierra al vencer. El presentador puede cerrar antes solo si todos han resuelto o agotado intentos. No se recorta el tiempo de quienes aún pueden responder. Para interrumpir una actividad incompleta debe pausar o cancelar la sala, no producir un falso cierre normal.

## Idempotencia y concurrencia

- Todo comando y respuesta lleva request_id único. Repetir la misma identidad, request_id y contenido devuelve el estado ya registrado; no crea otro intento.
- Reutilizar request_id con contenido diferente devuelve conflicto y conserva la primera solicitud.
- Bloquear transaccionalmente el estado de participante/ronda al aceptar respuesta. Dos pestañas no pueden registrar dos envíos simultáneos ni superar dos intentos académicos.
- Una evaluación pendiente impide otro envío y la solicitud de pista de ese participante. Reservar no significa consumir intento: el consumo ocurre al producirse una evaluación académica.
- La corrección final actualiza intento y resultado en una transacción; un reintento de corrección devuelve lo existente. Ningún evento del cliente aporta puntos.
- Comandos del docente incluyen revisión esperada. Dos pestañas con órdenes contradictorias producen un conflicto y actualización de estado, nunca doble apertura.
- El cierre espera pendientes por su plazo máximo de cinco segundos. No ignora una respuesta aceptada antes de vencer.

## Reconexión y fallos

| Situación | Comportamiento especificado |
|---|---|
| Estudiante desconectado | Conservar borrador; el tiempo general continúa. Recuperar identidad y snapshot al volver. No prometer envío offline. |
| Confirmación de envío perdida | Consultar request_id antes de reenviar. Si el servidor lo tiene, recuperar su corrección. |
| Realtime interrumpido | Mostrar estado de reconexión; consultar instantánea cada 3 segundos mientras la sala esté visible. El servidor sigue validando plazos. |
| Presentador desconectado | Ronda abierta llega a su vencimiento y pasa a revisión; no inicia automáticamente la siguiente. El docente recupera control al volver con su cuenta. |
| API o base de aplicación no disponibles | No dar por aceptados envíos. Al recuperar servicio, el docente puede cancelar una sala si la incidencia impidió una evaluación justa. No inventar aciertos ni reconstruir tiempos desde clientes. |
| Oracle no disponible durante misión que requiere ejecución | Error técnico sin consumir intento. Pausa de sala detectada por el servicio; conservar intentos ya evaluados y borradores. |
| Proceso de corrección reiniciado | Recuperar reservas pendientes; si excedieron su plazo, marcarlas error técnico, sin consumir intento. |

Para incidente Oracle, guardar el instante de inicio del incidente y el tiempo restante de la ronda en ese instante. Si el fallo se detecta después del vencimiento por una ejecución aceptada antes, usar su instante de recepción como inicio del incidente. Reanudar con el tiempo restante guardado, nunca reiniciar la ronda completa ni borrar resultados ya confirmados. Si no puede recuperarse con equidad, cancelar y repetir en una sala nueva. No finalizar como éxito con pendientes técnicos.

Cuando vuelven notificaciones antiguas, ignorar revisiones menores o iguales a la aplicada. Si llega una revisión mayor, pedir snapshot; no sumar puntos a partir del aviso.

## Cierre, ranking y privacidad

La sala fija participantes al iniciar M01. Se usa el mismo grupo para todas las métricas, incluso si alguien abandona. El ranking publicado se reconstruye con resultados de rondas cerradas o en revisión, no con mensajes del navegador. En vivo se muestran top cinco y posición propia; lista completa al finalizar. El docente dispone de agregados y revisión de intentos de su sala.

Alias no es identidad legal. La pantalla de entrada explica que alias, puntos y tiempo son visibles a la clase. No se requiere correo del estudiante. Datos de sala e intentos se conservan 30 días, con acceso autorizado, y se eliminan mediante mantenimiento. No hay ranking público indexable.

## Aceptación

- R01: dos móviles y una pantalla reciben misma ronda y revisión después de cada transición autorizada.
- R02: modificar reloj del móvil ±10 minutos no altera tiempo admitido ni puntaje.
- R03: recibir a vencimiento menos 1 ms acepta; recibir al vencimiento o después rechaza sin nuevo intento.
- R04: repetir diez veces el mismo envío deja un solo registro y un solo premio.
- R05: dos pestañas simultáneas de un participante conservan límites y resultado único.
- R06: al reconectar tras perder tres avisos, snapshot restablece estado y total sin duplicados.
- R07: pausa de 30 segundos conserva tiempo activo y añade esos 30 segundos al vencimiento al reanudar.
- R08: sin presentador, se cierra la ronda vigente y se espera; no se salta a otra.
- R09: un invitado no perteneciente a la sala no recibe sus eventos ni datos privados; un participante no ejecuta comandos docentes.
- R10: 60 estudiantes completan el circuito; p95 de notificación ≤1 s en condiciones de TEST_PLAN, sin pérdidas ni duplicación.
- R11: fallar Oracle no consume intentos; recuperar o cancelar produce estados y resultados explícitos.
