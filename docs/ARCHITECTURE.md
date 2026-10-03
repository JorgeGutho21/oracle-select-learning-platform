# ARCHITECTURE — Capas y límites del sistema

Versión 1.0 · Diseño propuesto, todavía sin implementación.

## Decisiones centrales

La web comparte contenido entre exposición y estudio. El servidor valida respuestas, administra las salas y solicita ejecuciones SQL a un servicio exclusivo para Oracle. PostgreSQL almacena la actividad de la plataforma; Oracle ejecuta el SQL que aprende el estudiante. No se presenta PostgreSQL, SQLite ni una comparación de cadenas como motor Oracle.

En la conversación previa se sugirió un evaluador local. Esta especificación adopta el requisito actual de «laboratorio SQL real»: el evaluador local queda limitado a representaciones visuales identificadas como demostraciones; una ejecución del laboratorio requiere Oracle. Si Oracle falta, la función se declara no disponible y la versión no cumple P08.

## Componentes y despliegue propuesto

| Componente | Responsabilidad | Decisión de implementación futura |
|---|---|---|
| Aplicación web | Rutas, contenido, editor y actividades. | Next.js, React y TypeScript estricto. Bootstrap con Sass para retícula y tokens propios. |
| Interacciones | Edición SQL y manipulación accesible de piezas. | CodeMirror 6 y una solución de arrastre como dnd-kit, incluyendo botones alternativos. |
| Servicios de aplicación | Casos de uso, autorización, contratos y puntuación. | Servidor de la web, con validación de entradas y repositorios separados de componentes. |
| Persistencia | Identidades, salas, rondas, intentos y resultados. | Supabase PostgreSQL y Auth. |
| Tiempo real | Notificación de cambios confirmados de la sala. | Canales privados de Supabase Realtime; el estado persistido sigue siendo autoridad. |
| Servicio Oracle | Verificar el subconjunto, ejecutar y devolver resultados limitados. | Servicio Node.js persistente con node-oracledb y grupo de conexiones; red restringida. |
| Base educativa | Tabla EMPLEADOS inmutable durante una versión. | Oracle con sintaxis compatible con 19c. Versión exacta del servidor y driver fijadas en hito R1. |
| Multimedia | Distribuir ambos vídeos sin inflar la carga inicial. | Alojamiento externo y carga a demanda; proveedor definitivo en R5. |
| Publicación | Web y API pública. | Vercel es propuesta de continuidad; el servicio Oracle requiere alojamiento con conectividad real a Oracle. |

Las versiones exactas de las dependencias se verifican y fijan al iniciar implementación; no se usan etiquetas móviles sin archivo de bloqueo. No es necesario añadir Motion, un buscador externo o un motor de flujos: transiciones CSS y un índice de contenido pequeño cubren el alcance inicial.

El driver admite conexiones a Oracle y agrupación de conexiones; su configuración concreta se prueba con la versión elegida. [Documentación de node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/connection_handling.html). No se asume que alojar la web también aloja una base Oracle.

## Capas

| Capa | Elementos | Dependencias permitidas |
|---|---|---|
| Presentación | Páginas, componentes, estados de interfaz y accesibilidad. | Casos de uso o adaptadores de cliente. No credenciales ni consultas administrativas. |
| Aplicación | Ejecutar consulta, inscribir, iniciar ronda, enviar intento, cerrar ronda y leer resultados. | Dominio e interfaces de infraestructura. |
| Dominio | Definiciones de misión, reglas de puntuación, alcance SQL, transiciones e invariantes. | Tipos y reglas propias; sin dependencia de React, Supabase o red. |
| Infraestructura | Oracle, PostgreSQL, autenticación, Realtime, reloj y almacenamiento local. | Implementa contratos de aplicación y dominio. |

Proyección didáctica (27 de septiembre de 2026): el catálogo de qué parte de EMPLEADOS enseña cada concepto vive en el dominio (`domain/concepts/concept-projections.ts`); la aplicación (`application/didactic-projection.ts`) ejecuta cada consulta con el motor educativo sobre esas filas y la Exposición solo la presenta. No es otro dataset: son selecciones del dataset único.

Módulos funcionales: contenido, exposición, estudio, búsqueda, laboratorio, Challenge, salas y resultados. Cada uno tiene responsabilidades delimitadas; se comparten datos y contratos, no un único componente gigante. No se propone una red de microservicios: solo se separa Oracle por su conexión persistente y aislamiento.

## Flujos de datos y contratos

**Consulta libre:** editor → caso de uso EjecutarConsulta → control de tamaño/frecuencia → analizador del subconjunto → servicio Oracle → resultado tipado → traducción y tabla. La traducción se deriva del árbol de la consulta, sin IA generativa.

**Intento puntuado:** sesión autenticada → validación de sala/ronda/tiempo → reserva idempotente del intento → corrección semántica o Oracle según misión → transacción de resultado → aumento de revisión → aviso privado de cambio. El navegador nunca envía un puntaje confiable.

**Práctica individual:** usa el mismo servicio de corrección de respuestas y los mismos contratos de misión, sin crear una sala ni persistir intentos en PostgreSQL. El cliente conserva avance y aplica la regla de puntos a la corrección recibida; esa suma local es informativa y no confiable para competir. Las rúbricas completas permanecen en servidor y la explicación se entrega al cerrar la oportunidad puntuada. Las demostraciones visuales de lección no necesitan consultar Oracle en cada gesto.

**Lectura de sala:** validar pertenencia → instantánea autorizada con revisión, hora del servidor y ronda → suscribir avisos → refrescar ante cambio. No es necesario conservar un historial ilimitado de eventos para reconstruir la sala.

| Operación conceptual | Entrada esencial | Salida esencial |
|---|---|---|
| Consultar catálogo | Versión de contenido. | Lecciones, recursos y enunciados públicos. |
| Ejecutar consulta | SQL, request_id, versión de dataset. | Estado, columnas ordenadas con tipos, filas, tiempo y versión. |
| Crear sala | Identidad docente, versiones, perfil de tiempos. | Identificador, código de ingreso, QR público y estado. |
| Inscribir participante | Código y alias; identidad desde sesión. | participant_id, rol, estado de sala. |
| Enviar respuesta | round_id, request_id, respuesta de tipo de misión. | Confirmación persistida, estado de corrección, feedback permitido. |
| Corregir práctica individual | mission_id, versión, respuesta y contexto local de práctica. | Corrección semántica y feedback; sin escritura de resultados de sala. |
| Solicitar pista | round_id y request_id. | Pista pública y confirmación del descuento aplicable. |
| Cambiar estado | Acción docente, revisión esperada, request_id. | Nueva instantánea o conflicto recuperable. |
| Leer resultados | Contexto de partida o sala. | Datos propios o agregados según permisos. |

Contrato de error uniforme: categoría, mensaje pedagógico, acción recuperable, identificador de seguimiento y ubicación opcional del error SQL. No exponer trazas, credenciales o nombres de infraestructura al estudiante.

## Identidad, autorización y datos

El presentador utiliza cuenta autenticada habilitada previamente. Los estudiantes usan identidad anónima de Supabase y alias de sala, sin formulario de registro. Una identidad anónima tiene sesión autenticada; no se confunde con un visitante sin sesión. [Supabase: accesos anónimos](https://supabase.com/docs/guides/auth/auth-anonymous).

La base impide escritura directa del cliente en salas, rondas, puntuaciones e intentos. API autorizada y transacciones ejecutan mutaciones; lectura protegida por RLS y por pertenencia. La cuenta de servicio se mantiene exclusivamente en servidor, y cada operación comprueba propietario o participante antes de acceder. Los canales Realtime se autorizan aparte de las rutas. [Supabase: autorización Realtime](https://supabase.com/docs/guides/realtime/authorization).

El servicio Oracle no tiene acceso a resultados, identidades ni credenciales de Supabase. La cuenta de ejecución Oracle solo lee la tabla educativa permitida; no es su propietaria y no tiene privilegios generales ni permisos para paquetes de red. El propietario del dataset se utiliza únicamente en tareas administrativas fuera del editor.

Validar origen de peticiones, sesión y expiración; limitar intentos de ingreso por identidad y dirección de red sin bloquear a toda una universidad tras pocos accesos compartidos. Alias tratados como texto, no HTML. Respuestas y errores se muestran escapados.

## Servicio Oracle implementado (Fase 8)

El puerto `OracleQueryExecutor` (`src/application/oracle-executor.ts`) tiene dos adaptadores en `src/infrastructure/oracle`: `OracledbQueryExecutor`, con node-oracledb en modo Thin, grupo de conexiones, cola acotada, plazo total y salud real (dataset y privilegios); y `UnconfiguredOracleExecutor`, que declara «no conectado» sin simular. La raíz `src/composition/oracle/oracle-server.ts` (`server-only`) elige uno según el entorno y lo comparten el laboratorio, la práctica del Challenge y la sala en vivo, así que M10 se califica con el mismo Oracle en los tres. El driver se excluye del empaquetado (`serverExternalPackages`) y se carga la primera vez que se usa.

Diferencia con la tabla de componentes: el servicio Oracle corre dentro del servidor de la web en lugar de un servicio Node separado. La cuenta lectora, los límites y el aislamiento de LAB_SPEC se aplican igual; separarlo sigue siendo posible sin cambiar el puerto si el alojamiento de la web no tiene red hasta Oracle.

## Sala en vivo implementada (Fase 7, REALTIME_SPEC 1.1)

Módulo `src/features/classroom`, con las mismas capas que el resto:

| Capa | Contenido |
|---|---|
| Dominio | Código de sala, saneado de alias, estados y transiciones, ranking, progreso por misión y estadísticas (sin React, red ni almacenamiento). |
| Aplicación | `ClassroomService` (crear, inscribir, iniciar, finalizar, cancelar, salir, responder, pista, vistas), puertos `ClassroomRepository`, `RoomNotifier`, `PresenterGate` y `ClassroomSecrets`, esquemas Zod y la superficie `classroom-api` para presentación. |
| Infraestructura | `SupabaseClassroomRepository` (solo RPC a las funciones de la migración), `MemoryClassroomRepository` (desarrollo y pruebas, activado expresamente), aviso por Supabase Broadcast, suscripción del navegador, tokens y huellas de Node. |
| Presentación | Consola del profesor, ingreso móvil, espera, resultado personal, `/live` y `/results`. Recibe acciones por props; no importa Supabase. |
| Composición | `src/composition/classroom`: raíz de servidor (`server-only`) que elige el almacenamiento por entorno, Server Functions con cookies `httpOnly`, y raíces de cliente que unen el Challenge en vivo con esas funciones. |

React nunca accede a Supabase para leer o escribir datos: todo pasa por Server Functions que validan con Zod y llaman al servicio. El navegador solo abre, si está configurado, un canal Broadcast de solo lectura que transporta la revisión. La clave `service_role` se lee únicamente en la raíz de servidor.

La sala reutiliza el motor del Challenge (`ChallengeEngine`) y el mismo evaluador del servidor que la práctica: una única definición de corrección y de puntos (A05). El navegador conserva su avance local por sala; los puntos, intentos, tiempos y el ranking los calcula el servidor desde los intentos registrados (A02).

Diferencias con la identidad descrita arriba, aceptadas para v1.1: el profesor usa una clave de servidor en lugar de una cuenta de Supabase Auth, y los estudiantes un token por sala en cookie en lugar de una identidad anónima de Auth. La autorización se comprueba en cada operación con la huella del token. La cuenta docente y los canales privados quedan para la versión con rondas.

## Operación y fallos

- Configuración de servidor para secretos, URLs, tamaño del grupo Oracle, plazos y versiones. Nunca se incluye una clave privilegiada en recursos enviados al cliente.
- Oracle limita a diez ejecuciones concurrentes inicialmente y una activa por identidad. Las solicitudes en cola tienen plazo total de cinco segundos; una cola llena devuelve ocupado, sin consumir intento académico.
- Una lectura real de la tabla y comprobación de dataset determina salud de Oracle. Una página web accesible no basta para declarar operativo el laboratorio.
- Observabilidad mínima: request_id, estado, latencia, categoría de error y versiones. No registrar tokens ni SQL completo de práctica libre. En sala el SQL enviado se almacena como respuesta para revisión privada y se elimina conforme a retención.
- No se depende de tareas temporizadas en la memoria de una función efímera para cerrar rondas. Un proceso de mantenimiento fiable cierra vencimientos y recupera correcciones pendientes; además, cada lectura y envío verifica el vencimiento persistido.
- Despliegues de contenido mantienen accesible la versión fijada de una sala activa. No cambiar dataset, rúbrica ni misiones a mitad de partida.
- Caída de Realtime: instantáneas periódicas autorizadas. Caída de Oracle: laboratorio no disponible y pausa de rondas que lo requieren. Ver REALTIME_SPEC para recuperación.

## Aceptación arquitectónica

- A01: una consulta permitida produce resultado verificable en Oracle y no accede a tablas de la plataforma.
- A02: modificar puntos o tiempo en el navegador no modifica resultados del servidor.
- A03: otra identidad o el código público no permite dirigir ni leer intentos privados de una sala.
- A04: ninguna clave de Oracle o de servicio aparece en recursos del navegador o respuestas públicas.
- A05: aplicación, dominio y adaptadores se prueban por separado; reglas de evaluación y puntuación tienen una única definición versionada.
- A06: una sala con versión anterior sigue funcionando tras publicar una nueva versión del contenido.
- A07: restaurar una copia de la base de aplicación en un entorno de prueba permite recalcular los resultados desde intentos y rúbrica, sin depender de memoria del servidor.

## DB LAB Fase 1: arquitectura de secciones

3 de octubre de 2026. La plataforma se presenta como DB LAB y se organiza en tres secciones que **envuelven** las funcionalidades existentes. No se tocó el backend: ni Supabase, ni Oracle, ni las credenciales, ni las tablas, ni la sala.

### Módulo `features/sections`

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Dominio | `domain/sections.ts` | Registro `SECTIONS`: id, número, título, objetivo, práctica, estado (`available` o `coming-soon`), requisitos, temas previstos y modos (`class`, `study`, `practice`, `challenge`, `resources`, `evaluation`). Un modo sin destino tiene `href: null`. |
| Aplicación | `application/sections-api.ts` | DTO de cada sección. Para la Sección 1, el temario sale de los bloques y lecciones reales del Modo Estudio y las cifras, del contenido publicado. También da vecinos y modos disponibles. |
| Presentación | `presentation/*` | SectionCard, ModeGrid, SectionRoute, SectionDetail, SectionsHub y LearningOverview. |
| Composición | `composition/sections/*` | Raíces cliente que **leen** el progreso real del Modo Estudio (misma clave `sql-select-lab:study:progress`) y huecos de avance por sección. |

### Rutas

**Nuevas:**
- `/sections`: portada de secciones y «Mi aprendizaje».
- `/sections/[section]`, con `generateStaticParams` sobre `SECTION_IDS` y `dynamicParams = false`: `fundamentos-sql`, `consultas-relacionales`, `plsql`. Cualquier otra dirección da 404.

**Conservadas sin cambios:**
- Estudio: `/learn` y `/learn/[slug]`.
- Exposición: `/presentation` y `/presentation/presentador`.
- Práctica y juego: `/lab`, `/challenge`.
- Sala: `/live`, `/join/[code]`, `/presenter/[code]`, `/results`.
- Recursos y ruta: `/resources`, `/modules`.
- Los QR, las claves de almacenamiento y las versiones (`select-study-v2`, `select-challenge-v4`, `empleados-select-v2`).

**Modos de la Sección 1:** enlazan esas rutas; no se duplican bajo `/sections/1/...`. Así no hay dos URL para el mismo contenido.

### AppShell

`presentation/layouts/app-shell.tsx` reúne salto al contenido, cabecera, `main` y pie. Las variantes por modo siguen en `ModuleLayout`. `main` mide al menos una pantalla: así el pie no salta cuando React revela el contenido transmitido. El CLS de Inicio, Estudio y Challenge bajó de 0,25–0,65 a 0.

### Decisiones para las fases siguientes

1. **Contenido nuevo de una sección:** se añade a su registro y a su propio módulo, sin tocar la Sección 1. Para publicar una sección basta con cambiar su estado y dar `href` a sus modos.
2. **Plan de la Sección 2** ([SECTION_2_MIGRATION_PLAN.md](SECTION_2_MIGRATION_PLAN.md)): la portada pública de la sección es `/sections/consultas-relacionales`. Las lecciones pueden vivir en `/learn/<slug>` o bajo la sección, según se decida al implementarlas. Esto sustituye a `/learn/sql-avanzado` como portada.
3. **Progreso:** desde la Fase 2 se sincroniza con la cuenta (sección siguiente). El contrato previsto aquí se cumplió con un modelo más general: registros por sección, modo y elemento (`learning_progress`), registro canónico de elementos y fusión monótona en el cliente y en la base. La importación del progreso local ocurre al iniciar sesión, sin perder nada; se anuncia en el registro («Tu progreso de invitado en este dispositivo se suma a la cuenta»).
4. **Evaluaciones:** el modo `evaluation` ya existe en el registro con `href: null`. La futura ruta (`/sections/<id>/evaluacion` o `/evaluaciones`) debe validar en el servidor y no reutilizar la puntuación del Challenge.
5. **Navegación:** se mantienen seis entradas. «Mi progreso», «Mi perfil» y «Panel docente» están en el menú de cuenta (Fase 2), no en la barra.

## DB LAB Fase 2: cuentas, roles, progreso sincronizado y panel docente

Detalle completo en [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md). Resumen de decisiones:

1. **Supabase para identidad y plataforma; Oracle para las prácticas.** Ninguna consulta de estudiante pasa por Supabase.
2. **Sesión en cookies httpOnly con `@supabase/ssr` y sin cliente de Supabase en el navegador para cuentas o progreso.** Las páginas y rutas de API del servidor consultan con la clave publicable y la sesión (RLS como esa persona). La clave secreta no participa en ningún flujo de la aplicación.
3. **Autorización en la base:** RLS, privilegios por columna, disparadores y `admin_set_role` (solo `service_role`). El rol `teacher` no se puede elegir ni enviar desde el cliente.
4. **Contenido público estático.** Solo `/dashboard`, `/profile`, `/teacher` y `/reset-password` pasan por `src/proxy.ts`. La cabecera resuelve el menú de cuenta en el navegador y un invitado no hace peticiones extra.
5. **Progreso local primero.** Las claves de siempre siguen siendo la fuente inmediata. Los repositorios se envuelven en la composición (`composition/progress/progress-sync-client.ts`) para avisar a la sincronización, sin cambiar las funcionalidades de la Fase 1.
6. **Rutas nuevas:**
   - acceso: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/auth/callback`;
   - cuenta: `/dashboard`, `/profile`, `/teacher`, `/access-denied`;
   - API: `/api/session`, `/api/progress`, `/api/presence`.
7. **Presencia por señal lenta en tabla con RLS** y no por Realtime Presence: un canal privado compartido expondría la presencia de cada estudiante a los demás.
8. **Sin tabla de actividad.** La actividad reciente sale de `learning_progress.last_activity_at`.

Contratos para la Fase 3 (evaluaciones):

- `profiles.id` es la identidad. `private.is_teacher()` autoriza al profesor y `profiles.institutional` marca a los estudiantes institucionales verificados.
- Las tablas de evaluación usarán RLS con el mismo patrón: lectura propia, profesor lee todo y escrituras de calificación por funciones de servidor, nunca desde el cliente.
- La Fase 3 activará el modo `evaluation` del registro de secciones con su `href` y su entrada en `PROGRESS_CATALOG`.
- La supervisión de exámenes no reutilizará `learner_presence`: tendrá su propia tabla y función de escritura.

## DB LAB Fase 3: evaluaciones calificadas

Detalle completo en [ASSESSMENT_ARCHITECTURE.md](ASSESSMENT_ARCHITECTURE.md), seguridad en [ASSESSMENT_SECURITY.md](ASSESSMENT_SECURITY.md) y banco en [QUESTION_BANK_SPEC.md](QUESTION_BANK_SPEC.md). Resumen de decisiones:

1. **La base decide la nota y el tiempo.** Iniciar, guardar, entregar, calificar (0.0–5.0, ponderada, reproducible), publicar y cerrar son funciones de PostgreSQL. El navegador envía identificadores de opciones con su revisión; nunca una nota ni una hora.
2. **Contratos de la Fase 2 usados tal cual:** `profiles.id` como identidad, `private.is_teacher()` en todas las políticas y funciones docentes, `profiles.institutional` para «solo institucionales», sesión httpOnly sin cliente de Supabase autenticado en el navegador.
3. **Más estricto que el patrón previsto:** el estudiante no lee ninguna tabla de evaluaciones, ni siquiera las suyas; todo pasa por funciones que devuelven solo lo permitido. El profesor lee con RLS. Ninguna escritura directa.
4. **Copia congelada al publicar** (`assessment_questions.snapshot` con versión y peso): editar el banco no altera evaluaciones publicadas ni intentos entregados.
5. **Evaluación ≠ progreso ni Challenge.** El modo `evaluation` de la Sección 1 enlaza a `/evaluations?seccion=fundamentos-sql`; no se añade a `PROGRESS_CATALOG` (una nota no es avance de aprendizaje) y no toca puntos ni ranking del Challenge.
6. **Supervisión propia** (`assessment_events`), sin reutilizar `learner_presence`. Monitor con aviso por Realtime desde la base (sin datos personales) y consulta de respaldo.
7. **Rutas nuevas:** `/evaluations`, `/evaluations/[id]`, `/evaluations/[id]/attempt`, `/api/attempts/[id]` (+ `answers`, `events`, `submit`), `/teacher/assessments` (+ `new`, `[id]`, `monitor`, `results`, `results/[attemptId]`, `export`), `/teacher/questions` (+ `new`, `[id]`, `[id]/edit`). `/evaluations` se suma a las rutas privadas del proxy. El panel docente tiene navegación propia (Resumen y estudiantes, Evaluaciones, Banco de preguntas).
8. **Política de contenido:** `connect-src` admite el WebSocket de Supabase (`wss://` del proyecto) y, solo para pruebas, un Supabase local en 127.0.0.1 o localhost.

Contratos para la Fase 4:

- Una forma de respuesta nueva (texto o SQL ejecutado en Oracle) se añade en `private.normalize_response` y `private.item_credit`; para SQL, la calificación reutiliza `OracledbQueryExecutor` y la comparación de resultados del Challenge en el servidor.
- Los bancos oficiales de las secciones 2 y 3 se añaden en `features/assessments/domain/bank/` con el mismo método de verificación.
- Grupos o cursos: hoy la audiencia es «todos» o «elegidos» (`assessment_assignments`); un concepto de grupo puede sustituir la lista sin cambiar el motor.
