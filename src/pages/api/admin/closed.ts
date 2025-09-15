import type { NextApiRequest, NextApiResponse } from "next";
import {
  getForceClosed as getStoredForceClosed,
  setForceClosed as setStoredForceClosed,
} from "@/server/state";
import {
  recordForceClosed,
  clearForceClosedDate,
  shouldResetForceClosed,
} from "@/server/schedule";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ forceClosed: boolean }>,
) {
  try {
     if (req.method === "GET") {
      let closed = await getStoredForceClosed();
      if (closed && shouldResetForceClosed()) {
        await setStoredForceClosed(false);
        clearForceClosedDate();
        closed = false;
      }
      res.status(200).json({ forceClosed: closed });
      return;
    }
    if (req.method === "POST") {
      const { forceClosed: closed } = req.body ?? {};
      if (typeof closed !== "boolean") {
        res.status(400).end();
        return;
      }

      await setStoredForceClosed(closed);
      if (closed) {
        recordForceClosed();
      } else {
        clearForceClosedDate();
      }
      res.status(200).json({ forceClosed: await getStoredForceClosed() });
      return;
    }
  } catch {
    res.status(500).end();
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
}

