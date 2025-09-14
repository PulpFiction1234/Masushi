import type { NextApiRequest, NextApiResponse } from "next";
import { getForceClosed, setForceClosed } from "@/server/order-state";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ forceClosed: boolean }>,
) {
  if (req.method === "POST") {
    const { forceClosed: closed } = req.body ?? {};
    setForceClosed(Boolean(closed));
    res.status(200).json({ forceClosed: getForceClosed() });
    return;
  }

  res.status(200).json({ forceClosed: getForceClosed() });
}