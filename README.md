# SQL SELECT LAB

Plataforma universitaria interactiva para aprender SELECT en Oracle SQL.

**Autor:** Jorge Gutierrez Thomas

**Profesor:** Amilkar Sierra

**Asignatura:** Base de Datos

**Programa:** Ingeniería de Sistemas

**Institución:** Universidad Popular del Cesar

**En línea:** <https://sql-select-lab.vercel.app> (Vercel, con Oracle Autonomous Database y Supabase reales). Detalle en [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Estado del proyecto

Unidad completa de **Oracle SQL fundamental (Nivel 1, SELECT)** sobre un único dataset, `empleados-select-v2`: tabla EMPLEADOS de 12 columnas y 20 filas, cargada en Oracle desde `oracle/empleados-select-v2.sql`.

- **Modo Estudio** (`/learn`): 22 lecciones en 8 bloques, desde qué es una base de datos hasta una consulta completa con WHERE y ORDER BY. Cada una tiene la misma plantilla de 12 partes (tabla → consulta → qué hace → resultado, error frecuente y mini comprobación con pistas graduales).
- **Modo Exposición** (`/presentation`): 29 escenas 16:9 para proyector, con teclado, selector, pantalla completa y retorno desde el laboratorio.
- **Laboratorio** (`/lab`): el motor educativo analiza la consulta y ofrece vista previa rotulada, traducción, anatomía y diagnóstico en cinco grupos (SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE, ADVERTENCIA), con posición, pista y corrección aplicable. «Ejecutar en Oracle» usa Oracle real. Tiene 24 ejemplos (LAB01–LAB24).
- **SQL Oracle Challenge** (`/challenge`, `select-challenge-v3`): diez misiones con puntuación, intentos y pistas. M10 se califica en Oracle real.
- **Sala en vivo:** `/presenter`, `/join/{código}`, `/live` y `/results`, con Supabase en producción.
- **Ruta de aprendizaje** (`/modules`): los niveles 2 a 7 (funciones, agrupación, JOIN, subconsultas, modificación de datos y DDL) con 46 fichas «Próximamente». No forman parte del contenido actual.
- **Recursos** (`/resources`): chuleta de 18 conceptos, referencia rápida, ejemplos y los dos videos.
- **Buscador** Ctrl+K/Cmd+K: encuentra los temas actuales y los futuros, estos marcados «Próximamente».

Oracle: local (Oracle Database Free 23ai en contenedor) y Oracle Autonomous Database 19c en la nube, con esquemas `SQL_LAB_V2_OWNER` (dueño) y `SQL_LAB_V2_READER` (solo lectura) ([ORACLE_SETUP.md](docs/ORACLE_SETUP.md)). Sin Oracle configurado, el laboratorio lo indica y no simula nada. Estado detallado en [PROJECT_STATUS.md](docs/PROJECT_STATUS.md).

## Desarrollo local

Usar Node 24 LTS (validado con 24.20.0) y npm 11.19.0.

```sh
npm ci
npm run dev
```

Abrir `http://localhost:3000`. El showcase de los trece componentes y sus estados está en `http://localhost:3000/dev/design-system`.

```sh
npm run test:e2e:install
npm run lint
npm run typecheck
npm run tests
npm run build
npm run format:check
```

`tests` ejecuta Vitest y Playwright. Playwright compila e inicia la aplicación en el puerto 3200 y valida Chromium, Microsoft Edge y WebKit. Con `.env.local` configurado (`npm run oracle:up` y `npm run oracle:setup`), `tests/integration/oracle-real.test.ts` compara Oracle real con el motor educativo. La instalación del canal Edge requiere sus permisos habituales de sistema si el navegador no está instalado. Se guardan capturas, trazas de fallos e informe HTML en directorios ignorados por Git. `typecheck` genera sus tipos de rutas sin exigir un build previo.

Para servir el build: `npm start`. Las decisiones, límites y resultados de verificación están en [IMPLEMENTATION_NOTES.md](docs/IMPLEMENTATION_NOTES.md).

## Alcance académico

**Nivel 1 (actual):**

- Qué es una base de datos, tabla, fila, columna y SQL.
- SELECT y FROM, SELECT *, columnas específicas y comas.
- Expresiones (+, -, *, /), precedencia y paréntesis.
- Alias con AS, textos y concatenación con ||.
- DISTINCT.
- WHERE y comparaciones (=, <>, !=, >, >=, <, <=, textos y fechas).
- AND, OR y NOT, con la precedencia lógica y los paréntesis.
- BETWEEN, IN y LIKE (%, _), con sus formas NOT.
- NULL, IS NULL e IS NOT NULL.
- ORDER BY (ASC, DESC, varias columnas).
- La consulta completa paso a paso y los errores frecuentes.

**Próximos niveles (Próximamente):**

- Funciones (UPPER, ROUND, SYSDATE, TO_CHAR, NVL…).
- Agregación (COUNT… GROUP BY, HAVING).
- JOIN y subconsultas.
- INSERT, UPDATE, DELETE, COMMIT y ROLLBACK.
- DDL (CREATE, ALTER, DROP y restricciones).

Detalle en [CONTENT_MAP.md](docs/CONTENT_MAP.md).

## Experiencia prevista

Home, Modo Exposición, Modo Estudio, buscador global, vídeos, explicaciones visuales, tablas interactivas, laboratorio con ejecución real en Oracle, SQL Challenge de diez misiones y sala en vivo mediante QR, con tiempo, puntuación, ranking y estadísticas.

El alcance y los criterios de aceptación completos se encuentran en la documentación.

## Documentación

| Documento                                                 | Contenido                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)                   | Propósito, fuentes, alcance y aceptación por módulo.        |
| [CONTENT_MAP.md](docs/CONTENT_MAP.md)                     | Lecciones, escenas, dataset, roadmap y vídeos.              |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)                 | Identidad visual, componentes y accesibilidad.              |
| [UX_FLOWS.md](docs/UX_FLOWS.md)                           | Recorridos, navegación y estados.                           |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                   | Capas, servicios y límites de confianza.                    |
| [LAB_SPEC.md](docs/LAB_SPEC.md)                           | Subconjunto SQL y laboratorio Oracle.                       |
| [GAME_SPEC.md](docs/GAME_SPEC.md)                         | Diez misiones, evaluación y puntuación.                     |
| [REALTIME_SPEC.md](docs/REALTIME_SPEC.md)                 | Salas, sincronización y reconexión.                         |
| [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)               | Configurar Supabase para la sala en vivo.                   |
| [FINAL_AUDIT.md](docs/FINAL_AUDIT.md)                     | Auditoría preproducción y prerrequisitos de despliegue.     |
| [PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)           | Servicios, variables y alojamiento de producción.           |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)                       | Estado del despliegue en Vercel, procedimiento y reversión. |
| [ORACLE_SETUP.md](docs/ORACLE_SETUP.md)                   | Conectar el laboratorio y M10 a Oracle.                     |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)             | Dataset v2, esquemas Oracle y persistencia.                 |
| [CONTENT_REDESIGN_PLAN.md](docs/CONTENT_REDESIGN_PLAN.md) | Plan y decisiones de la unidad ampliada.                    |
| [TEST_PLAN.md](docs/TEST_PLAN.md)                         | Plan de pruebas de la futura aplicación.                    |
| [ROADMAP.md](docs/ROADMAP.md)                             | Hitos, dependencias y condiciones de entrega.               |

## Estructura

```text
oracle-select-learning-platform/
├── docs/
├── src/
│   ├── app/
│   ├── composition/     # raíz de composición: une adaptadores y casos de uso
│   ├── features/
│   ├── presentation/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── styles/
│   └── content/         # reservado para contenido posterior
├── tests/
├── public/
├── .gitignore
├── AGENTS.md
└── README.md
```

`src/app` compone rutas y layouts; los módulos agrupan sus pantallas en `features/<módulo>/presentation`. Los componentes compartidos viven en `src/presentation`. Aplicación, dominio e infraestructura conservan sus límites documentados; el Challenge es el primer módulo que los usa. `src/composition` es el único lugar que une infraestructura con aplicación y solo `src/app` lo importa. ESLint comprueba la dirección de dependencias. Las carpetas iniciales todavía vacías se conservan sin añadir lógica ficticia.

## Forma de trabajo

Leer primero `AGENTS.md` y los once documentos de `docs/`. Mantener separados presentación, aplicación, dominio e infraestructura. Desarrollar cada hito con sus criterios de aceptación y conservar una sola versión de los datos educativos.

## Continuar con Codex u otra IA

Abrir este repositorio como carpeta de trabajo. Leer [CONTINUITY.md](CONTINUITY.md) para conocer el estado, decisiones y próximos pasos, y enviar el encargo de [CODEX_PROMPT.md](CODEX_PROMPT.md) para iniciar el desarrollo.

Actualizar la continuidad al cerrar cada sesión. El repositorio conserva los entregables y el contexto necesario para retomar; los adjuntos originales y el historial completo de ChatGPT no están incluidos.
