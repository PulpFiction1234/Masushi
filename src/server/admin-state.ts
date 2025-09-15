import supabaseAdmin from "@/server/supabase";
import { BUSINESS_TZ } from "@/utils/horarios";

type Row = {
  id: number;
  force_closed: boolean;
  force_closed_ymd: string | null;
  force_closed_at: string | null; // timestamptz en texto ISO
};

/** Llama a la función SQL para resetear si cambió el día en America/Santiago. */
async function resetIfNewDayInDB(): Promise<void> {
  // Ignoramos el boolean de retorno; solo nos interesa que ejecute.
  const { error } = await supabaseAdmin.rpc("reset_admin_state_if_new_day");
  if (error) {
    // No interrumpas el flujo si falla; registramos para depurar
    console.warn("[admin-state] reset_admin_state_if_new_day error:", error.message);
  }
}

/** Devuelve si está forzado cerrado, con reseteo en DB si corresponde. */
export async function getForceClosedWithReset(): Promise<boolean> {
  await resetIfNewDayInDB();

  const { data, error } = await supabaseAdmin
    .from("admin_state")
    .select("force_closed, force_closed_ymd, force_closed_at")
    .eq("id", 1)
    .maybeSingle<Row>();

  if (error) throw new Error(error.message);
  return data?.force_closed ?? false;
}

/** Setea/limpia el cierre forzado y marca la fecha/hora actual en DB. */
export async function setForceClosed(closed: boolean): Promise<void> {
  const patch = closed
    ? {
        force_closed: true,
        // guardamos ambos por compatibilidad/visibilidad
        force_closed_ymd: new Intl.DateTimeFormat("en-CA", {
          timeZone: BUSINESS_TZ,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()),
        force_closed_at: new Date().toISOString(),
      }
    : { force_closed: false, force_closed_ymd: null, force_closed_at: null };

  const { error } = await supabaseAdmin
    .from("admin_state")
    .upsert({ id: 1, ...patch }, { onConflict: "id" });

  if (error) throw new Error(error.message);
}
