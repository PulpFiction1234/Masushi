import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import next from "next";

const userId = "10000000-0000-4000-8000-000000000001";
const user = {
  id: userId,
  email: "test@example.invalid",
  email_confirmed_at: null,
  user_metadata: {},
  aud: "authenticated",
  role: "authenticated",
};
const calls = { resends: 0, updates: 0, unexpected: 0 };

const mock = createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://127.0.0.1");
  res.setHeader("content-type", "application/json");
  if (req.method === "GET" && pathname === "/auth/v1/admin/users") {
    res.end(JSON.stringify({ users: [user] }));
  } else if (req.method === "GET" && pathname === `/auth/v1/admin/users/${userId}`) {
    res.end(JSON.stringify(user));
  } else if (req.method === "POST" && pathname === "/auth/v1/resend") {
    calls.resends++;
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

const app = next({ dev: false, dir: process.cwd() });
let server;
try {
  await app.prepare();
  server = createServer(app.getRequestHandler());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
  assert.equal(calls.unexpected, 0);
  console.log("Registration security checks passed with a synthetic local service.");
} finally {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await app.close();
  await new Promise((resolve, reject) => mock.close((error) => error ? reject(error) : resolve()));
}
