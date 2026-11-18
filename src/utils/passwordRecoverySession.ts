import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureSupabasePassword } from "./strings";

export const updateVerifiedRecoveryPin = async (
  client: SupabaseClient,
  verifiedUserId: string,
  pin: string,
): Promise<"invalid" | "failed" | "success"> => {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.id !== verifiedUserId) return "invalid";

  const { error: updateError } = await client.auth.updateUser({
    password: ensureSupabasePassword(pin),
  });
  return updateError ? "failed" : "success";
};
