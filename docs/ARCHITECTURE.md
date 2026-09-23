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
