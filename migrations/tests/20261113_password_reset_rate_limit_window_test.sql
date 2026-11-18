-- Run only after applying the migration to an isolated staging database.
-- Uses synthetic HMACs and rolls all test data back.
BEGIN;

DO $test$
DECLARE
  v_prefix TEXT := pg_catalog.md5(
    pg_catalog.clock_timestamp()::TEXT || pg_catalog.random()::TEXT
  ) || pg_catalog.md5(
    pg_catalog.clock_timestamp()::TEXT || pg_catalog.random()::TEXT
  );
  v_email_hash TEXT := pg_catalog.substr(v_prefix, 1, 64);
  v_ip_hash_1 TEXT := pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'ip1'),
    1,
    32
  ) || pg_catalog.substr(pg_catalog.md5(v_prefix || 'ip1b'), 1, 32);
  v_ip_hash_2 TEXT := pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'ip2'),
    1,
    32
  ) || pg_catalog.substr(pg_catalog.md5(v_prefix || 'ip2b'), 1, 32);
  v_ip_hash_3 TEXT := pg_catalog.substr(
    pg_catalog.md5(v_prefix || 'ip3'),
    1,
    32
  ) || pg_catalog.substr(pg_catalog.md5(v_prefix || 'ip3b'), 1, 32);
  v_result JSONB;
  v_email_count INTEGER;
BEGIN
  v_result := public.consume_password_reset_rate_limit(
    v_email_hash, v_ip_hash_1, 1, 10, 60
  );
  IF v_result->>'allowed' <> 'true' THEN
    RAISE EXCEPTION 'First synthetic request should be allowed: %', v_result;
  END IF;

  v_result := public.consume_password_reset_rate_limit(
    v_email_hash, v_ip_hash_2, 1, 10, 60
  );
  IF v_result->>'allowed' <> 'false' THEN
    RAISE EXCEPTION 'Email limit should reject the second request: %', v_result;
  END IF;
  IF EXISTS (
    SELECT 1 FROM private.password_reset_rate_limits
    WHERE bucket_type = 'ip' AND identifier_hmac = v_ip_hash_2
  ) THEN
    RAISE EXCEPTION 'A rejected request incremented its IP bucket';
  END IF;

  UPDATE private.password_reset_rate_limits
  SET expires_at = pg_catalog.clock_timestamp()
  WHERE bucket_type = 'email' AND identifier_hmac = v_email_hash;

  v_result := public.consume_password_reset_rate_limit(
    v_email_hash, v_ip_hash_3, 1, 10, 60
  );
  IF v_result->>'allowed' <> 'true' THEN
    RAISE EXCEPTION 'An expired window should start a new window: %', v_result;
  END IF;

  SELECT request_count
    INTO v_email_count
  FROM private.password_reset_rate_limits
  WHERE bucket_type = 'email' AND identifier_hmac = v_email_hash;
  IF v_email_count <> 1 THEN
    RAISE EXCEPTION 'Expected the new email window count to be 1, got %', v_email_count;
  END IF;

  BEGIN
    PERFORM public.consume_password_reset_rate_limit(
      v_email_hash, v_ip_hash_2, 0, 10, 60
    );
    RAISE EXCEPTION 'Invalid parameters should have been rejected';
  EXCEPTION
    WHEN SQLSTATE '22023' THEN
      NULL;
  END;

  SELECT request_count
    INTO v_email_count
  FROM private.password_reset_rate_limits
  WHERE bucket_type = 'email' AND identifier_hmac = v_email_hash;
  IF v_email_count <> 1 THEN
    RAISE EXCEPTION 'Invalid request changed the email counter';
  END IF;
END;
$test$;

ROLLBACK;
