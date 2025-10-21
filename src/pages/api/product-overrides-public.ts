import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!serviceUrl || (!serviceRoleKey && !anonKey)) {
    console.error('product-overrides-public missing SUPABASE config', { serviceUrl: !!serviceUrl, serviceRoleKey: !!serviceRoleKey, anonKey: !!anonKey });
    return res.status(500).json({ error: 'Missing config' });
  }

  // Prefer service role on server (can read protected tables); fallback to anon key
  const keyToUse = serviceRoleKey ?? anonKey!;
  const svc = createClient(serviceUrl, keyToUse, { auth: { persistSession: false } });
  try {
    const { data, error } = await svc.from('product_overrides').select('*');
    if (error) throw error;
    return res.status(200).json({ overrides: data });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? String(e) });
  }
}
