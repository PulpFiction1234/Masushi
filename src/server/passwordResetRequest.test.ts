/* eslint-env node */
import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordResetRequestHandler } from "./passwordResetRequest";
import type { PasswordResetRequestDependencies } from "./passwordResetRequest";

type TestResponse = {
  statusCode: number;
  body: Record<string, unknown> | null;
  status(code: number): TestResponse;
  json(body: Record<string, unknown>): TestResponse;
};

const makeResponse = (): TestResponse => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const makeRequest = (email = " customer@example.com ") => ({
  method: "POST",
  body: { email },
  headers: { "x-real-ip": "203.0.113.7" },
});

const baseDependencies = (): {
  dependencies: PasswordResetRequestDependencies;
  sentEmails: () => number;
  loggedEvents: string[];
} => {
  let sentEmails = 0;
  const loggedEvents: string[] = [];
  const dependencies = {
    isEnabled: () => true,
    resolveClientIp: () => "203.0.113.7",
    checkRateLimit: async () => ({ status: "allowed" as const }),
    sendResetEmail: async () => {
      sentEmails += 1;
      return { sent: true };
    },
    logFailure: (event: "client_ip_unavailable" | "rate_limiter_unavailable" | "request_failed") => {
      loggedEvents.push(event);
    },
  };
  return {
    dependencies,
    sentEmails: () => sentEmails,
    loggedEvents,
  };
};

const invoke = async (
  dependencies: ReturnType<typeof baseDependencies>["dependencies"],
  request = makeRequest(),
) => {
  const response = makeResponse();
  await createPasswordResetRequestHandler(dependencies)(request, response);
  return response;
};

test("disabled recovery returns a temporary generic error without checking limits or sending", async () => {
  const state = baseDependencies();
  state.dependencies.isEnabled = () => false;
  state.dependencies.checkRateLimit = async () => {
    throw new Error("must not be called");
  };

  const response = await invoke(state.dependencies);
  assert.equal(response.statusCode, 503);
  assert.equal(state.sentEmails(), 0);
});

test("limited requests return the same generic success shape and never send email", async () => {
  const state = baseDependencies();
  state.dependencies.checkRateLimit = async () => ({
    status: "limited",
    retryAfterSeconds: 30,
  });

  const response = await invoke(state.dependencies);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(JSON.stringify(response.body).includes("customer@example.com"), false);
  assert.equal(state.sentEmails(), 0);
});

test("missing trusted IP or unavailable database fail closed without sending", async () => {
  const noIp = baseDependencies();
  noIp.dependencies.resolveClientIp = () => null;
  const noIpResponse = await invoke(noIp.dependencies);
  assert.equal(noIpResponse.statusCode, 503);
  assert.equal(noIp.sentEmails(), 0);
  assert.deepEqual(noIp.loggedEvents, ["client_ip_unavailable"]);

  const databaseFailure = baseDependencies();
  databaseFailure.dependencies.checkRateLimit = async () => ({ status: "unavailable" });
  const databaseResponse = await invoke(databaseFailure.dependencies);
  assert.equal(databaseResponse.statusCode, 503);
  assert.deepEqual(databaseResponse.body, {
    error: "La recuperación no está disponible temporalmente.",
  });
  assert.equal(databaseFailure.sentEmails(), 0);
});

test("known and unknown accounts produce the same response with a mocked sender", async () => {
  const known = baseDependencies();
  const unknown = baseDependencies();
  let knownSendCalls = 0;
  let unknownSendCalls = 0;
  known.dependencies.sendResetEmail = async () => {
    knownSendCalls += 1;
    return { sent: true };
  };
  unknown.dependencies.sendResetEmail = async () => {
    unknownSendCalls += 1;
    return { sent: false };
  };

  const knownResponse = await invoke(known.dependencies);
  const unknownResponse = await invoke(unknown.dependencies);
  assert.equal(knownResponse.statusCode, unknownResponse.statusCode);
  assert.deepEqual(knownResponse.body, unknownResponse.body);
  assert.equal(knownSendCalls, 1);
  assert.equal(unknownSendCalls, 1);
});

test("the API normalizes email before rate limiting and delivery", async () => {
  const state = baseDependencies();
  let limitedEmail = "";
  let deliveredEmail = "";
  state.dependencies.checkRateLimit = async (input) => {
    limitedEmail = input.normalizedEmail;
    return { status: "allowed" };
  };
  state.dependencies.sendResetEmail = async (email) => {
    deliveredEmail = email;
  };

  const response = await invoke(state.dependencies);
  assert.equal(response.statusCode, 200);
  assert.equal(limitedEmail, "customer@example.com");
  assert.equal(deliveredEmail, "customer@example.com");
});

test("database exceptions return a generic temporary error and do not send", async () => {
  const state = baseDependencies();
  state.dependencies.checkRateLimit = async () => {
    throw new Error("database details must not be logged");
  };

  const response = await invoke(state.dependencies);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(state.loggedEvents, ["rate_limiter_unavailable"]);
  assert.equal(state.sentEmails(), 0);
});

test("send failures are logged without exposing the error or recovery token", async () => {
  const state = baseDependencies();
  const sentinel = "test-only-recovery-token";
  state.dependencies.sendResetEmail = async () => {
    throw new Error(sentinel);
  };

  const response = await invoke(state.dependencies);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.deepEqual(state.loggedEvents, ["request_failed"]);
  assert.equal(JSON.stringify(state.loggedEvents).includes(sentinel), false);
});

test("invalid email is rejected before resolving IP, rate limiting, or sending", async () => {
  const state = baseDependencies();
  state.dependencies.resolveClientIp = () => {
    throw new Error("must not be called");
  };

  const response = await invoke(state.dependencies, makeRequest("not-an-email"));
  assert.equal(response.statusCode, 400);
  assert.equal(state.sentEmails(), 0);
});
