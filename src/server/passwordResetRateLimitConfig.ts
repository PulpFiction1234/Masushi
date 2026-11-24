import { loadPasswordResetRateLimitConfig } from "@/server/passwordResetRateLimitCore";
import { isPasswordRecoveryCallbackConfigured } from "@/utils/passwordRecovery";

export const isPasswordResetRateLimiterConfigured = () =>
  loadPasswordResetRateLimitConfig(process.env) !== null;

export const isPasswordResetRequestConfigured = () =>
  isPasswordResetRateLimiterConfigured() &&
  isPasswordRecoveryCallbackConfigured({
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    PIN_RECOVERY_SERVER_ENABLED: process.env.PIN_RECOVERY_SERVER_ENABLED,
    PIN_RECOVERY_PREVIEW_URL: process.env.PIN_RECOVERY_PREVIEW_URL,
    PIN_RECOVERY_PREVIEW_ALLOWED_HOST:
      process.env.PIN_RECOVERY_PREVIEW_ALLOWED_HOST,
  }) &&
  Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
