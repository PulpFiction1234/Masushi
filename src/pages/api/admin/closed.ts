import type { NextApiRequest, NextApiResponse } from "next";
import { getForceClosed, setForceClosed } from "@/server/order-state";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ forceClosed: boolean }>,
) {
  if (req.method === "GET") {
    res.status(200).json({ forceClosed: await getForceClosed() });
    return;
  }

  if (req.method === "POST") {
    const { forceClosed: closed } = req.body ?? {};
    if (typeof closed !== "boolean") {
      res.status(400).end();
      return;
    }

    await setForceClosed(closed);
    res.status(200).json({ forceClosed: await getForceClosed() });
    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end();
  }