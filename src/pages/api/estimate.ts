import type { NextApiRequest, NextApiResponse } from 'next';
import { getEstimateRange, getEstimateWindow, formatWindow } from '@/utils/estimateTimes';

type Resp = {
  ok: boolean;
  type?: 'delivery' | 'retiro';
  range?: { min: number; max: number } | null;
  window?: { minAt: string; maxAt: string } | null;
  estimatedMax?: string | null;
  error?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  const t = (req.query.type as string) || 'delivery';
  const type = t === 'retiro' ? 'retiro' : 'delivery';

  try {
    const range = getEstimateRange(type, new Date());
    const win = getEstimateWindow(type, new Date());

    const windowResp = win
      ? { minAt: win.minAt.toISOString(), maxAt: win.maxAt.toISOString() }
      : null;

    // estimatedMax: prefer window.maxAt formatted (HH:MM in business tz), otherwise range.max in minutes
    let estimatedMax: string | null = null;
    if (win && win.maxAt) {
      // format using same TZ as formatWindow to human readable
      estimatedMax = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }).format(win.maxAt);
    } else if (range) {
      estimatedMax = `${range.max} min`;
    }

    return res.status(200).json({ ok: true, type, range, window: windowResp, estimatedMax });
  } catch (e: unknown) {
    const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message?: unknown }).message ?? '') : String(e);
    return res.status(500).json({ ok: false, error: msg });
  }
}
