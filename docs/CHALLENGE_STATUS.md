# Estado del SQL Challenge

Actualizado: 23 de septiembre de 2026, Fase 2 (núcleo del Challenge), rama `claude-finish-20260923`. Especificación de referencia: [GAME_SPEC.md](GAME_SPEC.md), requisitos P09–P13 y P15 de [PROJECT_SPEC.md](PROJECT_SPEC.md), pruebas T09–T13 y G01–G15 de [TEST_PLAN.md](TEST_PLAN.md).

## Conclusión

**El dominio y el motor de partida están implementados y probados; las pantallas de misión no.** La ruta `/challenge` sigue mostrando su estado vacío. Existen la definición tipada de las diez misiones, sus rúbricas, la puntuación, el estado de partida, el motor de práctica individual y la persistencia local. No hay todavía interfaz, arrastre (dnd-kit), editor (CodeMirror), analizador SQL ni Oracle.

## Arquitectura implementada

```text
src/domain/
  dataset/empleados.ts             # fuente única de empleados-select-v1
  results/result-table.ts          # proyección, DISTINCT y comparación por multiconjunto
src/features/challenge/
  domain/
    types.ts                       # MissionDefinition, PublicMission, 9 tipos, respuestas, EvaluationOutcome
    scoring.ts                     # ScoringPolicy, ScoreBreakdown, precisión y progreso
    expression.ts                  # expresiones aritméticas de piezas (M05)
    challenge-state.ts             # ChallengeState, MissionState, Attempt, HintUsage y transiciones
    challenge-result.ts            # MissionResult y ChallengeResult
    restore-state.ts               # validación de la partida guardada
    missions/public-catalog.ts     # parte pública de M01–M10
    missions/rubrics.ts            # PRIVADO: rúbricas, pistas y explicaciones
    missions/definitions.ts        # PRIVADO: MissionDefinition completa y corrección
  application/
    ports.ts                       # MissionEvaluator, ChallengeRepository, Clock, IdGenerator
    challenge-engine.ts            # motor de partida
  infrastructure/
    browser-challenge-repository.ts
    in-process-mission-evaluator.ts
    system-clock.ts
```

Decisiones:

- **Separación pública/privada (G15).** `PublicMission` contiene id, versión, orden, título, descripción, dificultad, tipo de interacción, objetivo, lecciones, instrucciones, puntuación máxima, duración base y `publicData`. `MissionDefinition` añade `hint`, `explanation` y `rubric`. Aplicación solo importa el catálogo público; pistas, explicaciones y corrección llegan por el puerto `MissionEvaluator`. La explicación solo se entrega con la misión cerrada. Una prueba falla si otra capa importa las rúbricas.
- **Piezas mezcladas.** El catálogo público presenta las piezas en un orden fijo que no es el de la solución.
- **Una sola fuente de datos.** Todos los resultados esperados se derivan de `EMPLEADOS_DATASET`; una prueba comprueba que los registros solo se definen en ese módulo.
- **Tipos de interacción.** `drag-column`, `reorder-sql`, `predict-result`, `expression-builder`, `alias-builder`, `distinct-result`, `hotspot-error`, `build-query` y `write-query`, cada uno con sus datos públicos y su forma de respuesta discriminada.
- **Corrección.** `correct` e `incorrect` consumen intento. `invalid-input` (respuesta vacía o de otro tipo) y `technical` (servicio caído, Oracle no disponible) no lo consumen.
- **Motor.** `ChallengeEngine` ofrece `start`, `submit`, `requestHint`, `openMission`, `advance`, `skip`, `pause`/`resume`, `finish`, `reset`, `restore`, `getResult`, `getExplanation` y `subscribe` (compatible con `useSyncExternalStore`). Admite una sola corrección pendiente y descarta correcciones que llegan después de reiniciar.
- **Persistencia.** Solo `BrowserChallengeRepository` accede a `localStorage`, bajo la clave `sql-select-lab:challenge:practice`. Nunca lanza: si el almacenamiento falta, está bloqueado o lleno, la partida sigue en memoria y se informa `unavailable`. Al restaurar, el dominio valida la partida y descarta datos corruptos o de otra versión (esquema, Challenge, dataset o política). El cronómetro queda en pausa con el tiempo acumulado hasta el último guardado.
- **Cronómetro.** Es informativo: cuenta el tiempo activo por misión, se pausa al cambiar de misión, al cerrarla o al llamar a `pause()`, y no afecta a los puntos.

## Puntuación y bonificación por tiempo

La fórmula normativa se aplica solo al primer acierto: `100 − 20 × (intento − 1) − 20 × pistas`, con un máximo de 1000.

La Fase 2 pidió un «bonus por tiempo», pero GAME_SPEC dice «No hay bonificación por rapidez» y tiene precedencia sobre la puntuación (AGENTS.md). Se implementó el componente `timeBonus` dentro de `ScoringPolicy`. La política vigente, `GAME_SPEC_SCORING_POLICY`, fija `maxTimeBonus: 0`, así que la bonificación siempre vale cero. Una política alternativa con bonificación existe solo en pruebas. **Activarla requiere decidirlo, actualizar GAME_SPEC.md y TEST_PLAN.md y crear una versión nueva de la política**; las partidas guardadas con otra versión se descartan.

## Estado por misión

| Misión | Tipo                 | Dominio y rúbrica                                                                                | Interfaz | Estado  |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------- |
| M01    | `drag-column`        | DONE: G01 mediante comparación de resultados.                                                    | MISSING  | PARTIAL |
| M02    | `reorder-sql`        | DONE: G02, terminador opcional.                                                                  | MISSING  | PARTIAL |
| M03    | `predict-result`     | DONE: G03, encabezados y conteo derivados del esquema.                                           | MISSING  | PARTIAL |
| M04    | `predict-result`     | DONE: G04, multiconjunto con feedback sobre DISTINCT.                                            | MISSING  | PARTIAL |
| M05    | `expression-builder` | DONE: G05, equivalencia evaluada sobre las seis filas; exige SALARIO.                            | MISSING  | PARTIAL |
| M06    | `alias-builder`      | DONE: G06, posición del alias y encabezado etiquetado.                                           | MISSING  | PARTIAL |
| M07    | `distinct-result`    | DONE: G07, cinco pares derivados del dataset.                                                    | MISSING  | PARTIAL |
| M08    | `hotspot-error`      | PARTIAL: localización y reparación como secuencia de tokens.                                     | MISSING  | PARTIAL |
| M09    | `build-query`        | DONE: G09, DISTINCT, alias y predicción 5.                                                       | MISSING  | PARTIAL |
| M10    | `write-query`        | PARTIAL: rechaza el editor vacío; sin Oracle devuelve `oracle-unavailable` sin consumir intento. | MISSING  | PARTIAL |

Limitaciones reconocidas:

- **M08:** la reparación se valida como secuencia de tokens normalizada, aceptando la expresión conmutada `12 * salario`. La edición libre con equivalencias generales necesita el analizador del subconjunto SELECT v1 (LAB_SPEC), pendiente.
- **M10:** no se simula la corrección. G10 exige ejecutar en Oracle real (R1, pendiente).

## Subsistemas

| Subsistema                             | Estado  | Nota                                                                                                                  |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `MissionDefinition` y catálogo de diez | DONE    | Versión `select-challenge-v1`; suma 1000 puntos y 900 s base.                                                         |
| Dataset único                          | DONE    | Inmutable en profundidad, con huella FNV-1a.                                                                          |
| Comparador de resultados               | DONE    | Orden de columnas, multiconjunto de filas y tildes conservadas.                                                       |
| Evaluador de expresiones de piezas     | DONE    | Precedencia, paréntesis, división entre cero y columnas no numéricas.                                                 |
| Puntuación, precisión y progreso       | DONE    | G11 y G12. `timeBonus` a cero por la política normativa.                                                              |
| Intentos, pistas, omisión y cierre     | DONE    | Dos intentos puntuados, pista idempotente, práctica sin puntos tras cerrar.                                           |
| Cronómetro individual                  | DONE    | Tiempo activo con pausas; solo informativo.                                                                           |
| Motor de partida                       | DONE    | Iniciar, responder, pista, avanzar, omitir, terminar, reiniciar y restaurar.                                          |
| Persistencia local                     | DONE    | Adaptador de infraestructura, con tolerancia a fallos y validación al restaurar.                                      |
| Composición en servidor                | MISSING | Las reglas de capas impiden que `app` y presentación importen infraestructura; falta decidir el punto de composición. |
| Pantallas, mapa y feedback visual      | MISSING | Fase posterior.                                                                                                       |
| Arrastre accesible (dnd-kit)           | MISSING | P10 y G14.                                                                                                            |
| Editor SQL (CodeMirror)                | MISSING | No instalado, por indicación de la Fase 2.                                                                            |
| Analizador SELECT v1                   | MISSING | Necesario para M08 completo, M10 y el laboratorio.                                                                    |
| Resultados en `/results`               | MISSING | `ChallengeResult` ya está disponible para mostrarlo.                                                                  |
| Pruebas E2E T09–T13                    | MISSING | No hay interfaz que recorrer.                                                                                         |

## Pruebas

Seis archivos en `tests/unit/challenge`, 121 pruebas:

- `dataset-and-results.test.ts`: dataset, inmutabilidad, huella y casos S02–S04 y S09.
- `scoring-and-expression.test.ts`: G11, G12, bonificación con política alternativa, precisión, progreso y casos S07–S08.
- `missions.test.ts`: catálogo, G15 (sin datos privados ni orden de solución), C03 y G01–G10, con casos correctos, incorrectos pedagógicos, incompletos y vacíos.
- `challenge-state.test.ts`: transiciones, U05, intentos, pistas, errores técnicos, omisión, fin de partida, inmutabilidad y resultados combinados.
- `challenge-engine.test.ts`: motor con dobles, concurrencia, reinicio durante la corrección, restauración tras recarga (U07), almacenamiento ausente y datos corruptos.
- `persistence.test.ts`: restauración validada, repositorio local y reglas de aislamiento de rúbricas, `localStorage` y dataset.

## Orden recomendado para continuar

1. Decidir el punto de composición en servidor para la corrección (G15) sin romper las reglas de capas.
2. Instalar y fijar dnd-kit. Construir el mapa, el marco de misión y la interacción de piezas accesible para M01, M02, M06 y M09 (T10).
3. Constructores de resultado para M03, M04 y M07 (T11) y de expresión para M05.
4. Analizador del subconjunto SELECT v1 y CodeMirror para M08 completo (T12).
5. M10 con Oracle real cuando R1 esté disponible (T13).
6. Resultados locales en `/results` y E2E T09 completo.
