# Dominio

Reglas, tipos e invariantes puros definidos en las especificaciones.
No depende de React, Next.js, paquetes de persistencia, navegador ni red.

Contenido compartido entre módulos:

- `dataset/empleados.ts`: fuente única del dataset `empleados-select-v1`
  (DATABASE_SCHEMA.md), inmutable y con huella de versión. Ningún otro archivo
  define sus registros.
- `results/result-table.ts`: proyección, DISTINCT y comparación de resultados
  por multiconjunto con orden de columnas (LAB_SPEC.md).

Las reglas propias de un módulo viven en `features/<modulo>/domain`. Todavía no
se implementan el analizador SQL, el laboratorio ni los estados de sala.
