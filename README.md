# SQL SELECT LAB

Plataforma universitaria interactiva para aprender SELECT en Oracle SQL.

**Autor:** Jorge Gutiérrez Thomas

**Institución:** Universidad Popular del Cesar

**Área:** Bases de Datos

## Estado del proyecto

Cimientos técnicos y sistema de diseño implementados. Incluye Next.js App Router, TypeScript estricto, Bootstrap 5.3.8 compilado con Sass local y componentes accesibles. Las ocho rutas base muestran navegación y estados vacíos; no se implementan contenido académico, juego, Oracle ni Supabase en esta fase.

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

`tests` ejecuta Vitest y Playwright. Playwright inicia la aplicación en el puerto 3100 y valida Chromium, Microsoft Edge y WebKit. La instalación del canal Edge requiere sus permisos habituales de sistema si el navegador no está instalado. Se guardan capturas, trazas de fallos e informe HTML en directorios ignorados por Git. `typecheck` genera sus tipos de rutas sin exigir un build previo.

Para servir el build: `npm start`. Las decisiones, límites y resultados de verificación están en [IMPLEMENTATION_NOTES.md](docs/IMPLEMENTATION_NOTES.md).

## Alcance académico

Introducción breve a SQL, SELECT, FROM, SELECT *, columnas específicas, expresiones y cálculos, alias con AS, DISTINCT y construcción de consultas centradas en SELECT.

WHERE, BETWEEN, IN, LIKE, NULL, JOIN, ORDER BY y otros conceptos se reservan para módulos futuros.

## Experiencia prevista

Home, Modo Exposición, Modo Estudio, buscador global, vídeos, explicaciones visuales, tablas interactivas, laboratorio con ejecución real en Oracle, SQL Challenge de diez misiones y sala en vivo mediante QR, con tiempo, puntuación, ranking y estadísticas.

El alcance y los criterios de aceptación completos se encuentran en la documentación.

## Documentación

| Documento                                     | Contenido                                            |
| --------------------------------------------- | ---------------------------------------------------- |
| [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)       | Propósito, fuentes, alcance y aceptación por módulo. |
| [CONTENT_MAP.md](docs/CONTENT_MAP.md)         | Lecciones, escenas, ejemplos y vídeos.               |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)     | Identidad visual, componentes y accesibilidad.       |
| [UX_FLOWS.md](docs/UX_FLOWS.md)               | Recorridos, navegación y estados.                    |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)       | Capas, servicios y límites de confianza.             |
| [LAB_SPEC.md](docs/LAB_SPEC.md)               | Subconjunto SQL y laboratorio Oracle.                |
| [GAME_SPEC.md](docs/GAME_SPEC.md)             | Diez misiones, evaluación y puntuación.              |
| [REALTIME_SPEC.md](docs/REALTIME_SPEC.md)     | Salas, sincronización y reconexión.                  |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Dataset y modelo lógico de persistencia.             |
| [TEST_PLAN.md](docs/TEST_PLAN.md)             | Plan de pruebas de la futura aplicación.             |
| [ROADMAP.md](docs/ROADMAP.md)                 | Hitos, dependencias y condiciones de entrega.        |

## Estructura

```text
oracle-select-learning-platform/
├── docs/
├── src/
│   ├── app/
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

`src/app` compone rutas y layouts; los módulos agrupan sus pantallas en `features/<módulo>/presentation`. Los componentes compartidos viven en `src/presentation`. Aplicación, dominio e infraestructura conservan sus límites documentados y quedan reservados para las fases posteriores. ESLint comprueba la dirección de dependencias. Las carpetas iniciales todavía vacías se conservan sin añadir lógica ficticia.

## Forma de trabajo

Leer primero `AGENTS.md` y los once documentos de `docs/`. Mantener separados presentación, aplicación, dominio e infraestructura. Desarrollar cada hito con sus criterios de aceptación y conservar una sola versión de los datos educativos.

## Continuar con Codex u otra IA

Abrir este repositorio como carpeta de trabajo. Leer [CONTINUITY.md](CONTINUITY.md) para conocer el estado, decisiones y próximos pasos, y enviar el encargo de [CODEX_PROMPT.md](CODEX_PROMPT.md) para iniciar el desarrollo.

Actualizar la continuidad al cerrar cada sesión. El repositorio conserva los entregables y el contexto necesario para retomar; los adjuntos originales y el historial completo de ChatGPT no están incluidos.
