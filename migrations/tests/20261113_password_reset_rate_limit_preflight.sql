-- Read-only preflight for an isolated staging database. Do not run against production.
-- Any existing relation or function name collision must be reviewed before migration.

SELECT
  pg_catalog.to_regclass('private.password_reset_rate_limits')
    AS existing_rate_limit_relation;

SELECT
  n.nspname AS function_schema,
  p.proname AS function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n
  ON n.oid = p.pronamespace
WHERE p.proname IN (
  'consume_password_reset_rate_limit',
  'cleanup_password_reset_rate_limits'
)
ORDER BY n.nspname, p.proname, identity_arguments;

SELECT
  n.nspname AS schema_name,
  pg_catalog.has_schema_privilege('service_role', n.oid, 'USAGE')
    AS service_role_has_usage
FROM pg_catalog.pg_namespace AS n
WHERE n.nspname = 'private';
