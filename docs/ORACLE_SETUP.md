# ORACLE_SETUP — Conectar el laboratorio y M10 a Oracle

Versión 1.0 · Fase 8 · Relacionado con [LAB_SPEC.md](LAB_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

El laboratorio (`/lab`) y la calificación final de M10 ejecutan SQL en una base **Oracle real** con el driver oficial `oracledb` (modo Thin, sin Oracle Client). Sin configuración, la plataforma informa «Oracle no conectado»: nunca simula una ejecución.

## Variables imprescindibles

Solo en el servidor (`.env.local` en desarrollo o el panel del proveedor en despliegue). Nunca con prefijo `NEXT_PUBLIC_`.

| Variable                | Obligatoria | Valor                                                                                                |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ORACLE_USER`           | Sí          | Cuenta **lectora** del laboratorio. Se rechazan SYS, SYSTEM y demás cuentas administrativas.         |
| `ORACLE_PASSWORD`       | Sí          | Contraseña de esa cuenta.                                                                            |
| `ORACLE_CONNECT_STRING` | Sí          | `host:puerto/servicio`, por ejemplo `db.universidad.edu:1521/FREEPDB1`.                              |
| `ORACLE_SCHEMA`         | No          | Esquema propietario de `EMPLEADOS` si no es la cuenta lectora (recomendado). Se fija en cada sesión. |
| `ORACLE_POOL_MAX`       | No          | Conexiones del grupo (10 por defecto, LAB_SPEC).                                                     |
| `ORACLE_QUEUE_MAX`      | No          | Peticiones en espera (60 por defecto); si la cola se llena, «ocupado» sin consumir intento.          |
| `ORACLE_TIMEOUT_MS`     | No          | Plazo total desde la recepción, incluida la cola (5000 por defecto; entre 500 y 30000).              |

## Requisitos de la base

1. Tabla `EMPLEADOS` con el dataset `empleados-select-v1`: script [`oracle/empleados-select-v1.sql`](../oracle/empleados-select-v1.sql) (una prueba unitaria garantiza que coincide con `src/domain/dataset/empleados.ts`).
2. Propietario distinto de la cuenta lectora; idealmente sin inicio de sesión (`CREATE USER ... NO AUTHENTICATION`).
3. Cuenta lectora solo con `CREATE SESSION` y `READ` (o `SELECT`) sobre `EMPLEADOS`. `READ` impide `SELECT ... FOR UPDATE`.

Antes de ejecutar nada, el servidor comprueba la **salud real** (cada 30 s): lee `EMPLEADOS` y la compara con el dataset versionado, y verifica que la cuenta no tenga privilegios de sistema distintos de `CREATE SESSION`, ni tablas propias, ni permisos sobre `EMPLEADOS` distintos de lectura. Si algo no cumple, el laboratorio se declara no disponible y explica por qué.

## Opción A — Oracle Database Free local (Docker)

Imagen oficial `container-registry.oracle.com/database/free:latest-lite` (Oracle Database 23ai Free, unos 900 MB comprimidos). El puerto solo se publica en `127.0.0.1`.

```bash
npm run oracle:up
```

```bash
npm run oracle:setup
```

`oracle:up` crea el contenedor `sql-select-lab-oracle` con una contraseña de administración aleatoria guardada en `.env.oracle.local` y espera a que la base esté lista (varios minutos la primera vez). `oracle:setup` crea `SQL_LAB_OWNER` (sin inicio de sesión) con `EMPLEADOS`, y `SQL_LAB_READER` con `CREATE SESSION` y `READ`; escribe las cuatro variables en `.env.local`. Ningún comando imprime contraseñas y ambos archivos están ignorados por Git. `npm run oracle:down` detiene el contenedor sin borrar los datos.

Motor de contenedores: el script usa Docker si su motor responde. En Windows, si Docker Desktop no arranca, usa **Podman dentro de WSL** (distribución `Ubuntu` por defecto, `ORACLE_LOCAL_WSL_DISTRO` para otra), sin ventana ni licencia que aceptar. Instalación única de Podman desde los repositorios de Ubuntu:

```bash
wsl -d Ubuntu -u root -- apt-get install -y podman
```

WSL reenvía el puerto a `127.0.0.1:1521` de Windows. `ORACLE_LOCAL_ENGINE=docker` o `wsl-podman` fuerza un motor. Esta es la configuración con la que se validó la Fase 8.

## Opción B — Instancia propia (universidad o nube)

1. Como administrador, ejecutar `oracle/empleados-select-v1.sql` en el esquema propietario.
2. Crear la cuenta lectora y conceder solo `CREATE SESSION` y `READ ON <propietario>.EMPLEADOS`.
3. Definir las variables de la tabla anterior en el servidor. El servicio que ejecuta la web necesita red hasta el puerto de Oracle; no se asume que un alojamiento serverless la tenga.

## Cómo se ejecuta una consulta

Editor → analizador del subconjunto (`src/domain/sql`) → sentencia canónica construida desde el árbol (nunca el texto original) → grupo de conexiones → Oracle → filas, tipos y motor → pantalla o calificación (M10). Una consulta rechazada por el analizador no llega a Oracle. Al arrancar, el servidor precalienta el grupo y la salud (`src/instrumentation.ts`, como máximo 8 s) para que la primera consulta tras un reinicio no pague la creación del grupo. Límite de 100 filas y 100 KB: si se superara, no se muestra ni se califica.

Errores: los de SQL de Oracle se muestran con su código ORA real y un mensaje pedagógico (`ORA-01476` al dividir entre cero); conexión, credenciales, cola y plazo son de infraestructura, no consumen intentos y nunca exponen detalles de la conexión. Una sesión interrumpida por el plazo se retira del grupo.

## Pruebas

- Sin credenciales: `npm run test:unit` prueba el adaptador con un driver simulado (configuración, errores, plazo, precisión decimal, límites y salud).
- Con credenciales: la misma orden ejecuta además `tests/integration/oracle-real.test.ts` contra la base (LAB01–LAB15 y M10), y `npm run test:e2e` recorre `/lab` y M10 con Oracle.
- Para ejecutar las E2E sin Oracle aunque exista `.env.local`: `ORACLE_USER= ORACLE_PASSWORD= ORACLE_CONNECT_STRING= npm run test:e2e`.
