# DESIGN_SYSTEM — Identidad y componentes

Versión 3.0 · 3 de octubre de 2026 · Relacionado con [UX_FLOWS.md](UX_FLOWS.md), [CONTENT_MAP.md](CONTENT_MAP.md) y [FINAL_UX_PEDAGOGICAL_AUDIT.md](FINAL_UX_PEDAGOGICAL_AUDIT.md). La sección [DB LAB 3.0](#db-lab-30) prevalece sobre lo anterior cuando difieren; [Sistema final (2.0)](#sistema-final-20) sigue vigente en lo que 3.0 no cambia.

## Dirección visual fundada en las referencias

| Referencia inspeccionada | Rasgo observado | Adaptación propia |
|---|---|---|
| Bootstrap, capturas 113208 y 113240 | Navegación superior, búsqueda Ctrl+K, índice lateral y código legible. | Jerarquía documental en Estudio, buscador global visible y ejemplos fáciles de copiar. No adoptar su violeta de marca. |
| Atera Energy, capturas 113742, 113746 y 113751 | Navegación blanca, fondos celestes, bloques azules, tarjetas amplias y curvas grandes. | Alternancia de superficies claras y azul noche, secciones con aire y radio moderado. No reutilizar fotografías industriales, logotipo ni naranja comercial. |
| Spinoff, captura 113717, dominio `spinoff.es` | Imagen de gran formato, encabezado simple y título prominente. | Portada con gran demostración de SELECT sobre una tabla. Evitar vídeo de fondo, carrusel y texto sobre fotografía. |
| Juego propio, captura y sitio F3 | Azul muy oscuro, cian, tipografía de código, mapa de misiones y progreso. | Conservar reconocimiento del Challenge y editor oscuro. Reducir brillo y limitar las superficies oscuras a portada, código y juego. |
| Sitio compañero F5 | Índice de lecciones y práctica posterior. | Referencia de organización académica únicamente. No copiar diseño, retícula, textos o iconografía. |

Bootstrap se usará como base de retícula y utilidades, personalizado con Sass y variables de diseño. Su documentación describe esa personalización. [Bootstrap Sass](https://getbootstrap.com/docs/5.3/customize/sass/). Las medidas siguientes son decisiones propias, no valores medidos de las capturas.

## Identidad institucional

Nombre público: **DB LAB** («Plataforma interactiva de Bases de Datos con Oracle»), desde la versión 3.0; antes, SQL SELECT LAB. Sección lúdica: **SQL Oracle Challenge**. Firma discreta «Jorge Gutiérrez Thomas» y docente «Amilkar Sierra Romano» en pie, portada y modo Exposición. DB LAB es un proyecto académico: no se presenta como producto oficial de Oracle ni de la universidad. Institución: Universidad Popular del Cesar. Usar el logotipo oficial en navegación o portada sobre fondo compatible, sin deformarlo, recolorearlo ni imponerlo como marca de agua sobre tablas. Identidad confirmada por el responsable (PROJECT_SPEC). Logotipo obtenido del sitio institucional; procedencia registrada en `public/identity/README.md`.

## Tokens propuestos

| Categoría | Token | Valor y aplicación |
|---|---|---|
| Fondo | page / surface / soft | #F5F8FF / #FFFFFF / #EAF1FF para lectura, tablas y bandas. |
| Fondo oscuro | night / editor | #0B1733 / #091221 para portada y editor. |
| Texto | ink / muted / inverse | #132445 / #4C5D78 / #F7FAFF. |
| Acción | primary / hover | #1746B8 / #10368F, texto blanco. |
| Acento | cyan | #20CCE5 sobre fondo oscuro con texto night, nunca texto fino cian sobre blanco. |
| Estado | success / warning / danger | #176B45 / #855500 / #B42332 sobre fondos claros; acompañados de icono y texto. |
| Borde | subtle / control | #D4DEEF / #63738D; control con contraste verificable. |
| Foco | focus | Anillo de 3 px #1746B8 en claro; #20CCE5 en oscuro, separado 2 px. |
| Espaciado | escala | 4, 8, 12, 16, 24, 32, 48, 64 px. |
| Radios | control / card / section · sm / md / lg / xl / pill | 10 / 20 / 28 px · 6 / 10 / 14 / 20 / 999 px. |
| Sombra | elevated · xs / sm / md | Suave, azul noche: 8/24 px al 10 % · 1/2 px al 6 %, 2/8 px al 8 %, 12/32 px al 12 %. |
| Marca y superficies | brand-navy / brand-blue / surface-alt | #0B1733 / #1746B8 / #F0F4FB (alias semánticos de la misma paleta). |
| Valores especiales | null-bg / null-border · success-soft / warning-soft / danger-soft | #EEF2F8 / #8E9BB3 (insignia NULL) · fondos suaves de estado. |
| Movimiento | feedback / transition | 150 / 250 ms; máximo 350 ms. Sin bucles decorativos. |
| Capas | base / sticky / overlay / dialog | 0 / 100 / 200 / 300; tooltip de diálogo dentro de su contexto. |

Tipografía: interfaz con pila de sistema sans-serif; código con pila monoespaciada del sistema. Evitar una descarga de fuentes como dependencia del contenido. Texto 18 px en lectura, mínimo 16 px en móvil y controles; línea 1,5–1,65. Encabezados 32–56 px según ancho. Código 17 px en Estudio y mínimo 26 px en Exposición. Encabezados de escena 40–48 px y cuerpo de proyección 26–30 px. Escala fluida en `--type-*` (display, slide-title, section-title, body, code, small). Ningún texto visible baja de 12 px; los datos, de 14 px. No reducir letra para resolver una tabla demasiado ancha: **cambiar de representación** (vista de datos adaptable), nunca encoger ni añadir una barra horizontal.

## Retícula y composición

Toda rejilla CSS de una columna declara `grid-template-columns: minmax(0, 1fr)` y los mínimos fijos se escriben como `min(Npx, 100%)`: sin columna explícita, la pista implícita crece hasta el ancho mínimo del contenido y rompe el reflujo con zoom 200 % (D05). Contenedor máximo 1320 px, texto explicativo de hasta 72 caracteres por línea. Márgenes 16 px en teléfono, 24 px en tableta y 32 px en escritorio. Retícula conceptual de doce columnas en escritorio, apilado simple en móvil. Cortes de adaptación: 576, 768, 992, 1200 y 1400 px. [Retícula Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/).

Home (versión 1.1, decidida por el responsable del proyecto): barra clara de una fila; portada azul noche con «ORACLE DATABASE · SQL FUNDAMENTALS», el título «SELECT EN ORACLE SQL», autor, asignatura e institución, y cuatro acciones: «Iniciar clase» (principal, cian), «Modo Estudio», «Laboratorio SQL» y «SQL Challenge». Siguen, en bandas a sangre completa que alternan superficies (claro, azul noche, azul muy claro, azul sólido, oscuro técnico y claro): identidad académica con logotipo, qué aprenderás (L00–L08), demostración interactiva de columnas, Challenge, vídeo introductorio en preparación con el progreso, y próximos módulos como fichas «Próximamente». Evitar una portada con veinte botones iguales.

Estudio: índice lateral a partir de 992 px; en móvil, botón «Temario». Centro claro con una lección; código oscuro y tablas claras. Laboratorio: fuente y editor en dos columnas en escritorio, resultado debajo; en móvil, secciones Fuente, Consulta y Resultado, manteniendo consulta y resultado al cambiar. Exposición: una idea por escena en un lienzo 16:9 que ocupa el alto disponible; la tipografía de la escena depende del ancho del lienzo (unidades de contenedor), de modo que lo que cabe a 1366 × 768 cabe igual a 1920 × 1080 y en pantalla completa. Controles discretos debajo del lienzo (anterior, contador, selector, pantalla completa, siguiente) y barra de progreso. En móvil y pantallas verticales la escena fluye con controles fijos abajo.

## Contratos de componentes

| Componente | Contenido y estados obligatorios |
|---|---|
| Navegación | Identidad, modo actual, buscar y volver a Home. Estado activo visible por texto y forma. |
| Botón | Primario, secundario y textual; normal, hover, foco, presionado, deshabilitado y enviando. El estado enviando conserva el ancho. |
| Buscador | Etiqueta «Buscar tema o recurso», resultados agrupados, fragmento contextual, vacío y sin coincidencias. Reabre sin perder el contexto anterior. |
| Bloque SQL | Monoespaciado, una cláusula por línea (formateador sobre el analizador léxico), líneas largas con sangría francesa y sin barra horizontal. Acciones normalizadas: «Copiar», «Abrir en Lab» y «Ver lección». |
| Editor | Etiqueta accesible, ayuda de atajos, estado pendiente/ejecutando/resultado/error y salida por Tab sin trampa de teclado. |
| Vista de datos | `DataView`: rótulo de contexto (Tabla original, Vista educativa, Resultado, Resultado Oracle, Antes, Después), recuento, `caption`, encabezados semánticos, números a la derecha y tabulares, NULL como insignia con texto «valor nulo» y ESTADO con símbolo y texto. Siempre tabular para resultados SQL: tabla completa cuando cabe; si no, partes o grupos de columnas con pestañas. |
| Pieza arrastrable | Texto de la columna o fragmento SQL, estado disponible/seleccionado/ubicado y controles alternativos para insertar, mover y retirar. |
| Feedback | «Correcto», «Revisa…» o «Servicio no disponible» con explicación específica. No usar solo verde/rojo. |
| Temporizador | Tiempo restante o transcurrido y modo explícito. Avisos accesibles a 30 y 10 segundos; no anunciar cada segundo. |
| Ranking | Posición, alias, puntos y tiempo; propia fila destacada. Actualizar sin arrebatar foco ni saltar el scroll. |
| Vídeo | Portada, controles, subtítulos, transcripción y alternativa de acceso. Sin rótulo de duración manual. |
| Ficha futura | «Próximamente», objetivo corto y prerrequisito. No fingir que el módulo ya funciona. |

Los estados vacíos son específicos: «Escribe una consulta y pulsa Ejecutar», «Aún no hay participantes» y «No hay resultados para esta búsqueda». Los errores preservan el trabajo y ofrecen una acción concreta.

## Accesibilidad y aceptación visual

Objetivo: WCAG 2.2 AA en flujos críticos. Texto normal con contraste mínimo 4,5:1; texto grande y controles esenciales, 3:1. Medir las combinaciones reales, incluidas sintaxis, estados y texto sobre azul. La selección por toque sin arrastre también es obligatoria; W3C explica que los movimientos de arrastre requieren alternativa de puntero simple. [W3C: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

- D01: controles táctiles de al menos 44 × 44 px como objetivo de producto, con separación suficiente.
- D02: todas las misiones se completan por teclado y mediante toque sin arrastrar.
- D03: foco visible y orden lógico en búsqueda, editor, modales, QR y resultados; al cerrar un diálogo vuelve al activador.
- D04: `prefers-reduced-motion` elimina desplazamientos y animaciones no esenciales; el resaltado estático conserva significado.
- D05: a 320 × 568 px y zoom 200 %, no hay recortes ni desplazamiento horizontal de página, tablas ni código educativo. La única excepción son las tablas interactivas del Challenge, con controles en cada fila.
- D06: a 1920 × 1080, código y tabla se leen con los tamaños de proyección especificados; el contenido largo se divide, no se encoge.
- D07: lector de pantalla identifica títulos, encabezados, progreso, pieza movida y feedback, sin repetir toda la tabla tras cada acción.
- D08: las superficies claras predominan en lectura; cian y fondos oscuros orientan atención sin brillo constante.

Las referencias guían composición y jerarquía. La aceptación exige una identidad propia; no se pretende reproducir sus páginas píxel por píxel.

## Sistema final (2.0)

Resultado del refinamiento de producto del 26 de septiembre de 2026. Evidencia antes y después en [FINAL_UX_PEDAGOGICAL_AUDIT.md](FINAL_UX_PEDAGOGICAL_AUDIT.md).

### Fuente conceptual única

`src/domain/concepts/sql-concepts.ts` define 31 conceptos, cada uno con los mismos campos:

- título, nombre y categoría;
- definición (25 palabras como máximo) y qué hace;
- para qué sirve, sintaxis y ejemplo;
- lectura en español del ejemplo;
- idea clave, error frecuente y matiz de Oracle.

La Exposición, el Estudio, los Recursos y el buscador la presentan de formas distintas, pero nunca la reescriben. Las categorías distinguen, entre otras, cláusula, palabra clave, operador lógico, condición, comodín de SELECT o de LIKE, operador de concatenación y opción de ordenamiento.

### Vista de datos adaptable

`src/presentation/components/data/data-view.tsx` calcula el ancho, en em, que necesita cada representación. Las consultas de contenedor (`_data-view.scss`, umbrales de 12 a 120 em, clases `dv-fit-N` y `dv-above-N`) muestran la primera que cabe en el espacio real, sin JavaScript ni saltos de diseño. La decisión depende del ancho disponible, no de un punto de corte de la ventana.

Una consulta SQL devuelve filas y columnas, así que su representación es **siempre tabular** (28 de septiembre de 2026). Las fichas verticales por registro quedan prohibidas como representación de un resultado.

| Espacio | Representación |
| --- | --- |
| Suficiente (escritorio, 1280 px o más) | Tabla completa: encabezado discreto, separadores suaves, hover, radio y sombra mínima. |
| No cabe y hay 7–12 columnas (tableta, zoom 125 %) | **Dos o tres partes** con pestañas (`ColumnTabs`): los grupos semánticos reunidos («Identidad, organización y compensación»), con ID_EMPLEADO y NOMBRE repetidos y las mismas filas. Con pocas filas (Home, escena 06, `fallback="bands"`), las partes se apilan en bandas para verlas a la vez. |
| Teléfono | **Grupos de como mucho cuatro columnas**, uno a la vista con pestañas: ID_EMPLEADO, NOMBRE y dos columnas de un grupo (Identidad, Organización, Compensación, Empleo, Contacto y jefe). La columna «¿Cumple?» cuenta dentro de las cuatro. |

- **Grupos de pestañas (`EMPLEADOS_TAB_GROUPS`):** Identidad (APELLIDO, CARGO), Organización (DEPARTAMENTO, CIUDAD), Compensación (SALARIO, BONO), Empleo (FECHA_INGRESO, ESTADO) y Contacto y jefe (CORREO, ID_JEFE). Un resultado parcial agrupa cada columna con su grupo; si un grupo está incompleto, la pestaña se nombra con sus columnas.
- **Pestañas accesibles:** `role="tablist"`, `tab` y `tabpanel`; flechas, Inicio y Fin; un solo panel visible (el resto con `hidden`).
- **Teléfonos (menos de 768 px):** si el contenedor es estrecho, relleno menor, encabezados que se parten tras «_», textos largos en dos líneas solo si hace falta, «¿Cumple?» solo con su símbolo (el texto sigue para lectores de pantalla) y letra de tabla de 12 px como mínimo. Estas reglas no afectan al lienzo del proyector.
- **Marco de la tabla:** `.dv__table` es el bloque contenedor de sus textos ocultos, así que una tabla que se desplaza en su marco (solo a 180 px) nunca ensancha la página.
- **Fichas:** solo `fallback="records"`, para tablas de referencia que no son un resultado SQL (resumen del Challenge, tabla de referencia de Recursos).
- **Tabla de resultados SQL (`size="compact"`):** la del laboratorio y la de datos completos. Letra de 13–14 px (12 px a 320), encabezados monoespaciados que se parten tras «_» (FECHA_ / INGRESO), textos largos en dos líneas (CARGO, DEPARTAMENTO, CORREO tras la arroba), números y fechas enteros a la derecha, filas alternas muy suaves y encabezado fijo al desplazar la página.
- **Datos de origen (`DatasetExplorer`):** la tabla EMPLEADOS completa, enmarcada en gris y con borde discontinuo; el resultado de una consulta lleva el acento azul (`dv--result`).
- **«Qué cambió» (`ChangeSummary`):** filas y columnas antes → después (lo que cambia en color y negrita, con texto para lectores de pantalla), orden nuevo o encabezado nuevo, y el recuento en la tabla completa. En la Exposición ocupa la línea de resumen del resultado; en el Challenge acompaña al resultado de la consulta.
- **Esquema:** `SchemaCards` muestra el esquema por grupos (nombre, tipo Oracle y NULL) y sustituye los diccionarios en tabla.
- **Excepción:** en el lienzo 16:9 de la Exposición las tablas se diseñan para caber y se muestran siempre como tabla. Las pruebas visuales lo verifican a 1920, 1366, 1280 y 1024 píxeles.

### Plantilla de escena

Toda escena comparte la misma estructura, en este orden:

1. número, bloque y categoría del término;
2. título;
3. bloque «Definición» (o «Propósito»), con la lectura en español cuando aporta;
4. contenido;
5. «Idea clave».

- **Composiciones:** CONCEPT, COMPARISON, PIPELINE, TRANSFORMATION, STEPS, PRACTICE, SUMMARY, MEDIA y LIVE.
- **Contenido centrado:** con `align-content: safe center`, para que nunca invada el título.
- **Tipografía:** `clamp(14px, 1,72cqi, 52px)`, con mínimos en píxeles para el texto secundario.
- **Flujo:** en móvil, en vertical y con poca altura (zoom de 150 % en adelante), la escena fluye con 17 px de base. También cuando el lienzo quedaría por debajo de 870 px en la ventana (zoom 125 %, portátil con poca altura): la exposición marca `data-flow` y aplica las mismas reglas. En pantalla completa siempre hay lienzo 16:9.

### Flujo pedagógico de escena (2.2)

Las escenas de concepto (05–19) siguen el mismo modelo: **1 Tabla de origen → 2 Consulta → 3 Qué hace cada parte → 4 Resultado**, más la idea clave. Lo componen `ConceptFlow`, `FlowStep`, `QueryParts` y `FlowArrow` (`scene-flow.tsx`):

- **Proyección didáctica** (`src/domain/concepts/concept-projections.ts` y `src/application/didactic-projection.ts`): por concepto, columnas relevantes, filas de muestra por ID_EMPLEADO, partes de la consulta, propósito e idea clave. El motor educativo calcula el resultado sobre esas mismas filas y el recuento en la tabla completa. No hay datos nuevos: EMPLEADOS sigue con 20 filas y 12 columnas.
- **Composición:** en fila (origen → consulta y partes → resultado) o en dos columnas que se leen de arriba abajo (origen y consulta | partes y resultado). Los anchos son proporcionales a lo que pide cada tabla y cada línea de código.
- **Antes y después:** en los filtros, las filas de origen llevan «Cumple / No cumple» (símbolo y texto); el resultado muestra solo las filas que quedan, sin esa marca.
- **Paso a paso:** los cuatro bloques aparecen en su paso; en 05 y 11 la cláusula de cada paso se resalta en los datos.
- **Qué hace cada parte:** fragmento del SQL con su color semántico y la glosa de la fuente conceptual (o el detalle de esa consulta).

### Controles de la Exposición

- **Barra inferior:** bloque, número, título corto y paso; progreso segmentado por bloque.
- **Botones:** Anterior, Escenas, Paso a paso, Notas, Pantalla completa y Siguiente, todos de al menos 44 × 44 px.
- **Navegador de escenas:** diálogo modal con foco atrapado y Escape. Es un panel lateral derecho en escritorio y una hoja inferior en móvil, agrupado en Fundamentos, Consulta, Filtrado, Orden e integración, y Práctica y cierre.
- **Pantalla completa:** solo el lienzo. Los controles se superponen y se atenúan tras 3 s sin actividad; vuelven con el puntero, un toque o el teclado.
- **Notas del expositor:** tecla N; nunca se muestran dentro del lienzo ni en pantalla completa.
- **Vista del presentador** (`/presentation/presentador`): escena actual y siguiente, notas, cronómetro y controles, sincronizados por BroadcastChannel.
- **Paso a paso:** revela el contenido sin mover el diseño (`visibility` e `inert`) y respeta `prefers-reduced-motion`.
- **Enlace código ↔ datos:** cada cláusula es un botón que resalta sus columnas y filas, también con el teclado.

### Acciones normalizadas

Estudiar · Abrir en Lab · Practicar SQL · Iniciar Challenge · Crear sala · Ver lección · Copiar. En las fichas de Recursos el enlace a la lección se llama «Repasar lección».

### Color semántico de SQL (2.1)

Un mismo concepto tiene el mismo tratamiento en la Exposición, el Estudio, los Recursos, el laboratorio y el Challenge. El color nunca va solo: acompaña al texto, a un borde o a una forma.

| Papel | Qué incluye | Fondo claro | Fondo oscuro |
| --- | --- | --- | --- |
| Proyección | SELECT, DISTINCT, AS, `*` en SELECT, columnas y alias | `--color-sem-select` #0E7490 | `--color-sem-select-dark` #22D3EE |
| Fuente | FROM y la tabla | `--color-sem-from` #1D4ED8 | `--color-sem-from-dark` #93B8FF |
| Filtro | WHERE, AND, OR, NOT, BETWEEN, IN, LIKE, IS, NULL | `--color-sem-filter` #6D28D9 | `--color-sem-filter-dark` #C4B5FD |
| Operadores | `=`, `<>`, `>`, `<`, `>=`, `<=`, `+`, `-`, `*`, `/`, `||` | `--color-sem-operator` #92400E | `--color-sem-operator-dark` #FCD34D |
| Orden | ORDER BY, ASC, DESC | `--color-sem-order` #BE185D | `--color-sem-order-dark` #F9A8D4 |

El verde (`--color-success`) queda para lo correcto y el rojo (`--color-danger`) para el error. Los números del código usan un tono neutro para no confundirse con los operadores. La fuente única del papel de cada palabra es `sqlRole` (`src/presentation/components/data/sql-semantics.ts`), que usan el resaltado de SQL, las piezas del Challenge, la anatomía de la escena 20 y el enlace código ↔ datos.

### Componentes nuevos (2.1)

- **«En esta consulta» (`QueryGlossary`):** explica solo los elementos presentes con la glosa breve de la fuente conceptual (`gloss`, 8 palabras como máximo) y el color de su papel.
- **«Para qué sirve»:** línea opcional del bloque de definición de una escena (`use`), con el `whyItMatters` del concepto.
- **Mapa de aprendizaje (`RouteMap`):** ocho bloques con letra, objetivo, conceptos y resultado esperado («✓ Filtrar… »); en móvil, línea de tiempo vertical.
- **Competencias (`CompetencyGrid`), ruta de continuidad (`FutureRoadmap`) e ilustración «Del dato a la consulta» (`DataToQuery`, SVG original):** escenas 25, 28 y 29.
- **Misión del Challenge:** contexto (pedido, consulta, concepto clave y «Datos necesarios para esta misión») junto a la interacción cuando la misión mide 52 rem o más; una columna en móvil. La tabla completa es un desplegable «Ver tabla completa» con el explorador de datos (selector de columnas por grupos).
- **Selección de filas (`RowPicker`):** cada fila es una casilla con sus campos en una lista de definición; con ancho se alinea como una tabla, en estrecho cada campo lleva su nombre. Al cerrar la misión indica «Cumple» o «No cumple» con símbolo y texto.
- **Feedback del Challenge:** tipo de error, «Qué está bien», «Qué necesita ajuste» y «Pista», en tono de advertencia, no de castigo.

## DB LAB 3.0

Fase 1 de DB LAB (3 de octubre de 2026): la plataforma deja de ser una página de SELECT y se organiza en secciones. Se evoluciona el sistema 2.0; no se sustituye.

### Marca

- **Nombre y subtítulo:** salen de `PRODUCT_IDENTITY` (`src/application/academic-identity.ts`), junto con la promesa y el aviso académico. Ningún componente escribe la marca a mano.
- **Símbolo:** se conserva `>_` (terminal) en la cabecera, los iconos y la imagen social.
- **Logotipo:** «DB» en tinta y «LAB» en azul (cian sobre fondo oscuro).
- **Emblema institucional:** el registrado en `public/identity` ocupa su lugar en el pie y en la banda de identidad. No se añadieron logotipos nuevos.
- **Imagen social:** `src/app/opengraph-image.png`, 1200 × 630, se generó desde HTML con los tokens.

### Tokens añadidos

Se añaden en `_tokens.scss` y se emiten como propiedades CSS.

| Categoría | Token | Valor y uso |
| --- | --- | --- |
| Color | `info` / `info-soft` | #0B5CAD / #E7F0FB. Estado «Próximamente» y avisos neutros (contraste 5,6:1). |
| Color SQL | `sem-join` / `sem-group` (+ `-dark`) | #047857 / #C2410C · #6EE7B7 / #FDBA74. JOIN y ON; GROUP BY y HAVING. |
| Color SQL | `sem-function-dark` | #E2E8F0, en seminegrita. Funciones (COUNT, ROUND, NVL…). |
| Espaciado | `space-9` | 96 px. |
| Sombra | `shadow-lg` | 0 24 56, al 16 %. |
| Movimiento | `duration-entrance` · `ease-out` | 500 ms · cubic-bezier(0.16, 1, 0.3, 1). |
| Capas | `z-menu` / `z-toast` | 150 / 400 (se suman a base, sticky, overlay y dialog). |
| Contenedor | `container-narrow` | 960 px. |
| Interacción | `tap-target` | 44 px. |

**Tipografía por rol.** h1–h3 conservan las medidas que ya tenía la base. Fuentes del sistema: no se descargan fuentes web.

| Rol | Token o regla | Medida |
| --- | --- | --- |
| Display | `.home-hero__title` | clamp(3.5rem, 9vw, 7.5rem), 800 |
| H1 | `--type-h1` | clamp(2rem, 4.5vw, 3.5rem) |
| H2 | `--type-h2` | clamp(2rem, 3vw, 2.5rem) |
| H3 | `--type-h3` | 1.5rem |
| Body | `--text-body` | 18 px, interlineado 1.65 |
| Lead | `--type-lead` | clamp(1.125rem, …, 1.375rem) |
| Caption | `--type-caption` | 14 px |
| Label | `--type-label` | 13 px, mayúsculas y espaciado |
| Code | `--font-mono`, `--type-code` | monoespaciada |

El texto secundario nunca baja de 13 px; en esta fase se subieron a ese mínimo el atajo de búsqueda, los rótulos del pie y los de identidad.

**Puntos de corte:** los de Bootstrap (576, 768, 992, 1200 y 1400 px), más 360 px y 300 px para el reflujo con zoom del 200 %.

### Componentes base

| Componente | Archivo | Uso |
| --- | --- | --- |
| AppShell | `presentation/layouts/app-shell.tsx` | Salto al contenido, cabecera, `main` (al menos una pantalla de alto, sin CLS del pie) y pie. Lo usa el layout raíz. |
| Header y navegación móvil | `presentation/layouts/site-header.tsx` | Seis entradas: Inicio, Secciones, Laboratorio, Challenge, En vivo y Recursos. Menú `details` accesible por debajo de 992 px. |
| Footer | `presentation/layouts/site-footer.tsx` | Proyecto, autor, docente, contexto, tecnologías, enlaces y avisos académicos. |
| PageHeader | `ui/page-header.tsx` | Ruta de navegación, antetítulo, h1, entrada, acciones y lateral; tonos claro y noche. |
| Breadcrumb | `ui/breadcrumb.tsx` | `nav` «Ruta de navegación» con `aria-current="page"`. |
| StatusBadge | `ui/status-badge.tsx` | Disponible, Próximamente, Previsto e Información. Cada estado tiene icono propio y texto: el color no es la única señal. |
| SectionCard | `features/sections/presentation/section-card.tsx` | Qué se aprende, práctica, estado, avance y un enlace con texto explícito. |
| ModeGrid y ModeCard | `features/sections/presentation/mode-grid.tsx` | Modo con destino real como enlace; sin destino, tarjeta no interactiva «Próximamente». |
| SectionRoute | `features/sections/presentation/section-route.tsx` | Ruta 01 → 02 → 03 con `aria-current="step"`. |
| ProgressCard / LearningOverview | `features/sections/presentation/learning-overview.tsx` | Progreso general, continuar, evaluaciones y actividad. Recibe solo datos reales; lo demás, en estado neutro. |
| ComingSoon | `SectionDetail` con estado `coming-soon` | Objetivo, temas, requisitos, posición y modos previstos. |
| QueryTransformation | `presentation/components/data/query-transformation.tsx` | Tabla original → consulta → qué hace → resultado → qué cambió. Admite varias tablas de origen (JOIN). |

Reutilizados sin cambios: SQLCodeBlock (`SqlCode`), DataTable/DataView, Progress, Alert, LoadingState, EmptyState (`.empty-state`), `error.tsx` y `global-error.tsx`, y la vista de datos adaptable de la versión 2.0.

### Color de SQL ampliado

Se añaden JOIN, INNER, LEFT, RIGHT, FULL, OUTER, CROSS, ON y USING (relación, verde); GROUP BY y HAVING (agrupación, naranja); funciones conocidas seguidas de paréntesis (claro y seminegrita); y UNION, ALL, INTERSECT y MINUS como palabras clave.

`BY` toma el papel de la cláusula a la que acompaña. Un nombre seguido de paréntesis que no es una función conocida (`INSERT INTO empleados (…)`) no se colorea como función.

### Movimiento y React Bits

Regla de densidad: un efecto protagonista por pantalla; el resto son microinteracciones. Ningún efecto entra en el laboratorio, el Challenge, la Exposición ni las lecciones.

**Movimiento reducido:**
- La regla global de `_base.scss` detiene animaciones y transiciones.
- Los lienzos dibujan un solo fotograma estático o no se animan.
- Los efectos también quedan quietos en pantallas táctiles y con ahorro de datos (`prefersStaticEffects`).
- Con `forced-colors` se ocultan.

**Componentes usados** (gratuitos, MIT + Commons Clause, atribución en `THIRD_PARTY_NOTICES.md`):

| React Bits | Dónde | Por qué |
| --- | --- | --- |
| Shape Grid (antes Squares) | Fondo del hero de la portada | Celdas como las de una tabla. Canvas 2D sin dependencias. Se detiene fuera de vista y con la pestaña oculta. Es el único efecto protagonista. |
| Spotlight Card | Tarjetas de sección y de modo | Microinteracción con el ratón y con el foco. Solo CSS y una variable. |
| Star Border | Sección disponible | Señala el estado importante. Solo CSS; componente de servidor. |
| Pixel Card | Secciones «Próximamente» | Metáfora de «en construcción». Canvas solo mientras hay ratón o foco. |

**Descartados:**

| Componente | Motivo |
| --- | --- |
| Pattern Waves, Circular Gallery | WebGL y dependencia `ogl`. |
| Fade Content, Animated Content, Dot Grid, Target Cursor, Depth Carousel | Dependen de GSAP. Fade y Animated ocultan el contenido hasta que llega JavaScript. |
| Counter, Count Up, Animated List, Stepper, Carousel, Shiny Text | Dependen de `motion`, una biblioteca completa para una animación. Los carruseles esconden contenido. El progreso usa la transición CSS de `Progress`. |
| Electric Border | Canvas animado sin pausa ni movimiento reducido. Star Border cumple el mismo papel con CSS. |
| Folder | Esconde el temario detrás de un clic. |
| Cursor Grid, Waves | Alternativas de fondo descartadas frente a Shape Grid: listeners globales y sin pausa fuera de vista (Waves). |
| Magnet, Click Spark, Pixel Swap | Decoración sin función pedagógica. |

React Bits Pro no se usó.

### Navegación y orientación

**Navegación principal:**
- Inicio · **Secciones** · Laboratorio · Challenge · En vivo · Recursos.
- «Secciones» sustituye a «Aprender» y queda activa en `/sections`, `/learn`, `/presentation` y `/modules`.
- No se añaden entradas sin destino. Mi aprendizaje, Evaluaciones y Perfil llegarán con las cuentas de estudiante.
- El avance local se muestra en `/sections`.

**Orientación:**
- La ruta de navegación aparece en las páginas de sección.
- Los modos se repiten en todas las secciones, con microcopia que dice adónde lleva cada enlace («Abrir el laboratorio», «Ver el plan de la Sección 2»).

### Fase 2: cuentas

**Componentes:**

- `TextField` y `PasswordField`, con «Mostrar/Ocultar», etiqueta visible, ayuda y error con `aria-describedby`;
- resumen de formulario con foco y `role="alert"`;
- `AuthLayout`: identidad nocturna con la cuadrícula de la portada, muy tenue, y formulario claro; en móvil, una columna;
- `AccessMethods`;
- `AccountMenu`: en la cabecera, de 44 px, cerrable con Escape y con clic fuera;
- `LearnerDashboard`, `ProfileView`, `TeacherDashboard` y `AccessDenied`.

**React Bits reutilizado**, sin componentes nuevos:

- Shape Grid tenue en el lado visual del acceso;
- Spotlight Card en los métodos de acceso, en la sección disponible del panel y en los modos;
- Star Border en «Continuar en …»;
- Pixel Card en las secciones «Próximamente».

No se añadió ningún componente nuevo: los gratuitos que quedaban (Count Up, Animated List, Fade Content) dependen de motion o GSAP, o retrasan el contenido hasta hidratar.

**Datos del profesor:** tabla en escritorio; desde 991 px, tres líneas por estudiante, sin desplazamiento lateral ni tarjetas altas.

**Estados:**

- cargando: el menú tiene el mismo tamaño en todos sus estados, así que no hay CLS;
- invitado y con sesión;
- sin conexión, en el menú y en el panel;
- sincronizando o sincronizado;
- error;
- sin datos, en la actividad y en el grupo;
- 403;
- avisos de los flujos de correo.

### Fase 3: evaluaciones

**Principio:** el examen es deliberadamente sobrio. Sin fondos animados, partículas, cursores, carruseles, 3D ni animaciones largas. React Bits se usa fuera del examen, con intención.

**Examen (`exam-*`):**

- cabecera nocturna fija con nombre, «respondidas» y reloj (monoespaciado, cifras tabulares); el reloj pasa a ámbar a 5 min y a rojo suave a 1 min, siempre con texto;
- estado de guardado discreto: «Guardando…», «Guardado», «Cambios pendientes» y «Sin conexión. Tus respuestas se conservarán temporalmente.»;
- pregunta en tarjeta blanca; opciones de 44 px como mínimo con letra, borde y franja azul al elegir; opciones de código en fondo editor; opciones de tabla con un resumen y la tabla compacta;
- ordenar fragmentos con botones ↑ ↓ de 44 px (teclado y toque) y anuncio del movimiento;
- navegador de preguntas: números de 44 px; respondida en azul, sin responder en blanco, para revisar con franja ámbar y ⚑, actual con contorno cian; leyenda visible;
- durante el examen la cabecera del sitio queda solo con la marca (sin menús ni pie, `body:has(.exam-shell)`);
- en pantallas estrechas la pregunta va primero y el navegador después de «Anterior», «Siguiente» y «Entregar evaluación».

**Colores de estado:** éxito verde moderado (`success`), aviso ámbar (`warning`), error rojo (`danger`), información azul o cian (`info`, `cyan`). El monitor no usa rojo para los eventos: muestra números y texto neutro.

**Profesor:** navegación propia del panel; tarjetas por estado (Activas, Programadas, Borradores, Finalizadas, Archivadas plegadas); confirmación en dos pasos (`<details>`) para publicar, cerrar accesos, finalizar y eliminar; tablas reales de monitor, resultados y estudiantes, con columnas agrupadas mediante pestañas accesibles cuando el contenedor mide menos de 66rem. Cada grupo repite la identidad, conserva `caption`, encabezados y filas; nunca convierte veinte registros en tarjetas verticales. Distribución de notas como barras con su número.

**Nota:** «Nota final 4.2 / 5.0» en una tarjeta nocturna con el número grande en monoespaciado; nunca puntos.

**React Bits reutilizado** (sin componentes nuevos ni dependencias):

- Spotlight Card: tarjetas de evaluación (estudiante y profesor);
- Star Border: evaluación en curso (estudiante) y activa (profesor);
- Pixel Card: secciones del banco de preguntas;
- Shape Grid: sin uso nuevo.

Se evaluaron otros gratuitos para cuenta atrás, transiciones y resultados (Count Up, Animated List, Fade Content, Decrypted Text): dependen de motion o GSAP, ocultan el contenido hasta hidratar o distraen durante un examen. No se añadieron.

**Microinteracciones (todas desaparecen con `prefers-reduced-motion`):** transición de 250 ms entre preguntas, entrada de la tarjeta de nota, crecimiento de las barras de distribución y cambio de color al guardar. Ninguna mueve la pantalla.
