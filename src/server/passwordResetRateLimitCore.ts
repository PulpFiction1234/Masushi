import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export type PasswordResetRateLimitResult =
  | { status: "allowed" }
  | { status: "limited"; retryAfterSeconds: number }
  | { status: "unavailable" };

export type PasswordResetRateLimitInput = {
  normalizedEmail: string;
  clientIp: string | null;
};

export type PasswordResetRateLimitConfig = {
  hmacSecret: string;
  emailLimit: number;
  ipLimit: number;
  windowSeconds: number;
};

export type RateLimitRpcParams = {
  p_email_hash: string;
  p_ip_hash: string;
  p_email_limit: number;
  p_ip_limit: number;
  p_window_seconds: number;
};

type RpcResult = {
  data: unknown;
  error: unknown;
};

export type RateLimitRpc = (params: RateLimitRpcParams) => Promise<RpcResult>;

export type PasswordResetRateLimiter = {
  check(input: PasswordResetRateLimitInput): Promise<PasswordResetRateLimitResult>;
};

export type TrustedIpEnvironment = {
  VERCEL?: string;
  PIN_RECOVERY_TRUST_VERCEL_IP?: string;
};

export type RequestHeaders = Record<string, string | string[] | undefined>;

const EMAIL_LIMIT_KEY = "PASSWORD_RESET_EMAIL_LIMIT";
const IP_LIMIT_KEY = "PASSWORD_RESET_IP_LIMIT";
const WINDOW_SECONDS_KEY = "PASSWORD_RESET_RATE_WINDOW_SECONDS";
const HMAC_SECRET_KEY = "PASSWORD_RESET_RATE_LIMIT_HMAC_SECRET";

const parsePositiveInteger = (
  value: string | undefined,
  maximum: number,
): number | null => {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
};

export const loadPasswordResetRateLimitConfig = (
  env: Record<string, string | undefined>,
): PasswordResetRateLimitConfig | null => {
  const secret = env[HMAC_SECRET_KEY];
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) return null;

  const emailLimit = parsePositiveInteger(env[EMAIL_LIMIT_KEY], 100);
  const ipLimit = parsePositiveInteger(env[IP_LIMIT_KEY], 10000);
  const windowSeconds = parsePositiveInteger(env[WINDOW_SECONDS_KEY], 86400);
  if (!emailLimit || !ipLimit || !windowSeconds || windowSeconds < 60) return null;

  if (env.VERCEL !== "1" || env.PIN_RECOVERY_TRUST_VERCEL_IP !== "true") {
    return null;
  }

  return { hmacSecret: secret, emailLimit, ipLimit, windowSeconds };
};

const canonicalizeIp = (value: string): string | null => {
  const trimmed = value.trim();
  const version = isIP(trimmed);
  if (version === 4) return trimmed;
  if (version !== 6) return null;

  try {
    return new URL(`http://[${trimmed}]/`).hostname.slice(1, -1).toLowerCase();
  } catch {
    return null;
  }
};

export const resolveTrustedVercelClientIp = (
  headers: RequestHeaders,
  env: TrustedIpEnvironment,
): string | null => {
  if (env.VERCEL !== "1" || env.PIN_RECOVERY_TRUST_VERCEL_IP !== "true") return null;

  const header = headers["x-real-ip"];
  if (typeof header !== "string") return null;
  return canonicalizeIp(header);
};

const createIdentifierHash = (
  secret: string,
  kind: "email" | "ip",
  identifier: string,
) =>
  createHmac("sha256", secret)
    .update(`masushi-password-recovery:${kind}:`, "utf8")
    .update(identifier, "utf8")
    .digest("hex");

const parseRpcDecision = (
  data: unknown,
): Exclude<PasswordResetRateLimitResult, { status: "unavailable" }> | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const result = data as Record<string, unknown>;
  if (result.allowed === true) return { status: "allowed" };
  if (result.allowed !== false) return null;

  const retryAfterSeconds = result.retry_after_seconds;
  if (
    typeof retryAfterSeconds !== "number" ||
    !Number.isSafeInteger(retryAfterSeconds) ||
    retryAfterSeconds < 1
  ) {
    return null;
  }

  return { status: "limited", retryAfterSeconds };
};

export const createPasswordResetRateLimiter = (
  config: PasswordResetRateLimitConfig,
  rpc: RateLimitRpc,
): PasswordResetRateLimiter => ({
  async check(input) {
    if (!input.clientIp || !input.normalizedEmail) return { status: "unavailable" };

    const normalizedEmail = input.normalizedEmail.trim().toLowerCase();
    const canonicalIp = canonicalizeIp(input.clientIp);
    if (!normalizedEmail || !canonicalIp) {
      return { status: "unavailable" };
    }

    try {
      const { data, error } = await rpc({
        p_email_hash: createIdentifierHash(config.hmacSecret, "email", normalizedEmail),
        p_ip_hash: createIdentifierHash(
          config.hmacSecret,
          "ip",
          canonicalIp,
        ),
        p_email_limit: config.emailLimit,
        p_ip_limit: config.ipLimit,
        p_window_seconds: config.windowSeconds,
      });

      if (error) return { status: "unavailable" };
      return parseRpcDecision(data) ?? { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  },
});
