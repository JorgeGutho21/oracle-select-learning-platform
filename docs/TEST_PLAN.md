# TEST_PLAN — Verificación y aceptación

Versión 1.0 · Plan para la futura implementación. Las pruebas de producto descritas aquí no se han ejecutado: esta entrega es documental.

## Estrategia y entorno

Probar reglas de dominio de forma aislada; contratos e integridad con servicios reales de prueba; flujos principales en navegador; accesibilidad con teclado, lector de pantalla y revisión visual. Las pruebas del laboratorio incluyen una instancia Oracle real con el dataset canónico. Un simulador o un doble de prueba no acredita P08.

Entornos separados de desarrollo, pruebas y producción. Datos de ensayo identificados como ficticios. Fijar versión de aplicación, dependencias, Oracle, driver, dataset, misiones y rúbrica en cada ejecución de aceptación.

Herramientas propuestas para implementación: Vitest para reglas, Playwright para flujos web y un generador de carga HTTP/WebSocket para concurrencia. Las comprobaciones automáticas de accesibilidad complementan la revisión manual, no la sustituyen. No se generan pruebas ni código de aplicación en esta entrega.

## Matriz funcional P01–P18

| Prueba | Requisito | Procedimiento | Resultado verificable |
|---|---|---|---|
| T01 | P01 Home | Abrir a 390 px y 1440 px; recorrer todos los accesos y regresar. | Identidad y objetivo visibles; cada enlace abre el destino correcto sin página rota. |
| T02 | P02 Exposición | Recorrer las escenas 01–16 con botones, flechas y Av Pág/Re Pág; entrar/salir de pantalla completa; abrir laboratorio y regresar. | Escena y contador correctos; foco en editor no cambia escenas; reanudación exacta. |
| T03 | P03 Estudio | Completar L00, abrir otras sin resolver y recargar; simular almacenamiento bloqueado. | Solo L00 aparece completada; advertencia de persistencia cuando corresponde; estudio sigue utilizable. |
| T04 | P04 Búsqueda | Probar Ctrl+K, Cmd+K, lupa, teclado y Escape; buscar alias, AS, *, asterisco, video, quiz, WHERE y texto inexistente. | Destinos y etiquetas correctos; futuras unidades separadas; foco restaurado; ninguna solución privada indexada. |
| T05 | P05 Introducción | Reproducir, pausar, omitir, activar subtítulos y abrir transcripción; bloquear proveedor de vídeo. | Duración 90–120 s; sin autoplay con audio; alternativa útil ante fallo. |
| T06 | P06 Explicaciones | Revisar L01–L08 con sus tablas y avanzar cada transformación. | Consulta, traducción y resultado concordantes; animación no se presenta como ejecución física del motor. |
| T07 | P07 Tablas | Seleccionar columnas por ratón, toque y teclado; navegar las 20 filas y usar zoom. | Fuente intacta, encabezados asociados y ningún dato de otra versión. |
| T08 | P08 Laboratorio | Ejecutar LAB01–LAB24 contra Oracle, luego provocar fallo de red. | Resultados reales, errores diferenciados, consulta preservada y ninguna sustitución silenciosa por simulación. |
| T09 | P09 Challenge | Completar M01–M10, repetir y crear una nueva práctica. | Diez misiones; progreso correcto; nueva partida no cambia resultados de sala. |
| T10 | P10 Bloques | Resolver M01, M02, M06 y M09 mediante arrastre, teclado y toque sin arrastre. | Respuesta evaluada y puntaje iguales para las tres modalidades. |
| T11 | P11 Predicción | Resolver M03, M04 y M07; probar valores y duplicados incorrectos. | No revela resultado antes del intento; evalúa encabezados, multiplicidad y combinaciones correctamente. |
| T12 | P12 Errores | Corregir M08 correctamente y después borrar parte del requerimiento para hacer válida otra consulta. | Solo la reparación que satisface el pedido obtiene acierto; feedback separa sintaxis y objetivo. |
| T13 | P13 Reto escrito | Resolver M10 con solución de referencia y expresión equivalente; enviar editor vacío, alias incorrecto y constante. | Acepta equivalencia válida; rechaza incumplimientos sin exigir texto idéntico. |
| T14 | P14 Sala QR | Entrar por QR y código; repetir con mismo usuario, alias ocupado, cupo completo, sala iniciada y caducada. | Una identidad por sala, mensajes específicos y ninguna inscripción tardía. |
| T15 | P15 Tiempo/puntos | Tabla completa de puntuación, pausa, límite temporal, pista y reenvíos. | Autoridad del servidor; máximo 100 por misión y 1000 total; fallo técnico no consume intento. |
| T16 | P16 Ranking | Cargar fixture de empates, reconectar y recibir avisos repetidos/desordenados. | Posiciones y totales estables; datos de práctica local nunca aparecen. |
| T17 | P17 Estadísticas | Calcular fixture de cuatro participantes, caso sin aciertos y caso sin intentos. | Denominadores visibles, cifras exactas y «Sin datos» donde corresponda. |
| T18 | P18 Cierre | Reproducir vídeo resumen, imprimir chuleta y abrir catálogo futuro. | Resumen 3–4 min; temas actuales completos; impresión legible; futuros fuera del progreso y sin actividad ficticia. |

## Aceptación de las misiones

G01–G10 se verifican una a una con las soluciones de GAME_SPEC. Cada misión debe incluir al menos un caso correcto, uno incorrecto con sentido pedagógico, una respuesta incompleta y la interacción alternativa accesible. Para G05 y G10 verificar expresiones equivalentes. Para G07 comprobar que conservar cualquier ejemplar de cada ciudad es válido y que eliminar una ciudad por completo no lo es. Para G02, G06 y G09 comprobar que se corrige el resultado de la consulta armada y no una cadena exacta (por ejemplo, comas intercambiables en M09).

La misión M08 (Challenge v3) parte de `SELECT nombre salario FROM empleados;`, pero no la presenta como error sintáctico: LAB19 confirma que ese SQL expresa un alias implícito. El estudiante localiza el hueco de la coma y el feedback explica que falla el objetivo de dos columnas, no la sintaxis.

G11–G15 cubren puntuación, reenvío, empates, accesibilidad y revelación de soluciones. En ronda abierta inspeccionar respuestas y recursos enviados al navegador para verificar que no incluyen rúbrica privada ni soluciones futuras; las soluciones visibles en materiales de estudio son referencias de aprendizaje, no secretos de examen.

## Casos semánticos del laboratorio

| ID | Caso | Oráculo de prueba |
|---|---|---|
| S01 | * | Seis filas y seis columnas del esquema en orden. |
| S02 | Columnas reordenadas | CIUDAD, NOMBRE es diferente de NOMBRE, CIUDAD como forma de salida. |
| S03 | Multiplicidad | CIUDAD tiene seis valores, aunque solo tres distintos. |
| S04 | DISTINCT compuesto | Cinco pares ciudad/depto, no tres ni seis. |
| S05 | Alias | AS no cambia nombre ni valores de la tabla de origen. |
| S06 | Alias implícito | LAB19 devuelve una columna y puede fallar un pedido de dos columnas. |
| S07 | Precedencia | Ana: 4200000 para suma sin paréntesis, 37200000 con paréntesis. |
| S08 | Equivalencia | SALARIO * 12 y 12 * SALARIO coinciden en resultados con rúbrica compatible. |
| S09 | Comparación de filas | Permutar filas conserva igualdad; quitar una repetición cambia el multiconjunto. |
| S10 | Alias entrecomillados | Conserva caja y espacios; no equipara automáticamente `"Salario anual"` con SALARIO_ANUAL. |
| S11 | Entrada tolerada | Caja, espacios, comentario de línea y terminador final admitidos no cambian salida. |
| S12 | División y precisión | División por dos preserva valores exactos; división por cero devuelve error sin tabla parcial. Decimales se comparan sin tolerancias que oculten errores. |
| S13 | Identificador inexistente | SUELDO se rechaza con referencia al esquema disponible. |
| S14 | Alcance | WHERE, JOIN, funciones, UNION y DUAL se rechazan como fuera del subconjunto, sin afirmar invalidez universal en Oracle. |

Registrar metadatos y valores del motor objetivo como evidencia. Si hay resultados de ejemplo en lecciones, compararlos con esa evidencia después de cada cambio de dataset o motor.

## Fixtures de puntuación y estadísticas

**Puntuación individual:** primer acierto sin pista 100; segundo sin pista 80; primero con pista 80; segundo con pista 60; dos fallos cero; sin respuesta cero. Una caída Oracle intermedia no altera esos valores ni los ordinales académicos.

**Ranking ficticio de una sala completa:**

| Alias de prueba | Puntos | Resueltas | Suma de tiempo activo | Posición |
|---|---:|---:|---:|---:|
| Ana-QA | 1000 | 10 | 300 s | 1 |
| Luis-QA | 800 | 10 | 400 s | 2 |
| Eva-QA | 800 | 8 | 500 s | 3 |
| Sol-QA | 800 | 8 | 500 s | 3 |

Luis supera a Eva por resolver más misiones con igual puntuación. Eva y Sol comparten puesto. El siguiente participante, si existe, ocuparía puesto 5: se usa ranking de competición con saltos tras empate, no posiciones densas.

**Estadística ficticia de M06 con cuatro inscritos:** A acierta al primer intento sin pista en 20 s; B acierta al segundo con pista en 50 s; C falla dos veces sin pista; D no responde. Esperado: cinco intentos académicos, tres participantes con envío, dos aciertos (50 %), un acierto al primer intento (25 %), una pista, una persona sin respuesta, tres intentos incorrectos, media de tiempo hasta acierto 35 s y promedio de puntos 40 sobre 100. Una petición repetida no cambia ninguna cifra.

## Integridad, seguridad y tiempo real

| ID | Prueba | Resultado esperado |
|---|---|---|
| SEC01 | Intentar escribir en Oracle con DML/DDL, múltiples sentencias o llamadas a paquetes dentro de SELECT. | Rechazo previo al motor y ningún cambio de datos; privilegios efectivos revisados. |
| SEC02 | Leer tabla distinta o base de aplicación desde editor. | Acceso imposible por analizador y por credenciales aisladas. |
| SEC03 | Estudiante envía score, tiempo o rol manipulado. | Campos ignorados/rechazados; valores calculados en servidor. |
| SEC04 | Identidad ajena intenta leer sala, suscribirse a canal o recuperar intentos. | Denegado; ningún contenido privado en respuesta. |
| SEC05 | Acceso directo a base para insertar resultado, habilitar presenter o alterar ronda. | RLS y permisos lo impiden. |
| SEC06 | Alias contiene HTML o scripts. | Se rechaza o presenta como texto inerte; no ejecuta contenido. |
| SEC07 | Inspeccionar recursos públicos, respuestas, QR y logs. | Sin credenciales, tokens administrativos ni rúbricas prematuras. |
| INT01 | FK de intento combina participante y ronda de distintas salas. | Escritura rechazada incluso fuera de la interfaz. |
| INT02 | Dos inscripciones compiten por el cupo 60. | Solo una gana; nunca se alcanza 61. |
| INT03 | Envío duplicado y request_id reutilizado con distinto contenido. | Primero idempotente, segundo conflicto; un único intento y premio. |
| INT04 | Dos pestañas envían a la vez, o piden pista mientras evalúan. | Un pending máximo; reglas de pistas e intentos coherentes. |
| RT01 | Enviar a -1 ms, 0 ms y +1 ms respecto del vencimiento en reloj controlado. | Solo -1 ms es puntual; evaluación posterior no cambia recepción. |
| RT02 | Móvil con reloj adelantado/atrasado diez minutos. | Mismos plazos y puntaje oficiales. |
| RT03 | Pausar 30 s y reanudar, luego recargar. | Tiempo activo y vencimiento ajustados correctamente. |
| RT04 | Perder o duplicar avisos, recibirlos desordenados. | Snapshot de mayor revisión restaura estado sin sumar puntos. |
| RT05 | Cerrar navegador docente en ronda abierta. | La ronda vence y queda en revisión; ninguna nueva ronda se abre sola. |
| RT06 | Reiniciar servicio después de reservar intento y antes de corregir. | Recuperación o error técnico; nunca intento perdido silenciosamente ni doble corrección. |
| RT07 | Oracle falla en M10, incluso al corregir un envío puntual tras el vencimiento. | Pausa/incidente preserva tiempo restante conforme a REALTIME_SPEC; error no consume intento; no hay finalización con pendientes. |
| RT08 | Desconexión de participante antes y después de confirmar envío. | Antes: borrador no aceptado; después: recuperar resultado por request_id. |
| OPS01 | Caducar sala pausada y ejecutar retención en entorno de prueba. | Estado expired, fecha terminal y posterior eliminación sin huérfanos. |
| OPS02 | Restaurar copia de aplicación y recalcular ranking. | Puntajes, denominadores y empates iguales a los previos. |
| OPS03 | Publicar nueva versión durante una sala. | Sala conserva dataset, misión y rúbrica fijados al iniciar. |

## Oracle real: pruebas automatizadas (Fase 8)

Instancia de verificación: Oracle Database 23ai Free 23.26.3 en el contenedor oficial `container-registry.oracle.com/database/free:latest-lite`, y Oracle Autonomous Database 19c (Oracle Cloud), con `EMPLEADOS` v2 cargada desde `oracle/empleados-select-v2.sql` y la cuenta `SQL_LAB_V2_READER` (solo `CREATE SESSION` y `READ`). Instalación reproducible con `npm run oracle:up` y `npm run oracle:setup` ([ORACLE_SETUP.md](ORACLE_SETUP.md)). Las pruebas contra Oracle se omiten sin la cuenta lectora; nunca hay secretos en el repositorio.

| ID | Cobertura | Dónde |
|---|---|---|
| LAB11 | LAB01–LAB24, 64 consultas por concepto y todas las consultas del Estudio y de la Exposición ejecutadas en Oracle: mismos encabezados, tipos, filas (multiconjunto) y orden (entre empates) que el motor educativo; 102 casos. | `tests/integration/oracle-real.test.ts` |
| LAB12 | Espacios, caja, comentarios de línea y terminador no cambian el resultado. | Integración. |
| LAB13 | DML, varias sentencias, otra tabla y WHERE se rechazan antes de Oracle; un `UPDATE` enviado directamente con la cuenta lectora lo rechaza Oracle; los datos siguen intactos. | Integración. |
| LAB14 | Un plazo agotado (800 ms) devuelve «no disponible» y el grupo de una conexión sigue sirviendo; errores de conexión sin detalles internos. | Integración y unitarias. |
| LAB15 | El mismo contenido en otro orden es equivalente; quitar una fila no lo es. | Integración. |
| LAB16 | Una consulta válida que no cumple el pedido recibe feedback de objetivo (M10 con otro cálculo). | Integración y E2E. |
| G10 | M10: la referencia y tres expresiones equivalentes son correctas en Oracle; dos salidas distintas, incorrectas; `AS` y columnas se comprueban antes. | Integración y E2E (Chromium, Edge, WebKit). |
| T08 | `/lab` muestra la tabla real rotulada «Oracle (Oracle Database 23…)», un `ORA-01476` real y «No se envió a Oracle» para lo rechazado. | `tests/e2e/oracle-real.spec.ts` |
| SEC01/SEC02 | Solo la sentencia canónica llega al driver; la salud rechaza cuentas con privilegios de más y una tabla que no coincide con el dataset. | Unitarias e integración. |

Sin Oracle configurado, las mismas E2E comprueban que `/lab` y M10 declaran «no disponible» y no simulan resultados (`ORACLE_USER= ORACLE_PASSWORD= ORACLE_CONNECT_STRING= npm run test:e2e`). La carga de 60 estudiantes contra Oracle sigue pendiente (umbral de 2 s en la tabla de rendimiento).

## Sala en vivo 1.1: pruebas automatizadas (Fase 7)

La sala a ritmo propio de [REALTIME_SPEC](REALTIME_SPEC.md) 1.1 tiene tres niveles de prueba. Una misma batería de contrato (`tests/support/classroom-contract.ts`) se ejecuta con el almacenamiento en memoria (`tests/unit/classroom`) y con PostgreSQL embebido sobre la migración real, llamando a las funciones como `service_role` (`tests/integration/classroom-postgres.test.ts`). Las E2E (`tests/e2e/classroom.spec.ts`) recorren profesor y móviles en Chromium, Edge y WebKit con el almacenamiento en memoria.

| ID | Cobertura | Dónde |
|---|---|---|
| T14 | QR y código a la misma sala, alias ocupado o no válido, cupo 61, sala iniciada, caducada e inexistente, recarga con la misma identidad. | Contrato y E2E. |
| T15 | Puntos del servidor: 100, 80 (segundo intento o pista), 0 tras dos fallos; práctica sin puntos tras cerrar la oportunidad; fallo técnico sin consumir intento. | Contrato y E2E. |
| T16 | Orden por puntos, misiones resueltas y tiempo; ranking de competición 1, 2, 3, 3, 5 (fixture de este plan). | Unitarias de dominio. |
| T17 | Fixture M06 de cuatro inscritos (cinco intentos, 50 %, media 35 s, promedio 40), «Sin datos» sin intentos. | Unitarias de dominio. |
| SEC03 | Respuestas con formato inválido o `requestId` no UUID se rechazan con Zod; el cliente no envía puntos. | Contrato y unitarias. |
| SEC04 | Sin token de la sala no se leen vistas ni se dan órdenes. | Contrato y E2E. |
| SEC05 | `anon` y `authenticated` sin acceso a tablas ni funciones, RLS activa sin políticas, restricciones de formato. | Integración PostgreSQL. |
| SEC06 | Alias con HTML, correo o teléfono rechazado; se muestra siempre como texto. | Unitarias y contrato. |
| SEC07 | La clave de servicio solo en módulos de servidor (`server-only`); vistas sin tokens ni huellas. | Unitarias y contrato. |
| INT02 | 61 inscripciones simultáneas con cupo 60: entran 60. Mismo alias desde cinco móviles: entra uno. | Contrato (memoria y PostgreSQL). |
| INT03 | Diez envíos simultáneos con el mismo `requestId`: un intento y un premio; mismo id con otro contenido: conflicto. | Contrato. |
| INT04 | Envíos simultáneos desde dos pestañas: un pendiente como máximo y nunca más de dos intentos. | Contrato. |
| RT04 | Avisos solo con la revisión; vistas tardías o de revisión menor ignoradas. | Diseño de `useRoomSync` y contrato (revisión creciente). |
| RT06 | Reserva abandonada: a los 30 s deja de bloquear sin consumir intento. | Contrato. |
| OPS01 | Mantenimiento: caduca salas vencidas y borra terminadas tras 30 días. | Integración PostgreSQL. |

Concurrencia probada: 50 estudiantes que entran y responden a la vez. PGlite es una sola conexión, así que valida la lógica transaccional y los bloqueos por operación, no la contención de conexiones reales.

**Pendiente, sin credenciales:** el ensayo del proyecto Supabase remoto (Realtime Broadcast, latencia, 60 móviles reales durante 20 minutos). Los umbrales de la tabla siguiente no están medidos para la sala. Pasos en [SUPABASE_SETUP.md](SUPABASE_SETUP.md#validación-pendiente).

## Rendimiento y carga

Perfil de navegador: móvil de rendimiento medio, viewport 390 × 844, red simulada de 10 Mbps y latencia de 100 ms. Navegación inicial con caché vacía; medir carga útil sin iniciar vídeos. Registrar dispositivo y navegador reales, condiciones y fecha. Cinco recorridos para métricas web básicas; al menos 100 solicitudes o eventos para percentiles del servicio.

Escenario obligatorio: un presentador y 60 estudiantes, con una dirección de salida a Internet compartida, conectados 20 minutos. Inscribir en ráfaga, abrir diez rondas, combinar aciertos/fallos/pistas y generar una ráfaga de 60 envíos Oracle en M10. Interrumpir y reconectar el 20 % de clientes una vez. Repetir a 75 conexiones como margen, sin aumentar cupo inscrito de la sala.

| Métrica | Umbral de aceptación |
|---|---|
| Contenido principal utilizable | ≤3 s en perfil indicado. |
| Búsqueda local | p95 ≤200 ms tras escribir, índice cargado. |
| Ejecución Oracle permitida | p95 ≤2 s a carga de 60 estudiantes; plazo absoluto 5 s. |
| Aviso/actualización Realtime | p95 ≤1 s desde confirmación persistida hasta actualización con conexión sana. |
| Recuperación de estado | ≤5 s después de restablecer conectividad con servicios sanos. |
| Integridad bajo carga | Cero resultados perdidos o duplicados; cero puntajes manipulables; cero escrituras no autorizadas. |

Si el grupo de diez conexiones no alcanza los objetivos, ajustar recursos o consultas del servicio y repetir. No sustituir Oracle por datos estáticos para aprobar rendimiento. El ensayo de 75 conexiones documenta degradación controlada y mensajes de ocupado; no certifica capacidad ilimitada.

## Revisión visual y accesibilidad

Tamaños: 360 × 800, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 y 1920 × 1080. Probar Chrome/Edge de escritorio, Safari en iPhone y Chrome en Android en versiones soportadas al publicar. Navegación completa con teclado, zoom al 200 %, reducción de movimiento y lector de pantalla en al menos escritorio y móvil.

Comprobar D01–D08: contraste de estados y sintaxis, orden de foco, ausencia de trampas, alternativa al arrastre, nombres de controles, subtítulos, tablas y anuncios de tiempo no invasivos. Registrar capturas de Home, lección, laboratorio, misión, sala y resultados. Corregir contenido cortado, scroll global accidental o SQL ilegible antes de cerrar aceptación.

### Regresión visual y de desbordes (refinamiento final, 26 de septiembre de 2026)

Suite E2E específica, sin comparación de píxeles: las fuentes de Windows, Linux y macOS darían falsos positivos. Comprueba invariantes de diseño y adjunta la captura de cada caso al informe de Playwright para la revisión humana.

**Suites:**

- `tests/e2e/visual-presentation.spec.ts`: 21 escenas clave a 1920×1080, 1366×768 y 390×844. Además, la pantalla completa: oculta la navegación del sitio y atenúa los controles.
- `tests/e2e/visual-pages.spec.ts`: Home, Estudio (índice y cuatro lecciones), Laboratorio, Recursos y Ruta a 1366×768, 768×1024, 390×844 y 320×568. También cubre el orden de los paneles del laboratorio y un resultado de 12 columnas.
- `tests/e2e/visual-responsive-data.spec.ts`:
  - EMPLEADOS como tabla en escritorio y como fichas en móvil;
  - la tabla de origen del Estudio entera;
  - NULL como insignia accesible.

**Ayudas** (`tests/e2e/support/layout.ts`):

- `layoutReport` y `expectNoHorizontalScroll`: fallan si hay desplazamiento horizontal de la página, una tabla, código o región educativa con barra propia, texto recortado por `overflow: hidden` o texto visible de menos de 12 px;
- `watchConsole`: falla ante `console.error`, excepciones sin capturar, avisos de hidratación o violaciones de CSP.

La Exposición comprueba además que ningún bloque invade el título ni la idea clave (`spill ≤ 1 px`).

**Pruebas unitarias nuevas:**

- `tests/unit/concepts.test.ts`: definiciones de 25 palabras como máximo, categorías, ejemplos válidos y la misma definición en el Estudio, el buscador, la Exposición y los Recursos;
- `tests/unit/sql/format.test.ts`: el formateador conserva los tokens y el resultado de todas las consultas del contenido, y es idempotente;
- `tests/unit/data-view.test.tsx`: tabla y fichas, resumen, NULL, estado, encabezado de fila y columnas de código;
- `tests/unit/presentation-scenes.test.tsx`: las 29 escenas con definición o propósito, notas del expositor y bloques.

La auditoría de antes y después (615 mediciones y 123 capturas por pasada) está en [FINAL_UX_PEDAGOGICAL_AUDIT.md](FINAL_UX_PEDAGOGICAL_AUDIT.md).

**Pasada pedagógica del Challenge, Recursos y cierre (addendum):**

- `tests/e2e/visual-challenge.spec.ts`: las diez misiones a 1366×768, 390×844 y 320×568 sin barra horizontal, con 60 celdas visibles como máximo y tablas de 7 columnas como máximo; la tabla completa plegada; «Comprobar» a menos de dos pantallas en escritorio; la tabla completa con sus 20 registros; M04 revela «Cumple / No cumple» solo al cerrar; el feedback muestra tipo, qué está bien, qué ajustar y pista.
- `tests/unit/challenge/mission-density.test.tsx`: datos relevantes por misión, la muestra de M04 contiene todas las filas del resultado y basta para acertar, vista previa de M10, relación campo → valor accesible, orientación progresiva por intento sin revelar la solución, categoría de los errores del motor, explicación del acierto y punto y coma opcional.
- `tests/unit/sql-highlight.test.tsx`: color semántico de cada cláusula y operador, y `*` como comodín.
- `tests/unit/presentation-scenes.test.tsx`: mapa de la escena 02, síntesis de la 25, ruta de continuidad de la 28, cierre de la 29, los seis errores de la 22, vocabulario de la 03 y «Para qué sirve» en las escenas 11–19.
- `tests/unit/concepts.test.ts`: glosas breves y fichas de la coma, los paréntesis, IS NOT NULL y la consulta.

**Flujo de datos, bandas y laboratorio (27 de septiembre de 2026):**

- `tests/e2e/lab-result-table.spec.ts`: `SELECT *` es una sola tabla de 12 columnas y 20 filas sin barra ni fichas a 1920, 1600, 1440, 1366 y 1280 píxeles, con el editor a todo el ancho y el resultado debajo; bandas con ID_EMPLEADO y las 20 filas a 1024, 768, 390 y 360 píxeles; `SELECT nombre, ciudad` muestra exactamente dos columnas; WHERE reduce a 5 filas con las columnas pedidas en su orden; ORDER BY marca el encabezado con `aria-sort`; NULL se distingue de 0.
- `tests/unit/lab-result-table.test.tsx`: la vista previa y la ejecución en Oracle usan el mismo renderer (compacto, sin fichas) con rótulos distintos; la tabla muestra los datos de EMPLEADOS sin cambios.
- `tests/unit/data-view.test.tsx`: reparto en bandas con ID_EMPLEADO repetido y las mismas filas; una tabla de resultados SQL nunca se convierte en fichas.
- `tests/unit/didactic-projection.test.ts`: el dataset sigue completo; cada proyección tiene SQL válido, 2–6 filas reales y como mucho 7 columnas (salvo SELECT *); origen y resultado salen de las mismas filas; los filtros muestran filas que cumplen y que no.
- `tests/e2e/home.spec.ts`: con 12 columnas la demostración pasa a ancho completo con dos bandas de 8 filas, conserva el orden elegido y no usa fichas.
- `tests/e2e/presentation.spec.ts`: las escenas de filtro y orden muestran los cuatro pasos del flujo; «Paso a paso» resalta WHERE en el paso 2.
- `tests/integration/oracle-real.test.ts`: las consultas de las proyecciones didácticas dan en Oracle el mismo resultado que el motor.

**Rediseño pedagógico del Challenge y de las tablas (28 de septiembre de 2026):**

- `tests/unit/challenge/missions.test.ts`: Challenge v4 (68 pruebas): cada misión acepta su solución y formas equivalentes, y explica cada error esperable con tipo, qué está bien y qué revisar; M03 orienta cada afirmación sin revelarla; M04 no nombra las filas que faltan; M05 no da el valor; las ocho variantes de M08 (tipo, zona y corrección); M09 distingue OR/AND y >/>=; M10 califica la salida de Oracle y recuerda que AND va antes que OR; la parte pública no contiene pistas, explicaciones ni correcciones.
- `tests/unit/challenge/mission-density.test.tsx`: muestras de trabajo de 4–8 registros y como mucho 4 columnas, tabla real con el dataset completo como consulta secundaria, esquema 3 × 4 de M03, tabla de selección con casillas y estados con texto, resultado sobre la muestra, orden de cálculo sin valores y variante estable de M08.
- `tests/unit/data-view.test.tsx`: cinco grupos de cuatro columnas con ID_EMPLEADO y NOMBRE, pestañas con teclado, dos partes en tableta, bandas apiladas con pocas filas, tablas de hasta cuatro columnas sin reparto, resultados parciales, nunca fichas para un resultado SQL.
- `tests/unit/presentation-scenes.test.tsx`: «Qué cambió» en las escenas de concepto (SELECT cambia columnas, WHERE filas, ORDER BY solo el orden).
- `tests/e2e/challenge-m01-m03.spec.ts`, `challenge-m04-m07.spec.ts` y `challenge-m08-m10.spec.ts`: recorridos con toque, ratón y teclado, feedback por tipo, antes/después de M04, M06 y M07, variantes de M08 y M10 con Oracle real.
- `tests/e2e/visual-challenge.spec.ts`: las diez misiones a 1920, 1366, 1280, 1024, 820, 768, 430, 390, 360 y 320 px sin barra horizontal, con como mucho 8 registros, 4 columnas a la vez en el móvil (5 con la casilla de M04), sin fichas y sin texto de menos de 12 px; dataset completo en un diálogo y por grupos en el móvil.
- `tests/e2e/lab-result-table.spec.ts`: `SELECT *` por partes o grupos con pestañas a 1024, 768, 430, 390, 360 y 320 px, con las 12 columnas entre todos los grupos, las 20 filas en cada uno y navegación con teclado.
- `tests/e2e/audit-regressions.spec.ts` y `reflow.spec.ts`: sin desborde de página a 180 px (zoom 200 % sobre 360) en Aprender y en las diez misiones.

## Salida a producción

La entrega funcional se acepta cuando P01–P18 pasan, G01–G15 y LAB01–LAB16 están cubiertos, invariantes DB01–DB07 y reglas R01–R11 son verificadas, y C01–C05 y D01–D08 pasan revisión editorial/visual. U01–U08 y A01–A07 se verifican mediante flujos, seguridad y recuperación descritos aquí.

Bloquean publicación: cualquier error de resultado SQL o puntaje, pérdida de intentos, permisos incorrectos, falta de Oracle real, misión imposible de completar, flujo crítico inaccesible o ausencia de un recurso obligatorio. Defectos menores no críticos pueden registrarse con responsable y fecha, sin ocultarlos como funcionalidades completas.

Evidencias por ejecución: versión, entorno, prueba, resultado, captura o registro mínimo, incidencia y corrección. Ninguna prueba se marca aprobada únicamente por estar descrita en este archivo.
