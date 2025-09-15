import type { NextApiRequest, NextApiResponse } from "next";
import { BUSINESS_TZ, estaAbiertoAhora, proximoCambio } from "@/utils/horarios";
import { getForceClosedWithReset } from "@/server/admin-state";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();

  // Resetea en DB si corresponde y obtiene el estado real
  const forceClosed = await getForceClosedWithReset();

  const abierto = !forceClosed && estaAbiertoAhora(now, BUSINESS_TZ);
  const cambio = proximoCambio(now, BUSINESS_TZ);

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    timeZone: BUSINESS_TZ,
    abierto,
    nextOpen: cambio.isOpen ? null : cambio.nextOpen ?? null,
    nextClose: cambio.isOpen ? cambio.nextClose ?? null : null,
    generatedAt: now.toISOString(),
  });
}
