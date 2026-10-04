# DB LAB

Plataforma interactiva de Bases de Datos con Oracle. Proyecto académico: no es un producto oficial de Oracle ni de la Universidad Popular del Cesar.

**Desarrollado por:** Jorge Gutiérrez Thomas

**Docente:** Amilkar Sierra Romano

**Contexto:** Bases de Datos

**Programa:** Ingeniería de Sistemas

**Institución:** Universidad Popular del Cesar

**Producción existente:** <https://sql-select-lab.vercel.app>. La versión pública inspeccionada corresponde a `874f774`, anterior a DB LAB de las fases 1–4. El candidato de Fase 5 está validado en Preview, rama `codex-phase5-production-final-20261004`; publicación BLOCKED por SMTP remoto UNKNOWN y entrega sin verificar. El cierre operativo consta en [FINAL_RELEASE.md](docs/FINAL_RELEASE.md); la evidencia y los gates están en [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) y [FINAL_QA_REPORT.md](docs/FINAL_QA_REPORT.md).

## Estado del proyecto

DB LAB se organiza en tres secciones disponibles (`/sections`): **Fundamentos SQL**, **Consultas relacionales y análisis** y **PL/SQL y automatización**. Cada sección reúne los mismos modos: iniciar clase, estudiar, practicar, Challenge, recursos y evaluación. Decisiones de la Fase 1 en [ARCHITECTURE.md](docs/ARCHITECTURE.md#db-lab-fase-1-arquitectura-de-secciones) y [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md#db-lab-30).

**Fase 2:**

- cuentas opcionales: invitado, correo y contraseña, o Microsoft;
- roles de estudiante y profesor;
- progreso sincronizado entre dispositivos;
- «Mi progreso», perfil y panel docente.

Supabase da la identidad y Oracle sigue ejecutando las prácticas. Detalle en [AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md).

**Fase 3:**

- banco de preguntas por sección con diez tipos de pregunta y 50 preguntas oficiales de Fundamentos SQL verificadas con el motor educativo;
- evaluaciones que crea y publica el profesor (selección manual o automática equivalente, fechas, duración, intentos, orden aleatorio, audiencia);
- examen con tiempo del servidor, autoguardado, marcas de revisión, recuperación de la conexión y entrega confirmada;
- nota de 0.0 a 5.0 calculada en la base, con pesos y retroalimentación que libera el profesor;
- supervisión de eventos del navegador con monitor en vivo, resultados con análisis por pregunta y exportación CSV.

Detalle en [ASSESSMENT_ARCHITECTURE.md](docs/ASSESSMENT_ARCHITECTURE.md) y guía de uso en [ASSESSMENT_TEACHER_GUIDE.md](docs/ASSESSMENT_TEACHER_GUIDE.md).

**Fase 4 (rama `claude-phase4-curriculum-20261003`, sin desplegar):**

- **fuente curricular única** (`src/features/curriculum/`): de ella salen las lecciones, los ejemplos, la clase, la práctica, el Challenge, los recursos y el banco;
- **Sección 2**: 25 lecciones, 102 ejemplos, 22 prácticas, 10 misiones y 34 escenas sobre el dataset relacional `empresa-relacional-v1`;
- **Sección 3**: 28 lecciones, 77 ejemplos, 26 prácticas, 10 misiones y 37 escenas, con los triggers como tema central;
- **auditoría de la Sección 1**: 42 ajustes del banco y las lecciones 23–25, «Funciones de una fila»;
- **banco oficial completo**: 150 preguntas, 50 por sección;
- **resultados verificados en Oracle**: todas las tablas, salidas de DBMS_OUTPUT y errores se obtuvieron al ejecutar el código en Oracle Database 23 (222 resultados verificados). La interfaz nunca los presenta como ejecución en vivo.

Detalle en [CURRICULUM_ARCHITECTURE.md](docs/CURRICULUM_ARCHITECTURE.md), [SECTION_1_AUDIT.md](docs/SECTION_1_AUDIT.md), [SECTION_2_CURRICULUM.md](docs/SECTION_2_CURRICULUM.md), [SECTION_3_CURRICULUM.md](docs/SECTION_3_CURRICULUM.md), [QUESTION_BANK_SPEC.md](docs/QUESTION_BANK_SPEC.md), [ORACLE_VALIDATION.md](docs/ORACLE_VALIDATION.md) y [PHASE4_QA.md](docs/PHASE4_QA.md).

La Sección 1 es la unidad completa de **Oracle SQL fundamental (SELECT)**:

Unidad completa de **Oracle SQL fundamental (Nivel 1, SELECT)** sobre un único dataset, `empleados-select-v2`: tabla EMPLEADOS de 12 columnas y 20 filas, cargada en Oracle desde `oracle/empleados-select-v2.sql`.

- **Fuente conceptual única** (`src/domain/concepts/sql-concepts.ts`): 35 conceptos (incluidos la consulta, la coma, los paréntesis e IS NOT NULL), cada uno con una definición, su categoría correcta (cláusula, operador lógico, condición, comodín…), una glosa breve para «En esta consulta» y, cuando corresponde, el error frecuente. La Exposición, el Estudio, los Recursos, el Challenge y el buscador la presentan sin reescribirla.
- **Color semántico de SQL:** proyección (SELECT) cian, fuente (FROM) azul, filtro (WHERE y condiciones) violeta, operadores ámbar y orden (ORDER BY) magenta, siempre con texto o forma, en todo el producto.
- **Modo Estudio** (`/learn`): 22 lecciones en 8 bloques, desde qué es una base de datos hasta una consulta completa con WHERE y ORDER BY.
  - **Plantilla:** la misma en todas, con la definición canónica, la ubicación en el recorrido, un índice fijo, «Predice», la consulta, qué hace, la tabla original, el resultado, el error frecuente y una mini comprobación con pistas graduales.
  - **Pliegues:** lo secundario se abre al pedirlo.
- **Modo Exposición** (`/presentation`): 30 escenas 16:9 en cinco bloques.
  - **Contenido:** cada escena tiene su definición o propósito, una visualización del concepto y una idea clave.
  - **Controles:** navegador de escenas agrupado, «Paso a paso», notas del expositor (N), vista del presentador (`/presentation/presentador`) y pantalla completa con controles que se atenúan.
- **Laboratorio** (`/lab`): editor y resultado primero.
  - **Análisis:** el motor educativo ofrece vista previa rotulada, traducción, anatomía y diagnóstico en cinco grupos (SINTAXIS, SEMÁNTICA, ALCANCE EDUCATIVO, ORACLE, ADVERTENCIA). Cada diagnóstico dice qué ocurrió, dónde y por qué; la corrección se abre al pedirla.
  - **Esquema:** agrupado; los 20 registros se abren solo si se piden.
  - **Ejecución:** «Ejecutar en Oracle» usa Oracle real. Tiene 24 ejemplos (LAB01–LAB24).
- **Vista de datos adaptable:** tablas con encabezados y filas; en contenedores estrechos, grupos accesibles de columnas con la identidad del registro. Ninguna tabla, consulta ni resultado educativo necesita barra horizontal, ni siquiera a 320 px.
- **SQL Oracle Challenge** (`/challenge`, `select-challenge-v4`, GAME_SPEC 4): diez misiones que razonan sobre una muestra de trabajo (como mucho 8 registros y 3–4 columnas, siempre en tabla) con puntuación, intentos, pistas y feedback por tipo de error. M10 se califica en Oracle real.
  - **Densidad propia:** cada misión muestra el pedido, el concepto clave y solo los «Datos necesarios» (4–7 columnas y pocas filas); la tabla completa es un desplegable secundario y nunca hay barra horizontal.
  - **Feedback:** tipo de error, qué está bien, qué ajustar y una orientación progresiva; el acierto explica por qué.
- **Sala en vivo:** `/presenter`, `/join/{código}`, `/live` y `/results`, con Supabase en producción.
- **Ruta de aprendizaje** (`/modules`): los niveles 2 a 7 (funciones, agrupación, JOIN, subconsultas, modificación de datos y DDL) con 46 fichas «Próximamente». No forman parte del contenido actual.
- **Recursos** (`/resources`): chuleta de 18 fichas por categorías («En una frase», «Para qué sirve», «Patrón», ejemplo formateado, «Qué devuelve» y «Error frecuente», con «Copiar», «Abrir en Lab» y «Repasar lección»), referencia rápida, ejemplos y los dos videos.
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

`tests` ejecuta Vitest y Playwright. Las suites `visual-*.spec.ts` comprueban que nada desborda ni se recorta, del escritorio a 320 px, y adjuntan capturas al informe para la revisión visual. Playwright compila e inicia la aplicación en el puerto 3200 y valida Chromium, Microsoft Edge y WebKit. Con `.env.local` configurado (`npm run oracle:up` y `npm run oracle:setup`), `tests/integration/oracle-real.test.ts` compara Oracle real con el motor educativo. La instalación del canal Edge requiere sus permisos habituales de sistema si el navegador no está instalado. Se guardan capturas, trazas de fallos e informe HTML en directorios ignorados por Git. `typecheck` genera sus tipos de rutas sin exigir un build previo.

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

| Documento                                                       | Contenido                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| [PROJECT_SPEC.md](docs/PROJECT_SPEC.md)                         | Propósito, fuentes, alcance y aceptación por módulo.            |
| [CONTENT_MAP.md](docs/CONTENT_MAP.md)                           | Lecciones, escenas, dataset, roadmap y vídeos.                  |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)                       | Identidad visual, componentes y accesibilidad.                  |
| [UX_FLOWS.md](docs/UX_FLOWS.md)                                 | Recorridos, navegación y estados.                               |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)                         | Capas, servicios y límites de confianza.                        |
| [LAB_SPEC.md](docs/LAB_SPEC.md)                                 | Subconjunto SQL y laboratorio Oracle.                           |
| [GAME_SPEC.md](docs/GAME_SPEC.md)                               | Diez misiones, evaluación y puntuación.                         |
| [REALTIME_SPEC.md](docs/REALTIME_SPEC.md)                       | Salas, sincronización y reconexión.                             |
| [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)                     | Configurar Supabase para la sala en vivo.                       |
| [FINAL_AUDIT.md](docs/FINAL_AUDIT.md)                           | Auditoría preproducción y prerrequisitos de despliegue.         |
| [PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)                 | Servicios, variables y alojamiento de producción.               |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)                             | Estado del despliegue en Vercel, procedimiento y reversión.     |
| [ORACLE_SETUP.md](docs/ORACLE_SETUP.md)                         | Conectar el laboratorio y M10 a Oracle.                         |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)                   | Dataset v2, esquemas Oracle y persistencia.                     |
| [CONTENT_REDESIGN_PLAN.md](docs/CONTENT_REDESIGN_PLAN.md)       | Plan y decisiones de la unidad ampliada.                        |
| [TEST_PLAN.md](docs/TEST_PLAN.md)                               | Plan de pruebas de la futura aplicación.                        |
| [AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md)               | Cuentas, roles, progreso y panel docente (Fase 2).              |
| [ASSESSMENT_ARCHITECTURE.md](docs/ASSESSMENT_ARCHITECTURE.md)   | Evaluaciones: modelo, tiempo, autoguardado, nota y supervisión. |
| [ASSESSMENT_SECURITY.md](docs/ASSESSMENT_SECURITY.md)           | Seguridad, privacidad, integridad y retención de evaluaciones.  |
| [QUESTION_BANK_SPEC.md](docs/QUESTION_BANK_SPEC.md)             | Banco de preguntas: tipos, calidad, fuentes y verificación.     |
| [ASSESSMENT_TEACHER_GUIDE.md](docs/ASSESSMENT_TEACHER_GUIDE.md) | Guía del profesor para evaluaciones.                            |
| [ROADMAP.md](docs/ROADMAP.md)                                   | Hitos, dependencias y condiciones de entrega.                   |

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
