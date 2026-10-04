# PHASE4_QA — Verificación de la Fase 4 (currículo de las secciones 2 y 3)

Fecha: 4 de octubre de 2026. Rama: `claude-phase4-curriculum-20261003`, creada desde la etiqueta `phase3-checkpoint-20261003`. `main` y producción no se tocaron.

## 1. Entorno

| Pieza     | Versión o configuración                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Navegador | Chromium 1194 preinstalado en el contenedor (`/opt/pw-browsers`). No hay Edge ni WebKit.                          |
| Oracle    | Oracle Database Free 23.26.3.0.0 en Docker (`gvenzl/oracle-free:23-slim-faststart`, puerto local 1522)            |
| Supabase  | Supabase local (CLI, Docker) con las migraciones de las Fases 2 y 3                                               |
| Servidor  | Build de producción (`next build` + `next start`) en el puerto 3200, sala en memoria                              |
| Base      | Para comparar, build de la etiqueta `phase3-checkpoint-20261003` en un worktree aparte, servido en el puerto 3201 |

Las claves locales están en `.env.local` y `.env.oracle.local`, que no se versionan. Ninguna aparece en este documento.

## 2. Resumen

| Comprobación                         | Resultado                                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Lint, typecheck y formato            | PASS: `npm run lint` (0 advertencias), `npm run typecheck` y `npm run format:check`                                         |
| Unitarias                            | PASS: 1352 pasan; 2 se omiten a propósito (la ampliación de la Sección 1 no tiene escenas ni misiones)                      |
| Currículo en Oracle real             | PASS: 222/222 (`curriculum-oracle.test.ts`)                                                                                 |
| Sección 1 en Oracle real             | PASS: 102/102 (`oracle-real.test.ts`)                                                                                       |
| Banco de la Sección 1 en Oracle real | PASS: 79/79, las 78 comprobaciones y su recuento (`bank-oracle.test.ts`)                                                    |
| Cruce con PostgreSQL (PGlite)        | PASS: currículo 133/133; RLS de evaluaciones 25/25, de cuentas 16/16 y sala 22/22                                           |
| Banco de 150 preguntas en Supabase   | PASS: cuentas 7/7 y evaluaciones 5/5 contra Supabase local                                                                  |
| Build                                | PASS (`next build`, con las variables públicas de Supabase local)                                                           |
| E2E de la Fase 4                     | PASS: `curriculum.spec.ts` 35/35 (incluye teclado y el barrido de 66 rutas a 320 px)                                        |
| E2E completa (regresión)             | 302 pasan, 22 fallan y 0 se omiten. Las 22 fallan igual en la base de la Fase 3 (punto 5)                                   |
| Barrido de diseño                    | 396 comprobaciones (66 rutas × 6 anchos), 0 problemas tras corregir 19; clase: 71 escenas × 3 anchos, 0 barras horizontales |
| Contenido en el navegador            | 0 resultados de Oracle, preguntas, claves de respuesta o secretos en `.next/static`                                         |

## 3. Contenido y Oracle

- `tests/integration/curriculum-oracle.test.ts` ejecuta en Oracle real los 222 ejemplos del currículo:
  - 102 de la Sección 2;
  - 77 de la Sección 3;
  - 9 de «Funciones de una fila»;
  - 34 consultas y bloques propios del banco.

  Compara tabla, error, salida de DBMS_OUTPUT y tablas antes/después con `oracle-results.json`. Los 9 recorridos paso a paso imprimen exactamente lo mismo que Oracle.

- `tests/integration/oracle-real.test.ts` vuelve a ejecutar la Sección 1 (lecciones, escenas, laboratorio y misión M10).
- `tests/integration/bank-oracle.test.ts` ejecuta en Oracle las 78 comprobaciones del banco de la Sección 1.
- `tests/integration/curriculum-postgres.test.ts` repite en PGlite cada consulta sin construcciones propias de Oracle y comprueba que las filas de origen visibles bastan para el resultado.
- `tests/unit/curriculum/curriculum-integrity.test.ts` y `outline.test.ts` revisan identificadores, referencias, ejemplos huérfanos, tablas y que el índice ligero coincida con el contenido.

Defecto de las pruebas encontrado y corregido: `bank-oracle.test.ts` abría el ejecutor recreando el esquema de verificación `DBLAB_CURRICULO`, que `curriculum-oracle.test.ts` usa al mismo tiempo. Con la suite completa (`npx vitest run`, archivos en paralelo), uno borraba las tablas del otro (ORA-00942 y ORA-00955). Ahora el banco solo usa la cuenta lectora y no toca ese esquema. La suite completa pasa con los tres archivos de Oracle en paralelo.

Detalle del procedimiento en `ORACLE_VALIDATION.md`.

## 4. Bancos de preguntas

- `tests/unit/assessments/curriculum-bank.test.ts` revisa los bancos de las secciones 2 y 3 (50 + 50):
  - forma válida por tipo, tema de su sección y retroalimentación en cada opción;
  - un repaso que enlaza a una lección publicada de la sección;
  - distribución por tema y mezcla cognitiva 15/40/45;
  - variedad de tipos y de dificultades internas;
  - distractores de resultado que son tablas distintas con las mismas columnas que la correcta;
  - que la correcta no se delate por ser la opción más larga;
  - que cada consulta o bloque propio del banco (S2-B, S3-B) se use, y claves únicas entre secciones;
  - que ningún código de cliente importe el banco (las respuestas correctas no llegan al navegador).
- Las tablas, salidas y errores de esas preguntas se toman, por construcción, de los resultados verificados en Oracle (`verified-bank.ts`). Si un ejemplo cambia sin volver a ejecutarse, su huella deja de coincidir y la prueba falla.
- El banco de la Sección 1 (50) conserva sus pruebas de la Fase 3 y ahora ejecuta además sus 78 comprobaciones en Oracle.
- `tests/integration/assessments-supabase.test.ts` sincroniza el banco oficial completo con Supabase local: las 150 preguntas se aceptan sin rechazos, junto con la prueba de 40 estudiantes simultáneos de la Fase 3 (5/5).
- No se creó ninguna tabla paralela; el banco usa `question_bank` de la Fase 3 y su RLS sin cambios.

## 5. Regresión E2E frente a la Fase 3

Primera corrida completa de la Fase 4 en Chromium: 277 pasan, 28 fallan y 17 se omiten. Las 28 se repitieron contra el build de la etiqueta `phase3-checkpoint-20261003` (puerto 3201), con la misma configuración y el mismo navegador.

**21 fallan igual en la Fase 3.** No son regresiones de la Fase 4; dependen de este entorno (Chromium 1194 y las fuentes del contenedor) y son tantas como las 21 que la Fase 3 registró en este entorno:

| Spec                          | Pruebas                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `audit-regressions.spec.ts`   | 180 px en `/resources` y `/modules`                                        |
| `lab-result-table.spec.ts`    | 5 grupos de columnas a 390, 360 y 320                                      |
| `media.spec.ts`               | Video resumen al final del recorrido                                       |
| `presentation.spec.ts`        | 30 escenas en 16:9 a 1920, 1366 y 1280; tabla de la escena 4 a 1920 y 1366 |
| `reflow.spec.ts`              | Zoom 200 % (180×400) y laboratorio usable                                  |
| `visual-challenge.spec.ts`    | Diez misiones a 1920, 1366, 390 y 320; dataset por grupos en el móvil      |
| `visual-presentation.spec.ts` | Escenas clave a 1920 y 1366                                                |
| `visual-pages.spec.ts`        | Páginas a 320×568                                                          |

**7 fallaban solo en la Fase 4, todas por cambios esperados del contenido.** Se actualizaron las pruebas:

| Spec                    | Cambio esperado                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home.spec.ts`          | La ruta de secciones muestra las secciones 2 y 3 disponibles                                                                                                                        |
| `learn.spec.ts`         | El temario añade el bloque I «Funciones de una fila»                                                                                                                                |
| `modules.spec.ts`       | Los temas que ya enseña una lección pasan a «Disponible» y enlazan a ella                                                                                                           |
| `search.spec.ts`        | UPPER, ROUND, GROUP BY, JOIN, INSERT, UPDATE y DELETE dejan de ser «Próximamente»; la prueba usa temas aún futuros y otra prueba nueva comprueba que los enseñados abren la lección |
| `sections.spec.ts` (×3) | Las secciones 2 y 3 abren sus seis modos en lugar de «Próximamente»; la Sección 1 tiene 25 lecciones en el temario                                                                  |

Al revisar `sections.spec.ts` apareció una incoherencia real, corregida en el producto: el medidor «Tu avance» de `/sections` contaba 22 lecciones en la Sección 1 y no mostraba avance en las secciones 2 y 3, mientras el panel «Mi progreso» contaba 25. Ahora `/sections` usa los mismos totales que el catálogo de progreso (25, 25 y 28) y lee las lecciones completadas de la fuente curricular. La prueba de la portada de secciones comprueba los tres medidores.

**Pruebas que necesitan Supabase y Oracle.** Esa primera corrida no tenía las variables `E2E_SUPABASE_*` ni las de Oracle, así que omitió las E2E de cuentas (Fase 2), evaluaciones (Fase 3) y Oracle real. Al ejecutarlas con Supabase local y Oracle:

- **Cuentas:** 3 pruebas esperaban 22 lecciones. «Mi progreso» cuenta ahora las lecciones publicadas de las tres secciones (25 + 25 + 28 = 78), y el panel docente, «1 % (1/78 lecciones)». La prueba calcula el total desde el índice curricular en lugar de fijarlo.
- **Evaluaciones:** el monitor no pasaba a «En vivo». La consola del navegador mostró la causa: la CSP solo permitía `connect-src 'self'` y bloqueaba el WebSocket de Supabase Realtime. La CSP se calcula al compilar con `NEXT_PUBLIC_SUPABASE_URL`, y ese build se había hecho sin la variable. No es un defecto del código: con la variable, el manifiesto incluye el origen de Supabase y la prueba pasa. La base de la Fase 3, compilada con la variable, pasaba 7/7. `PRODUCTION_SETUP.md` ya indica que esa variable se fija en el build.

Corrida final completa (build con las variables públicas, Supabase local y Oracle): **302 pasan, 22 fallan y 0 se omiten** (324 pruebas). Las 22 fallan igual en la base de la Fase 3:

- las 21 de la tabla anterior;
- `interactions.spec.ts` «la ayuda se abre con foco…» (página `/dev/design-system`), que no toca la Fase 4. Es intermitente en las dos versiones: 4 de 10 repeticiones fallan en la Fase 4 y 3 de 10 en la Fase 3.

No queda ningún fallo propio de la Fase 4.

## 6. Responsive

- **E2E (`curriculum.spec.ts`):**
  - siete anchos (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844, 320×640) × 7 páginas representativas;
  - las 66 rutas de la Fase 4 a 320×640 (prueba nueva).

  Cada comprobación exige que la página no se desplace en horizontal, que ninguna tabla, bloque de código o región educativa tenga barra horizontal propia, que no haya texto recortado y que ningún texto baje de 12 px.

- **Barrido completo fuera de la E2E:** las 66 rutas (6 páginas de modo por sección, 25 + 28 lecciones y las 3 de la ampliación) en 6 anchos (1920, 1366, 1024, 768, 390 y 320). Comprueba también HTTP 200, un solo `h1` y la consola sin errores.

  La primera pasada encontró **19 problemas en 320, 390 y 768** que la matriz de 7 páginas no cubría. Se corrigieron:

  | Causa                                                                                                                         | Corrección                                                                                                       |
  | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
  | Identificadores largos sin corte (`RAISE_APPLICATION_ERROR`, `NO_DATA_FOUND`, `COUNT(columna)`) en títulos, párrafos y fichas | `overflow-wrap: anywhere` en el texto corrido del currículo; las tablas (DataView) no lo heredan                 |
  | Mapa del dataset en `<pre>` de 500 px                                                                                         | Lista de relaciones derivada de las claves foráneas, que se ajusta al ancho y se lee bien con lector de pantalla |
  | Diccionario de columnas de 4 columnas (desbordaba hasta 119 px)                                                               | Dos columnas: «Columna y tipo Oracle» (con `NOT NULL` o «admite NULL») y «Descripción»                           |
  | Tablas compactas de 3–4 columnas en pliegues y fichas, sin grupos                                                             | En un teléfono pasan a identidad + una columna por pestaña, como las tablas de origen                            |
  | Encabezados largos en tablas compactas a 320 px                                                                               | El umbral que permite partir encabezados (`DEPARTAMENTO`) pasa de 19em a 21em del contenedor                     |

  Pasada final: **396 comprobaciones, 0 problemas.**

- **Clase 16:9:** se midieron las 71 escenas (34 + 37) a 1920×1080, 1440×900 y 1366×768.
  - Antes de corregir había 2 barras horizontales: la etiqueta de una etapa del pipeline (3 px) y el esquema del cursor `OPEN ──▶ FETCH ──▶ … ──▶ CLOSE` (49 px). Ahora la etiqueta parte la palabra y el esquema baja de línea: 0 barras.
  - En la Sección 2, 3 o 4 escenas largas (14, 22, 28 y 33) se desplazan en vertical dentro de la escena, como mucho 41 px a 1366×768. En la Sección 3, una escena (21), como mucho 5 px. Nada queda recortado.
  - Ninguna tabla de la clase pasó a pestañas por estos cambios.
- **Tablas:** siguen siendo tablas (DataView/ColumnTabs), sin barra horizontal.

## 7. Accesibilidad (WCAG 2.2 AA)

- axe con las etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` y `wcag22aa` sin infracciones en 17 páginas (secciones 2 y 3, lecciones con JOIN, GROUP BY, :OLD/:NEW y cursores, práctica, Challenge, recursos, ampliación de la Sección 1, `/learn` y `/modules`) y en la clase de cada sección.
- Defecto encontrado y corregido: los enlaces de «Siguientes pasos» tenían contraste 2,19:1; ahora usan el cian del sistema.
- Las interacciones de la E2E se hacen con roles y nombres accesibles: comprobar una lección, responder una práctica, cumplir una misión, avanzar en la clase y en un recorrido paso a paso.
- **Teclado (prueba nueva):** la clase avanza con flecha derecha, Fin e Inicio; en la práctica, Espacio marca la opción y Enter comprueba; en el recorrido paso a paso, Enter avanza y el foco se queda en el botón. Se añadió después de la corrida completa: pasa en `curriculum.spec.ts` (35/35) y en 3 repeticiones aisladas.
- Los efectos de React Bits se quedan quietos con movimiento reducido, puntero táctil o ahorro de datos (`motion.ts`). Las flechas decorativas de los diagramas tienen texto alternativo vacío.

## 8. Rendimiento

El contenido se renderiza en el servidor y las rutas son estáticas. Al navegador solo llegan los componentes interactivos. JavaScript transferido (comprimido) hasta que la red queda inactiva, prefetch incluido:

| Ruta                                                 | JS     | HTML  |
| ---------------------------------------------------- | ------ | ----- |
| `/` (referencia)                                     | 366 KB | 17 KB |
| `/learn`                                             | 366 KB | 13 KB |
| `/sections/consultas-relacionales/study/inner-join`  | 372 KB | 19 KB |
| `/sections/consultas-relacionales/class`             | 374 KB | 40 KB |
| `/sections/consultas-relacionales/practice`          | 372 KB | 27 KB |
| `/sections/plsql/study`                              | 372 KB | 20 KB |
| `/sections/plsql/class`                              | 374 KB | 39 KB |
| `/sections/plsql/resources`                          | 372 KB | 48 KB |
| `/sections/fundamentos-sql/study/funciones-de-texto` | 360 KB | 18 KB |

Las rutas del currículo añaden como mucho 8 KB de JavaScript sobre la portada. `oracle-results.json`, los bancos y las claves no están en `.next/static`: 0 coincidencias para identificadores de preguntas y de ejemplos del banco, `verifiedAt`, la versión del motor, `nivel:`, `is_correct` y `service_role`. La única aparición de `sb_secret_` es la comprobación de prefijo de la biblioteca `supabase-js`, igual que en la Fase 3; no es una clave.

## 9. Regresión de las Fases 1, 2 y 3

- **Fase 1 (arquitectura visual y secciones):** las E2E de portada, secciones, navegación, buscador, ruta y diseño pasan con los cambios esperados del punto 5.
- **Fase 2 (cuentas, progreso y panel docente):** las E2E de cuentas y las pruebas de RLS en PGlite y Supabase local pasan. El catálogo de progreso incluye las secciones 2 y 3 sin cambiar el formato `ProgressRecord`.
- **Fase 3 (evaluaciones):** las E2E de evaluaciones y las pruebas del motor pasan. El motor no cambió; solo creció el banco oficial (50 → 150). `is_correct` sigue sin llegar al navegador durante un intento.

## 10. No probado

- **Edge y WebKit: NOT TESTED.** No están instalados en este entorno.
- **Oracle 19c y Autonomous Database: NOT TESTED.** Todo se ejecutó en Oracle 23.26.
- **Vista previa: BLOCKED.** No hay sesión de Vercel ni red hacia `vercel.com`.
- **Producción:** no se tocó.
- **Enlaces profundos a docs.oracle.com: NOT TESTED** (el proxy los bloquea).
