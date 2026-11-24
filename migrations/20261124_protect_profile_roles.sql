-- Restrict browser roles without changing existing profile rows or RLS policies.
-- Review and test in isolation before requesting production authorization.
BEGIN;

DO $migration$
DECLARE
  v_role TEXT;
  v_columns TEXT;
  v_had_insert BOOLEAN;
  v_had_update BOOLEAN;
BEGIN
  IF pg_catalog.to_regclass('public.profiles') IS NULL OR
     (SELECT count(*) FROM pg_catalog.pg_attribute
      WHERE attrelid = 'public.profiles'::regclass
        AND attname IN ('role', 'is_admin') AND attnum > 0 AND NOT attisdropped) <> 2 THEN
    RAISE EXCEPTION 'Expected profile role columns are missing';
  END IF;

  SELECT pg_catalog.string_agg(pg_catalog.format('%I', attname), ', ' ORDER BY attnum)
    INTO v_columns
    FROM pg_catalog.pg_attribute
    WHERE attrelid = 'public.profiles'::regclass
      AND attnum > 0 AND NOT attisdropped AND attname NOT IN ('role', 'is_admin');
  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Expected non-role profile columns are missing';
  END IF;

  FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    v_had_insert := pg_catalog.has_table_privilege(v_role, 'public.profiles', 'INSERT');
    v_had_update := pg_catalog.has_table_privilege(v_role, 'public.profiles', 'UPDATE');

    EXECUTE pg_catalog.format('REVOKE INSERT, UPDATE ON public.profiles FROM %I', v_role);
    EXECUTE pg_catalog.format(
      'REVOKE INSERT (role, is_admin), UPDATE (role, is_admin) ON public.profiles FROM %I',
      v_role
    );
    IF v_had_insert THEN
      EXECUTE pg_catalog.format('GRANT INSERT (%s) ON public.profiles TO %I', v_columns, v_role);
    END IF;
    IF v_had_update THEN
      EXECUTE pg_catalog.format('GRANT UPDATE (%s) ON public.profiles TO %I', v_columns, v_role);
    END IF;

    IF pg_catalog.has_column_privilege(v_role, 'public.profiles', 'role', 'INSERT') OR
       pg_catalog.has_column_privilege(v_role, 'public.profiles', 'role', 'UPDATE') OR
       pg_catalog.has_column_privilege(v_role, 'public.profiles', 'is_admin', 'INSERT') OR
       pg_catalog.has_column_privilege(v_role, 'public.profiles', 'is_admin', 'UPDATE') THEN
      RAISE EXCEPTION 'Inherited or PUBLIC privileges still allow % to change profile roles', v_role;
    END IF;
  END LOOP;
END;
$migration$;

COMMIT;
