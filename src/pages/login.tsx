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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // After sign-in redirect: if an intent was saved, go there; otherwise previous behavior
    try {
      const next = sessionStorage.getItem('post_auth_next');
      if (next) {
        sessionStorage.removeItem('post_auth_next');
        router.replace(next);
        return;
      }
    } catch {}

    // Fallback: go to main menu instead of admin
    router.replace("/menu");
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
            placeholder="PIN de 4 dígitos"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      <Footer />
    </div>
  );
}
