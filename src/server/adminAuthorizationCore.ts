type VerifiedUser = { id: string; email?: string };

type AuthResult = {
  data: { user: VerifiedUser | null };
  error: { name: string; status?: number } | null;
};

type ProfileResult = {
  data: { role: string | null; is_admin: boolean | null } | null;
  error: { code: string } | null;
};

export type AdminAuthorization =
  | { authorized: true }
  | { authorized: false; status: 401 | 403 | 503 };

export async function verifyAdminIdentity(
  getUser: () => Promise<AuthResult>,
): Promise<{ authenticated: true; user: VerifiedUser } | { authenticated: false; status: 401 | 503 }> {
  try {
    const { data: { user }, error: authError } = await getUser();
    if (authError) {
      if (authError.name === "AuthSessionMissingError" ||
          (authError.status !== undefined && authError.status >= 400 && authError.status < 500)) {
        return { authenticated: false, status: 401 };
      }
      console.error("[admin-auth] Authentication service unavailable");
      return { authenticated: false, status: 503 };
    }
    if (!user) return { authenticated: false, status: 401 };
    return { authenticated: true, user };
  } catch {
    console.error("[admin-auth] Authentication service unavailable");
    return { authenticated: false, status: 503 };
  }
}

export async function authorizeAdmin(
  getUser: () => Promise<AuthResult>,
  getProfile: (userId: string) => Promise<ProfileResult>,
): Promise<AdminAuthorization> {
  const identity = await verifyAdminIdentity(getUser);
  if (identity.authenticated === false) return { authorized: false, status: identity.status };
  try {
    const { data: profile, error: profileError } = await getProfile(identity.user.id);
    if (profileError) {
      console.error("[admin-auth] Unable to check administrator profile");
      return { authorized: false, status: 503 };
    }
    if (!profile || (profile.role !== "admin" && profile.is_admin !== true)) {
      return { authorized: false, status: 403 };
    }
    return { authorized: true };
  } catch {
    console.error("[admin-auth] Administrator authorization unavailable");
    return { authorized: false, status: 503 };
  }
}
