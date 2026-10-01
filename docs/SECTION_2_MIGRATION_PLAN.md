# SECTION_2_MIGRATION_PLAN: evolución a una plataforma por secciones

Versión 1.0 · 1 de octubre de 2026 · Informe de planificación, sin cambios en la aplicación.

**Base analizada**
- Rama: `origin/claude-final-ui-polish-20260926`.
- Commit: `874f7748acf030f62dbb02bbaea0b204bdd36441`, del 28 de septiembre de 2026.
- Esa rama contiene la aplicación desplegada en `sql-select-lab.vercel.app`.
- Las rutas de archivo de este documento remiten a esa rama.

**Dónde vive este informe**
- Está en la rama `claude/gallant-cori-4rp11r`, que parte de `main`.
- `main` contiene solo documentación y carpetas vacías (2 commits). No contiene la aplicación.

**Fuentes académicas**
- Oracle Database SQL Language Reference 19c/23ai: apartados «Joins», «Aggregate Functions», «SELECT: group_by_clause», «Using Subqueries» y «The UNION [ALL], INTERSECT, MINUS Operators».
- Oracle Academy, *Database Programming with SQL*: secciones 6 a 10.
- Oracle Academy, *Database Programming with PL/SQL*.
- El proxy del entorno bloqueó docs.oracle.com y academy.oracle.com. La secuencia de Oracle Academy y las novedades de 21c/23ai se confirmaron por búsqueda. Los códigos ORA citados son los documentados por Oracle y deben comprobarse en Oracle real durante la implementación (ver F5).

---

## 1. Estado actual

### 1.1 Stack

| Capa | Tecnología verificada en `package.json` |
| --- | --- |
| Web | Next.js 16.3.6 (App Router, `typedRoutes: true`), React 19.3, TypeScript 6 |
| Estilos | Bootstrap 5.3.8 y Sass, tokens propios en `src/styles/_tokens.scss` |
| Interacción | CodeMirror 6 (dialecto `PLSQL`), dnd-kit, qrcode-generator, Zod 4 |
| Datos de la sala | Supabase (`@supabase/supabase-js`), con alternativas `memory` y `unconfigured` (`classroom-config.ts`) |
| Oracle | `oracledb` 7, solo en el servidor. Se usa Oracle 23ai Free en local y Autonomous 19c en la nube |
| Pruebas | Vitest con jsdom y PGlite; Playwright en Chromium, WebKit y Edge con axe |

### 1.2 Arquitectura

Las capas y sus fronteras las verifica ESLint (`scripts/architecture-boundaries.mjs`, `tests/unit/architecture.test.ts`).

| Capa | Ubicación | Puede importar |
| --- | --- | --- |
| Rutas | `src/app` | app, presentation, application, composition, styles |
| Composición | `src/composition/*` | Raíces cliente/servidor y Server Functions |
| Features | `src/features/<f>/{domain,application,infrastructure,presentation}` | Según su capa |
| Dominio compartido | `src/domain/{sql,dataset,concepts,results}` | Solo dominio, sin paquetes externos |
| Aplicación compartida | `src/application/*` | Aplicación y dominio |
| Presentación compartida | `src/presentation/{components,layouts,navigation,pages}` | Presentación y aplicación |

La carpeta `src/content` no pertenece a ninguna capa: el linter la clasifica como `unclassified`.

### 1.3 Alcance académico vigente

Hoy existe una sola unidad, «SELECT en Oracle SQL» (`src/application/academic-identity.ts:11`), sobre una sola tabla, EMPLEADOS (dataset `empleados-select-v2`, 20 filas × 12 columnas).

**El motor educativo** (`src/domain/sql/*`) admite:
- `SELECT [DISTINCT]`, con expresiones aritméticas y `||`;
- alias de columna;
- `FROM` de una sola tabla;
- `WHERE`, con comparaciones, BETWEEN, IN de literales, LIKE, IS NULL y AND/OR/NOT;
- `ORDER BY`, con NULLS FIRST/LAST.

**El motor rechaza** como «unidad futura»:
- JOIN, GROUP BY, HAVING y cualquier función, agregados incluidos;
- subconsultas, operadores de conjunto, WITH, CASE y alias de tabla;
- DML, DDL y bloques PL/SQL.

Referencias: `keywords.ts:20-55,87+` y `parser.ts:805-855,1634-1638`.

### 1.4 Estado de verificación declarado

Lo que sigue lo declara `CONTINUITY.md` de la rama base; no se volvió a ejecutar en este análisis.

Última entrada, del 27-28 de septiembre de 2026.

**Pruebas:**
- 732/732 pruebas unitarias y de integración, con Oracle local;
- E2E: Chromium 252/252, Edge 186/186 y WebKit 186/186, en las suites afectadas;
- vista previa: 230/230;
- producción: 160/160 con Oracle Cloud.

**Producción:**
- Vercel, con Oracle Autonomous 19c;
- pendiente: crear una sala real en Supabase de producción con la clave docente.

---

## 2. Inventario relevante

### 2.1 Rutas

| Ruta | Raíz o página | Tipo |
| --- | --- | --- |
| `/` | `HomePage` + `StudyProgressRoot` | estática |
| `/learn`, `/learn/[slug]` | `StudyRoot`; SSG con `generateStaticParams` sobre `LESSONS` | estática / SSG |
| `/modules` | `ModulesPage` + `ModuleProgressRoot` | estática |
| `/resources` | `ResourcesPage` (anclas `#chuleta`, `#chuleta-<slug>`, `#videos`, `#fuentes`) | estática |
| `/presentation`, `/presentation/presentador` | `PresentationRoot` / `PresenterViewRoot` con `?scene=N` | dinámica |
| `/lab` | `LabRoot` con `?sql=` y `?returnTo=` | dinámica |
| `/challenge` | `ChallengeRoot` | estática |
| `/live`, `/join` → `/live`, `/join/[code]` | `CodeEntry`, redirección, `JoinRoot` | estática / dinámica |
| `/presenter`, `/presenter/[code]` | `PresenterCreateRoot` / `PresenterConsoleRoot` | dinámica |
| `/results` | `ResultsRoot` con `?sala=` | dinámica |
| `/dev/design-system` | `DesignSystemShowcase` | estática, noindex |

**Navegación**
- Las 6 entradas de la cabecera se derivan de `publicCatalog` (`src/features/search/domain/public-catalog.ts:35-122`) mediante `getPlatformNavigation()` (`search-index.ts:95-111`). Son Inicio, Aprender, Laboratorio, Challenge, En vivo y Recursos.
- «Aprender» queda activo también en `/presentation` y `/modules`.
- El pie usa un array fijo (`site-footer.tsx:5-12`).
- Los enlaces son plantillas escritas a mano, como `/learn/${slug}`, en 26 archivos.

### 2.2 Contenido

| Pieza | Fuente | Identificador | Cantidad |
| --- | --- | --- | --- |
| Lecciones | `features/study/domain/lesson-outline.ts`, `lesson-content-{a,b}.ts` | `LessonId` 'L00'–'L21' (unión cerrada) + slug | 22 en 8 bloques A–H |
| Escenas | `features/presentation/domain/scenes.ts` | número 1–30 e id | 30 en 5 bloques |
| Misiones | `features/challenge/domain/missions/*` | `MissionId` 'M01'–'M10', `select-challenge-v4` | 10 |
| Laboratorio | `features/laboratory/domain/examples.ts` | LAB01–LAB24 | 24 en 5 grupos |
| Conceptos | `domain/concepts/sql-concepts.ts` | `ConceptId` (35), `level: 1` literal | 35 |
| Vídeos | `features/resources/domain/videos.ts` | V01 `intro`, V02 `summary` | 2 |
| Ruta futura | `features/modules/domain/curriculum.ts` | niveles 1–7, `tema-<slug>` | 46 fichas futuras |
| Buscador | `features/search/domain/public-catalog.ts` | `lesson-<slug>`, `concept-<slug>` | catálogo derivado |

### 2.3 Persistencia en el navegador y en la sala

| Clave o recurso | Contenido |
| --- | --- |
| `sql-select-lab:study:progress` | `{releaseId:'select-study-v2', version:1, completed: LessonId[], …}`. Si `releaseId` es distinto, se descarta |
| `sql-select-lab:challenge:practice` | `ChallengeState` con `challengeVersion`, `datasetId`, `missionOrder` |
| `sql-select-lab:challenge:live:<code>:<roomId>` | estado del Challenge en la sala |
| `sql-select-lab:draft:v1` | borrador del laboratorio |
| `sql-select-lab:presentation:scene`, BroadcastChannel `sql-select-lab-deck` | escena actual y sincronía con el presentador |
| Cookies `ssl-presenter-<code>`, `ssl-participant-<code>` | tokens de la sala |
| Supabase `rooms`, `attempts`, `hints`, `results` | `mission_id ~ '^M(0[1-9]\|10)$'`, `total_score ≤ 1000`, `solved_missions ≤ 10`, `hints_used ≤ 10`. Sin columna de sección ni de conjunto de misiones |

### 2.4 Pruebas que fijan el estado actual

**Unitarias**
- `study/study.test.ts`: 22 lecciones y 8 bloques.
- `presentation.test.ts`: 30 escenas.
- `presentation-scenes.test.tsx`: 10 temas futuros en la escena 29.
- `challenge/missions.test.ts`: 10 misiones.
- `modules.test.ts`: niveles 1–7.
- `search.test.ts`: exactamente 6 entradas de navegación.
- `content.test.ts`: `routeExists` solo reconoce `/learn/<slug>`.
- `lab-diagnostics.test.ts`: mensajes de «unidad futura».

**E2E**
- `routes.spec.ts`: rutas, un solo h1, barra exacta y títulos.
- Por pantalla: `learn`, `modules` (46 fichas), `home`, `lab`, `search`, `resources`, `presentation`, `media`.
- Challenge: `challenge-m01…m10`.
- Sala: `classroom`.
- Transversales: `responsive`, `reflow`, `audit-regressions`, `design-system`, `interactions`.
- Las specs `visual-*` no comparan capturas: verifican el diseño (sin desbordamiento horizontal, tablas) y adjuntan las capturas como evidencia.

**Integración**
- `oracle-real.test.ts`: las 22 lecciones y M10 en Oracle.
- `classroom-postgres.test.ts`: RLS y privilegios.

---

## 3. Arquitectura propuesta

### 3.1 Principios

1. **La Sección 1 no se migra: se registra.** Conserva sus ids, slugs, URL, claves de almacenamiento, versiones (`select-study-v2`, `select-challenge-v4`, `empleados-select-v2`), escenas y misiones.
2. **Lo nuevo se añade junto a lo existente.** No se sustituye nada:
   - La Sección 2 tiene sus propios ids, claves, versiones, catálogo de datos y conjunto de misiones.
   - El motor SQL crece por perfiles. El perfil por defecto (`select-v2`) se comporta exactamente como hoy.
3. **El modelo es el mismo para todas las secciones:** Sección → Bloque → Lección → Pasos del patrón pedagógico. La Sección 3 es una entrada del registro con estado `coming-soon`.
4. **Se respetan las fronteras:**
   - Ningún tipo nuevo vive en `src/content`.
   - Las páginas solo consumen APIs de aplicación.
   - El dominio no depende de React, Supabase ni de la red.

### 3.2 Modelo de datos (pseudotipos)

```ts
type SectionId = 'fundamentos' | 'sql-avanzado' | 'plsql';

interface SectionDescriptor {
  id: SectionId;
  number: 1 | 2 | 3;
  title: string;                       // 'Fundamentos SQL', 'SQL avanzado', 'PL/SQL'
  summary: string;
  status: 'available' | 'in-progress' | 'coming-soon';
  learnPath: string;                   // '/learn', '/learn/sql-avanzado', '/learn/plsql'
  challengePath: string | null;        // '/challenge', '/challenge/sql-avanzado', null
  catalogId: string | null;            // 'empleados-select-v2' | 'empresa-sql-v1' | null
  sqlProfile: SqlProfileId | null;     // 'select-v2' | 'advanced-v1' | null
  storageNamespace: string | null;     // null = claves actuales (Sección 1)
  releaseId: string | null;            // 'select-study-v2' | 'sql-avanzado-study-v1' | null
}

type PedagogicalStep =
  | 'concept' | 'purpose' | 'syntax' | 'visual' | 'oracle'
  | 'guided' | 'independent' | 'quiz' | 'challenge';

interface AdvancedLessonContent {          // solo Sección 2 y siguientes
  id: `S2-L${string}`; slug: string; block: AdvancedBlockId;
  concept: string;                         // concepto
  purpose: string;                         // utilidad
  syntax: { code: string; reading: string };
  visual: { kind: 'keys' | 'join-pairs' | 'groups' | 'nested' | 'sets'; sql: string;
            sample: Record<TableName, readonly number[]> };
  oracleExample: { question: string; sql: string; reading: string; oracleNotes?: string[] };
  guided: GuidedStep[];                    // práctica guiada (construcción paso a paso)
  independent: IndependentTask[];          // práctica autónoma (laboratorio, validada)
  quiz: MiniCheck[];
  challenge: { missionIds: readonly string[] } | null;
  commonErrors: { wrong: string; oraCode?: string; fixed: string; why: string }[];
}
```

- La **Sección 1** se registra como `fundamentos`. Sus bloques son los `STUDY_BLOCKS` A–H y sus lecciones, L00–L21. Conserva su plantilla de 12 partes; en la sección 4.2 se muestra cómo cubre el patrón.
- La **Sección 2** usa `AdvancedLessonContent`. Una prueba unitaria exige que cada lección tenga los nueve pasos no vacíos, salvo `challenge`, que puede ser `null` si la lección comparte la misión de otra.

### 3.3 Ubicación por capa

| Elemento | Ubicación propuesta |
| --- | --- |
| Registro de secciones | `src/domain/sections/registry.ts` (dominio puro) y `src/application/sections.ts` (lectura para páginas y features). Se usa `sections/` para no confundirlo con `features/modules/domain/curriculum.ts` |
| Esquema y contenido de la Sección 2 | `src/features/study/domain/sql-avanzado/{outline,content-*}.ts` y `src/features/study/application/section-index.ts`. `lesson-index.ts` sigue siendo el de la Sección 1 |
| Catálogo de datos | `src/domain/dataset/{departamentos,proyectos,rangos-salariales,catalog}.ts`, con `DatabaseCatalog { id, tables, foreignKeys }`. EMPLEADOS no cambia |
| Motor SQL | `src/domain/sql/profile.ts` y archivos nuevos `relational-{ast,parser,analyzer,evaluator,render,trace}.ts`. `SelectStatement` queda intacto |
| Challenge de la Sección 2 | `src/features/challenge/domain/missions/sets.ts` (registro de conjuntos) y `missions/sql-avanzado/*` |
| Sala | parametrización por `challenge_set`, a partir de F10 |
| Oracle | `oracle/empresa-sql-v1.sql`, solo aditivo; salud de la conexión por catálogo en `src/infrastructure/oracle/*` |

### 3.4 Motor SQL por perfiles y capacidades

- `analyzeSql(source, { profile })`. El perfil por defecto es `select-v2`: el mismo parser, analizador, render y diagnósticos de hoy.
- El perfil `advanced-v1` habilita estas capacidades por lección: `table-alias`, `join`, `outer-join`, `aggregate`, `group-by`, `having`, `subquery`, `correlated-subquery`, `set-ops`.
  - Lo no habilitado sigue dando el diagnóstico de «más adelante».
  - Ese diagnóstico pasa a enlazar la lección de la Sección 2 cuando exista.
- AST nuevo:
  - `RelationalSelect`: `from: TableRef[]`, `joins`, columnas calificadas, `groupBy`, `having` y agregados.
  - `SetOperation`.
- Evaluador nuevo:
  - Sigue el orden lógico FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → operador de conjunto → ORDER BY.
  - Reutiliza `values.ts`, que implementa la lógica de tres valores.
- Traza nueva: `RelationalTrace { sources, joined, groups, havingTruth }`, para el ejemplo visual.
- Seguridad, sin cambios de principio:
  - A Oracle solo llega la sentencia canónica renderizada desde un AST validado.
  - Ese AST solo contiene tablas y columnas del catálogo.
- Compatibilidad con 19c:
  - El perfil rechaza, con un diagnóstico explicativo, `EXCEPT`, `MINUS ALL`/`INTERSECT ALL` (disponibles desde 21c) y los alias en GROUP BY/HAVING (admitidos solo desde 23ai).
  - La sintaxis `(+)` se diagnostica como «sintaxis heredada»; se enseña la forma ANSI.

### 3.5 Versionado y almacenamiento

| Elemento | Sección 1 (sin cambios) | Sección 2 (nuevo) |
| --- | --- | --- |
| Progreso | `sql-select-lab:study:progress`, `select-study-v2` | `sql-select-lab:sql-avanzado:study:progress`, `sql-avanzado-study-v1` |
| Challenge, práctica | `sql-select-lab:challenge:practice`, `select-challenge-v4` | `sql-select-lab:sql-avanzado:challenge:practice`, `sql-avanzado-challenge-v1` |
| Borrador del laboratorio | `sql-select-lab:draft:v1` | `sql-select-lab:sql-avanzado:draft:v1` |
| Dataset | `empleados-select-v2` | `empresa-sql-v1` (EMPLEADOS v2 + tablas nuevas) |
| Sala | `rooms` sin columna nueva, que equivale a `select-v4` | `rooms.challenge_set = 'sql-avanzado-v1'`, mediante migración aditiva |

Cambios mínimos necesarios:
- La clave de `BrowserStudyProgressRepository` pasa a ser inyectable.
- La firma pasa a ser `parseStudyProgress(data, releaseId, lessonIds)`.
- `challengeVersion`, `datasetId` y el conjunto de misiones pasan a ser dependencias del motor del Challenge.
- `restore-state.ts` valida contra `expected.missionOrder` y no contra el `MISSION_IDS` global.

### 3.6 Rutas y navegación

Las rutas se anidan por modo y no por sección. La Sección 1 sigue siendo la ruta canónica.

| Sección | Estudio | Challenge | Laboratorio | Exposición |
| --- | --- | --- | --- | --- |
| 1 Fundamentos SQL | `/learn`, `/learn/[slug]` (sin cambios) | `/challenge` (sin cambios) | `/lab` | `/presentation` |
| 2 SQL avanzado | `/learn/sql-avanzado`, `/learn/sql-avanzado/[slug]` | `/challenge/sql-avanzado` | `/lab?seccion=sql-avanzado` | opcional, F12: `/presentation/sql-avanzado` |
| 3 PL/SQL | `/learn/plsql` (placeholder «Próximamente») | ninguna | ninguna | ninguna |

**Navegación**
- La cabecera mantiene sus 6 entradas.
- «Aprender» y «Challenge» se activan por prefijo de ruta, así que las rutas nuevas no añaden entradas ni duplican `aria-current`.
- `/learn` muestra un selector de las tres secciones encima del índice actual de la Sección 1.
- Home añade una banda de secciones sin tocar su h1.
- `/live`, `/join/[code]`, los QR (`/challenge` en la escena 15 y `${base}/join/${code}` en la consola) y `/results` no cambian de URL.

**Redirecciones de comodidad** (`next.config.ts`, inicialmente con `permanent: false`):
- `/fundamentos` → `/learn`
- `/sql-avanzado` → `/learn/sql-avanzado`
- `/plsql` → `/learn/plsql`

**Reglas**
- Los segmentos estáticos `sql-avanzado` y `plsql` tienen prioridad sobre `[slug]`.
- Una prueba impide que una lección de la Sección 1 use los slugs reservados `sql-avanzado`, `plsql` o `fundamentos`.
- `/learn/[slug]` y `generateStaticParams` siguen sirviendo solo a la Sección 1.
- Las rutas nuevas usan `as Route` (`typedRoutes`) y llevan metadatos propios: «<lección> · SQL avanzado», con `alternates.canonical`.

**Se descarta mover la Sección 1 a `/fundamentos/...`:**
- rompería decenas de E2E, `safeLabReturn`, `content.test`, el catálogo y los QR impresos;
- no aporta ningún beneficio funcional.

---

## 4. Mapeo de la Sección 1: Fundamentos SQL

### 4.1 Qué pertenece a la Sección 1

Pertenece todo lo existente. No se renombra nada.

| Elemento | Contenido |
| --- | --- |
| Estudio | L00 introduccion · L01 empleados · L02 select · L03 from · L04 asterisco · L05 columnas · L06 expresiones · L07 precedencia · L08 alias · L09 concatenacion · L10 distinct · L11 where · L12 comparaciones · L13 and-or · L14 parentesis · L15 between · L16 in · L17 like · L18 null · L19 order-by · L20 consulta-completa · L21 errores-frecuentes |
| Bloques | A fundamentos · B primera-consulta · C duplicados · D filtrar · E operadores · F null · G ordenar · H integracion |
| Exposición | 30 escenas (portada … tabla-empleados … order-by, anatomia, paso-a-paso, errores, laboratorio, challenge, aprendimos, video, reto, proximos, cierre) |
| Challenge | M01–M10 (`select-challenge-v4`), M10 corregida en Oracle real |
| Laboratorio | LAB01–LAB24, perfil `select-v2`, diagnósticos S01–S14 |
| Recursos | chuleta, referencia, ejemplos y fuentes; vídeos V01 y V02 |
| Ruta (`/modules`) | Nivel 1 «SELECT fundamental» (AHORA) |
| Sala | creación, QR, ingreso, ranking, estadísticas y resultados sobre M01–M10 |
| Datos | EMPLEADOS `empleados-select-v2`, local y en Oracle (`oracle/empleados-select-v2.sql`) |

### 4.2 Cómo cubre la Sección 1 el patrón pedagógico

| Paso | Parte o recurso actual |
| --- | --- |
| Concepto | 1 «En una frase» + 2 «¿Qué hace?» |
| Utilidad | 3 «¿Para qué sirve?» |
| Sintaxis | 4 «Sintaxis» + 5 «Cómo leerla» |
| Ejemplo visual | 7 «Tabla de origen», 8 «Resultado», 9 «Qué cambió y qué no» (`DataView`, `HighlightTable`) |
| Ejemplo Oracle | 6 «Ejemplo» + 12 «Abrir en el laboratorio» (Oracle real cuando está configurado) |
| Práctica guiada | pasos (L20) y el laboratorio con el SQL de la lección |
| Práctica autónoma | laboratorio (LAB01–LAB24) |
| Quiz | 11 «Mini comprobación» (`MiniCheck`) |
| Challenge | misiones con su campo `lessons` |

**Huecos**, sin acción obligatoria:
- No hay misión que referencie L00, L01, L09, L15, L17, L20 ni L21.
- La práctica guiada no es un paso explícito.

Se pueden cubrir más adelante con enlaces derivados (índice inverso misión → lección), sin reescribir contenido.

### 4.3 Temas de `/modules` que no son de la Sección 2

| Nivel | Destino propuesto |
| --- | --- |
| 1 SELECT fundamental | Sección 1 |
| 2 Funciones de una fila (UPPER, ROUND, NVL…) | Decisión D4: queda como ampliación futura de la Sección 1; NVL y ROUND se introducen dentro de 2.10 |
| 3 Agrupación | Sección 2, bloque 2C |
| 4 JOIN | Sección 2, bloque 2B |
| 5 Subconsultas | Sección 2, bloque 2D |
| 6 Modificar datos (DML) y 7 Estructura (DDL) | Fuera de la Sección 2. Prerrequisitos previstos de la Sección 3 o de una sección futura (D5) |

---

## 5. Estructura de la Sección 2: SQL avanzado

### 5.1 Validación del orden

El orden base (relaciones → JOIN → agregados → GROUP BY → HAVING → integración → subconsultas → conjuntos) es válido académicamente. Coincide en lo esencial con Oracle Academy DP-SQL:
- secciones 6–7: joins, con la sintaxis Oracle (+) y los non-equijoins;
- sección 8: funciones de grupo;
- sección 9: GROUP BY y HAVING;
- sección 10: subconsultas.

Oracle Academy presenta los operadores de conjunto junto a GROUP BY y Oracle University los pone después de las subconsultas. Dejarlos al final, como propone el orden base, permite contrastar MINUS con `LEFT JOIN … IS NULL` y con `NOT EXISTS`. No se cambia el orden base: solo se desdoblan algunos puntos en varias lecciones.

Criterios de contenido Oracle:
- **Sintaxis.** Se enseña JOIN ANSI como sintaxis principal, que es la que recomienda la SQL Reference. La coma con WHERE y `(+)` se presentan solo como «lectura de código heredado» (`(+)` no admite FULL; ORA-01719 y ORA-01468).
- **NULL.** Se contrastan sus dos tratamientos: en GROUP BY, DISTINCT y los operadores de conjunto los NULL se consideran iguales; en WHERE, la comparación con NULL es desconocida.
- **Orden lógico.** El orden FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY se enseña como modelo de lectura, no como plan físico, y amplía L20.
- **Compatibilidad con 19c:** se usa MINUS y no EXCEPT; en GROUP BY y HAVING se repite la expresión en lugar de usar su alias. Para INTERSECT, la SQL Reference anuncia mayor precedencia: se recomiendan paréntesis.

### 5.2 Lecciones

Hay 19 lecciones en 5 bloques. Los ids son `S2-L01`…`S2-L19` y los slugs, kebab-case en español.

Los recuentos de la columna «Ejemplo verificable»:
- se calcularon a mano sobre `empleados.ts:134-155` y el catálogo de la sección 5.3;
- se verificaron por segunda vez en este análisis;
- deben confirmarse en Oracle en F4.

| Id | Slug | Título | Punto base | Prerrequisitos | Ejemplo verificable | Error típico (Oracle) |
| --- | --- | --- | --- | --- | --- | --- |
| **2A · Relaciones** | | | | | | |
| S2-L01 | `relaciones-pk-fk` | Relaciones entre tablas: PK, FK y alias de tabla | 1 | L01, L03, L08, L18 | EMPLEADOS.DEPARTAMENTO → DEPARTAMENTOS; ID_JEFE → ID_EMPLEADO | `FROM empleados AS e` (ORA-00933); columna ambigua (ORA-00918) |
| **2B · JOIN** | | | | | | |
| S2-L02 | `inner-join` | INNER JOIN: ON, USING y NATURAL | 2 | S2-L01 | Empleados fuera de la sede de su departamento: 11 | JOIN sin ON (ORA-00905); calificar una columna de USING (ORA-25154) o de NATURAL (ORA-25155) |
| S2-L03 | `left-outer-join` | LEFT OUTER JOIN | 2 | S2-L02 | DEPARTAMENTOS LEFT JOIN EMPLEADOS: 22 filas; departamentos sin empleados: 2 | Filtrar la tabla opcional en WHERE, lo que la convierte en INNER |
| S2-L04 | `right-outer-join` | RIGHT OUTER JOIN | 2 | S2-L03 | A RIGHT B ≡ B LEFT A | Creer que da otro resultado |
| S2-L05 | `full-outer-join` | FULL OUTER JOIN | 2 | S2-L04 | DEPARTAMENTOS–PROYECTOS: INNER 4, LEFT 8, RIGHT 5, FULL 9 | Intentarlo con `(+)`; confundirlo con CROSS |
| S2-L06 | `cross-join` | CROSS JOIN y producto cartesiano | 2 | S2-L02 | DEPARTAMENTOS × RANGOS_SALARIALES = 35 | Coma sin condición |
| S2-L07 | `self-join` | SELF JOIN | 2 | S2-L03 | Empleado–jefe: INNER 18, LEFT 20; ingresó antes que su jefe: 1 (Daniela) | Invertir `e.id_jefe = j.id_empleado` |
| S2-L08 | `non-equijoin` | JOIN con condiciones no iguales (ampliación) | 2 | S2-L02, L15 | `salario BETWEEN salario_min AND salario_max`: 20 filas | Rangos solapados duplican filas; huecos entre rangos pierden filas |
| **2C · Resumir** | | | | | | |
| S2-L09 | `funciones-agregacion` | COUNT, SUM, AVG, MIN, MAX | 3 | L18 | 20 · 91 600 000 · 4 580 000 · 2 100 000 · 9 000 000 | Columna sin agregar (ORA-00937); agregado en WHERE (ORA-00934) |
| S2-L10 | `agregados-null-distinct` | Agregados con NULL y DISTINCT (incluye NVL) | 3 | S2-L09, L10 | `COUNT(*)` 20, `COUNT(bono)` 14, `COUNT(DISTINCT bono)` 11; `AVG(bono)` 357 142,86 frente a `AVG(NVL(bono,0))` 250 000 | Creer que AVG cuenta los NULL |
| S2-L11 | `group-by` | GROUP BY | 4 | S2-L10 | Por departamento: Operaciones 3, TI 5, Ventas 5, Finanzas 4, Recursos Humanos 3. Por nivel salarial: A4 B5 C4 D5 E2 | ORA-00979; `COUNT(*)` tras LEFT JOIN da 1 al grupo vacío |
| S2-L12 | `having` | HAVING, y WHERE frente a HAVING | 5 | S2-L11, L11 | `HAVING COUNT(*) >= 4`: 3 grupos; con activos: 2. `HAVING AVG(salario) > 4500000`: 2; con activos: 3 (entra TI) | Agregado en WHERE; alias en HAVING en 19c |
| S2-L13 | `consulta-integrada` | Consulta integrada SELECT + JOIN + WHERE + GROUP BY + HAVING + ORDER BY | 6 | S2-L02–L12, L19, L20 | Activos por departamento con 3 o más, por promedio descendente: Finanzas, TI, Recursos Humanos, Ventas | Orden lógico mal aplicado |
| **2D · Subconsultas** | | | | | | |
| S2-L14 | `subconsultas-una-fila` | Subconsultas de una fila | 7 | S2-L09 | Salario mayor que el promedio: 8 | ORA-01427; una subconsulta vacía produce NULL |
| S2-L15 | `subconsultas-varias-filas` | IN, NOT IN, ANY, ALL | 7 | S2-L14, L16 | «No son jefes»: con NOT IN, 0 filas (por el NULL); corregida, 15 | NOT IN con NULL; `> ALL` sobre un conjunto vacío |
| S2-L16 | `subconsultas-correlacionadas` | Correlacionadas, EXISTS y NOT EXISTS | 7 | S2-L15 | Sobre el promedio de su departamento: 6; departamentos vacíos: 2 | Olvidar la correlación |
| S2-L17 | `subconsultas-from-select` | Vista en línea y subconsulta escalar | 7 | S2-L16 | Recuento por departamento: 0 para los vacíos | AS en el alias de la vista en línea |
| **2E · Ampliación** | | | | | | |
| S2-L18 | `union-union-all` | UNION y UNION ALL | 8 | S2-L01, L10 | Ciudades ∪ sedes: 6; con UNION ALL: 27 | ORA-01789, ORA-01790; ORDER BY intermedio |
| S2-L19 | `intersect-minus` | INTERSECT y MINUS | 8 | S2-L18 | INTERSECT: 4; empleados MINUS departamentos: Valledupar; departamentos MINUS empleados: Bucaramanga | Suponer que MINUS es conmutativo; usar EXCEPT en 19c |

S2-L04 puede fusionarse con S2-L03 si el docente lo prefiere. S2-L08 es de ampliación y no bloquea el recorrido.

### 5.3 Catálogo de datos `empresa-sql-v1` (solo aditivo)

**EMPLEADOS no cambia:** ni columnas, ni filas, ni huella. LAB01 (20 × 12), L04, M03, la huella `empleados-select-v2` y la comprobación de salud de Oracle dependen de ella.

La relación usa la clave natural DEPARTAMENTO, ya presente en EMPLEADOS y anunciada en `curriculum.ts:559,609,780`.

| Tabla | Columnas | Filas | Para qué |
| --- | --- | --- | --- |
| DEPARTAMENTOS | DEPARTAMENTO `VARCHAR2(30 CHAR)` PK, SEDE NOT NULL, PRESUPUESTO `NUMBER(12)`, que admite NULL | Operaciones/Bogotá · TI/Bogotá · Ventas/Medellín · Finanzas/Cali · Recursos Humanos/Bogotá · **Jurídica/Bucaramanga (sin empleados)** · **Mercadeo/Barranquilla/PRESUPUESTO NULL (sin empleados)** | PK/FK, INNER, LEFT/RIGHT, NOT EXISTS, MINUS |
| PROYECTOS | ID_PROYECTO PK, PROYECTO, DEPARTAMENTO FK que admite NULL, ID_RESPONSABLE FK → EMPLEADOS que admite NULL | 1 Migración a la nube/TI/6 · 2 Portal de autoservicio/TI/7 · 3 Expansión Costa/Ventas/12 · 4 Cierre contable/Finanzas/15 · **5 Plan de bienestar/NULL/NULL** | FULL OUTER con filas sin pareja en los dos lados; JOIN de 3 tablas; trampa de NOT IN con NULL |
| RANGOS_SALARIALES | NIVEL `CHAR(1)` PK, SALARIO_MIN, SALARIO_MAX, `CHECK (min <= max)` | A 1 000 000–2 999 999 · B 3 000 000–3 999 999 · C 4 000 000–4 999 999 · D 5 000 000–6 999 999 · E 7 000 000–9 999 999 | Non-equijoin, CROSS JOIN acotado, GROUP BY por nivel |

**Nombres elegidos a propósito**
- Se usa SEDE y no CIUDAD, para que `NATURAL JOIN` entre EMPLEADOS y DEPARTAMENTOS una solo por DEPARTAMENTO.
- Se usa PROYECTO y no NOMBRE, por la misma razón.

**Montaje en Oracle** (D6). No se ejecuta en esta fase.
- Un script `oracle/empresa-sql-v1.sql` crea las tablas, carga los datos y concede `READ` a la cuenta lectora.
- La FK `EMPLEADOS(DEPARTAMENTO) → DEPARTAMENTOS` no altera datos.
- Una prueba exige que la huella de EMPLEADOS siga siendo la de v2.
- La comprobación de salud pasa a hacerse por catálogo: la disponibilidad de la Sección 1 no depende de las tablas nuevas.

---

## 6. Preparación futura de la Sección 3: PL/SQL

**En esta evolución**
- `SectionDescriptor { id: 'plsql', number: 3, status: 'coming-soon', learnPath: '/learn/plsql', challengePath: null, catalogId: null, sqlProfile: null }`.
- La página `/learn/plsql` reutiliza `FeaturePlaceholder` («Próximamente»): un h1, una descripción, la lista de temas previstos y un enlace de vuelta a las secciones disponibles.
- Entrada en el buscador en el grupo «Próximamente».
- No hay laboratorio, Challenge, sala, almacenamiento ni dataset.

**Lo que no cambia**
- El laboratorio sigue prohibiendo `BEGIN`, `DECLARE` y `EXEC` (`FORBIDDEN_STATEMENTS`) y DML/DDL.

**Temas previstos**, según Oracle Academy DP-PL/SQL. Solo se listan en el placeholder:
1. Bloques anónimos, variables, `%TYPE` y ámbito.
2. SQL en PL/SQL: `SELECT INTO`, DML y transacciones.
3. Control de flujo: IF, CASE y bucles.
4. Cursores explícitos, cursor FOR y parámetros.
5. Registros (`%ROWTYPE`) y colecciones.
6. Excepciones y `RAISE_APPLICATION_ERROR`.
7. Procedimientos y funciones (IN, OUT, IN OUT).
8. Paquetes y triggers.

**Requisitos previos de una implementación real**, que quedan fuera de este plan:
- Contenidos de DML y DDL (niveles 6–7).
- Un entorno de ejecución con escritura aislada por estudiante.
- Un modelo de seguridad distinto del actual: el actual renderiza una sentencia canónica desde un AST, y eso no sirve para bloques procedimentales.
- Actualizar `PROJECT_SPEC.md`, `LAB_SPEC.md` y `ARCHITECTURE.md`.

---

## 7. Componentes reutilizables

| Componente | Ubicación | Uso en la Sección 2 | Cambio requerido |
| --- | --- | --- | --- |
| `DataView`, `DatasetExplorer`, `ColumnTabs`, `cell-format`, `ChangeSummary` | `src/presentation/components/data/*` | Sí | Pasar un `DataViewSchema` por tabla; añadir los roles opcionales `join`, `group` y `having` a `ColumnRole` |
| `HighlightTable` | `data/highlight-table.tsx` | Con cambios | Esquema explícito; hoy toma `EMPLEADOS_VIEW_SCHEMA` por defecto |
| `SchemaCards` | `data/schema-cards.tsx` | Con cambios | Campos opcionales `key?: 'PK' \| 'FK'` y `references?` |
| `SqlCode`, `highlightSql` | `data/sql-code.tsx`, `sql-semantics.ts` | Con cambios | Papeles para JOIN/ON, GROUP BY, HAVING y conjuntos; distinguir `BY` de ORDER BY y de GROUP BY |
| `QueryFlow` | `data/query-flow.tsx` | No | Se queda intacto; se crea `RelationalQueryFlow`. Hoy tiene el título fijo «Tabla EMPLEADOS de origen» |
| `SqlEditor` | `editor/sql-editor.tsx` | Sí | Ninguno |
| `MiniCheck`, `SequenceBuilder` | `interaction/*` | Sí | Mover `CheckView` a un tipo neutral o reexportarlo |
| UI base (`Alert`, `Card`, `Chip`, `Progress`, `Tabs`, `Dialog`, `Tooltip`), `QrCode`, `VideoPlayer` | `ui/*`, `media/*` | Sí | Ninguno |
| `ModuleLayout`, `SiteHeader`, `SiteFooter`, `SearchPalette` | `layouts/*`, `search/presentation` | Sí | Pie: enlace a las secciones |
| `FeaturePlaceholder` | `components/feature-placeholder.tsx` | Sí, en PL/SQL | Ninguno |
| `StudyProgress` | `features/study/presentation/study-progress.tsx` | Con cambios | Parametrizar por sección (`LESSON_COUNT`, ruta, `releaseId`) |
| `LessonPage`, `StudyIndexPage` | `features/study/presentation/study-page.tsx` | No | Plantilla de 12 partes y diccionario de EMPLEADOS. Se crea `AdvancedLessonPage` |
| Interacciones `pieces`, `hotspot`, `write-query` | `challenge/presentation/interactions/*` | Sí | Ninguno |
| Interacciones `columns`, `predict`, `row-picker`, `expression` | ídem | Con cambios | Hoy usan `ID_EMPLEADO`; deben identificar las filas por tabla |
| Motor del Challenge, puntuación, `challenge-result` | `features/challenge/{application,domain}` | Sí | Inyectar el conjunto de misiones, la versión y el dataset. El total ya se calcula a partir de la lista de misiones |
| `ModulesPage` | `features/modules/presentation` | Con cambios | Agrupar por sección; mantener las anclas `nivel-N` y `tema-*` |
| `LabWorkspace` | `features/laboratory/presentation` | Con cambios | Perfil por sección, ejemplos, textos «sobre EMPLEADOS» y `returnTo` |

---

## 8. Cambios necesarios

**Dominio**
- Registro de secciones.
- `DatabaseCatalog` con tablas y claves foráneas, y las tres tablas nuevas.
- Generalizar `EducationalDataset` a `TableData` sin cambiar EMPLEADOS.
- Perfiles y capacidades del motor; AST, evaluador, traza y render relacionales.
- Conjuntos de misiones (`MissionSet`): `MISSION_IDS` deja de ser global para el estado y la sala.
- `SqlConcept.level` pasa a ser `SectionId`/nivel, con la Sección 1 como valor por defecto.

**Aplicación**
- `section-index` para la Sección 2.
- `parseStudyProgress` parametrizado.
- `lessonNeighbors` por sección, para que L21 no enlace con S2-L01.
- `explainQuery` con varios orígenes.
- `lab-api` por perfil.
- `safeLabReturn` admite `/learn/sql-avanzado/<slug>`.
- `getPlatformNavigation` sin cambios en número de entradas.

**Infraestructura**
- Clave de progreso inyectable.
- Repositorio del Challenge por espacio de nombres.
- Comprobación de salud de Oracle por catálogo.
- Límite `maxRows` (100, `oracle-config.ts:118`) revisado por perfil (D7).

**Presentación y rutas**
- `/learn/sql-avanzado`, `/learn/sql-avanzado/[slug]`, `/learn/plsql`, `/challenge/sql-avanzado`, con sus layouts heredados.
- Selector de secciones en `/learn` y en Home.
- `AdvancedLessonPage` y `RelationalQueryFlow`.
- `SchemaCards` con PK/FK.
- Redirecciones en `next.config.ts`.

**Buscador**
- Ids `lesson-s2-<slug>` y `concept-s2-<slug>`, y grupo por sección.
- `routeExists` (`tests/unit/content.test.ts`) reconoce las rutas anidadas.

**Sala** (F10)
- Migración nueva y aditiva:
  - `rooms.challenge_set text not null default 'select-v4'`;
  - expresión regular `^(M(0[1-9]|10)|S2-M(0[1-9]|10))$`;
  - topes de `results` iguales mientras cada conjunto tenga 10 misiones.
- Zod, `room.ts`, `standings.ts` y `classroom-service.ts` parametrizados por el conjunto de la sala.

**Oracle**
- `oracle/empresa-sql-v1.sql` y su prueba de paridad.
- Concesión de `READ`.
- Sin ningún cambio en la producción hasta que se autorice (D6).

**Correcciones de contenido** en las fichas futuras de `curriculum.ts`:
- `:577`: FULL JOIN «empleados sin departamento» es imposible, porque DEPARTAMENTO es NOT NULL.
- `:528` y `:595`: «olvidar ON da producto cartesiano» es falso. En Oracle, `JOIN` sin ON da ORA-00905; el producto cartesiano sale de la coma sin condición.
- `:594`: «20 × 5 = 100» depende del número de filas de DEPARTAMENTOS.

**Documentación normativa** (precedencia de `AGENTS.md`)

| Documento | Cambio |
| --- | --- |
| `PROJECT_SPEC.md` | Alcance por secciones: hoy `:27-31` lista como futuros WHERE…ORDER BY, que ya existen; `:43` dice «L00–L08»; `:75` excluye «funciones SQL avanzadas» |
| `DATABASE_SCHEMA.md` | Catálogo `empresa-sql-v1`; READ sobre las nuevas tablas; regla de versiones |
| `LAB_SPEC.md` | Perfiles; subconjunto multi-tabla; diagnósticos ORA nuevos; compatibilidad 19c. Hoy `:36-46` y `:99` |
| `GAME_SPEC.md` | Conjunto de misiones `sql-avanzado-v1` con la misma fórmula de puntuación |
| `REALTIME_SPEC.md` | Sala con `challenge_set` |
| `CONTENT_MAP.md` | Secciones en lugar de «niveles 2–7»; patrón de 9 pasos para la Sección 2 |
| `ARCHITECTURE.md` | Registro de secciones, perfiles y catálogo |
| `UX_FLOWS.md` | Selector de secciones |
| `TEST_PLAN.md` | Casos nuevos (sección 11) |
| `ROADMAP.md` | Hitos F0–F12 |

---

## 9. Riesgos

| Área | Qué puede romperse | Detección existente | Mitigación |
| --- | --- | --- | --- |
| Home | h1 desde `unitTitle`; textos «una sola tabla», «Diez misiones» | `home.spec.ts`, `visual-pages.spec.ts` | Banda de secciones aditiva; no tocar el h1 hasta F11 |
| Learn | Concatenar índices (vecinos, porcentaje, «22 lecciones»); cambiar `releaseId`, que muestra «Recorrido actualizado» y borra el progreso | `learn.spec.ts`, `study/study.test.ts`, `study-progress-hook.test` | Índice por sección; prueba de constantes de la Sección 1 |
| Modules | Temas que pasan de «futuro» a «actual»; recuento de 46 fichas; anclas que usa el laboratorio | `modules.spec.ts`, `modules.test.ts`, `content.test.ts` | Mantener `nivel-N` y `tema-*`; cambiar estados solo en F11 y de forma deliberada |
| Search | Ids o anclas duplicados; destinos anidados no reconocidos | `search.test.ts`, `content.test.ts`, `search.spec.ts` | Ids con prefijo `s2`; ampliar `routeExists` |
| Resources | Chuleta mezclada; `level: 1` | `resources.spec.ts`, `content.test.ts` | Anclas propias `#chuleta-s2-*` |
| Presentation y presentador | Escena 29 desactualizada; `SCENE_TOTAL`; BroadcastChannel compartido | `presentation.test.ts`, `presentation-scenes.test.tsx`, `presentation.spec.ts`, `visual-presentation.spec.ts` | `/presentation` sin cambios; una baraja de la Sección 2, si se hace, con su propia clave y canal (F12) |
| QR | URL codificadas en la escena 15 y en la consola | `classroom.spec.ts`, `presentation.spec.ts` | Rutas `/challenge` y `/join/[code]` estables |
| Challenge | `MISSION_IDS` global; subir `select-challenge-v4` borraría las partidas guardadas | `challenge-m01…m10.spec.ts`, `missions.test.ts`, `persistence.test.ts`, `composition-actions.test.ts` | Registro de conjuntos; no cambiar la versión de la Sección 1 |
| Sala, ranking, resultados | Zod, la expresión regular y los topes de la base; estadísticas por misión; `/results` lee una sola clave | `classroom.spec.ts`, `memory-contract.test.ts`, `classroom-postgres.test.ts` | Salas solo de la Sección 1 hasta F10; migración aditiva con valor por defecto |
| Laboratorio | Cambiar el perfil por defecto; `returnTo`; textos de «unidad futura» | `lab.spec.ts`, `lab-diagnostics.test.ts`, `laboratory.test.ts` | `select-v2` por defecto; pruebas golden |
| Motor SQL | Un cambio compartido altera el resultado o el diagnóstico de la Sección 1 | `sql-engine.test.ts`, `oracle-real.test.ts` | AST y evaluador relacionales separados; golden del render canónico |
| Oracle real | Comprobación de salud acoplada a EMPLEADOS; límite de 100 filas (`EMPLEADOS × EMPLEADOS` = 400; `EMPLEADOS × DEPARTAMENTOS` = 140) | `oracle-real.spec.ts`, integración | Salud por catálogo; ejemplos acotados (35 filas); límite por perfil (D7) |
| Responsive y reflujo | Resultados de JOIN más anchos; altura del header | `responsive.spec.ts`, `reflow.spec.ts`, `visual-responsive-data.spec.ts` | Sin entradas nuevas en el menú; regla `minmax(0, 1fr)`; añadir las rutas nuevas a esas specs |
| Accesibilidad | Más de un h1; `aria-current` duplicado; selector sin nombre accesible | axe en `routes.spec.ts` y otras | `sections.spec.ts` nueva, con axe |
| Fronteras | Código en `src/content`; páginas que importan dominio | `architecture.test.ts`, lint | Ubicaciones de la sección 3.3 |
| localStorage | Visitar la Sección 2 modifica claves de la Sección 1 | `persistence.test.ts` | Prueba explícita de aislamiento de claves |
| Honestidad del resultado | Presentar el evaluador educativo como ejecución de Oracle | revisión de textos | Mantener las etiquetas «vista educativa» frente a «Oracle real» (`AGENTS.md`) |
| Ramas | Implementar sobre `main`, que no tiene la aplicación | — | D1 antes de F0 |
| Rendimiento | Contenido de la Sección 2 en JavaScript de cliente; SSG de 19 páginas más | build | Contenido por lección cargado en el servidor; medir el tamaño del bundle en F7 |

---

## 10. Orden de implementación por fases

Cada fase va en una rama o PR propia y es reversible.

**Verificación base de todas las fases:**
- `npm run lint`, `typecheck`, `format:check`, `test:unit` y `build`.
- Las E2E indicadas en cada fase.
- En cada cierre se actualizan `CONTINUITY.md` y `PROJECT_STATUS.md`.

| Fase | Contenido | Verificación y aceptación |
| --- | --- | --- |
| **F0 · Base y normas** | Resolver D1 (rama base) y D2–D7. Actualizar `PROJECT_SPEC`, `CONTENT_MAP`, `ARCHITECTURE`, `ROADMAP` y `TEST_PLAN` con el alcance por secciones. Corregir las fichas erróneas de `curriculum.ts` | Documentos coherentes entre sí; sin cambios de comportamiento |
| **F1 · Red de seguridad** | Pruebas golden: SQL canónico, resultados y diagnósticos de las lecciones L00–L21, de las escenas y de LAB01–LAB24. Prueba de constantes de almacenamiento y versiones. Prueba de slugs reservados | Toda la suite en verde sin tocar código de producción |
| **F2 · Registro de secciones** | Dominio `sections`; clave de progreso inyectable; `parseStudyProgress` parametrizado; conjunto de misiones inyectable. Sin interfaz nueva | Las E2E `routes`, `learn`, `search`, `modules` y `challenge-*` pasan sin modificaciones |
| **F3 · Esqueleto de rutas** | `/learn/sql-avanzado` (bloques «En preparación»), `/learn/plsql` (`FeaturePlaceholder`), selector en `/learn`, banda en Home, catálogo y buscador, redirecciones, `routeExists` | Nueva `sections.spec.ts` con axe; `routes`, `responsive`, `reflow` y `visual-pages` ampliadas; la barra sigue con 6 entradas |
| **F4 · Catálogo de datos** | `TableData`, DEPARTAMENTOS, PROYECTOS y RANGOS_SALARIALES; `DatabaseCatalog`; `oracle/empresa-sql-v1.sql` probado solo en Oracle local; salud de Oracle por catálogo | Huella de EMPLEADOS idéntica; paridad del script; recuentos de la sección 5.2 confirmados en Oracle local |
| **F5 · Motor por capacidades** | Cada entrega por separado: F5a alias de tabla, INNER/CROSS/SELF JOIN, `RelationalQueryFlow`, `SchemaCards` PK/FK y `sql-semantics` · F5b LEFT/RIGHT/FULL · F5c agregados con NULL/DISTINCT · F5d GROUP BY/HAVING · F5e subconsultas (una fila, varias filas, correlacionadas, FROM, escalar) · F5f operadores de conjunto | Golden de la Sección 1 idéntico; pruebas unitarias por capacidad; paridad con Oracle real de las consultas de la Sección 2; diagnósticos ORA verificados |
| **F6 · Plantilla de lección** | `AdvancedLessonContent`, `AdvancedLessonPage`, progreso de la Sección 2, `lessonNeighbors` por sección | Una prueba exige los 9 pasos; prueba de aislamiento de claves |
| **F7 · Unidad piloto 2A + S2-L02** | Relaciones y INNER JOIN de principio a fin; laboratorio `?seccion=sql-avanzado` y `returnTo` | Nueva `learn-advanced.spec.ts` con axe; `lab.spec.ts` sin regresión; validación docente del piloto |
| **F8 · Resto de lecciones** | Un PR por bloque: 2B → 2C → 2D → 2E | Misma batería que F7 por bloque; integración Oracle de los ejemplos |
| **F9 · Challenge de la Sección 2 (práctica)** | `/challenge/sql-avanzado`, conjunto `sql-avanzado-v1` con 10 misiones y la fórmula de GAME_SPEC; `/results` por sección; `GAME_SPEC` actualizado | `challenge-m01…m10` intactas; nuevas `challenge-s2-*.spec.ts` |
| **F10 · Sala con varios conjuntos** | Migración aditiva `challenge_set`; repositorios Supabase y memoria; consola con selector de conjunto; `REALTIME_SPEC` actualizado | `classroom-postgres`, `memory-contract`, `classroom.spec` en verde; QR sin cambios; ensayo en Supabase remoto antes de producción |
| **F11 · Textos e identidad** | Escena 29, «Próximos» de Home, `/modules` por secciones, diagnósticos del laboratorio que enlazan a lecciones de la Sección 2, `unitTitle` y marca (D8) | Actualizar de forma deliberada `lab-diagnostics.test.ts`, `lab.spec.ts:170`, `presentation-scenes.test.tsx:197-200`, `modules.spec.ts` y `home.spec.ts` |
| **F12 · Opcional** | Exposición de la Sección 2 (`/presentation/sql-avanzado`) con su propia memoria de escena y su propio canal | `presentation.spec.ts` intacta; spec nueva |

### Misiones propuestas para `sql-avanzado-v1` (F9)

Son una idea: los enunciados se definen en `GAME_SPEC.md`.

| Id | Misión | Lecciones | Interacción |
| --- | --- | --- | --- |
| S2-M01 | Une cada FK con su PK | S2-L01 | nueva: emparejar claves |
| S2-M02 | Empleados fuera de la sede de su departamento | S2-L02 | build-query |
| S2-M03 | Departamentos sin empleados | S2-L03, S2-L04 | predict-result |
| S2-M04 | Clasifica las 9 filas del FULL OUTER JOIN | S2-L05, S2-L06 | predict-result |
| S2-M05 | Quién ingresó antes que su jefe | S2-L07 | write-query |
| S2-M06 | Predice el resumen (con NULL y DISTINCT) | S2-L09, S2-L10 | predict-result |
| S2-M07 | Plantilla por nivel salarial | S2-L08, S2-L11 | build-query |
| S2-M08 | ¿WHERE o HAVING? Por qué entra TI | S2-L12 | hotspot-error |
| S2-M09 | Tres caminos, un resultado: LEFT JOIN … IS NULL, NOT EXISTS y MINUS, más la trampa de NOT IN | S2-L14–S2-L19 | reorder-sql / hotspot-error |
| S2-M10 | Final Boss: consulta integrada corregida en Oracle real | S2-L13 | write-query |

---

## 11. Criterios de aceptación

### Globales: la migración no rompe nada

1. Todas las pruebas existentes pasan sin modificarse, salvo las que F11 enumera de forma explícita.
2. **URL de la Sección 1:** `/`, `/learn`, `/learn/<22 slugs>`, `/modules`, `/resources`, `/presentation`, `/presentation/presentador`, `/lab`, `/challenge`, `/live`, `/join/<code>`, `/presenter`, `/presenter/<code>` y `/results` responden igual que antes. Se mantienen los anclajes `#chuleta-*`, `#nivel-N` y `#tema-*`.
3. **Persistencia:** las claves y versiones de almacenamiento de la Sección 1 no cambian. Un progreso y una partida guardados antes de la migración se restauran sin el aviso de «Recorrido actualizado».
4. **QR:** los de la escena 15 y de la consola de la sala codifican las mismas URL.
5. **Cabecera:** mantiene 6 entradas. Cada página tiene un solo h1 y una sola entrada con `aria-current`.
6. **Accesibilidad y diseño:**
   - sin infracciones de axe nuevas;
   - sin desplazamiento horizontal a 320 px;
   - reflujo correcto al 200 % en las páginas nuevas.
7. **Arquitectura:** el lint de fronteras pasa y no hay código en `src/content`.
8. **Motor SQL:** el SQL canónico, los resultados y los diagnósticos de la Sección 1 coinciden con las pruebas golden de F1.
9. **Oracle:** la comprobación de salud de la Sección 1 no depende de las tablas nuevas. Ninguna vista educativa se presenta como ejecución de Oracle.
10. No se publican credenciales ni `.env`. Ningún cambio se aplica en Oracle Cloud ni en Supabase de producción sin autorización.

### Sección 2

1. **Contenido:**
   - 19 lecciones en 5 bloques, en el orden de la sección 5.2;
   - cada lección tiene los 9 pasos (prueba unitaria);
   - cada lección tiene ejemplos verificados en Oracle (prueba de integración).
2. **Motor:** acepta cada capacidad solo en las lecciones que la habilitan. Lo no habilitado sigue dando el diagnóstico de «más adelante». Las construcciones que no admite 19c tienen un diagnóstico explicativo.
3. **Datos:** el catálogo `empresa-sql-v1` es aditivo. La huella de EMPLEADOS coincide con la de `empleados-select-v2`.
4. **Progreso:** el progreso, el Challenge y el borrador de la Sección 2 usan su propio espacio de nombres. Visitar la Sección 2 no modifica las claves de la Sección 1.
5. **Navegación:** «Siguiente» en L21 no lleva a la Sección 2. El acceso a la Sección 2 es explícito, desde el selector de secciones.
6. **Challenge:** el de la Sección 2 aplica la fórmula de puntuación vigente de `GAME_SPEC.md`. La sala solo admite un conjunto de misiones por sala.

### Sección 3

1. `/learn/plsql` muestra «Próximamente», con un h1, los temas previstos y un enlace de retorno. No hay laboratorio, Challenge ni almacenamiento asociados.
2. Añadir la Sección 3 más adelante solo requiere cambiar su estado en el registro y añadir sus rutas y contenido. No exige refactorizar las Secciones 1 y 2.

---

## 12. Decisiones pendientes

Las toman el responsable del proyecto o el docente.

| Id | Decisión | Recomendación |
| --- | --- | --- |
| D1 | Rama base de la implementación | Partir de `claude-final-ui-polish-20260926`, que contiene la aplicación desplegada. `main` no la contiene |
| D2 | Clave de DEPARTAMENTOS | Clave natural `DEPARTAMENTO` como PK, sin tocar EMPLEADOS. La alternativa, `ID_DEPARTAMENTO` con `NOMBRE UNIQUE`, obliga a una FK hacia una clave no primaria |
| D3 | Tablas PROYECTOS y RANGOS_SALARIALES | Sí. PROYECTOS es imprescindible para un FULL OUTER JOIN con filas sin pareja en ambos lados; RANGOS_SALARIALES sirve para el non-equijoin |
| D4 | Funciones de una fila (nivel 2) | NVL y ROUND dentro de S2-L10. El resto, como ampliación futura de la Sección 1 |
| D5 | DML y DDL (niveles 6–7) | Fuera de la Sección 2, como prerrequisito previsto de la Sección 3 |
| D6 | Esquema de Oracle para las tablas nuevas | Añadirlas al esquema actual, sin cambiar los datos de EMPLEADOS. Ensayar primero en local y aplicar en la nube solo con autorización |
| D7 | Límite de 100 filas en Oracle | Mantenerlo y diseñar ejemplos de 100 filas o menos (CROSS JOIN de 35). Revisarlo por perfil solo si el docente pide productos completos |
| D8 | Marca «SQL SELECT LAB» y `unitTitle` | Conservar la marca hasta F11 y decidir allí si el nombre general cambia |

