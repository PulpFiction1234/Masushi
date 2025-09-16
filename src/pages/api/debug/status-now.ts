export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { BUSINESS_TZ, estaAbiertoAhora, proximoCambio, HORARIO_SEMANAL, OVERRIDES } from "@/utils/horarios";
import { getStateWithReset } from "@/server/admin-state";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();
  const state = await getStateWithReset();
  const abiertoHorario = estaAbiertoAhora(now, BUSINESS_TZ);
  const abierto = (state?.force_open ?? false) || (!(state?.force_closed ?? false) && abiertoHorario);

  res.status(200).json({
    tz: BUSINESS_TZ,
    nowIso: now.toISOString(),
    forceClosed: !!state?.force_closed,
    forceOpen: !!state?.force_open,
    abiertoHorario,
    abierto,
    cambio: proximoCambio(now, BUSINESS_TZ),
    horarioSemanal: HORARIO_SEMANAL,
    overrides: OVERRIDES,
  });
}
