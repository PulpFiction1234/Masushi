import test from "node:test";
import assert from "node:assert/strict";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { createPagesBrowserClient, createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { capturePasswordRecoveryUrl, takePasswordRecoveryUrl } from "./passwordRecovery";
import { updateVerifiedRecoveryPin } from "./passwordRecoverySession";

test("recovery URLs preserve cookie login and isolate the verified account", async () => {
  const normalId = "normal-test-user";
  const recoveryId = "recovery-test-user";
  const tokenFor = (id: string) => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${encode({ alg: "none", typ: "JWT" })}.${encode({
      sub: id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "authenticated",
      role: "authenticated",
    })}.signature`;
  };
  const sessionFor = (id: string) => ({
    access_token: tokenFor(id),
    refresh_token: `refresh-${id}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} },
  });
  const normalSession = sessionFor(normalId);
  const recoverySession = sessionFor(recoveryId);
  const cookies = new Map<string, string>();
  const requests: { method: string; path: string; authorization: string | null; body: string }[] = [];
  let url = new URL("https://www.masushi.cl/login");
  const historyState = { __N: true, key: "next-router" };
  const browser = {
    get location() { return url; },
    get document() { return documentMock; },
    history: {
      state: historyState,
      replaceState: (state: unknown, _unused: string, value: string | URL | null | undefined) => {
        assert.equal(state, historyState);
        url = new URL(String(value), url);
      },
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const documentMock = {
    visibilityState: "visible",
    addEventListener: () => {},
    removeEventListener: () => {},
    get cookie() {
      return [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
    },
    set cookie(value: string) {
      const [pair, ...attributes] = value.split("; ");
      const split = pair.indexOf("=");
      const key = pair.slice(0, split);
      if (attributes.some((attribute) => /^max-age=0$/i.test(attribute))) cookies.delete(key);
      else cookies.set(key, pair.slice(split + 1));
    },
  };
  const mockFetch: typeof fetch = async (input, init) => {
    const requestUrl = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const authorization = headers.get("authorization");
    const body = typeof init?.body === "string" ? init.body : "";
    requests.push({ method, path: requestUrl.pathname, authorization, body });
    if (requestUrl.hostname !== "test.invalid") throw new Error("Unexpected network request");
    if (requestUrl.pathname === "/auth/v1/token") {
      return Response.json(normalSession);
    }
    if (requestUrl.pathname === "/auth/v1/verify") {
      assert.equal(JSON.parse(body).token_hash, "valid-test-token");
      return Response.json(recoverySession);
    }
    if (requestUrl.pathname === "/auth/v1/user") {
      if (authorization !== `Bearer ${recoverySession.access_token}`) {
        throw new Error("Unexpected user authentication");
      }
      return Response.json(recoverySession.user);
    }
    if (requestUrl.pathname === "/auth/v1/logout") {
      assert.equal(authorization, `Bearer ${recoverySession.access_token}`);
      return new Response(null, { status: 204 });
    }
    if (requestUrl.pathname === "/rest/v1/profiles") {
      assert.equal(authorization, `Bearer ${normalSession.access_token}`);
      return Response.json([{ id: normalId }]);
    }
    throw new Error(`Unexpected mock request: ${method} ${requestUrl.pathname}`);
  };
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const oldBroadcastChannel = Object.getOwnPropertyDescriptor(globalThis, "BroadcastChannel");
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  Object.defineProperty(globalThis, "document", { value: documentMock, configurable: true });
  Object.defineProperty(globalThis, "BroadcastChannel", { value: undefined, configurable: true });
  const clients: { auth: { stopAutoRefresh: () => void } }[] = [];
  const makeGlobalClient = () => {
    const client = createPagesBrowserClient({
      supabaseUrl: "https://test.invalid",
      supabaseKey: "test-anon-key",
      isSingleton: false,
      options: { global: { fetch: mockFetch } },
    });
    clients.push(client);
    return client;
  };

  try {
    capturePasswordRecoveryUrl(browser);
    assert.equal(url.pathname, "/login");
    const loginClient = makeGlobalClient();
    const login = await loginClient.auth.signInWithPassword({ email: "test@example.invalid", password: "123400" });
    assert.equal(login.error, null);
    assert.equal(login.data.user?.id, normalId);
    const cookieBefore = documentMock.cookie;
    assert.notEqual(cookieBefore, "");

    for (const [fragment, reason] of [
      ["error=access_denied&error_code=otp_expired&error_description=expired", "expired"],
      ["error=access_denied&error_code=invalid_token&error_description=invalid", "invalid"],
    ]) {
      url = new URL(`https://www.masushi.cl/reset-password#${fragment}`);
      capturePasswordRecoveryUrl(browser);
      assert.equal(url.hash, "");
      assert.deepEqual(takePasswordRecoveryUrl(), { kind: "error", reason });
      const client = makeGlobalClient();
      const session = await client.auth.getSession();
      assert.equal(session.data.session?.user.id, normalId);
      assert.equal(documentMock.cookie, cookieBefore);
    }

    url = new URL("https://www.masushi.cl/reset-password?error_code=otp_expired&error_description=expired");
    capturePasswordRecoveryUrl(browser);
    assert.equal(url.search, "");
    assert.deepEqual(takePasswordRecoveryUrl(), { kind: "error", reason: "expired" });
    assert.equal((await makeGlobalClient().auth.getSession()).data.session?.user.id, normalId);
    assert.equal(documentMock.cookie, cookieBefore);

    const normalClient = makeGlobalClient();
    const result = await normalClient.from("profiles").select("id");
    assert.equal(result.error, null);
    assert.equal(result.data?.[0].id, normalId);
    const req = {
      headers: { cookie: documentMock.cookie },
      cookies: Object.fromEntries([...cookies].map(([key, value]) => [key, decodeURIComponent(value)])),
    } as NextApiRequest;
    const res = new ServerResponse(new IncomingMessage(new Socket())) as NextApiResponse;
    const serverClient = createPagesServerClient(
      { req, res },
      { supabaseUrl: "https://test.invalid", supabaseKey: "test-anon-key", options: { global: { fetch: mockFetch } } },
    );
    assert.equal((await serverClient.auth.getSession()).data.session?.user.id, normalId);

    url = new URL("https://www.masushi.cl/reset-password#token_hash=valid-test-token&type=recovery");
    capturePasswordRecoveryUrl(browser);
    assert.deepEqual(takePasswordRecoveryUrl(), { kind: "token", tokenHash: "valid-test-token" });
    assert.equal((await makeGlobalClient().auth.getSession()).data.session?.user.id, normalId);
    assert.equal(requests.filter((request) => request.path === "/auth/v1/verify").length, 0);

    const memory = new Map<string, string>();
    const storage: SupportedStorage = {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => { memory.set(key, value); },
      removeItem: (key) => { memory.delete(key); },
    };
    const recoveryClient = createClient("https://test.invalid", "test-anon-key", {
      auth: { storage, storageKey: "recovery-test", detectSessionInUrl: false, autoRefreshToken: false },
      global: { fetch: mockFetch },
    });
    clients.push(recoveryClient);
    const verified = await recoveryClient.auth.verifyOtp({ token_hash: "valid-test-token", type: "recovery" });
    assert.equal(verified.data.user?.id, recoveryId);
    assert.equal(verified.data.session?.user.id, recoveryId);
    assert.equal(await updateVerifiedRecoveryPin(recoveryClient, normalId, "2468"), "invalid");
    assert.equal(requests.filter((request) => request.path === "/auth/v1/user" && request.method === "PUT").length, 0);
    assert.equal(await updateVerifiedRecoveryPin(recoveryClient, recoveryId, "2468"), "success");
    const updates = requests.filter((request) => request.path === "/auth/v1/user" && request.method === "PUT");
    assert.equal(updates.length, 1);
    assert.equal(updates[0].authorization, `Bearer ${recoverySession.access_token}`);
    assert.equal(JSON.parse(updates[0].body).password, "246800");
    assert.equal(documentMock.cookie, cookieBefore);
    assert.equal((await normalClient.auth.getSession()).data.session?.user.id, normalId);
    assert.equal((await recoveryClient.auth.signOut({ scope: "local" })).error, null);
    assert.equal((await recoveryClient.auth.getSession()).data.session, null);
    assert.equal(documentMock.cookie, cookieBefore);
    assert.equal((await normalClient.auth.getSession()).data.session?.user.id, normalId);
  } finally {
    clients.forEach((client) => client.auth.stopAutoRefresh());
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else Reflect.deleteProperty(globalThis, "document");
    if (oldBroadcastChannel) Object.defineProperty(globalThis, "BroadcastChannel", oldBroadcastChannel);
    else Reflect.deleteProperty(globalThis, "BroadcastChannel");
  }
});
