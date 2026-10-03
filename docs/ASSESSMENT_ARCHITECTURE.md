# ASSESSMENT_ARCHITECTURE — Evaluaciones de DB LAB (Fase 3)

Fecha: 3 de octubre de 2026. Rama `claude-phase3-assessments-20261003`.

Este documento describe el motor de evaluaciones: banco de preguntas, creación por el
profesor, intento del estudiante con tiempo del servidor, autoguardado, calificación de 0.0 a
5.0, retroalimentación, supervisión, resultados y exportación. La seguridad está en
[ASSESSMENT_SECURITY.md](ASSESSMENT_SECURITY.md); el banco, en
[QUESTION_BANK_SPEC.md](QUESTION_BANK_SPEC.md); el uso, en
[ASSESSMENT_TEACHER_GUIDE.md](ASSESSMENT_TEACHER_GUIDE.md).

## 1. Principios

1. **La base decide.** Iniciar, guardar, entregar, calificar, publicar y cerrar son funciones
   de PostgreSQL (`supabase/migrations/20261003120000_assessments.sql`). El navegador nunca
   envía una nota ni un tiempo; solo identificadores de opciones con su revisión.
2. **El estudiante no lee tablas.** Todo lo suyo pasa por funciones `security definer` que
   comprueban sesión, asignación, fechas y estado, y que no devuelven la clave mientras el
   intento está abierto.
3. **Congelar al publicar.** Cada pregunta se copia (con versión y peso) al publicar. Editar
   el banco después no cambia evaluaciones publicadas ni intentos entregados.
4. **Reproducible.** La nota sale de la copia congelada, las respuestas y los pesos
   guardados; recalcularla da lo mismo (`private.grade_attempt`).
5. **Sobriedad en el examen.** Sin efectos que distraigan; React Bits solo fuera del examen.
6. **Reutilizar las Fases 1 y 2.** `profiles.id`, `private.is_teacher()`,
   `profiles.institutional`, sesión httpOnly, AppShell, componentes y tokens.

## 2. Modelo

```
Sección (fundamentos-sql | consultas-relacionales | plsql)
  → question_bank (+ question_options)            banco versionado
  → assessments (+ assessment_assignments)        configuración y audiencia
  → assessment_questions                          copia congelada al publicar
  → assessment_attempts                           un intento por persona y número
  → assessment_answers                            pregunta asignada + respuesta + crédito
  → assessment_events                             supervisión del navegador
  → assessment_audit                              acciones del profesor
```

| Tabla                    | Qué guarda                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `question_bank`          | Sección, tema, subtema, tipo, forma de respuesta, enunciado, consulta, material (tablas y consultas como datos), explicación, concepto, qué revisar, referencia, dificultad interna 1–5, peso, estado (borrador, publicada, retirada), versión, etiquetas, origen (`dblab` u `teacher`) y clave estable de las oficiales. |
| `question_options`       | Texto, tipo (texto, código, tabla), tabla de resultado, si es correcta, posición correcta (ordenar) y retroalimentación de la opción.                                                                                                                                                                                     |
| `assessments`            | Nombre, descripción, sección, temas, modo de selección, cantidad, duración, apertura, cierre, intentos, orden aleatorio de preguntas y opciones, retroalimentación, audiencia, solo institucionales, registro de portapapeles, nota mínima, ciclo de vida y clave del canal del monitor.                                  |
| `assessment_questions`   | Selección (borrador) y copia congelada con versión y peso (publicada).                                                                                                                                                                                                                                                    |
| `assessment_assignments` | Estudiantes elegidos cuando la evaluación no es para todos.                                                                                                                                                                                                                                                               |
| `assessment_attempts`    | Estado, quién lo cerró, `started_at`, `expires_at`, entrega, duración, pregunta actual, última señal, total, correctas, puntaje bruto y posible, porcentaje y nota.                                                                                                                                                       |
| `assessment_answers`     | Pregunta asignada, orden de opciones presentado, respuesta, marca de revisión, revisión, peso copiado, crédito y puntaje.                                                                                                                                                                                                 |
| `assessment_events`      | Tipo, hora (del servidor) y metadatos mínimos (pregunta, duración de la ausencia).                                                                                                                                                                                                                                        |
| `assessment_audit`       | Creada, guardada, duplicada, publicada, accesos cerrados, finalizada, retroalimentación, archivada, eliminada; pregunta creada, actualizada, estado; banco sincronizado.                                                                                                                                                  |

No hay tabla `assessment_results`: el resultado vive en `assessment_attempts` y el detalle en
`assessment_answers` (sin redundancia).

### Estados

- **Evaluación (guardado):** `draft`, `published`, `closed`, `archived`.
- **Fase visible (derivada de fechas):** borrador, programada, activa, sin nuevos accesos,
  finalizada, archivada (`private.assessment_phase` y `assessmentPhase` en TypeScript).
- **Intento:** `in_progress`, `submitted`, `auto_submitted` (con `submitted_by` = `student`,
  `timer` o `teacher`). «Sin iniciar» y «Ausente» se derivan: hay audiencia y no hay intento.
  «Tiempo agotado» es `auto_submitted` por `timer`.

## 3. Selección de preguntas y equivalencia

- **Manual:** el profesor elige preguntas publicadas. Si elige más de las que tendrá cada
  examen, cada intento recibe una parte.
- **Automática:** sección, temas (opcionales) y cantidad. Al publicar se congelan todas las
  preguntas publicadas que cumplen el filtro.
- **Sorteo equivalente** (`private.pick_questions`): muestreo sistemático sobre el conjunto
  ordenado por dificultad y tema, con desplazamiento al azar. Todos reciben la misma cantidad y
  una mezcla de dificultades y temas proporcional al conjunto (probado: 12 preguntas de tres
  dificultades, 6 por examen → siempre 2 + 2 + 2).
- **Orden:** preguntas y opciones al azar si se pide. Los fragmentos a ordenar nunca aparecen
  ya ordenados.
- **Congelado por intento:** la asignación (preguntas, posiciones y orden de opciones) se
  guarda al comenzar. Recargar devuelve exactamente el mismo examen.
- Cantidad configurable de 1 a 100 (el formulario sugiere 10, 20, 30, 40 y 50).

## 4. Tiempo

- `start_attempt` fija `started_at = now()` y `expires_at = min(now() + duración, cierre)`. El
  tiempo empieza al pulsar «Comenzar evaluación», no antes.
- El navegador muestra lo que queda con un reloj de un segundo alineado con la última hora del
  servidor (`useServerClock`); la señal de conexión cada 30 s la corrige.
- Al llegar a 0, el examen envía lo pendiente y pide la entrega por tiempo; la base solo la
  acepta si su reloj confirma el final (con 5 s de tolerancia).
- **Cierre perezoso:** cualquier lectura de un intento vencido (vista del estudiante, lista,
  guardado, monitor, resultados) lo entrega por tiempo con lo guardado. No hace falta un
  proceso programado y funciona aunque el estudiante cierre el navegador.
- Se aceptan respuestas hasta 5 s después de `expires_at` (latencia de red); después, no.
- Doble envío: la entrega bloquea la fila; la segunda llamada devuelve «ya entregada».

## 5. Autoguardado y conexión

`AnswerQueue` (aplicación, sin dependencias):

1. Cada cambio sube la revisión de esa pregunta y se guarda en el dispositivo
   (`localStorage`, solo identificadores).
2. Se envía agrupado 0,7 s después (`/api/attempts/{id}/answers`, hasta 100 respuestas).
3. La base solo acepta una revisión mayor que la guardada: reintentos o peticiones atrasadas
   nunca pisan una respuesta nueva (probado con cinco revisiones simultáneas fuera de orden).
4. Sin conexión: «Sin conexión. Tus respuestas se conservarán temporalmente.», reintentos a
   2, 5, 10, 20 y 30 s y envío inmediato al volver la conexión.
5. La copia local se borra solo cuando el servidor confirma su revisión. Al recargar, lo local
   más nuevo gana.
6. Entregar exige que no quede nada pendiente; si no hay conexión, lo dice y no pierde nada.

La cola es un almacén externo (`useSyncExternalStore`): el primer render coincide con el HTML
del servidor y la copia local se fusiona al montar.

## 6. Calificación (0.0 a 5.0)

| Forma    | Crédito (0 a 1)                                                |
| -------- | -------------------------------------------------------------- |
| Única    | 1 si la opción elegida es la correcta.                         |
| Múltiple | (aciertos − marcas incorrectas) / correctas, nunca menos de 0. |
| Ordenar  | 1 si el orden es exacto.                                       |

- Peso por defecto según la dificultad interna: 1; 1,25; 1,5; 1,75; 2. Configurable por
  pregunta (0,25 a 10) y congelado al publicar.
- `puntaje = Σ crédito × peso`, `porcentaje = puntaje / Σ pesos × 100`,
  `nota = redondeo(puntaje / Σ pesos × 5, 1 decimal)`, aritmética `numeric` exacta.
- Ejemplo probado: 1 × 1 + 0 × 1,5 + 1 × 2 = 3 de 4,5 → 66,67 % → **3.3**.
- La interfaz muestra «Nota final: 4.2 / 5.0», nunca puntos. Aprobación desde 3.0
  (configurable).
- Ausente no es 0.0: sin intento no hay nota.
- Con varios intentos se informa el de mejor nota.

## 7. Retroalimentación

`feedback_mode`: `hidden` (no ve la nota), `score_only`, `answers` (nota y respuestas
correctas) o `full_feedback` (además, por qué, concepto, qué revisar, referencia y la
explicación de la opción elegida). Se fija al crear y el profesor la cambia cuando quiera
desde la ficha (queda en la auditoría). Nunca se libera sola.

## 8. Supervisión

- Eventos verificables: entrada y recarga, pérdida y vuelta de foco, pestaña oculta y
  visible, entrar y salir de pantalla completa, intento de copiar, pegar y menú contextual (si
  el profesor lo activa; no se bloquean), desconexión y reconexión, salida de la página,
  comienzo y entrega.
- `EventBuffer` agrupa repeticiones (1,5 s), mide la duración de las ausencias y envía con la
  señal de conexión cada 30 s, o cada 5 s si hay eventos. Máximo 40 por lote y 800 por intento.
- El monitor (`/teacher/assessments/{id}/monitor`) muestra estudiante, estado, pregunta
  actual, progreso, tiempo restante (hora del servidor), conexión (señal en los últimos 75 s),
  último evento y el recuento («2 pérdidas de foco»), sin colores alarmistas y con el aviso
  «Los eventos son señales del navegador, no pruebas de fraude».

### Realtime

- La base envía un aviso **sin datos** (`realtime.send`, «broadcast from database») al canal
  `assessment-monitor:{clave aleatoria de la evaluación}` cuando cambia algo relevante. Como
  mucho un aviso cada 2 s por evaluación.
- El monitor, al recibirlo, pide de nuevo su vista autorizada al servidor (como mucho cada
  3 s, con una repetición final). Sin Realtime, consulta cada 20 s; con Realtime, cada 60 s
  como red de seguridad.
- Nunca se retransmite cada pulsación ni se envían datos personales por el canal. Probado en
  E2E: un estudiante comienza y el monitor abierto lo muestra en unos 4 s sin recargar.

## 9. Resultados y exportación

- Resumen: participantes, entregados, en curso, ausentes o sin iniciar, promedio, mediana,
  máxima, mínima, distribución por rangos y aprobación.
- Por estudiante: nombre, apellido, correo, estado, inicio, entrega, tiempo, correctas, nota y
  «Ver intento» (respuestas frente a la clave congelada y línea de tiempo de eventos).
- Por pregunta (solo las presentadas): porcentaje correcto, dificultad observada (≥ 80 %
  fácil, ≥ 50 % intermedia, menos difícil), opciones elegidas y distractor frecuente (≥ 25 %),
  para detectar preguntas ambiguas o conceptos mal comprendidos.
- CSV estándar (coma, punto decimal) y CSV para Excel en español (punto y coma, coma decimal),
  con BOM UTF-8, celdas peligrosas neutralizadas y nombre de archivo sin datos personales.
  Columnas: Nombre, Apellido, Correo, Evaluación, Sección, Fecha, Estado, Inicio, Entrega,
  Duración, Correctas, Total, Porcentaje, Nota. Detalle por pregunta opcional. XLSX no se
  incluye para no añadir dependencias; el CSV para Excel cubre el uso.

## 10. Capas y archivos

| Capa            | Archivos                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base            | `supabase/migrations/20261003120000_assessments.sql`                                                                                                                                                                                                                           |
| Dominio         | `features/assessments/domain/` (`assessment.ts`, `question.ts`, `topics.ts`, `bank/`)                                                                                                                                                                                          |
| Aplicación      | `answer-queue.ts`, `exam-timer.ts`, `event-buffer.ts`, `exam-wire.ts`, `student-assessments.ts`, `results.ts`, `csv-export.ts`, `assessment-forms.ts` (zod, solo servidor), `form-values.ts`, `teacher-notices.ts`, `assessment-api.ts`                                        |
| Infraestructura | `supabase-assessment-repository.ts` (servidor), `http-exam-gateway.ts`, `browser-exam-storage.ts`, `monitor-subscription.ts` (navegador)                                                                                                                                       |
| Presentación    | examen (`exam-parts.tsx`), pantalla previa, resultado, tarjetas, formulario, ficha, monitor, resultados, banco, revisión de intento                                                                                                                                            |
| Composición     | `composition/assessments/` (cargadores, Server Functions, API del examen, exportación, raíz del examen y del monitor)                                                                                                                                                          |
| Rutas           | `/evaluations`, `/evaluations/[id]`, `/evaluations/[id]/attempt`, `/api/attempts/[id]` (+ `answers`, `events`, `submit`), `/teacher/assessments` (+ `new`, `[id]`, `monitor`, `results`, `results/[attemptId]`, `export`), `/teacher/questions` (+ `new`, `[id]`, `[id]/edit`) |

zod no llega al navegador: los módulos que usa el examen (`exam-wire`, `form-values`,
`assessment-forms-messages`) no lo importan.

## 11. Rendimiento y concurrencia

- El banco nunca se descarga completo: búsqueda y filtros en el servidor, 20 por página. El
  formulario de evaluación recibe solo resúmenes de preguntas publicadas.
- El examen no carga analítica ni el banco; el monitor carga la biblioteca de Realtime solo en
  su pantalla.
- Índices por evaluación, estudiante, pregunta, estado y fecha; un índice único parcial evita
  dos intentos abiertos; un bloqueo consultivo serializa los inicios de una misma persona.
- Probado contra Supabase real: 40 estudiantes a la vez (comenzar, responder, eventos y doble
  entrega simultánea) sin notas duplicadas ni respuestas mezcladas. El diseño admite unos 100
  sin cambios: cada estudiante hace una escritura agrupada cada pocos segundos y una señal cada
  30 s.

## 12. Oracle

Las evaluaciones son conceptuales y viven en Supabase; Oracle sigue ejecutando el laboratorio
y M10. Las preguntas de predicción usan resultados del motor educativo, que las pruebas
comparan con Oracle real. Para una futura pregunta que ejecute SQL en Oracle, el contrato es
una forma de respuesta nueva (`sql`) con su calificación en el servidor reutilizando
`OracledbQueryExecutor` y la comparación de resultados del Challenge; no hace falta un segundo
ejecutor.

## 13. Decisiones y alternativas descartadas

- **Tablas solo para el profesor y funciones para el estudiante** en lugar de permisos por
  columna: imposible filtrar la clave por error con `select=*`.
- **Copia congelada en `assessment_questions`** y no por intento: misma versión para todos y
  menos almacenamiento; el intento guarda solo el orden y la respuesta.
- **Cierre perezoso** en lugar de `pg_cron`: no depende de extensiones y funciona igual.
- **Aviso por Realtime desde la base** y no desde el servidor con la clave secreta: no añade
  secretos a la aplicación.
- **Monitor sin cliente de Supabase autenticado en el navegador:** el canal es público pero su
  nombre lleva una clave aleatoria que solo conoce el profesor, y el aviso no contiene datos.
