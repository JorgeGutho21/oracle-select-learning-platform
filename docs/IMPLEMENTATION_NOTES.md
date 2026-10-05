# Notas de implementación — Cimientos y sistema de diseño

## Revisión pedagógica y visual del 4 de octubre de 2026

El nuevo encargo autoriza contenido y UX, con gate estricto de acceso docente antes de Production. El contrato de S1 se aplica a S2/S3 mediante modelos mentales escritos, definiciones anteriores al código y 51 microejemplos nuevos ejecutados en Oracle. Se preservan las tablas de S1, el banco de 150 preguntas, la puntuación y la persistencia. Detalles: docs/PEDAGOGICAL_TOPIC_CONTRACT.md.

Dominio conserva las reglas y vocabulario; aplicación expone vistas y una superficie pequeña de feedback; presentación no importa dominio directamente. El diccionario usa filas reales del dataset. Un resultado verificado no se presenta como ejecución nueva. El error esperado de un ejemplo tiene explicación/corrección y detalle técnico desplegable; la indisponibilidad de Oracle se identifica como fallo del servicio.

UI: Cult HaloProgress, Magic CodeComparison y Motion core InView se adaptan sin instalar runtimes completos. React Bits existente se limita a interacciones de 300 ms y se desactiva en docencia/exámenes. Perfiles de ruta y aliases --db-* preservan el sistema Sass/CSS original. Registro, fuentes inmutables y licencias completas: docs/UI_COMPONENT_REGISTRY.md y THIRD_PARTY_NOTICES.md.

Teacher bootstrap requiere dos correos verificados distintos y, si se proporciona UUID, correspondencia exacta con Auth; los nombres son etiquetas. Usa la administración Supabase y verifica el rol almacenado, sin alterar contraseñas de cuentas existentes. Solo una cuenta nueva, autorizada e identificada puede recibir la credencial existente de En vivo desde el entorno; nunca desde el navegador, repositorio o logs.

Baseline, medición posterior, QA de navegador y estado de release deben distinguirse. El PASS de Oracle (273 ejecuciones) no acredita por sí mismo responsive, accesibilidad, Preview ni acceso real de Jorge/Amilkar. Estado activo y bloqueos reales: CONTINUITY.md.

La nueva clase tiene 193/203 escenas frente a 34/37. El índice ligero registra identidades estables y una correspondencia con el guion publicado en `6109e4a`; un registro antiguo se resuelve sin borrar ni rebajar avance. Las nuevas visitas guardan sceneId y release junto con la posición numérica. S3-L01 cambia de versión porque ahora comienza con un saludo mínimo; los registros previos permanecen.

Los enlaces entre modos y las referencias de recursos no precargan otros recorridos completos. Esto evita cargar escenas, actividades o clientes de evaluación antes de elegirlos. La tabla de una escena conserva datos de al menos 14 px, código de 17 px en teléfono/26 px a 1920, y las preguntas se apilan en anchos pequeños. Los mínimos nunca se resuelven encogiendo datos. El vocabulario de ampliaciones está abierto en Estudio y desplegable en Clase, después de escenas de definición.

La medición final volvió a detectar una precarga pendiente: el enlace compartido Continuar aprendiendo descargaba Estudio S1 desde Inicio sin que se eligiera ese modo. El registro por chunk identifica los scripts adicionales y conserva el crecimiento observado de 15.79 %. También se desactiva esa precarga; el destino y la reanudación por progreso permanecen iguales. La medición posterior y los flujos de Inicio/secciones se vuelven a ejecutar sobre el nuevo build.

Next compila las cabeceras CSP con el entorno de build. El QA local debe compilar con `node scripts/run-local-qa.mjs build` y arrancar con el mismo wrapper: cambiar únicamente las variables al arrancar deja la CSP cloud y bloquea Realtime local. El wrapper comprueba `connect-src` antes de servir. Esta corrección de reproducibilidad mantiene la política de Production sin ampliar sus destinos.

Las clases pertenecen al grupo Lecciones del buscador, no a Conceptos; así las definiciones y fichas S1 mantienen su orden de teclado. El banco S2 conserva sus identificadores y respuestas; la referencia de repaso de columna ambigua apunta a la lección que ahora contiene ese error, después de introducir ON. Las primeras ampliaciones de variables explican IF y SELECT INTO antes de presentar sus bloques compuestos.

QA completo detectó áreas Grid implícitas superpuestas en la comparación de funciones de una fila/grupo; la variante declara ahora las áreas `code` y `visual` en filas distintas. No se excluye la escena de las comprobaciones geométricas.

La revisión a resolución completa detectó que la barra sticky de Clase cubría 144 px de la escena móvil. En el modo de lectura vertical los controles pasan a flujo normal, después del contenido; al cambiar de escena se vuelve al inicio y se enfoca su título. Se conserva el overlay previsto para pantalla completa. La geometría comprueba ahora explícitamente contenido/barra aunque alguien reintroduzca sticky, y la regresión de lectura/navegación pasa en los tres navegadores. La Exposición S1 comparte esa superficie y se incluye en la revalidación.

La entrega de examen debe esperar también un autoguardado ya iniciado. `AnswerQueue` comparte la promesa de la petición en curso y `flushNow` drena las revisiones/lotes restantes antes de resolver; ante fallo de red vuelve al estado offline y conserva el borrador. Así pulsar Entregar durante una petición válida no genera un falso aviso de desconexión. La regresión reproduce una confirmación demorada con una revisión nueva y una cola superior al límite de 100 respuestas por petición.

El primer candidato se congeló en `2bfca959c13c60f15272aa41e5b10882bf377867`. El QA remoto verifica por API que el deployment esté READY, pertenezca al proyecto autorizado, sea Preview y corresponda exactamente al HEAD probado. La auditoría de archivos privados valida también la canonicalización observada de Next: `/.secrets/` devuelve 308 exclusivamente a `/.secrets`, cuyo resultado debe ser 404. No se aceptan destinos alternativos ni redirecciones externas.

El QA del primer Preview conservó 250 PASS/35 fallos/3 dependientes. El diagnóstico atribuyó las excepciones iniciales de raíz a la barra Vercel, con stack de `vercel.live/_next-live/feedback/feedback.js`. La automatización usa [x-vercel-skip-toolbar, documentado oficialmente](https://vercel.com/docs/vercel-toolbar/managing-toolbar#disable-toolbar-for-automation), sin ampliar el filtro de errores ni modificar CSP. El probe controlado muestra que la API WebKit Windows informa None incluso para cookies declaradas Lax/Strict: se contrasta SameSite en Set-Cookie HTTP y Secure/HttpOnly/Path en ambos canales, sin conservar valores de sesión. No se afirma enforcement cross-site de Safari. Los negativos 404/401 solo se reconocen por ruta, fase, método y status comprobados.

La revalidación de 120 terminó 115 PASS/5 fallos y descubrió dos problemas adicionales del código propio. Auth dejó una promesa de importación de progreso sin manejar al cancelar un chunk; AccountRoot captura esas cargas y usa una revisión de resolución para ignorar sesiones anteriores/desmontadas. El estado autenticado solo se anuncia cuando las dependencias del cliente están disponibles. Una carga fallida conserva el aviso sin conexión y el progreso local. Las pruebas reproducen chunk cancelado, presencia fallida, desmontaje y respuesta tardía; no se ocultan errores globales.

La lectura de salud de Lab era una Server Function POST; su transporte Next emitía una excepción WebKit al navegar con la lectura pendiente. Se usa un Route Handler GET `/api/oracle/status`, compuesto con el mismo adaptador real y `Cache-Control: no-store`. El gateway HTTP pertenece a infraestructura, la presentación recibe el puerto por props y aborta la lectura al desmontar. El SSR no espera las consultas de salud, evitando bloquear el HTML del laboratorio. La ejecución SQL conserva validación, Server Function y cuenta lectora. El nuevo endpoint no expone configuración ni devuelve filas simuladas; fallos privados producen indisponibilidad genérica. Esta corrección requiere nuevo commit/build/Preview y QA sobre ese SHA, no convierte el primer Preview en PASS.

La comprobación adicional en StrictMode reprodujo una regresión de la protección contra respuestas tardías: al repetir los efectos se descartaba la petición anterior, pero el ref de «marca ya comprobada» impedía iniciar la nueva. La limpieza restablece ese ref a null además de invalidar la revisión. Así una reactivación vuelve a consultar al servidor y solo la revisión vigente inicia sync. La regresión pasó de estado loading permanente a authenticated con un único start. No se desactiva StrictMode, habilitado por defecto en App Router. Este ajuste exige otro build/Preview; la suite del candidato anterior queda vinculada a 654d2e1 y no se atribuye al nuevo código.

El ajuste se congeló y sincronizó en `44a16c2d9b4e8cf850e9993ade9ea2db790ec60d`. Su Preview 896eqstei está READY y se valida por separado: el gate compara proyecto, entorno, deployment y Git SHA antes de ejecutar QA. El reporte remoto registra también URL y source para evitar atribuir las pruebas a otra versión. Las capturas incluyen el navegador en el nombre para conservar evidencia distinta de los tres motores. La lectura pública de salud continúa GET/no-store; las reglas de autorización y la ejecución Oracle no cambian.

La allowlist de Auth conserva los callbacks anteriores y añade únicamente los dos destinos exactos del nuevo Preview, sin comodines ni cambio del Site URL público. No se otorgó ningún rol a Jorge o Amilkar: falta confirmar sus correos autorizados. El backend docente se prueba con usuarios de QA propios identificados por UUID; eso no sustituye el acceso real de los dos destinatarios. Production permanece en el release anterior hasta superar ese gate explícito del encargo.

El QA completo de 44a16c2 terminó 289 PASS y dos fallos. El GET de salud seguía activo al navegar a otro documento, donde React puede no desmontarse; dirigido WebKit volvió a fallar una de tres repeticiones. Se amplía su ciclo de vida: abortar en [pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event), consultar de nuevo en [pageshow persistido](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event) y usar una revisión para impedir que una respuesta anterior sustituya a la nueva. Ambos listeners se retiran al desmontar. No se usan unload/beforeunload ni se bloquea la caché de navegación. La regresión de unidad prueba cancelación, restauración y respuesta tardía; la de navegador registra únicamente la fase del aborto, sin reemplazar resultados de Oracle. Roja sobre 44a, nueva validación pendiente sobre otro commit/Preview; no se amplía el filtro de errores de consola.

La validación de cebc6f6 confirmó que pagehide no basta: 290 PASS/4 fallos y la excepción nativa de salud reapareció. Un probe con XMLHttpRequest también falló dos de tres, por lo que se descarta cambiar solo el transporte. El estado real se compone ahora en el servidor dentro de Suspense y llega al cliente como ReactNode; el editor puede trabajar mientras ese fragmento resuelve. La disponibilidad es una comprobación inicial, no una señal realtime; cada ejecución muestra su resultado real o su propio error. Se retira el gateway HTTP cliente sin consumidores. La API GET/no-store sigue disponible para observabilidad y comparte la misma lectura, proyectando solo available/reason/message. No se altera la ejecución Oracle, la autorización, CSP ni el filtro de consola. La regresión de navegador exige cero peticiones de salud del cliente al abrir y salir; es roja sobre el Preview anterior en navegación SPA y de documento. Validación local del ajuste SSR: lint, typecheck, build y formato PASS; 2204 Vitest PASS (1509 unitarias y 695 integraciones), siete omisiones explícitas y cero fallos; 18 unidades dirigidas y 72 E2E relacionados PASS en Chromium, Edge y WebKit, sin retries ni omisiones. Ocho rutas cumplen el presupuesto: LCP máximo 828 ms, CLS .047 y Lab −14.11 % de JS; Home conservador tras tres segundos +9.51 %. Las dos regresiones de navegación exigen cero peticiones cliente de salud. Falta congelar este código y comprobarlo en un nuevo Preview; estos resultados no se atribuyen a cebc6f6. La confirmación de feedback S3 pasó tres probes dentro de cinco segundos, pero la causa del fallo inicial no se afirma resuelta.

Fecha: 23 de septiembre de 2026. Alcance: base técnica y visual de R2.

## Alcance de esta entrega

Se leyeron AGENTS.md, CONTINUITY.md y los once documentos originales de docs antes de implementar. Se conservan sin modificar las especificaciones académicas. El encargo actual autoriza los cimientos de R2 sin resolver R1 ni avanzar a contenido, juego o persistencia.

Las rutas `/`, `/learn`, `/presentation`, `/lab`, `/challenge`, `/live`, `/results` y `/resources` son navegables. Las pantallas de módulos son contenedores tipados con estados vacíos específicos. Home presenta la identidad y los accesos. No hay lecciones, misiones, puntuación, usuarios, salas, repositorios simulados ni clientes de Supabase. El laboratorio declara que Oracle no está conectado y no ejecuta SQL.

`/dev/design-system` reúne los trece componentes solicitados y las muestras de sus estados. Los datos de su tabla son los radios reales del diseño; el progreso está rotulado como demostración. El único ejemplo SQL corresponde al subconjunto y al esquema documentados y no tiene resultado precalculado. La búsqueda muestra exclusivamente su control y sus estados, sin un índice de contenido ficticio. La ruta lleva `noindex`, pero esto no equivale a autenticación ni convierte su contenido en privado.

## Versiones y reproducibilidad

- Next.js **16.3.6**, estable verificado mediante `npm view next dist-tags` y la [documentación oficial](https://nextjs.org/docs/app/getting-started/installation). App Router y rutas tipadas habilitados; sin canary.
- React y React DOM **19.3.0**. Bootstrap **5.3.8**, exactamente la versión solicitada, desde npm.
- TypeScript **6.0.3** con `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` y `noFallthroughCasesInSwitch`.
- Sass **1.105.0**, ESLint **9.39.5**, Prettier **3.9.9**, Vitest **5.0.1** y Playwright **1.63.0**, fijados en `package.json` y `package-lock.json`.
- Entorno local: Windows, Node **24.20.0**, npm **11.19.0**. `.npmrc` fija versiones exactas y comprueba el motor. Usar `npm ci` para reproducir el árbol.

## Capas y módulos

```text
src/
  app/                     # composición de rutas, metadata y layouts de Next
  presentation/
    components/ui/         # componentes visuales reutilizables
    layouts/               # navegación, pie y contenedores de modos
    navigation/            # destinos públicos de la interfaz
    pages/                 # portada estructural
    design-system/         # showcase interno
  features/<modulo>/
    presentation/          # pantalla base de cada módulo
  application/             # reservado: casos de uso y puertos
  domain/                  # reservado: reglas puras
  infrastructure/          # reservado: adaptadores de puertos
  styles/                  # tokens Sass, Bootstrap local y componentes propios
```

Las capas reservadas tienen documentación de responsabilidad, no implementaciones que lancen errores ni contratos de negocio especulativos. Cuando exista un caso de uso se añadirán solo sus capas necesarias al módulo. Los contratos de acceso externo pertenecerán a aplicación; infraestructura los implementará. No se confunden componentes de presentación con adaptadores.

`scripts/architecture-boundaries.mjs` aporta una regla local de ESLint: valida alias `@/`, imports relativos, reexports e imports dinámicos en capas compartidas y por módulo. Dominio depende de dominio; aplicación de aplicación/dominio; infraestructura de infraestructura/aplicación/dominio; presentación de presentación/aplicación/estilos. `app` compone rutas y presentación. Se bloquean dependencias del dominio hacia React, Next y paquetes externos, además de globals de navegador/red. Las pruebas comprueban dependencias permitidas y rechazadas.

Páginas, layouts y estados vacíos usan componentes de servidor. Las fronteras cliente se limitan a navegación activa y componentes con estado o eventos. No se instala el JavaScript de Bootstrap ni Popper para controlar el mismo DOM que React.

`next dev` añadió su bloque gestionado a `AGENTS.md`; se verificó en `node_modules/next/dist/server/lib/generate-agent-files.js`. Se conservan las instrucciones originales y se retiene el bloque para evitar regeneraciones. Se consultaron las guías locales de layouts, Sass y configuración de esta versión.

## Sistema de diseño

`src/styles/_tokens.scss` es la fuente de colores, espaciado, tipografía, radios, sombras, duraciones, capas y contenedores. Sus mapas Sass emiten custom properties en `:root`, consumidas por los componentes. Los valores de DESIGN_SYSTEM.md se mantienen: page `#F5F8FF`, night `#0B1733`, editor `#091221`, primary `#1746B8`, cyan `#20CCE5`; escala 4/8/12/16/24/32/48/64; radios 10/20/28; sombra 0/8/24 al 10 %; tiempos 150/250/350 ms; z-index 0/100/200/300; máximo 1320 px y lectura 72ch.

Los radios 20–28 px se aplican a tarjetas y secciones; los controles conservan los 10 px explícitos de la especificación. Las familias sans y mono son pilas del sistema. No se descargan fuentes, fotografías ni logos. El símbolo `[s]` es la marca tipográfica del producto, no una recreación del logotipo institucional pendiente.

Se añaden únicamente tres colores de sintaxis al editor: string `#A8E6B8`, number `#FFD08A` y comment `#A2B1CB`, sobre editor oscuro. No intervienen en la evaluación SQL. Las palabras clave usan cian; el resaltado es visual, no un analizador ni un ejecutor.

Bootstrap aporta retícula, contenedores y un subconjunto de utilidades compilados desde Sass local, siguiendo su [mecanismo de personalización](https://getbootstrap.com/docs/5.3/customize/sass/). No se importa CSS de CDN ni el tema de componentes por defecto. `_bootstrap.scss` es el único límite de compatibilidad con el `@import` de Bootstrap 5.3; el resto usa `@use`. Sass recibe rutas absolutas a los paquetes para resolver imports internos también en Windows. `quietDeps` y la exclusión de la deprecación `import` documentan esa compatibilidad; no se desactivan errores de compilación.

La retícula usa los cortes 576/768/992/1200/1400 px. Navegación móvil desplegable, columnas apiladas y contenedores con ancho mínimo cero evitan desbordamientos. Código y tabla admiten scroll propio con foco y ayuda visible; el texto no se reduce para encajar. El layout de Exposición reserva tamaños de 48 px para encabezados, 28 px para cuerpo y 26 px para código en escritorio. Las escenas y tablas de proyección reales siguen pendientes.

## Interacción y accesibilidad

- Botones de al menos 44 × 44 px, foco de 3 px y estados deshabilitado/enviando; el envío mantiene el ancho del texto original y comunica `aria-busy`.
- Tabs con un solo punto de entrada de Tab, flechas, Inicio/Fin y panel asociado. Chips y mensajes tienen texto; alertas añaden icono.
- Diálogo nativo `showModal`, cierre con Escape, ciclo de Tab explícito y retorno al activador. Se normaliza el foco de botones al pulsarlos en WebKit.
- Campos controlados y botones esperan la hidratación antes de habilitar sus eventos, evitando perder una entrada temprana sobre el HTML de servidor.
- Tooltip accesible por foco, hover y toque, descartable con Escape, con ancho limitado al viewport. Su burbuja permanece accesible al mover el puntero.
- Copia de código sin números de línea, con mensaje recuperable si no hay acceso al portapapeles. No se transfiere una consulta al laboratorio inexistente.
- Tabla con caption, encabezados, alineación numérica y estado vacío. Progreso con nombre y valores accesibles. Skeleton estático y spinner solo para el estado de espera; `prefers-reduced-motion` elimina animaciones y transiciones.

## Validación

En curso durante la integración. Se registrará aquí la ejecución final de lint, typecheck, pruebas, formato y build, sin atribuir a esta base la aceptación del producto completo.

La batería cubre contratos UI y arquitectura con Vitest; rutas, navegación, teclado, diálogos, tooltips, búsqueda visual, axe, tamaño táctil y reflow con Playwright. Viewports: 360×800, 390×844, 768×1024, 1024×768, 1440×900 y 1920×1080; además 180×400 y 720×450 como reflow equivalente a zoom 200 %. Las capturas se generan en `test-results` y `output/playwright` y no se versionan.

Los proyectos de aceptación son Chromium, Edge y WebKit, alineados con los motores de TEST_PLAN. El intento adicional de Firefox no pudo arrancar en este Windows: `spawn UNKNOWN`, con evento SideBySide que no resuelve el ensamblado `mozglue`. Se reprodujo con reinstalación forzada y una versión anterior; no fue un fallo de la web. Se conserva Playwright 1.63.0 y se documenta Firefox como no verificado, sin modificar el sistema ni parchear binarios. WebKit en Windows no sustituye la comprobación pendiente en iPhone físico.

No se declara completado R2 completo ni D01–D08 para flujos aún inexistentes. Faltan revisión con lector de pantalla, dispositivos físicos y proyector; Oracle real, contenido, vídeos, juego, Supabase, seguridad de salas y pruebas de carga pertenecen a fases posteriores. No se ha publicado ni desplegado la aplicación.

## Fases 2 y 3 — SQL Oracle Challenge

- **Contenido.** El responsable del proyecto adoptó en la Fase 3 una versión 2 de M01–M09. GAME_SPEC.md 2.0 y TEST_PLAN.md reflejan el cambio y el catálogo se versiona como `select-challenge-v2`. Estado detallado en [CHALLENGE_STATUS.md](CHALLENGE_STATUS.md).
- **Raíz de composición.** `src/composition` es la única capa que puede importar infraestructura junto con aplicación, y solo `src/app` puede importarla. La regla ESLint `architecture/dependencies` y sus pruebas incluyen esta capa. Las Server Functions de corrección (`src/composition/challenge/actions.ts`) validan cada entrada porque son accesibles por POST directo.
- **Arrastre.** dnd-kit `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0 y `@dnd-kit/utilities` 3.2.2, con versiones exactas y paquetes oficiales. Se usan `MouseSensor` y `TouchSensor`. El teclado y el toque sin arrastre usan controles explícitos del `SequenceBuilder` en lugar de `KeyboardSensor`.
- **Corrección por resultado.** Las piezas se analizan con el motor SQL compartido y se corrigen por su resultado lógico sobre el dataset canónico (Fase 3 con un analizador provisional, sustituido en la Fase 4 por el motor único de `src/domain/sql`). Es una referencia didáctica, no una ejecución en Oracle, y no sustituye al laboratorio (P08).
- **Corrección base.** `.ds-table-scroll` pasa a ser el bloque contenedor de sus textos ocultos absolutos, que desbordaban la página en WebKit móvil al resaltar columnas.

## Fase 4 — Motor SQL educativo y laboratorio

- **Motor único.** `src/domain/sql` reúne el léxico (con posiciones y comentarios `--`), el parser de descenso recursivo que produce un AST, el analizador semántico contra el catálogo de EMPLEADOS, el evaluador educativo, que recorre el árbol sin `eval`, el traductor al español, la anatomía y el renderizado canónico. Laboratorio, M05, M08, M09 y M10 lo reutilizan; se eliminaron los módulos provisionales `expression.ts` y `projection-query.ts`. Una prueba impide reintroducir otro parser o usar `eval`.
- **Diagnósticos pedagógicos.** Tienen códigos propios y nunca imitan códigos ORA. Se muestran en cinco grupos (SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE y ADVERTENCIA), indican línea y columna y, cuando existe, una corrección aplicable (LAB_SPEC 2.0). Aplican los límites de LAB_SPEC: 4000 caracteres, 500 tokens, 12 elementos y 8 niveles de paréntesis. `SELECT nombre salario` es válido y se señala con el aviso de posible coma ausente (LAB19).
- **Oracle.** El puerto `src/application/oracle-executor.ts` recibe solo la sentencia canónica construida desde el árbol validado. El adaptador vigente, `UnconfiguredOracleExecutor`, declara que no hay conexión y no devuelve filas. El caso de uso `executeOnOracle` rechaza antes del motor cualquier consulta inválida o no permitida.
- **Editor.** CodeMirror 6 con `@codemirror/state` 6.7.6, `view` 6.43.13, `commands` 6.11.1, `lang-sql` 6.10.0, `language` 6.12.4, `lint` 6.9.7 y `@lezer/highlight` 1.2.3 (versiones exactas y paquetes oficiales). Resalta la sintaxis, marca los diagnósticos, Ctrl/Cmd+Enter ejecuta la acción principal y Tab sale del editor. En `/challenge` se carga bajo demanda solo al abrir M10.

## Fase 5 — Integración y QA real

Se preserva la arquitectura de módulos y la raíz de composición. Los cambios de producto se limitan a los defectos comprobados: identidad académica exacta, resumen de las 78 lecciones en la portada, tablas docentes realmente tabulares en móvil y dialecto CSV para Excel español.

`RecordTable` reutiliza `ColumnTabs` y consulta el tamaño de su contenedor. La representación compacta debe activar explícitamente `.dv__groups`, que DataView oculta por defecto: la revisión visual encontró este defecto aunque la página no desbordaba. Las E2E comprueban ahora que filas, tabla y pestañas estén visibles, y recorren Inicio/Fin en todos los anchos exigidos.

Las pruebas locales usan variables explícitas y exigen loopback. Se impide heredar las credenciales remotas de `.env.local`; la sala local usa memoria y clave de QA. La prueba de 40 clientes solo acepta local o una habilitación explícita de staging. El bypass de Preview se envía únicamente a una petición del host verificado, sin redirecciones automáticas; las trazas remotas quedan desactivadas.

Las migraciones remotas se aplicaron sin recrear tablas ni borrar datos existentes, por TLS verificado, con versiones y huellas registradas. La sincronización de las 150 preguntas oficiales es una operación de contenido legítima; las cuentas y evaluaciones temporales se limpian por sus UUID propios. El registro detallado final vive en FINAL_QA_REPORT y PRODUCTION_DEPLOYMENT; los informes anteriores conservan su valor histórico.

La imagen social se genera desde código HTML mediante `scripts/generate-og.mjs`; no depende de fuentes externas ni reproduce una página de referencia. Mantiene 1200 × 630 y la identidad del proyecto.

La revisión visual detectó que S1 aún enumeraba las funciones de texto, número y fecha como futuras pese a sus tres lecciones publicadas. Se corrigió solo esa metadata para enumerar conversión, NVL2/NULLIF/COALESCE y DECODE, que SECTION_1_AUDIT ya identifica como ampliación futura; no se reescribieron lecciones ni preguntas.

El encargo final del 4 de octubre exige no mostrar el emblema sin autorización pública. Home, Exposición y pie conservan los créditos en texto; el original permanece documentado. WebKit reprodujo el ancho porcentual obsoleto de las leyendas al estrechar un formulario ya rellenado: se usa ancho automático con máximo del contenedor. La QA de arrastre espera la activación del sensor y su colisión antes de soltar, sin sustituir el gesto ni añadir retries. La medición descarga el documento antes de cerrar su contexto por el bloqueo observado del subsistema multimedia de WebKit/Windows.

La comprobación adicional del reloj mostró que el contador dependía del reloj de calendario después de calcular su offset. Una regresión reprodujo el salto de seis horas. `useServerClock` ahora combina la hora recibida con tiempo monotónico (`performance.now`) y se resincroniza con cada nueva referencia del servidor. El vencimiento y la aceptación de respuestas siempre permanecen bajo PostgreSQL; el cambio corrige la representación del tiempo sin trasladar autoridad al cliente.

La regresión completa WebKit reveló además que truncar la referencia del servidor al segundo podía mostrar 5:01 en una evaluación de cinco minutos. Se conserva la precisión de milisegundos de esa referencia y se redondea únicamente el tiempo monotónico transcurrido para mantener snapshots estables. La prueba usa una referencia terminada en `.750Z` y exige 5:00 al inicio y 4:59 tras un segundo. La expectativa antigua del emblema en Home se sustituye por ausencia, manteniendo todos los créditos académicos exigidos. La medición del Lab espera también el editor dinámico antes de sumar recursos JavaScript.

El examen de selección múltiple reprodujo 18 px de desbordamiento a 320 px: su leyenda conservaba 304,8 px para un grupo de 254 px. El grid del `fieldset` anula el `float` en WebKit; cambiar únicamente ese grupo a flujo de bloque conserva la semántica nativa y permite envolver la instrucción. Las opciones mantienen su grid. La regresión selecciona una pregunta múltiple del banco oficial por UI y comprueba dos selecciones después de recuperación offline y recarga.

La captura WebKit tiene un límite nativo de 32767 píxeles. Para un listado largo de cuentas QA locales, se registra la altura y DPR y se captura el viewport si la imagen completa excede ese límite; se conservan todas las aserciones de filas, encabezados, pestañas y geometría. La cancelación de una precarga RSC admite `_rsc` como primer o segundo parámetro; el filtro sigue limitado al mensaje concreto de cancelación, sin ocultar otras excepciones ni errores CSP. El diagnóstico del caso multimedia observó una espera de hidratación de 5178 ms; esa aserción usa un presupuesto explícito de 15 s, manteniendo las comprobaciones de reproducción, subtítulos y proporción. No se atribuye una causa interna del retraso sin evidencia.

La regresión Chromium volvió a reproducir la ayuda intermitente. Se instrumentaron eventos sin cambiar el producto: foco, aparición, scroll pendiente y retirada de la burbuja mientras el botón seguía enfocado y visible. El caso original falló 3/5 y Tab real con autoscroll, 4/5. Se reclasifica como defecto real de persistencia, no como fallo de una fuente o del entorno. El tooltip conserva y reposiciona la ayuda durante scroll con foco visible; la retira con Escape, blur, activador fuera del viewport o scroll de ayuda de puntero sin foco. Tres unitarias verifican posición, descarte persistente y salida del viewport; una regresión de navegador comprueba Tab después del evento nativo de scroll. Su único consumidor es el showcase interno, por lo que la regresión adicional WebKit puede limitarse a sus cinco interacciones, conservando la evidencia previa de la batería completa de 349 casos.

La QA del Preview `5126e05` encontró un defecto real del monitor remoto: se suscribía correctamente, pero la señal `realtime.send` no llegaba al profesor. La prueba aislada con un canal aleatorio recibió el mismo evento enviado por REST (HTTP 202), pero no el insertado desde PostgreSQL; las particiones actuales existían y `pg_replication_slots` estaba vacío. No se modifica ni replica ninguna tabla educativa para ocultarlo. El servidor emite ahora un aviso REST vacío después de una RPC confirmada con la sesión; resuelve exclusivamente la clave del monitor por un UUID ya autorizado, con credenciales de servicio confinadas al servidor y plazo de dos segundos por petición. La lectura administrativa no se retorna ni se incorpora a la respuesta del estudiante. Se conserva Broadcast de la base para entornos que sí tengan consumidor y el poll de seguridad del monitor; las señales duplicadas siguen agrupadas por el refrescador existente. Se comprueba además que la URL pública de la sesión coincida con la URL privada de ese entorno. Las regresiones cubren denegación, resultados inválidos/ambiguos, payload vacío y fallo de red sin revertir la escritura.

El flujo remoto de sala creó QR, respondió, alcanzó 100 puntos y cerró correctamente, pero su limpieza de QA usaba un filtro `code` inexistente. Se corrigió exclusivamente el filtro a `join_code`. La sala temporal de aquella ejecución se identificó por su UUID, código, hora de creación y único alias de QA; se eliminó solamente ese registro con sus hijos propios. Los datos existentes de otras salas se preservan.

## Cierre técnico de Fase 5: procedencia del candidato y QA

El Preview validado conserva el código de aplicación f067058; los commits posteriores contienen QA/documentación, sin diferencias en módulos, assets, dependencias ni build config. La cobertura final amplía axe a tags WCAG 2.0/2.1/2.2 A/AA en pantallas críticas; 22 análisis remotos sin infracciones. La observación posterior a un timeout de navegación no cambia la aserción ni convierte el fallo en PASS: repropaga el error y registra solo identificadores propios para limpieza.

El build local de producción usa configuración pública real de Production y secretos privados locales. Valores [SENSITIVE] ocultados por Vercel no se tratan como credenciales. Preview y smoke de Production son gates distintos; SMTP UNKNOWN impide afirmar la excepción de proveedor externo ausente. Estado operativo BLOCKED, sin nuevas funcionalidades ni promoción.

## Publicación definitiva de Fase 5

El dashboard autenticado confirmó SMTP personalizado desactivado, resolviendo el UNKNOWN. Se aplica la excepción externa del último encargo: implementación de correo validada, entrega externa pendiente, Microsoft opcional. Preview y Production corresponden al HEAD congelado 6be89ed; los cambios posteriores son documentación. Se usa promote, que crea Production del mismo código con su configuración, y se ejecuta smoke real sin bypass. Se corrigió configuración Auth (Site URL localhost y allowlist vacía) con dominio público y callbacks exactos; cinco comprobaciones de generación administrativa de links no equivalen a envío de correo. No se modificaron módulos, currículo, dependencias ni React Bits.
