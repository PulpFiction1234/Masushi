-- Run only after applying the rate-limit migration to an isolated staging database.
-- All test rows are rolled back; no customer tables are referenced.
BEGIN;

DO $test$
DECLARE
  v_prefix TEXT := pg_catalog.md5(
    pg_catalog.clock_timestamp()::TEXT || pg_catalog.random()::TEXT
  ) || pg_catalog.md5(
    pg_catalog.clock_timestamp()::TEXT || pg_catalog.random()::TEXT
  );
  v_older_expired TEXT := pg_catalog.substr(v_prefix, 1, 64);
  v_newer_expired TEXT := pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'newer'),
    1,
    32
  ) || pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'newer2'),
    1,
    32
  );
  v_active TEXT := pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'active'),
    1,
    32
  ) || pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'active2'),
    1,
    32
  );
  v_deleted INTEGER;
BEGIN
  INSERT INTO private.password_reset_rate_limits (
    bucket_type, identifier_hmac, window_started_at, request_count, expires_at
  )
  VALUES
    ('email', v_older_expired, now() - INTERVAL '3 hours', 1, now() - INTERVAL '2 hours'),
    ('ip', v_newer_expired, now() - INTERVAL '2 hours', 1, now() - INTERVAL '1 hour'),
    ('email', v_active, now(), 1, now() + INTERVAL '1 hour');

  v_deleted := private.cleanup_password_reset_rate_limits(1);
  IF v_deleted <> 1 THEN
    RAISE EXCEPTION 'Expected one expired row to be deleted, got %', v_deleted;
  END IF;
  IF EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE bucket_type = 'email' AND identifier_hmac = v_older_expired
  ) THEN
    RAISE EXCEPTION 'The oldest expired row was not deleted first';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE bucket_type = 'ip' AND identifier_hmac = v_newer_expired
      AND expires_at <= now()
  ) THEN
    RAISE EXCEPTION 'The cleanup exceeded its one-row batch size';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE bucket_type = 'email' AND identifier_hmac = v_active
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'An active rate-limit row was removed';
  END IF;

  v_deleted := private.cleanup_password_reset_rate_limits(1);
  IF v_deleted <> 1 OR EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE identifier_hmac = v_newer_expired
  ) THEN
    RAISE EXCEPTION 'The second cleanup batch did not remove the remaining expired row';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE bucket_type = 'email' AND identifier_hmac = v_active
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'An active rate-limit row was removed by the second batch';
  END IF;
END;
$test$;

ROLLBACK;
