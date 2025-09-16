import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/supabase-js";

type AdminMode = "normal" | "forceClosed" | "forceOpen";

export default function AdminPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [mode, setMode] = useState<AdminMode>("normal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/mode", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMode(d.mode as AdminMode))
      .catch(() => setMode("normal"))
      .finally(() => setLoading(false));
  }, []);

  const applyMode = async (next: AdminMode) => {
    const prev = mode;
    setMode(next);
    try {
      const r = await fetch("/api/admin/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      if (!r.ok) throw new Error("Request failed");
      const data = await r.json();
      setMode(data.mode as AdminMode);
    } catch (e) {
      console.error(e);
      alert("Error actualizando el estado");
      setMode(prev);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      alert("Error cerrando sesión");
      return;
    }
    router.push("/login");
  };

  const badge =
    mode === "forceOpen" ? "FORZADO ABIERTO"
    : mode === "forceClosed" ? "FORZADO CERRADO"
    : "NORMAL (según horario)";

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-xl shadow space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Panel de pedidos</h1>
            <button
              onClick={logout}
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition-colors font-semibold"
            >
              Cerrar sesión
            </button>
          </div>

          <p className="text-sm text-gray-300">
            Modo actual: <span className="font-semibold">{badge}</span>
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              disabled={loading}
              onClick={() => applyMode("normal")}
              className={`px-4 py-3 rounded font-semibold border ${
                mode === "normal"
                  ? "bg-emerald-600 border-emerald-500"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }`}
            >
              Normal
              <div className="text-xs text-gray-200 font-normal">Respeta horario</div>
            </button>

            <button
              disabled={loading}
              onClick={() => applyMode("forceOpen")}
              className={`px-4 py-3 rounded font-semibold border ${
                mode === "forceOpen"
                  ? "bg-green-700 border-green-600"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }`}
            >
              Forzar ABIERTO
              <div className="text-xs text-gray-200 font-normal">Solo hoy</div>
            </button>

            <button
              disabled={loading}
              onClick={() => applyMode("forceClosed")}
              className={`px-4 py-3 rounded font-semibold border ${
                mode === "forceClosed"
                  ? "bg-rose-700 border-rose-600"
                  : "bg-gray-800 border-gray-700 hover:bg-gray-700"
              }`}
            >
              Forzar CERRADO
              <div className="text-xs text-gray-200 font-normal">Solo hoy</div>
            </button>
          </div>

          <p className="text-xs text-gray-400">
            * Los modos “Forzar” se limpian automáticamente al cambiar el día en America/Santiago.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

type AdminPageProps = { initialSession: Session | null };

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  return { props: { initialSession: session } };
};
