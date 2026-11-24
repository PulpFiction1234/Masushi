import assert from "node:assert/strict";
import test from "node:test";
import { authorizeAdmin } from "./adminAuthorizationCore";

test("unauthenticated requests are rejected before looking up a profile", async () => {
  let profileLookups = 0;
  const result = await authorizeAdmin(
    async () => ({ data: { user: null }, error: { name: "AuthSessionMissingError" } }),
    async () => {
      profileLookups++;
      return { data: null, error: null };
    },
  );
  assert.deepEqual(result, { authorized: false, status: 401 });
  assert.equal(profileLookups, 0);
});

test("authenticated non-administrators are forbidden", async () => {
  const result = await authorizeAdmin(
    async () => ({ data: { user: { id: "test-user" } }, error: null }),
    async () => ({ data: { role: "user", is_admin: false }, error: null }),
  );
  assert.deepEqual(result, { authorized: false, status: 403 });
});

test("a verified user with an existing administrator role is allowed", async () => {
  for (const profile of [
    { role: "admin", is_admin: false },
    { role: "user", is_admin: true },
  ]) {
    const result = await authorizeAdmin(
      async () => ({ data: { user: { id: "test-admin" } }, error: null }),
      async (id) => {
        assert.equal(id, "test-admin");
        return { data: profile, error: null };
      },
    );
    assert.deepEqual(result, { authorized: true });
  }
});

test("authentication and profile service failures fail closed", async () => {
  const authUnavailable = await authorizeAdmin(
    async () => ({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 503 } }),
    async () => { throw new Error("profile should not be requested"); },
  );
  const profileUnavailable = await authorizeAdmin(
    async () => ({ data: { user: { id: "test-user" } }, error: null }),
    async () => ({ data: null, error: { code: "unavailable" } }),
  );
  assert.deepEqual(authUnavailable, { authorized: false, status: 503 });
  assert.deepEqual(profileUnavailable, { authorized: false, status: 503 });
});
