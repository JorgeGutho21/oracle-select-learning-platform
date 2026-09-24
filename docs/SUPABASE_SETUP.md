# SUPABASE_SETUP — Configurar la sala en vivo

Versión 1.0 · Fase 7 · Relacionado con [REALTIME_SPEC.md](REALTIME_SPEC.md) 1.1 y [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

Supabase guarda las salas, los participantes, los intentos y los resultados, y avisa de los cambios en tiempo real. **No sustituye a Oracle**: el SQL de los estudiantes nunca se ejecuta en PostgreSQL.

## Estado de la verificación

| Parte                                                               | Verificado                                                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Migración, funciones, RLS y privilegios                             | Sí, en PostgreSQL embebido (PGlite) con los roles y privilegios por defecto de Supabase (`tests/integration`).                   |
| Adaptador `SupabaseClassroomRepository` y reglas de sala            | Sí, la misma batería de contrato corre en memoria y contra esa base.                                                             |
| Flujo completo en navegador (profesor y móviles)                    | Sí, con el almacenamiento en memoria (`CLASSROOM_BACKEND=memory`) en Chromium, Edge y WebKit.                                    |
| Proyecto Supabase remoto, Realtime Broadcast y 50–60 móviles reales | **No.** El repositorio no tiene credenciales. Se requiere la prueba de la sección [Validación pendiente](#validación-pendiente). |

## 1. Crear el proyecto

1. Crear un proyecto en [supabase.com](https://supabase.com/dashboard) (región cercana a la universidad).
2. En **Project Settings → API** copiar la URL del proyecto, la clave `anon` (pública) y la clave `service_role` (secreta).

## 2. Aplicar la migración

La migración es [`supabase/migrations/20260924120000_classroom.sql`](../supabase/migrations/20260924120000_classroom.sql). Dos formas:

- **CLI de Supabase:** `supabase link --project-ref <ref>` y `supabase db push`.
- **Editor SQL del panel:** pegar el archivo completo y ejecutarlo una vez.

Crea las tablas `rooms`, `participants`, `attempts`, `hints` y `results`, activa RLS sin políticas (acceso denegado a `anon` y `authenticated`) y define las funciones `classroom_*`, ejecutables solo por `service_role`. Cada función fija `search_path` vacío.

## 3. Variables de entorno

Copiar [`.env.example`](../.env.example) como `.env.local` (desarrollo) o definirlas en el panel del proveedor de despliegue:

| Variable                        | Dónde              | Valor                                                        |
| ------------------------------- | ------------------ | ------------------------------------------------------------ |
| `SUPABASE_URL`                  | Solo servidor      | URL del proyecto.                                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Solo servidor      | Clave `service_role`. Nunca con prefijo `NEXT_PUBLIC_`.      |
| `PRESENTER_ACCESS_CODE`         | Solo servidor      | Clave del profesor para crear salas (larga y no adivinable). |
| `NEXT_PUBLIC_SITE_URL`          | Público (build)    | URL publicada, para que el QR no apunte a `localhost`.       |
| `NEXT_PUBLIC_SUPABASE_URL`      | Público (opcional) | URL del proyecto, para el aviso en tiempo real.              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público (opcional) | Clave `anon`. No abre ninguna tabla ni función de la sala.   |
| `CLASSROOM_BACKEND`             | Solo servidor      | Vacío (usa Supabase) o `memory` (solo desarrollo y pruebas). |

Las variables `NEXT_PUBLIC_*` se incrustan al compilar: tras cambiarlas hay que volver a desplegar. Las de servidor se leen al servir cada página.

## 4. Mantenimiento

`classroom_maintenance(now())` caduca las salas vencidas y borra las terminadas hace más de 30 días con todas sus dependencias. Programarlo cada hora con `pg_cron` (Integrations → Cron):

```sql
select cron.schedule('classroom-maintenance', '0 * * * *', $$select public.classroom_maintenance(now())$$);
```

Aunque no se programe, cada operación de la aplicación comprueba la caducidad al usar la sala.

## 5. Seguridad aplicada

- El navegador nunca habla con las tablas: todas las operaciones pasan por Server Functions de Next.js, que validan con Zod y llaman a las funciones con la clave de servicio.
- Profesor y estudiante se identifican con un token aleatorio de 256 bits en una cookie `httpOnly`, `SameSite=Lax` y `Secure` fuera de `localhost`; la base solo guarda su huella SHA-256.
- Los estudiantes no crean cuenta ni dan correo o contraseña: solo un alias de 2–24 caracteres, saneado (sin HTML, correos ni teléfonos) y único por sala.
- La clave del profesor se compara en tiempo constante y se limitan los intentos fallidos por dirección (10 cada 10 minutos, por proceso).
- El aviso en tiempo real solo transporta `{ revision }` en el canal `classroom:<id de sala>`. Cada pantalla pide después su propia vista autorizada al servidor; un aviso falso solo provoca una consulta más (se agrupan a una por segundo como máximo).

## Validación pendiente

Antes de declarar la sala lista para una clase real con Supabase:

1. Con las variables configuradas, crear una sala en `/presenter` y entrar desde dos móviles reales por el QR.
2. Confirmar en la consola del profesor «Tiempo real conectado» y que el ranking cambia en menos de un segundo tras un acierto.
3. Ensayo de carga del [TEST_PLAN](TEST_PLAN.md#rendimiento-y-carga): 60 participantes durante 20 minutos, con reconexión del 20 %. Registrar p95 de notificación y de respuesta.
4. Endurecimiento opcional: pasar el canal a privado con políticas sobre `realtime.messages` para que solo participantes de la sala reciban sus avisos.

Hasta completar estos pasos, la capacidad de 50–60 estudiantes es un objetivo de diseño probado en concurrencia con memoria y PostgreSQL embebido, **no una capacidad medida** en el servicio remoto.
