-- Migración 0004 — Capa S5: alertas por cliente + preferencia de aviso del cliente.
-- Ejecutar en Supabase → SQL Editor → Run.

-- El cliente decide si quiere recibir avisos por email cuando su situación cambie.
alter table interviews add column if not exists alertas_opt_in boolean not null default false;

-- Registro de alertas/eventos (lo que "SE REGISTRA" en el diagrama).
create table if not exists alerts (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  tipo         text not null,                    -- p. ej. "umbral"
  severidad    text not null default 'aviso',    -- info | aviso | urgente
  mensaje      text not null,
  leida        boolean not null default false,
  -- a quién se ha repartido ya (para no duplicar envíos)
  enviada_asesor  boolean not null default false,
  enviada_cliente boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists alerts_interview_idx on alerts(interview_id);
create index if not exists alerts_created_idx on alerts(created_at desc);

alter table alerts enable row level security;
