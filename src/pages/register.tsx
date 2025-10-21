import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

  // Estados para verificación por código
  const [step, setStep] = useState<"register" | "verify">("register");
  const [verificationCode, setVerificationCode] = useState("");

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
      // Registrar usuario con verificación por email habilitada
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: `${window.location.origin}/menu`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Verificar si Supabase requiere confirmación de email
      if (data.user && !data.session) {
        // Email de confirmación enviado, mostrar paso de verificación
        setSuccessMessage(
          `Se ha enviado un código de verificación a ${email}. Por favor revisa tu bandeja de entrada.`
        );
        setStep("verify");
      } else {
        // Confirmación no requerida, redirigir directamente
        setSuccessMessage("Cuenta creada exitosamente.");
        setTimeout(() => router.push("/menu"), 2000);
      }

      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!verificationCode.trim()) {
      setErrorMessage("Por favor ingresa el código de verificación.");
      return;
    }

    setLoading(true);

    try {
      // Verificar el código OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: "signup",
      });

      if (error) {
        setErrorMessage("Código inválido o expirado. Por favor intenta nuevamente.");
        setLoading(false);
        return;
      }

      if (data.session) {
        setSuccessMessage("¡Email verificado! Redirigiendo...");
        setTimeout(() => router.push("/menu"), 2000);
      }

      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setErrorMessage("Error al reenviar el código. Por favor intenta más tarde.");
      } else {
        setSuccessMessage("Código reenviado. Revisa tu email.");
      }

      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message ?? String(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Seo title="Registrarse — Masushi" canonicalPath="/register" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        {step === "register" ? (
          // Formulario de registro
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
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-green-500 hover:text-green-400">
                Inicia sesión aquí
              </a>
            </div>
          </form>
        ) : (
          // Formulario de verificación
          <form
            onSubmit={handleVerification}
            className="w-full max-w-sm bg-gray-900 p-6 rounded-xl shadow space-y-4"
          >
            <h1 className="text-2xl font-bold text-center">Verifica tu email</h1>
            
            <p className="text-sm text-gray-400 text-center">
              Hemos enviado un código de 6 dígitos a <span className="text-white font-semibold">{email}</span>
            </p>

            <input
              type="text"
              placeholder="Código de verificación (6 dígitos)"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 rounded bg-gray-800 placeholder-gray-400 text-center text-2xl tracking-widest"
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
              {loading ? "Verificando..." : "Verificar código"}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-green-500 hover:text-green-400 disabled:opacity-60"
              >
                Reenviar código
              </button>
              
              <div className="text-sm text-gray-400">
                ¿Email incorrecto?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("register");
                    setVerificationCode("");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-green-500 hover:text-green-400"
                >
                  Volver atrás
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
