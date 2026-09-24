# SQL Oracle Challenge

Práctica individual de diez misiones (GAME_SPEC.md 2.0, UX_FLOWS.md Flujo E),
jugable en `/challenge`. M10 queda bloqueada hasta disponer de Oracle real.

```text
domain/
  types.ts               # MissionDefinition, tipos de interacción, respuestas, corrección
  scoring.ts             # política de puntuación y desglose (ScoreBreakdown)
  challenge-state.ts     # ChallengeState, MissionState, Attempt, HintUsage y transiciones
  challenge-result.ts    # MissionResult y ChallengeResult
  restore-state.ts       # validación de una partida guardada
  missions/
    public-catalog.ts    # parte pública de M01–M10 (v2): apta para el navegador
    rubrics.ts           # PRIVADO: rúbricas, pistas y explicaciones
    definitions.ts       # PRIVADO: MissionDefinition completa y corrección
application/
  ports.ts               # MissionEvaluator, ChallengeRepository, Clock, IdGenerator
  challenge-engine.ts    # iniciar, responder, pista, avanzar, omitir, terminar, reiniciar, restaurar
  challenge-api.ts       # tipos y ayudas públicas para presentación
infrastructure/
  browser-challenge-repository.ts  # único acceso a localStorage
  in-process-mission-evaluator.ts  # corrección con las rúbricas (solo en el servidor)
  system-clock.ts
presentation/
  challenge-experience.tsx         # introducción, mapa, misión y resumen
  mission-view.tsx                 # marco común de todas las misiones
  interactions/                    # una interacción visual por tipo, sin reglas de corrección
```

Las reglas compartidas viven en `src/domain`: dataset, comparación de resultados,
expresiones y analizador de proyecciones. La raíz de composición
`src/composition/challenge` une el motor con `localStorage` y con las Server
Functions de corrección. Aplicación solo importa el catálogo público, y una
prueba impide que otras capas importen las rúbricas (G15).
