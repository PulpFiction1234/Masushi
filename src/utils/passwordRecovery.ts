export type RecoveryErrorReason = "expired" | "used" | "invalid";

export type RecoveryLinkResult =
  | { kind: "token"; tokenHash: string }
  | { kind: "error"; reason: RecoveryErrorReason }
  | { kind: "missing" };

const PRODUCTION_RECOVERY_URL = "https://www.masushi.cl/reset-password";

export type PasswordRecoveryRedirectEnvironment = {
  VERCEL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
  PIN_RECOVERY_SERVER_ENABLED?: string;
  PIN_RECOVERY_PREVIEW_URL?: string;
  PIN_RECOVERY_PREVIEW_ALLOWED_HOST?: string;
};

const isProductionHostname = (hostname: string) =>
  hostname === "masushi.cl" || hostname.endsWith(".masushi.cl");

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const parseExactHostname = (value?: string): string | null => {
  if (!value || value.trim() !== value) return null;

  let url: URL;
  try {
    url = new URL(`https://${value}`);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    hostname.endsWith(".") ||
    hostname !== value.toLowerCase() ||
    !HOSTNAME_PATTERN.test(hostname) ||
    /^\d+(?:\.\d+){3}$/.test(hostname) ||
    hostname === "localhost"
  ) {
    return null;
  }

  return hostname;
};

const getPasswordRecoveryCallbackUrl = (
  env: PasswordRecoveryRedirectEnvironment,
): string | null => {
  if (
    env.VERCEL !== "1" ||
    env.PIN_RECOVERY_SERVER_ENABLED !== "true"
  ) {
    return null;
  }

  if (env.VERCEL_ENV === "production") return PRODUCTION_RECOVERY_URL;
  if (
    env.VERCEL_ENV !== "preview" ||
    !env.PIN_RECOVERY_PREVIEW_URL
  ) {
    return null;
  }

  const allowedHostname = parseExactHostname(
    env.PIN_RECOVERY_PREVIEW_ALLOWED_HOST,
  );
  const deploymentHostname = parseExactHostname(env.VERCEL_URL);
  if (
    !allowedHostname ||
    !deploymentHostname ||
    allowedHostname !== deploymentHostname
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(env.PIN_RECOVERY_PREVIEW_URL);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/reset-password" ||
    url.search ||
    url.hash ||
    isProductionHostname(hostname) ||
    hostname !== allowedHostname
  ) {
    return null;
  }

  return url.toString();
};

export const isPasswordRecoveryCallbackConfigured = (
  env: PasswordRecoveryRedirectEnvironment,
) => getPasswordRecoveryCallbackUrl(env) !== null;

export const resolvePasswordRecoveryCallbackUrl = (
  env: PasswordRecoveryRedirectEnvironment,
) => {
  const callbackUrl = getPasswordRecoveryCallbackUrl(env);
  if (!callbackUrl) {
    throw new Error("Password recovery callback is not configured for this deployment");
  }
  return callbackUrl;
};

export const classifyRecoveryError = (value: string): RecoveryErrorReason => {
  const normalized = value.toLowerCase();
  if (normalized.includes("expired") || normalized.includes("otp_expired")) return "expired";
  if (normalized.includes("reuse") || normalized.includes("used")) return "used";
  return "invalid";
};

export const buildPasswordRecoveryUrl = (
  tokenHash: string,
  env: PasswordRecoveryRedirectEnvironment,
) => {
  const url = new URL(resolvePasswordRecoveryCallbackUrl(env));
  url.hash = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
  }).toString();
  return url.toString();
};

export const parsePasswordRecoveryUrl = (url: URL): RecoveryLinkResult => {
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  const params = [url.searchParams, fragment];

  for (const searchParams of params) {
    const error = searchParams.get("error_code") || searchParams.get("error");
    if (error || searchParams.has("error_description")) {
      return {
        kind: "error",
        reason: classifyRecoveryError(
          `${error || ""} ${searchParams.get("error_description") || ""}`,
        ),
      };
    }
  }

  const tokenHash = fragment.get("token_hash");
  if (!tokenHash) return { kind: "missing" };
  if (fragment.get("type") !== "recovery") {
    return { kind: "error", reason: "invalid" };
  }

  return { kind: "token", tokenHash };
};

let pendingRecoveryLink: RecoveryLinkResult | null = null;

export const capturePasswordRecoveryUrl = (browser: {
  location: Pick<Location, "href">;
  history: Pick<History, "state" | "replaceState">;
}) => {
  const url = new URL(browser.location.href);
  if (url.pathname !== "/reset-password") {
    pendingRecoveryLink = null;
    return;
  }
  if (!url.search && !url.hash) return;

  const link = parsePasswordRecoveryUrl(url);
  browser.history.replaceState(browser.history.state, "", url.pathname);
  pendingRecoveryLink = link;
};

export const takePasswordRecoveryUrl = (): RecoveryLinkResult => {
  const link = pendingRecoveryLink;
  pendingRecoveryLink = null;
  return link ?? { kind: "missing" };
};

export const recoveryErrorMessage = (
  reason: RecoveryErrorReason,
) => {
  if (reason === "expired") return "El enlace expiró. Solicita uno nuevo.";
  if (reason === "used") return "El enlace ya fue utilizado. Solicita uno nuevo.";
  return "El enlace no es válido. Solicita uno nuevo.";
};

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export const normalizeRecoveryEmail = (email: string) =>
  email.trim().toLowerCase();

export const isValidRecoveryEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
