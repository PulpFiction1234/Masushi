-- scripts/delete-user-myvetagenda.sql
-- SQL script to delete user with email 'myvetagenda@gmail.com' from Supabase.
-- Run this in Supabase SQL Editor as a project admin (service role) after verifying backups.

-- 1) Inspect the user (backup this row somewhere safe)
SELECT id, email, raw_user_meta_data, created_at
FROM auth.users
WHERE email = 'myvetagenda@gmail.com';

-- Replace '<USER_ID>' in the following block with the id returned above.
-- 2) Optional: inspect related application rows
-- Example: profiles, orders, favorites (adjust table/column names to your schema)
-- Instead of replacing a placeholder, use a CTE that selects the user id by email
-- This avoids invalid UUID syntax if you forget to replace placeholders.
-- 2) Optional: inspect related application rows using a CTE
WITH target AS (
	SELECT id
	FROM auth.users
	WHERE email = 'myvetagenda@gmail.com'
	LIMIT 1
)
SELECT to_regclass('public.profiles') AS profiles_table, to_regclass('public.orders') AS orders_table, to_regclass('public.favorites') AS favorites_table;

-- If the above shows a non-null value for the table names, you can run the corresponding SELECTs;
-- if a table is NULL it does not exist in this database/schema and the SELECT would error.
-- Example (run only if profiles_table IS NOT NULL):
-- SELECT * FROM profiles WHERE id IN (SELECT id FROM target);
-- Example (run only if orders_table IS NOT NULL):
-- SELECT * FROM orders WHERE profile_id IN (SELECT id FROM target);

-- 3) If you're ready to remove the user and related app rows, run the deletes inside a transaction.
-- The following block will do the deletes for the user found by email. It is safer because
-- you don't need to manually substitute the UUID. Run the SELECTs above first to confirm.
-- Safe conditional delete using PL/pgSQL. This will only attempt to delete from tables that exist.
DO $$
DECLARE
	target_id uuid;
BEGIN
	SELECT id INTO target_id FROM auth.users WHERE email = 'myvetagenda@gmail.com' LIMIT 1;
	IF target_id IS NULL THEN
		RAISE NOTICE 'No user found with email myvetagenda@gmail.com';
		RETURN;
	END IF;

	IF to_regclass('public.orders') IS NOT NULL THEN
		BEGIN
			EXECUTE 'DELETE FROM orders WHERE profile_id = $1' USING target_id;
			RAISE NOTICE 'Deleted orders for %', target_id;
		EXCEPTION WHEN OTHERS THEN
			RAISE NOTICE 'Failed deleting orders for %: %', target_id, SQLERRM;
		END;
	ELSE
		RAISE NOTICE 'Table orders does not exist; skipping';
	END IF;

	IF to_regclass('public.favorites') IS NOT NULL THEN
		BEGIN
			EXECUTE 'DELETE FROM favorites WHERE profile_id = $1' USING target_id;
			RAISE NOTICE 'Deleted favorites for %', target_id;
		EXCEPTION WHEN OTHERS THEN
			RAISE NOTICE 'Failed deleting favorites for %: %', target_id, SQLERRM;
		END;
	ELSE
		RAISE NOTICE 'Table favorites does not exist; skipping';
	END IF;

	IF to_regclass('public.profiles') IS NOT NULL THEN
		BEGIN
			EXECUTE 'DELETE FROM profiles WHERE id = $1' USING target_id;
			RAISE NOTICE 'Deleted profile %', target_id;
		EXCEPTION WHEN OTHERS THEN
			RAISE NOTICE 'Failed deleting profile %: %', target_id, SQLERRM;
		END;
	ELSE
		RAISE NOTICE 'Table profiles does not exist; skipping';
	END IF;

	-- Finally remove the auth user
	BEGIN
		EXECUTE 'DELETE FROM auth.users WHERE id = $1' USING target_id;
		RAISE NOTICE 'Deleted auth.users %', target_id;
	EXCEPTION WHEN OTHERS THEN
		RAISE NOTICE 'Failed deleting auth.users %: %', target_id, SQLERRM;
	END;
END $$;

-- Notes:
-- * This is irreversible. Export the SELECT results above before deleting.
-- * If your app uses other tables referencing the profile id, delete or nullify them too.
-- * If the DELETE on auth.users fails due to policies, run the final DELETE from the SQL editor as a project owner.
