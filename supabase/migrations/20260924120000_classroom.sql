-- Sala en vivo v1 (REALTIME_SPEC 1.1, DATABASE_SCHEMA): salas, participantes, intentos,
-- pistas y resultados. Solo el servidor de la aplicación (service_role) lee y escribe, a
-- través de las funciones de este archivo; anon y authenticated no tienen acceso directo.
-- Supabase no sustituye a Oracle: aquí no se ejecuta SQL de estudiantes.
-- Cada función fija search_path vacío y califica todo con public.: un objeto con el mismo
-- nombre en otro esquema no puede interceptarla.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  join_code text not null check (join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  presenter_token_hash text not null check (presenter_token_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'lobby'
    check (state in ('lobby', 'running', 'finished', 'cancelled', 'expired')),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  check (expires_at > created_at),
  check (state <> 'running' or started_at is not null),
  check (state not in ('finished', 'cancelled', 'expired') or ended_at is not null)
);

-- Un código no se repite entre salas que todavía admiten acceso.
create unique index rooms_open_code on public.rooms (join_code)
  where state in ('lobby', 'running');
create index rooms_state_expires on public.rooms (state, expires_at);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  nickname_key text not null check (char_length(nickname_key) between 2 and 24),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  joined_at timestamptz not null,
  last_seen_at timestamptz,
  left_at timestamptz,
  unique (room_id, nickname_key),
  unique (room_id, token_hash),
  unique (room_id, id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  participant_id uuid not null,
  mission_id text not null check (mission_id ~ '^M(0[1-9]|10)$'),
  request_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('pending', 'evaluated', 'technical_error')),
  attempt_number smallint not null check (attempt_number between 1 and 2),
  correct boolean,
  score smallint check (score between 0 and 100),
  duration_ms integer check (duration_ms >= 0),
  hint_used boolean not null default false,
  outcome jsonb,
  measured_from timestamptz not null,
  created_at timestamptz not null,
  evaluated_at timestamptz,
  foreign key (room_id, participant_id)
    references public.participants (room_id, id) on delete cascade,
  unique (participant_id, request_id),
  check (status <> 'evaluated' or (correct is not null and score is not null and outcome is not null))
);

-- Nunca un tercer intento académico ni dos correcciones simultáneas del mismo participante.
create unique index attempts_academic_number on public.attempts (participant_id, mission_id, attempt_number)
  where status = 'evaluated';
create unique index attempts_one_pending on public.attempts (participant_id)
  where status = 'pending';
create index attempts_room on public.attempts (room_id, status);

create table public.hints (
  room_id uuid not null,
  participant_id uuid not null,
  mission_id text not null check (mission_id ~ '^M(0[1-9]|10)$'),
  used_at timestamptz not null,
  primary key (participant_id, mission_id),
  foreign key (room_id, participant_id)
    references public.participants (room_id, id) on delete cascade
);

-- Resultado final por participante, calculado por el dominio al terminar la sala. Es
-- regenerable a partir de los intentos; no es la fuente de las puntuaciones.
create table public.results (
  room_id uuid not null,
  participant_id uuid not null primary key,
  total_score integer not null check (total_score between 0 and 1000),
  total_time_ms bigint not null check (total_time_ms >= 0),
  accuracy numeric(5, 4) check (accuracy between 0 and 1),
  solved_missions smallint not null check (solved_missions between 0 and 10),
  attempts smallint not null check (attempts >= 0),
  hints_used smallint not null check (hints_used between 0 and 10),
  completed_at timestamptz not null,
  foreign key (room_id, participant_id)
    references public.participants (room_id, id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Permisos: RLS activa y sin políticas para anon/authenticated (acceso denegado).
-- ---------------------------------------------------------------------------

alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.attempts enable row level security;
alter table public.hints enable row level security;
alter table public.results enable row level security;

revoke all on table public.rooms, public.participants, public.attempts, public.hints, public.results
  from anon, authenticated;
grant select, insert, update, delete
  on table public.rooms, public.participants, public.attempts, public.hints, public.results
  to service_role;

-- ---------------------------------------------------------------------------
-- Funciones (llamadas por RPC desde el servidor). Los instantes vienen del servidor de
-- la aplicación; el reloj del navegador nunca interviene.
-- ---------------------------------------------------------------------------

create function public.classroom_ms(value timestamptz) returns bigint
language sql immutable set search_path = '' as $$
  select case when value is null then null else floor(extract(epoch from value) * 1000)::bigint end
$$;

create function public.classroom_room_json(r public.rooms) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id,
    'code', r.join_code,
    'status', r.state,
    'revision', r.revision,
    'createdAt', public.classroom_ms(r.created_at),
    'expiresAt', public.classroom_ms(r.expires_at),
    'startedAt', public.classroom_ms(r.started_at),
    'finishedAt', public.classroom_ms(r.ended_at)
  )
$$;

create function public.classroom_participant_json(p public.participants) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id,
    'roomId', p.room_id,
    'nickname', p.nickname,
    'joinedAt', public.classroom_ms(p.joined_at),
    'lastSeenAt', public.classroom_ms(p.last_seen_at),
    'leftAt', public.classroom_ms(p.left_at)
  )
$$;

create function public.classroom_bump(p_room_id uuid) returns void
language sql set search_path = '' as $$
  update public.rooms set revision = revision + 1 where id = p_room_id
$$;

create function public.classroom_create_room(
  p_code text, p_presenter_token_hash text, p_now timestamptz, p_expires_at timestamptz
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  created public.rooms;
begin
  insert into public.rooms (join_code, presenter_token_hash, created_at, expires_at)
  values (p_code, p_presenter_token_hash, p_now, p_expires_at)
  returning * into created;
  return public.classroom_room_json(created);
exception when unique_violation then
  return null; -- Código en uso: la aplicación genera otro.
end;
$$;

create function public.classroom_find_room_by_code(p_code text) returns jsonb
language sql stable set search_path = '' as $$
  select public.classroom_room_json(r) from public.rooms r
  where r.join_code = p_code order by r.created_at desc limit 1
$$;

create function public.classroom_find_room(p_room_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select public.classroom_room_json(r) from public.rooms r where r.id = p_room_id
$$;

create function public.classroom_verify_presenter(p_room_id uuid, p_token_hash text) returns boolean
language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.rooms where id = p_room_id and presenter_token_hash = p_token_hash
  )
$$;

create function public.classroom_join(
  p_room_id uuid, p_nickname text, p_nickname_key text, p_token_hash text,
  p_capacity integer, p_now timestamptz
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  room public.rooms;
  joined public.participants;
begin
  -- El bloqueo de la sala serializa las inscripciones: el cupo nunca se supera.
  select * into room from public.rooms where id = p_room_id for update;
  if not found or room.state <> 'lobby' or room.expires_at <= p_now then
    return jsonb_build_object('status', 'closed');
  end if;
  if (select count(*) from public.participants where room_id = p_room_id) >= p_capacity then
    return jsonb_build_object('status', 'full');
  end if;
  if exists (
    select 1 from public.participants where room_id = p_room_id and nickname_key = p_nickname_key
  ) then
    return jsonb_build_object('status', 'nickname-taken');
  end if;
  insert into public.participants (room_id, nickname, nickname_key, token_hash, joined_at, last_seen_at)
  values (p_room_id, p_nickname, p_nickname_key, p_token_hash, p_now, p_now)
  returning * into joined;
  perform public.classroom_bump(p_room_id);
  return jsonb_build_object('status', 'joined', 'participant', public.classroom_participant_json(joined));
end;
$$;

create function public.classroom_find_participant(p_room_id uuid, p_token_hash text) returns jsonb
language sql stable set search_path = '' as $$
  select public.classroom_participant_json(p) from public.participants p
  where p.room_id = p_room_id and p.token_hash = p_token_hash
$$;

create function public.classroom_touch(p_participant_id uuid, p_now timestamptz) returns void
language sql set search_path = '' as $$
  update public.participants set last_seen_at = p_now where id = p_participant_id
$$;

create function public.classroom_leave(p_participant_id uuid, p_now timestamptz) returns void
language plpgsql set search_path = '' as $$
declare
  room public.rooms;
begin
  select r.* into room from public.rooms r
  join public.participants p on p.room_id = r.id
  where p.id = p_participant_id for update of r;
  if not found then return; end if;
  if room.state = 'lobby' then
    delete from public.participants where id = p_participant_id;
  else
    update public.participants set left_at = coalesce(left_at, p_now) where id = p_participant_id;
  end if;
  perform public.classroom_bump(room.id);
end;
$$;

create function public.classroom_transition(
  p_room_id uuid, p_from jsonb, p_to text, p_require_participants boolean, p_now timestamptz
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  room public.rooms;
begin
  select * into room from public.rooms where id = p_room_id for update;
  if not found then
    return jsonb_build_object('status', 'empty');
  end if;
  if not (room.state in (select jsonb_array_elements_text(p_from))) then
    return jsonb_build_object('status', 'conflict', 'room', public.classroom_room_json(room));
  end if;
  if p_require_participants
    and not exists (select 1 from public.participants where room_id = p_room_id) then
    return jsonb_build_object('status', 'empty');
  end if;
  update public.rooms set
    state = p_to,
    revision = revision + 1,
    started_at = case when p_to = 'running' then p_now else started_at end,
    ended_at = case when p_to in ('finished', 'cancelled', 'expired') then p_now else ended_at end
  where id = p_room_id
  returning * into room;
  return jsonb_build_object('status', 'ok', 'room', public.classroom_room_json(room));
end;
$$;

create function public.classroom_reserve_attempt(
  p_participant_id uuid, p_mission_id text, p_request_id uuid, p_payload_hash text,
  p_max_attempts integer, p_pending_timeout_ms integer, p_now timestamptz
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  participant public.participants;
  room public.rooms;
  existing public.attempts;
  evaluated integer;
  solved boolean;
  reserved public.attempts;
  measured timestamptz;
begin
  -- Un bloqueo por participante: dos pestañas no registran dos envíos a la vez.
  select * into participant from public.participants where id = p_participant_id for update;
  if not found then
    return jsonb_build_object('status', 'closed');
  end if;
  select * into room from public.rooms where id = participant.room_id;

  select * into existing from public.attempts
  where participant_id = p_participant_id and request_id = p_request_id;
  if found then
    if existing.payload_hash <> p_payload_hash then
      return jsonb_build_object('status', 'conflict');
    elsif existing.status = 'evaluated' then
      return jsonb_build_object('status', 'replay', 'outcome', existing.outcome);
    elsif existing.status = 'pending'
      and existing.created_at > p_now - make_interval(secs => p_pending_timeout_ms / 1000.0) then
      return jsonb_build_object('status', 'busy');
    end if;
    -- Fallo técnico o reserva caducada del mismo envío: se reintenta sobre la misma fila.
    delete from public.attempts where id = existing.id;
  end if;

  -- Una corrección pendiente de otro envío bloquea, salvo que haya caducado.
  update public.attempts set status = 'technical_error'
  where participant_id = p_participant_id and status = 'pending'
    and created_at <= p_now - make_interval(secs => p_pending_timeout_ms / 1000.0);
  if exists (select 1 from public.attempts where participant_id = p_participant_id and status = 'pending') then
    return jsonb_build_object('status', 'busy');
  end if;

  select count(*), coalesce(bool_or(correct), false) into evaluated, solved
  from public.attempts
  where participant_id = p_participant_id and mission_id = p_mission_id and status = 'evaluated';
  if solved or evaluated >= p_max_attempts then
    return jsonb_build_object('status', 'closed');
  end if;

  select greatest(
    coalesce(room.started_at, participant.joined_at),
    participant.joined_at,
    coalesce(max(a.evaluated_at), participant.joined_at)
  ) into measured
  from public.attempts a
  where a.participant_id = p_participant_id and a.status = 'evaluated';

  insert into public.attempts (
    room_id, participant_id, mission_id, request_id, payload_hash, status, attempt_number,
    hint_used, measured_from, created_at
  ) values (
    participant.room_id, p_participant_id, p_mission_id, p_request_id, p_payload_hash, 'pending',
    evaluated + 1,
    exists (select 1 from public.hints where participant_id = p_participant_id and mission_id = p_mission_id),
    measured, p_now
  ) returning * into reserved;

  return jsonb_build_object(
    'status', 'reserved',
    'attemptId', reserved.id,
    'attemptNumber', reserved.attempt_number,
    'hintUsed', reserved.hint_used,
    'measuredFrom', public.classroom_ms(reserved.measured_from)
  );
end;
$$;

create function public.classroom_complete_attempt(
  p_attempt_id uuid, p_academic boolean, p_correct boolean, p_score integer,
  p_duration_ms integer, p_outcome jsonb, p_now timestamptz
) returns void
language plpgsql set search_path = '' as $$
declare
  attempt public.attempts;
begin
  select * into attempt from public.attempts where id = p_attempt_id;
  if not found or attempt.status <> 'pending' then return; end if;
  perform 1 from public.participants where id = attempt.participant_id for update;
  if p_academic then
    update public.attempts set
      status = 'evaluated', correct = p_correct, score = p_score, duration_ms = p_duration_ms,
      outcome = p_outcome, evaluated_at = p_now
    where id = p_attempt_id;
    perform public.classroom_bump(attempt.room_id);
  else
    update public.attempts set status = 'technical_error', evaluated_at = p_now where id = p_attempt_id;
  end if;
end;
$$;

create function public.classroom_record_hint(
  p_participant_id uuid, p_mission_id text, p_now timestamptz
) returns void
language plpgsql set search_path = '' as $$
declare
  participant public.participants;
begin
  select * into participant from public.participants where id = p_participant_id for update;
  if not found then return; end if;
  insert into public.hints (room_id, participant_id, mission_id, used_at)
  values (participant.room_id, p_participant_id, p_mission_id, p_now)
  on conflict (participant_id, mission_id) do nothing;
  if found then perform public.classroom_bump(participant.room_id); end if;
end;
$$;

create function public.classroom_room_data(p_room_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select case when r.id is null then null else jsonb_build_object(
    'room', public.classroom_room_json(r),
    'participants', coalesce((
      select jsonb_agg(public.classroom_participant_json(p) order by p.joined_at)
      from public.participants p where p.room_id = r.id
    ), '[]'::jsonb),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'participantId', a.participant_id,
        'missionId', a.mission_id,
        'attemptNumber', a.attempt_number,
        'correct', a.correct,
        'score', a.score,
        'durationMs', a.duration_ms,
        'hintUsed', a.hint_used,
        'createdAt', public.classroom_ms(a.evaluated_at)
      ) order by a.evaluated_at)
      from public.attempts a where a.room_id = r.id and a.status = 'evaluated'
    ), '[]'::jsonb),
    'hints', coalesce((
      select jsonb_agg(jsonb_build_object(
        'participantId', h.participant_id,
        'missionId', h.mission_id,
        'usedAt', public.classroom_ms(h.used_at)
      ))
      from public.hints h where h.room_id = r.id
    ), '[]'::jsonb)
  ) end
  from public.rooms r where r.id = p_room_id
$$;

create function public.classroom_save_results(
  p_room_id uuid, p_results jsonb, p_now timestamptz
) returns void
language sql set search_path = '' as $$
  insert into public.results (
    room_id, participant_id, total_score, total_time_ms, accuracy, solved_missions, attempts,
    hints_used, completed_at
  )
  select p_room_id, (item ->> 'participantId')::uuid, (item ->> 'score')::integer,
    (item ->> 'timeMs')::bigint, (item ->> 'accuracy')::numeric,
    (item ->> 'solvedMissions')::smallint, (item ->> 'attempts')::smallint,
    (item ->> 'hintsUsed')::smallint, p_now
  from jsonb_array_elements(p_results) item
  on conflict (participant_id) do update set
    total_score = excluded.total_score, total_time_ms = excluded.total_time_ms,
    accuracy = excluded.accuracy, solved_missions = excluded.solved_missions,
    attempts = excluded.attempts, hints_used = excluded.hints_used,
    completed_at = excluded.completed_at
$$;

-- Mantenimiento (REALTIME_SPEC): caducar salas vencidas y borrar las terminadas hace más
-- de 30 días con todas sus dependencias. Programar con pg_cron o una tarea del servidor.
create function public.classroom_maintenance(p_now timestamptz) returns jsonb
language plpgsql set search_path = '' as $$
declare
  expired integer;
  deleted integer;
begin
  update public.rooms set state = 'expired', ended_at = p_now, revision = revision + 1
  where state in ('lobby', 'running') and expires_at <= p_now;
  get diagnostics expired = row_count;
  delete from public.rooms
  where state in ('finished', 'cancelled', 'expired') and ended_at < p_now - interval '30 days';
  get diagnostics deleted = row_count;
  return jsonb_build_object('expired', expired, 'deleted', deleted);
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'classroom_ms(timestamptz)',
    'classroom_room_json(public.rooms)',
    'classroom_participant_json(public.participants)',
    'classroom_bump(uuid)',
    'classroom_create_room(text, text, timestamptz, timestamptz)',
    'classroom_find_room_by_code(text)',
    'classroom_find_room(uuid)',
    'classroom_verify_presenter(uuid, text)',
    'classroom_join(uuid, text, text, text, integer, timestamptz)',
    'classroom_find_participant(uuid, text)',
    'classroom_touch(uuid, timestamptz)',
    'classroom_leave(uuid, timestamptz)',
    'classroom_transition(uuid, jsonb, text, boolean, timestamptz)',
    'classroom_reserve_attempt(uuid, text, uuid, text, integer, integer, timestamptz)',
    'classroom_complete_attempt(uuid, boolean, boolean, integer, integer, jsonb, timestamptz)',
    'classroom_record_hint(uuid, text, timestamptz)',
    'classroom_room_data(uuid)',
    'classroom_save_results(uuid, jsonb, timestamptz)',
    'classroom_maintenance(timestamptz)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end;
$$;
