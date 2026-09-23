# DESIGN_SYSTEM — Identidad y componentes

Versión 1.0 · Relacionado con [UX_FLOWS.md](UX_FLOWS.md) y [CONTENT_MAP.md](CONTENT_MAP.md).

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

Nombre público: **SQL SELECT LAB**. Sección lúdica: **SQL Oracle Challenge**. Firma discreta «Jorge Gutiérrez Thomas» en pie y modo Exposición. Institución: Universidad Popular del Cesar. Usar el logotipo oficial en navegación o portada sobre fondo compatible, sin deformarlo, recolorearlo ni imponerlo como marca de agua sobre tablas. Recurso oficial y escritura del docente pendientes de verificación antes de publicar.

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
| Radios | control / card / section | 10 / 20 / 28 px. |
| Sombra | elevated | Suave, desplazamiento vertical 8 px, desenfoque 24 px, azul noche al 10 %. |
| Movimiento | feedback / transition | 150 / 250 ms; máximo 350 ms. Sin bucles decorativos. |
| Capas | base / sticky / overlay / dialog | 0 / 100 / 200 / 300; tooltip de diálogo dentro de su contexto. |

Tipografía: interfaz con pila de sistema sans-serif; código con pila monoespaciada del sistema. Evitar una descarga de fuentes como dependencia del contenido. Texto 18 px en lectura, mínimo 16 px en móvil y controles; línea 1,5–1,65. Encabezados 32–56 px según ancho. Código 17 px en Estudio y mínimo 26 px en Exposición. Encabezados de escena 40–48 px y cuerpo de proyección 26–30 px. No reducir letra para resolver una tabla demasiado ancha: dividir la explicación o permitir desplazamiento horizontal dentro de la tabla.

## Retícula y composición

Contenedor máximo 1320 px, texto explicativo de hasta 72 caracteres por línea. Márgenes 16 px en teléfono, 24 px en tableta y 32 px en escritorio. Retícula conceptual de doce columnas en escritorio, apilado simple en móvil. Cortes de adaptación: 576, 768, 992, 1200 y 1400 px. [Retícula Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/).

Home: barra clara, portada azul noche con título y dos acciones principales «Iniciar exposición» y «Estudiar», demostración breve de selección de columnas, accesos secundarios al laboratorio y Challenge, entrada a sala y recursos. Evitar una portada con veinte botones iguales.

Estudio: índice lateral a partir de 992 px; en móvil, botón «Temario». Centro claro con una lección; código oscuro y tablas claras. Laboratorio: fuente y editor en dos columnas en escritorio, resultado debajo; en móvil, secciones Fuente, Consulta y Resultado, manteniendo consulta y resultado al cambiar. Exposición: una idea por escena, controles discretos, tablas grandes y sin navegación lateral extensa.

## Contratos de componentes

| Componente | Contenido y estados obligatorios |
|---|---|
| Navegación | Identidad, modo actual, buscar y volver a Home. Estado activo visible por texto y forma. |
| Botón | Primario, secundario y textual; normal, hover, foco, presionado, deshabilitado y enviando. El estado enviando conserva el ancho. |
| Buscador | Etiqueta «Buscar tema o recurso», resultados agrupados, fragmento contextual, vacío y sin coincidencias. Reabre sin perder el contexto anterior. |
| Bloque SQL | Monoespaciado, selección y copia sin números de línea, resaltado de sintaxis legible y botón «Abrir en laboratorio». |
| Editor | Etiqueta accesible, ayuda de atajos, estado pendiente/ejecutando/resultado/error y salida por Tab sin trampa de teclado. |
| Tabla | Título, encabezados semánticos, columnas numéricas alineadas a la derecha, resaltado con borde y texto de apoyo. Scroll local con indicación visible. |
| Pieza arrastrable | Texto de la columna o fragmento SQL, estado disponible/seleccionado/ubicado y controles alternativos para insertar, mover y retirar. |
| Feedback | «Correcto», «Revisa…» o «Servicio no disponible» con explicación específica. No usar solo verde/rojo. |
| Temporizador | Tiempo restante o transcurrido y modo explícito. Avisos accesibles a 30 y 10 segundos; no anunciar cada segundo. |
| Ranking | Posición, alias, puntos y tiempo; propia fila destacada. Actualizar sin arrebatar foco ni saltar el scroll. |
| Vídeo | Portada, duración, controles, subtítulos, transcripción y alternativa de acceso. |
| Ficha futura | «Próximamente», objetivo corto y prerrequisito. No fingir que el módulo ya funciona. |

Los estados vacíos son específicos: «Escribe una consulta y pulsa Ejecutar», «Aún no hay participantes» y «No hay resultados para esta búsqueda». Los errores preservan el trabajo y ofrecen una acción concreta.

## Accesibilidad y aceptación visual

Objetivo: WCAG 2.2 AA en flujos críticos. Texto normal con contraste mínimo 4,5:1; texto grande y controles esenciales, 3:1. Medir las combinaciones reales, incluidas sintaxis, estados y texto sobre azul. La selección por toque sin arrastre también es obligatoria; W3C explica que los movimientos de arrastre requieren alternativa de puntero simple. [W3C: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

- D01: controles táctiles de al menos 44 × 44 px como objetivo de producto, con separación suficiente.
- D02: todas las misiones se completan por teclado y mediante toque sin arrastrar.
- D03: foco visible y orden lógico en búsqueda, editor, modales, QR y resultados; al cerrar un diálogo vuelve al activador.
- D04: `prefers-reduced-motion` elimina desplazamientos y animaciones no esenciales; el resaltado estático conserva significado.
- D05: a 360 × 800 px y zoom 200 %, no hay recortes ni scroll horizontal de página; solo tabla o código pueden tener scroll propio.
- D06: a 1920 × 1080, código y tabla se leen con los tamaños de proyección especificados; el contenido largo se divide, no se encoge.
- D07: lector de pantalla identifica títulos, encabezados, progreso, pieza movida y feedback, sin repetir toda la tabla tras cada acción.
- D08: las superficies claras predominan en lectura; cian y fondos oscuros orientan atención sin brillo constante.

Las referencias guían composición y jerarquía. La aceptación exige una identidad propia; no se pretende reproducir sus páginas píxel por píxel.
