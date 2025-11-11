import type { NextApiRequest, NextApiResponse } from 'next';
import sendWelcomeEmail from '@/server/emails/sendWelcomeEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId } = req.body as { email?: string; userId?: string };
  if (!email && !userId) return res.status(400).json({ error: 'email or userId required' });

  try {
    await sendWelcomeEmail({ email, userId });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('[send-welcome] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
