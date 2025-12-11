-- Tabla para registrar mensajes entrantes/salientes de WhatsApp (Cloud API)
-- Ejecutar en Supabase/PG. Idempotente.

create extension if not exists pgcrypto;

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  wa_id text unique,
  from_number text,
  to_number text,
  profile_name text,
  type text,
  text_body text,
  direction text not null default 'in' check (direction in ('in','out')),
  payload jsonb,
  timestamp_ms bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_messages_from_ts on public.whatsapp_messages(from_number, timestamp_ms desc);
create index if not exists idx_whatsapp_messages_created on public.whatsapp_messages(created_at desc);
