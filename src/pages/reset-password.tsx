import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { ensureSupabasePassword } from "@/utils/strings";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const initializeRecovery = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (error) throw error;
          }
        }

        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
        const { data } = await supabase.auth.getSession();
        if (active) setReady(Boolean(data.session));
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "El enlace de recuperación no es válido o expiró.");
        }
      } finally {
        if (active) setChecking(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === "PASSWORD_RECOVERY" || session)) setReady(Boolean(session));
    });

    void initializeRecovery();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage("El PIN debe tener exactamente 4 dígitos.");
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage("Los PIN no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: ensureSupabasePassword(pin) });
      if (error) throw error;
      setSuccess(true);
      await supabase.auth.signOut();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No pudimos actualizar el PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Seo title="Crear nuevo PIN — Masushi" canonicalPath="/reset-password" noIndex />
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4">
        {checking ? (
          <div className="w-full max-w-sm rounded-xl bg-[#111111] p-6 text-center">
            <p className="text-gray-300">Validando enlace de recuperación...</p>
          </div>
        ) : !ready ? (
          <div className="w-full max-w-sm rounded-xl bg-[#111111] p-6 text-center">
            <p className="text-gray-300">El enlace de recuperación no es válido o expiró.</p>
            {errorMessage && <p className="mt-2 text-sm text-red-400">{errorMessage}</p>}
            <button type="button" onClick={() => router.push("/forgot-password")} className="mt-4 text-sm text-[#93C021]">Solicitar un enlace nuevo</button>
          </div>
        ) : success ? (
          <div className="w-full max-w-sm space-y-4 rounded-xl bg-[#111111] p-6 text-center">
            <h1 className="text-2xl font-bold">PIN actualizado</h1>
            <p className="text-sm text-gray-300">Ya puedes iniciar sesión con tu nuevo PIN.</p>
            <button type="button" onClick={() => router.replace("/login")} className="w-full rounded bg-[#D1933E] py-2 font-semibold">Ir a iniciar sesión</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-[#111111] p-6 shadow">
            <h1 className="text-center text-2xl font-bold">Crear nuevo PIN</h1>
            <input type="password" inputMode="numeric" maxLength={4} placeholder="Nuevo PIN de 4 dígitos" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full rounded bg-[#1a1a1a] px-3 py-2 text-center tracking-widest" />
            <input type="password" inputMode="numeric" maxLength={4} placeholder="Repite el nuevo PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full rounded bg-[#1a1a1a] px-3 py-2 text-center tracking-widest" />
            {errorMessage && <p className="text-center text-sm text-red-400">{errorMessage}</p>}
            <button type="submit" disabled={saving} className="w-full rounded bg-[#D1933E] py-2 font-semibold disabled:opacity-60">{saving ? "Guardando..." : "Actualizar PIN"}</button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
