-- =============================================================================
-- Asesor Financiero · Módulo 1 (entrevista → ficha)
-- Migración 0001 — esquema inicial
--
-- Cómo aplicarla:
--   Supabase Dashboard → SQL Editor → pega todo este archivo → Run.
--   (o `supabase db push` si usas la CLI con el proyecto enlazado)
--
-- Modela las 13 variables del guion de `plantilla-entrevista.md`, cada respuesta
-- con su etiqueta (confirmado / estimado / pendiente), guardable de forma
-- incremental durante la entrevista.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Etiqueta de calidad del dato (plantilla-entrevista.md, "Reglas generales")
create type label_etiqueta as enum ('confirmado', 'estimado', 'pendiente');

-- Perfil de riesgo — nomenclatura vigente de reglas-recomendacion.md §3.1
-- (sustituye al antiguo "agresivo" de la plantilla).
create type perfil_riesgo as enum ('conservador', 'moderado', 'dinamico');

-- Estado de la entrevista a lo largo de su ciclo de vida.
create type interview_status as enum (
  'en_curso',           -- entrevista abierta, respondiendo preguntas
  'resumen_pendiente',  -- terminada, esperando que el cliente confirme el resumen
  'confirmada',         -- resumen confirmado por el cliente → ficha lista
  'cerrada'             -- archivada / procesada por el motor (Módulo 2)
);

-- Las 13 variables de la ficha, en el orden del guion.
create type variable_key as enum (
  'edad',                       -- P1
  'empleo_contrato',            -- P2
  'tjanstepension',             -- P3
  'akassa_inkomstforsakring',   -- P4
  'ingresos_netos',             -- P5
  'capacidad_ahorro',           -- P6
  'capital_actual',             -- P7
  'pension_proyectada',         -- P8
  'deudas',                     -- P9
  'buffert',                    -- P10
  'perfil_riesgo',              -- P11
  'pareja',                     -- P12
  'meta'                        -- P13
);

-- ---------------------------------------------------------------------------
-- Tabla: interviews — una fila por entrevista (una persona)
-- ---------------------------------------------------------------------------
create table interviews (
  id                   uuid primary key default gen_random_uuid(),
  client_name          text,
  idioma               text not null default 'es' check (idioma in ('es', 'sv')),
  status               interview_status not null default 'en_curso',
  advisor              text,
  current_question     smallint not null default 1 check (current_question between 1 and 14),
  -- Vínculo de pareja: el motor (Módulo 2) combina dos fichas si la meta es común.
  partner_interview_id uuid references interviews(id) on delete set null,
  -- Token de sesión para el acceso anónimo desde la landing (Fase 03).
  session_token        uuid not null default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on column interviews.current_question is
  'Puntero al guion: 1-13 preguntas, 14 = cierre/resumen. El chat no avanza hasta cerrar la variable actual.';
comment on column interviews.session_token is
  'Identifica al visitante anónimo que inició su diagnóstico. Nunca se expone al navegador en el flujo server-side.';

-- ---------------------------------------------------------------------------
-- Tabla: answers — una fila por variable respondida, con su etiqueta
-- ---------------------------------------------------------------------------
create table answers (
  id            uuid primary key default gen_random_uuid(),
  interview_id  uuid not null references interviews(id) on delete cascade,
  variable      variable_key not null,
  question_no   smallint,
  raw_answer    text,                              -- lo que dijo el cliente, textual
  value_text    text,                              -- dato normalizado para la ficha
  value_numeric numeric,                           -- variables numéricas (edad, kr, meses, año…)
  label         label_etiqueta not null,
  -- Desgloses estructurados: p. ej.
  --   deudas → {"bolan": {...}, "csn": {...}, "consumo": {...}}
  --   capital_actual → {"isk": 200000, "sparkonto": 50000}
  --   meta → {"anio": 2029}
  details       jsonb not null default '{}'::jsonb,
  answered_at   timestamptz not null default now(),
  -- Una respuesta por variable y entrevista: re-responder hace UPSERT.
  unique (interview_id, variable)
);

comment on column answers.value_numeric is
  'Valor numérico principal cuando aplica: edad (años), ingresos/ahorro/capital/meta (kr), buffert (meses). El año de la meta va en details.anio.';

-- ---------------------------------------------------------------------------
-- Tabla: client_tasks — tareas para el cliente antes de la reunión
-- ---------------------------------------------------------------------------
create table client_tasks (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  descripcion  text not null,
  done         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabla: interview_notes — notas de la entrevista para el asesor
-- (ambigüedades, contradicciones detectadas, contexto útil)
-- ---------------------------------------------------------------------------
create table interview_notes (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  nota         text not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trigger: mantener interviews.updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger interviews_set_updated_at
  before update on interviews
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index answers_interview_idx        on answers(interview_id);
create index client_tasks_interview_idx   on client_tasks(interview_id);
create index interview_notes_interview_idx on interview_notes(interview_id);
create index interviews_session_token_idx on interviews(session_token);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Seguro por defecto: RLS activado y SIN políticas permisivas. Con esto solo
-- la clave `service_role` (que salta RLS) puede leer/escribir — es decir, el
-- backend server-side de Next.js. El navegador nunca accede directo a estas
-- tablas. Si en la Fase 03 se decide un acceso anónimo directo desde la
-- landing, se añadirán políticas acotadas por session_token.
-- ---------------------------------------------------------------------------
alter table interviews      enable row level security;
alter table answers         enable row level security;
alter table client_tasks    enable row level security;
alter table interview_notes enable row level security;
