-- Migración 0002 — añade la variable "patrimonio_inmobiliario" (vivienda/fastigheter)
-- Ejecutar en Supabase → SQL Editor → Run.
alter type variable_key add value if not exists 'patrimonio_inmobiliario';
