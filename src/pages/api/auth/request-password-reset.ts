import type { NextApiRequest, NextApiResponse } from 'next';
import createAndSendPasswordReset from '@/server/passwordReset';

const PRODUCTION_SITE_URL = 'https://www.masushi.cl';
const RESEND_COOLDOWN_MS = 60_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort rate limiting: in serverless each instance keeps its own map.
const lastRequestByEmail = new Map<string, number>();

const getRecoveryRedirect = () => {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return `${PRODUCTION_SITE_URL}/reset-password`;
  if (configured) return `${configured}/reset-password`;
  return 'http://localhost:3000/reset-password';
};

const pruneRateLimitMap = (now: number) => {
  for (const [key, timestamp] of lastRequestByEmail) {
    if (now - timestamp > RESEND_COOLDOWN_MS * 10) lastRequestByEmail.delete(key);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }

  const now = Date.now();
  pruneRateLimitMap(now);
  const lastRequest = lastRequestByEmail.get(email) ?? 0;
  if (now - lastRequest < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (now - lastRequest)) / 1000);
    return res.status(429).json({ error: 'rate_limited', retry_after: retryAfter });
  }
  lastRequestByEmail.set(email, now);

  try {
    await createAndSendPasswordReset(email, getRecoveryRedirect());
    // Generic response: never reveal whether the email is registered.
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[request-password-reset] error', error);
    // Allow an immediate retry when the send actually failed.
    lastRequestByEmail.delete(email);
    return res.status(500).json({ error: 'No pudimos enviar el correo de recuperación. Intenta nuevamente.' });
  }
}
