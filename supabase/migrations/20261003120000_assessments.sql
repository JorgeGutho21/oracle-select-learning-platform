-- DB LAB, Fase 3: banco de preguntas, evaluaciones calificadas (0,0 a 5,0), intentos con
-- tiempo del servidor, supervisión de eventos del navegador y auditoría del profesor.
-- Migración aditiva: no cambia las tablas de la Fase 2 ni las de la sala en vivo.
--
-- Seguridad (detalle en docs/ASSESSMENT_SECURITY.md):
-- - RLS en todas las tablas nuevas. authenticated solo tiene SELECT y las políticas lo
--   limitan al profesor (private.is_teacher()). Un estudiante no lee ninguna tabla nueva:
--   todo lo suyo pasa por funciones security definer que comprueban la sesión, la
--   asignación, las fechas y el estado, y que nunca devuelven la clave de respuestas
--   mientras el intento está abierto.
-- - Ninguna escritura directa desde la API: crear, publicar, cerrar, responder, entregar y
--   calificar son funciones con sus propias comprobaciones. La nota la calcula la base; el
--   cliente nunca la envía.
-- - Al publicar, cada pregunta se congela (copia con versión). Editar el banco después no
--   cambia evaluaciones publicadas ni intentos entregados, y la nota es reproducible.

-- ---------------------------------------------------------------------------
-- Banco de preguntas
-- ---------------------------------------------------------------------------

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  -- Clave estable de las preguntas oficiales de DB LAB (por ejemplo S1-NULL-03). Las del
  -- profesor no la tienen.
  external_key text unique check (external_key ~ '^[A-Z0-9]+(-[A-Z0-9]+){1,4}$'),
  origin text not null default 'teacher' check (origin in ('dblab', 'teacher')),
  section_key text not null
    check (section_key in ('fundamentos-sql', 'consultas-relacionales', 'plsql')),
  topic text not null check (topic ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(topic) <= 40),
  subtopic text not null default '' check (char_length(subtopic) <= 80),
  -- Tipo pedagógico (cómo se presenta) y forma de respuesta (cómo se contesta y califica).
  question_type text not null check (question_type in (
    'single_choice', 'multiple_choice', 'predict_result', 'find_error', 'choose_query',
    'interpret_query', 'order_fragments', 'compare_results', 'concept', 'short_case'
  )),
  response_kind text not null check (response_kind in ('single', 'multiple', 'order')),
  prompt text not null
    check (char_length(prompt) between 1 and 2000 and prompt !~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]'),
  code text check (code is null or (char_length(code) <= 4000 and code !~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]')),
  -- Tablas de origen y consultas a comparar: {"tables":[…],"queries":[…]}. Datos, nunca HTML.
  exhibit jsonb check (exhibit is null or (jsonb_typeof(exhibit) = 'object' and pg_column_size(exhibit) <= 12000)),
  explanation text not null default '' check (char_length(explanation) <= 2000),
  concept text not null default '' check (char_length(concept) <= 200),
  review_hint text not null default '' check (char_length(review_hint) <= 500),
  reference text not null default '' check (char_length(reference) <= 500),
  -- Dificultad interna (no se muestra al estudiante) y peso en la nota.
  difficulty smallint not null check (difficulty between 1 and 5),
  weight numeric(4, 2) not null check (weight > 0 and weight <= 10),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  version integer not null default 1 check (version >= 1),
  content_hash text not null,
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (question_type = 'order_fragments') = (response_kind = 'order')
    and (question_type <> 'multiple_choice' or response_kind = 'multiple')
    and (question_type not in ('single_choice', 'predict_result', 'find_error', 'choose_query', 'interpret_query')
         or response_kind = 'single')
  )
);

create index question_bank_section on public.question_bank (section_key, status, topic);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank (id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  body text not null
    check (char_length(body) between 1 and 2000 and body !~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]'),
  body_kind text not null default 'text' check (body_kind in ('text', 'code', 'table')),
  -- Tabla de resultado de la opción (predicción de resultados): {"columns":[…],"rows":[[…]]}.
  result jsonb check (result is null or (jsonb_typeof(result) = 'object' and pg_column_size(result) <= 6000)),
  is_correct boolean not null default false,
  correct_position smallint check (correct_position between 1 and 8),
  -- Por qué esta opción es correcta o qué confusión revela si se elige.
  feedback text not null default '' check (char_length(feedback) <= 1000),
  unique (question_id, position)
);

-- ---------------------------------------------------------------------------
-- Evaluaciones
-- ---------------------------------------------------------------------------

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120 and title !~ '[[:cntrl:]]'),
  description text not null default ''
    check (char_length(description) <= 2000 and description !~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]'),
  section_key text not null
    check (section_key in ('fundamentos-sql', 'consultas-relacionales', 'plsql')),
  topics text[] not null default '{}' check (cardinality(topics) <= 30),
  -- manual: el profesor elige las preguntas; random: el sistema elige del banco publicado
  -- de la sección (y los temas) al publicar.
  selection_mode text not null default 'manual' check (selection_mode in ('manual', 'random')),
  question_count smallint not null check (question_count between 1 and 100),
  duration_minutes smallint not null check (duration_minutes between 5 and 300),
  opens_at timestamptz,
  closes_at timestamptz,
  max_attempts smallint not null default 1 check (max_attempts between 1 and 5),
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  feedback_mode text not null default 'hidden'
    check (feedback_mode in ('hidden', 'score_only', 'answers', 'full_feedback')),
  audience text not null default 'all' check (audience in ('all', 'selected')),
  institutional_only boolean not null default false,
  -- Registrar intentos de copiar, pegar y abrir el menú contextual (no se bloquean).
  record_clipboard boolean not null default true,
  pass_grade numeric(2, 1) not null default 3.0 check (pass_grade between 0 and 5),
  -- Ciclo de vida guardado. La fase visible (programada, activa…) se deriva de las fechas.
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  published_at timestamptz,
  entry_closed_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  -- Parte secreta del canal de avisos del monitor (solo la lee el profesor).
  monitor_key uuid not null default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create index assessments_status on public.assessments (status, opens_at);

-- Preguntas de la evaluación. En borrador (modo manual) solo la selección; al publicar se
-- congela la copia de cada pregunta (snapshot) con su versión y su peso. En modo aleatorio
-- estas filas son el conjunto del que se sortea cada intento.
create table public.assessment_questions (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id uuid not null references public.question_bank (id),
  position smallint not null check (position between 1 and 500),
  weight numeric(4, 2) check (weight > 0 and weight <= 10),
  version integer,
  snapshot jsonb,
  primary key (assessment_id, question_id),
  unique (assessment_id, position)
);

create index assessment_questions_question on public.assessment_questions (question_id);

-- Estudiantes elegidos cuando la evaluación no es para todos.
create table public.assessment_assignments (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assessment_id, student_id)
);

create index assessment_assignments_student on public.assessment_assignments (student_id);

-- ---------------------------------------------------------------------------
-- Intentos, respuestas y eventos
-- ---------------------------------------------------------------------------

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  attempt_number smallint not null check (attempt_number between 1 and 5),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'auto_submitted')),
  -- Quién lo cerró: la persona, el tiempo (expires_at) o el profesor al finalizar.
  submitted_by text check (submitted_by in ('student', 'timer', 'teacher')),
  -- Tiempo del servidor: la interfaz calcula lo que queda con estas dos marcas.
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  duration_seconds integer check (duration_seconds >= 0),
  current_position smallint not null default 1,
  last_seen_at timestamptz not null default now(),
  question_total smallint not null default 0,
  correct_count smallint,
  score_raw numeric(10, 4),
  score_possible numeric(10, 4),
  score_percent numeric(6, 2) check (score_percent between 0 and 100),
  grade numeric(2, 1) check (grade between 0 and 5),
  unique (assessment_id, student_id, attempt_number),
  check (expires_at > started_at)
);

-- Un solo intento abierto por persona y evaluación (protege contra doble clic y pestañas).
create unique index assessment_attempts_open
  on public.assessment_attempts (assessment_id, student_id) where status = 'in_progress';
create index assessment_attempts_student on public.assessment_attempts (student_id, assessment_id);
create index assessment_attempts_assessment on public.assessment_attempts (assessment_id, status);

-- Una fila por pregunta asignada al intento: orden presentado de las opciones, respuesta,
-- marca de revisión y calificación. La respuesta guarda identificadores, nunca HTML.
create table public.assessment_answers (
  attempt_id uuid not null references public.assessment_attempts (id) on delete cascade,
  position smallint not null check (position between 1 and 100),
  assessment_id uuid not null,
  question_id uuid not null,
  weight numeric(4, 2) not null check (weight > 0),
  option_order uuid[] not null,
  response jsonb check (response is null or (jsonb_typeof(response) = 'object' and pg_column_size(response) <= 1024)),
  flagged boolean not null default false,
  -- Versión de la respuesta en el dispositivo: una petición atrasada nunca pisa una nueva.
  revision integer not null default 0 check (revision >= 0),
  saved_at timestamptz,
  credit numeric(5, 4) check (credit between 0 and 1),
  earned numeric(8, 4),
  primary key (attempt_id, position),
  foreign key (assessment_id, question_id)
    references public.assessment_questions (assessment_id, question_id) on delete cascade
);

create index assessment_answers_question on public.assessment_answers (assessment_id, question_id);

-- Eventos del navegador técnicamente verificables durante un intento. No incluyen teclas,
-- texto, capturas, cámara, micrófono, IP ni historial. No prueban fraude por sí solos.
create table public.assessment_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.assessment_attempts (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in (
    'started', 'entered', 'reloaded', 'focus_lost', 'focus_returned', 'visibility_hidden',
    'visibility_visible', 'fullscreen_entered', 'fullscreen_exited', 'copy_attempt',
    'paste_attempt', 'context_menu', 'offline', 'online', 'page_exit', 'submitted',
    'auto_submitted'
  )),
  -- Hora del servidor menos el retraso declarado por el navegador (acotado a 10 minutos).
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 256)
);

create index assessment_events_attempt on public.assessment_events (attempt_id, occurred_at desc);
create index assessment_events_assessment on public.assessment_events (assessment_id, occurred_at desc);

-- Trazabilidad básica de las acciones del profesor.
create table public.assessment_audit (
  id bigint generated always as identity primary key,
  assessment_id uuid references public.assessments (id) on delete set null,
  question_id uuid references public.question_bank (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in (
    'question_created', 'question_updated', 'question_status', 'bank_synced',
    'assessment_created', 'assessment_saved', 'assessment_duplicated', 'assessment_published',
    'entries_closed', 'assessment_finalized', 'feedback_changed', 'assessment_archived',
    'assessment_deleted'
  )),
  details jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 2048),
  created_at timestamptz not null default now()
);

create index assessment_audit_assessment on public.assessment_audit (assessment_id, created_at desc);

-- Último aviso enviado al monitor de cada evaluación (agrupa avisos: uno cada 2 s como mucho).
create table private.monitor_signals (
  assessment_id uuid primary key references public.assessments (id) on delete cascade,
  sent_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (esquema private)
-- ---------------------------------------------------------------------------

-- Fase visible de una evaluación publicada según las fechas y el cierre de accesos.
create function private.assessment_phase(a public.assessments, p_now timestamptz) returns text
language sql stable set search_path = '' as $$
  select case
    when a.status <> 'published' then a.status
    when a.opens_at is not null and p_now < a.opens_at then 'scheduled'
    when a.closes_at is not null and p_now >= a.closes_at then 'closed'
    when a.entry_closed_at is not null then 'ending'
    else 'active'
  end
$$;

create function private.is_eligible(a public.assessments, p_student uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_student
      and p.role = 'student'
      and (not a.institutional_only or p.institutional)
      and (a.audience = 'all' or exists (
        select 1 from public.assessment_assignments x
        where x.assessment_id = a.id and x.student_id = p_student
      ))
  )
$$;

create function private.audit(
  p_action text, p_assessment uuid, p_question uuid, p_details jsonb
) returns void
language sql security definer set search_path = '' as $$
  insert into public.assessment_audit (assessment_id, question_id, actor_id, action, details)
  values (p_assessment, p_question, (select auth.uid()), p_action, coalesce(p_details, '{}'::jsonb))
$$;

-- Aviso sin datos personales al canal del monitor del profesor (Supabase Realtime,
-- «broadcast from database»). Sin Realtime (pruebas locales) no hace nada, y un fallo del
-- aviso nunca impide guardar una respuesta: el monitor también consulta cada 30 s.
create function private.signal_monitor(p_assessment uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  sent integer;
  topic text;
begin
  insert into private.monitor_signals as s (assessment_id, sent_at) values (p_assessment, now())
  on conflict (assessment_id) do update set sent_at = excluded.sent_at
    where s.sent_at < now() - interval '2 seconds';
  get diagnostics sent = row_count;
  if sent = 0 or to_regprocedure('realtime.send(jsonb, text, text, boolean)') is null then
    return;
  end if;
  select 'assessment-monitor:' || monitor_key::text into topic
  from public.assessments where id = p_assessment;
  begin
    execute 'select realtime.send($1, $2, $3, false)'
      using jsonb_build_object('at', extract(epoch from now())::bigint), 'changed', topic;
  exception when others then
    null;
  end;
end;
$$;

create function private.safe_int(p_value text, p_min integer, p_max integer) returns integer
language sql immutable set search_path = '' as $$
  select case
    when p_value ~ '^-?[0-9]{1,9}$' then least(greatest(p_value::integer, p_min), p_max)
  end
$$;

-- Problemas de forma de una pregunta (además de las restricciones de la tabla).
create function private.question_problems(p_kind text, p_options jsonb) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  total integer;
  correct integer;
  problems text[] := '{}';
begin
  if jsonb_typeof(p_options) is distinct from 'array' then
    return array['options-count'];
  end if;
  total := jsonb_array_length(p_options);
  if total < 2 or total > 8 then
    problems := array_append(problems, 'options-count');
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_options) o
    where jsonb_typeof(o) <> 'object' or coalesce(btrim(o ->> 'body'), '') = ''
  ) then
    problems := array_append(problems, 'option-body');
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_options) o
    where o ->> 'kind' = 'table' and jsonb_typeof(o -> 'result') is distinct from 'object'
  ) then
    problems := array_append(problems, 'option-table');
  end if;
  select count(*) filter (where o ->> 'correct' = 'true') into correct
  from jsonb_array_elements(p_options) o;
  if p_kind = 'single' and correct <> 1 then
    problems := array_append(problems, 'single-correct');
  elsif p_kind = 'multiple' and (correct < 1 or correct >= total) then
    problems := array_append(problems, 'multiple-correct');
  elsif p_kind = 'order' and (
    select coalesce(array_agg(private.safe_int(o ->> 'order', 0, 99) order by private.safe_int(o ->> 'order', 0, 99)), '{}')
    from jsonb_array_elements(p_options) o
  ) is distinct from array(select generate_series(1, total)) then
    problems := array_append(problems, 'order-permutation');
  end if;
  return problems;
end;
$$;

-- Crea o actualiza una pregunta con sus opciones de forma atómica. Si el contenido cambia,
-- sube la versión; las evaluaciones publicadas conservan su copia anterior.
create function private.upsert_question(p jsonb, p_origin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_key text := nullif(p ->> 'external_key', '');
  existing public.question_bank;
  v_kind text := p ->> 'response';
  v_difficulty smallint := (p ->> 'difficulty')::smallint;
  v_weight numeric(4, 2);
  v_options jsonb := coalesce(p -> 'options', '[]'::jsonb);
  v_tags text[];
  v_doc jsonb;
  v_hash text;
  v_status text;
  problems text[];
begin
  problems := private.question_problems(v_kind, v_options);
  if cardinality(problems) > 0 then
    return jsonb_build_object('status', 'invalid', 'problems', to_jsonb(problems));
  end if;
  if v_id is not null then
    select * into existing from public.question_bank where id = v_id for update;
    if existing.id is null then
      return jsonb_build_object('status', 'not-found');
    end if;
  elsif v_key is not null then
    select * into existing from public.question_bank where external_key = v_key for update;
    v_id := existing.id;
  end if;
  if existing.id is not null and existing.origin <> p_origin then
    return jsonb_build_object('status', 'official-readonly');
  end if;
  v_weight := coalesce(nullif(p ->> 'weight', '')::numeric(4, 2), 1 + (v_difficulty - 1) * 0.25);
  v_tags := coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'tags', '[]'::jsonb))), '{}');
  v_status := coalesce(nullif(p ->> 'status', ''), existing.status, 'draft');
  v_doc := jsonb_build_object(
    'section', p ->> 'section', 'topic', p ->> 'topic', 'subtopic', coalesce(p ->> 'subtopic', ''),
    'type', p ->> 'type', 'response', v_kind, 'prompt', p ->> 'prompt',
    'code', nullif(p ->> 'code', ''), 'exhibit', p -> 'exhibit',
    'explanation', coalesce(p ->> 'explanation', ''), 'concept', coalesce(p ->> 'concept', ''),
    'review', coalesce(p ->> 'review', ''), 'reference', coalesce(p ->> 'reference', ''),
    'difficulty', v_difficulty, 'weight', v_weight, 'tags', to_jsonb(v_tags),
    'options', (
      select jsonb_agg(jsonb_build_object(
        'body', o ->> 'body', 'kind', coalesce(o ->> 'kind', 'text'), 'result', o -> 'result',
        'correct', v_kind <> 'order' and coalesce(o ->> 'correct' = 'true', false),
        'order', case when v_kind = 'order' then (o ->> 'order')::integer end,
        'feedback', coalesce(o ->> 'feedback', '')
      ) order by n)
      from jsonb_array_elements(v_options) with ordinality as t(o, n)
    )
  );
  v_hash := md5(v_doc::text);
  if existing.id is not null and existing.content_hash = v_hash then
    if existing.status <> v_status and p ? 'status' then
      update public.question_bank set status = v_status, updated_at = now() where id = existing.id;
    end if;
    return jsonb_build_object('status', 'unchanged', 'id', existing.id, 'version', existing.version);
  end if;
  if existing.id is null then
    insert into public.question_bank (
      external_key, origin, section_key, topic, subtopic, question_type, response_kind, prompt,
      code, exhibit, explanation, concept, review_hint, reference, difficulty, weight, status,
      content_hash, tags, created_by
    ) values (
      v_key, p_origin, v_doc ->> 'section', v_doc ->> 'topic', v_doc ->> 'subtopic',
      v_doc ->> 'type', v_kind, v_doc ->> 'prompt', v_doc ->> 'code',
      case when jsonb_typeof(v_doc -> 'exhibit') = 'object' then v_doc -> 'exhibit' end,
      v_doc ->> 'explanation', v_doc ->> 'concept', v_doc ->> 'review', v_doc ->> 'reference',
      v_difficulty, v_weight, v_status, v_hash, v_tags, (select auth.uid())
    ) returning id into v_id;
  else
    update public.question_bank set
      section_key = v_doc ->> 'section', topic = v_doc ->> 'topic', subtopic = v_doc ->> 'subtopic',
      question_type = v_doc ->> 'type', response_kind = v_kind, prompt = v_doc ->> 'prompt',
      code = v_doc ->> 'code',
      exhibit = case when jsonb_typeof(v_doc -> 'exhibit') = 'object' then v_doc -> 'exhibit' end,
      explanation = v_doc ->> 'explanation', concept = v_doc ->> 'concept',
      review_hint = v_doc ->> 'review', reference = v_doc ->> 'reference',
      difficulty = v_difficulty, weight = v_weight, status = v_status, tags = v_tags,
      content_hash = v_hash, version = version + 1, updated_at = now()
    where id = v_id;
    delete from public.question_options where question_id = v_id;
  end if;
  insert into public.question_options (
    question_id, position, body, body_kind, result, is_correct, correct_position, feedback
  )
  select v_id, n, o ->> 'body', o ->> 'kind',
    case when jsonb_typeof(o -> 'result') = 'object' then o -> 'result' end,
    (o ->> 'correct')::boolean, (o ->> 'order')::smallint, o ->> 'feedback'
  from jsonb_array_elements(v_doc -> 'options') with ordinality as t(o, n);
  return jsonb_build_object(
    'status', case when existing.id is null then 'created' else 'updated' end,
    'id', v_id,
    'version', coalesce(existing.version + 1, 1)
  );
end;
$$;

-- Copia congelada de la pregunta (con su clave) que usan la evaluación publicada y sus
-- intentos.
create function private.question_snapshot(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'question_id', q.id, 'version', q.version, 'external_key', q.external_key,
    'section', q.section_key, 'topic', q.topic, 'subtopic', q.subtopic,
    'type', q.question_type, 'response', q.response_kind, 'prompt', q.prompt, 'code', q.code,
    'exhibit', q.exhibit, 'explanation', q.explanation, 'concept', q.concept,
    'review', q.review_hint, 'reference', q.reference, 'difficulty', q.difficulty,
    'weight', q.weight,
    'options', (
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'body', o.body, 'kind', o.body_kind, 'result', o.result,
        'correct', o.is_correct, 'order', o.correct_position, 'feedback', o.feedback
      ) order by o.position)
      from public.question_options o where o.question_id = q.id
    )
  )
  from public.question_bank q where q.id = p_id
$$;

-- Lo que ve el estudiante durante el intento: sin clave, sin explicación, sin dificultad.
create function private.public_item(p_item jsonb, p_order uuid[]) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'type', p_item -> 'type', 'response', p_item -> 'response', 'prompt', p_item -> 'prompt',
    'code', p_item -> 'code', 'exhibit', p_item -> 'exhibit',
    'options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o -> 'id', 'body', o -> 'body', 'kind', o -> 'kind', 'result', o -> 'result'
      ) order by k.n)
      from unnest(p_order) with ordinality as k(id, n)
      join jsonb_array_elements(p_item -> 'options') o on (o ->> 'id')::uuid = k.id
    ), '[]'::jsonb)
  )
$$;

-- Lo que ve el estudiante cuando el profesor libera respuestas (y explicaciones).
create function private.reviewed_item(p_item jsonb, p_order uuid[], p_full boolean) returns jsonb
language sql immutable set search_path = '' as $$
  select private.public_item(p_item, p_order)
    || jsonb_build_object(
      'options', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', o -> 'id', 'body', o -> 'body', 'kind', o -> 'kind', 'result', o -> 'result',
          'correct', o -> 'correct', 'order', o -> 'order',
          'feedback', case when p_full then o -> 'feedback' end
        ) order by k.n)
        from unnest(p_order) with ordinality as k(id, n)
        join jsonb_array_elements(p_item -> 'options') o on (o ->> 'id')::uuid = k.id
      ), '[]'::jsonb)
    )
    || case when p_full then jsonb_build_object(
      'explanation', p_item -> 'explanation', 'concept', p_item -> 'concept',
      'review', p_item -> 'review', 'reference', p_item -> 'reference'
    ) else '{}'::jsonb end
$$;

-- Normaliza y valida una respuesta frente a las opciones de la pregunta. Devuelve null si
-- no es válida (o si está vacía) y la respuesta normalizada en otro caso.
create function private.normalize_response(p_kind text, p_options uuid[], p_response jsonb)
returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
  ids text[];
begin
  if p_response is null or jsonb_typeof(p_response) <> 'object' then
    return null;
  end if;
  if p_kind = 'single' then
    if jsonb_typeof(p_response -> 'choice') = 'string'
      and (p_response ->> 'choice') = any (p_options::text[]) then
      return jsonb_build_object('choice', p_response ->> 'choice');
    end if;
    return null;
  end if;
  if jsonb_typeof(p_response -> case when p_kind = 'order' then 'order' else 'choices' end)
    is distinct from 'array' then
    return null;
  end if;
  if p_kind = 'multiple' then
    select array_agg(distinct x order by x) into ids
    from jsonb_array_elements_text(p_response -> 'choices') x;
    if ids is null or not ids <@ p_options::text[] then
      return null;
    end if;
    return jsonb_build_object('choices', to_jsonb(ids));
  end if;
  if p_kind = 'order' then
    select array_agg(x order by n) into ids
    from jsonb_array_elements_text(p_response -> 'order') with ordinality as t(x, n);
    if ids is null or cardinality(ids) <> cardinality(p_options)
      or not (ids <@ p_options::text[] and p_options::text[] <@ ids)
      or (select count(distinct x) from unnest(ids) x) <> cardinality(ids) then
      return null;
    end if;
    return jsonb_build_object('order', to_jsonb(ids));
  end if;
  return null;
end;
$$;

-- Crédito de una pregunta entre 0 y 1 (docs/ASSESSMENT_ARCHITECTURE.md, «Calificación»):
-- única y ordenamiento, todo o nada; múltiple, (aciertos − marcas incorrectas) / correctas,
-- nunca menos de 0.
create function private.item_credit(p_item jsonb, p_response jsonb) returns numeric
language plpgsql immutable set search_path = '' as $$
declare
  kind text := p_item ->> 'response';
  correct text[];
  chosen text[];
  hits integer;
begin
  if p_response is null then
    return 0;
  end if;
  if kind = 'single' then
    return case when exists (
      select 1 from jsonb_array_elements(p_item -> 'options') o
      where o ->> 'id' = p_response ->> 'choice' and (o ->> 'correct')::boolean
    ) then 1 else 0 end;
  elsif kind = 'multiple' then
    select array_agg(o ->> 'id') into correct
    from jsonb_array_elements(p_item -> 'options') o where (o ->> 'correct')::boolean;
    select array_agg(distinct x) into chosen from jsonb_array_elements_text(p_response -> 'choices') x;
    if correct is null or chosen is null then
      return 0;
    end if;
    hits := (select count(*) from unnest(chosen) x where x = any (correct));
    return round(greatest(0, hits - (cardinality(chosen) - hits))::numeric / cardinality(correct), 4);
  elsif kind = 'order' then
    return case when (
      select array_agg(x order by n) from jsonb_array_elements_text(p_response -> 'order') with ordinality as t(x, n)
    ) = (
      select array_agg(o ->> 'id' order by (o ->> 'order')::integer) from jsonb_array_elements(p_item -> 'options') o
    ) then 1 else 0 end;
  end if;
  return 0;
end;
$$;

-- Califica un intento con las copias congeladas, las respuestas y los pesos guardados.
-- Repetirla da el mismo resultado (reproducible).
create function private.grade_attempt(p_attempt uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  raw numeric;
  possible numeric;
  right_count integer;
begin
  update public.assessment_answers ans set
    credit = private.item_credit(q.snapshot, ans.response),
    earned = round(private.item_credit(q.snapshot, ans.response) * ans.weight, 4)
  from public.assessment_questions q
  where ans.attempt_id = p_attempt
    and q.assessment_id = ans.assessment_id and q.question_id = ans.question_id;
  select coalesce(sum(earned), 0), coalesce(sum(weight), 0), count(*) filter (where credit = 1)
  into raw, possible, right_count
  from public.assessment_answers where attempt_id = p_attempt;
  update public.assessment_attempts set
    score_raw = raw,
    score_possible = possible,
    correct_count = right_count,
    score_percent = case when possible > 0 then round(raw / possible * 100, 2) else 0 end,
    grade = case when possible > 0 then round(raw / possible * 5, 1) else 0 end
  where id = p_attempt;
end;
$$;

-- Cierra y califica un intento abierto. p_by: student, timer o teacher.
create function private.finish_attempt(p_attempt uuid, p_by text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t public.assessment_attempts;
  ended timestamptz;
begin
  select * into t from public.assessment_attempts where id = p_attempt for update;
  if t.id is null or t.status <> 'in_progress' then
    return;
  end if;
  ended := case when p_by = 'timer' then least(now(), t.expires_at) else now() end;
  update public.assessment_attempts set
    status = case when p_by = 'student' then 'submitted' else 'auto_submitted' end,
    submitted_by = p_by,
    submitted_at = ended,
    duration_seconds = greatest(0, floor(extract(epoch from (ended - t.started_at))))::integer
  where id = p_attempt;
  perform private.grade_attempt(p_attempt);
  insert into public.assessment_events (attempt_id, assessment_id, student_id, event_type, metadata)
  values (
    p_attempt, t.assessment_id, t.student_id,
    case when p_by = 'student' then 'submitted' else 'auto_submitted' end,
    jsonb_build_object('by', p_by)
  );
  perform private.signal_monitor(t.assessment_id);
end;
$$;

-- Margen para respuestas enviadas justo antes del final (latencia de red).
create function private.grace() returns interval
language sql immutable set search_path = '' as $$ select interval '5 seconds' $$;

-- Cierre perezoso: cualquier lectura de un intento vencido lo entrega por tiempo, aunque la
-- persona haya cerrado el navegador. No hace falta un proceso programado.
create function private.finalize_if_expired(p_attempt uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.assessment_attempts
    where id = p_attempt and status = 'in_progress' and now() > expires_at + private.grace()
  ) then
    perform private.finish_attempt(p_attempt, 'timer');
    return true;
  end if;
  return false;
end;
$$;

create function private.finalize_expired(p_assessment uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  item record;
  total integer := 0;
begin
  for item in
    select id from public.assessment_attempts
    where assessment_id = p_assessment and status = 'in_progress' and now() > expires_at + private.grace()
  loop
    perform private.finish_attempt(item.id, 'timer');
    total := total + 1;
  end loop;
  return total;
end;
$$;

-- Orden presentado de las opciones. Los fragmentos a ordenar nunca aparecen ya ordenados.
create function private.option_order(p_item jsonb, p_shuffle boolean) returns uuid[]
language plpgsql volatile set search_path = '' as $$
declare
  natural_order uuid[];
  solution uuid[];
  shuffled uuid[];
  tries integer := 0;
begin
  select array_agg((o ->> 'id')::uuid order by n) into natural_order
  from jsonb_array_elements(p_item -> 'options') with ordinality as t(o, n);
  if p_item ->> 'response' <> 'order' then
    if not p_shuffle then
      return natural_order;
    end if;
    return array(select x from unnest(natural_order) x order by random());
  end if;
  select array_agg((o ->> 'id')::uuid order by (o ->> 'order')::integer) into solution
  from jsonb_array_elements(p_item -> 'options') o;
  loop
    shuffled := array(select x from unnest(natural_order) x order by random());
    tries := tries + 1;
    exit when shuffled is distinct from solution or tries >= 6;
  end loop;
  if shuffled = solution then
    shuffled := array(select x from unnest(solution) with ordinality as t(x, n) order by n desc);
  end if;
  return shuffled;
end;
$$;

-- Sorteo de preguntas equivalente: muestreo sistemático sobre el conjunto ordenado por
-- dificultad y tema, con un desplazamiento al azar. Cada intento recibe la misma cantidad y
-- una mezcla de dificultades y temas proporcional al conjunto publicado.
create function private.pick_questions(p_assessment uuid, p_count integer)
returns table (question_id uuid, base_position integer, weight numeric, snapshot jsonb)
language sql volatile set search_path = '' as $$
  with pool as materialized (
    select q.question_id, q.position::integer as position, q.weight, q.snapshot,
      row_number() over (
        order by (q.snapshot ->> 'difficulty')::integer, q.snapshot ->> 'topic', random()
      ) - 1 as k,
      count(*) over () as n
    from public.assessment_questions q
    where q.assessment_id = p_assessment
  ),
  draw as materialized (select random() as u)
  select pool.question_id, pool.position, pool.weight, pool.snapshot
  from pool
  where pool.n <= p_count
  union all
  select pool.question_id, pool.position, pool.weight, pool.snapshot
  from pool, draw, generate_series(0, p_count - 1) as i
  where pool.n > p_count and pool.k = floor((draw.u + i) * pool.n::numeric / p_count)
$$;

-- Resumen de una evaluación para el estudiante (sin datos de otras personas).
create function private.student_summary(a public.assessments, p_student uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', a.id, 'title', a.title, 'description', a.description, 'section_key', a.section_key,
    'question_count', a.question_count, 'duration_minutes', a.duration_minutes,
    'opens_at', a.opens_at, 'closes_at', a.closes_at, 'max_attempts', a.max_attempts,
    'record_clipboard', a.record_clipboard, 'pass_grade', a.pass_grade,
    'phase', private.assessment_phase(a, now()),
    'feedback_mode', a.feedback_mode,
    'server_now', now(),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'number', t.attempt_number, 'status', t.status, 'submitted_by', t.submitted_by,
        'started_at', t.started_at, 'expires_at', t.expires_at, 'submitted_at', t.submitted_at,
        'grade', case when a.feedback_mode <> 'hidden' and t.status <> 'in_progress' then t.grade end,
        'score_percent', case when a.feedback_mode <> 'hidden' and t.status <> 'in_progress' then t.score_percent end,
        'correct_count', case when a.feedback_mode <> 'hidden' and t.status <> 'in_progress' then t.correct_count end,
        'question_total', t.question_total
      ) order by t.attempt_number)
      from public.assessment_attempts t
      where t.assessment_id = a.id and t.student_id = p_student
    ), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Funciones del estudiante (API: solo authenticated)
-- ---------------------------------------------------------------------------

-- Evaluaciones visibles para la persona: publicadas para ella, o en las que ya participó.
create function public.student_assessments() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  item record;
begin
  if me is null then
    return '[]'::jsonb;
  end if;
  for item in
    select t.id from public.assessment_attempts t
    where t.student_id = me and t.status = 'in_progress' and now() > t.expires_at + private.grace()
  loop
    perform private.finish_attempt(item.id, 'timer');
  end loop;
  return coalesce((
    select jsonb_agg(private.student_summary(a, me) order by coalesce(a.opens_at, a.published_at) desc)
    from public.assessments a
    where (
      a.status in ('published', 'closed') and private.is_eligible(a, me)
    ) or exists (
      select 1 from public.assessment_attempts t where t.assessment_id = a.id and t.student_id = me
    )
  ), '[]'::jsonb);
end;
$$;

create function public.student_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  a public.assessments;
  open_id uuid;
begin
  select * into a from public.assessments where id = p_assessment;
  if me is null or a.id is null or a.status = 'draft' then
    return jsonb_build_object('status', 'not-found');
  end if;
  if not (
    (a.status in ('published', 'closed') and private.is_eligible(a, me))
    or exists (select 1 from public.assessment_attempts t where t.assessment_id = a.id and t.student_id = me)
  ) then
    return jsonb_build_object('status', 'not-found');
  end if;
  select id into open_id from public.assessment_attempts
  where assessment_id = a.id and student_id = me and status = 'in_progress';
  if open_id is not null then
    perform private.finalize_if_expired(open_id);
  end if;
  return jsonb_build_object('status', 'ok', 'assessment', private.student_summary(a, me));
end;
$$;

-- Comienza (o retoma) un intento. El tiempo empieza aquí, en el servidor, y no antes.
create function public.start_attempt(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  a public.assessments;
  open_id uuid;
  used integer;
  new_id uuid;
  ends timestamptz;
  total integer;
begin
  if me is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  -- Un solo inicio a la vez por persona y evaluación (doble clic, dos pestañas).
  perform pg_advisory_xact_lock(hashtextextended(p_assessment::text || me::text, 0));
  select * into a from public.assessments where id = p_assessment;
  if a.id is null or a.status not in ('published', 'closed') or not private.is_eligible(a, me) then
    return jsonb_build_object('status', 'not-found');
  end if;
  select id into open_id from public.assessment_attempts
  where assessment_id = a.id and student_id = me and status = 'in_progress';
  if open_id is not null then
    if private.finalize_if_expired(open_id) then
      return jsonb_build_object('status', 'time-over', 'attempt_id', open_id);
    end if;
    insert into public.assessment_events (attempt_id, assessment_id, student_id, event_type)
    values (open_id, a.id, me, 'entered');
    perform private.signal_monitor(a.id);
    return jsonb_build_object('status', 'resumed', 'attempt_id', open_id);
  end if;
  case private.assessment_phase(a, now())
    when 'scheduled' then return jsonb_build_object('status', 'not-open');
    when 'active' then null;
    else return jsonb_build_object('status', 'closed');
  end case;
  if a.closes_at is not null and a.closes_at < now() + interval '1 minute' then
    return jsonb_build_object('status', 'closed');
  end if;
  select count(*) into used from public.assessment_attempts where assessment_id = a.id and student_id = me;
  if used >= a.max_attempts then
    return jsonb_build_object('status', 'no-attempts-left');
  end if;
  ends := now() + make_interval(mins => a.duration_minutes);
  if a.closes_at is not null then
    ends := least(ends, a.closes_at);
  end if;
  insert into public.assessment_attempts (assessment_id, student_id, attempt_number, expires_at)
  values (a.id, me, used + 1, ends)
  returning id into new_id;
  insert into public.assessment_answers (attempt_id, position, assessment_id, question_id, weight, option_order)
  select new_id,
    row_number() over (order by case when a.shuffle_questions then random() end, p.base_position),
    a.id, p.question_id, p.weight, private.option_order(p.snapshot, a.shuffle_options)
  from private.pick_questions(a.id, a.question_count) p;
  get diagnostics total = row_count;
  if total = 0 then
    raise exception 'La evaluación no tiene preguntas.' using errcode = 'P0001';
  end if;
  update public.assessment_attempts set question_total = total where id = new_id;
  insert into public.assessment_events (attempt_id, assessment_id, student_id, event_type)
  values (new_id, a.id, me, 'started');
  perform private.signal_monitor(a.id);
  return jsonb_build_object('status', 'started', 'attempt_id', new_id);
end;
$$;

-- El intento de la persona: preguntas sin clave mientras está abierto; resultado y
-- retroalimentación según lo que haya liberado el profesor cuando ya está entregado.
create function public.attempt_view(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  t public.assessment_attempts;
  a public.assessments;
  base jsonb;
begin
  select * into t from public.assessment_attempts where id = p_attempt and student_id = me;
  if me is null or t.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  if private.finalize_if_expired(t.id) then
    select * into t from public.assessment_attempts where id = p_attempt;
  end if;
  select * into a from public.assessments where id = t.assessment_id;
  base := jsonb_build_object(
    'attempt_id', t.id, 'attempt_status', t.status, 'submitted_by', t.submitted_by,
    'started_at', t.started_at, 'expires_at', t.expires_at, 'submitted_at', t.submitted_at,
    'server_now', now(), 'current_position', t.current_position, 'question_total', t.question_total,
    'assessment', jsonb_build_object(
      'id', a.id, 'title', a.title, 'section_key', a.section_key,
      'record_clipboard', a.record_clipboard, 'feedback_mode', a.feedback_mode,
      'pass_grade', a.pass_grade
    )
  );
  if t.status = 'in_progress' then
    return base || jsonb_build_object('status', 'in_progress', 'items', (
      select jsonb_agg(
        private.public_item(q.snapshot, ans.option_order) || jsonb_build_object(
          'position', ans.position, 'answer', ans.response, 'flagged', ans.flagged,
          'revision', ans.revision
        ) order by ans.position)
      from public.assessment_answers ans
      join public.assessment_questions q
        on q.assessment_id = ans.assessment_id and q.question_id = ans.question_id
      where ans.attempt_id = t.id
    ));
  end if;
  if a.feedback_mode = 'hidden' then
    return base || jsonb_build_object('status', 'finished', 'release', 'hidden');
  end if;
  base := base || jsonb_build_object(
    'status', 'finished', 'release', a.feedback_mode, 'grade', t.grade,
    'score_percent', t.score_percent, 'correct_count', t.correct_count
  );
  if a.feedback_mode = 'score_only' then
    return base;
  end if;
  return base || jsonb_build_object('items', (
    select jsonb_agg(
      private.reviewed_item(q.snapshot, ans.option_order, a.feedback_mode = 'full_feedback')
        || jsonb_build_object('position', ans.position, 'answer', ans.response, 'credit', ans.credit)
      order by ans.position)
    from public.assessment_answers ans
    join public.assessment_questions q
      on q.assessment_id = ans.assessment_id and q.question_id = ans.question_id
    where ans.attempt_id = t.id
  ));
end;
$$;

-- Autoguardado por lotes: [{position, answer, flagged, revision}]. Solo se acepta una
-- revisión mayor que la guardada, así una petición atrasada no pisa una respuesta nueva.
create function public.save_answers(p_attempt uuid, p_position integer, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  t public.assessment_attempts;
  entry jsonb;
  pos integer;
  rev integer;
  current_row public.assessment_answers;
  kind text;
  normalized jsonb;
  saved jsonb := '[]'::jsonb;
  rejected jsonb := '[]'::jsonb;
begin
  select * into t from public.assessment_attempts where id = p_attempt and student_id = me for update;
  if me is null or t.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  if t.status <> 'in_progress' then
    return jsonb_build_object('status', 'finished');
  end if;
  if now() > t.expires_at + private.grace() then
    perform private.finish_attempt(t.id, 'timer');
    return jsonb_build_object('status', 'finished');
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 100 then
    return jsonb_build_object('status', 'invalid');
  end if;
  for entry in select value from jsonb_array_elements(p_answers) loop
    pos := private.safe_int(entry ->> 'position', 0, 1000);
    rev := private.safe_int(entry ->> 'revision', -1, 1000000000);
    select * into current_row from public.assessment_answers
    where attempt_id = t.id and position = pos;
    if current_row.attempt_id is null or rev is null or rev < 1 then
      rejected := rejected || to_jsonb(pos);
      continue;
    end if;
    if rev > current_row.revision then
      select q.snapshot ->> 'response' into kind from public.assessment_questions q
      where q.assessment_id = current_row.assessment_id and q.question_id = current_row.question_id;
      normalized := private.normalize_response(kind, current_row.option_order, entry -> 'answer');
      if normalized is null and jsonb_typeof(entry -> 'answer') = 'object' then
        rejected := rejected || to_jsonb(pos);
        continue;
      end if;
      update public.assessment_answers set
        response = normalized,
        flagged = coalesce((entry ->> 'flagged')::boolean, false),
        revision = rev,
        saved_at = now()
      where attempt_id = t.id and position = pos;
      saved := saved || jsonb_build_object('position', pos, 'revision', rev);
    else
      saved := saved || jsonb_build_object('position', pos, 'revision', current_row.revision);
    end if;
  end loop;
  update public.assessment_attempts set
    last_seen_at = now(),
    current_position = coalesce(private.safe_int(p_position::text, 1, t.question_total), current_position)
  where id = t.id;
  perform private.signal_monitor(t.assessment_id);
  return jsonb_build_object(
    'status', 'saved', 'saved', saved, 'rejected', rejected,
    'server_now', now(), 'expires_at', t.expires_at
  );
end;
$$;

-- Eventos de supervisión por lotes y señal de conexión. [{type, ago_ms, position, duration_ms}]
create function public.log_attempt_events(p_attempt uuid, p_position integer, p_events jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  t public.assessment_attempts;
  stored integer;
  inserted integer := 0;
begin
  select * into t from public.assessment_attempts where id = p_attempt and student_id = me for update;
  if me is null or t.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  if t.status <> 'in_progress' then
    return jsonb_build_object('status', 'finished');
  end if;
  if now() > t.expires_at + private.grace() then
    perform private.finish_attempt(t.id, 'timer');
    return jsonb_build_object('status', 'finished');
  end if;
  if jsonb_typeof(p_events) = 'array' and jsonb_array_length(p_events) > 0 then
    select count(*) into stored from public.assessment_events where attempt_id = t.id;
    -- Tope por intento: suficiente para un examen real, insuficiente para llenar la base.
    insert into public.assessment_events (attempt_id, assessment_id, student_id, event_type, occurred_at, metadata)
    select t.id, t.assessment_id, me, e ->> 'type',
      now() - make_interval(secs => coalesce(private.safe_int(e ->> 'ago_ms', 0, 600000), 0) / 1000.0),
      jsonb_strip_nulls(jsonb_build_object(
        'position', private.safe_int(e ->> 'position', 1, 100),
        'duration_ms', private.safe_int(e ->> 'duration_ms', 0, 86400000)
      ))
    from (
      select e, row_number() over (order by ord) as n
      from jsonb_array_elements(p_events) with ordinality as x(e, ord)
      where jsonb_typeof(e) = 'object'
        and e ->> 'type' in (
          'entered', 'reloaded', 'focus_lost', 'focus_returned', 'visibility_hidden',
          'visibility_visible', 'fullscreen_entered', 'fullscreen_exited', 'copy_attempt',
          'paste_attempt', 'context_menu', 'offline', 'online', 'page_exit'
        )
    ) valid
    where n <= least(40, greatest(0, 800 - stored));
    get diagnostics inserted = row_count;
  end if;
  update public.assessment_attempts set
    last_seen_at = now(),
    current_position = coalesce(private.safe_int(p_position::text, 1, t.question_total), current_position)
  where id = t.id;
  if inserted > 0 or p_position is distinct from t.current_position then
    perform private.signal_monitor(t.assessment_id);
  end if;
  return jsonb_build_object('status', 'ok', 'server_now', now(), 'expires_at', t.expires_at);
end;
$$;

-- Entrega. Repetirla no cambia nada (no hay doble envío). p_reason = 'timer' solo se acepta
-- cuando el tiempo del servidor ya terminó.
create function public.submit_attempt(p_attempt uuid, p_reason text default 'student')
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  t public.assessment_attempts;
begin
  select * into t from public.assessment_attempts where id = p_attempt and student_id = me for update;
  if me is null or t.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  if t.status <> 'in_progress' then
    return jsonb_build_object('status', 'already-submitted');
  end if;
  if p_reason = 'timer' and now() < t.expires_at - interval '5 seconds' then
    return jsonb_build_object('status', 'not-expired', 'server_now', now(), 'expires_at', t.expires_at);
  end if;
  perform private.finish_attempt(
    t.id,
    case when p_reason = 'timer' or now() > t.expires_at + private.grace() then 'timer' else 'student' end
  );
  return jsonb_build_object('status', 'submitted');
end;
$$;

-- ---------------------------------------------------------------------------
-- Funciones del profesor (comprueban private.is_teacher())
-- ---------------------------------------------------------------------------

create function public.save_question(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if coalesce(p ->> 'status', 'draft') not in ('draft', 'published') then
    return jsonb_build_object('status', 'invalid', 'problems', jsonb_build_array('status'));
  end if;
  result := private.upsert_question(p - 'external_key', 'teacher');
  if result ->> 'status' in ('created', 'updated') then
    perform private.audit(
      case when result ->> 'status' = 'created' then 'question_created' else 'question_updated' end,
      null, (result ->> 'id')::uuid, jsonb_build_object('version', result -> 'version')
    );
  end if;
  return result;
exception
  when check_violation or not_null_violation or invalid_text_representation
    or numeric_value_out_of_range or string_data_right_truncation or foreign_key_violation then
    return jsonb_build_object('status', 'invalid', 'problems', jsonb_build_array('data'));
end;
$$;

create function public.set_question_status(p_question uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if p_status not in ('draft', 'published', 'retired') then
    return jsonb_build_object('status', 'invalid');
  end if;
  update public.question_bank set status = p_status, updated_at = now() where id = p_question;
  if not found then
    return jsonb_build_object('status', 'not-found');
  end if;
  perform private.audit('question_status', null, p_question, jsonb_build_object('status', p_status));
  return jsonb_build_object('status', 'updated');
end;
$$;

-- Banco oficial de DB LAB (contenido versionado en el repositorio). Idempotente: inserta
-- las nuevas, actualiza las que cambiaron (nueva versión) y no toca las demás.
create function public.sync_official_questions(p_questions jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  entry jsonb;
  result jsonb;
  counts jsonb := jsonb_build_object('created', 0, 'updated', 0, 'unchanged', 0, 'invalid', 0);
  key text;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) > 500 then
    return jsonb_build_object('status', 'invalid');
  end if;
  for entry in select value from jsonb_array_elements(p_questions) loop
    if coalesce(entry ->> 'external_key', '') = '' then
      key := 'invalid';
    else
      begin
        result := private.upsert_question(
          (entry - 'id') || jsonb_build_object(
            'status', coalesce((select status from public.question_bank where external_key = entry ->> 'external_key'), 'published')
          ),
          'dblab'
        );
        key := case when result ->> 'status' in ('created', 'updated', 'unchanged') then result ->> 'status' else 'invalid' end;
      exception
        when check_violation or not_null_violation or invalid_text_representation
          or numeric_value_out_of_range or string_data_right_truncation then
          key := 'invalid';
      end;
    end if;
    counts := jsonb_set(counts, array[key], to_jsonb((counts ->> key)::integer + 1));
  end loop;
  perform private.audit('bank_synced', null, null, counts);
  return jsonb_build_object('status', 'synced') || counts;
end;
$$;

-- Crea o actualiza un borrador con su selección de preguntas y de estudiantes.
create function public.save_assessment(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  existing public.assessments;
  v_mode text := coalesce(p ->> 'selection_mode', 'manual');
  v_section text := p ->> 'section_key';
  v_count integer := (p ->> 'question_count')::integer;
  v_topics text[] := coalesce(array(select jsonb_array_elements_text(coalesce(p -> 'topics', '[]'::jsonb))), '{}');
  v_questions uuid[];
  v_students uuid[];
  problems text[] := '{}';
  available integer;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if v_id is not null then
    select * into existing from public.assessments where id = v_id for update;
    if existing.id is null then
      return jsonb_build_object('status', 'not-found');
    end if;
    if existing.status <> 'draft' then
      return jsonb_build_object('status', 'not-draft');
    end if;
  end if;
  -- Selección sin duplicados y en el orden elegido.
  select coalesce(array_agg(q order by first_seen), '{}') into v_questions from (
    select x::uuid as q, min(n) as first_seen
    from jsonb_array_elements_text(coalesce(p -> 'question_ids', '[]'::jsonb)) with ordinality as t(x, n)
    group by x::uuid
  ) s;
  select coalesce(array_agg(distinct x::uuid), '{}') into v_students
  from jsonb_array_elements_text(coalesce(p -> 'student_ids', '[]'::jsonb)) x;
  if v_mode = 'manual' then
    if cardinality(v_questions) = 0 or cardinality(v_questions) > 300 then
      problems := array_append(problems, 'questions');
    elsif exists (
      select 1 from unnest(v_questions) q
      where not exists (
        select 1 from public.question_bank b
        where b.id = q and b.section_key = v_section and b.status = 'published'
      )
    ) then
      problems := array_append(problems, 'questions-unavailable');
    elsif v_count > cardinality(v_questions) then
      problems := array_append(problems, 'count-exceeds-selection');
    end if;
    available := cardinality(v_questions);
  else
    select count(*) into available from public.question_bank b
    where b.section_key = v_section and b.status = 'published'
      and (cardinality(v_topics) = 0 or b.topic = any (v_topics));
  end if;
  if coalesce(p ->> 'audience', 'all') = 'selected' and cardinality(v_students) = 0 then
    problems := array_append(problems, 'students');
  end if;
  if cardinality(problems) > 0 then
    return jsonb_build_object('status', 'invalid', 'problems', to_jsonb(problems));
  end if;
  if v_id is null then
    insert into public.assessments (title, section_key, question_count, duration_minutes, created_by)
    values (btrim(p ->> 'title'), v_section, v_count, (p ->> 'duration_minutes')::smallint, (select auth.uid()))
    returning id into v_id;
  end if;
  update public.assessments set
    title = btrim(p ->> 'title'),
    description = coalesce(btrim(p ->> 'description'), ''),
    section_key = v_section,
    topics = v_topics,
    selection_mode = v_mode,
    question_count = v_count,
    duration_minutes = (p ->> 'duration_minutes')::smallint,
    opens_at = nullif(p ->> 'opens_at', '')::timestamptz,
    closes_at = nullif(p ->> 'closes_at', '')::timestamptz,
    max_attempts = coalesce((p ->> 'max_attempts')::smallint, 1),
    shuffle_questions = coalesce((p ->> 'shuffle_questions')::boolean, true),
    shuffle_options = coalesce((p ->> 'shuffle_options')::boolean, true),
    feedback_mode = coalesce(p ->> 'feedback_mode', 'hidden'),
    audience = coalesce(p ->> 'audience', 'all'),
    institutional_only = coalesce((p ->> 'institutional_only')::boolean, false),
    record_clipboard = coalesce((p ->> 'record_clipboard')::boolean, true),
    pass_grade = coalesce((p ->> 'pass_grade')::numeric(2, 1), 3.0),
    updated_at = now()
  where id = v_id;
  delete from public.assessment_questions where assessment_id = v_id;
  if v_mode = 'manual' then
    insert into public.assessment_questions (assessment_id, question_id, position)
    select v_id, q, n from unnest(v_questions) with ordinality as t(q, n);
  end if;
  delete from public.assessment_assignments where assessment_id = v_id;
  if coalesce(p ->> 'audience', 'all') = 'selected' then
    insert into public.assessment_assignments (assessment_id, student_id)
    select v_id, s from unnest(v_students) s
    where exists (select 1 from public.profiles pr where pr.id = s and pr.role = 'student');
  end if;
  perform private.audit(
    case when existing.id is null then 'assessment_created' else 'assessment_saved' end,
    v_id, null, jsonb_build_object('title', btrim(p ->> 'title'))
  );
  return jsonb_build_object('status', 'saved', 'id', v_id, 'available', available);
exception
  when check_violation or not_null_violation or invalid_text_representation
    or numeric_value_out_of_range or string_data_right_truncation or foreign_key_violation
    or invalid_datetime_format or datetime_field_overflow then
    return jsonb_build_object('status', 'invalid', 'problems', jsonb_build_array('data'));
end;
$$;

create function public.duplicate_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  source public.assessments;
  new_id uuid;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  select * into source from public.assessments where id = p_assessment;
  if source.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  insert into public.assessments (
    title, description, section_key, topics, selection_mode, question_count, duration_minutes,
    max_attempts, shuffle_questions, shuffle_options, feedback_mode, audience,
    institutional_only, record_clipboard, pass_grade, created_by
  ) values (
    left('Copia de ' || source.title, 120), source.description, source.section_key, source.topics,
    source.selection_mode, source.question_count, source.duration_minutes, source.max_attempts,
    source.shuffle_questions, source.shuffle_options, 'hidden', source.audience,
    source.institutional_only, source.record_clipboard, source.pass_grade, (select auth.uid())
  ) returning id into new_id;
  if source.selection_mode = 'manual' then
    insert into public.assessment_questions (assessment_id, question_id, position)
    select new_id, q.question_id, row_number() over (order by q.position)
    from public.assessment_questions q
    join public.question_bank b on b.id = q.question_id and b.status = 'published'
    where q.assessment_id = source.id;
  end if;
  insert into public.assessment_assignments (assessment_id, student_id)
  select new_id, student_id from public.assessment_assignments where assessment_id = source.id;
  perform private.audit('assessment_duplicated', new_id, null, jsonb_build_object('source', source.id));
  return jsonb_build_object('status', 'saved', 'id', new_id);
end;
$$;

-- Publica: congela las preguntas (versión, copia y peso). No se publica sola nunca.
create function public.publish_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a public.assessments;
  total integer;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  select * into a from public.assessments where id = p_assessment for update;
  if a.id is null then
    return jsonb_build_object('status', 'not-found');
  end if;
  if a.status <> 'draft' then
    return jsonb_build_object('status', 'not-draft');
  end if;
  if a.closes_at is not null and a.closes_at <= now() + interval '5 minutes' then
    return jsonb_build_object('status', 'invalid', 'problems', jsonb_build_array('closes-in-past'));
  end if;
  if a.selection_mode = 'random' then
    insert into public.assessment_questions (assessment_id, question_id, position)
    select a.id, b.id, row_number() over (order by b.topic, b.difficulty, b.external_key, b.created_at)
    from public.question_bank b
    where b.section_key = a.section_key and b.status = 'published'
      and (cardinality(a.topics) = 0 or b.topic = any (a.topics));
  elsif exists (
    select 1 from public.assessment_questions q
    join public.question_bank b on b.id = q.question_id
    where q.assessment_id = a.id and b.status <> 'published'
  ) then
    return jsonb_build_object('status', 'invalid', 'problems', jsonb_build_array('questions-unavailable'));
  end if;
  select count(*) into total from public.assessment_questions where assessment_id = a.id;
  if total < a.question_count then
    if a.selection_mode = 'random' then
      delete from public.assessment_questions where assessment_id = a.id;
    end if;
    return jsonb_build_object(
      'status', 'invalid', 'problems', jsonb_build_array('pool-too-small'), 'available', total
    );
  end if;
  update public.assessment_questions q set
    snapshot = private.question_snapshot(q.question_id),
    version = b.version,
    weight = coalesce(q.weight, b.weight)
  from public.question_bank b
  where q.assessment_id = a.id and b.id = q.question_id;
  update public.assessments set status = 'published', published_at = now(), updated_at = now()
  where id = a.id;
  perform private.audit('assessment_published', a.id, null, jsonb_build_object('questions', total));
  return jsonb_build_object('status', 'published');
end;
$$;

-- Cerrar nuevos accesos: nadie más comienza; los intentos abiertos siguen hasta su tiempo.
create function public.close_assessment_entries(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  update public.assessments set entry_closed_at = now(), updated_at = now()
  where id = p_assessment and status = 'published' and entry_closed_at is null;
  if not found then
    return jsonb_build_object('status', 'not-open');
  end if;
  perform private.audit('entries_closed', p_assessment, null, '{}'::jsonb);
  perform private.signal_monitor(p_assessment);
  return jsonb_build_object('status', 'updated');
end;
$$;

-- Finalizar: cierra la evaluación y entrega (y califica) los intentos abiertos.
create function public.finalize_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item record;
  finished integer := 0;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  update public.assessments set
    status = 'closed', closed_at = now(), entry_closed_at = coalesce(entry_closed_at, now()), updated_at = now()
  where id = p_assessment and status = 'published';
  if not found then
    return jsonb_build_object('status', 'not-open');
  end if;
  perform private.finalize_expired(p_assessment);
  for item in
    select id from public.assessment_attempts where assessment_id = p_assessment and status = 'in_progress'
  loop
    perform private.finish_attempt(item.id, 'teacher');
    finished := finished + 1;
  end loop;
  perform private.audit('assessment_finalized', p_assessment, null, jsonb_build_object('closed_attempts', finished));
  perform private.signal_monitor(p_assessment);
  return jsonb_build_object('status', 'updated', 'closed_attempts', finished);
end;
$$;

-- Liberar o retener la retroalimentación (nota, respuestas, explicación completa).
create function public.set_feedback_mode(p_assessment uuid, p_mode text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if p_mode not in ('hidden', 'score_only', 'answers', 'full_feedback') then
    return jsonb_build_object('status', 'invalid');
  end if;
  update public.assessments set feedback_mode = p_mode, updated_at = now()
  where id = p_assessment and status <> 'draft';
  if not found then
    return jsonb_build_object('status', 'not-found');
  end if;
  perform private.audit('feedback_changed', p_assessment, null, jsonb_build_object('mode', p_mode));
  return jsonb_build_object('status', 'updated');
end;
$$;

create function public.archive_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  update public.assessments set status = 'archived', archived_at = now(), updated_at = now()
  where id = p_assessment and status = 'closed';
  if not found then
    return jsonb_build_object('status', 'not-closed');
  end if;
  perform private.audit('assessment_archived', p_assessment, null, '{}'::jsonb);
  return jsonb_build_object('status', 'updated');
end;
$$;

create function public.delete_draft_assessment(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  removed text;
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  delete from public.assessments where id = p_assessment and status = 'draft' returning title into removed;
  if removed is null then
    return jsonb_build_object('status', 'not-draft');
  end if;
  perform private.audit('assessment_deleted', null, null, jsonb_build_object('id', p_assessment, 'title', removed));
  return jsonb_build_object('status', 'deleted');
end;
$$;

-- Monitor: entrega los intentos vencidos y devuelve el estado de cada intento con el último
-- evento y el recuento por tipo. Sin interpretación: son hechos del navegador.
create function public.assessment_monitor(p_assessment uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_teacher() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  perform private.finalize_expired(p_assessment);
  return jsonb_build_object('status', 'ok', 'server_now', now(), 'attempts', coalesce((
    select jsonb_agg(jsonb_build_object(
      'attempt_id', t.id, 'student_id', t.student_id, 'attempt_number', t.attempt_number,
      'status', t.status, 'submitted_by', t.submitted_by, 'started_at', t.started_at,
      'expires_at', t.expires_at, 'submitted_at', t.submitted_at, 'last_seen_at', t.last_seen_at,
      'current_position', t.current_position, 'question_total', t.question_total,
      'answered', (select count(*) from public.assessment_answers x where x.attempt_id = t.id and x.response is not null),
      'flagged', (select count(*) from public.assessment_answers x where x.attempt_id = t.id and x.flagged),
      'last_event', (
        select jsonb_build_object('type', e.event_type, 'at', e.occurred_at)
        from public.assessment_events e where e.attempt_id = t.id
        order by e.occurred_at desc, e.id desc limit 1
      ),
      'counts', coalesce((
        select jsonb_object_agg(c.event_type, c.n)
        from (select e.event_type, count(*) as n from public.assessment_events e
              where e.attempt_id = t.id group by e.event_type) c
      ), '{}'::jsonb)
    ) order by t.started_at)
    from public.assessment_attempts t where t.assessment_id = p_assessment
  ), '[]'::jsonb));
end;
$$;

-- Retención de eventos de supervisión (docs/ASSESSMENT_SECURITY.md). Solo service_role.
create function public.admin_purge_assessment_events(p_older_than_days integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  removed integer;
begin
  if p_older_than_days is null or p_older_than_days < 30 then
    return jsonb_build_object('status', 'invalid');
  end if;
  delete from public.assessment_events e
  using public.assessments a
  where e.assessment_id = a.id and a.status in ('closed', 'archived')
    and e.occurred_at < now() - make_interval(days => p_older_than_days);
  get diagnostics removed = row_count;
  return jsonb_build_object('status', 'purged', 'removed', removed);
end;
$$;

-- ---------------------------------------------------------------------------
-- Integridad: una evaluación publicada no cambia sus preguntas en silencio
-- ---------------------------------------------------------------------------

create function private.guard_assessment_questions() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.assessments
    where id = old.assessment_id and status <> 'draft'
  ) then
    raise exception 'Las preguntas de una evaluación publicada no se pueden cambiar.'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger assessment_questions_guard
  before update or delete on public.assessment_questions
  for each row execute function private.guard_assessment_questions();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------

alter table public.question_bank enable row level security;
alter table public.question_options enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.assessment_events enable row level security;
alter table public.assessment_audit enable row level security;
alter table private.monitor_signals enable row level security;

revoke all on table
  public.question_bank, public.question_options, public.assessments,
  public.assessment_questions, public.assessment_assignments, public.assessment_attempts,
  public.assessment_answers, public.assessment_events, public.assessment_audit
  from anon, authenticated;
revoke all on table private.monitor_signals from public, anon, authenticated;

-- Solo lectura, y solo el profesor (políticas). Todas las escrituras pasan por funciones.
grant select on table
  public.question_bank, public.question_options, public.assessments,
  public.assessment_questions, public.assessment_assignments, public.assessment_attempts,
  public.assessment_answers, public.assessment_events, public.assessment_audit
  to authenticated;
grant select, insert, update, delete on table
  public.question_bank, public.question_options, public.assessments,
  public.assessment_questions, public.assessment_assignments, public.assessment_attempts,
  public.assessment_answers, public.assessment_events, public.assessment_audit
  to service_role;

create policy question_bank_teacher on public.question_bank
  for select to authenticated using ((select private.is_teacher()));
create policy question_options_teacher on public.question_options
  for select to authenticated using ((select private.is_teacher()));
create policy assessments_teacher on public.assessments
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_questions_teacher on public.assessment_questions
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_assignments_teacher on public.assessment_assignments
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_attempts_teacher on public.assessment_attempts
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_answers_teacher on public.assessment_answers
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_events_teacher on public.assessment_events
  for select to authenticated using ((select private.is_teacher()));
create policy assessment_audit_teacher on public.assessment_audit
  for select to authenticated using ((select private.is_teacher()));

do $$
declare
  fn text;
begin
  -- Auxiliares: solo las usan las funciones de arriba (con los privilegios de su dueño).
  foreach fn in array array[
    'private.assessment_phase(public.assessments, timestamptz)',
    'private.is_eligible(public.assessments, uuid)',
    'private.audit(text, uuid, uuid, jsonb)',
    'private.signal_monitor(uuid)',
    'private.safe_int(text, integer, integer)',
    'private.question_problems(text, jsonb)',
    'private.upsert_question(jsonb, text)',
    'private.question_snapshot(uuid)',
    'private.public_item(jsonb, uuid[])',
    'private.reviewed_item(jsonb, uuid[], boolean)',
    'private.normalize_response(text, uuid[], jsonb)',
    'private.item_credit(jsonb, jsonb)',
    'private.grade_attempt(uuid)',
    'private.finish_attempt(uuid, text)',
    'private.grace()',
    'private.finalize_if_expired(uuid)',
    'private.finalize_expired(uuid)',
    'private.option_order(jsonb, boolean)',
    'private.pick_questions(uuid, integer)',
    'private.student_summary(public.assessments, uuid)',
    'private.guard_assessment_questions()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
  -- API: solo personas con sesión; cada función comprueba quién llama.
  foreach fn in array array[
    'public.student_assessments()',
    'public.student_assessment(uuid)',
    'public.start_attempt(uuid)',
    'public.attempt_view(uuid)',
    'public.save_answers(uuid, integer, jsonb)',
    'public.log_attempt_events(uuid, integer, jsonb)',
    'public.submit_attempt(uuid, text)',
    'public.save_question(jsonb)',
    'public.set_question_status(uuid, text)',
    'public.sync_official_questions(jsonb)',
    'public.save_assessment(jsonb)',
    'public.duplicate_assessment(uuid)',
    'public.publish_assessment(uuid)',
    'public.close_assessment_entries(uuid)',
    'public.finalize_assessment(uuid)',
    'public.set_feedback_mode(uuid, text)',
    'public.archive_assessment(uuid)',
    'public.delete_draft_assessment(uuid)',
    'public.assessment_monitor(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end;
$$;

revoke all on function public.admin_purge_assessment_events(integer) from public, anon, authenticated;
grant execute on function public.admin_purge_assessment_events(integer) to service_role;
