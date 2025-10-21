import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/context/UserContext";
import type { Session } from "@supabase/supabase-js";
import Seo from "@/components/Seo";
import { productos, Producto } from "@/data/productos";
import AdminDashboard from '@/components/admin/AdminDashboard';

type AdminMode = "normal" | "forceClosed" | "forceOpen";

export default function AdminPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { profile, loading: profileLoading } = useUserProfile();
  const [mode, setMode] = useState<AdminMode>("normal");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Verificar autenticación y rol de admin
  useEffect(() => {
    const checkAuthAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si no hay sesión, redirigir a login
      if (!session) {
        router.push("/login?redirect=/admin");
        return;
      }

      setAuthChecked(true);

      // Esperar a que el perfil esté cargado
      if (!profileLoading && profile) {
        // Si no es admin, redirigir a home
        if (profile.role !== 'admin') {
          alert("No tienes permisos para acceder a esta página");
          router.push("/");
          return;
        }

        // Usuario autorizado
        setAuthorized(true);
      }
    };

    checkAuthAndRole();
  }, [supabase, profile, profileLoading, router]);

  useEffect(() => {
    // Solo cargar el modo si está autorizado
    if (authorized) {
      fetch("/api/admin/mode", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setMode(d.mode as AdminMode))
        .catch(() => setMode("normal"))
        .finally(() => setLoading(false));
    }
  }, [authorized]);

  // When authorized, redirect to the admin products page (keep auth checks above)
  useEffect(() => {
    if (authorized) {
      router.replace('/admin/products');
    }
  }, [authorized, router]);

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

  // local editable copy of products (client-side only)
  const [localProducts, setLocalProducts] = useState<Producto[]>(() =>
    productos.map((p) => ({ ...p, enabled: p.enabled ?? true }))
  );

  const toggleEnabled = (codigo: string) => {
    // functional update to capture previous state safely
    setLocalProducts((prev) => {
      const prevItem = prev.find((x) => x.codigo === codigo);
      const oldEnabled = prevItem ? !!prevItem.enabled : true;
      const newProducts = prev.map((p) => (p.codigo === codigo ? { ...p, enabled: !p.enabled } : p));
      const newEnabled = !oldEnabled;

      // persist in background; on failure revert
      (async () => {
        try {
          const r = await fetch('/api/admin/product-overrides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, enabled: newEnabled }),
          });
          if (!r.ok) throw new Error('Failed to persist');
          // broadcast to other tabs and in-page listeners to clear client caches
          try {
            // update local map cache (merge) so clients can read instantly
            try {
              const raw = localStorage.getItem('product-overrides-map');
              const parsed = raw ? JSON.parse(raw) as Record<string, boolean> : {};
              parsed[codigo] = newEnabled;
              localStorage.setItem('product-overrides-map', JSON.stringify(parsed));
            } catch {}

            localStorage.setItem('product-overrides-updated', String(Date.now()));
            window.dispatchEvent(new Event('product-overrides-changed'));
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.error('Persist override failed', e);
          // revert optimistic update
          setLocalProducts((cur) => cur.map((p) => (p.codigo === codigo ? { ...p, enabled: oldEnabled } : p)));
          alert('Error guardando cambio en el servidor');
        }
      })();

      return newProducts;
    });
  };

  // When authorized, load persisted overrides and merge into localProducts
  useEffect(() => {
    if (!authorized) return;
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/product-overrides');
        if (!r.ok) return;
        const json = await r.json();
        const map = new Map<string, boolean>();
        (json.overrides || json.data || []).forEach((o: any) => {
          if (o && o.codigo) map.set(o.codigo, !!o.enabled);
        });
        if (!mounted) return;
        setLocalProducts(productos.map((p) => ({ ...p, enabled: map.has(p.codigo) ? (map.get(p.codigo) as boolean) : (p.enabled ?? true) })));
      } catch (e) {
        // noop
      }
    })();
    return () => { mounted = false; };
  }, [authorized]);

  // Mostrar pantalla de carga mientras verifica permisos
  if (!authChecked || profileLoading || !authorized) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950 text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {!authChecked ? "Verificando sesión..." : "Verificando permisos..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div />;
}

type AdminPageProps = { initialSession: Session | null };

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  return { props: { initialSession: session } };
};
