# DESIGN_SYSTEM — Identidad y componentes

Versión 2.0 · 26 de septiembre de 2026 · Relacionado con [UX_FLOWS.md](UX_FLOWS.md), [CONTENT_MAP.md](CONTENT_MAP.md) y [FINAL_UX_PEDAGOGICAL_AUDIT.md](FINAL_UX_PEDAGOGICAL_AUDIT.md). La sección [Sistema final (2.0)](#sistema-final-20) prevalece sobre lo anterior cuando difieren.

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

Nombre público: **SQL SELECT LAB**. Sección lúdica: **SQL Oracle Challenge**. Firma discreta «Jorge Gutierrez Thomas» y profesor «Amilkar Sierra» en pie y modo Exposición. Institución: Universidad Popular del Cesar. Usar el logotipo oficial en navegación o portada sobre fondo compatible, sin deformarlo, recolorearlo ni imponerlo como marca de agua sobre tablas. Identidad confirmada por el responsable (PROJECT_SPEC). Logotipo obtenido del sitio institucional; procedencia registrada en `public/identity/README.md`.

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
| Vista de datos | `DataView`: rótulo de contexto (Tabla original, Vista educativa, Resultado, Resultado Oracle, Antes, Después), recuento, `caption`, encabezados semánticos, números a la derecha y tabulares, NULL como insignia con texto «valor nulo» y ESTADO con símbolo y texto. Tabla cuando cabe; fichas por registro con campos agrupados cuando no. |
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

`src/presentation/components/data/data-view.tsx` calcula el ancho, en em, que necesita la tabla. Una consulta de contenedor (`_data-view.scss`, umbrales de 14 a 120 em) decide la representación sin JavaScript ni saltos de diseño:

| Espacio | Representación |
| --- | --- |
| Suficiente | Tabla completa: encabezado discreto, separadores suaves, hover, radio y sombra mínima. |
| Medio, en resumen | Tabla con las columnas prioritarias; cada ficha abre «Ver registro completo». |
| Tableta | Rejilla de fichas: dos o tres por fila, con los campos agrupados. |
| Móvil | Una ficha por empleado: nombre y apellido, número, cargo y campos con rótulo. |

- **Grupos de EMPLEADOS:** Identidad, Organización, Compensación, Empleo y Contacto.
- **Resumen / Completa:** el selector `DataViewToggle` alterna entre ambos modos, sin barra horizontal en ninguno.
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
- **Flujo:** en móvil, en vertical y con poca altura (zoom de 150 % en adelante), la escena fluye con 17 px de base.

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
- **Mapa de aprendizaje (`RouteMap`):** ocho bloques con letra, objetivo y conceptos; en móvil, línea de tiempo vertical.
- **Competencias (`CompetencyGrid`), ruta de continuidad (`FutureRoadmap`) e ilustración «Del dato a la consulta» (`DataToQuery`, SVG original):** escenas 25, 28 y 29.
- **Misión del Challenge:** contexto (pedido, consulta, concepto clave y «Datos necesarios para esta misión») junto a la interacción cuando la misión mide 52 rem o más; una columna en móvil. La tabla completa es un desplegable «Ver tabla completa» con selector Resumen / Completa.
- **Selección de filas (`RowPicker`):** cada fila es una casilla con sus campos en una lista de definición; con ancho se alinea como una tabla, en estrecho cada campo lleva su nombre. Al cerrar la misión indica «Cumple» o «No cumple» con símbolo y texto.
- **Feedback del Challenge:** tipo de error, «Qué está bien», «Qué necesita ajuste» y «Pista», en tono de advertencia, no de castigo.
