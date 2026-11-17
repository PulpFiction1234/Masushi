-- Additive storage for hashed PIN-recovery rate-limit buckets.
-- This migration does not touch customer, auth, profile, address, or order data.

DO $preflight$
DECLARE
  v_collisions TEXT;
BEGIN
  IF pg_catalog.to_regclass('private.password_reset_rate_limits') IS NOT NULL THEN
    RAISE EXCEPTION 'Staging preflight failed: private.password_reset_rate_limits already exists';
  END IF;

  SELECT pg_catalog.string_agg(
    pg_catalog.format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid)
    ),
    ', '
  )
    INTO v_collisions
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n
    ON n.oid = p.pronamespace
  WHERE p.proname = 'consume_password_reset_rate_limit';
  IF v_collisions IS NOT NULL THEN
    RAISE EXCEPTION 'Staging preflight failed: function name collision(s): %', v_collisions;
  END IF;

  SELECT pg_catalog.string_agg(
    pg_catalog.format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_catalog.pg_get_function_identity_arguments(p.oid)
    ),
    ', '
  )
    INTO v_collisions
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n
    ON n.oid = p.pronamespace
  WHERE p.proname = 'cleanup_password_reset_rate_limits';
  IF v_collisions IS NOT NULL THEN
    RAISE EXCEPTION 'Staging preflight failed: function name collision(s): %', v_collisions;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_namespace AS n
    WHERE n.nspname = 'private'
      AND NOT pg_catalog.has_schema_privilege('service_role', n.oid, 'USAGE')
  ) THEN
    RAISE EXCEPTION 'Staging preflight failed: service_role lacks USAGE on existing schema private';
  END IF;
END;
$preflight$;

DO $schema$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'private'
  ) THEN
    CREATE SCHEMA private;
    GRANT USAGE ON SCHEMA private TO service_role;
  END IF;
END;
$schema$;

CREATE TABLE private.password_reset_rate_limits (
  bucket_type TEXT NOT NULL CHECK (bucket_type IN ('email', 'ip')),
  identifier_hmac TEXT NOT NULL CHECK (identifier_hmac ~ '^[0-9a-f]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (bucket_type, identifier_hmac),
  CHECK (expires_at > window_started_at)
);

CREATE INDEX password_reset_rate_limits_expires_at_idx
  ON private.password_reset_rate_limits (expires_at);

ALTER TABLE private.password_reset_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.password_reset_rate_limits
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE private.password_reset_rate_limits TO service_role;

CREATE FUNCTION public.consume_password_reset_rate_limit(
  p_email_hash TEXT,
  p_ip_hash TEXT,
  p_email_limit INTEGER,
  p_ip_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ;
  v_window INTERVAL;
  v_email_lock BIGINT;
  v_ip_lock BIGINT;
  v_email_count INTEGER;
  v_ip_count INTEGER;
  v_email_expires TIMESTAMPTZ;
  v_ip_expires TIMESTAMPTZ;
  v_retry_after INTEGER;
BEGIN
  IF p_email_hash IS NULL OR p_email_hash !~ '^[0-9a-f]{64}$'
    OR p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$'
    OR p_email_limit IS NULL OR p_email_limit < 1 OR p_email_limit > 100
    OR p_ip_limit IS NULL OR p_ip_limit < 1 OR p_ip_limit > 10000
    OR p_window_seconds IS NULL OR p_window_seconds < 60 OR p_window_seconds > 86400
  THEN
    RAISE EXCEPTION 'Invalid password recovery rate-limit parameters'
      USING ERRCODE = '22023';
  END IF;

  v_email_lock := pg_catalog.hashtextextended('email:' || p_email_hash, 0);
  v_ip_lock := pg_catalog.hashtextextended('ip:' || p_ip_hash, 0);

  -- Acquire both per-identifier locks in a stable order to prevent races/deadlocks.
  IF v_email_lock <= v_ip_lock THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(v_email_lock);
    IF v_email_lock <> v_ip_lock THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(v_ip_lock);
    END IF;
  ELSE
    PERFORM pg_catalog.pg_advisory_xact_lock(v_ip_lock);
    PERFORM pg_catalog.pg_advisory_xact_lock(v_email_lock);
  END IF;

  v_now := pg_catalog.clock_timestamp();
  v_window := pg_catalog.make_interval(secs => p_window_seconds);

  DELETE FROM private.password_reset_rate_limits
  WHERE expires_at <= v_now
    AND (
      (bucket_type = 'email' AND identifier_hmac = p_email_hash)
      OR (bucket_type = 'ip' AND identifier_hmac = p_ip_hash)
    );

  SELECT request_count, expires_at
    INTO v_email_count, v_email_expires
  FROM private.password_reset_rate_limits
  WHERE bucket_type = 'email' AND identifier_hmac = p_email_hash;
  IF NOT FOUND THEN
    v_email_count := 0;
    v_email_expires := v_now + v_window;
  END IF;

  SELECT request_count, expires_at
    INTO v_ip_count, v_ip_expires
  FROM private.password_reset_rate_limits
  WHERE bucket_type = 'ip' AND identifier_hmac = p_ip_hash;
  IF NOT FOUND THEN
    v_ip_count := 0;
    v_ip_expires := v_now + v_window;
  END IF;

  IF v_email_count >= p_email_limit OR v_ip_count >= p_ip_limit THEN
    v_retry_after := GREATEST(
      CASE WHEN v_email_count >= p_email_limit
        THEN pg_catalog.ceil(EXTRACT(epoch FROM (v_email_expires - v_now)))::INTEGER
        ELSE 0
      END,
      CASE WHEN v_ip_count >= p_ip_limit
        THEN pg_catalog.ceil(EXTRACT(epoch FROM (v_ip_expires - v_now)))::INTEGER
        ELSE 0
      END,
      1
    );
    RETURN pg_catalog.jsonb_build_object(
      'allowed', FALSE,
      'retry_after_seconds', v_retry_after
    );
  END IF;

  INSERT INTO private.password_reset_rate_limits (
    bucket_type, identifier_hmac, window_started_at, request_count, expires_at
  )
  VALUES
    ('email', p_email_hash, v_now, 1, v_now + v_window),
    ('ip', p_ip_hash, v_now, 1, v_now + v_window)
  ON CONFLICT (bucket_type, identifier_hmac) DO UPDATE
    SET request_count = private.password_reset_rate_limits.request_count + 1;

  RETURN pg_catalog.jsonb_build_object(
    'allowed', TRUE,
    'retry_after_seconds', 0
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_password_reset_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_password_reset_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER)
  TO service_role;

COMMENT ON TABLE private.password_reset_rate_limits IS
  'HMAC-only per-email/IP counters for PIN recovery request throttling.';
COMMENT ON FUNCTION public.consume_password_reset_rate_limit(TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS
  'Atomically checks and increments PIN-recovery email and IP buckets; callable only by service_role.';

CREATE FUNCTION private.cleanup_password_reset_rate_limits(
  p_batch_size INTEGER DEFAULT 500
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 1000 THEN
    RAISE EXCEPTION 'Invalid password recovery cleanup batch size'
      USING ERRCODE = '22023';
  END IF;

  WITH expired AS (
    SELECT ctid
    FROM private.password_reset_rate_limits
    WHERE expires_at <= pg_catalog.clock_timestamp()
    ORDER BY expires_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM private.password_reset_rate_limits AS rate_limit
  USING expired
  WHERE rate_limit.ctid = expired.ctid;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION private.cleanup_password_reset_rate_limits(INTEGER)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.cleanup_password_reset_rate_limits(INTEGER)
  TO service_role;

COMMENT ON FUNCTION private.cleanup_password_reset_rate_limits(INTEGER) IS
  'Deletes at most the requested number of expired password-recovery buckets; callable only by service_role.';
