import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import createAndSendCustomVerification from '@/server/customVerification';

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

    if (!targetUserId || !targetEmail) {
      console.error('[send-verification-code] could not resolve user id or email');
      return res.status(400).json({ error: 'No pudimos encontrar al usuario o email' });
    }

    console.log('[send-verification-code] targetUserId=', targetUserId);

    // Prefer Supabase's own email OTP flow. If it fails with a rate limit, inform
    // the caller so they can esperar; only fall back to the custom path for other
    // kinds of failures (SMTP outage, etc.).
    try {
      const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: targetEmail });
      if (!resendErr) {
        console.log('[send-verification-code] OTP email sent via Supabase');
        return res.status(200).json({ ok: true, method: 'supabase' });
      }
      const errAny: any = resendErr;
      if (errAny && (errAny.status === 429 || errAny.code === 'over_email_send_rate_limit')) {
        const msg = String(errAny.message || errAny.error || 'Rate limited');
        const m = msg.match(/after\s+(\d+)\s+seconds?/i);
        const retryAfter = m ? Number(m[1]) : undefined;
        console.warn('[send-verification-code] Supabase resend rate-limited, informing client');
        return res.status(429).json({ error: 'rate_limited', message: msg, retry_after: retryAfter });
      }

      console.warn('[send-verification-code] Supabase resend error (non-rate-limit), using custom fallback:', resendErr);
      const fallback = await createAndSendCustomVerification(targetUserId, targetEmail);
      return res.status(200).json({ ok: true, method: 'custom', expires_at: fallback.expiresAt.toISOString() });
    } catch (resendCatch: any) {
      if (resendCatch && (resendCatch.status === 429 || resendCatch.code === 'over_email_send_rate_limit')) {
        const msg = String(resendCatch.message || 'Rate limited');
        const m = msg.match(/after\s+(\d+)\s+seconds?/i);
        const retryAfter = m ? Number(m[1]) : undefined;
        console.warn('[send-verification-code] Supabase resend threw with rate limit, informing client');
        return res.status(429).json({ error: 'rate_limited', message: msg, retry_after: retryAfter });
      }

      console.error('[send-verification-code] Supabase resend threw, attempting custom fallback:', resendCatch);
      try {
        const fallback = await createAndSendCustomVerification(targetUserId as string, targetEmail);
        return res.status(200).json({ ok: true, method: 'custom', expires_at: fallback.expiresAt.toISOString() });
      } catch (fallbackErr) {
        console.error('[send-verification-code] custom fallback failed', fallbackErr);
        return res.status(500).json({ error: 'Supabase resend threw', details: String(resendCatch), fallback_error: (fallbackErr as Error)?.message });
      }
    }
  } catch (e: any) {
    console.error('send-verification-code error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
