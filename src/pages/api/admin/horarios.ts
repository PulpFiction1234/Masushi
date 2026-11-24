import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { verifyAdminIdentity } from '@/server/adminAuthorizationCore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const identity = await verifyAdminIdentity(() => supabase.auth.getUser());
  if (!identity.authenticated) return res.status(identity.status).json({ error: identity.status === 401 ? 'Not authenticated' : 'Authentication unavailable' });

  // check admin role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', identity.user.id)
    .single();
  if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    try {
      const serviceUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceUrl || !serviceKey) return res.status(500).json({ error: 'Server misconfiguration' });
      const { createClient } = await import('@supabase/supabase-js');
      const svc = createClient(serviceUrl, serviceKey, { auth: { persistSession: false } });
      const { data, error } = await svc.from('app_settings').select('*').eq('key', 'horarios').maybeSingle();
      if (error) throw error;
      return res.status(200).json({ ok: true, settings: data?.value ?? null });
    } catch (e: unknown) {
      console.error(e);
      return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (req.method === 'POST') {
    const value = req.body?.value;
    if (!value) return res.status(400).json({ error: 'value required' });
    try {
      const serviceUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceUrl || !serviceKey) return res.status(500).json({ error: 'Server misconfiguration' });
      const { createClient } = await import('@supabase/supabase-js');
      const svc = createClient(serviceUrl, serviceKey, { auth: { persistSession: false } });
      const { data, error } = await svc.from('app_settings').upsert({ key: 'horarios', value }).select('*');
      if (error) throw error;
      return res.status(200).json({ ok: true, data: data?.[0] ?? null });
    } catch (e: unknown) {
      console.error(e);
      return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
