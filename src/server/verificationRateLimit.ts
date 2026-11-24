import { createHmac } from "node:crypto";
import supabaseAdmin from "@/server/supabase";
import { resolveTrustedVercelClientIp } from "@/server/passwordResetRateLimitCore";
import type { NextApiRequest } from "next";

type Decision = { status: "allowed" } | { status: "limited"; retryAfterSeconds: number } | { status: "unavailable" };
type Rpc = (params: { p_account_hash: string; p_ip_hash: string }) => Promise<{ data: unknown; error: unknown }>;

export async function checkVerificationRateLimit(
  accountId: string,
  headers: NextApiRequest["headers"],
  env: NodeJS.ProcessEnv,
  rpc: Rpc,
): Promise<Decision> {
  const secret = env.VERIFICATION_RATE_LIMIT_HMAC_SECRET;
  const ip = resolveTrustedVercelClientIp(headers, {
    VERCEL: env.VERCEL,
    PIN_RECOVERY_TRUST_VERCEL_IP: env.VERIFICATION_TRUST_VERCEL_IP,
  });
  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || !ip) return { status: "unavailable" };

  const hash = (kind: string, value: string) =>
    createHmac("sha256", secret).update(`masushi-verification:${kind}:`).update(value).digest("hex");

  try {
    const { data, error } = await rpc({
      p_account_hash: hash("account", accountId.toLowerCase()),
      p_ip_hash: hash("ip", ip),
    });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return { status: "unavailable" };
    const result = data as Record<string, unknown>;
    if (result.allowed === true) return { status: "allowed" };
    if (result.allowed === false && typeof result.retry_after_seconds === "number" &&
        Number.isSafeInteger(result.retry_after_seconds) && result.retry_after_seconds > 0) {
      return { status: "limited", retryAfterSeconds: result.retry_after_seconds };
    }
    return { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

export const limitVerification = (accountId: string, headers: NextApiRequest["headers"]) =>
  checkVerificationRateLimit(accountId, headers, process.env, async (params) => {
    const { data, error } = await supabaseAdmin.rpc("consume_verification_rate_limit", params);
    return { data, error };
  });
