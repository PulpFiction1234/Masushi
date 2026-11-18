import supabaseAdmin from "@/server/supabase";
import {
  createPasswordResetRateLimiter,
  loadPasswordResetRateLimitConfig,
  type PasswordResetRateLimitInput,
  type PasswordResetRateLimitResult,
} from "@/server/passwordResetRateLimitCore";
import { isPasswordResetRateLimiterConfigured } from "@/server/passwordResetRateLimitConfig";

export type {
  PasswordResetRateLimitInput,
  PasswordResetRateLimitResult,
} from "@/server/passwordResetRateLimitCore";
export { resolveTrustedVercelClientIp } from "@/server/passwordResetRateLimitCore";

const config = loadPasswordResetRateLimitConfig(process.env);

const rateLimiter = config
  ? createPasswordResetRateLimiter(config, async (params) => {
      const { data, error } = await supabaseAdmin.rpc(
        "consume_password_reset_rate_limit",
        params,
      );
      return { data, error };
    })
  : null;

export const checkPasswordResetRateLimit = async (
  input: PasswordResetRateLimitInput,
): Promise<PasswordResetRateLimitResult> =>
  rateLimiter ? rateLimiter.check(input) : { status: "unavailable" };

export { isPasswordResetRateLimiterConfigured };
