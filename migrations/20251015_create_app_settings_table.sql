-- Migration: create app_settings table
-- Run this in Supabase SQL editor to enable server-side persistence for admin settings

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Optional: seed a key for horarios using the defaults in the repo. You can edit the JSON
-- before running, or run a subsequent upsert via the admin UI.
