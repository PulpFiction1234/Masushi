import type { NextApiRequest, NextApiResponse } from "next";
import { resolveTrustedVercelClientIp } from "@/server/passwordResetRateLimitCore";
import { isPasswordResetRequestConfigured } from "@/server/passwordResetRateLimitConfig";
import { createPasswordResetRequestHandler } from "@/server/passwordResetRequest";
import { PIN_RECOVERY_ENABLED } from "@/utils/featureFlags";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1kb",
    },
  },
};

const requestPasswordReset = createPasswordResetRequestHandler({
  isEnabled: () =>
    PIN_RECOVERY_ENABLED &&
    process.env.PIN_RECOVERY_SERVER_ENABLED === "true" &&
    isPasswordResetRequestConfigured(),
  resolveClientIp: (headers) =>
    resolveTrustedVercelClientIp(headers, {
      VERCEL: process.env.VERCEL,
      PIN_RECOVERY_TRUST_VERCEL_IP: process.env.PIN_RECOVERY_TRUST_VERCEL_IP,
    }),
  checkRateLimit: async (input) => {
    const { checkPasswordResetRateLimit } = await import(
      "@/server/passwordResetRateLimit"
    );
    return checkPasswordResetRateLimit(input);
  },
  sendResetEmail: async (email) => {
    const { default: createAndSendPasswordReset } = await import(
      "@/server/passwordReset"
    );
    return createAndSendPasswordReset(email);
  },
  logFailure: (event) => {
    console.error(`[request-password-reset] ${event}`);
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return requestPasswordReset(req, res);
}
