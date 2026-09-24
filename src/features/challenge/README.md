# SQL Oracle Challenge

Núcleo de la práctica individual (GAME_SPEC.md, UX_FLOWS.md Flujo E). Todavía
sin pantallas de misión.

```text
domain/
  types.ts               # MissionDefinition, tipos de interacción, respuestas, corrección
  scoring.ts             # política de puntuación y desglose (ScoreBreakdown)
  expression.ts          # expresiones aritméticas de piezas (M05)
  challenge-state.ts     # ChallengeState, MissionState, Attempt, HintUsage y transiciones
  challenge-result.ts    # MissionResult y ChallengeResult
  restore-state.ts       # validación de una partida guardada
  missions/
    public-catalog.ts    # parte pública de M01–M10: apta para el navegador
    rubrics.ts           # PRIVADO: rúbricas, pistas y explicaciones
    definitions.ts       # PRIVADO: MissionDefinition completa y corrección
application/
  ports.ts               # MissionEvaluator, ChallengeRepository, Clock, IdGenerator
  challenge-engine.ts    # iniciar, responder, pista, avanzar, omitir, terminar, reiniciar, restaurar
infrastructure/
  browser-challenge-repository.ts  # único acceso a localStorage
  in-process-mission-evaluator.ts  # corrección con las rúbricas; componer en servidor
  system-clock.ts
```

Aplicación solo importa el catálogo público. Las rúbricas, pistas y
explicaciones se obtienen mediante `MissionEvaluator`; la explicación solo con
la misión cerrada (G15). Una prueba impide que otras capas importen las rúbricas.
