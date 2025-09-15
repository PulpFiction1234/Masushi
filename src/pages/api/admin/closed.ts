export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { getForceClosedWithReset, setForceClosed } from "@/server/admin-state";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ forceClosed: boolean }>
) {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return res.status(401).end();

    if (req.method === "GET") {
      const closed = await getForceClosedWithReset();
      return res.status(200).json({ forceClosed: closed });
    }

    if (req.method === "POST") {
      const { forceClosed } = req.body ?? {};
      if (typeof forceClosed !== "boolean") return res.status(400).end();

      await setForceClosed(forceClosed);
      const closed = await getForceClosedWithReset();
      return res.status(200).json({ forceClosed: closed });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).end();
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}
