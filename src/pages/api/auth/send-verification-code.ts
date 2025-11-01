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

    // try to leverage Supabase's own email OTP if available
    try {
      const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: targetEmail });
      if (!resendErr) {
        console.log('[send-verification-code] OTP email sent via Supabase');
        return res.status(200).json({ ok: true, method: 'supabase' });
      }
      console.warn('[send-verification-code] Supabase resend error, falling back to custom email', resendErr);
    } catch (resendCatch) {
      console.warn('[send-verification-code] Supabase resend threw, falling back to custom email', resendCatch);
    }

    // fallback: generate 6-digit code and send custom email
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('email_verifications')
      .insert({ user_id: targetUserId, code, expires_at: expiresAt.toISOString() })
      .select()
      .single();

    if (insertErr) {
      console.error('[send-verification-code] insert error', insertErr);
      return res.status(500).json({ error: 'Error inserting verification code', details: insertErr.message || insertErr });
    }

    console.log('[send-verification-code] inserted record id=', (inserted as any)?.id);

    // send email with code
    const subject = 'Código de verificación — Masushi';
    const html = `<p>Tu código de verificación es: <strong style="font-family:monospace;font-size:20px">${code}</strong></p><p>Este código expira en 15 minutos.</p>`;
    try {
      await sendEmail(targetEmail, subject, html, `Tu código: ${code}`);
    } catch (e) {
      console.error('[send-verification-code] error sending verification email', e);
      // do not fail the whole operation -- code is stored
    }

    return res.status(200).json({ ok: true, method: 'custom' });
  } catch (e: any) {
    console.error('send-verification-code error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
