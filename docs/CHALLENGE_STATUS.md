# Estado del SQL Challenge

Actualizado: 24 de septiembre de 2026, Fase 8 (Oracle real y M10), rama `claude-finish-20260923`. Especificación de referencia: [GAME_SPEC.md](GAME_SPEC.md) versión 2.0 (catálogo `select-challenge-v2`), requisitos P09–P13 y P15 de [PROJECT_SPEC.md](PROJECT_SPEC.md), pruebas T09–T13 y G01–G15 de [TEST_PLAN.md](TEST_PLAN.md).

## Conclusión

**M01–M09 están implementadas, son jugables en `/challenge` y tienen pruebas.** Se practican con ratón, arrastre, toque y teclado, sobre el motor, la puntuación, el cronómetro, los intentos, las pistas, el progreso, el feedback y la explicación comunes. **M10 está completa (Fase 8):** estructura y requisitos con el motor compartido y calificación final ejecutando la consulta en Oracle real. Sin Oracle configurado no se simula: el envío es un fallo técnico que no consume intentos.

## Decisión de contenido: Challenge v2

En la Fase 3 el responsable del proyecto redefinió M01–M09 (pedidos en lenguaje natural, SELECT \*, predicción de resultado, columna calculada, alias, DISTINCT sobre una columna, coma ausente y traducción a bloques) y eligió adoptarlas como versión 2. Se actualizaron GAME_SPEC.md y TEST_PLAN.md, y la versión del catálogo pasó a `select-challenge-v2`, de modo que las partidas guardadas con la v1 se descartan.

M08 respeta LAB10: `SELECT nombre salario FROM empleados;` es SQL válido (SALARIO es un alias implícito de NOMBRE). El estudiante localiza el hueco de la coma y el feedback explica que falla el pedido de dos columnas, no la sintaxis.

## Estado por misión

| Misión | Contenido                                     | Interacción                                                                                                  | Estado        | Pruebas                                 |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------------------- |
| M01    | `SELECT nombre, salario FROM empleados;`      | Arrastrar columnas a SELECT; resaltado en la tabla                                                           | DONE          | Unitarias + E2E ×3                      |
| M02    | `SELECT nombre, ciudad FROM empleados;`       | Ordenar piezas                                                                                               | DONE          | Unitarias + E2E ×3                      |
| M03    | `SELECT * FROM empleados;`                    | Construir encabezados y número de filas                                                                      | DONE          | Unitarias + E2E ×3 + axe                |
| M04    | Resultado de `SELECT nombre, salario`         | Construir encabezados y marcar filas en la tabla                                                             | DONE          | Unitarias + E2E ×3                      |
| M05    | `salario * 12`                                | Construir la expresión y predecir valores de Ana, Pedro y María                                              | DONE          | Unitarias + E2E ×3                      |
| M06    | `salario * 12 AS salario_anual`               | Ordenar piezas con vista de encabezados y tabla intacta                                                      | DONE          | Unitarias + E2E ×3 + axe                |
| M07    | `SELECT DISTINCT ciudad`                      | Antes (6 filas) → retirar repeticiones → después (3)                                                         | DONE          | Unitarias + E2E ×3 + axe                |
| M08    | Coma ausente en `SELECT nombre salario`       | Hotspot: huecos seleccionables en el código; corrección con el motor SQL compartido                          | DONE          | Unitarias + E2E ×3 + axe                |
| M09    | «nombre, ciudad y salario de todos» → bloques | Bloques con distractores; motor SQL compartido, corregido por resultado                                      | DONE          | Unitarias + E2E ×3                      |
| M10    | Consulta escrita con cálculo y alias          | Editor CodeMirror; estructura y requisitos con el motor compartido; resultado final ejecutado en Oracle real | DONE (Fase 8) | Unitarias + integración Oracle + E2E ×3 |

«E2E ×3» significa Chromium, Microsoft Edge y WebKit.

## Arquitectura

```text
src/domain/
  dataset/empleados.ts          # fuente única de empleados-select-v1
  results/result-table.ts       # proyección, DISTINCT, comparación por multiconjunto
  sql/                          # motor SQL educativo único (Fase 4): léxico, parser, analizador,
                                # evaluador, traductor, anatomía y sentencia canónica
src/features/challenge/
  domain/                       # tipos, catálogo público v2, rúbricas privadas, puntuación, estado
  application/
    challenge-engine.ts         # motor de partida
    challenge-api.ts            # superficie pública para presentación
    ports.ts
  infrastructure/               # localStorage, evaluador en proceso, reloj
  presentation/
    challenge-experience.tsx    # introducción, mapa, misión, resumen
    mission-view.tsx            # marco común: pedido, cronómetro, intentos, pista, feedback, explicación
    mission-map.tsx, challenge-summary.tsx, source-table.tsx
    interactions/               # una interacción por tipo; ninguna contiene reglas de corrección
src/presentation/components/interaction/sequence-builder.tsx   # dnd-kit reutilizable
src/composition/challenge/
  actions.ts                    # Server Functions: corrección, pista y explicación
  challenge-root.tsx            # une motor, localStorage y Server Functions
```

- **Un solo motor SQL (Fase 4).** Las misiones que construyen consultas (M01, M02, M06, M08, M09 y M10), la expresión de M05 y el laboratorio usan el mismo léxico, parser y analizador de `src/domain/sql`. Las piezas se unen en texto, se analizan a un árbol sintáctico y se corrigen por su resultado lógico sobre el dataset: se aceptan construcciones equivalentes (comas intercambiables, `12 * salario`) y el feedback reutiliza los diagnósticos pedagógicos del laboratorio, como la coma ausente leída como alias implícito (LAB10). Es una comparación didáctica en memoria; no se presenta como ejecución en Oracle.
- **G15 comprobado.** Rúbricas, pistas y explicaciones solo se ejecutan en el servidor, mediante Server Functions en `src/composition`. Una prueba E2E revisa los scripts que recibe el navegador, y se verificó que el build de producción no contiene esos textos en `.next/static`, mientras que sí están en `.next/server`.
- **Composición.** Se añadió la capa `composition` a la regla ESLint de capas: es el único lugar que une infraestructura con aplicación, y solo `app` puede importarla. Presentación sigue sin poder importar dominio ni infraestructura.
- **Arrastre accesible (dnd-kit 6.3.1, sortable 10.0.0, utilities 3.2.2).** `SequenceBuilder` admite arrastre con ratón (`MouseSensor`) y con dedo (`TouchSensor`). Como alternativa sin arrastre, se puede pulsar o activar con Enter una pieza para añadirla, y seleccionar una pieza colocada para moverla o quitarla con botones. El teclado usa esos controles explícitos en lugar del `KeyboardSensor` de dnd-kit, porque hay que evitar el conflicto entre la tecla Espacio y los botones y dar una alternativa de puntero simple (WCAG 2.5.7). Los cambios se anuncian en una región `aria-live`.
- **Cronómetro informativo.** Se pausa al cambiar de misión, al cerrarla y al ocultar o abandonar la pestaña (`visibilitychange` y `pagehide`).
- **Pantalla final.** Muestra puntuación, precisión, tiempo activo, intentos, pistas, misiones resueltas, resumen por misión, conceptos para repasar y el botón «Reiniciar práctica» con confirmación.

## M10 y Oracle (Fase 4)

- La rúbrica aplica las capas 1 y 2 de LAB_SPEC con el motor compartido: estructura del subconjunto, tres columnas, cálculo sobre SALARIO, `AS` explícito y encabezado PROYECCION_ANUAL.
- Un error de SQL o un requisito incumplido es un intento académico y lo consume, como exige GAME_SPEC.
- Si todo se cumple, la rúbrica devuelve `requires-execution` con la **sentencia canónica** reconstruida desde el árbol. El evaluador la envía al puerto `OracleQueryExecutor`:
  - Hoy el adaptador `UnconfiguredOracleExecutor` responde «no configurado», así que el resultado es técnico y no consume intento.
  - Con un Oracle real, `gradeExecution` compararía la salida con la referencia. Está probado con un doble de Oracle, e incluye el caso de error ORA.
- El botón «Revisar sintaxis (sin puntuar)» usa el mismo motor sin gastar intentos.
- CodeMirror se carga bajo demanda al abrir M10, así que no pesa en la carga inicial de `/challenge`.

## M10 con Oracle real (Fase 8)

Flujo: parser → validación de requisitos → sentencia canónica → Oracle real → salida → comparación con la referencia → puntuación. No se compara la cadena: se aceptan `12 * (100000 + salario)` y `salario * 12 + 1200000`, con otra caja, espacios o comentarios, porque Oracle devuelve la misma salida. Un cálculo distinto (`salario * 12 + 100000`) es un intento académico incorrecto por los valores que devuelve Oracle. Verificado contra Oracle Database 23ai Free en `tests/integration/oracle-real.test.ts` y en E2E en Chromium, Edge y WebKit. La práctica individual y la sala en vivo usan el mismo adaptador.

## Puntuación

Sin cambios respecto a la Fase 2: `100 − 20 × (intento − 1) − 20 × pistas`, con un máximo de 1000. La bonificación por tiempo sigue en 0, como exige GAME_SPEC; activarla está pendiente de la decisión del responsable del proyecto.

## Defectos encontrados y corregidos en la fase

- **Desbordamiento horizontal en WebKit móvil:** el texto oculto de las columnas resaltadas del `DataTable` base tenía posición absoluta y escapaba del contenedor con scroll. Se corrigió con `position: relative` en `.ds-table-scroll`.
- **Axe:** un `aria-label` sobre un `span` del cronómetro (atributo prohibido) se sustituyó por texto oculto real.
- **Pruebas de arrastre intermitentes en WebKit con la suite completa:** el helper medía posiciones que el auto-scroll de dnd-kit desplazaba cerca del borde. Ahora centra el recorrido y espera a que cada pieza quede colocada.

## Observación abierta

En una de tres ejecuciones completas de la suite, una llamada a la Server Function de M06 en WebKit sobre `next dev` falló. La aplicación reaccionó como debe: mostró «Servicio no disponible» y no consumió intento. No se reprodujo en las dos ejecuciones completas siguientes, con 126 llamadas POST que devolvieron HTTP 200 y una latencia máxima de 98 ms, ni en 20 repeticiones de M04–M07 en WebKit. Se atribuye provisionalmente a la compilación bajo demanda del servidor de desarrollo. Hay que vigilarlo en las próximas ejecuciones.

## Pendiente

1. ~~Calificación final de M10 con Oracle real~~ (Fase 8). Para los estudiantes falta una instancia Oracle compartida en el despliegue.
2. `/results` todavía no muestra el resultado local (el resumen está dentro de `/challenge`).
3. Prueba de arrastre táctil real en dispositivo físico: en la automatización se verifica el toque sin arrastre; el arrastre táctil con `TouchSensor` no se simula.
4. Revisión con lector de pantalla y dispositivos físicos.
