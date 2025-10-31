export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).end();

    // Verify the session user is an admin
    const { data: profile, error: profileErr } = await supabaseAdmin.from('profiles').select('is_admin, role').eq('id', session.user.id).single();
    if (profileErr || !profile) return res.status(403).end();
    const isAdmin = Boolean((profile as any).is_admin || (profile as any).role === 'admin');
    if (!isAdmin) return res.status(403).end();

    // Try reading from table `schedule_overrides`. If the table does not exist,
    // return 501 so the frontend can fallback to local mocks.
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('schedule_overrides').select('*');
      if (error) {
        console.warn('/api/admin/overrides GET error:', error.message);
        return res.status(501).json({ error: 'overrides-table-missing' });
      }
      return res.status(200).json({ overrides: data });
    }

    if (req.method === 'POST') {
      const { ymd, intervals } = req.body ?? {};
      if (!ymd) return res.status(400).json({ error: 'missing ymd' });
      // intervals can be null (closed) or an array
      const payload = { ymd, intervals };
      const { data, error } = await supabaseAdmin
        .from('schedule_overrides')
        .upsert(payload, { onConflict: 'ymd' })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ override: data });
    }

    if (req.method === 'DELETE') {
      const { ymd } = req.query as { ymd?: string };
      if (!ymd) return res.status(400).json({ error: 'missing ymd' });
      const { error } = await supabaseAdmin.from('schedule_overrides').delete().eq('ymd', ymd);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ deleted: true });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).end();
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end();
}
