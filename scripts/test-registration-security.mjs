import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import next from "next";

const userId = "10000000-0000-4000-8000-000000000001";
const validUserId = "10000000-0000-4000-8000-000000000002";
const user = {
  id: userId,
  email: "test@example.invalid",
  email_confirmed_at: null,
  user_metadata: {},
  aud: "authenticated",
  role: "authenticated",
};
const calls = { resends: 0, updates: 0, unexpected: 0 };
const buckets = new Map();
let rpcUnavailable = false;
let rpcMalformed = false;

const mock = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://127.0.0.1");
  res.setHeader("content-type", "application/json");
  if (req.method === "GET" && pathname === "/auth/v1/admin/users") {
    res.end(JSON.stringify({ users: [user] }));
  } else if (req.method === "GET" && pathname === `/auth/v1/admin/users/${userId}`) {
    res.end(JSON.stringify(user));
  } else if (req.method === "POST" && pathname === "/auth/v1/resend") {
    calls.resends++;
    res.end("{}");
  } else if (req.method === "POST" && pathname === "/rest/v1/rpc/consume_verification_rate_limit") {
    if (rpcUnavailable) {
      res.statusCode = 503;
      res.end("{}");
      return;
    }
    if (rpcMalformed) {
      res.end(JSON.stringify({ allowed: false }));
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const params = JSON.parse(body);
    assert.match(params.p_account_hash, /^[0-9a-f]{64}$/);
    assert.match(params.p_ip_hash, /^[0-9a-f]{64}$/);
    const account = `account:${params.p_account_hash}`;
    const ip = `ip:${params.p_ip_hash}`;
    if ((buckets.get(account) ?? 0) >= 8 || (buckets.get(ip) ?? 0) >= 20) {
      res.end(JSON.stringify({ allowed: false, retry_after_seconds: 3600 }));
    } else {
      buckets.set(account, (buckets.get(account) ?? 0) + 1);
      buckets.set(ip, (buckets.get(ip) ?? 0) + 1);
      res.end(JSON.stringify({ allowed: true, retry_after_seconds: 0 }));
    }
  } else if (req.method === "GET" && pathname === "/rest/v1/email_verifications") {
    const url = new URL(req.url, "http://127.0.0.1");
    const valid = url.searchParams.get("user_id") === `eq.${validUserId}` &&
      url.searchParams.get("code") === "eq.654321";
    res.end(JSON.stringify(valid ? [{ id: 1, user_id: validUserId }] : []));
  } else if (req.method === "PATCH" && pathname === "/rest/v1/email_verifications") {
    res.end("[]");
  } else if (req.method === "PUT" && pathname === `/auth/v1/admin/users/${validUserId}`) {
    calls.updates++;
    res.end("{}");
  } else if (req.method === "PUT" && pathname === `/auth/v1/admin/users/${userId}`) {
    calls.updates++;
    res.statusCode = 500;
    res.end("{}");
  } else {
    calls.unexpected++;
    res.statusCode = 500;
    res.end("{}");
  }
});

mock.listen(0, "127.0.0.1");
await once(mock, "listening");
const mockUrl = `http://127.0.0.1:${mock.address().port}`;
process.env.SUPABASE_URL = mockUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-placeholder";
process.env.NEXT_PUBLIC_SUPABASE_URL = mockUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-placeholder";
process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.VERCEL = "1";
process.env.VERIFICATION_TRUST_VERCEL_IP = "true";
process.env.VERIFICATION_RATE_LIMIT_HMAC_SECRET = "test-only-verification-secret-32-bytes";

const app = next({ dev: false, dir: process.cwd() });
let server;
try {
  await app.prepare();
  server = createServer(app.getRequestHandler());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, ip) => fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(ip ? { "x-real-ip": ip } : {}) },
    body: JSON.stringify(body),
  });

  for (const path of [
    "/api/admin/clientes",
    "/api/admin/whatsapp-messages",
    "/api/admin/closed",
    "/api/admin/address-overrides",
    "/api/orders",
    "/api/user/addresses",
  ]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 401, `${path} must reject anonymous requests`);
  }

  let response = await post("/api/auth/send-verification-code", {
    email: "other@example.invalid",
    userId,
  });
  assert.equal(response.status, 400);
  assert.equal(calls.resends, 0);

  response = await post("/api/auth/send-verification-code", {
    email: " TEST@EXAMPLE.INVALID ",
    userId,
  });
  assert.equal(response.status, 200);
  assert.equal(calls.resends, 1);

  response = await post("/api/auth/register", {
    email: user.email,
    password: "1234",
    name: "Test",
    phone: "00000000",
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "existing");
  assert.equal(calls.resends, 2);
  assert.equal(calls.updates, 0);

  user.email_confirmed_at = "2026-01-01T00:00:00Z";
  response = await post("/api/auth/register", {
    email: user.email,
    password: "1234",
  });
  assert.equal(response.status, 409);
  assert.equal(calls.resends, 2);
  assert.equal(calls.updates, 0);

  const verify = (id, ip) => post("/api/auth/verify-code", { userId: id, code: "123456" }, ip);
  response = await verify(userId);
  assert.equal(response.status, 503, "an untrusted/missing IP must fail closed");
  rpcUnavailable = true;
  response = await verify(userId, "203.0.113.1");
  assert.equal(response.status, 503, "an unavailable limiter must fail closed");
  rpcUnavailable = false;
  rpcMalformed = true;
  response = await verify(userId, "203.0.113.1");
  assert.equal(response.status, 503, "a malformed limiter response must fail closed");
  rpcMalformed = false;
  process.env.VERIFICATION_RATE_LIMIT_HMAC_SECRET = "short";
  response = await verify(userId, "203.0.113.1");
  assert.equal(response.status, 503, "a weak limiter secret must fail closed");
  process.env.VERIFICATION_RATE_LIMIT_HMAC_SECRET = "test-only-verification-secret-32-bytes";

  for (let i = 0; i < 7; i++) {
    response = await verify(userId, `203.0.113.${i + 1}`);
    assert.equal(response.status, 400, "invalid codes must consume the account budget");
  }
  response = await post("/api/auth/verify-code", { email: user.email, code: "123456" }, "203.0.113.8");
  assert.equal(response.status, 400, "email and UUID must share an account budget");
  response = await verify(userId, "203.0.113.9");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "3600");

  for (let i = 0; i < 20; i++) {
    const id = `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
    response = await verify(id, "198.51.100.1");
    assert.equal(response.status, 400, "invalid codes must consume the IP budget");
  }
  response = await verify("20000000-0000-4000-8000-000000000020", "198.51.100.1");
  assert.equal(response.status, 429);

  response = await post("/api/auth/verify-code", { userId: validUserId, code: "654321" }, "198.51.100.2");
  assert.equal(response.status, 200, "a valid code must still confirm the synthetic account");
  assert.equal(calls.updates, 1);
  assert.equal(calls.unexpected, 0);
  console.log("Registration security checks passed with a synthetic local service.");
} finally {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await app.close();
  await new Promise((resolve, reject) => mock.close((error) => error ? reject(error) : resolve()));
}
