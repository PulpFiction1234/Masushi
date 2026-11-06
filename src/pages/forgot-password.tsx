import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const PRODUCTION_SITE_URL = "https://www.masushi.cl";

const getRecoveryRedirect = () => {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    return `${PRODUCTION_SITE_URL}/reset-password`;
  }
  if (configured && configured !== "http://localhost:3000") {
    return `${configured}/reset-password`;
  }
  return `${window.location.origin}/reset-password`;
};

export default function ForgotPasswordPage() {
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage("Ingresa tu correo electrónico.");
      return;
    }

    setSubmitting(true);
    try {
      const redirectTo = getRecoveryRedirect();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) throw error;
      setMessage("Si el correo está registrado, recibirás un enlace para crear un nuevo PIN.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No pudimos enviar el correo de recuperación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Seo title="Recuperar contraseña — Masushi" canonicalPath="/forgot-password" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-[#111111] p-6 shadow">
          <div>
            <h1 className="text-center text-2xl font-bold">Recuperar PIN</h1>
            <p className="mt-2 text-center text-sm text-gray-400">Te enviaremos un enlace seguro a tu correo.</p>
          </div>
          <input type="email" required autoComplete="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded bg-[#1a1a1a] px-3 py-2 placeholder-gray-400" />
          {errorMessage && <p className="text-center text-sm text-red-400">{errorMessage}</p>}
          {message && <p className="text-center text-sm text-[#93C021]">{message}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded bg-[#D1933E] py-2 font-semibold transition-colors hover:bg-[#b87a32] disabled:opacity-60">{submitting ? "Enviando..." : "Enviar enlace"}</button>
          <div className="text-center text-sm"><Link href="/login" className="text-[#93C021]">Volver a iniciar sesión</Link></div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
