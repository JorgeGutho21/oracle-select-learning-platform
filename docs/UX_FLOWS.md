# UX_FLOWS — Navegación y comportamiento

Versión 1.1 · Requisitos P01–P18 de [PROJECT_SPEC.md](PROJECT_SPEC.md). La 1.1 incorpora la sala en vivo implementada en la Fase 7 ([REALTIME_SPEC.md](REALTIME_SPEC.md) 1.1).

## Arquitectura de información

| Ruta propuesta | Público y propósito | Salida principal |
|---|---|---|
| `/` | Todos: identidad, objetivo y elección de recorrido. | Exposición o Estudio. |
| `/presentation` | Expositor: 29 escenas 16:9 para proyector, sin autenticación para enseñar. | Laboratorio, sala o cierre. |
| `/learn` y `/learn/{leccion}` | Estudiante: L00–L08 con progreso local. | Siguiente lección o practicar. |
| `/lab` | Todos: escribir y ejecutar el subconjunto permitido. | Resultado y explicación. |
| `/challenge` | Práctica individual de M01–M10. | `/results` local. |
| `/live` | Participante: escribir el código si no puede escanear el QR. | `/join/{codigo}`. |
| `/join/{codigo}` | Participante, prioridad móvil: alias, espera, Challenge en vivo y resultado personal. Destino del QR. | Resultado o práctica. |
| `/presenter` | Profesor con la clave del servidor: crear sala. | `/presenter/{codigo}`. |
| `/presenter/{codigo}` | Consola del navegador que creó la sala: código, QR, participantes, inicio, ranking, progreso, cierre y estadísticas. Proyectable. | `/results?sala={codigo}`. |
| `/results` | Práctica individual de este navegador y, con `?sala={codigo}`, la vista de esa sala que corresponde a este navegador (profesor o participante). | Repasar o practicar. |
| `/resources` | Chuleta imprimible, referencia rápida, ejemplos SQL, videos, accesos directos y fuentes. | Recurso, lección o laboratorio. |
| `/modules` | Catálogo: la unidad actual SELECT, con su progreso local, y siete módulos futuros «Próximamente». | Volver al curso actual. |

Navegación principal en escritorio: Inicio, Aprender (Estudio y Exposición), Laboratorio, Challenge, En vivo, Recursos y Buscar, en una sola fila; por debajo de 992 px, menú compacto. No hay barra lateral permanente fuera del temario de Estudio.

Home no exige registro. Crear una sala requiere la clave del profesor configurada en el servidor; dirigirla, el token del navegador que la creó. Un QR público nunca conduce a un panel de administración: abre `/join/{codigo}`.

## Flujo A — Preparar y realizar la exposición

1. Home → «Iniciar clase». Se abre la escena 01 o se ofrece reanudar la última escena local.
2. El expositor avanza con botones o flechas. El contador indica escena actual y total.
3. Pantalla completa se activa solo mediante acción del usuario. Si el navegador la rechaza, la escena sigue disponible en la ventana.
4. Vídeos se reproducen manualmente, pueden omitirse y tienen transcripción. Al salir de su escena se pausa la reproducción.
5. «Abrir en laboratorio» transfiere el ejemplo y mantiene un enlace para volver a la escena. Si existe un borrador distinto, se ofrece conservarlo o sustituirlo antes de perderlo.
6. La escena 15 mantiene el QR de la práctica individual y enlaza a «Sala en vivo» (`/presenter`): la sala proyecta su propio QR, código y participantes, sin tokens ni datos privados.
7. Tras el Challenge, la escena 16 ofrece la chuleta, el Modo Estudio y el laboratorio; las estadísticas de la sala están en su consola y en `/results?sala={codigo}`.

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

## Flujo F — Crear la sala y entrar

Profesor: `/presenter` → clave del profesor → sala con código de seis caracteres y QR hacia `/join/{codigo}` → espera con la lista de participantes (conectados marcados) → «Iniciar el Challenge», que exige al menos un participante. Si el QR apunta a esta misma máquina (`localhost`, 127.0.0.1), la consola lo advierte: la URL pública sale de `NEXT_PUBLIC_SITE_URL`, de la URL de vista previa o, en desarrollo, del origen de la página.

Estudiante: QR → `/join/{codigo}` → validación de la sala → alias de 2–24 caracteres con el aviso «Tu alias será visible para toda la clase en el ranking. No uses tu nombre completo, correo ni teléfono. No necesitas cuenta ni contraseña.» → «Estás dentro» y espera. También puede escribir el código en `/live`.

Estados de entrada, cada uno con mensaje y acción de retorno: código no válido; sala inexistente; sala caducada; sala llena; alias ocupado o no válido; «La actividad ya comenzó» (inscripción cerrada al iniciar); servicio no configurado o sin conexión. No se pide correo, documento, teléfono ni nombre legal.

La identidad es una cookie `httpOnly` de esa sala: recargar o reconectar devuelve a la misma persona sin nuevo cupo; otro navegador no puede apropiarse de un alias. En espera, «Salir de la sala» (con confirmación) libera el alias.

U06: QR y código conducen a la misma sala, duplicar pestaña con la misma identidad no crea otro participante y un estudiante no puede iniciar ni finalizar la sala.

## Flujo G — Jugar en vivo y reconectarse

Inicio → cada móvil pasa sin recargar a «Comenzar el Challenge» → M01–M10 con las mismas interacciones de la práctica, a su ritmo → corrección en el servidor. Una barra fija muestra alias, «Puntos del servidor» y posición. No se ofrecen «Terminar» ni «Reiniciar»: la sala la cierra el profesor.

El profesor ve en vivo: participantes, conectados, cuántos respondieron, tiempo transcurrido, ranking y progreso por misión (resueltas y respondidas).

Sin conexión: aviso «Sin conexión: reintentando…»; el envío se reintenta una vez con el mismo identificador y, si falla, es un error técnico que no consume intento. Al volver se pide la vista al servidor. Tras la recarga, el avance local de esa sala se conserva y los puntos siguen siendo los del servidor.

U07: tras recargar durante la partida, la identidad recupera la sala y su puntuación sin nuevo cupo ni puntos adicionales. La sincronización sigue [REALTIME_SPEC.md](REALTIME_SPEC.md).

## Flujo H — Resultados y cierre

El profesor finaliza con confirmación. Su consola muestra el ranking final y las estadísticas: participantes, promedio de puntos, precisión del grupo, tiempo medio, misión más fácil y más difícil (con empates explícitos). Cancelar cierra la sala sin ranking final.

Cada estudiante ve su resultado personal calculado por el servidor: posición, puntos (sobre 1000), misiones resueltas, precisión, tiempo hasta su último acierto, intentos y pistas, con el ranking final completo. `/results?sala={codigo}` repite la vista que corresponde a ese navegador; sin permiso, «Sin resultados de esta sala». La práctica individual guardada en el navegador aparece aparte, rotulada como local.

U08: para una sala sin intentos se muestra «Sin datos» (o «Sin resultados» si no hay participantes) y nunca porcentajes falsos ni divisiones por cero. Los módulos futuros no aumentan el denominador de progreso.
