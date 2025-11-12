import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
// 👇 useSupabaseClient viene de *react*
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Seo from "@/components/Seo"; 


export default function LoginPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const redirectAfterAuth = () => {
    try {
      const next = sessionStorage.getItem('post_auth_next');
      if (next) {
        sessionStorage.removeItem('post_auth_next');
        router.replace(next);
        return;
      }
    } catch {}
    router.replace('/menu');
  };

  const triggerVerificationEmail = async () => {
    setResendMessage(null);
    if (!email.trim()) {
      setResendMessage('Ingresa tu correo para reenviar el código.');
      return;
    }

    setResending(true);
    try {
      const resp = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await resp.json().catch(() => null);

      if (resp.ok) {
        if (json?.method === 'custom') {
          setResendMessage('Código enviado desde nuestro respaldo. Revisa tu correo.');
        } else {
          setResendMessage('Código reenviado. Revisa tu correo.');
        }
        return;
      }

      if (resp.status === 429) {
        const retry = json?.retry_after;
        if (retry && Number.isFinite(retry)) {
          setResendMessage(`Por seguridad puedes volver a solicitar el código en ${retry} segundos.`);
        } else if (json?.message) {
          setResendMessage(json.message);
        } else {
          setResendMessage('Has solicitado el código muy seguido. Intenta más tarde.');
        }
        return;
      }

      setResendMessage(json?.error || 'No pudimos reenviar el código.');
    } catch (err) {
      setResendMessage('Error de conexión al reenviar el código.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerificationError(null);
    const raw = verificationCode.trim();
    if (!raw) {
      setVerificationError('Ingresa el código que llegó a tu correo.');
      return;
    }

    const formatted = raw.replace(/\s+/g, '');
    setVerifying(true);
    try {
      let verified = false;
      const otpResult = await supabase.auth.verifyOtp({
        email,
        token: formatted,
        type: 'signup',
      });

      if (!otpResult.error) {
        verified = true;
      } else {
        const resp = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: formatted }),
        });
        const json = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(json?.error || otpResult.error?.message || 'Código inválido o expirado');
        }
        verified = true;
      }

      if (!verified) {
        throw new Error('Código inválido o expirado');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }

      setShowVerificationModal(false);
      setVerificationCode('');
      setErrorMessage('');
      redirectAfterAuth();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error verificando el código';
      setVerificationError(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = (error.message || '').toLowerCase();
      if (message.includes('email not confirmed') || message.includes('not confirmed')) {
        setErrorMessage('Tu cuenta existe, pero el correo aún no ha sido verificado. Revisa tu email.');
        setShowVerificationModal(true);
        setVerificationCode('');
        setVerificationError(null);
        await triggerVerificationEmail();
        return;
      }

      setErrorMessage(error.message);
      return;
    }

    redirectAfterAuth();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Seo title="Iniciar sesión — Masushi" canonicalPath="/login" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow space-y-4"
        >
          <h1 className="text-2xl font-bold text-center">Iniciar sesión</h1>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN de 4 dígitos"
            value={password}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 4) {
                setPassword(value);
              }
            }}
            maxLength={4}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />
          {errorMessage && (
            <p className="text-red-400 text-sm text-center">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold"
          >
            Entrar
          </button>
          
          <div className="text-center text-sm text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-green-500 hover:text-green-400">
              Regístrate aquí
            </Link>
          </div>
        </form>
      </main>
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowVerificationModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gray-900/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">Verificación</p>
                <h3 className="mt-2 text-xl font-semibold">Confirma tu correo</h3>
                <p className="mt-1 text-xs text-gray-400">Ingresa el código que enviamos a {email}.</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setShowVerificationModal(false)}
                className="rounded-full border border-white/10 px-2 py-1 text-xs text-gray-300 hover:border-white/40 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9\s]/g, ''))}
                placeholder="Código de 6 dígitos"
                className="w-full rounded-xl border border-white/10 bg-gray-800 px-3 py-2 text-center text-lg tracking-[0.4em] text-white"
              />

              <div className="flex flex-col gap-2 text-xs text-gray-400">
                <button
                  type="button"
                  onClick={triggerVerificationEmail}
                  disabled={resending}
                  className="self-start rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-200 hover:border-white/40 hover:text-white disabled:opacity-60"
                >
                  {resending ? 'Enviando…' : 'Reenviar código'}
                </button>
                {resendMessage && <span className="text-gray-300">{resendMessage}</span>}
              </div>

              {verificationError && (
                <p className="text-sm text-red-400">{verificationError}</p>
              )}

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying}
                className="w-full rounded-full bg-red-500 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {verifying ? 'Verificando…' : 'Confirmar y entrar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
