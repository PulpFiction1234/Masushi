-- Migration: Grant admin role to specific user
-- Adds columns to public.profiles if missing, then marks the user with the provided email as admin.

BEGIN;

-- 1) add columns if they do not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;

-- 2) Try to set is_admin based on email present in auth.users
-- This will work in Supabase where auth.users stores email.

-- Find the user id for the given email
DO $$
DECLARE
  target_email TEXT := 'rafaelalbertobenguria@gmail.com';
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;
  IF uid IS NOT NULL THEN
  -- Ensure a profile row exists for the user.
  -- Some Supabase installations do not expose the same metadata column names
  -- (raw_user_meta_data / raw_user_metadata / user_metadata). To avoid
  -- failing the migration when those columns are missing, insert a
  -- conservative default profile (name = 'Usuario', phone = ''). If you
  -- want to populate full_name/phone from auth metadata, run an ad-hoc
  -- query later that inspects your specific DB schema.
  INSERT INTO public.profiles (id, full_name, phone)
  SELECT uid, 'Usuario', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = uid);

    -- Mark them as admin
    UPDATE public.profiles SET is_admin = TRUE, role = 'admin', updated_at = NOW() WHERE id = uid;
  ELSE
    RAISE NOTICE 'User with email % not found in auth.users; no changes applied.', target_email;
  END IF;
END$$;

COMMIT;

-- NOTE: If you are using Supabase SQL editor you can run this migration there.
-- If you prefer psql, ensure you run it with the SUPABASE_SERVICE_ROLE_KEY or as a DB superuser.
