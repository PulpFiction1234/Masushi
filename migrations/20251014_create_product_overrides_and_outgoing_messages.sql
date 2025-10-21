-- Migration: create product_overrides and outgoing_messages + helper function
-- Run this file in Supabase SQL editor (or via your migration tooling)

-- enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- product_overrides: lightweight per-product flags
create table if not exists public.product_overrides (
  codigo text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_overrides_enabled on public.product_overrides(enabled);

-- outgoing_messages: simple queue for external messages (WhatsApp, SMS, etc.)
create table if not exists public.outgoing_messages (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  channel text not null default 'whatsapp',
  payload jsonb not null,
  status text not null default 'pending', -- pending | processing | sent | failed | dead
  attempts int not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_outgoing_messages_status_created on public.outgoing_messages(status, created_at);

-- Function: atomically claim a batch of pending messages (mark as processing and return them)
create or replace function public.claim_pending_messages(batch_size int)
returns setof public.outgoing_messages
language sql
stable
as $$
with q as (
  select id
  from public.outgoing_messages
  where status = 'pending'
  order by created_at
  limit batch_size
  for update skip locked
)
update public.outgoing_messages
set status = 'processing', locked_at = now(), updated_at = now()
where id in (select id from q)
returning public.outgoing_messages.*;
$$;

-- Function to mark message result (helper)
create or replace function public.mark_message_sent(msg_id uuid)
returns void language plpgsql as $$
begin
  update public.outgoing_messages set status = 'sent', attempts = attempts + 1, updated_at = now() where id = msg_id;
end;
$$;

create or replace function public.mark_message_failed(msg_id uuid, err text)
returns void language plpgsql as $$
begin
  update public.outgoing_messages set status = 'failed', attempts = attempts + 1, last_error = err, updated_at = now() where id = msg_id;
end;
$$;

-- Retention: keep only recent 30 days by default (you can run this as a scheduled job)
-- Example cleanup query (not automatic):
-- delete from public.outgoing_messages where created_at < now() - interval '30 days';
