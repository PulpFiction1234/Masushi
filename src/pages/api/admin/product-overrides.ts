import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  // check admin role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    // merge productos with overrides is done client-side; here we expose overrides
    try {
      const serviceUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceUrl || !serviceKey) return res.status(500).json({ error: 'Server misconfiguration' });
      const { createClient } = await import('@supabase/supabase-js');
      const svc = createClient(serviceUrl, serviceKey, { auth: { persistSession: false } });
      const { data, error } = await svc.from('product_overrides').select('*');
      if (error) throw error;
      return res.status(200).json({ overrides: data });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message ?? String(e) });
    }
  }

  if (req.method === 'POST') {
    const { codigo, enabled } = req.body ?? {};
    if (!codigo || typeof enabled !== 'boolean') return res.status(400).json({ error: 'codigo and enabled required' });
    try {
      const serviceUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceUrl || !serviceKey) return res.status(500).json({ error: 'Server misconfiguration' });
      const { createClient } = await import('@supabase/supabase-js');
      const svc = createClient(serviceUrl, serviceKey, { auth: { persistSession: false } });
      const { data, error } = await svc.from('product_overrides').upsert({ codigo, enabled, updated_at: new Date().toISOString() });
      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message ?? String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
