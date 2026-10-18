# S2_S3_FINAL_QA — Cierre pedagógico, visual y de producción de las secciones 2 y 3

Fecha: 17 de octubre de 2026. Rama: `codex-final-pedagogy-ui-20261004`. Parte de la reestructura `49468e6` ([S2_S3_PEDAGOGICAL_RESTRUCTURE.md](S2_S3_PEDAGOGICAL_RESTRUCTURE.md)) y no cambia su arquitectura.

Todas las cifras de este documento salen del código, de las pruebas o del registro de Oracle (`src/features/curriculum/application/oracle-results.json`). No hay cifras escritas a mano.

## 1. Cifras verificadas

| Sección | Bloques | Lecciones (núcleo · apoyo · ampliación) | Escenas | Prácticas | Misiones (pasos) | Fichas | Ejemplos Oracle |
| ------- | ------- | --------------------------------------- | ------- | --------- | ---------------- | ------ | --------------- |
| S2      | 15      | 25 (12 · 4 · 9)                         | 145     | 22        | 10 (20)          | 32     | 137             |
| S3      | 17      | 29 (15 · 6 · 8)                         | 167     | 26        | 10 (21)          | 34     | 133             |

### Reconciliación de Oracle: 313 ejemplos

El informe anterior daba 281 en total y 128 + 110 = 238 por sección. Los 43 restantes no eran de S2 ni de S3:

| Origen                                              | Prefijo | Ejemplos |
| --------------------------------------------------- | ------- | -------- |
| Ampliación curricular de S1 (funciones de una fila) | `S1-E`  | 9        |
| S2 (lecciones, microejemplos, práctica)             | `S2-*`  | 137      |
| S3 (lecciones, microejemplos, práctica)             | `S3-*`  | 133      |
| Consultas propias del banco de evaluación de S2     | `S2-B`  | 20       |
| Bloques propios del banco de evaluación de S3       | `S3-B`  | 14       |
| **Total**                                           |         | **313**  |

Antes del cierre: 9 + 128 + 110 + 20 + 14 = 281. El cierre añade 32 ejemplos, todos ejecutados en Oracle Database 23:

- 31 ejemplos correctos de «error para aprender»: 8 en S2 y 23 en S3;
- `S2-E-NOMINA-DEPTO`.

Además, `S3-L04-MICRO` se volvió a ejecutar porque cambió.

## 2. Auditoría semántica de los 54 temas

Se leyó el contenido completo de cada tema: problema, definiciones, requisitos, modelo, tablas, sintaxis por partes, lectura, microejemplo, ejemplo, cambió y no cambió, idea clave, errores, comprobación y práctica. Defectos encontrados y corregidos:

| Tema                             | Defecto                                                                                                                                       | Corrección                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S2-L18 JOIN + agregación         | No construía «¿cuánto cuesta la nómina de cada departamento y cuántos empleados tiene?»                                                       | Ejemplo nuevo `S2-E-NOMINA-DEPTO` y partes FROM, JOIN, ON, GROUP BY, SUM y COUNT por separado; el LEFT JOIN queda como segundo paso                                                     |
| S2-L18                           | La sintaxis usaba columnas que no existen (`d.nombre`, `d.id`)                                                                                | Sintaxis con las columnas reales                                                                                                                                                        |
| S2-L19                           | El problema (nómina por área) no coincidía con su ejemplo (horas por proyecto)                                                                | Problema reescrito para el ejemplo de proyectos                                                                                                                                         |
| S2-L03 y S2-L04                  | El alias se suponía                                                                                                                           | «e es el alias de EMPLEADOS; d, de DEPARTAMENTOS»                                                                                                                                       |
| S3-L04 Variables                 | El microejemplo introducía variable y CONSTANT a la vez                                                                                       | Un solo concepto: declarar, inicializar y asignar con `:=`                                                                                                                              |
| S3-L05 %TYPE                     | El microejemplo adelantaba %ROWTYPE                                                                                                           | Sin %ROWTYPE; queda en S3-L29                                                                                                                                                           |
| S3-L14 Cursor explícito          | El modelo no mostraba «procesar» fila a fila                                                                                                  | CURSOR → OPEN → FETCH fila 1 → procesar → FETCH fila 2 → … → %NOTFOUND → CLOSE                                                                                                          |
| S3-L15 Cursor FOR (comprobación) | Había que leer un bloque de 18 líneas                                                                                                         | Se muestra solo el cuerpo, con lo que devuelve el cursor; el bloque completo queda plegado                                                                                              |
| S3-L20 Función                   | El modelo usaba una función que no existe (`calcular_bono`)                                                                                   | `doble(3) → RETURN 6` y la definición «subprograma con nombre que devuelve un valor»                                                                                                    |
| S3-L18 y S3-L23                  | Definiciones distintas de las del profesor                                                                                                    | Procedimiento: «subprograma con nombre que realiza una tarea». Trigger: «bloque PL/SQL almacenado que Oracle ejecuta automáticamente cuando ocurre el evento para el cual fue definido» |
| S3-L23 Trigger                   | El cuerpo no era una rama más de la estructura                                                                                                | Árbol TRIGGER → MOMENTO · EVENTO · NIVEL · CUERPO                                                                                                                                       |
| 18 modelos mentales              | Columnas alineadas que se partían en el lienzo de clase                                                                                       | Reescritos en vertical, a 64 caracteres o menos                                                                                                                                         |
| 25 escenas curadas               | Títulos o notas del docente de la versión anterior; por ejemplo, «%TYPE y %ROWTYPE», «WHILE y FOR» o una transición a un tema que ya no sigue | Títulos y notas reescritos con el orden y los ejemplos vigentes                                                                                                                         |

Comprobado sin defectos:

- INNER JOIN conserva solo las parejas, con el caso de Esteban; LEFT JOIN usa el mismo caso.
- SELF JOIN muestra ID_EMPLEADO, NOMBRE e ID_JEFE antes del SQL.
- CROSS JOIN explica n × m (2 × 3 = 6; 6 × 7 = 42).
- Las funciones de grupo empiezan con dos salarios visibles.
- GROUP BY sigue el recorrido filas → grupos → una fila por grupo.
- WHERE frente a HAVING sigue el recorrido tabla → WHERE → GROUP BY → HAVING.
- S3: el primer bloque es BEGIN … END, después DECLARE y después EXCEPTION. Variables → inicialización → %TYPE; `=` compara y `:=` asigna. IF parte de una decisión dibujada; FOR, de i = 1…5.
- Cursor implícito y explícito están definidos antes de usarse.
- Orden función → procedimiento → paquete, con el árbol del paquete.
- Triggers: sentencia (1 ejecución) frente a fila (3); :OLD y :NEW con el antes y el después; AUDITORIA_SALARIOS vacía antes del UPDATE.

## 3. Errores de Oracle: «error para aprender»

Cada uno de los 35 ejemplos que fallan a propósito (10 en S2 y 25 en S3) muestra cinco partes:

1. Qué ocurrió;
2. Por qué ocurrió;
3. Cómo corregirlo;
4. Ejemplo correcto, ejecutado en Oracle;
5. Detalle técnico (ORA o PLS y el mensaje), plegado.

En clase, el ejemplo correcto se pliega bajo su título. Las pruebas exigen:

- los tres textos;
- ningún código técnico en «qué ocurrió» ni en «por qué»;
- el ejemplo correcto en la misma sección, ejecutado sin error en Oracle;
- que use solo lo enseñado en la lección que muestra el error.

Además se reescribieron 26 textos de lecciones, prácticas y escenas que presentaban el código como mensaje principal («Oracle responde ORA-…»).

## 4. Escenas: 312 auditadas

- **Auditoría automática de cada escena**, en 12 tamaños, que mide:
  - cuerpo vacío o casi vacío;
  - desplazamiento interno;
  - desbordamiento horizontal;
  - contenido cortado a los lados;
  - textos superpuestos;
  - tablas con letra menor de 12 px.
- **Resultado:**
  - 1920 × 1080, 1600 × 900, 1440 × 900 y 1366 × 768: sin ningún problema.
  - 1280 × 720 y 1024 × 768: 6 escenas con 6–31 px de desplazamiento interno, sin texto cortado ni superposición (ver limitaciones).
  - Seis tamaños móviles y de tableta: sin desbordamiento, cortes ni superposiciones. En móvil, el desplazamiento vertical es el comportamiento previsto.
- **Revisión visual:** 68 capturas de 1366 × 768, revisadas una a una:
  - la introducción y el ejemplo principal de cada tema de la lista del encargo;
  - las portadas;
  - las prácticas;
  - dos lecciones de Estudio.
- **Ajustes del lienzo de clase:**
  - el resultado se limita a 6 filas e indica el total («6 de 19 filas»);
  - el código PL/SQL largo ocupa la columna izquierda a toda altura;
  - en el recorrido paso a paso, la pregunta va junto al estado;
  - la fila que explica el tema (Esteban con NULL, Investigación con 0) se ve sin desplazar;
  - la leyenda del JOIN muestra solo los casos presentes;
  - el código se mantiene en 14 px como mínimo y los controles en 32 px como mínimo.
- **Fusiones y eliminaciones:** ninguna. Ninguna escena duplica a la anterior: la auditoría no encontró pares consecutivos con más del 60 % de vocabulario común en su texto visible inicial; el máximo, 56 %, es el microejemplo y el ejemplo de JOIN de tres tablas, con consultas distintas. Ninguna está vacía.
- **Escena nueva:** `join-nomina` en S2-L18.

`check-S2-L25` y `check-S3-L15` caben sin desplazar desde 1280 × 720:

- `check-S2-L25` mantiene sus seis piezas y su respuesta; las piezas, de 36 px, superan el mínimo de 24 px de WCAG 2.5.8.
- `check-S3-L15` muestra el fragmento con el bloque completo plegado.

## 5. Pruebas sobre el código final

| Gate                                                 | Resultado                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, typecheck y formato                            | PASS                                                                                                                                  |
| Build de producción                                  | PASS                                                                                                                                  |
| Contrato pedagógico (`pedagogical-contract.test.ts`) | 36/36                                                                                                                                 |
| Vitest completo (unitarias e integración)            | 2349 pasan, 7 omitidas; 0 fallos                                                                                                      |
| Integración                                          | 744 pasan (Oracle real 313/313, banco en Oracle, Supabase local, PostgreSQL); 5 omitidas, el humo remoto, que se ejecuta aparte       |
| E2E Chromium (383)                                   | 377 pasan en la ejecución completa; 2 fallos reales y 4 dependientes. Al corregir el total (abajo), los dos archivos repetidos: 10/10 |
| E2E Edge (383)                                       | 382 pasan; 1 fallo de entorno (`net::ERR_NO_BUFFER_SPACE`, búferes de red de Windows) que pasa al repetirlo                           |
| E2E WebKit (383)                                     | 383/383 pasan en la ejecución completa (36,7 min), sin repeticiones ni omisiones                                                      |

Fallos encontrados por la E2E y corregidos: la portada y el resumen de cuentas esperaban «78 lecciones». La lección S3-L29 (%ROWTYPE) de la reestructura eleva el total a 79 (25 + 25 + 29). Es un cambio legítimo de la cifra, no un ajuste para que la prueba pase.

Accesibilidad: axe WCAG 2.2 AA en las suites E2E de los tres navegadores (rutas públicas, Estudio, Clase, Práctica, Challenge, Recursos, cuentas, panel docente y evaluaciones), además de teclado, foco y movimiento reducido. Target Size: los controles de clase miden 32–36 px de alto, por encima de los 24 px de WCAG 2.5.8. El tamaño del texto se mide aparte: la letra del lienzo no baja de 14 px.

## 6. Regresión

S1, autenticación, panel docente, evaluaciones y banco no se modificaron. Sus suites pasan en los tres navegadores:

- S1: Inicio, Secciones, Estudio, Clase, Práctica, Challenge, Recursos y Lab;
- inicio y cierre de sesión, y recuperación con Mailpit local;
- roles de estudiante y docente;
- crear, editar, publicar, realizar, autoguardar, entregar, resultados y retroalimentación de una evaluación;
- sala En vivo.

El banco oficial sigue con 50 + 50 + 50 = 150 preguntas y sin cambios de claves.

## 7. Preview y Production

| Campo             | Valor                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commit desplegado | `66a0093` («Cierre pedagógico y visual de las secciones 2 y 3»), subido a `origin/codex-final-pedagogy-ui-20261004`                                                                                                            |
| Preview           | https://sql-select-2n9tf7d9t-jorge-gutierrez1.vercel.app · `dpl_9UJVP8byRZfSeP1s9XfiH3y8PT4T` · Ready                                                                                                                          |
| Production        | https://sql-select-lab.vercel.app → `dpl_7UoxANWpMZz1Txnc5TVG756E6fVy` (https://sql-select-8vh9j59yv-jorge-gutierrez1.vercel.app), creado con `vercel promote` del Preview validado: mismo código, configuración de Production |
| Rollback          | Production anterior `dpl_3B21kJiREVMckxHd3b8r4xxieXH7` (https://sql-select-rbb4l4wft-jorge-gutierrez1.vercel.app, commit `ab1a620`): `vercel promote` de esa URL. No se ejecutó                                                |

QA sobre Preview (`playwright.remote.config.ts`, Chromium, un worker; sin suites superpuestas):

- **Sala, cuentas y evaluaciones:** 26/26.
  - Sala real con QR, respuesta, ranking y cierre.
  - Cabeceras de seguridad y archivos privados inaccesibles.
  - Avance de invitado sincronizado en otra sesión.
  - En S1, S2 y S3, con docente y alumno temporales: crear, publicar, responder sin conexión, entregar y liberar la retroalimentación.
  - Motivo real de fin de intento.
  - Páginas públicas a varios anchos, reflujo y axe WCAG 2.2 AA.
- **Rutas y secciones:** 185 tests, 184 pasan en la primera ejecución.
  - Inicio, secciones, currículo, búsqueda, rutas, S1 (Estudio y Exposición), Recursos, Lab, módulos, Challenge M01–M03 y la barrida de escenas de S2 y S3 en cinco anchos.
  - El fallo fue un test del Lab que tardó 37,7 min con límite de 30 s, mientras el equipo suspendía la red. Al repetir `lab.spec.ts`: 7/7.
- **Supabase remoto aislado:** 5/5.
  - Anónimo sin lectura.
  - Banco 50 + 50 + 50, sincronización idempotente sin cambios.
  - Intento, autoguardado, entrega y retroalimentación con RLS en las tres secciones.

QA sobre Production (`PHASE5_REMOTE_QA=production`):

- **Primera ejecución:** 140 tests, 139 pasan. Cubre portada, secciones, currículo S2/S3, búsqueda, rutas, Lab con Oracle Cloud, S1 Estudio, Recursos, Challenge, cuentas y evaluaciones de las tres secciones, y axe.
- **El fallo:** «M01 con arrastre de ratón» falla también en la Production anterior, así que no lo introduce este release.
  - Causa: `@dnd-kit/core` ignora los clics durante 50 ms después de soltar una pieza. Playwright pulsaba «Comprobar» antes.
  - No afecta a una persona: comprobado con el mismo arrastre seguido de una pausa breve.
  - El helper del test espera ahora ese intervalo, documentado en el código.
  - Challenge en Production tras el cambio: 21/21 en tres ejecuciones seguidas. En local, Chromium, Edge y WebKit: 63/63.
- **Comprobación de versión:** Production sirve el contenido exclusivo de `66a0093`: la lección «Nómina y personas por departamento con JOIN» y «Ejemplo correcto · Oracle lo ejecuta sin error» en el error para aprender.

El commit posterior a `66a0093` solo contiene esta documentación y el helper de la prueba. La aplicación publicada es exactamente `66a0093`.

## 8. Limitaciones reales

- En proyectores de 1280 × 720 o 1024 × 768, seis escenas tienen entre 6 y 31 px de desplazamiento interno. El contenido es alcanzable y no hay texto cortado. Son:
  - S2: LEFT JOIN de áreas sin personas, FULL JOIN y COUNT con LEFT JOIN;
  - S3: IF, cursor explícito y excepciones, con su recorrido paso a paso.
  - Desde 1366 × 768, todas las escenas caben.
- Sin revisión con estudiantes principiantes reales, proyector físico, lector de pantalla manual ni zoom nativo del navegador.
- Firefox no se ejecuta en este equipo (falla al iniciar); no se declara probado.
- El correo remoto de Supabase (SMTP propio) sigue fuera de alcance, como en la Fase 5.
