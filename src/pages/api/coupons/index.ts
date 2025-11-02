import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import supabaseAdmin from "@/server/supabase";
import type { DiscountCode } from "@/types/coupon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createPagesServerClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("discount_codes")
      .select("id, code, percent, amount, expires_at, single_use, description")
  .eq("user_id", session.user.id)
  .eq("used", false)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
  .order("expires_at", { ascending: true });

    if (error) {
      console.error("Error fetching discount codes:", error);
      return res.status(500).json({ error: "No se pudo obtener tus cupones" });
    }

    return res.status(200).json({ coupons: (data ?? []) as DiscountCode[] });
  } catch (err) {
    console.error("Unexpected error fetching discount codes:", err);
    return res.status(500).json({ error: "No se pudo obtener tus cupones" });
  }
}
