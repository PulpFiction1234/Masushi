-- Independent, HMAC-only counters for custom email-verification attempts.
-- Apply only after review and isolated testing; this does not change customer tables.
BEGIN;

DO $preflight$
BEGIN
  IF pg_catalog.to_regnamespace('private') IS NULL OR
     NOT pg_catalog.has_schema_privilege('service_role', 'private', 'USAGE') THEN
    RAISE EXCEPTION 'Existing private schema with service_role USAGE is required';
  END IF;
END;
$preflight$;

CREATE TABLE private.verification_rate_limits (
  bucket_type TEXT NOT NULL CHECK (bucket_type IN ('account', 'ip')),
  identifier_hmac TEXT NOT NULL CHECK (identifier_hmac ~ '^[0-9a-f]{64}$'),
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (bucket_type, identifier_hmac)
);

CREATE INDEX verification_rate_limits_expires_at_idx
  ON private.verification_rate_limits (expires_at);
ALTER TABLE private.verification_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.verification_rate_limits FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE private.verification_rate_limits TO service_role;

CREATE FUNCTION public.consume_verification_rate_limit(p_account_hash TEXT, p_ip_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ;
  v_account_lock BIGINT;
  v_ip_lock BIGINT;
  v_account_count INTEGER;
  v_ip_count INTEGER;
  v_account_expires TIMESTAMPTZ;
  v_ip_expires TIMESTAMPTZ;
  v_retry INTEGER;
BEGIN
  IF p_account_hash IS NULL OR p_account_hash !~ '^[0-9a-f]{64}$'
    OR p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid verification rate-limit identifiers' USING ERRCODE = '22023';
  END IF;

  v_account_lock := pg_catalog.hashtextextended('verification:account:' || p_account_hash, 0);
  v_ip_lock := pg_catalog.hashtextextended('verification:ip:' || p_ip_hash, 0);
  PERFORM pg_catalog.pg_advisory_xact_lock(LEAST(v_account_lock, v_ip_lock));
  IF v_account_lock <> v_ip_lock THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(GREATEST(v_account_lock, v_ip_lock));
  END IF;
  v_now := pg_catalog.clock_timestamp();

  DELETE FROM private.verification_rate_limits
  WHERE expires_at <= v_now AND (
    (bucket_type = 'account' AND identifier_hmac = p_account_hash)
    OR (bucket_type = 'ip' AND identifier_hmac = p_ip_hash)
  );
  SELECT request_count, expires_at INTO v_account_count, v_account_expires
    FROM private.verification_rate_limits
    WHERE bucket_type = 'account' AND identifier_hmac = p_account_hash;
  IF NOT FOUND THEN
    v_account_count := 0;
    v_account_expires := v_now + INTERVAL '1 hour';
  END IF;
  SELECT request_count, expires_at INTO v_ip_count, v_ip_expires
    FROM private.verification_rate_limits
    WHERE bucket_type = 'ip' AND identifier_hmac = p_ip_hash;
  IF NOT FOUND THEN
    v_ip_count := 0;
    v_ip_expires := v_now + INTERVAL '1 hour';
  END IF;

  IF v_account_count >= 8 OR v_ip_count >= 20 THEN
    v_retry := GREATEST(
      CASE WHEN v_account_count >= 8 THEN pg_catalog.ceil(EXTRACT(epoch FROM (v_account_expires - v_now)))::INTEGER ELSE 0 END,
      CASE WHEN v_ip_count >= 20 THEN pg_catalog.ceil(EXTRACT(epoch FROM (v_ip_expires - v_now)))::INTEGER ELSE 0 END,
      1
    );
    RETURN pg_catalog.jsonb_build_object('allowed', FALSE, 'retry_after_seconds', v_retry);
  END IF;

  INSERT INTO private.verification_rate_limits (bucket_type, identifier_hmac, request_count, expires_at)
  VALUES ('account', p_account_hash, 1, v_account_expires), ('ip', p_ip_hash, 1, v_ip_expires)
  ON CONFLICT (bucket_type, identifier_hmac) DO UPDATE
    SET request_count = private.verification_rate_limits.request_count + 1;
  RETURN pg_catalog.jsonb_build_object('allowed', TRUE, 'retry_after_seconds', 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_verification_rate_limit(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_verification_rate_limit(TEXT, TEXT) TO service_role;

CREATE FUNCTION private.cleanup_verification_rate_limits(p_batch_size INTEGER DEFAULT 500)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 1000 THEN
    RAISE EXCEPTION 'Invalid verification cleanup batch size' USING ERRCODE = '22023';
  END IF;
  WITH expired AS (
    SELECT bucket_type, identifier_hmac FROM private.verification_rate_limits
    WHERE expires_at <= pg_catalog.clock_timestamp()
    ORDER BY expires_at
    LIMIT p_batch_size
  )
  DELETE FROM private.verification_rate_limits AS limits
  USING expired
  WHERE limits.bucket_type = expired.bucket_type AND limits.identifier_hmac = expired.identifier_hmac;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;
REVOKE ALL ON FUNCTION private.cleanup_verification_rate_limits(INTEGER)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.cleanup_verification_rate_limits(INTEGER) TO service_role;

COMMIT;
