import {
  isValidRecoveryEmail,
  normalizeRecoveryEmail,
} from "../utils/passwordRecovery";
import type {
  PasswordResetRateLimitInput,
  PasswordResetRateLimitResult,
  RequestHeaders,
} from "./passwordResetRateLimitCore";

type Request = {
  method?: string;
  body?: unknown;
  headers: RequestHeaders;
};

type Response = {
  status(code: number): Response;
  json(body: Record<string, unknown>): void;
};

export type PasswordResetRequestDependencies = {
  isEnabled(): boolean;
  resolveClientIp(headers: RequestHeaders): string | null;
  checkRateLimit(input: PasswordResetRateLimitInput): Promise<PasswordResetRateLimitResult>;
  sendResetEmail(email: string): Promise<unknown>;
  logFailure(event: "client_ip_unavailable" | "rate_limiter_unavailable" | "request_failed"): void;
};

const genericSuccess = (res: Response) => {
  res.status(200).json({ ok: true });
};
const temporaryUnavailable = (res: Response) => {
  res.status(503).json({ error: "La recuperación no está disponible temporalmente." });
};

export const createPasswordResetRequestHandler =
  (dependencies: PasswordResetRequestDependencies) =>
  async (req: Request, res: Response) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    if (!dependencies.isEnabled()) return temporaryUnavailable(res);

    const body =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : null;
    const email = normalizeRecoveryEmail(
      typeof body?.email === "string" ? body.email : "",
    );
    if (!isValidRecoveryEmail(email) || email.length > 254) {
      res.status(400).json({ error: "Ingresa un correo electrónico válido." });
      return;
    }

    const clientIp = dependencies.resolveClientIp(req.headers);
    if (!clientIp) {
      dependencies.logFailure("client_ip_unavailable");
      return temporaryUnavailable(res);
    }

    let rateLimit: PasswordResetRateLimitResult;
    try {
      rateLimit = await dependencies.checkRateLimit({
        normalizedEmail: email,
        clientIp,
      });
    } catch {
      dependencies.logFailure("rate_limiter_unavailable");
      return temporaryUnavailable(res);
    }

    if (rateLimit.status === "unavailable") {
      dependencies.logFailure("rate_limiter_unavailable");
      return temporaryUnavailable(res);
    }
    if (rateLimit.status === "limited") return genericSuccess(res);

    try {
      await dependencies.sendResetEmail(email);
    } catch {
      dependencies.logFailure("request_failed");
    }
    return genericSuccess(res);
  };
