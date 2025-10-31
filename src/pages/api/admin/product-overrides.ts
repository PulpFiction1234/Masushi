import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
// Do not import supabaseAdmin at module load time because it throws if env is missing in some dev setups.
let _supabaseAdmin: typeof import('@/server/supabase').default | null = null;

async function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const mod = await import('@/server/supabase');
  _supabaseAdmin = mod.default;
  return _supabaseAdmin;
}

type Data =
  | { data: Array<Record<string, unknown>> }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    // If Supabase admin isn't configured in this environment, return a 501 so devs know
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(501).json({ error: 'supabase-not-configured' });
    }
    const supabaseAdmin = await getSupabaseAdmin();

    // Ensure the requester is an authenticated admin. Use the pages server client
    // to get the session from the cookies and then lookup the profile.
    const supa = createPagesServerClient({ req, res });
    const { data: { session } } = await supa.auth.getSession();
    if (!session?.user) return res.status(401).json({ error: 'not-authenticated' });

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, role')
      .eq('id', session.user.id)
      .single();

    if (profErr || !profile) return res.status(403).json({ error: 'forbidden' });
    const isAdmin = Boolean((profile as any).is_admin || (profile as any).role === 'admin');
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' });
    if (req.method === 'GET') {
  const { data, error } = await supabaseAdmin.from('product_overrides').select('*');
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('does not exist') || msg.includes('relation "product_overrides" does not exist')) {
          return res.status(501).json({ error: 'product-overrides-table-missing' });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === 'POST') {
      const { codigo, enabled } = req.body as { codigo?: string; enabled?: boolean };
      if (typeof codigo !== 'string' || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'invalid-payload' });
      }

      const payload = { codigo, enabled, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin.from('product_overrides').upsert(payload, { onConflict: 'codigo' });
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('does not exist') || msg.includes('relation "product_overrides" does not exist')) {
          return res.status(501).json({ error: 'product-overrides-table-missing' });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ data: data ?? [] });
    }

    if (req.method === 'DELETE') {
      const codigo = typeof req.query.codigo === 'string' ? req.query.codigo : undefined;
      if (!codigo) return res.status(400).json({ error: 'missing-codigo' });
  const { data, error } = await supabaseAdmin.from('product_overrides').delete().eq('codigo', codigo);
      if (error) {
        const msg = String(error.message || '');
        if (msg.includes('does not exist') || msg.includes('relation "product_overrides" does not exist')) {
          return res.status(501).json({ error: 'product-overrides-table-missing' });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ data: data ?? [] });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (err: unknown) {
    // Avoid using `any`: narrow to an object that may have a message property.
    const msg = typeof err === 'object' && err !== null && 'message' in err ? String((err as unknown as { message?: unknown }).message ?? '') : String(err);
    return res.status(500).json({ error: msg });
  }
}
