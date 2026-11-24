import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import supabaseAdmin from "@/server/supabase";
import { authorizeAdmin } from "@/server/adminAuthorizationCore";

export function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  return authorizeAdmin(
    () => supabase.auth.getUser(),
    async (userId) => supabaseAdmin
      .from("profiles")
      .select("role, is_admin")
      .eq("id", userId)
      .maybeSingle(),
  );
}
