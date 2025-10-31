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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMessage("Por favor completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Utilizamos metadata para guardar nombre y teléfono en el usuario
      // Implementar reintentos para manejar 429 (Too Many Requests) en entornos de dev
      const maxAttempts = 3;
      let attempt = 0;
      let data: any = null;
      let error: any = null;
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      while (attempt < maxAttempts) {
        attempt++;
        const resp = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone } },
        });
        data = resp.data;
        error = resp.error;
        if (!error) break;
        const msg = String(error?.message || '');
        // si es 429 o indica rate limit, reintentar con backoff
        if (msg.toLowerCase().includes('too many') || (error?.status === 429)) {
          const backoff = 500 * Math.pow(2, attempt - 1);
          console.warn(`signUp attempt ${attempt} failed with rate limit, retrying in ${backoff}ms`);
          await sleep(backoff);
          continue;
        }
        // otro error -> no reintentar
        break;
      }

      if (error) {
        setErrorMessage(error.message || String(error));
        setLoading(false);
        return;
      }

      // Si se requiere confirmación por email, abrir modal para código
      setSuccessMessage("Cuenta creada. Revisa tu email para el código de verificación.");
      setLoading(false);

      // capture user id if available and request server to send verification code
      try {
        const createdId = (data as any)?.user?.id || (data as any)?.user_id || null;
        if (createdId) setCreatedUserId(createdId);

        await fetch('/api/auth/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId: createdId }),
        });
      } catch (e) {
        console.error('Error requesting verification code', e);
      }

      setShowVerificationModal(true);
    } catch (err: unknown) {
      const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message ?? '') : String(err);
      setErrorMessage(msg);
      setLoading(false);
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
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="tel"
            placeholder="Teléfono (ej. +521XXXXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400"
          />

          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-neutral-900">
            <h3 className="text-lg font-bold mb-2">Código de verificación</h3>
            <p className="text-sm text-neutral-600 mb-4">Revisa tu correo y escribe el código que te enviamos.</p>
            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Código (ej.: 123456)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowVerificationModal(false); }} className="px-4 py-2 rounded bg-gray-200">Cerrar</button>
              <button
                onClick={async () => {
                  if (!verificationCode.trim()) return alert('Ingresa el código');
                  setVerifying(true);
                    try {
                    const resp = await fetch('/api/auth/verify-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, userId: createdUserId, code: verificationCode.trim() }),
                    });
                    const json = await resp.json().catch(() => null);
                    if (resp.ok) {
                      setShowVerificationModal(false);
                      setSuccessMessage('Correo verificado. Serás redirigido.');
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
                    } else {
                      alert(json?.error || 'Código inválido');
                    }
                  } catch (e) {
                    console.error('verify error', e);
                    alert('Error verificando el código');
                  } finally {
                    setVerifying(false);
                  }
                }}
                className="px-4 py-2 rounded bg-green-600 text-white"
                disabled={verifying}
              >{verifying ? 'Verificando...' : 'Verificar'}</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
