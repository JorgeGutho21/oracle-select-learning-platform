# Módulos funcionales

Las pantallas base se agrupan en exposición (`presentation`), estudio (`study`),
laboratorio (`laboratory`), Challenge (`challenge`), salas (`rooms`), resultados
(`results`) y recursos (`resources`). Contenido y búsqueda tendrán módulos propios
cuando se implemente su comportamiento según ARCHITECTURE.md.

Al implementar un módulo, crear solo las capas que use:

```text
features/<modulo>/
  presentation/   # componentes y estado de interfaz del módulo
  application/    # casos de uso y puertos del módulo
  domain/         # reglas puras del módulo
  infrastructure/# adaptadores del módulo
```

El sistema de diseño compartido vive en `src/presentation`, sin duplicarse por
módulo. `src/app` compone rutas y layouts. Las capas raíz se reservan a contratos
y reglas compartidos de verdad. No se crean implementaciones vacías que lancen
errores ni modelos de negocio especulativos.

ESLint aplica las mismas fronteras a capas raíz y capas de cada módulo, tanto en
importaciones con alias `@/` como en rutas relativas y reexportaciones. El dominio
solo importa dominio; aplicación importa aplicación/dominio; infraestructura
implementa contratos de aplicación/dominio; presentación consume aplicación.
