import { useEffect, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { updateVerifiedRecoveryPin } from "@/utils/passwordRecoverySession";
import {
  classifyRecoveryError,
  isValidPin,
  recoveryErrorMessage,
  takePasswordRecoveryUrl,
} from "@/utils/passwordRecovery";
import { PIN_RECOVERY_ENABLED } from "@/utils/featureFlags";

type ResetPasswordProps = {
  enabled: boolean;
};

type RecoveryStatus =
  | "checking"
  | "disabled"
  | "missing"
  | "pending"
  | "verifying"
  | "verified"
  | "expired"
  | "used"
  | "invalid"
  | "temporary-error"
  | "saving"
  | "success";

export const getServerSideProps: GetServerSideProps<ResetPasswordProps> = async () => {
  const { isPasswordResetRequestConfigured } = await import(
    "@/server/passwordResetRateLimitConfig"
  );
  return {
    props: {
      enabled:
        PIN_RECOVERY_ENABLED &&
        process.env.PIN_RECOVERY_SERVER_ENABLED === "true" &&
        isPasswordResetRequestConfigured(),
    },
  };
};

export default function ResetPasswordPage({ enabled }: ResetPasswordProps) {
  const router = useRouter();
  const [recoveryClient] = useState(() => {
    const sessions = new Map<string, string>();
    const storage: SupportedStorage = {
      getItem: (key) => sessions.get(key) ?? null,
      setItem: (key, value) => {
        sessions.set(key, value);
      },
      removeItem: (key) => {
        sessions.delete(key);
      },
    };

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: false,
          storage,
          storageKey: "masushi-pin-recovery-session",
        },
      },
    );
  });
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [pendingTokenHash, setPendingTokenHash] = useState<string | null>(null);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const result = takePasswordRecoveryUrl();
    if (!enabled) {
      setStatus("disabled");
      return;
    }

    if (result.kind === "token") {
      setPendingTokenHash(result.tokenHash);
      setStatus("pending");
      return;
    }
    if (result.kind === "error") {
      setStatus(result.reason);
      return;
    }
    setStatus("missing");
  }, [enabled]);

  const verifyRecoveryLink = async () => {
    if (!pendingTokenHash || status === "verifying") return;
    setErrorMessage("");
    setStatus("verifying");

    const { data, error } = await recoveryClient.auth.verifyOtp({
      token_hash: pendingTokenHash,
      type: "recovery",
    });

    if (error) {
      const code = error.code;
      if (code) {
        setPendingTokenHash(null);
        setStatus(classifyRecoveryError(`${code} ${error.message}`));
      } else {
        setStatus("temporary-error");
        setErrorMessage("No pudimos verificar el enlace. Comprueba tu conexión e inténtalo nuevamente.");
      }
      return;
    }

    if (!data.user || !data.session || data.user.id !== data.session.user.id) {
      setPendingTokenHash(null);
      setStatus("invalid");
      return;
    }

    setPendingTokenHash(null);
    setVerifiedUserId(data.user.id);
    setStatus("verified");
  };

  const updatePin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!isValidPin(pin)) {
      setErrorMessage("El PIN debe tener exactamente 4 dígitos.");
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage("Los PIN no coinciden.");
      return;
    }
    if (!verifiedUserId) {
      setStatus("invalid");
      return;
    }

    setStatus("saving");
    const result = await updateVerifiedRecoveryPin(recoveryClient, verifiedUserId, pin);
    if (result === "invalid") {
      setErrorMessage("La sesión de recuperación terminó. Solicita un enlace nuevo.");
      setStatus("invalid");
      return;
    }

    if (result === "failed") {
      setErrorMessage("No pudimos actualizar el PIN. Solicita un enlace nuevo e inténtalo nuevamente.");
      setStatus("verified");
      return;
    }

    setVerifiedUserId(null);
    setStatus("success");
    const { error: signOutError } = await recoveryClient.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.error("[reset-password] could not clear the local recovery session");
    }
  };

  useEffect(() => {
    if (status !== "success") return;
    const timeout = window.setTimeout(() => {
      void router.replace("/login");
    }, 1800);
    return () => window.clearTimeout(timeout);
  }, [router, status]);

  const requestNewLink = (
    <button
      type="button"
      onClick={() => router.push("/forgot-password")}
      className="mt-4 text-sm text-[#93C021]"
    >
      Solicitar un enlace nuevo
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Seo title="Crear nuevo PIN — Masushi" canonicalPath="/reset-password" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-[#111111] p-6 text-center shadow">
          {status === "checking" ? (
            <p className="text-gray-300">Preparando recuperación...</p>
          ) : status === "disabled" ? (
            <>
              <h1 className="text-2xl font-bold">Recuperación no disponible</h1>
              <p className="mt-2 text-sm text-gray-400">Intenta nuevamente más tarde.</p>
            </>
          ) : status === "pending" || status === "verifying" || status === "temporary-error" ? (
            <>
              <h1 className="text-2xl font-bold">Verificar enlace</h1>
              <p className="mt-2 text-sm text-gray-400">Continúa para validar el enlace de recuperación.</p>
              {errorMessage && <p className="mt-3 text-sm text-red-400">{errorMessage}</p>}
              <button
                type="button"
                onClick={verifyRecoveryLink}
                disabled={!pendingTokenHash || status === "verifying"}
                className="mt-4 w-full rounded bg-[#D1933E] py-2 font-semibold disabled:opacity-60"
              >
                {status === "verifying" ? "Verificando..." : "Validar enlace"}
              </button>
            </>
          ) : status === "expired" || status === "used" || status === "invalid" || status === "missing" ? (
            <>
              <h1 className="text-2xl font-bold">No se pudo validar el enlace</h1>
              <p className="mt-2 text-sm text-gray-300">
                {status === "missing"
                  ? "El enlace no contiene una solicitud de recuperación válida."
                  : recoveryErrorMessage(status)}
              </p>
              {requestNewLink}
            </>
          ) : status === "success" ? (
            <>
              <h1 className="text-2xl font-bold">PIN actualizado</h1>
              <p className="mt-2 text-sm text-gray-300">Ya puedes iniciar sesión con tu nuevo PIN.</p>
              <button
                type="button"
                onClick={() => void router.replace("/login")}
                className="mt-4 w-full rounded bg-[#D1933E] py-2 font-semibold"
              >
                Ir a iniciar sesión
              </button>
            </>
          ) : (
            <form onSubmit={updatePin} className="space-y-4 text-left">
              <h1 className="text-center text-2xl font-bold">Crear nuevo PIN</h1>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                placeholder="Nuevo PIN de 4 dígitos"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded bg-[#1a1a1a] px-3 py-2 text-center tracking-widest"
              />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                placeholder="Repite el nuevo PIN"
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded bg-[#1a1a1a] px-3 py-2 text-center tracking-widest"
              />
              {errorMessage && <p className="text-center text-sm text-red-400">{errorMessage}</p>}
              <button
                type="submit"
                disabled={status === "saving"}
                className="w-full rounded bg-[#D1933E] py-2 font-semibold disabled:opacity-60"
              >
                {status === "saving" ? "Guardando..." : "Actualizar PIN"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
