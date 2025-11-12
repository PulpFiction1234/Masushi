-- scripts/delete-test-users.sql
-- Delete multiple Supabase users (auth + app data) by email.
-- Run from Supabase SQL editor with a service role. Review backups first.

-- 1) Inspect affected users
WITH target_emails AS (
  SELECT UNNEST(ARRAY[
    'asd@gmail.com',
    'testmasushiapp2@gmail.com',
    'testmasushiapp@gmail.com',
    'asdf@gmail.com',
    'myvetagenda@gmail.com',
    'test@gmail.com',
    'test2@gmail.com',
    'test3@gmail.com'
  ]) AS email
)
SELECT u.id, u.email, u.created_at
FROM auth.users u
JOIN target_emails t ON LOWER(u.email) = LOWER(t.email);

-- 2) Delete related data (orders, favorites, profiles, auth.users)
DO $$
DECLARE
  target RECORD;
BEGIN
  FOR target IN (
    SELECT u.id, u.email
    FROM auth.users u
    JOIN (
      SELECT UNNEST(ARRAY[
        'asd@gmail.com',
        'testmasushiapp2@gmail.com',
        'testmasushiapp@gmail.com',
        'asdf@gmail.com',
        'myvetagenda@gmail.com',
        'test@gmail.com',
        'test2@gmail.com',
        'test3@gmail.com'
      ]) AS email
    ) t ON LOWER(u.email) = LOWER(t.email)
  ) LOOP
    RAISE NOTICE 'Deleting user % (%).', target.id, target.email;

    IF to_regclass('public.orders') IS NOT NULL THEN
      BEGIN
        EXECUTE 'DELETE FROM orders WHERE user_id = $1' USING target.id;
        RAISE NOTICE '  -> Deleted orders';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  -> Failed deleting orders: %', SQLERRM;
      END;
    END IF;

    IF to_regclass('public.favorites') IS NOT NULL THEN
      BEGIN
        EXECUTE 'DELETE FROM favorites WHERE user_id = $1' USING target.id;
        RAISE NOTICE '  -> Deleted favorites';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  -> Failed deleting favorites: %', SQLERRM;
      END;
    END IF;

    IF to_regclass('public.addresses') IS NOT NULL THEN
      BEGIN
        EXECUTE 'DELETE FROM addresses WHERE user_id = $1' USING target.id;
        RAISE NOTICE '  -> Deleted addresses';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  -> Failed deleting addresses: %', SQLERRM;
      END;
    END IF;

    IF to_regclass('public.profiles') IS NOT NULL THEN
      BEGIN
        EXECUTE 'DELETE FROM profiles WHERE id = $1' USING target.id;
        RAISE NOTICE '  -> Deleted profile';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  -> Failed deleting profile: %', SQLERRM;
      END;
    END IF;

    BEGIN
      EXECUTE 'DELETE FROM auth.users WHERE id = $1' USING target.id;
      RAISE NOTICE '  -> Deleted auth user';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  -> Failed deleting auth user: %', SQLERRM;
    END;
  END LOOP;
END $$;

-- Notes:
-- * Remove emails you do not want to delete before running step 2.
-- * If your schema has more tables referencing profiles.id / user_id, add similar DELETE blocks above.
-- * The DO block will skip gracefully if tables are missing.
