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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Si se requiere confirmación por email, indicarlo.
      setSuccessMessage(
        "Cuenta creada exitosamente. Puedes iniciar sesión ahora."
      );
      setLoading(false);

      // Redirigir al menú después de unos segundos
      setTimeout(() => router.push("/menu"), 2000);
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
      </main>
      <Footer />
    </div>
  );
}
