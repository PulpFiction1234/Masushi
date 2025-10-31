import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';

// Protected admin endpoint to create a user using the service role key.
// Protect with ADMIN_SECRET env var: pass { adminSecret } in the JSON body.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { adminSecret, email, password, full_name, phone } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return res.status(500).json({ error: 'Server misconfigured: ADMIN_SECRET missing' });
  if (!adminSecret || adminSecret !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    // create user via admin API
    const createParams: any = { email, password };
    if (full_name || phone) createParams.user_metadata = { full_name: full_name || undefined, phone: phone || undefined };

    const { data, error } = await supabaseAdmin.auth.admin.createUser(createParams as any);
    if (error) {
      console.error('[admin:create-user] error', error);
      return res.status(500).json({ error: error.message || String(error) });
    }

    // return created user's id
    const createdId = (data as any)?.user?.id || (data as any)?.id || null;
    return res.status(200).json({ ok: true, id: createdId, raw: data });
  } catch (e: any) {
    console.error('[admin:create-user] exception', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
