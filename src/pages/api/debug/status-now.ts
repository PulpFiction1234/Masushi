export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { BUSINESS_TZ, estaAbiertoAhora, proximoCambio, HORARIO_SEMANAL, OVERRIDES } from "@/utils/horarios";
import { getForceClosedWithReset } from "@/server/admin-state";

function nowParts(tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false
  });
  // @ts-ignore
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  return parts;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = new Date();
  const forceClosed = await getForceClosedWithReset();
  const abierto = !forceClosed && estaAbiertoAhora(now, BUSINESS_TZ);
  const cambio = proximoCambio(now, BUSINESS_TZ);

  res.status(200).json({
    tz: BUSINESS_TZ,
    nowIso: now.toISOString(),
    nowParts: nowParts(BUSINESS_TZ),
    forceClosed,
    abierto,
    cambio,
    horarioSemanal: HORARIO_SEMANAL,
    overrides: OVERRIDES,
  });
}
