-- Migration: ensure Rafael's profile meets account age requirement for birthday coupon
BEGIN;

DO $$
DECLARE
  target_email TEXT := 'rafaelalbertobenguria@gmail.com';
  uid UUID;
  new_created_at TIMESTAMPTZ := DATE '2024-01-01';
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone)
    SELECT uid, 'Usuario', ''
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = uid);

    UPDATE public.profiles
       SET created_at = new_created_at,
           updated_at = NOW()
     WHERE id = uid;
  ELSE
    RAISE NOTICE 'User with email % not found in auth.users; no changes applied.', target_email;
  END IF;
END$$;

COMMIT;
