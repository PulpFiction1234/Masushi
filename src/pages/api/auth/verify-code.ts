import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId, code } = req.body;
  if ((!email && !userId) || !code) return res.status(400).json({ error: 'email or userId, and code required' });

  try {
    let targetUserId = userId;
    console.log('[verify-code] request', { email, userId, code });
    if (!targetUserId) {
      // find user id by email
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;
      // listUsers returns { users: [...] }
      const users = (usersData as any).users || usersData;
      const user = users.find((u: any) => u.email === email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      targetUserId = user.id;
    }

    const now = new Date().toISOString();
    const { data: rows, error: vErr } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('code', String(code))
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (vErr) throw vErr;
    console.log('[verify-code] rows found=', Array.isArray(rows) ? rows.length : 0);
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'Código inválido o expirado' });

    const ev = rows[0];

    // mark as used
    await supabaseAdmin.from('email_verifications').update({ used: true }).eq('id', ev.id);

    // also confirm the user inside Supabase auth so they can sign in normally
    const userIdForUpdate = targetUserId as string;
    const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(userIdForUpdate, { email_confirm: true });
    if (confirmErr) {
      console.error('[verify-code] error confirming email in auth.users', confirmErr);
      return res.status(500).json({ error: 'Error marcando email como verificado' });
    }

    // Optionally mark profile as verified (if you added such field). For now we just return ok.
    return res.status(200).json({ ok: true, method: 'custom' });
  } catch (e: any) {
    console.error('verify-code error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
