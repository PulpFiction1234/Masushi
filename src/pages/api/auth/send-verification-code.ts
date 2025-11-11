import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId } = req.body;
  if (!email && !userId) return res.status(400).json({ error: 'email or userId required' });

  try {
    let targetUserId = userId as string | null;
    let targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;

    if (!targetUserId) {
      const { data: listResult, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;
      const users = (listResult as any).users || listResult || [];
      const user = users.find((u: any) => (u?.email || '').toLowerCase() === (targetEmail || '').toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      targetUserId = user.id;
      targetEmail = user.email?.toLowerCase() || targetEmail;
    }

    if (!targetEmail) {
      const { data: userInfo, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId as string);
      if (fetchErr) throw fetchErr;
      const fetchedUser = (userInfo as any)?.user ?? userInfo;
      targetEmail = (fetchedUser?.email || '').toLowerCase();
      if (!targetEmail) return res.status(400).json({ error: 'No email associated with this user' });
    }

    console.log('[send-verification-code] targetUserId=', targetUserId);

    // Use Supabase's own email OTP flow only. We do NOT send a second custom
    // email from our SMTP to avoid users receiving two codes. If Supabase
    // fails to resend, we return a 500 so callers know the resend did not
    // succeed (no fallback custom email will be sent).
    try {
      const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: targetEmail });
      if (!resendErr) {
        console.log('[send-verification-code] OTP email sent via Supabase');
        return res.status(200).json({ ok: true, method: 'supabase' });
      }
      console.error('[send-verification-code] Supabase resend error (no fallback):', resendErr);
      return res.status(500).json({ error: 'Supabase resend failed' });
    } catch (resendCatch) {
      console.error('[send-verification-code] Supabase resend threw (no fallback):', resendCatch);
      return res.status(500).json({ error: 'Supabase resend threw' });
    }
  } catch (e: any) {
    console.error('send-verification-code error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
