# Notas de implementación — Cimientos y sistema de diseño

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
