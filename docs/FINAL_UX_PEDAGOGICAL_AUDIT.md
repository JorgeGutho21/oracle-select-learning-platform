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

## Resultado después del refinamiento

Pendiente: se completa con las mediciones de la vista previa y de producción al cerrar el trabajo.
