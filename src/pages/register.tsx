import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from 'next/link';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Seo from "@/components/Seo";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [name, setName] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

  const handleResendCode = async () => {
    setResendMessage(null);
    if (!email) {
      setResendMessage('No se encontró el correo del registro.');
      return;
    }

    setResending(true);
    try {
      const resp = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId: createdUserId }),
      });
      const json = await resp.json().catch(() => null);

      if (resp.ok) {
        if (json?.method === 'custom') {
          setResendMessage('Código reenviado desde nuestro respaldo. Revisa tu correo.');
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
          setResendMessage('Has solicitado el código muy seguido. Intenta de nuevo más tarde.');
        }
        return;
      }

      setResendMessage(json?.error || 'No se pudo reenviar el código');
    } catch (err) {
      setResendMessage('Error de conexión al reenviar el código');
    } finally {
      setResending(false);
    }
  };

  const triggerWelcomeEmail = async (targetEmail: string, targetUserId: string | null) => {
    if (!targetEmail || welcomeEmailSent) return;
    try {
      const resp = await fetch('/api/auth/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, userId: targetUserId }),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => null);
        console.warn('send-welcome returned non-OK', resp.status, json);
        return;
      }
      setWelcomeEmailSent(true);
      console.log('send-welcome triggered successfully');
    } catch (e) {
      console.warn('Could not trigger welcome email after verification', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !apellidoPaterno.trim() || !apellidoMaterno.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage("Por favor completa todos los campos.");
      return;
    }

    if (phone.length !== 8) {
      setErrorMessage("El teléfono debe tener exactamente 8 dígitos.");
      return;
    }

    if (password.length !== 4) {
      setErrorMessage("El pin debe tener exactamente 4 dígitos.");
      return;
    }

    setLoading(true);

    try {
      // Agregar prefijo +56 9 al teléfono
      const fullPhone = phone.trim() ? `+569${phone.trim()}` : '';
      
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          apellidoPaterno, 
          apellidoMaterno, 
          phone: fullPhone 
        }),
      });
      const json = await resp.json().catch(() => null);

      if (!resp.ok) {
        setErrorMessage(json?.error || 'No pudimos crear tu cuenta');
        setLoading(false);
        return;
      }

      const createdId = json?.userId || null;
      if (createdId) setCreatedUserId(createdId);

      const verificationInfo = json?.verification;
      if (verificationInfo?.method === 'custom') {
        setResendMessage('Código enviado desde nuestro respaldo. Revisa tu correo.');
      } else if (verificationInfo?.method === 'supabase') {
        setResendMessage('Código enviado. Revisa tu correo.');
      } else {
        setResendMessage(null);
      }

      setWelcomeEmailSent(false);
      setSuccessMessage("Cuenta creada. Revisa tu email para el código de verificación.");
      setLoading(false);
      setShowVerificationModal(true);
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? '') : String(err);
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleVerifyCodeClick = async () => {
    if (!email) {
      alert('No se encontró el correo del registro. Vuelve a intentarlo.');
      return;
    }

    const rawCode = verificationCode.trim();
    if (!rawCode) {
      alert('Ingresa el código');
      return;
    }

    const normalizedCode = rawCode.replace(/\s+/g, '');

    setVerifying(true);
    try {
      let verificationMethod: 'supabase' | 'custom' | null = null;
      let verificationUserId: string | null = createdUserId;
      let lastErrorMessage: string | undefined;

      const otpResult = await supabase.auth.verifyOtp({
        email,
        token: normalizedCode,
        type: 'signup',
      });

      if (!otpResult.error) {
        verificationMethod = 'supabase';
        verificationUserId = otpResult.data?.user?.id || createdUserId;

        if (!otpResult.data?.session && password) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            console.warn('Auto sign-in after verifyOtp failed', signInError);
          }
        }
      } else {
        lastErrorMessage = otpResult.error.message || 'Código inválido o expirado';
        console.warn('Supabase verifyOtp failed, trying custom verification', otpResult.error);
      }

      if (!verificationMethod) {
        try {
          const resp = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, userId: createdUserId, code: normalizedCode }),
          });
          const json = await resp.json().catch(() => null);
          if (!resp.ok) {
            throw new Error(json?.error || lastErrorMessage || 'Código inválido o expirado');
          }
          verificationMethod = 'custom';
          verificationUserId = json?.userId || verificationUserId || createdUserId;

          if (password) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
              console.warn('Auto sign-in after custom verification failed', signInError);
            }
          }
        } catch (customErr) {
          lastErrorMessage = customErr instanceof Error ? customErr.message : String(customErr);
          throw new Error(lastErrorMessage);
        }
      }

      if (!verificationMethod) {
        throw new Error(lastErrorMessage || 'Código inválido');
      }

      try {
        if (verificationUserId) {
          const fullName = `${name.trim()} ${apellidoPaterno.trim()} ${apellidoMaterno.trim()}`;
          const fullPhone = phone.trim() ? `+569${phone.trim()}` : '';

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: verificationUserId,
              full_name: fullName,
              apellido_paterno: apellidoPaterno.trim(),
              apellido_materno: apellidoMaterno.trim(),
              phone: fullPhone,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
      } catch (profileErr) {
        console.error('Error in profile creation:', profileErr);
      }

      setShowVerificationModal(false);
      setSuccessMessage('Correo verificado. Serás redirigido.');

      await triggerWelcomeEmail(email, verificationUserId);

      setTimeout(() => {
        try {
          const next = sessionStorage.getItem('post_auth_next');
          if (next) {
            sessionStorage.removeItem('post_auth_next');
            router.push(next);
            return;
          }
        } catch {}
        router.push('/menu');
      }, 1200);
    } catch (err) {
      console.error('verify error', err);
      const message = err instanceof Error ? err.message : 'Error verificando el código';
      alert(message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Seo title="Registrarse — Masushi" canonicalPath="/register" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow space-y-4"
        >
          <h1 className="text-2xl font-bold text-center">Crear cuenta</h1>

          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="text"
            placeholder="Apellido paterno"
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="text"
            placeholder="Apellido materno"
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-medium pointer-events-none">
              +56 9
            </div>
            <input
              type="tel"
              placeholder="XXXX XXXX"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 8) {
                  setPhone(value);
                }
              }}
              className="w-full pl-[70px] pr-3 py-2 rounded bg-gray-800 placeholder-gray-400"
            />
          </div>

          <input
            type="password"
            inputMode="numeric"
            placeholder="Pin (4 dígitos)"
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

          {successMessage && (
            <p className="text-green-400 text-sm text-center">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
          
          <div className="text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-500 hover:text-green-400">
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </main>
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-neutral-900">
            <h3 className="text-lg font-bold mb-2">Código de verificación</h3>
            <p className="text-sm text-neutral-600 mb-4">Revisa tu correo y escribe el código que te enviamos.</p>
            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Código (ej.: 123456)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4"
            />
            {resendMessage && (
              <p className={`text-sm mb-3 ${resendMessage.includes('Código enviado') || resendMessage.includes('Código reenviado') ? 'text-green-600' : 'text-red-600'}`}>{resendMessage}</p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleVerifyCodeClick}
                className="w-full px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-60"
                disabled={verifying}
              >{verifying ? 'Verificando...' : 'Verificar código'}</button>
              <button
                type="button"
                onClick={handleResendCode}
                className="w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
                disabled={resending}
              >{resending ? 'Reenviando...' : 'Reenviar código'}</button>
              <button
                type="button"
                onClick={() => { setShowVerificationModal(false); }}
                className="w-full px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-neutral-900 font-medium transition-colors"
              >Cerrar</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
