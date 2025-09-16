import supabaseAdmin from "@/server/supabase";
import { BUSINESS_TZ } from "@/utils/horarios";

export type AdminMode = "normal" | "forceClosed" | "forceOpen";

type Row = {
  id: number;
  force_closed: boolean;
  force_closed_ymd: string | null;
  force_closed_at: string | null;
  force_open: boolean;
  force_open_at: string | null;
};

async function resetIfNewDayInDB(): Promise<void> {
  const { error } = await supabaseAdmin.rpc("reset_admin_state_if_new_day");
  if (error) console.warn("[admin-state] reset_admin_state_if_new_day error:", error.message);
}

export async function getStateWithReset(): Promise<Row | null> {
  await resetIfNewDayInDB();
  const { data, error } = await supabaseAdmin
    .from("admin_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle<Row>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getAdminModeWithReset(): Promise<AdminMode> {
  const row = await getStateWithReset();
  if (!row) return "normal";
  if (row.force_open) return "forceOpen";
  if (row.force_closed) return "forceClosed";
  return "normal";
}

export async function setAdminMode(mode: AdminMode): Promise<void> {
  const nowIso = new Date().toISOString();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  const base: Partial<Row> =
    mode === "normal"
      ? {
          force_closed: false,
          force_closed_ymd: null,
          force_closed_at: null,
          force_open: false,
          force_open_at: null,
        }
      : mode === "forceClosed"
      ? {
          force_closed: true,
          force_closed_ymd: ymd,
          force_closed_at: nowIso,
          force_open: false,
          force_open_at: null,
        }
      : {
          force_open: true,
          force_open_at: nowIso,
          force_closed: false,
          force_closed_ymd: null,
          force_closed_at: null,
        };

  const { error } = await supabaseAdmin
    .from("admin_state")
    .upsert({ id: 1, ...base }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

/* Compat para código viejo: */
export async function getForceClosedWithReset(): Promise<boolean> {
  const row = await getStateWithReset();
  return !!row?.force_closed;
}
export async function setForceClosed(closed: boolean): Promise<void> {
  await setAdminMode(closed ? "forceClosed" : "normal");
}

/* Safe helpers (opcional): */
export async function getForceClosedSafe(): Promise<boolean> {
  try { return await getForceClosedWithReset(); } catch { return false; }
}
