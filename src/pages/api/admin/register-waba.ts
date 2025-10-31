import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy endpoint to send the regcode to your WhatsApp On-Premises registration URL.
// Protect with ADMIN_SECRET env var. Configure target URL in WHATSAPP_REGISTER_URL env var.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { adminSecret, regcode, contentType } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const targetUrl = process.env.WHATSAPP_REGISTER_URL;

  if (!ADMIN_SECRET) return res.status(500).json({ error: 'Server misconfigured: ADMIN_SECRET missing' });
  if (!adminSecret || adminSecret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!targetUrl) return res.status(500).json({ error: 'Server misconfigured: WHATSAPP_REGISTER_URL missing' });
  if (!regcode) return res.status(400).json({ error: 'regcode required' });

  try {
    const ct = contentType || 'application/json';
    let body: string;
    if (ct === 'application/json') {
      body = JSON.stringify({ regcode });
    } else if (ct === 'text/plain') {
      body = String(regcode);
    } else {
      body = JSON.stringify({ regcode });
    }

    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': ct },
      body,
    });

    const text = await resp.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch (e) { /* keep raw text */ }

    if (!resp.ok) return res.status(resp.status).json({ ok: false, status: resp.status, body: parsed });
    return res.status(200).json({ ok: true, status: resp.status, body: parsed });
  } catch (e: any) {
    console.error('[admin/register-waba] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
