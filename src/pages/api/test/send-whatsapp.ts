import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppMessage } from '@/utils/sendWhatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: 'phone and text required' });

  try {
    const result = await sendWhatsAppMessage(String(phone).replace(/\D/g, ''), String(text));
    if (!result.ok) return res.status(result.status || 500).json({ ok: false, error: result.error, body: result.body });
    return res.status(200).json({ ok: true, body: result.body });
  } catch (e: any) {
    console.error('[test/send-whatsapp] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
