# Auditoría final de UX y pedagogía

Versión 1.0 · 26 de septiembre de 2026 · Rama `claude-final-ui-polish-20260926`.

Auditoría hecha **antes** de cambiar código, sobre la producción estable: `https://sql-select-lab.vercel.app`, despliegue `dpl_3NAgTPb2pFztqa6Mxx4oHNNK2c7w`, código del commit `37a2271`. La sección [Resultado después del refinamiento](#resultado-después-del-refinamiento) se completa al cerrar el trabajo.

## Método

- **Qué se midió:** las 29 escenas del Modo Exposición y 12 páginas (`/`, `/learn`, `/learn/select`, `/learn/where`, `/learn/empleados`, `/resources`, `/lab`, `/challenge`, `/modules`, `/presenter`, `/join`, `/results`).
- **Tamaños (15):**
  - 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 1024×768;
  - 768×1024, 430×932, 390×844, 375×812, 360×800, 320×568;
  - y el zoom de 125 %, 150 % y 200 % sobre 1366×768, equivalentes a 1093×614, 911×512 y 683×384 píxeles CSS.
- **Volumen:** 615 mediciones automáticas con Playwright (Chromium) y 123 capturas, revisadas una por una a 1920×1080 y en las resoluciones críticas.
- **Métricas por pantalla:**
  - desbordamiento horizontal del documento;
  - elementos con barra horizontal (`scrollWidth > clientWidth` en `overflow: auto`);
  - texto recortado en contenedores con `overflow: hidden`;
  - tamaño de letra mínimo visible;
  - palabras visibles en la escena;
  - proporción del lienzo que ocupa el contenido.
- **Consola:** 15 errores, todos `404` de `/join` (la ruta existe solo como `/join/[código]`).

## Hallazgos globales

| #   | Hallazgo                                                                                                                                                                                          | Evidencia                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **Ninguna escena define el concepto.** El título y un rótulo pequeño («Decide qué filas se conservan») son todo el texto conceptual; el alumno infiere la definición a partir de código y tablas. | 29/29 escenas sin bloque «Definición» ni «Propósito».                                                                                                                                                                                                                                                 |
| G2  | **Espacio muerto sistemático bajo el título.** `.scene__body` centra el contenido en vertical y deja una franja vacía entre el título y el contenido.                                             | A 1920×1080, el contenido ocupa el 30 % del alto útil en la escena 01, 38 % en la 08, 40 % en la 06, 32 % en la 28 y 29 % en la 29. Hueco inferior de 264 px en la escena 01.                                                                                                                         |
| G3  | **Texto demasiado pequeño para proyector.** El texto secundario escala con el lienzo y baja de 12 px.                                                                                             | A 1366×768, lienzo de 1049×590: rótulos de 11,1 px, resúmenes de tabla de 10,3 px y la marca «repetida» de 9,3 px. Con zoom 150 % (911×512): lienzo de 653×367, letra base de 11,1 px y mínimo de 6,4 px.                                                                                             |
| G4  | **Tablas con barra horizontal.**                                                                                                                                                                  | Móvil 390×844: escenas 04 (547>332 px), 08 (396>332) y 21 (422>332). A 320×568: escenas 03, 04, 08, 18, 19 y 21. Estudio a 1366×768: `/learn/select` (717>450), `/learn/where` (692>450) y `/learn/empleados` (1774>450 y 1699>905). Lab: 1648>564 a 1366 y 1648>306 en móvil.                        |
| G5  | **Código en una sola línea en Recursos.** La chuleta aplana cada ejemplo con `compact()`.                                                                                                         | 12 bloques de código con barra horizontal a 1366×768 (de 394 a 945 px de ancho en 356 px). A 1366 se lee «SELECT nombre, salario * 12 FROM emp…» cortado.                                                                                                                                             |
| G6  | **El selector de escenas es un `<select>` de 280 px sin agrupación.** No muestra el bloque temático ni permite ver la estructura de la clase; en móvil ocupa una fila entera sobre los botones.   | Barra inferior de 69–76 px con contador duplicado (contador y selector repiten el número).                                                                                                                                                                                                            |
| G7  | **La misma idea se define distinto en cada superficie.**                                                                                                                                          | WHERE: «Decide qué filas se conservan» (Exposición), «Conserva solo las filas que cumplen la condición» (chuleta), la frase de la lección y la descripción del buscador. SELECT: «Elige qué columnas mostrar» (Recursos) frente a «SELECT indica qué columnas quieres ver en el resultado» (Estudio). |
| G8  | **Todo se llama «palabra» sin distinguir cláusula, operador o condición.**                                                                                                                        | En la Exposición, ninguna escena indica si AND es un operador lógico, si BETWEEN es una condición o si `%` es un comodín de LIKE.                                                                                                                                                                     |
| G9  | **NULL se muestra en cursiva tenue**, no como marca.                                                                                                                                              | `.hl-null` gris, cursiva y al 85 %; en la escena 04 se confunde con un valor.                                                                                                                                                                                                                         |
| G10 | **ESTADO sin marca visual.**                                                                                                                                                                      | ACTIVO e INACTIVO son texto plano en todas las tablas.                                                                                                                                                                                                                                                |
| G11 | **`/join` responde 404.**                                                                                                                                                                         | Quien escribe `/join` sin código no llega a la entrada por código (`/live`).                                                                                                                                                                                                                          |

## Exposición, escena por escena

Medidas a 1920×1080 salvo que se indique otra cosa. «Ocupación» es la proporción del alto útil que usa el contenido.

| Escena            | Observación                                                                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 Portada        | 23 palabras; ocupación 30 %. Identidad correcta; el logotipo queda pequeño (13 em) y la escena parece vacía en 1920.                                                                                                         |
| 02 Ruta           | Ocho tarjetas con insignias crípticas («`a, b · + - * / · ( ) · AS ·                                                                                                                                                         |     | `», «`= <> > < · AND · OR · ( OR ) AND`»); no se entiende en 5 segundos. No hay orden visual (línea de tiempo) ni diferencia entre bloques. |
| 03 Qué es SQL     | «SQL es el lenguaje para pedir datos» es la única definición. Falta _Structured Query Language_, «bases de datos relacionales» y el esquema persona → SQL → base de datos → resultado. La tabla desborda a 320 px (291>262). |
| 04 EMPLEADOS      | Solo muestra 7 de 12 columnas y 8 filas; CARGO, ESTADO, FECHA_INGRESO, CORREO e ID_JEFE no aparecen en ninguna parte de la escena. No enseña tabla, fila, columna ni tipo. En móvil, barra horizontal de 547 px en 332 px.   |
| 05 SELECT/FROM    | Sin analogía QUÉ / DE DÓNDE ni definición. «Qué hace» correcto; ocupación 55 % con 150 px vacíos bajo el título.                                                                                                             |
| 06 SELECT *       | Buena cuadrícula de 12 columnas, pero sin definición de `*` como comodín ni el «12 columnas» enlazado visualmente. Ocupación 40 %.                                                                                           |
| 07 Columnas       | Dos consultas y dos resultados sin decir qué se compara: «mismos datos, distinto orden» no aparece.                                                                                                                          |
| 08 Expresiones    | Tabla de 3 filas y 5 columnas, con el 38 % de ocupación. No define «expresión». La frase «* y / van antes que + y -» usa símbolos sin explicar precedencia. En móvil, barra de 396 px en 332 px.                             |
| 09 Alias          | Buena comparación antes/después. «AS: la palabra, opcional, que lo asigna» no dice que AS es la palabra clave del alias.                                                                                                     |
| 10 DISTINCT       | «20 → 5» con la flecha repetida («20 → 5 / → / DISTINCT»). La tabla de la izquierda muestra 8 de 20 filas, así que el 20 no se ve. «No ordena y no borra datos» está en letra de nota (0,72 em).                             |
| 11 WHERE          | Buena marca de «Cumple / No cumple», pero sin embudo 20 → 5 ni definición de condición.                                                                                                                                      |
| 12 Comparaciones  | Seis tarjetas de operador sin escala visual (menor → mayor) ni ejemplo por operador.                                                                                                                                         |
| 13 AND y OR       | Dos consultas lado a lado, sin la lógica visible (A ✓ B ✓ → fila ✓).                                                                                                                                                         |
| 14 Paréntesis     | Correcta y bien llena (85 %); no señala qué empleados cambian entre ambas consultas (9 frente a 6).                                                                                                                          |
| 15 BETWEEN        | La consulta se corta en «`AND`↵`6000000;`», partiendo el rango en dos líneas. Falta la recta con los límites incluidos.                                                                                                      |
| 16 IN             | **No define IN** antes de usarlo: la escena muestra OR frente a IN y «17 de 20 filas». Sin chips de la lista.                                                                                                                |
| 17 LIKE           | Resalta las coincidencias en la tabla; las fichas de patrón no muestran ejemplos que coinciden y que no coinciden.                                                                                                           |
| 18 NULL           | Buena comparación `= NULL` / `IS NULL` / `= 0`; falta «NULL ≠ ''» y «NULL ≠ 'NULL'». NULL aparece como texto azul en cursiva.                                                                                                |
| 19 ORDER BY       | No hay «antes»: el alumno no ve el orden original frente al ordenado.                                                                                                                                                        |
| 20 Anatomía       | La leyenda no es interactiva. El título casi toca el bloque de código (lo separan 5 px a 1920). A 1366 la ocupación es del 96 %, con el texto de la leyenda a 11–12 px.                                                      |
| 21 Construcción   | Buen paso a paso. Falta la pregunta humana completa (está solo en el rótulo en mayúsculas). En móvil, barra de 422 px en 332 px.                                                                                             |
| 22 Errores        | El SQL erróneo está **tachado**, lo que dificulta leer justo lo que hay que reconocer. Sin «causa». Ocupación 46 %.                                                                                                          |
| 23 Laboratorio    | Lista de funciones sin vista del laboratorio real. «Tipos de aviso : sintaxis…» con los dos puntos separados del texto.                                                                                                      |
| 24 Challenge      | 35 palabras y 37 % de ocupación; cuatro números sin representación de misiones ni de pistas.                                                                                                                                 |
| 25 Qué aprendimos | 16 tarjetas legibles; no reutiliza la ruta de la escena 02, así que no cierra el ciclo.                                                                                                                                      |
| 26 Video          | Correcta; el reproductor usa el 79 % del alto.                                                                                                                                                                               |
| 27 Reto           | QR y pregunta correctos, pero no muestra el flujo profesor → QR → estudiantes → misiones → ranking.                                                                                                                          |
| 28 Próximamente   | Tres columnas con listas de palabras en monoespaciada (ocupación 32 %); no es una ruta visual por niveles.                                                                                                                   |
| 29 Cierre         | «¿Preguntas?» y una frase (28 palabras, 29 % de ocupación). No hay una consulta integradora que muestre lo aprendido.                                                                                                        |

Controles y navegación:

- Las teclas funcionan.
- La barra inferior repite el número (contador «04 / 29» y selector «4 · Conoce EMPLEADOS»).
- La ayuda de teclado se oculta por debajo de 1200×900.
- No hay notas del expositor ni vista de presentador.
- En pantalla completa se ocultan cabecera y pie, pero los controles quedan siempre visibles y no se atenúan.

## Páginas

| Página                   | Observación                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                     | Responde qué es y qué hacer («Iniciar clase» primero). Altura de 6042 px en 1920 y 10 213 px en móvil. La tabla del terminal es legible.                                                                                                                                                                                              |
| `/learn`                 | Índice claro; 5361 px de alto en 1920.                                                                                                                                                                                                                                                                                                |
| `/learn/select`          | «En una frase» correcta. La tabla de origen corta justo la columna pedida (CORREO) a 1366×768 (717>450) y a 1024×768 (717>302). 4325 px de alto: «Para qué sirve», «Qué cambió» y «Error frecuente» empujan la práctica hacia abajo. «Término técnico: proyección» está bien introducido después de la idea.                          |
| `/learn/empleados`       | Dos tablas de 12 columnas con barra de 1774 px. El diccionario de datos desborda en móvil (536>356).                                                                                                                                                                                                                                  |
| `/resources`             | 10 618 px de alto en 1920 y 26 459 px en móvil. Cada ficha repite patrón y ejemplo; el ejemplo va en una línea con barra horizontal. La barra de herramientas del código se parte distinto en cada tarjeta («Copiar código» debajo del rótulo en unas y al lado en otras). No hay agrupación por categorías.                          |
| `/lab`                   | **La tabla EMPLEADOS es la protagonista**: el panel 1 muestra 12 fichas de columnas y las 20 filas (1648 px de ancho) antes que el editor. En móvil, el editor aparece después de unos 1500 px de esquema. El diagnóstico y el resultado quedan fuera de la primera pantalla. El rótulo de la tabla se corta («empleados-select-v…»). |
| `/challenge`             | Sin desbordes; 1292 px.                                                                                                                                                                                                                                                                                                               |
| `/modules`               | 11 040 px en 1920 y 21 974 px en móvil (46 fichas). Sin desbordes.                                                                                                                                                                                                                                                                    |
| `/presenter`, `/results` | Sin desbordes.                                                                                                                                                                                                                                                                                                                        |
| `/join`                  | 404 (ver G11).                                                                                                                                                                                                                                                                                                                        |

## Prioridades de implementación

1. **Fuente conceptual única:** definiciones revisadas contra Oracle 19c, con categoría correcta, usadas por la Exposición, el Estudio, los Recursos y el buscador. Corrige G1, G7 y G8.
2. **Vista de datos adaptable:** tabla completa cuando cabe y fichas por registro cuando no, sin barra horizontal. Se aplica a la Exposición, el Estudio, el laboratorio y el diccionario. Corrige G4, G9 y G10.
3. **Lienzo de la Exposición:**
   - rejilla con definición bajo el título y sin espacio muerto;
   - tamaño mínimo de letra y navegador de escenas agrupado en bloques;
   - barra con bloque, número y título;
   - pantalla completa con controles que se atenúan;
   - notas del expositor.

   Corrige G2, G3 y G6.

4. **Rediseño de las escenas 02–04, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 22, 24, 27, 28 y 29.**
5. **Formateador SQL** basado en el analizador léxico para Recursos, Exposición y Estudio (G5).
6. **Laboratorio:** editor y resultado primero, esquema plegable y diagnóstico estructurado.
7. **Recursos por categorías, Estudio con revelado progresivo y `/join` → `/live`.**
8. **Pruebas:** suite de regresión visual y de desbordes.

## Segunda pasada: addendum pedagógico (Challenge, Recursos y cierre)

Revisión manual del responsable y medición propia sobre la versión local, antes de cambiar nada:

| Hallazgo                             | Evidencia                                                                                                                                                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 · Challenge dominado por la tabla | M01 y M03 mostraban EMPLEADOS completa (240 celdas) con barra de 1648 px a 1366×768 (1648>306 en móvil). M04: 100 celdas y «Comprobar» a 2680 px (3,5 pantallas).                                                                 |
| A2 · Frase que acepta la limitación  | «Desplaza la tabla horizontalmente si necesitas ver más columnas.» en `DataTable`.                                                                                                                                                |
| A3 · Feedback solo diagnóstico       | «Revisa tu respuesta» + un mensaje; sin tipo de error, sin lo que ya está bien, sin orientación progresiva. El acierto no explicaba el porqué.                                                                                    |
| A4 · Resumen del Challenge           | Tabla de 6 columnas con barra en móvil.                                                                                                                                                                                           |
| A5 · Escenas con poco contenido útil | Proporción de contenido a 1366×768: 02 = 0,44, 03 = 0,39, 06 = 0,38, 25 = 0,44, 29 = 0,47. La 02 era una rejilla de títulos sin objetivos; la 25 repetía la 02; la 28 listaba niveles; la 29 era la consulta integrada y enlaces. |
| A6 · Recursos                        | Las fichas no decían para qué sirve cada pieza ni qué devuelve el ejemplo; faltaban la coma, los paréntesis e IS NOT NULL.                                                                                                        |
| A7 · Color sin significado           | Todas las palabras clave en cian; los números y los operadores sin distinguir.                                                                                                                                                    |

Cambios, sin rehacer la arquitectura (misma fuente conceptual, vista de datos, formateador, sistema de escenas, motor SQL, adaptador Oracle y motor del Challenge):

- **Challenge (GAME_SPEC 3.1):**
  - misión en dos columnas (objetivo y datos junto a la interacción) y «Datos necesarios para esta misión» con 4–7 columnas;
  - M04 sobre una muestra de 10 registros que contiene todas las filas del resultado;
  - la tabla completa como desplegable secundario;
  - feedback con tipo, qué está bien, qué ajustar y orientación progresiva;
  - acierto explicado;
  - resumen como vista adaptable.
    La puntuación, los intentos, las pistas, la sala y Oracle en M10 no cambian.
- **Exposición:** mapa de aprendizaje A–H con objetivos (02), vocabulario y uso de SQL (03), fila, columna y celda (04), «Para qué sirve» en 03–06 y 11–19, «En esta consulta» (06), IS NOT NULL (18), anatomía con color por papel (20), seis errores reales (22), «Ahora ya puedes…» (25), cómo participar (27), ruta de continuidad de diez temas (28) y cierre ilustrado con tres ideas y preguntas de salida (29).
- **Recursos:** ficha con «En una frase», «Para qué sirve», «Patrón», ejemplo, «Qué devuelve» y «Error frecuente».
- **Estudio:** cada lección lista también sus otros términos (AS, `%`, `_`, IS NOT NULL, coma, paréntesis…) con la definición canónica.
- **Sistema:** color semántico de SQL (proyección, fuente, filtro, operadores y orden) en todo el producto.
- **Safari (WebKit), detectado por la suite en ese motor:**
  - un `<details>` con `display: grid` no mostraba su contenido (esquema del laboratorio, error frecuente de Recursos y fichas de `/modules`);
  - `/modules` desbordaba entre 3 y 34 px;
  - el foco no volvía al botón «Escenas» al cerrar el navegador.

Medición local después de la segunda pasada (servidor de desarrollo):

- **Challenge a 1366×768:**
  - «Comprobar» a 812–1435 px en M01–M09 (M04: 1678 → ~1200 px tras mover la consulta junto al pedido);
  - sin barras;
  - 60 celdas visibles como máximo;
  - 390×844 y 320×568 sin desbordes.
- **Escenas:** 0 desbordes y 0 invasiones a 1920×1080, 1600×900, 1366×768, 1280×720, 390×844, 360×800 y 320×568.
- **Páginas a 1366, 390 y 320 px:** sin desbordes, sin regiones con barra y sin texto de menos de 12 px.

## Resultado después del refinamiento

Mediciones con el mismo guion que la auditoría inicial:

- **Vista previa** `dpl_CQCuhceYxVh2e4jq19yC3B6b68VY` (commit `023581c`): 6 tamaños (1920×1080, 1366×768, 1280×720, 390×844, 360×800 y 320×568) × 41 vistas = 246 mediciones y 123 capturas. **0 desbordes de página, 0 regiones con barra horizontal, 0 textos recortados, 0 invasiones del título o de la idea clave, letra mínima de 12 px y 0 errores de consola.**
- **Producción** `dpl_2Bx2nGrZaKLEX8x8e7i8K3Cjon9b`: 1920×1080, 1366×768 y 390×844, 123 mediciones y 123 capturas, con el mismo resultado.
- **Challenge en la vista previa** (1366×768, 390×844 y 320×568): 0 barras. «Comprobar» a 793–1435 px en escritorio (antes: hasta 2680 px en M04). Como máximo 60 celdas visibles (antes: 240 en M01 y M03).

| Indicador                                            | Antes (producción al empezar)                        | Después            |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------------ |
| Regiones con barra horizontal a 1366×768             | Recursos 12, Estudio 1–2, laboratorio 1, Challenge 1 | 0                  |
| Letra mínima en escenas a 1366×768                   | 9,3 px                                               | 12 px              |
| Escenas que invaden título o idea clave              | varias (hasta 30 px)                                 | 0 en los 6 tamaños |
| Definición o propósito visible                       | parcial                                              | 29/29              |
| Código de Recursos en una línea con barra            | 12 bloques                                           | 0 (formateado)     |
| Tabla EMPLEADOS completa por defecto en el Challenge | M01 y M03                                            | ninguna misión     |

Calidad por escena (revisión visual de las capturas de la vista previa a 1920×1080, 1366×768 y 390×844; «ocupación» es la proporción de la pista usada a 1366×768):

| Escena | Título                    | Definición / propósito | SQL           | Visual                                          | Resultado      | Legibilidad | Ocupación | Responsive   | A11y |
| ------ | ------------------------- | ---------------------- | ------------- | ----------------------------------------------- | -------------- | ----------- | --------- | ------------ | ---- |
| 01     | Portada                   | Propósito              | —             | identidad y objetivos                           | —              | ≥ 12 px     | 0,46      | sin desborde | ✓    |
| 02     | Ruta de aprendizaje       | Propósito              | —             | mapa A–H con objetivos                          | —              | ≥ 12 px     | 0,68      | sin desborde | ✓    |
| 03     | Qué es SQL                | Definición + uso       | sí            | pregunta → SQL → base → resultado; vocabulario  | nombres        | ≥ 12 px     | 0,47      | sin desborde | ✓    |
| 04     | Conoce EMPLEADOS          | Definición + uso       | —             | fila, columna y celda; 12 campos agrupados      | 3 filas        | ≥ 12 px     | 0,69      | sin desborde | ✓    |
| 05     | SELECT y FROM             | Definición             | sí, enlazada  | preguntas → cláusulas → datos                   | tabla          | ≥ 12 px     | 0,64      | sin desborde | ✓    |
| 06     | SELECT *                  | Definición + uso       | sí            | 12 columnas numeradas; «En esta consulta»       | 12 × 20        | ≥ 12 px     | 0,43      | sin desborde | ✓    |
| 07     | Columnas específicas      | Definición             | sí            | mismo dato, distinto orden                      | 2 tablas       | ≥ 12 px     | 0,61      | sin desborde | ✓    |
| 08     | Expresiones y precedencia | Definición             | sí            | tres cálculos y su orden                        | tabla          | ≥ 12 px     | 0,59      | sin desborde | ✓    |
| 09     | Alias con AS              | Definición ×2          | sí            | antes / después del encabezado                  | 2 tablas       | ≥ 12 px     | 0,60      | sin desborde | ✓    |
| 10     | DISTINCT                  | Definición             | sí            | 20 → DISTINCT → 5                               | tabla          | ≥ 12 px     | 0,67      | sin desborde | ✓    |
| 11     | WHERE                     | Definición + uso       | sí, enlazada  | cumple / no cumple                              | tabla          | ≥ 12 px     | 0,68      | sin desborde | ✓    |
| 12     | Comparaciones             | Definición + uso       | sí            | escala de seis operadores                       | recuentos      | ≥ 12 px     | 0,52      | sin desborde | ✓    |
| 13     | AND y OR                  | Definición ×2 + uso    | sí            | tablas de verdad con casos reales               | nombres        | ≥ 12 px     | 0,56      | sin desborde | ✓    |
| 14     | Paréntesis                | Definición + uso       | sí            | agrupación y filas de diferencia                | nombres        | ≥ 12 px     | 0,50      | sin desborde | ✓    |
| 15     | BETWEEN                   | Definición + uso       | sí            | recta con límites incluidos                     | tabla          | ≥ 12 px     | 0,60      | sin desborde | ✓    |
| 16     | IN                        | Definición + uso       | sí            | OR repetitivo → IN                              | tabla          | ≥ 12 px     | 0,56      | sin desborde | ✓    |
| 17     | LIKE                      | Definición + uso       | sí            | cuatro patrones con coincidencias               | nombres        | ≥ 12 px     | 0,61      | sin desborde | ✓    |
| 18     | NULL e IS NULL            | Definición ×2 + uso    | sí            | NULL ≠ 0, = NULL frente a IS NULL / IS NOT NULL | tabla          | ≥ 12 px     | 0,62      | sin desborde | ✓    |
| 19     | ORDER BY                  | Definición + uso       | sí            | antes / después, ASC y DESC                     | tabla          | ≥ 12 px     | 0,65      | sin desborde | ✓    |
| 20     | Anatomía                  | Propósito              | sí            | cláusulas con color por papel                   | recuento       | ≥ 12 px     | 0,67      | sin desborde | ✓    |
| 21     | Construimos una consulta  | Propósito              | sí, por pasos | seis pasos                                      | tabla por paso | ≥ 12 px     | 0,62      | sin desborde | ✓    |
| 22     | Errores frecuentes        | Propósito              | sí            | seis errores: error, por qué, corrección        | —              | ≥ 12 px     | 0,62      | sin desborde | ✓    |
| 23     | Laboratorio               | Propósito              | sí            | vista del laboratorio y pasos                   | tabla          | ≥ 12 px     | 0,73      | sin desborde | ✓    |
| 24     | SQL Challenge             | Propósito              | —             | diez misiones y reglas                          | —              | ≥ 12 px     | 0,50      | sin desborde | ✓    |
| 25     | Qué aprendimos            | Propósito              | sí            | nueve competencias                              | ciudades       | ≥ 12 px     | 0,58      | sin desborde | ✓    |
| 26     | Video resumen             | Propósito              | —             | video con subtítulos                            | —              | ≥ 12 px     | 0,64      | sin desborde | ✓    |
| 27     | Reto en vivo              | Propósito              | —             | cómo participar y QR                            | —              | ≥ 12 px     | 0,53      | sin desborde | ✓    |
| 28     | Próximos temas            | Propósito              | —             | diez temas «Próximamente»                       | —              | ≥ 12 px     | 0,68      | sin desborde | ✓    |
| 29     | Cierre                    | Propósito              | —             | del dato a la consulta; preguntas de salida     | —              | ≥ 12 px     | 0,58      | sin desborde | ✓    |

Las pruebas de accesibilidad automáticas (axe, WCAG 2 A y AA) pasan en las escenas y páginas cubiertas por la suite E2E en Chromium, Edge y WebKit. Las relaciones campo → valor se conservan en tablas (`th` con `scope`) y en fichas (`dl`).
