export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { BUSINESS_TZ, estaAbiertoAhora, proximoCambio } from "@/utils/horarios";
import { getStateWithReset } from "@/server/admin-state";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();
  const state = await getStateWithReset();

  const forceOpen = !!state?.force_open;
  const forceClosed = !!state?.force_closed;

  const abiertoHorario = estaAbiertoAhora(now, BUSINESS_TZ);
  const abierto = forceOpen || (!forceClosed && abiertoHorario);

  const cambio = proximoCambio(now, BUSINESS_TZ);

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    timeZone: BUSINESS_TZ,
    abierto,
    nextOpen: abierto ? null : (cambio.nextOpen ?? null),
    nextClose: abierto ? (cambio.nextClose ?? null) : null,
    generatedAt: now.toISOString(),
    overrides: { forceOpen, forceClosed }, // útil para UI/debug
  });
}
