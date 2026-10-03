-- DB LAB, Fase 2: cuentas de estudiante y profesor, progreso sincronizado y presencia.
-- Supabase Auth guarda las credenciales; estas tablas nunca contienen contraseñas.
-- La sala en vivo (20260924120000_classroom.sql) no cambia: sus tablas siguen cerradas a
-- anon y authenticated y solo el servidor las usa.
--
-- Seguridad:
-- - RLS en todas las tablas nuevas. Cada persona lee y escribe solo lo suyo; un profesor
--   (role = 'teacher') además lee perfiles, progreso y presencia de todos.
-- - El rol no se elige desde el navegador: authenticated solo puede actualizar nombre y
--   apellido (privilegio por columna) y un disparador rechaza cualquier otro cambio que no
--   venga de un rol administrativo. El rol teacher lo asigna public.admin_set_role, que
--   solo puede ejecutar service_role (servidor o panel de Supabase).
-- - El estado institucional se calcula aquí con datos de Auth que el usuario no controla
--   (correo confirmado) y la lista de dominios que administra el proyecto.
-- - Las funciones auxiliares viven en el esquema private, que la API no expone.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Dominios de correo institucional. Vacía al crearla: el dominio de la universidad se añade
-- cuando esté validado (docs/AUTH_ARCHITECTURE.md). Incluye sus subdominios.
create table public.institutional_domains (
  domain text primary key
    check (domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default ''
    check (char_length(first_name) <= 60 and first_name !~ '[[:cntrl:]]'),
  last_name text not null default ''
    check (char_length(last_name) <= 60 and last_name !~ '[[:cntrl:]]'),
  -- Copia del correo de Auth para que el profesor pueda listar y buscar (auth.users no se
  -- expone por la API). Solo la mantiene el disparador de auth.users.
  email text not null default '' check (char_length(email) <= 320),
  role text not null default 'student' check (role in ('student', 'teacher')),
  auth_method text not null default 'email' check (auth_method in ('email', 'microsoft', 'other')),
  institutional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role on public.profiles (role);

-- Progreso por usuario, sección, modo y elemento (lección, misión, escena). Las claves de
-- sección y modo son las del registro académico (features/sections). Un elemento
-- completado nunca vuelve atrás: lo garantiza el disparador, no el cliente.
create table public.learning_progress (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  section_key text not null
    check (section_key in ('fundamentos-sql', 'consultas-relacionales', 'plsql')),
  mode_key text not null
    check (mode_key in ('class', 'study', 'practice', 'challenge', 'resources', 'evaluation')),
  item_key text not null check (item_key ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$'),
  status text not null default 'in_progress'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  -- Versión del contenido con la que se completó (las lecciones cambian de versión).
  content_version integer check (content_version >= 0),
  -- Posición dentro del elemento (por ejemplo, la escena de la exposición). Pequeño y sin
  -- datos personales.
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object' and pg_column_size(state) <= 2048),
  -- Momento de la actividad en el dispositivo (acotado al presente). Decide qué posición
  -- es la más reciente cuando llegan sincronizaciones atrasadas.
  last_activity_at timestamptz not null default now(),
  first_completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, section_key, mode_key, item_key)
);

create index learning_progress_activity on public.learning_progress (user_id, last_activity_at desc);

-- Conectado o desconectado: una señal lenta (cada pocos minutos, solo con la pestaña
-- visible) con la zona general de la plataforma. No registra teclas, ratón ni foco.
create table public.learner_presence (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  area text not null check (area ~ '^[a-z0-9][a-z0-9:/-]{0,79}$'),
  seen_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema private: no accesibles por la API)
-- ---------------------------------------------------------------------------

create function private.is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'teacher'
  )
$$;

create function private.is_institutional_email(p_email text, p_confirmed_at timestamptz)
returns boolean
language sql stable security definer set search_path = '' as $$
  select p_confirmed_at is not null and exists (
    select 1 from public.institutional_domains d
    where lower(split_part(coalesce(p_email, ''), '@', 2)) = d.domain
       or lower(split_part(coalesce(p_email, ''), '@', 2)) like '%.' || d.domain
  )
$$;

create function private.auth_method(p_app_meta jsonb) returns text
language sql immutable set search_path = '' as $$
  select case coalesce(p_app_meta ->> 'provider', 'email')
    when 'email' then 'email'
    when 'azure' then 'microsoft'
    else 'other'
  end
$$;

-- Nombre visible saneado: sin caracteres de control y con el largo de la columna.
create function private.clean_name(p_value text) returns text
language sql immutable set search_path = '' as $$
  select left(btrim(regexp_replace(coalesce(p_value, ''), '[[:cntrl:]]+', ' ', 'g')), 60)
$$;

-- Perfil al crear la cuenta. Nombre y apellido llegan del registro (first_name/last_name)
-- o del proveedor (given_name/family_name, o el nombre completo).
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := btrim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
  first text := coalesce(nullif(meta ->> 'first_name', ''), nullif(meta ->> 'given_name', ''));
  last text := coalesce(nullif(meta ->> 'last_name', ''), nullif(meta ->> 'family_name', ''));
begin
  if first is null and full_name <> '' then
    first := split_part(full_name, ' ', 1);
    last := coalesce(last, nullif(btrim(substr(full_name, char_length(first) + 1)), ''));
  end if;
  insert into public.profiles (id, first_name, last_name, email, auth_method, institutional)
  values (
    new.id,
    private.clean_name(first),
    private.clean_name(last),
    coalesce(lower(new.email), ''),
    private.auth_method(new.raw_app_meta_data),
    private.is_institutional_email(new.email, new.email_confirmed_at)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Correo, confirmación o proveedor cambian en Auth: el perfil se pone al día.
create function private.handle_user_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set
    email = coalesce(lower(new.email), ''),
    auth_method = private.auth_method(new.raw_app_meta_data),
    institutional = private.is_institutional_email(new.email, new.email_confirmed_at)
  where id = new.id;
  return new;
end;
$$;

create function private.refresh_institutional() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p set
    institutional = private.is_institutional_email(u.email, u.email_confirmed_at)
  from auth.users u
  where u.id = p.id;
  return null;
end;
$$;

-- Solo nombre y apellido cambian desde la cuenta del usuario. El rol, el correo y los datos
-- verificados solo los cambian los disparadores de Auth o un rol administrativo.
create function private.guard_profile() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin')
    and (
      new.id is distinct from old.id
      or new.role is distinct from old.role
      or new.email is distinct from old.email
      or new.auth_method is distinct from old.auth_method
      or new.institutional is distinct from old.institutional
      or new.created_at is distinct from old.created_at
    ) then
    raise exception 'Solo se pueden cambiar el nombre y el apellido.' using errcode = '42501';
  end if;
  new.first_name := private.clean_name(new.first_name);
  new.last_name := private.clean_name(new.last_name);
  new.updated_at := now();
  return new;
end;
$$;

-- Progreso monótono: completado nunca vuelve a en curso, el porcentaje no baja y la
-- posición solo la cambia una actividad más reciente. Así una sincronización antigua o
-- una petición fabricada no borra avance.
create function private.guard_progress() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.last_activity_at := least(coalesce(new.last_activity_at, now()), now());
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    if old.status = 'completed' then
      new.status := 'completed';
    elsif old.status = 'in_progress' and new.status = 'not_started' then
      new.status := 'in_progress';
    end if;
    new.progress_percent := greatest(old.progress_percent, new.progress_percent);
    new.content_version := greatest(old.content_version, new.content_version);
    if new.last_activity_at < old.last_activity_at then
      new.state := old.state;
      new.last_activity_at := old.last_activity_at;
    end if;
    new.first_completed_at := old.first_completed_at;
  else
    -- Tope por cuenta: el temario completo usa decenas de filas, no miles.
    if (select count(*) from public.learning_progress where user_id = new.user_id) >= 1000 then
      raise exception 'Límite de progreso alcanzado.' using errcode = '54000';
    end if;
    new.first_completed_at := null;
  end if;
  if new.status = 'completed' then
    new.progress_percent := 100;
    new.first_completed_at := coalesce(new.first_completed_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create function private.guard_presence() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
  end if;
  new.seen_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Disparadores
-- ---------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger on_auth_user_updated
  after update of email, email_confirmed_at, raw_app_meta_data on auth.users
  for each row execute function private.handle_user_update();

create trigger institutional_domains_changed
  after insert or update or delete on public.institutional_domains
  for each statement execute function private.refresh_institutional();

create trigger profiles_guard
  before update on public.profiles
  for each row execute function private.guard_profile();

create trigger learning_progress_guard
  before insert or update on public.learning_progress
  for each row execute function private.guard_progress();

create trigger learner_presence_guard
  before insert or update on public.learner_presence
  for each row execute function private.guard_presence();

-- Cuentas que ya existieran antes de esta migración.
insert into public.profiles (id, first_name, last_name, email, auth_method, institutional)
select
  u.id,
  private.clean_name(coalesce(u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'given_name')),
  private.clean_name(coalesce(u.raw_user_meta_data ->> 'last_name', u.raw_user_meta_data ->> 'family_name')),
  coalesce(lower(u.email), ''),
  private.auth_method(u.raw_app_meta_data),
  private.is_institutional_email(u.email, u.email_confirmed_at)
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------

alter table public.institutional_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.learning_progress enable row level security;
alter table public.learner_presence enable row level security;

revoke all on table
  public.institutional_domains, public.profiles, public.learning_progress, public.learner_presence
  from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (first_name, last_name) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.learning_progress to authenticated;
grant select, insert, update on table public.learner_presence to authenticated;
grant select, insert, update, delete on table
  public.institutional_domains, public.profiles, public.learning_progress, public.learner_presence
  to service_role;

-- Perfiles: el propio y, para el profesor, todos.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_teacher()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Progreso: cada uno escribe el suyo; el profesor solo lee.
create policy learning_progress_select on public.learning_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_teacher()));

create policy learning_progress_insert_own on public.learning_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy learning_progress_update_own on public.learning_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy learning_progress_delete_own on public.learning_progress
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy learner_presence_select on public.learner_presence
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_teacher()));

create policy learner_presence_insert_own on public.learner_presence
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy learner_presence_update_own on public.learner_presence
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- institutional_domains: sin políticas para anon/authenticated (solo administración).

-- ---------------------------------------------------------------------------
-- Administración: asignar el rol de profesor (solo service_role)
-- ---------------------------------------------------------------------------

create function public.admin_set_role(p_email text, p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  updated integer;
begin
  if p_role not in ('student', 'teacher') then
    return jsonb_build_object('status', 'invalid-role');
  end if;
  update public.profiles set role = p_role where email = lower(btrim(p_email));
  get diagnostics updated = row_count;
  return jsonb_build_object('status', case when updated = 1 then 'updated' else 'not-found' end);
end;
$$;

revoke all on function public.admin_set_role(text, text) from public, anon, authenticated;
grant execute on function public.admin_set_role(text, text) to service_role;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'private.is_institutional_email(text, timestamptz)',
    'private.auth_method(jsonb)',
    'private.clean_name(text)',
    'private.handle_new_user()',
    'private.handle_user_update()',
    'private.refresh_institutional()',
    'private.guard_profile()',
    'private.guard_progress()',
    'private.guard_presence()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end;
$$;

-- is_teacher se evalúa dentro de las políticas y clean_name dentro del disparador de
-- perfiles, ambos con los privilegios de quien consulta.
revoke all on function private.is_teacher() from public, anon;
grant execute on function private.is_teacher() to authenticated, service_role;
grant execute on function private.clean_name(text) to authenticated;
