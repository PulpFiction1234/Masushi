/* eslint-env node */
import test from "node:test";
import assert from "node:assert/strict";
import {
  createPasswordResetRateLimiter,
  loadPasswordResetRateLimitConfig,
  resolveTrustedVercelClientIp,
  type PasswordResetRateLimitConfig,
  type RateLimitRpcParams,
} from "./passwordResetRateLimitCore";

const config: PasswordResetRateLimitConfig = {
  hmacSecret: "test-only-hmac-key-with-at-least-32-bytes",
  emailLimit: 3,
  ipLimit: 20,
  windowSeconds: 3600,
};

const makeRequest = (normalizedEmail = "customer@example.com", clientIp: string | null = "203.0.113.7") => ({
  normalizedEmail,
  clientIp,
});

const createAtomicMockRpc = (limits?: {
  emailLimit?: number;
  ipLimit?: number;
  windowSeconds?: number;
}) => {
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  const calls: RateLimitRpcParams[] = [];
  let now = 1_000_000;
  let pending = Promise.resolve();

  const rpc = (params: RateLimitRpcParams) => {
    calls.push(params);
    const result = pending.then(() => {
      const emailKey = `email:${params.p_email_hash}`;
      const ipKey = `ip:${params.p_ip_hash}`;
      const email = buckets.get(emailKey);
      const ip = buckets.get(ipKey);
      const emailCount = email && email.expiresAt > now ? email.count : 0;
      const ipCount = ip && ip.expiresAt > now ? ip.count : 0;
      const emailLimit = limits?.emailLimit ?? params.p_email_limit;
      const ipLimit = limits?.ipLimit ?? params.p_ip_limit;
      const windowSeconds = limits?.windowSeconds ?? params.p_window_seconds;

      if (emailCount >= emailLimit || ipCount >= ipLimit) {
        return {
          data: { allowed: false, retry_after_seconds: 1 },
          error: null,
        };
      }

      const expiresAt = now + windowSeconds * 1000;
      buckets.set(emailKey, {
        count: emailCount + 1,
        expiresAt: email && email.expiresAt > now ? email.expiresAt : expiresAt,
      });
      buckets.set(ipKey, {
        count: ipCount + 1,
        expiresAt: ip && ip.expiresAt > now ? ip.expiresAt : expiresAt,
      });
      return { data: { allowed: true, retry_after_seconds: 0 }, error: null };
    });
    pending = result.then(() => undefined, () => undefined);
    return result;
  };

  return {
    rpc,
    calls,
    advanceTime(milliseconds: number) {
      now += milliseconds;
    },
  };
};

test("configuration fails closed if server secrets, limits, or verified Vercel trust are absent", () => {
  assert.equal(loadPasswordResetRateLimitConfig({}), null);
  assert.equal(
    loadPasswordResetRateLimitConfig({
      PASSWORD_RESET_RATE_LIMIT_HMAC_SECRET: config.hmacSecret,
      PASSWORD_RESET_EMAIL_LIMIT: "3",
      PASSWORD_RESET_IP_LIMIT: "20",
      PASSWORD_RESET_RATE_WINDOW_SECONDS: "3600",
    }),
    null,
  );
  assert.equal(
    loadPasswordResetRateLimitConfig({
      VERCEL: "1",
      PIN_RECOVERY_TRUST_VERCEL_IP: "true",
      PASSWORD_RESET_RATE_LIMIT_HMAC_SECRET: "short",
      PASSWORD_RESET_EMAIL_LIMIT: "3",
      PASSWORD_RESET_IP_LIMIT: "20",
      PASSWORD_RESET_RATE_WINDOW_SECONDS: "3600",
    }),
    null,
  );
});

test("first request is allowed and sends only HMAC identifiers to the shared store", async () => {
  const mock = createAtomicMockRpc();
  const limiter = createPasswordResetRateLimiter(config, mock.rpc);

  assert.deepEqual(await limiter.check(makeRequest()), { status: "allowed" });
  assert.equal(mock.calls.length, 1);
  assert.match(mock.calls[0].p_email_hash, /^[0-9a-f]{64}$/);
  assert.match(mock.calls[0].p_ip_hash, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(mock.calls[0]).includes("customer@example.com"), false);
  assert.equal(JSON.stringify(mock.calls[0]).includes("203.0.113.7"), false);
  assert.equal(mock.calls[0].p_email_limit, config.emailLimit);
  assert.equal(mock.calls[0].p_ip_limit, config.ipLimit);
});

test("email identity is normalized before deriving its HMAC", async () => {
  const mock = createAtomicMockRpc();
  const limiter = createPasswordResetRateLimiter(config, mock.rpc);

  await limiter.check(makeRequest("Customer@Example.com"));
  await limiter.check(makeRequest(" customer@example.COM "));

  assert.equal(mock.calls[0].p_email_hash, mock.calls[1].p_email_hash);
});

test("email and IP limits are applied and rejected requests do not consume the other bucket", async () => {
  const mock = createAtomicMockRpc({ emailLimit: 2, ipLimit: 2 });
  const limiter = createPasswordResetRateLimiter(
    { ...config, emailLimit: 2, ipLimit: 2 },
    mock.rpc,
  );

  assert.deepEqual(await limiter.check(makeRequest()), { status: "allowed" });
  assert.deepEqual(
    await limiter.check(makeRequest("other@example.com")),
    { status: "allowed" },
  );
  assert.deepEqual(
    await limiter.check(makeRequest("third@example.com")),
    { status: "limited", retryAfterSeconds: 1 },
  );
  assert.deepEqual(
    await limiter.check(makeRequest("third@example.com", "203.0.113.8")),
    { status: "allowed" },
  );
});

test("the normalized email limit applies across different client IPs", async () => {
  const mock = createAtomicMockRpc({ emailLimit: 1, ipLimit: 10 });
  const limiter = createPasswordResetRateLimiter(
    { ...config, emailLimit: 1, ipLimit: 10 },
    mock.rpc,
  );

  assert.deepEqual(await limiter.check(makeRequest()), { status: "allowed" });
  assert.deepEqual(
    await limiter.check(makeRequest("customer@example.com", "203.0.113.8")),
    { status: "limited", retryAfterSeconds: 1 },
  );
});

test("an expired window starts a new counter window", async () => {
  const mock = createAtomicMockRpc({ emailLimit: 1, ipLimit: 10, windowSeconds: 60 });
  const limiter = createPasswordResetRateLimiter(
    { ...config, emailLimit: 1, ipLimit: 10, windowSeconds: 60 },
    mock.rpc,
  );

  assert.deepEqual(await limiter.check(makeRequest()), { status: "allowed" });
  assert.deepEqual(await limiter.check(makeRequest()), {
    status: "limited",
    retryAfterSeconds: 1,
  });
  mock.advanceTime(60_001);
  assert.deepEqual(await limiter.check(makeRequest()), { status: "allowed" });
});

test("concurrent calls honor the shared atomic decision contract", async () => {
  const mock = createAtomicMockRpc({ emailLimit: 3, ipLimit: 20 });
  const limiter = createPasswordResetRateLimiter(
    { ...config, emailLimit: 3, ipLimit: 20 },
    mock.rpc,
  );

  const results = await Promise.all(
    Array.from({ length: 10 }, () => limiter.check(makeRequest())),
  );
  assert.equal(results.filter((result) => result.status === "allowed").length, 3);
  assert.equal(results.filter((result) => result.status === "limited").length, 7);
});

test("database errors and malformed decisions fail closed", async () => {
  const databaseFailure = createPasswordResetRateLimiter(config, async () => ({
    data: null,
    error: new Error("database failure"),
  }));
  const malformedResponse = createPasswordResetRateLimiter(config, async () => ({
    data: { allowed: false },
    error: null,
  }));

  assert.deepEqual(await databaseFailure.check(makeRequest()), { status: "unavailable" });
  assert.deepEqual(await malformedResponse.check(makeRequest()), { status: "unavailable" });
});

test("missing and invalid client IPs fail closed without calling the database", async () => {
  let calls = 0;
  const limiter = createPasswordResetRateLimiter(config, async () => {
    calls += 1;
    return { data: { allowed: true }, error: null };
  });

  assert.deepEqual(await limiter.check(makeRequest("customer@example.com", null)), {
    status: "unavailable",
  });
  assert.deepEqual(await limiter.check(makeRequest("customer@example.com", "not-an-ip")), {
    status: "unavailable",
  });
  assert.equal(calls, 0);
});

test("only a verified Vercel x-real-ip is accepted; forwarded client headers are ignored", () => {
  const trustedEnvironment = {
    VERCEL: "1",
    PIN_RECOVERY_TRUST_VERCEL_IP: "true",
  };
  assert.equal(
    resolveTrustedVercelClientIp({ "x-real-ip": "203.0.113.7" }, trustedEnvironment),
    "203.0.113.7",
  );
  assert.equal(
    resolveTrustedVercelClientIp(
      { "x-forwarded-for": "203.0.113.8", "x-real-ip": "spoofed" },
      trustedEnvironment,
    ),
    null,
  );
  assert.equal(
    resolveTrustedVercelClientIp(
      { "x-forwarded-for": "203.0.113.8" },
      trustedEnvironment,
    ),
    null,
  );
  assert.equal(
    resolveTrustedVercelClientIp(
      { "x-real-ip": "2001:0db8:0:0:0:0:0:1" },
      trustedEnvironment,
    ),
    "2001:db8::1",
  );
  assert.equal(
    resolveTrustedVercelClientIp({ "x-real-ip": "203.0.113.7" }, {}),
    null,
  );
});
