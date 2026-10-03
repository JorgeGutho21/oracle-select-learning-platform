# Auditoría del traspaso de Codex — Fase 5

Fecha: 23 de septiembre de 2026. Rama `claude-finish-20260923`.

## Punto de recuperación

Codex agotó su cuota durante la Fase 5 y dejó cambios sin commit. Antes de tocarlos se guardó su estado exacto, sin modificaciones, en el commit `8932edb` («checkpoint: preserve partial codex phase 5 work»), subido a `origin/claude-finish-20260923`. Ese commit es un punto de recuperación, no una aprobación del código.

Alcance real del traspaso: **39 archivos** (14 modificados y 25 nuevos; 4164 líneas añadidas y 190 eliminadas), no 13. No incluía secretos, credenciales ni archivos `.env`. El único binario es el logotipo PNG, de 29 KB.

Codex no actualizó `CONTINUITY.md` ni los documentos de estado, y no escribió pruebas E2E para lo que añadió.

## Estado de Codex al recibirlo

| Verificación           | Resultado                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run lint`         | Correcto.                                                                                                |
| `npm run typecheck`    | Correcto.                                                                                                |
| `npm run test:unit`    | Correcto: 15 archivos, 272 pruebas.                                                                      |
| `npm run format:check` | **Falla:** 12 archivos sin formatear.                                                                    |
| `npm run build`        | **Falla:** `globals.scss` importaba `study` dos veces («There's already a module with namespace study»). |

## Qué construyó Codex

- **Home (P01):** portada nueva con demostración interactiva de selección de columnas (vista educativa del motor SQL compartido), identidad académica con logotipo, progreso de estudio, accesos, franja del vídeo introductorio «en preparación» y catálogo de temas futuros.
- **Modo Estudio (P03):** lecciones L00–L08 en `/learn` y `/learn/{lección}` (rutas estáticas), con contenido alineado con CONTENT_MAP, una comprobación por lección y progreso local versionado. Visitar no completa (U02).
- **Modo Exposición (P02):** diapositivas en `/presentation?scene=N`, con flechas, selector, pantalla completa y enlaces al laboratorio.
- **Buscador global (P04):** paleta con Ctrl/Cmd+K, búsqueda sin tildes ni mayúsculas, temas futuros como «Próximamente» y navegación derivada del mismo catálogo público.
- **Recursos (P18, parcial):** chuleta por concepto con «Abrir en laboratorio», vídeos «en preparación» y fuentes.
- **Laboratorio:** borrador local y traspaso desde lección o escena con `?sql=` y `returnTo`, con lista blanca de destinos y confirmación antes de sustituir un borrador (UX_FLOWS, Flujo A, paso 5).
- **Identidad:** `src/application/academic-identity.ts` como única fuente de los nombres y `public/identity/` con el logotipo y su procedencia.

## Clasificación por archivo

### KEEP — se conserva sin cambios de contenido

| Archivo                                                                                                            | Justificación                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/identity/universidad-popular-del-cesar.png`                                                                | Logotipo institucional verificado (sección «Logotipo»).                                                                                                                                           |
| `src/app/learn/[slug]/page.tsx`                                                                                    | Nueve rutas estáticas de lecciones con `notFound` para rutas inexistentes.                                                                                                                        |
| `src/app/learn/page.tsx`, `src/app/page.tsx`                                                                       | Solo componen raíces; respetan las capas.                                                                                                                                                         |
| `src/composition/study/study-root.tsx`, `study-progress-root.tsx`                                                  | Composición correcta: unen el adaptador de almacenamiento con la presentación.                                                                                                                    |
| `src/composition/lab/lab-root.tsx`\*                                                                               | Composición del borrador del laboratorio.                                                                                                                                                         |
| `src/features/laboratory/application/lab-draft.ts`\*                                                               | Puerto del borrador. `safeLabReturn` solo admite rutas internas conocidas (bloquea `//`, `javascript:` y dominios externos); el SQL recibido se limita a 4000 caracteres y nunca se ejecuta solo. |
| `src/features/laboratory/infrastructure/browser-lab-draft.ts`                                                      | Adaptador de `localStorage`; los fallos los captura el llamador.                                                                                                                                  |
| `src/features/study/application/study-api.ts`                                                                      | L00–L08 según CONTENT_MAP. Resultados derivados del motor SQL compartido y del dataset único; ningún dato duplicado.                                                                              |
| `src/features/study/application/progress.ts`                                                                       | Puerto de progreso con versión de lanzamiento.                                                                                                                                                    |
| `src/features/study/infrastructure/browser-study-progress.ts`                                                      | Tolera almacenamiento ausente, bloqueado o ilegible.                                                                                                                                              |
| `src/features/study/presentation/learn-page.tsx`                                                                   | Lecciones, actividades, progreso y reinicio con confirmación (UX_FLOWS, Flujo B). Tiene mejoras pendientes, listadas abajo.                                                                       |
| `src/features/search/application/search-index.ts`                                                                  | Normalización sin tildes y ranking; los temas futuros no tienen destino.                                                                                                                          |
| `src/features/search/presentation/search-palette.tsx`                                                              | Atajo, flechas, Escape y foco en el destino (UX_FLOWS, Flujo C).                                                                                                                                  |
| `src/features/presentation/presentation/presentation-page.tsx`                                                     | Solo compone la presentación.                                                                                                                                                                     |
| `src/features/resources/presentation/resources-page.tsx`\*                                                         | Chuleta y recursos honestos: vídeos «en preparación», sin simulaciones.                                                                                                                           |
| `src/presentation/layouts/site-header.tsx`                                                                         | Integra el buscador. El enlace al sistema de diseño sigue en el pie.                                                                                                                              |
| `src/presentation/layouts/site-footer.tsx`\*                                                                       | Identidad completa desde la fuente única.                                                                                                                                                         |
| `src/presentation/navigation/routes.ts`                                                                            | Navegación derivada del catálogo público.                                                                                                                                                         |
| `src/presentation/pages/home-demonstration.tsx`\*                                                                  | Demostración con el motor compartido, rotulada «Vista educativa».                                                                                                                                 |
| `src/styles/_shell.scss`, `_search.scss`, `_study.scss`, `_presentation.scss`, `_home.scss`\*, `_resources.scss`\* | Estilos con los tokens del sistema de diseño. La revisión visual está pendiente.                                                                                                                  |
| `tests/unit/lab-draft.test.ts`\*, `tests/unit/study/study.test.ts`\*                                               | Pruebas de retorno seguro, progreso y comprobaciones.                                                                                                                                             |

\* Solo se aplicó el formato de Prettier.

### KEEP_AND_FIX — corregido en esta auditoría

| Archivo                                                                      | Problema                                                                                                                                                                                                                                                                                                                                                                     | Corrección                                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/styles/globals.scss`                                                    | `@use 'study'` duplicado: el build fallaba.                                                                                                                                                                                                                                                                                                                                  | Se eliminó el duplicado.                                                                        |
| `src/application/academic-identity.ts`                                       | «Jorge Gutiérrez Thomas» y «Amílcar Sierra»; el campo `subject` podía confundirse con la asignatura.                                                                                                                                                                                                                                                                         | Nombres exactos; `subject` pasa a `unitTitle`, documentado como tema de la unidad.              |
| `public/identity/README.md`                                                  | Nombres incorrectos.                                                                                                                                                                                                                                                                                                                                                         | Normalizados.                                                                                   |
| `src/features/search/domain/public-catalog.ts` + `tests/unit/search.test.ts` | La navegación usaba «Aprender», «Presentación» y «En vivo», distintas de la especificación y del propio Home («Modo Estudio», «Modo Exposición»).                                                                                                                                                                                                                            | Etiquetas «Estudio», «Exposición» y «Sala en vivo»; títulos «Modo Estudio» y «Modo Exposición». |
| `src/presentation/pages/home-page.tsx`                                       | Rótulo en inglés («ORACLE DATABASE · SQL FUNDAMENTALS»), contra AGENTS.md; sin formato.                                                                                                                                                                                                                                                                                      | «ORACLE SQL · FUNDAMENTOS DE SELECT»; formato aplicado.                                         |
| `src/features/presentation/presentation/presentation-deck.tsx`               | El rechazo de la pantalla completa quedaba como promesa sin gestionar (UX_FLOWS pide seguir en la ventana).                                                                                                                                                                                                                                                                  | Rechazo capturado; usa `unitTitle`.                                                             |
| `src/features/laboratory/presentation/lab-workspace.tsx`                     | Carrera detectada por la E2E de LAB10 en WebKit: el selector de ejemplos seguía activo mientras se leía el borrador guardado, y esa lectura sobrescribía el ejemplo elegido. Botones y editor ya esperaban a `draftReady`; el selector no. El resto (borrador, confirmación de sustitución, retorno a la lección o escena y separación entre análisis y Oracle) se conserva. | El selector se deshabilita hasta leer el borrador; formato aplicado.                            |
| `tests/e2e/challenge-helpers.ts` (no es de Codex)                            | `fillEditor` podía escribir mientras el editor estaba en solo lectura durante la lectura del borrador.                                                                                                                                                                                                                                                                       | Espera a que el editor sea editable.                                                            |

### KEEP_AND_FIX — pendiente para la continuación de la Fase 5

| Archivo                                                                  | Problema                                                                                                                                                                                                                                                         | Acción propuesta                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `presentation-deck.tsx`, `src/app/presentation/page.tsx`, `lab-draft.ts` | 16 escenas propias en lugar de E01–E14 (P02, CONTENT_MAP): falta E02 (vídeo introductorio) y cambian el orden y el contenido de E11–E14. No ofrece reanudar la última escena local (UX_FLOWS). Toda la escena va en `aria-live`, lo que produce anuncios largos. | Reestructurar a E01–E14 conservando el contenido útil, ajustar el límite de `scene` y la lista blanca de retorno, añadir la reanudación local y limitar los anuncios al contador. |
| `learn-page.tsx`                                                         | La validación del progreso restaurado no comprueba los identificadores de lección; `visit` guarda dentro de un actualizador de estado; la lógica de progreso está en presentación.                                                                               | Mover la validación a aplicación, validar identificadores y versiones y sacar el guardado del actualizador.                                                                       |
| Todo lo nuevo                                                            | Sin E2E para Home, Estudio, Exposición, Buscador, Recursos ni traspaso al laboratorio.                                                                                                                                                                           | Añadir E2E: T01, T02, T03, T04, U01, U02, U03, T18, más accesibilidad y responsive.                                                                                               |

### REVERT

Ninguno. Ningún cambio de Codex es incorrecto en su conjunto ni contradice AGENTS.md hasta el punto de descartarlo. Los defectos encontrados se corrigen o se registran arriba.

## Identidad académica

Identidad exacta confirmada por el responsable: autor **Jorge Gutierrez Thomas**; profesor **Amilkar Sierra**; asignatura **Base de Datos**; programa **Ingeniería de Sistemas**; **Universidad Popular del Cesar**.

- **Código:** `src/application/academic-identity.ts` es la única fuente. Home, pie y Exposición la leen de ahí y no quedan nombres escritos a mano en `src` ni en `tests`.
- **Documentación normalizada:** `README.md` (autor, profesor, asignatura, programa e institución), `CONTINUITY.md`, `docs/PROJECT_SPEC.md` (registra la confirmación y que prevalece sobre las variantes de las fuentes), `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md` y `public/identity/README.md`.
- **Comprobación:** búsqueda literal sin resultados para «Gutiérrez Thomas», «Jorge Gutiérrez», «Amilcar» y «Bases de Datos». «Amílcar» y «Amílkar» solo aparecen en la nota de PROJECT_SPEC que las declara sustituidas.
- **No se modificó:** la ruta de carpeta `Presentacion_SELECT_JorgeGutierrez` citada en CONTINUITY (dato técnico), el autor de Git, las dependencias ni el empleado «Jorge» del dataset.

## Logotipo

| Aspecto    | Resultado                                                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuente     | `https://adaggio.unicesar.edu.co/LOGO-MENU-unicesar.png`, en un subdominio del dominio oficial `unicesar.edu.co`. Se consultó la página institucional: su navegación usa `/LOGO-MENU-unicesar.png` con el texto alternativo «Logo Unicesar». |
| Archivo    | `public/identity/universidad-popular-del-cesar.png`; SHA-256 `B91DCB4C…A78A7D16`, idéntico al registrado por Codex.                                                                                                                          |
| Formato    | PNG válido, RGBA de 8 bits, sin metadatos de edición (solo IHDR, pHYs, IDAT e IEND).                                                                                                                                                         |
| Proporción | 805 × 417 (1,93:1). Se muestra con `width: 150px; height: auto`, sin deformación, recoloreado ni filtros.                                                                                                                                    |
| Uso        | Home, con texto alternativo «Universidad Popular del Cesar». El README aclara que identifica el material académico y que no presenta la plataforma como servicio oficial.                                                                    |
| Calidad    | Suficiente para 150 px de ancho y pantallas de alta densidad.                                                                                                                                                                                |

Decisión: **se conserva**. Límites de la verificación: no se volvió a descargar el archivo remoto para comparar la huella (habría sido una descarga no autorizada), y no se verificó el permiso de uso de la marca con la universidad. El sitio ofrece también una variante sin fondo (`/Logo-UniCesar-sinfondo.png`) que podría encajar mejor sobre superficies claras; no se descargó.

## Estado tras la auditoría

| Verificación           | Resultado                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run lint`         | Correcto, 0 advertencias.                                                                                                                                          |
| `npm run typecheck`    | Correcto.                                                                                                                                                          |
| `npm run format:check` | Correcto.                                                                                                                                                          |
| `npm run test:unit`    | Correcto: 15 archivos, 272 pruebas.                                                                                                                                |
| `npm run build`        | Correcto; nueve lecciones generadas de forma estática. `/lab` y `/presentation` pasan a dinámicas por sus parámetros de URL. Sin rúbricas en `.next/static` (G15). |
| `npm run test:e2e`     | 143 de 144 en la suite completa (Chromium, Edge y WebKit). El único fallo, M08 en Edge por tiempo de espera, pasa 3 de 3 en aislado. Detalle en la sección E2E.    |

## E2E

Las pruebas E2E existentes (Challenge, laboratorio y sistema de diseño) se ejecutaron contra el código de Codex ya corregido. No cubren los módulos nuevos de Codex.

| Ejecución                               | Resultado                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suite completa, primera                 | 141 de 144. **Un error real:** en WebKit (LAB10), la carga del borrador guardado sustituía el ejemplo que se acababa de elegir. Otros dos fallos en Edge (M02 y pista), por tiempo de espera: las piezas seguían deshabilitadas porque la acción de servidor tardaba más de 5 s con el servidor de desarrollo cargado. |
| Corrección                              | El selector de ejemplos queda deshabilitado hasta leer el borrador, y `fillEditor` espera a que el editor sea editable.                                                                                                                                                                                                |
| Laboratorio en WebKit, repetido 3 veces | 18 de 18.                                                                                                                                                                                                                                                                                                              |
| Las dos pruebas de Edge, 3 veces        | 6 de 6.                                                                                                                                                                                                                                                                                                                |
| Suite completa, segunda (12,4 min)      | 143 de 144. Falla M08 en Edge por tiempo de espera: los huecos siguen deshabilitados mientras la acción de servidor responde.                                                                                                                                                                                          |
| M08 en Edge, repetida 3 veces           | 3 de 3.                                                                                                                                                                                                                                                                                                                |

Conclusión: el error real se corrigió. Los fallos restantes de Edge son esperas de la acción de servidor bajo `next dev`, no regresiones de lógica, pero no se dan por resueltos. La suite pasó de 9,3 min a entre 12 y 14 min porque `next dev` compila bajo demanda las rutas nuevas. Recomendación: ejecutar las E2E contra el build de producción (`next start`) en lugar de ampliar los tiempos globales.

## Riesgos

- **Especificación de Exposición:** las 16 escenas no son E01–E14; P02 y T02 no pueden darse por cumplidos todavía.
- **Sin cobertura E2E** para Home, Estudio, Exposición, Buscador y Recursos. Las pruebas unitarias no acreditan accesibilidad ni responsive.
- **E2E inestable en Edge bajo `next dev`:** con la suite completa, alguna acción de servidor supera la espera de 5 s (1 fallo de 144 en la última ejecución). Ver la sección E2E.
- **Permiso de uso del logotipo** no confirmado con la universidad antes de una publicación abierta.
- **El Home incluye el motor SQL en su paquete de cliente** por la demostración. Es correcto, pero más pesado que una portada estática.
- **Vídeos V01 y V02, Oracle real (R1), salas y Supabase** siguen pendientes y así se declaran en la interfaz.

## Qué falta de la Fase 5

1. Reestructurar la Exposición a E01–E14, con reanudación local y anuncios accesibles acotados (P02, T02, U01).
2. Cerrar Estudio: validación del progreso en aplicación, avisos de contenido actualizado y almacenamiento bloqueado, y E2E de T03 y U02.
3. Buscador: E2E de T04 y U03 (Ctrl+K con foco en el editor, Escape, retorno del foco, «WHERE» como ficha futura).
4. Explicaciones visuales y tablas interactivas por lección (P06 y P07) verificadas con T06 y T07.
5. Recursos: chuleta imprimible con estilos de impresión (P18, T18) y catálogo de módulos futuros.
6. Resultados locales del Challenge en `/results`.
7. QA visual y de accesibilidad en móvil, escritorio y proyección de todas las pantallas nuevas.
8. Actualizar `docs/PROJECT_STATUS.md` y `docs/CHALLENGE_STATUS.md` al cerrar la fase.

## Seguimiento en la Fase 5

Resuelto el 24 de septiembre de 2026, en la misma rama:

| Pendiente de la auditoría                    | Resolución                                                                                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exposición con 16 escenas en vez de E01–E14  | El responsable fijó un guion de dieciséis escenas que coincide con el de Codex; CONTENT_MAP pasa a la versión 1.1. El marco se rehízo como lienzo 16:9 escalable, con reanudación local y anuncio acotado. |
| `presentation-page.tsx`                      | Sustituido por la raíz de composición `src/composition/presentation`, que une la memoria de escena (infraestructura) con la presentación.                                                                  |
| Validación y efectos del progreso de Estudio | La validación pasa a `features/study/application/progress.ts`; el guardado deja de hacerse dentro de un actualizador de estado.                                                                            |
| Sin E2E para los módulos nuevos              | Nuevas E2E de Home, Estudio, Exposición, buscador, navegación y responsive en Chromium, Edge y WebKit.                                                                                                     |
| Rótulo en inglés de la portada               | La auditoría lo había traducido; el responsable pidió expresamente «ORACLE DATABASE · SQL FUNDAMENTALS» y se restituyó.                                                                                    |
| Etiquetas de navegación                      | Por decisión del responsable: Inicio, Aprender, Laboratorio, Challenge, En vivo, Recursos y Buscar.                                                                                                        |

Errores de Codex encontrados al probar y corregidos: el `listbox` del buscador contenía encabezados `h3` (ARIA inválido, detectado por axe); palabras de una o dos letras de otras fichas («e», «de») hacían coincidir cualquier término que empezara por esa letra; el elemento activo con flechas no coincidía con el orden visible por grupos.
