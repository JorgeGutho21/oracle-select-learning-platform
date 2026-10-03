# AUTH_ARCHITECTURE — Cuentas, roles, progreso sincronizado y panel docente (DB LAB, Fase 2)

Fecha: 3 de octubre de 2026. Rama: `claude-phase2-auth-progress-20261002`.

Este documento reúne la arquitectura de autenticación, la seguridad de Supabase (RLS) y la sincronización del progreso. No hay documentos aparte para cada tema: todo lo de la Fase 2 está aquí.

## 1. Principios

- **Supabase** da identidad y plataforma: Auth, perfiles, roles, progreso y presencia.
- **Oracle** sigue siendo el motor de las prácticas SQL. Nada de Oracle se movió.
- **Aprender no exige cuenta.** Un invitado estudia, practica y guarda su avance en el dispositivo.
- **El navegador nunca decide permisos.** La autorización real está en la base (RLS, privilegios por columna y disparadores) y en el servidor. La interfaz solo usa el rol para mostrar u ocultar enlaces.
- **Sin cliente de Supabase en el navegador para cuentas o progreso.**
  - La sesión vive en cookies httpOnly.
  - El navegador habla solo con el servidor de DB LAB: Server Functions y `/api/*`.
  - El servidor consulta Supabase con la clave publicable y el token de la sesión, así que cada consulta pasa por RLS como esa persona.
  - La clave secreta no interviene en ningún flujo de la aplicación.

## 2. Flujo

```text
                               VISITANTE
                                   │
        ┌──────────────────────────┼───────────────────────────┐
        ▼                          ▼                           ▼
   Invitado                Correo y contraseña             Microsoft
   (sin cuenta)            (/register, /login)         (Supabase «azure»)
        │                          │                           │
        │                   Supabase Auth  ◄───────────────────┘
        │                          │   cookies httpOnly (@supabase/ssr)
        │                          ▼
        │               disparador on_auth_user_created
        │                          ▼
        │        profiles (role = student, institutional calculado)
        │                          │
        │           ¿rol teacher? solo admin_set_role (service_role)
        ▼                          ▼
 progreso local  ── al entrar ──►  fusión monótona ──► learning_progress (RLS)
 (mismas claves)                   (sin perder nada)         │
        ▲                                                    ▼
        └────────── cada cambio: subida con espera ──  /dashboard · /profile
                                                      /teacher (solo profesor)
```

## 3. Componentes por capa

| Capa                       | Archivos                                                                                                                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dominio                    | `features/accounts/domain/account.ts` (roles, perfil, iniciales); `features/progress/domain/progress.ts` (registros y fusión monótona)                                                                                                                                |
| Aplicación                 | `accounts/application/` (validación de formularios, mensajes, redirecciones seguras, marca de sesión); `progress/application/` (registro canónico, resúmenes, mapeo del progreso local, motor de sincronización, contrato de la API); `teacher/application/roster.ts` |
| Infraestructura            | `accounts/infrastructure/` (cliente de servidor `@supabase/ssr`, perfiles, proveedores habilitados); `progress/infrastructure/` (tabla de progreso, pasarela HTTP, almacenamiento del navegador); `teacher/infrastructure/` (consultas del panel docente)             |
| Composición                | `composition/accounts/` (sesión, guardas, Server Functions, rutas de API, proxy, menú); `composition/progress/` (sincronización en el navegador, repositorios envueltos, panel)                                                                                       |
| Presentación               | `accounts/presentation/` (pantallas de acceso, formularios, menú de cuenta, perfil); `progress/presentation/learner-dashboard.tsx`; `teacher/presentation/teacher-dashboard.tsx`; `presentation/components/ui/text-field.tsx`                                         |
| Rutas (`src/app`)          | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/auth/callback`, `/dashboard`, `/profile`, `/teacher`, `/access-denied`, `/api/session`, `/api/progress`, `/api/presence`, `forbidden.tsx` y `src/proxy.ts`                           |
| Base de datos              | `supabase/migrations/20261002120000_learner_accounts.sql`                                                                                                                                                                                                             |
| Entorno local reproducible | `supabase/config.toml` y `supabase/templates/*.html` (plantillas de correo en español)                                                                                                                                                                                |

Las reglas de capas siguen las de ESLint (`scripts/architecture-boundaries.mjs`). Las páginas solo usan composición, aplicación y presentación.

## 4. Sesión

- **Patrón:** `@supabase/ssr` 0.12.7 con `@supabase/supabase-js` 2.117.1, Next.js 16 App Router y PKCE.
- **Cookies de sesión:** `httpOnly`, `SameSite=Lax`, y `Secure` fuera de `localhost`.
- **Marca `dblab-session=1`:**
  - No es httpOnly y no lleva datos.
  - Solo dice al navegador si conviene preguntar por la cuenta.
  - Un invitado no hace ninguna petición extra.
- **`src/proxy.ts`** (el antiguo middleware) solo corre en `/dashboard`, `/profile`, `/teacher` y `/reset-password`:
  - renueva el token si caducó, porque un Server Component no puede escribir cookies;
  - sin sesión, lleva a `/login?next=…` antes de renderizar;
  - en `/teacher`, lee el rol con la sesión de la persona; sin el rol de profesor sirve «Acceso denegado» en la misma URL.
- **Verificación de la sesión:**
  - Cada página privada vuelve a verificarla con `getUser()` (servidor de Auth) y lee el perfil por RLS.
  - `/teacher` además llama a `forbidden()` si el rol no es `teacher`. Hay que activar `experimental.authInterrupts` en `next.config.ts`.
- **Estado HTTP:** el `loading.tsx` raíz transmite la página desde el primer byte, así que «Acceso denegado» llega con estado HTTP 200, no 403. No se muestra nada del panel en ningún momento. Un 403 real exigiría que el proxy pidiera su propia página, lo que falla en las vistas previas protegidas de Vercel.
- **Contenido público:** todo sigue siendo estático. Inicio, secciones, estudio, exposición, laboratorio, Challenge, recursos y sala en vivo no leen cookies en el servidor.

## 5. Rutas y protección

| Tipo           | Rutas                                                                                                                    | Regla                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Públicas       | `/`, `/sections…`, `/learn…`, `/presentation`, `/lab`, `/challenge`, `/resources`, `/modules`, `/live`, `/join…`, acceso | Sin sesión. El invitado aprende igual.                         |
| Con sesión     | `/dashboard`, `/profile`, `/reset-password`                                                                              | Proxy y página (`requireAccount`). Sin sesión, `/login?next=`. |
| Profesor       | `/teacher`                                                                                                               | Proxy, página (`requireTeacher`) y RLS.                        |
| API con sesión | `/api/session`, `/api/progress` (GET, POST, DELETE), `/api/presence` (POST)                                              | Sesión verificada, mismo origen, Zod y registro canónico.      |

**`next` seguro (`safeNextPath`):**

- solo rutas internas;
- rechaza `//otro`, `/\otro`, esquemas, caracteres de control y rutas de más de 300 caracteres;
- nunca devuelve a `/login`, `/register`, `/forgot-password` ni `/auth/*`, así no hay bucles.

## 6. Modelo de datos

**`profiles`**

- `id`: UUID de `auth.users`, con borrado en cascada.
- `first_name` y `last_name`: hasta 60 caracteres, sin caracteres de control.
- `email`: copia del correo de Auth. Existe para que el profesor pueda listar y buscar, porque `auth.users` no se expone por la API. Solo la mantiene el disparador.
- `role`: `student` o `teacher`; por defecto `student`.
- `auth_method`: `email`, `microsoft` u `other`, desde `app_metadata.provider`, que el usuario no controla.
- `institutional`: lo calcula la base.
- `created_at` y `updated_at`.

**`learning_progress`**

- **Clave primaria:** `(user_id, section_key, mode_key, item_key)`. Impide duplicados lógicos.
- **Columnas:**
  - `status`: `not_started`, `in_progress` o `completed`;
  - `progress_percent`;
  - `content_version`;
  - `state`: posición, de 2 KB como máximo;
  - `last_activity_at`: hora de la actividad en el dispositivo, acotada al presente;
  - `first_completed_at` y `updated_at`.
- **Valores admitidos:** las secciones y los modos se limitan a los del registro académico. `item_key` tiene un formato fijo.
- **Tope:** 1000 filas por cuenta.
- **Disparador `guard_progress`:**
  - completado nunca vuelve atrás;
  - el porcentaje no baja;
  - la posición solo la cambia una actividad más reciente;
  - una fila no puede cambiar de dueño.

**`learner_presence`**

- Columnas `user_id`, `area` y `seen_at`.
- `area` es una zona general, por ejemplo `fundamentos-sql/study`; nunca la URL.
- `seen_at` lo fija el servidor.

**`institutional_domains`**

- Dominios de correo institucional, incluidos sus subdominios.
- Solo los administra el proyecto. Empieza vacía.

**No se creó `learning_activity`.** La actividad reciente y la última actividad salen de `learning_progress.last_activity_at`: un historial aparte no aportaba nada y aumentaba datos personales.

**Fases 3–5.** Las tablas de cursos, evaluaciones, intentos, preguntas, respuestas, notas y supervisión irán en migraciones nuevas:

- referenciarán `profiles.id`;
- usarán `private.is_teacher()` y `profiles.institutional` en sus políticas;
- añadirán el modo `evaluation` a `learning_progress` cuando exista.

**Migraciones.** Son versionadas y reproducibles desde cero con `supabase db reset`. La de la sala en vivo no se tocó.

## 7. RLS y privilegios

Todas las tablas nuevas tienen RLS. Primero se retiran los privilegios por defecto de `anon` y `authenticated` y luego se conceden los mínimos.

| Tabla                   | anon       | estudiante (authenticated)                                                                 | profesor                                      |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `profiles`              | sin acceso | lee el suyo; actualiza solo `first_name` y `last_name` (privilegio por columna + política) | lee todos; edita solo el suyo                 |
| `learning_progress`     | sin acceso | lee, inserta, actualiza y borra el suyo                                                    | lee todos; no modifica el de otros            |
| `learner_presence`      | sin acceso | lee e informa la suya                                                                      | lee todas                                     |
| `institutional_domains` | sin acceso | sin acceso                                                                                 | sin acceso (solo administración del proyecto) |

**Defensas adicionales**

- `private.guard_profile()` rechaza cualquier cambio de `role`, `email`, `auth_method`, `institutional`, `id` o `created_at` que no venga de un rol administrativo. Funciona aunque alguien conceda por error la columna `role`; está probado.
- `public.admin_set_role(correo, rol)`:
  - solo la ejecuta `service_role`;
  - se revocó a `public`, `anon` y `authenticated`;
  - es la única vía para el rol de profesor.
- **Funciones auxiliares:**
  - viven en el esquema `private`, que la API no expone;
  - todas fijan `search_path = ''`;
  - `is_teacher()` es `security definer`, porque así evita la recursión de RLS.
- **Sin políticas `USING (true)` en datos privados.**

**Pruebas**

- `tests/integration/accounts-rls-postgres.test.ts`: PostgreSQL embebido con `auth.users` y `auth.uid()` como en Supabase. Corre siempre, también en CI.
- `tests/integration/accounts-supabase.test.ts`: Supabase real, llamando a la API REST directamente con la clave publicable y la sesión, sin pasar por la interfaz.

## 8. Rol de profesor

**No hay ningún mecanismo de rol en el cliente:** ni `<select>`, ni parámetro `?role`, ni `localStorage`.

**Metadatos ignorados:**

- un `role` en los metadatos del registro se ignora;
- `user_metadata` es editable por el usuario y nunca se usa para autorizar.

**Asignar el rol**, cuando el profesor tenga su cuenta. Primero, Amilkar Sierra Romano se registra o entra con Microsoft. Su correo no está validado en el proyecto y no se inventó. Después, el responsable ejecuta una de estas opciones:

```bash
# Desde la máquina del responsable, con la clave secreta en .env.local (nunca en el chat):
node --env-file=.env.local scripts/assign-role.mjs correo-del-profesor@dominio teacher
```

o en el editor SQL de Supabase:

```sql
select public.admin_set_role('correo-del-profesor@dominio', 'teacher');
```

Para retirarlo, el mismo comando con `student`.

**No se usa `TEACHER_EMAIL_ALLOWLIST`.** Conceder el rol al entrar por coincidencia de correo dependería de que la confirmación de correo esté activa. Además, en Microsoft el correo no siempre está verificado (nOAuth). La asignación explícita no tiene ese riesgo.

## 9. Microsoft personal e institucional

**Implementación**

- Botón «Continuar con Microsoft»: Server Function con `signInWithOAuth({ provider: 'azure', scopes: 'email' })`, PKCE y vuelta a `/auth/callback?next=…`.
- El botón solo se activa si `GET /auth/v1/settings` del proyecto dice `azure: true` (en caché 5 minutos). Sin configuración, se muestra desactivado con la explicación. Correo y contraseña siguen funcionando, y la aplicación compila sin credenciales de Microsoft.
- Los errores de Azure se traducen a avisos de `/login` (`microsoft-cancelado`, `microsoft-error`, `microsoft-no-disponible`). Nunca se muestra el texto técnico.

**Personal o institucional.** Lo decide la configuración del proveedor en Supabase (Authentication → Providers → Azure, «Azure Tenant URL»); hace el papel de `MICROSOFT_TENANT_MODE`:

- `https://login.microsoftonline.com/common/v2.0`: cuentas personales y de cualquier organización;
- `https://login.microsoftonline.com/<id-del-inquilino>/v2.0`: solo la universidad.

**Correo institucional reconocido.** `profiles.institutional` es verdadero solo si:

- el correo de Auth está confirmado (`email_confirmed_at`, dato que el usuario no controla);
- y su dominio, o un subdominio, está en `institutional_domains`, que hace el papel de `INSTITUTIONAL_EMAIL_DOMAINS`.

Se recalcula al confirmar o cambiar el correo y al editar la lista. Cuando se valide el dominio de la universidad:

```sql
insert into public.institutional_domains (domain) values ('dominio-validado.edu.co');
```

Para limitar una evaluación futura a estudiantes institucionales, la política usará `profiles.institutional`. Para exigir además una cuenta de la organización, se restringe el inquilino del proveedor.

## 10. Progreso: local, nube y fusión

**Formato local.** No cambia. Las claves siguen siendo las de siempre:

- `sql-select-lab:study:progress`;
- `sql-select-lab:challenge:practice`;
- `sql-select-lab:presentation:scene`.

**Claves nuevas**, solo añadidas:

- `sql-select-lab:account:owner`: dueño del progreso local;
- `sql-select-lab:presentation:scene:at`: hora de la escena.

**Registro canónico** (`progress/application/catalog.ts`). Sale del contenido publicado, sin números escritos a mano:

| Sección 1 | Modo      | Elementos                              |
| --------- | --------- | -------------------------------------- |
| Estudio   | elementos | 22 lecciones, con versión de contenido |
| Challenge | elementos | 10 misiones                            |
| Clase     | posición  | 30 escenas                             |

- Práctica, Recursos y Evaluación no tienen elementos completables todavía.
- Las secciones 2 y 3 no tienen elementos: su avance se muestra como «aparecerá cuando la sección se publique». Al publicarlas, basta con añadir sus modos al registro.
- El avance de una sección es el de sus lecciones vigentes. Una lección completada con otra versión no cuenta, igual que en la Fase 1.

**Reglas de sincronización** (`progress/application/progress-sync.ts`)

- **Invitado:** solo local. Ni red ni esperas.
- **Al entrar:**
  - se trae la nube y se integra en local;
  - si el progreso local era de invitado o de esta misma cuenta, se sube lo que falte. Ejemplo: local tiene la lección 5 y la nube la 4; quedan las dos;
  - si era de otra cuenta, no se mezcla: se sustituye por el de la nube.
- **Fusión:**
  - es idempotente y conmutativa;
  - completado gana a en curso;
  - porcentaje máximo y versión máxima;
  - la posición la decide la actividad más reciente.
  - El disparador de la base aplica las mismas reglas: una subida antigua o fabricada no reduce nada. Está probado en la E2E y en las pruebas de integración.
- **Escrituras:** se sube solo lo pendiente, 2 segundos después del último cambio significativo. Eso es completar o abrir una lección, cerrar una misión o cambiar de escena; nunca en cada render. Al ocultar la pestaña se fuerza la subida (`keepalive`).
- **Sin conexión:**
  - todo sigue en local;
  - el panel dice «Tu avance está guardado en este dispositivo y se sincronizará cuando vuelva la conexión.»;
  - se reintenta a los 5, 15, 30 y 60 segundos y a los 2 y 5 minutos, y también al volver la conexión.
- **Lectura inicial:** las páginas esperan como mucho 1,5 s la primera sincronización. Si no llega, muestran lo local.
- **Otro dispositivo:** al cargar cualquier página con sesión se trae la nube. Con la pestaña abierta, se vuelve a traer al recuperar el foco tras 2 minutos.
- **Cerrar sesión:**
  - se sube lo pendiente y se borra el progreso local, así un computador de la sala queda limpio para la siguiente persona;
  - sin conexión, se conserva para subirlo la próxima vez que esa cuenta entre.
- **Reiniciar el Modo Estudio con sesión:** también borra ese modo en la nube.
- **Reiniciar la práctica del Challenge:** no borra las misiones ya cerradas, porque son avance.

## 11. Presencia

- **Señal lenta:** se envía al cargar, al cambiar de zona (como mucho una vez por minuto) y cada 2 minutos, solo con la pestaña visible.
- **Contenido:** solo la zona general.
- **Panel docente:** muestra «Conectado» si hubo señal en los últimos 5 minutos y se refresca cada minuto con la pestaña visible.
- **Lo que no se envía:** ni ratón, ni teclas, ni foco, ni desplazamiento.

**Por qué no Supabase Realtime Presence.** Para unirse a un canal privado se necesita permiso de lectura sobre el canal, así que cada estudiante vería la presencia de los demás. Un canal por estudiante obligaría al profesor a suscribirse a decenas de canales. La señal guardada en la tabla tiene RLS normal: cada estudiante ve la suya y el profesor ve todas.

**Fases futuras.** Los eventos de supervisión de examen (fase 4–5) irán en una tabla propia con escritura por función de servidor. No reutilizarán esta.

## 12. Configuración y variables

**No hay variables nuevas obligatorias.** Las cuentas usan las variables que ya existían:

| Variable                                                                                   | Uso en la Fase 2                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o la anónima antigua) | El servidor las lee al servir cada petición para Auth y RLS. Sin ellas, las cuentas se muestran «no disponibles» y todo lo demás funciona como invitado. Una clave secreta puesta aquí se rechaza. |
| `SUPABASE_URL` y `SUPABASE_SECRET_KEY`                                                     | Sin cambios (sala en vivo) y para `scripts/assign-role.mjs`. La aplicación no la usa para cuentas.                                                                                                 |

**Configuración manual del proyecto Supabase.** Es el único trabajo humano. Nunca pegues claves en el chat.

1. **Aplicar la migración**, antes de desplegar la Fase 2: `supabase db push`, o pegar `supabase/migrations/20261002120000_learner_accounts.sql` en el editor SQL. Sin la migración, una persona puede autenticarse pero su perfil no existe. Las páginas de cuenta lo dicen y el resto sigue funcionando.
2. **Authentication → URL Configuration:**
   - «Site URL» con la dirección de producción;
   - en «Redirect URLs», `https://<producción>/**` y, para vistas previas, `https://*-<equipo>.vercel.app/**`.
3. **Authentication → Email:**
   - «Confirm email» activado;
   - plantillas «Confirm signup», «Reset password» y «Change email address» con los textos de `supabase/templates/` (enlaces `{{ .SiteURL }}/auth/confirm?token_hash=…&type=…`).
   - Con las plantillas por defecto también funciona, vía `/auth/callback`, pero solo en el mismo navegador que pidió el enlace.
4. **SMTP propio** (Authentication → SMTP). El servicio de correo incluido en Supabase solo envía a los miembros del equipo y unos pocos mensajes por hora: no sirve para los estudiantes.
5. **Rate limits** (Authentication → Rate Limits). Las llamadas a Auth salen del servidor de DB LAB, así que Supabase ve una sola IP. Hay que subir «Sign-ups and sign-ins» y «Token refreshes» a la medida del grupo; por ejemplo, 300 cada 5 minutos para un salón de 60. DB LAB añade su propio límite: amplio por dirección y estricto por dirección y correo.
6. **Microsoft (opcional):**
   - registrar la aplicación en Microsoft Entra, con la URI de redirección `https://<ref>.supabase.co/auth/v1/callback`;
   - en Authentication → Providers → Azure, poner el ID de cliente, el secreto y la «Azure Tenant URL» (punto 9). El secreto vive solo en Supabase y en Entra, nunca en la aplicación.
7. **Rol de profesor:** punto 8.
8. **Dominio institucional:** punto 9, cuando esté validado.

**Entorno local.**

- `supabase start` levanta todo con `supabase/config.toml`:
  - API en el puerto 54321;
  - base de datos en el 54322;
  - buzón de correos en el 54324.
- Luego, `.env.local` con:
  - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`;
  - la clave publicable que imprime `supabase status`.
- Con la CLI en un contenedor sin acceso a `public.ecr.aws`, usar `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`.

## 13. Seguridad (auditoría de la fase)

| Riesgo                  | Medida                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS                     | React escapa todo texto. Nombres sin caracteres de control (columna y saneado). Los avisos de la URL solo muestran códigos conocidos. Tokens en cookies httpOnly, inaccesibles a un script. |
| Inyección               | Sin SQL dinámico. Consultas por PostgREST con parámetros. Funciones con `search_path` vacío.                                                                                                |
| Secretos                | Ninguna clave secreta en el navegador ni en el repositorio. `.env.example` sin valores. La aplicación no usa la clave secreta para cuentas.                                                 |
| Escalada de rol         | Privilegio por columna, disparador, función solo para `service_role`. Probado con anon, estudiante, columna concedida por error y API directa.                                              |
| Acceso horizontal       | RLS por `auth.uid()`. Estudiante A ≠ B probado en lectura, escritura, borrado y cambio de dueño de filas.                                                                                   |
| Cookies                 | `httpOnly`, `SameSite=Lax`, `Secure` en HTTPS. La marca de sesión no contiene datos.                                                                                                        |
| Callback OAuth          | PKCE. `code` acotado. Vuelta solo a rutas internas. Supabase valida `redirectTo` contra su lista.                                                                                           |
| Enlaces de correo       | `token_hash` canjeado con un botón (POST): los filtros de correo institucionales que abren enlaces no gastan el token.                                                                      |
| Redirección abierta     | `safeNextPath`, con pruebas unitarias de casos de ataque.                                                                                                                                   |
| Enumeración de usuarios | Mismo mensaje para correo inexistente o contraseña errada. El registro de un correo existente responde igual que uno nuevo. La recuperación siempre dice «si existe una cuenta…».           |
| CSRF                    | Server Functions con verificación de origen de Next. `/api/*` exige mismo origen (`Origin` y `Sec-Fetch-Site`) y cookies `SameSite=Lax`.                                                    |
| Fuerza bruta            | Límite por dirección y por dirección y correo. Además, los límites de Supabase.                                                                                                             |
| Registros               | Ningún `console` con contraseñas, tokens, secretos ni correos. Las contraseñas nunca vuelven al formulario.                                                                                 |
| URLs                    | Sin datos personales en las URL. La presencia envía zonas, no rutas completas.                                                                                                              |

## 14. Privacidad

Para cada estudiante se guarda solo:

- nombre y apellido;
- correo, el de Auth y su copia para el profesor;
- método de acceso y estado institucional, ambos calculados;
- progreso y última señal de presencia.

**No se guardan:** IP, geolocalización, huella del navegador, teclas ni movimientos.

**Borrar una cuenta.** Al borrar el usuario en Auth se borran en cascada su perfil, su progreso y su presencia.

## 15. Validación manual pendiente de Microsoft

No se automatiza: necesita cuentas reales y nunca se escriben contraseñas reales en pruebas.

1. **Cuenta personal** (outlook.com o hotmail.com), con el inquilino `common`: «Continuar con Microsoft» → consentimiento → `/auth/callback` → `/dashboard`. En `/profile` debe verse «Método de acceso: Microsoft» y «Correo institucional: No reconocido».
2. **Cuenta institucional:**
   - con el inquilino de la universidad, el mismo flujo;
   - con el dominio en `institutional_domains`, `/profile` debe mostrar «Verificado»;
   - con el inquilino institucional, una cuenta personal debe ser rechazada y volver a `/login` con el aviso de Microsoft.
3. **Cancelar el consentimiento:** debe volver a `/login` con «Cancelaste el acceso con Microsoft…».
4. **Cerrar sesión** desde el menú: debe volver a `/` como invitado; `/profile` pide sesión.
