import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import createAndSendCustomVerification from '@/server/customVerification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId } = req.body;
  if (!email && !userId) return res.status(400).json({ error: 'email or userId required' });
  if ((email && typeof email !== 'string') || (userId && typeof userId !== 'string')) {
    return res.status(400).json({ error: 'email or userId invalid' });
  }

  try {
    let targetUserId = typeof userId === 'string' ? userId : null;
    let targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;

    if (targetUserId && targetEmail) {
      const { data: userInfo, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (fetchErr) throw fetchErr;
      const registeredEmail = userInfo.user?.email?.trim().toLowerCase();
      if (!registeredEmail || registeredEmail !== targetEmail) {
        return res.status(400).json({ error: 'email and userId do not match' });
      }
      targetEmail = registeredEmail;
    }

    if (!targetUserId) {
      const { data: listResult, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;
      const users = listResult?.users || [];
      const user = users.find((u) => (u.email || '').toLowerCase() === (targetEmail || '').toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      targetUserId = user.id;
      targetEmail = user.email?.toLowerCase() || targetEmail;
    }

    if (!targetEmail) {
      if (!targetUserId) return res.status(400).json({ error: 'No pudimos encontrar al usuario o email' });
      const { data: userInfo, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (fetchErr) throw fetchErr;
      const fetchedUser = userInfo?.user;
      targetEmail = (fetchedUser?.email || '').toLowerCase();
      if (!targetEmail) return res.status(400).json({ error: 'No email associated with this user' });
    }

    if (!targetUserId || !targetEmail) {
      console.error('[send-verification-code] could not resolve user id or email');
      return res.status(400).json({ error: 'No pudimos encontrar al usuario o email' });
    }

    // Prefer Supabase's own email OTP flow. If it fails with a rate limit, inform
    // the caller so they can esperar; only fall back to the custom path for other
    // kinds of failures (SMTP outage, etc.).
    try {
      const { error: resendErr } = await supabaseAdmin.auth.resend({ type: 'signup', email: targetEmail });
      if (!resendErr) {
        console.log('[send-verification-code] OTP email sent via Supabase');
        return res.status(200).json({ ok: true, method: 'supabase' });
      }
      if (resendErr && (resendErr.status === 429 || resendErr.code === 'over_email_send_rate_limit')) {
        const msg = String(resendErr.message || 'Rate limited');
        const m = msg.match(/after\s+(\d+)\s+seconds?/i);
        const retryAfter = m ? Number(m[1]) : undefined;
        console.warn('[send-verification-code] Supabase resend rate-limited, informing client');
        return res.status(429).json({ error: 'rate_limited', message: msg, retry_after: retryAfter });
      }

      console.warn('[send-verification-code] Supabase resend error (non-rate-limit), using custom fallback:', resendErr);
      const fallback = await createAndSendCustomVerification(targetUserId, targetEmail);
      return res.status(200).json({ ok: true, method: 'custom', expires_at: fallback.expiresAt.toISOString() });
    } catch (resendCatch: unknown) {
      if (resendCatch && typeof resendCatch === 'object' &&
          (('status' in resendCatch && resendCatch.status === 429) ||
           ('code' in resendCatch && resendCatch.code === 'over_email_send_rate_limit'))) {
        const msg = String(('message' in resendCatch && resendCatch.message) || 'Rate limited');
        const m = msg.match(/after\s+(\d+)\s+seconds?/i);
        const retryAfter = m ? Number(m[1]) : undefined;
        console.warn('[send-verification-code] Supabase resend threw with rate limit, informing client');
        return res.status(429).json({ error: 'rate_limited', message: msg, retry_after: retryAfter });
      }

      console.error('[send-verification-code] Supabase resend threw, attempting custom fallback:', resendCatch);
      try {
        const fallback = await createAndSendCustomVerification(targetUserId, targetEmail);
        return res.status(200).json({ ok: true, method: 'custom', expires_at: fallback.expiresAt.toISOString() });
      } catch (fallbackErr) {
        console.error('[send-verification-code] custom fallback failed', fallbackErr);
        return res.status(500).json({ error: 'Supabase resend threw', details: String(resendCatch), fallback_error: (fallbackErr as Error)?.message });
      }
    }
  } catch (e: unknown) {
    console.error('send-verification-code error', e);
    const message = e && typeof e === 'object' && 'message' in e ? e.message : undefined;
    return res.status(500).json({ error: message || String(e) });
  }
}
