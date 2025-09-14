import type { NextApiRequest, NextApiResponse } from "next";

let forceClosed = false;

export function getForceClosed(): boolean {
  return forceClosed;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ forceClosed: boolean }>,
) {
  if (req.method === "POST") {
    const { forceClosed: closed } = req.body ?? {};
    forceClosed = Boolean(closed);
    res.status(200).json({ forceClosed });
    return;
  }

  res.status(200).json({ forceClosed });
}