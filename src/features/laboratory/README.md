# Laboratorio SQL

Laboratorio de `/lab` (LAB_SPEC.md), con seis paneles: esquema, editor, resultado,
traducción, anatomía y diagnóstico.

- `application/lab-api.ts`: **análisis educativo** con el motor SQL compartido de
  `src/domain/sql`: diagnósticos con posición, columnas fuente, vista previa sobre
  el dataset (rotulada «No es una ejecución en Oracle»), traducción y anatomía.
- `application/execute-on-oracle.ts`: **ejecución real**, una operación distinta.
  Valida con el analizador y envía solo la sentencia canónica al puerto
  `OracleQueryExecutor`. Las consultas rechazadas nunca llegan al motor.
- `domain/examples.ts`: ejemplos LAB01–LAB10.
- `presentation/`: `LaboratoryWorkspace` y sus paneles; no contienen reglas SQL.

La composición del servidor (`src/composition/lab/actions.ts`) usa hoy
`UnconfiguredOracleExecutor`, que declara «Oracle no conectado». Cuando exista la
instancia (R1), el adaptador node-oracledb lo sustituirá sin cambiar la interfaz.
