export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { getAdminModeWithReset, setAdminMode, type AdminMode } from "@/server/admin-state";

type Res = { mode: AdminMode };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Res>) {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).end();

    if (req.method === "GET") {
      const mode = await getAdminModeWithReset();
      return res.status(200).json({ mode });
    }

    if (req.method === "POST") {
      const mode = (req.body?.mode ?? "normal") as AdminMode;
      if (!["normal", "forceClosed", "forceOpen"].includes(mode)) return res.status(400).end();
      await setAdminMode(mode);
      const current = await getAdminModeWithReset();
      return res.status(200).json({ mode: current });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).end();
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
