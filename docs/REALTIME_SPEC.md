# REALTIME_SPEC — Sala de clase en vivo

Versión 1.1 · P14–P17 · Relacionado con [GAME_SPEC.md](GAME_SPEC.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) y [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## Cambios de la versión 1.1 (Fase 7)

La versión 1.0 describía rondas guiadas por el presentador (una misión abierta a la vez, con pausa y cierre de ronda) y una cuenta docente de Supabase Auth. La Fase 7 fija otro flujo: el profesor crea la sala, los estudiantes entran por QR, el profesor inicia y **cada estudiante resuelve las diez misiones a su ritmo** mientras el ranking se actualiza; el profesor finaliza cuando decide. Esta versión especifica ese modelo, que es el implementado. Las rondas guiadas, la pausa y la cuenta docente quedan [diferidas](#diferido-a-una-versión-posterior); no se presentan como disponibles.

## Roles y capacidad

- **Profesor.** Crea la sala en `/presenter` con la clave del servidor `PRESENTER_ACCESS_CODE` (no hay cuentas docentes en v1.1). Quien la crea recibe un token aleatorio en una cookie `httpOnly` y solo ese navegador dirige la sala: iniciar, finalizar o cancelar.
- **Estudiante.** Entra con un alias en `/join/{codigo}`, sin cuenta, correo ni contraseña. Recibe su propio token en una cookie `httpOnly` limitada a esa sala.
- **Capacidad de producto:** 60 participantes por sala; el participante 61 recibe «sala completa». El objetivo de aula es de unos 50 estudiantes. La concurrencia está probada con memoria y PostgreSQL embebido; **la capacidad en el servicio remoto no está medida** (ver [Aceptación](#aceptación)).

Código de ingreso: seis caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sin I, L, O, 0 ni 1), generado al azar en el servidor y único entre salas en espera o en curso. Se normaliza lo que escribe la persona (mayúsculas, sin espacios ni guiones). El QR contiene solo la URL pública de `/join/{codigo}`, nunca tokens. Caducidad: cuatro horas desde la creación, también en espera. Conocer el código permite validar la sala y pedir un alias, no leer datos: cada lectura exige el token de profesor o de participante.

## Estados

| Estado de sala | Operaciones permitidas | Transición |
|---|---|---|
| lobby | Inscripción, QR, lista de participantes, salir de la sala. | running al iniciar con al menos un participante; cancelled por el profesor; expired al caducar. |
| running | Cada participante responde M01–M10 a su ritmo. Inscripción cerrada. | finished o cancelled por el profesor; expired al caducar. |
| finished | Ranking final completo, estadísticas y resultado personal. | Terminal; sin reapertura. |
| cancelled | Sin ranking final publicado. | Terminal. |
| expired | Informar vencimiento; se conservan los datos hasta la retención. | Terminal. |

Salir en espera elimina la inscripción y libera el alias. Salir o desconectarse con la sala en curso conserva al participante en el grupo y en todas las métricas, marcado como «salió».

## Protocolo de sincronización

Cada cambio confirmado (inscripción, salida, inicio, intento evaluado, pista, cierre) aumenta en uno la **revisión** de la sala dentro de la misma operación de base de datos. Después, el servidor publica un aviso por Supabase Realtime Broadcast en el canal `classroom:{id de sala}` con un único dato: `{ revision }`.

Las pantallas nunca reconstruyen el estado a partir de avisos. Al recibir una revisión mayor que la aplicada piden al servidor su **vista autorizada** (profesor o participante), que incluye la hora del servidor. Una vista que llega tarde no sustituye otra más reciente, y una revisión menor o igual se ignora. Los avisos se agrupan: como mucho una consulta por segundo aunque lleguen en ráfaga.

Sin configuración pública de Realtime o con el canal caído, las pantallas consultan la vista cada 2,5 s mientras están visibles; con Realtime conectado, cada 10 s como seguridad. También consultan al volver a la pestaña y al recuperar la red.

| Aviso | Quién lo recibe | Efecto |
|---|---|---|
| Participante entra o sale | Profesor y participantes (solo cifras) | Lista del profesor; «N personas en la sala». |
| Inicio | Participantes | Pasan de la espera al Challenge sin recargar. |
| Intento evaluado o pista | Profesor; el propio participante | Ranking, progreso por misión, «respondieron» y puntos del servidor. |
| Finalizada, cancelada o caducada | Todos | Resultado final o mensaje de cierre. |

Presencia: «conectado» significa que la pantalla del participante consultó la sala en los últimos 15 s. Es informativa y nunca prueba inscripción ni avance.

## Autoridad temporal

Todos los instantes (creación, inicio, fin, recepción y evaluación de intentos) los fija el servidor de la aplicación; el reloj del navegador nunca interviene en puntos ni ranking. El cronómetro del profesor se dibuja con la diferencia entre la hora del servidor recibida y el reloj local.

**Tiempo de ranking (sala a ritmo propio):** tiempo desde el inicio de la sala hasta la evaluación del último acierto del participante. Sin aciertos no hay tiempo que comparar y se muestra «Sin datos». Sustituye, para esta versión, la suma de tiempos por ronda de GAME_SPEC, que requiere rondas.

## Idempotencia y concurrencia

- Cada respuesta lleva un `requestId` (UUID v4 generado en el navegador). Repetir el mismo `requestId` con el mismo contenido devuelve la corrección ya registrada, sin otro intento. Reutilizarlo con otro contenido devuelve un fallo técnico y conserva el primero.
- Reserva en dos fases: `reserveAttempt` bloquea al participante, comprueba idempotencia, que no haya otra corrección pendiente y el máximo de dos intentos académicos; después se evalúa y `completeAttempt` registra el resultado. Dos pestañas no pueden registrar dos envíos simultáneos ni superar dos intentos.
- Una reserva pendiente de más de 30 s (proceso caído a mitad) se marca como fallo técnico y deja de bloquear; no consume intento.
- Resolver la misión o agotar los intentos cierra la oportunidad puntuada: los envíos siguientes se corrigen como práctica y no cambian puntos.
- Las inscripciones se serializan por sala: nunca se supera el cupo ni se repite un alias (sin distinguir mayúsculas).
- Las órdenes del profesor comprueban el estado de origen; una orden repetida o contradictoria devuelve conflicto y la vista actual, nunca una doble transición.

## Reconexión y fallos

| Situación | Comportamiento |
|---|---|
| Recarga o pérdida de red del estudiante | La cookie de la sala lo reconoce: vuelve a la espera, al Challenge (con su avance local) o a su resultado, sin nuevo cupo. |
| Respuesta sin confirmación por la red | El navegador reintenta una vez con el mismo `requestId`; el servidor no duplica el intento. Si falla, error técnico que no consume intento. |
| Realtime interrumpido | Aviso «actualización automática cada pocos segundos» y consulta cada 2,5 s. |
| Profesor desconectado | La sala sigue en curso; al volver con el mismo navegador recupera la consola. |
| Llega alguien tras el inicio | «La actividad ya comenzó»: no entra a mitad de partida. |
| Base de la sala no disponible | No se dan por aceptados envíos; mensaje técnico sin detalles internos. |
| Oracle | La sala usa el mismo evaluador que la práctica individual (sin Oracle en esta versión); un fallo técnico no consume intento. |

## Cierre, ranking y privacidad

El grupo queda fijado al iniciar (la inscripción se cierra) y es el denominador de todas las métricas, aunque alguien salga. El ranking se calcula siempre desde los intentos registrados, con el orden y los empates de GAME_SPEC. Durante la sala el participante ve los cinco primeros y su posición; al finalizar, la lista completa. El profesor ve ranking, progreso por misión, conectados, quién respondió y estadísticas; al finalizar se guardan los resultados por participante.

El alias no es identidad legal. La pantalla de ingreso avisa que alias, puntos y tiempo son visibles para la clase y pide no usar nombre completo, correo ni teléfono. No se guardan correos ni contraseñas de estudiantes. Datos de sala e intentos se conservan 30 días tras el cierre y se eliminan con `classroom_maintenance`. No hay ranking público indexable (`noindex` en `/presenter` y `/join`).

## Diferido a una versión posterior

Rondas guiadas por el presentador (una misión abierta a la vez, revisión y avance), pausa y reanudación con descuento de tiempo, perfil de tiempo ×2, cierre de ronda por vencimiento, identidad docente con Supabase Auth, canales Realtime privados autorizados por pertenencia y recuperación de incidentes Oracle con tiempo restante. Los criterios R03, R07 y R08 de la versión 1.0 aplican a ese modelo y no se evalúan en v1.1.

## Aceptación

| Criterio | Estado en v1.1 |
|---|---|
| R01: dos móviles y una pantalla reciben el mismo estado y revisión tras cada transición. | Verificado en E2E (memoria) con un profesor y dos móviles. |
| R02: cambiar el reloj del móvil no altera tiempo ni puntaje. | Por diseño: el servidor fija todos los instantes; pruebas de contrato con reloj controlado. |
| R04: repetir diez veces el mismo envío deja un solo registro y un solo premio. | Verificado en memoria y PostgreSQL. |
| R05: dos pestañas simultáneas conservan límites y resultado único. | Verificado en memoria y PostgreSQL. |
| R06: al reconectar, la vista del servidor restablece el estado sin duplicados. | Verificado (recarga en espera y en curso, E2E). |
| R09: sin token no se leen vistas ni se ejecutan órdenes; un participante no dirige la sala. | Verificado en contrato y E2E; `anon` y `authenticated` sin acceso a tablas ni funciones. |
| R10: 60 estudiantes completan el circuito; p95 de notificación ≤1 s. | **Pendiente.** Probadas 50 inscripciones y respuestas simultáneas y 61 inscripciones con cupo 60; falta el ensayo en Supabase remoto con dispositivos reales. |
| R11: un fallo técnico no consume intentos. | Verificado (fallos técnicos, reservas caducadas). |
