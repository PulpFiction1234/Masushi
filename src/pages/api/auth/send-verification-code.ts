import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId } = req.body;
  if (!email && !userId) return res.status(400).json({ error: 'email or userId required' });

  try {
  let targetUserId = userId;
  if (!targetUserId) {
    // find user by email using admin listUsers (fallback)
    const { data: listResult, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const users = (listResult as any).users || listResult || [];
    const user = users.find((u: any) => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    targetUserId = user.id;
  }
    console.log('[send-verification-code] targetUserId=', targetUserId);

    // generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // insert code in email_verifications
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
      await sendEmail(email, subject, html, `Tu código: ${code}`);
    } catch (e) {
      console.error('[send-verification-code] error sending verification email', e);
      // do not fail the whole operation -- code is stored
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('send-verification-code error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
