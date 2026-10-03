# Dominio

Reglas, tipos e invariantes puros definidos en las especificaciones.
No depende de React, Next.js, paquetes de persistencia, navegador ni red.

Contenido compartido entre módulos:

- `dataset/empleados.ts`: fuente única del dataset `empleados-select-v1`
  (DATABASE_SCHEMA.md), inmutable y con huella de versión. Ningún otro archivo
  define sus registros.
- `results/result-table.ts`: proyección, DISTINCT y comparación de resultados
  por multiconjunto con orden de columnas (LAB_SPEC.md).

- `sql/`: motor SQL educativo único del subconjunto SELECT v1 (LAB_SPEC.md):
  léxico, parser a AST, analizador contra el catálogo, diagnósticos pedagógicos,
  evaluación educativa sin `eval`, traducción, anatomía y sentencia canónica.
  Lo usan el laboratorio y el Challenge; no ejecuta nada en Oracle.

Las reglas propias de un módulo viven en `features/<modulo>/domain`. Todavía no
se implementan los estados de sala.
