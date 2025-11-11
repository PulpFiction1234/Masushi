import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, userId } = req.body as { email?: string; userId?: string };
  if (!email && !userId) return res.status(400).json({ error: 'email or userId required' });

  try {
    console.log('[send-welcome] request body=', { email, userId });
    let targetUserId = userId as string | undefined;
    let targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;

    if (!targetUserId && targetEmail) {
      const { data: listResult, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;
      const users = (listResult as any).users || listResult || [];
      const user = users.find((u: any) => (u?.email || '').toLowerCase() === (targetEmail || '').toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      targetUserId = user.id;
    }

    // Try to fetch user metadata for display name; but don't require
    // Supabase's email_confirmed flag — the client calls this endpoint right
    // after a successful verification flow, and sometimes the admin flag may
    // not be immediately visible. Send the welcome email regardless.
    let fetchedUser: any = {};
    try {
      const { data: userDataObj, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId as string);
      if (!getUserErr) fetchedUser = (userDataObj as any)?.user ?? userDataObj ?? {};
    } catch (e) {
      console.warn('[send-welcome] could not fetch user by id for metadata', e);
    }

    if (!targetEmail && fetchedUser?.email) targetEmail = fetchedUser.email;

    // Build display name (best-effort)
    let displayName = (fetchedUser?.user_metadata && fetchedUser.user_metadata.full_name) || fetchedUser?.user_metadata?.fullName || fetchedUser?.email || '';
    try {
      const { data: profileData } = await supabaseAdmin.from('profiles').select('full_name').eq('id', targetUserId).single();
      if (profileData && !displayName) displayName = (profileData as any).full_name || '';
    } catch (e) {
      // ignore
    }

    if (!targetEmail) {
      console.warn('[send-welcome] no targetEmail after lookup for userId=', targetUserId);
      return res.status(400).json({ error: 'No email available for user' });
    }

    const namePart = displayName && String(displayName).trim() ? String(displayName).trim() : String((targetEmail || '')).split('@')[0];

    // WhatsApp contact
    const WHATSAPP_SOURCE_NUMBER = '56940873865';
    const whatsappDigits = String(WHATSAPP_SOURCE_NUMBER).replace(/\D/g, '');
    const waLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';
    const formatChile = (digits: string) => {
      if (!digits) return '';
      if (digits.startsWith('56') && digits.length === 11) {
        const rest = digits.slice(2);
        const part1 = rest.slice(0,1);
        const part2 = rest.slice(1,5);
        const part3 = rest.slice(5);
        return `+56 ${part1} ${part2} ${part3}`;
      }
      return `+${digits}`;
    };
    const whatsappDisplay = formatChile(whatsappDigits);

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 36px 20px; background: #ffffff; color: #111827;">
  <div style="text-align:center; margin-bottom: 28px">
    <div style="font-size:36px">🍣</div>
    <div style="font-weight:700; font-size:20px; margin-top:6px">Masushi</div>
  </div>

  <div style="background:#f9fafb; border-radius:12px; padding:28px; text-align:center; box-shadow:0 1px 0 rgba(0,0,0,0.02);">
    <h1 style="margin:0 0 8px 0; font-size:20px; color:#111827; font-weight:700">¡Bienvenido, ${namePart}!</h1>
    <p style="margin:0 0 20px 0; color:#6b7280; font-size:15px">Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión y disfrutar de nuestros productos.</p>

    <div style="background:#ffffff; border:2px solid #ef4444; border-radius:8px; padding:18px 20px; margin:18px auto; display:inline-block; min-width:260px;">
      <div style="font-family:monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; color:#ef4444; font-size:18px; font-weight:700; letter-spacing:2px;">Cuenta verificada ✔</div>
    </div>

    <p style="margin:0; color:#6b7280; font-size:14px">Si necesitas ayuda, contáctanos por <strong>WhatsApp</strong>${waLink ? `: <a href="${waLink}" style="color:#ef4444; text-decoration:none;"><span style="white-space:nowrap">${whatsappDisplay}</span></a>` : '.'}</p>
  </div>

  <div style="text-align:center; margin-top:22px; padding-top:18px; border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af; font-size:12px; margin:0">Si no solicitaste este registro, ignora este email.</p>
  </div>
</div>
`;

    const text = `Hola ${namePart}! Tu cuenta ha sido verificada correctamente. Bienvenido a Masushi.`;

    try {
      console.log('[send-welcome] sending welcome email to', targetEmail);
      await sendEmail(String(targetEmail), 'Bienvenido a Masushi 🍣', html, text);
      console.log('[send-welcome] sent welcome email to', targetEmail);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[send-welcome] error sending email', e);
      return res.status(500).json({ error: 'Could not send welcome email', details: String(e) });
    }
  } catch (e: any) {
    console.error('[send-welcome] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
