import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/supabase-js"; // ⬅️ solo tipo

export default function AdminPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/closed", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setClosed(d.forceClosed))
      .catch(() => setClosed(false));
  }, []);

  const toggle = async () => {
    const prev = closed;
    const next = !closed;
    setClosed(next);
    try {
      const response = await fetch("/api/admin/closed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceClosed: next }),
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setClosed(data.forceClosed);
    } catch (err) {
      console.error(err);
      alert("Error actualizando el estado");
      setClosed(prev);
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
          <p>Estado actual: {closed ? "CERRADO" : "ABIERTO"}</p>
          <button
            onClick={toggle}
            className={`px-4 py-2 rounded font-semibold text-white ${
              closed ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {closed ? "Abrir pedidos" : "Cerrar pedidos"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ⬇️ Tipamos las props de la página para evitar "any"
type AdminPageProps = { initialSession: Session | null };

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { initialSession: session } };
};
