# UX_FLOWS — Navegación y comportamiento

Versión 1.0 · Requisitos P01–P18 de [PROJECT_SPEC.md](PROJECT_SPEC.md).

## Arquitectura de información

| Ruta propuesta | Público y propósito | Salida principal |
|---|---|---|
| `/` | Todos: identidad, objetivo y elección de recorrido. | Exposición o Estudio. |
| `/presentation` | Expositor: dieciséis escenas 16:9 para proyector, sin autenticación para enseñar. | Laboratorio, sala o cierre. |
| `/learn` y `/learn/{leccion}` | Estudiante: L00–L08 con progreso local. | Siguiente lección o practicar. |
| `/lab` | Todos: escribir y ejecutar el subconjunto permitido. | Resultado y explicación. |
| `/challenge` | Práctica individual de M01–M10. | `/results` local. |
| `/live` | Participante: introducir código o resolver invitación QR. | Espera y rondas. |
| `/live/{codigo}` | Participante inscrito: sala y resultados de esa sala. | Repasar o salir. |
| `/presenter` | Presentador autenticado y autorizado: crear y dirigir sala. | `/presenter/{sala}`. |
| `/presenter/{sala}` | Panel docente privado y vista de proyección sin credenciales. | Estadísticas y cierre. |
| `/results` | Resultado individual de este navegador. | Repasar conceptos. |
| `/resources` | Vídeos, chuleta y fuentes académicas. | Recurso o lección. |
| `/modules` | Catálogo de futuras unidades. | Volver al curso actual. |

Navegación principal en escritorio: Inicio, Aprender (Estudio y Exposición), Laboratorio, Challenge, En vivo, Recursos y Buscar, en una sola fila; por debajo de 992 px, menú compacto. No hay barra lateral permanente fuera del temario de Estudio.

Home no exige registro. Crear o dirigir salas sí requiere la identidad autorizada del presentador. Un QR público nunca conduce a un panel de administración.

## Flujo A — Preparar y realizar la exposición

1. Home → «Iniciar clase». Se abre la escena 01 o se ofrece reanudar la última escena local.
2. El expositor avanza con botones o flechas. El contador indica escena actual y total.
3. Pantalla completa se activa solo mediante acción del usuario. Si el navegador la rechaza, la escena sigue disponible en la ventana.
4. Vídeos se reproducen manualmente, pueden omitirse y tienen transcripción. Al salir de su escena se pausa la reproducción.
5. «Abrir en laboratorio» transfiere el ejemplo y mantiene un enlace para volver a la escena. Si existe un borrador distinto, se ofrece conservarlo o sustituirlo antes de perderlo.
6. La escena 15 abrirá la sala creada por el presentador o permitirá crearla tras autenticarse; se proyectarán QR, código y número de participantes, sin tokens ni datos privados. Mientras las salas no existan (R6), su QR abre la práctica individual del Challenge y la escena lo indica.
7. Tras el Challenge, la escena 16 ofrece la chuleta, el Modo Estudio y el laboratorio; las estadísticas de sala llegarán con R6.

U01: un recorrido escena 12 → laboratorio → volver conserva escena y consulta. Las flechas solo navegan escenas cuando el foco está fuera de campos editables, reproductor y diálogos. Escape cierra primero el diálogo activo o sale de pantalla completa sin borrar progreso.

## Flujo B — Estudiar por cuenta propia

Home → Estudio → lección elegida → explicación y ejemplo → predicción o microactividad → feedback → siguiente lección. No hay cronómetro obligatorio de límite ni bloqueo de navegación.

Al completar la comprobación, guardar ID y versión de lección localmente. Si cambia una lección, marcar «Contenido actualizado; conviene repasarlo» sin afirmar que el usuario falló. «Reiniciar progreso» explica que afecta solo este navegador y pide confirmar la eliminación. Si el almacenamiento no está disponible, continuar en memoria y mostrar «El progreso no se guardará al cerrar».

U02: recargar L05 conserva progreso y última lección. Visitar las nueve páginas sin resolver actividades no produce 100 % de completado.

## Flujo C — Buscar desde cualquier módulo

Ctrl+K/Cmd+K o lupa → diálogo con campo enfocado → consulta → resultados de lecciones, ejemplos, vídeos, Challenge y recursos → Enter o toque → destino con título enfocado. Navegar resultados con flechas; Escape cierra y restaura el foco.

Buscar «quiz» devuelve Challenge; «AS» o «alias», L06; «*» o «asterisco», L03; «video» ofrece ambos vídeos; «WHERE» devuelve una ficha «Próximamente». El índice contiene descripciones públicas, nunca soluciones privadas de misiones, tokens, alias de participantes o contenido administrativo.

En sala activa el buscador sigue accesible, pero el tiempo no se pausa al abrir recursos. Antes de salir del flujo se avisa que la ronda continúa. La propuesta es formativa y no un examen con bloqueo del navegador.

U03: consultas con tildes o mayúsculas encuentran el mismo título; una búsqueda sin coincidencias muestra ayuda y permite limpiar el campo. El atajo se prueba también con el foco en el editor para evitar colisiones.

## Flujo D — Laboratorio

1. Ver fuente EMPLEADOS, editor y alcance disponible.
2. Escribir SQL o cargar ejemplo. «Ejecutar» y Ctrl+Enter envían la consulta completa, sin ejecutar cada pulsación.
3. Mientras se ejecuta, el botón indica actividad e impide envíos duplicados. Se conserva una copia de la consulta enviada.
4. Éxito: mostrar columnas, tipos, valores, número de filas, tiempo, traducción y anatomía. Si el usuario editó mientras esperaba, identificar el resultado como perteneciente a la consulta anterior.
5. Error: señalar posición cuando exista, explicar el problema y mantener el texto. «Reintentar» solo se ofrece para fallos temporales.
6. «Restablecer ejemplo» requiere confirmar únicamente si reemplaza cambios del usuario. No se elimina historial remoto porque no existe historial SQL remoto general.

U04: `SELECT DISTINCT ciudad FROM empleados;` muestra tres filas reales. Una caída de Oracle conserva el editor y muestra servicio no disponible, sin presentar una tabla precalculada como ejecución.

## Flujo E — Challenge individual

Portada → mapa de diez misiones → iniciar M01 → respuesta → validar → feedback → siguiente. Se permite repetir o saltar para estudiar; una misión omitida obtiene cero en la partida y se marca pendiente de repaso. Las soluciones solo se revelan al resolver o cerrar la oportunidad puntuada de esa misión.

Cada misión dispone de dos intentos puntuados y una pista. Al agotarlos se ofrece práctica sin puntuación, con explicación completa. Se guarda localmente la partida, su versión y el resultado. Un nuevo recorrido comienza en cero y no altera una sala en vivo. El cronómetro individual muestra tiempo transcurrido y se pausa al salir u ocultar la pestaña; es informativo y no determina ranking público.

U05: el usuario termina las diez misiones con ratón, toque o teclado. Regresar al mapa no reinicia los intentos ya consumidos. Los errores de conexión no se contabilizan como fallos académicos.

## Flujo F — Entrar a sala

QR → `/live/{codigo}` → validación de sala → alias de 2–24 caracteres → sesión anónima → inscripción → espera. También se puede introducir manualmente el código en `/live`.

Estados de entrada: código inválido; sala inexistente/caducada; sala llena; alias ocupado; inscripción cerrada porque ya empezó; servicio temporalmente no disponible. Cada uno tiene mensaje y acción de retorno. No pedir correo, documento, teléfono ni nombre legal del estudiante.

La inscripción se cierra al comenzar la primera ronda. El servidor fija el grupo de participantes para todos los denominadores de estadísticas. Una sesión ya inscrita puede reconectarse durante la actividad. Perder la identidad del navegador no permite apropiarse de un alias existente.

U06: QR y código conducen a la misma sala, duplicar pestaña con la misma identidad no crea otro participante y un estudiante no puede comenzar ni finalizar rondas.

## Flujo G — Competir y reconectarse

Espera → ronda abierta → resolver → envío confirmado → feedback permitido → cierre → explicación y ranking → siguiente ronda. Antes del cierre, el feedback indica acierto/error y una orientación breve, sin entregar la solución completa a quienes aún pueden responder.

Si se pierde conexión: mostrar «Sin conexión; tu respuesta aún no está confirmada», conservar borrador y desactivar envío. Al reconectar, obtener estado del servidor y consultar la petición pendiente antes de reenviarla. Si la ronda terminó, mostrar su estado real; no aceptar respuestas retroactivas basadas en el reloj del móvil.

Durante una pausa docente se congela la cuenta regresiva y se bloquean nuevas respuestas. Al reanudar, todos reciben un nuevo vencimiento. El presentador ve cuántos están conectados y cuántos enviaron; los participantes ven su propia confirmación.

U07: tras recargar durante M06, la identidad recupera misión, tiempo y puntuación vigentes sin un nuevo cupo ni puntos adicionales. Las pausas y la desconexión siguen [REALTIME_SPEC.md](REALTIME_SPEC.md).

## Flujo H — Resultados y cierre

El participante ve puntaje sobre 1000, misiones resueltas, errores, pistas usadas y enlaces de repaso por concepto. La sala muestra ranking y estadísticas agregadas; el docente puede revisar intentos por participante dentro de su sala. El ranking proyectado solo contiene alias.

El presentador finaliza únicamente después del cierre y evaluación de las diez rondas. Si termina antes, el estado es «Cancelada», con resultados parciales claramente rotulados. Los participantes conservan acceso a su revisión mientras dure la retención.

U08: para una sala sin intentos se muestra «Sin resultados» y nunca porcentajes falsos ni divisiones por cero. Los módulos futuros no aumentan el denominador de progreso.
