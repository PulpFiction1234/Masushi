import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { phone, channel = 'whatsapp', payload } = req.body ?? {};
  if (!phone || !payload) return res.status(400).json({ error: 'phone and payload required' });

  // Insert using service role via RPC? For simplicity we use server-side insert with service role via env (recommended)
  // We'll call the table via the server-side client using API key stored in env SUPABASE_SERVICE_ROLE_KEY
  try {
    const serviceUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceUrl || !serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // import on demand to avoid bundling at build time
    const { createClient } = await import('@supabase/supabase-js');
    const svc = createClient(serviceUrl, serviceKey, { auth: { persistSession: false } });

    const { data, error } = await svc.from('outgoing_messages').insert({ phone, channel, payload });
    if (error) throw error;
    return res.status(200).json({ ok: true, inserted: data });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? String(e) });
  }
}
