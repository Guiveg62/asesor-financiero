-- Migración 0003 — guarda el correo del cliente (para enviarle el plan y para el asesor).
-- Ejecutar en Supabase → SQL Editor → Run.
alter table interviews add column if not exists client_email text;
