# ASSESSMENT_SECURITY — Seguridad, privacidad e integridad de las evaluaciones

Fecha: 3 de octubre de 2026. Complementa [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md) (Fase 2)
y [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md).

## 1. Modelo de amenazas

| Amenaza                                               | Defensa                                                                                                                                                                | Prueba                                                                                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ver las respuestas correctas antes de entregar        | El estudiante no tiene acceso a ninguna tabla; `attempt_view` devuelve solo enunciado, material y opciones (`id`, texto, tipo, tabla) mientras el intento está abierto | PGlite: claves exactas de cada objeto y búsqueda de textos de la clave; E2E: el HTML del examen no contiene `"correct"`, `is_correct`, `"explanation"` ni retroalimentación |
| Ponerse nota (`grade = 5`)                            | Sin permisos de escritura en ninguna tabla; la nota la calcula `private.grade_attempt`                                                                                 | PGlite: `update … set grade = 5` → 42501                                                                                                                                    |
| Leer o escribir el intento de otro                    | Cada función filtra por `student_id = auth.uid()`                                                                                                                      | PGlite y Supabase real: `not-found`; E2E: 404 por la API                                                                                                                    |
| Iniciar fuera de fecha, sin asignación o sin intentos | `start_attempt` comprueba estado, fechas, audiencia, institucional y número de intentos                                                                                | PGlite: no abre, cerrada, sin intentos, institucional, elegidos                                                                                                             |
| Responder después del tiempo                          | `save_answers` rechaza después de `expires_at` + 5 s y entrega por tiempo                                                                                              | PGlite y E2E (móvil): entrega automática con lo guardado                                                                                                                    |
| Doble envío o doble inicio                            | Bloqueo de fila al entregar; bloqueo consultivo e índice único parcial al iniciar                                                                                      | Supabase real: 6 inicios simultáneos → 1 intento; 40 dobles envíos → 40 notas                                                                                               |
| Respuesta atrasada pisa una nueva                     | Revisión monótona por pregunta                                                                                                                                         | Supabase real: revisiones 3, 1, 5, 2, 4 en paralelo → queda la 5                                                                                                            |
| Respuesta con opciones de otra pregunta               | `private.normalize_response` valida contra el orden asignado                                                                                                           | PGlite: rechazada                                                                                                                                                           |
| Inyectar eventos falsos o inundar la tabla            | Tipos permitidos, 40 por lote, 800 por intento, metadatos construidos en el servidor                                                                                   | PGlite: un tipo inventado se descarta y el tope se respeta                                                                                                                  |
| Estudiante en el panel docente                        | `proxy.ts`, `requireTeacher` y RLS (`private.is_teacher()`)                                                                                                            | E2E: «Acceso denegado» sin datos; RPC docentes → `forbidden`                                                                                                                |
| Cambiar una evaluación publicada en silencio          | Funciones solo editan borradores; disparador impide tocar `assessment_questions` publicadas                                                                            | PGlite: `update` como superusuario → 42501                                                                                                                                  |
| Editar las preguntas oficiales                        | `official-readonly`; se duplican como borrador propio                                                                                                                  | PGlite                                                                                                                                                                      |
| Fórmulas en el CSV                                    | Celdas que empiezan por `=`, `+`, `-`, `@`, tabulador o retorno se prefijan con `'`                                                                                    | Unitarias                                                                                                                                                                   |
| Envío desde otro sitio                                | Cookies SameSite=Lax, `isSameOrigin` en la API del examen y Origin de las Server Functions                                                                             | Heredado de la Fase 2                                                                                                                                                       |

## 2. Privilegios

- `anon`: nada (sin `select` ni `execute`).
- `authenticated`: `select` en las nueve tablas, filtrado por políticas que exigen
  `private.is_teacher()`. Un estudiante obtiene listas vacías. `execute` solo en las funciones
  de la API, cada una con su comprobación.
- `service_role`: todo, más `admin_purge_assessment_events` (retención).
- Funciones auxiliares en el esquema `private`, sin `execute` para `anon` ni `authenticated`.
- Ninguna política `USING (true)` sobre datos privados.

## 3. Funciones de la API

| Quién      | Función                                                                                                                                                                                                        | Comprueba                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Estudiante | `student_assessments`, `student_assessment`                                                                                                                                                                    | Sesión, audiencia (o intento propio); nota solo si fue liberada                      |
| Estudiante | `start_attempt`                                                                                                                                                                                                | Sesión, estado, fechas, audiencia, institucional, intentos, cierre en menos de 1 min |
| Estudiante | `attempt_view`                                                                                                                                                                                                 | Intento propio; sin clave abierto; retroalimentación según lo liberado               |
| Estudiante | `save_answers`, `log_attempt_events`, `submit_attempt`                                                                                                                                                         | Intento propio, abierto y vigente; revisión; tipos de evento                         |
| Profesor   | `save_question`, `set_question_status`, `sync_official_questions`                                                                                                                                              | `is_teacher()`; validación de forma; versión                                         |
| Profesor   | `save_assessment`, `duplicate_assessment`, `publish_assessment`, `close_assessment_entries`, `finalize_assessment`, `set_feedback_mode`, `archive_assessment`, `delete_draft_assessment`, `assessment_monitor` | `is_teacher()`; estado del ciclo de vida; auditoría                                  |

La aplicación no usa la clave secreta para nada de esto: todas las llamadas van con la sesión
de la persona (cookie httpOnly) y la clave publicable.

## 4. Lo que la supervisión no hace (y no promete)

Un navegador no puede saber qué hace una persona fuera de la página. DB LAB registra solo
eventos técnicamente verificables y lo dice antes de comenzar:

> Durante esta evaluación se registran eventos del navegador como pérdida de foco, desconexión
> o salida de pantalla completa.

No se graba la cámara ni el micrófono, no se capturan pantallas, no hay registro de teclas, no
se guarda texto escrito fuera de las respuestas, no se lee el historial ni se usan técnicas
ocultas. Copiar, pegar y el menú contextual se registran (si el profesor lo activa) pero no se
bloquean, para no romper la accesibilidad ni las ayudas técnicas. El monitor y la revisión
muestran hechos («2 pérdidas de foco») con el aviso de no interpretarlos automáticamente como
fraude. La pantalla completa es opcional y solo se registra su salida si estaba activa.

## 5. Datos personales

- No se añaden datos: nombre, apellido y correo siguen viniendo de `profiles` (Fase 2).
- Eventos sin IP, sin agente de usuario, sin ubicación y sin huella del dispositivo.
- URLs sin datos personales: el examen está en `/evaluations/{id}/attempt` y el intento se
  busca con la sesión; los avisos usan códigos (`?aviso=entregada`).
- Exportaciones solo para el profesor, sin identificadores internos ni eventos.
- El canal del monitor no transporta datos: solo «algo cambió».

## 6. Retención de eventos de supervisión

Los eventos no deberían guardarse indefinidamente. Estrategia preparada:

- `public.admin_purge_assessment_events(días)` (solo `service_role`) borra los eventos de
  evaluaciones finalizadas o archivadas más antiguos que `días` (mínimo 30).
- Propuesta: 180 días después de cerrar el periodo académico, salvo un proceso de revisión
  abierto. Puede ejecutarse a mano desde el SQL Editor de Supabase o programarse con `pg_cron`
  cuando el responsable lo decida.
- Las notas y respuestas se conservan según la política académica de la universidad (no la
  decide esta fase).

## 7. Integridad académica

- Publicar congela la versión y el peso de cada pregunta; editar el banco crea una versión
  nueva sin tocar lo publicado.
- La nota se puede recalcular y da el mismo resultado (probado).
- Cada acción sensible del profesor (crear, guardar, publicar, cerrar accesos, finalizar,
  liberar retroalimentación, archivar, eliminar borrador, sincronizar el banco) queda en
  `assessment_audit` con la persona y la hora.

## 8. Riesgos conocidos

- **Fuera de la página nada es verificable:** otra pestaña, otro dispositivo o ayuda de otra
  persona no se detectan. La evaluación es un instrumento académico, no un sistema infalible.
- **Canal del monitor público:** quien conozca la clave aleatoria (solo está en el HTML del
  monitor del profesor) puede saber cuándo cambia algo, sin ningún dato.
- **Reloj del dispositivo:** la interfaz se corrige con la hora del servidor; la autoridad del
  final del tiempo es siempre la base.
- **Tolerancia de 5 s** al final del tiempo para respuestas en tránsito.
