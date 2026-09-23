# Estado del SQL Challenge — Auditoría

Fecha: 23 de septiembre de 2026. Rama `claude-finish`, commit `fe6b8ea`. Especificación de referencia: [GAME_SPEC.md](GAME_SPEC.md), requisitos P09–P13 y P15 de [PROJECT_SPEC.md](PROJECT_SPEC.md), pruebas T09–T13 y G01–G15 de [TEST_PLAN.md](TEST_PLAN.md).

## Conclusión

**El SQL Challenge no está iniciado.** La ruta `/challenge` existe y es navegable, pero solo muestra un estado vacío («Las misiones están en preparación»). No hay ninguna línea de código de misiones, evaluación, puntuación ni interacción.

Archivos existentes relacionados:

| Archivo                                                  | Contenido real                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `src/app/challenge/page.tsx`                             | Ruta y metadata «SQL Oracle Challenge».                        |
| `src/app/challenge/layout.tsx`                           | `ModuleLayout` en modo `standard`.                             |
| `src/features/challenge/presentation/challenge-page.tsx` | `FeaturePlaceholder` con texto de estado vacío.                |
| `tests/e2e/routes.spec.ts`                               | Solo comprueba que `/challenge` responde y es accesible (axe). |

Componentes reutilizables ya disponibles en `src/presentation/components/ui`: `Button` (estado enviando), `Chip`, `Alert`, `Progress`, `Dialog`, `Tabs`, `Tooltip`, `CodeBlock`, `DataTable`, `LoadingState`, `Card`, `Heading`, `SearchField`.

## Búsqueda realizada

Se buscó en `src/`, `tests/`, `scripts/` y `package.json`:

| Término                          | Resultado                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `MissionDefinition`, `missions`  | Sin coincidencias.                                                                |
| `challenge`                      | Solo la ruta, el placeholder y la navegación.                                     |
| `dnd-kit`, drag and drop         | Sin dependencia ni código.                                                        |
| `score`, puntos                  | Sin coincidencias.                                                                |
| `timer`                          | Solo el temporizador interno de ocultación de `tooltip.tsx`; no es un cronómetro. |
| attempts, hints, feedback        | Sin coincidencias de negocio.                                                     |
| progress                         | Solo el componente visual `Progress`, con datos de demostración en el showcase.   |
| CodeMirror                       | Sin dependencia. `CodeBlock` resalta SQL de forma visual y no es un editor.       |
| SQL parser / evaluator           | Sin coincidencias. `src/domain` está vacío.                                       |
| Dataset EMPLEADOS                | No codificado; solo existe en `docs/DATABASE_SCHEMA.md`.                          |
| Pruebas unitarias del Challenge  | Ninguna. Las 22 pruebas cubren componentes y arquitectura.                        |
| Pruebas Playwright del Challenge | Ninguna, salvo la carga de la ruta vacía.                                         |

## Estado por misión

| Misión | Título                       | Interacción requerida                                    | Estado  | Dependencias para construirla                                                      |
| ------ | ---------------------------- | -------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| M01    | SELECT Visual                | Arrastrar columnas NOMBRE, SALARIO + alternativa teclado | MISSING | Dataset, arrastre accesible, comparador de resultado.                              |
| M02    | Constructor de Consultas     | Ordenar piezas SELECT/FROM                               | MISSING | Arrastre accesible, validación de secuencia.                                       |
| M03    | ¿Qué devuelve el asterisco?  | Construir 6 encabezados + número de filas                | MISSING | Dataset, constructor de resultado, campo numérico.                                 |
| M04    | Predice la proyección        | Construir multiconjunto de 6 ciudades                    | MISSING | Fichas repetibles, comparador de multiconjunto.                                    |
| M05    | El cálculo correcto          | Construir expresión con paréntesis + valor de Ana        | MISSING | Constructor de expresiones, evaluador aritmético, equivalencia.                    |
| M06    | Encabezados con sentido      | Colocar `AS salario_anual` y etiquetar encabezado        | MISSING | Arrastre accesible, vista previa de encabezados.                                   |
| M07    | DISTINCT sobre combinaciones | Construir 5 pares ciudad/depto                           | MISSING | Dataset, comparador de pares sin orden.                                            |
| M08    | Debug Terminal               | Localizar coma sobrante y reparar consulta               | MISSING | Selector de token, editor, analizador del subconjunto (sintaxis + objetivo).       |
| M09    | Reconstrucción de un reporte | Piezas con DISTINCT y dos alias + predicción 5           | MISSING | Arrastre accesible, validación de secuencia y alias.                               |
| M10    | Final Boss: Query Master     | Editor vacío, SQL escrito, evaluación en Oracle          | MISSING | CodeMirror, analizador, servicio de corrección en servidor y **Oracle real (R1)**. |

Ninguna misión está en estado DONE, PARTIAL o BROKEN: no hay código que pueda estar parcial o roto.

## Estado de los subsistemas del Challenge

| Subsistema                           | Estado  | Nota                                                                                                                                                    |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipo `MissionDefinition` versionado  | MISSING | GAME_SPEC define campos: ID, versión, título, objetivo, lecciones, dificultad, tipo, enunciado, piezas, rúbrica privada, pista, explicación y duración. |
| Catálogo de 10 misiones              | MISSING | Exactamente diez, sin temas futuros (C03).                                                                                                              |
| Mapa de misiones y progreso          | MISSING | Flujo E de UX_FLOWS: portada → mapa → misión → validar → feedback → siguiente.                                                                          |
| Arrastre accesible (dnd-kit)         | MISSING | P10/G14: arrastre, teclado y toque con la misma respuesta evaluada.                                                                                     |
| Editor SQL (CodeMirror)              | MISSING | Necesario para M08 y M10.                                                                                                                               |
| Analizador del subconjunto SELECT v1 | MISSING | LAB_SPEC exige árbol sintáctico con lista positiva, no expresiones regulares.                                                                           |
| Comparador de resultados             | MISSING | Encabezados, orden de columnas, multiconjunto de filas sin orden (LAB15, S09).                                                                          |
| Evaluador de expresiones             | MISSING | M05: precedencia y equivalencia (S07, S08).                                                                                                             |
| Intentos (2 puntuados)               | MISSING | Fallo técnico no consume intento.                                                                                                                       |
| Pistas (1 por misión, −20)           | MISSING | No duplicar descuento; no pedir con evaluación pendiente.                                                                                               |
| Puntuación `100 − 20(i−1) − 20p`     | MISSING | Máximo 1000; G11/G12.                                                                                                                                   |
| Cronómetro individual                | MISSING | Tiempo transcurrido, se pausa al ocultar la pestaña; informativo.                                                                                       |
| Feedback y explicación final         | MISSING | Soluciones solo al cerrar la oportunidad puntuada (G15).                                                                                                |
| Práctica sin puntos tras agotar      | MISSING | UX_FLOWS, Flujo E.                                                                                                                                      |
| Guardado local de la partida         | MISSING | Rotulado «Práctica», con versión; nunca alimenta la sala.                                                                                               |
| Servicio de corrección en servidor   | MISSING | ARCHITECTURE: «Corregir práctica individual» con rúbrica privada en servidor.                                                                           |
| Resultados locales en `/results`     | MISSING | Puntaje sobre 1000, resueltas, errores, pistas y repaso por concepto.                                                                                   |
| Pruebas unitarias G01–G13            | MISSING | Una por misión con caso correcto, incorrecto pedagógico e incompleto; tabla de puntuación.                                                              |
| Pruebas E2E T09–T13, G14             | MISSING | Completar M01–M10 con ratón, teclado y toque.                                                                                                           |

## Riesgos específicos

- **M10 depende de Oracle real.** Sin R1, M10 no puede cumplir P13 ni G10. Mostrar indisponibilidad es obligatorio; no se puede aceptar con un simulador presentado como Oracle.
- **Rúbricas en el navegador.** Si las misiones y soluciones se empaquetan en el cliente, se incumple G15. Hay que separar la parte pública de la misión (enunciado, piezas) de la rúbrica privada desde el primer tipo de dominio.
- **Arrastre sin alternativa.** Implementar solo arrastre incumple D02, G14 y P10. La modalidad «seleccionar pieza y destino» debe producir el mismo objeto de respuesta.
- **Comparación literal de SQL.** LAB_SPEC prohíbe evaluar comparando cadenas; M08 y M10 requieren analizador y resultado.
- **M08 y alias implícito.** `SELECT nombre salario FROM empleados` es válido (LAB10); el feedback debe distinguir sintaxis de objetivo (P12, T12).
- **Datos divergentes del juego original.** El Artifact usa María 31, Jorge 29/Ventas y TELEFONO; el dataset v1 no los admite.
- **Dependencias por instalar.** dnd-kit y CodeMirror 6 deben fijarse con versión exacta y verificarse con React 19.3 y Next 16.3.

## Orden recomendado de implementación del Challenge

1. **Dominio base** (`src/features/challenge/domain` o `src/domain`): dataset `empleados-select-v1`, tipos `MissionDefinition` pública/privada, regla de puntuación y máquina de estados de intento y pista. Pruebas G11 y G12.
2. **Comparadores puros**: resultado tabular por multiconjunto, secuencia de piezas y expresión aritmética. Pruebas S03, S04, S07, S08, S09.
3. **Motor de partida individual**: progreso, intentos, pistas, cronómetro pausable, guardado local versionado y resumen en `/results`.
4. **Mapa y marco de misión** en presentación: enunciado, pista, feedback, explicación, progreso, con los componentes UI existentes.
5. **Interacción de piezas accesible** (dnd-kit + selección pieza/destino): M01, M02, M06, M09. Pruebas T10.
6. **Constructores de resultado**: M03, M04, M07. Pruebas T11.
7. **Expresión**: M05.
8. **Analizador del subconjunto SELECT v1** y editor CodeMirror: M08. Pruebas T12.
9. **Servicio de corrección en servidor** y traslado de rúbricas privadas fuera del cliente (G15).
10. **M10** con Oracle real cuando R1 esté disponible; mientras tanto, estado explícito de «servicio no disponible». Pruebas T13.
11. Pruebas E2E T09 completas y revisión de accesibilidad D02/G14 en móvil.
