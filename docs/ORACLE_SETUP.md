# ORACLE_SETUP — Conectar el laboratorio y M10 a Oracle

Versión 2.0 · Dataset `empleados-select-v2` en esquemas `SQL_LAB_V2_*` (25 de septiembre de 2026) · Relacionado con [LAB_SPEC.md](LAB_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

El laboratorio (`/lab`) y la calificación final de M10 ejecutan SQL en una base **Oracle real** con el driver oficial `oracledb` (modo Thin, sin Oracle Client). Sin configuración, la plataforma informa «Oracle no conectado»: nunca simula una ejecución.

## Variables imprescindibles

Solo en el servidor (`.env.local` en desarrollo o el panel del proveedor en despliegue). Nunca con prefijo `NEXT_PUBLIC_`.

| Variable                | Obligatoria | Valor                                                                                                |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `ORACLE_USER`           | Sí          | Cuenta **lectora** del laboratorio. Se rechazan SYS, SYSTEM, ADMIN y demás cuentas administrativas.  |
| `ORACLE_PASSWORD`       | Sí          | Contraseña de esa cuenta.                                                                            |
| `ORACLE_CONNECT_STRING` | Sí          | `host:puerto/servicio`, por ejemplo `db.universidad.edu:1521/FREEPDB1`.                              |
| `ORACLE_SCHEMA`         | No          | Esquema propietario de `EMPLEADOS` si no es la cuenta lectora (recomendado). Se fija en cada sesión. |
| `ORACLE_POOL_MAX`       | No          | Conexiones del grupo (10 por defecto, LAB_SPEC).                                                     |
| `ORACLE_QUEUE_MAX`      | No          | Peticiones en espera (60 por defecto); si la cola se llena, «ocupado» sin consumir intento.          |
| `ORACLE_TIMEOUT_MS`     | No          | Plazo total desde la recepción, incluida la cola (5000 por defecto; entre 500 y 30000).              |

## Requisitos de la base

1. Tabla `EMPLEADOS` con el dataset `empleados-select-v2` (12 columnas, 20 filas): script [`oracle/empleados-select-v2.sql`](../oracle/empleados-select-v2.sql). Una prueba unitaria garantiza que coincide con `src/domain/dataset/empleados.ts`. El script v1 se conserva para volver atrás.
2. Propietario distinto de la cuenta lectora; idealmente sin inicio de sesión (`CREATE USER ... NO AUTHENTICATION`).
3. Cuenta lectora solo con `CREATE SESSION` y `READ` (o `SELECT`) sobre `EMPLEADOS`. `READ` impide `SELECT ... FOR UPDATE`.

Cada sesión fija `NLS_DATE_FORMAT = 'YYYY-MM-DD'`, `NLS_SORT = BINARY` y `NLS_COMP = BINARY` (fechas y textos iguales que en el motor educativo) y, si hay `ORACLE_SCHEMA`, `CURRENT_SCHEMA`. Antes de ejecutar nada, el servidor comprueba la **salud real** (cada 30 s): lee las 12 columnas de `EMPLEADOS` `ORDER BY ID_EMPLEADO` y las compara fila a fila con el dataset versionado, y verifica que la cuenta no tenga privilegios de sistema distintos de `CREATE SESSION`, ni tablas propias, ni permisos sobre `EMPLEADOS` distintos de lectura. Si algo no cumple, el laboratorio se declara no disponible y explica por qué.

## Opción A — Oracle Database Free local (Docker)

Imagen oficial `container-registry.oracle.com/database/free:latest-lite` (Oracle Database 23ai Free, unos 900 MB comprimidos). El puerto solo se publica en `127.0.0.1`.

```bash
npm run oracle:up
```

```bash
npm run oracle:setup
```

`oracle:up` crea el contenedor `sql-select-lab-oracle` con una contraseña de administración aleatoria guardada en `.env.oracle.local` y espera a que la base esté lista (varios minutos la primera vez). `oracle:setup` crea `SQL_LAB_V2_OWNER` (sin inicio de sesión) con `EMPLEADOS` v2, y `SQL_LAB_V2_READER` con `CREATE SESSION` y `READ`; escribe las cuatro variables en `.env.local` y guarda la cuenta anterior como `ORACLE_PREVIOUS_*`. Es aditivo: solo vuelve a crear los esquemas `SQL_LAB_V2_*`, y los de v1 (`SQL_LAB_OWNER`, `SQL_LAB_READER`) quedan intactos. Ningún comando imprime contraseñas y ambos archivos están ignorados por Git. `npm run oracle:down` detiene el contenedor sin borrar los datos.

Motor de contenedores: el script usa Docker si su motor responde. En Windows, si Docker Desktop no arranca, usa **Podman dentro de WSL** (distribución `Ubuntu` por defecto, `ORACLE_LOCAL_WSL_DISTRO` para otra), sin ventana ni licencia que aceptar. Instalación única de Podman desde los repositorios de Ubuntu:

```bash
wsl -d Ubuntu -u root -- apt-get install -y podman
```

WSL reenvía el puerto a `127.0.0.1:1522` de Windows (1522 por defecto, para no chocar con un Oracle nativo en 1521; `ORACLE_LOCAL_PORT` lo cambia). `ORACLE_LOCAL_ENGINE=docker` o `wsl-podman` fuerza un motor. Con esta configuración se validaron la Fase 8 y el dataset v2 (Oracle Database 23ai Free 23.26).

## Opción B — Instancia propia (universidad o nube)

1. Como administrador, ejecutar `oracle/empleados-select-v2.sql` en el esquema propietario.
2. Crear la cuenta lectora y conceder solo `CREATE SESSION` y `READ ON <propietario>.EMPLEADOS`.
3. Definir las variables de la tabla anterior en el servidor. El servicio que ejecuta la web necesita red hasta el puerto de Oracle; no se asume que un alojamiento serverless la tenga.

## Opción C — Oracle Autonomous Database (Oracle Cloud), la del despliegue

Es la instancia que usan la vista previa y la producción de Vercel:

| Dato           | Valor                                                            |
| -------------- | ---------------------------------------------------------------- |
| Nombre         | SQLSelectLab (base `SQLSELECT`)                                  |
| Plan y versión | Always Free, Oracle Database 19c (19.33), Transaction Processing |
| Región         | sa-bogota-1                                                      |
| Red            | Acceso seguro desde cualquier lugar, con mTLS obligatorio        |
| Servicio       | `sqlselect_tp` (TCPS, puerto 1522)                               |

Cómo se prepara:

1. **Cartera.** En la consola, _Database connection → Download wallet_ (tipo Instance wallet), con una contraseña. El ZIP va a `.secrets/`, que Git y Vercel ignoran. Si hay varias, se usa la más reciente.
2. **Contraseñas.** En `.env.oracle.local`, que también se ignora, se escriben `ORACLE_CLOUD_ADMIN_PASSWORD` y `ORACLE_CLOUD_WALLET_PASSWORD`.
3. **`node scripts/oracle-cloud.mjs check`.** Comprueba que la contraseña descifra la cartera y que ADMIN inicia sesión. Lee el ZIP en memoria, sin descomprimirlo.
4. **`node scripts/oracle-cloud.mjs setup`.** Crea `SQL_LAB_V2_OWNER` sin inicio de sesión, con `EMPLEADOS` cargada desde `oracle/empleados-select-v2.sql`. Crea también `SQL_LAB_V2_READER` con una contraseña aleatoria y solo `CREATE SESSION` y `READ ON SQL_LAB_V2_OWNER.EMPLEADOS`. Guarda las variables `ORACLE_CLOUD_*` en `.env.oracle.local` y conserva las de v1 como `ORACLE_CLOUD_PREVIOUS_*`. Los esquemas v1 no se tocan. El esquema lo comparte con la opción A a través de `scripts/oracle-common.mjs`.
5. **`node scripts/oracle-cloud.mjs verify`.** Consulta `EMPLEADOS` con la cuenta lectora y lista sus privilegios de sistema.

Variables de la aplicación (servidor), idénticas en Production y Preview de Vercel:

| Variable                   | Valor                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ORACLE_USER`              | `SQL_LAB_V2_READER`                                                                                        |
| `ORACLE_PASSWORD`          | `ORACLE_CLOUD_PASSWORD`                                                                                    |
| `ORACLE_CONNECT_STRING`    | Descriptor completo del servicio `_tp` (`ORACLE_CLOUD_CONNECT_STRING`)                                     |
| `ORACLE_SCHEMA`            | `SQL_LAB_V2_OWNER`                                                                                         |
| `ORACLE_WALLET_PEM_BASE64` | `ewallet.pem` en base64, en una línea. El servidor lo pasa a `oracledb` como `walletContent`, sin archivos |
| `ORACLE_WALLET_PASSWORD`   | Contraseña de la cartera                                                                                   |
| `ORACLE_POOL_MAX`          | `4` en Vercel: el plan Always Free admite pocas sesiones simultáneas                                       |

Para probar en local contra la nube: `node scripts/with-oracle-cloud.mjs <comando>`, por ejemplo `node scripts/with-oracle-cloud.mjs npx vitest run tests/integration/oracle-real.test.ts`. Sustituye las variables `ORACLE_*` del proceso por las `ORACLE_CLOUD_*`, sin imprimirlas.

ADMIN solo se usa para preparar el esquema; la aplicación lo rechaza como usuario.

Verificado el 25 de septiembre de 2026 con el dataset v2:

- `tests/integration/oracle-real.test.ts`: 102/102 en Oracle local 23ai y 102/102 en Oracle Cloud 19c;
- la tabla tiene las 12 columnas, los tipos, la nulabilidad, las restricciones (PK, FK, UNIQUE y CHECK) y las 20 filas exactas del dataset;
- la cuenta lectora solo tiene `CREATE SESSION` y `READ`, y un `UPDATE` directo devuelve ORA-01031/41900;
- los esquemas v1 siguen con sus 6 filas.

### Activar v2 en Vercel y volver atrás

Activar:

1. Crear los esquemas v2 (`setup`) y verificarlos (`verify` y la integración contra la nube).
2. Cambiar en Vercel, en Production, `ORACLE_USER`, `ORACLE_PASSWORD` y `ORACLE_SCHEMA` por los valores v2 de `ORACLE_CLOUD_*`. La cartera y el descriptor no cambian.
3. Desplegar en producción un build nuevo del código v2. El código v2 exige EMPLEADOS v2 en su salud y el código v1 exige v1: código y variables cambian juntos.

Volver atrás:

1. Restaurar en Vercel las tres variables con `ORACLE_CLOUD_PREVIOUS_*`.
2. Promover el despliegue anterior, que usa el código v1.

No se borra ningún esquema durante el cambio.

## Cómo se ejecuta una consulta

Editor → analizador del subconjunto (`src/domain/sql`) → sentencia canónica construida desde el árbol (nunca el texto original) → grupo de conexiones → Oracle → filas, tipos y motor → pantalla o calificación (M10). Una consulta rechazada por el analizador no llega a Oracle. Al arrancar, el servidor precalienta el grupo y la salud (`src/instrumentation.ts`, como máximo 8 s) para que la primera consulta tras un reinicio no pague la creación del grupo. Límite de 100 filas y 100 KB: si se superara, no se muestra ni se califica.

Errores: los de SQL de Oracle se muestran con su código ORA real y un mensaje pedagógico (`ORA-01476` al dividir entre cero); conexión, credenciales, cola y plazo son de infraestructura, no consumen intentos y nunca exponen detalles de la conexión. Una sesión interrumpida por el plazo se retira del grupo.

## Pruebas

- Sin credenciales: `npm run test:unit` prueba el adaptador con un driver simulado (configuración, errores, plazo, precisión decimal, límites y salud).
- Con credenciales: la misma orden ejecuta además `tests/integration/oracle-real.test.ts` contra la base (102 casos: el dataset, 64 consultas por concepto, LAB01–LAB24, las consultas del Estudio y de la Exposición, seguridad, plazos y M10), y `npm run test:e2e` recorre `/lab` y M10 con Oracle.
- Para ejecutar las E2E sin Oracle aunque exista `.env.local`: `ORACLE_USER= ORACLE_PASSWORD= ORACLE_CONNECT_STRING= npm run test:e2e`.
