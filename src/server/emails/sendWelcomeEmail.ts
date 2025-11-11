import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

const WHATSAPP_SOURCE_NUMBER = '56940873865';

const formatChile = (digits: string) => {
  if (!digits) return '';
  const numbersOnly = digits.replace(/\D/g, '');
  if (numbersOnly.startsWith('56') && numbersOnly.length === 11) {
    const rest = numbersOnly.slice(2);
    const part1 = rest.slice(0, 1);
    const part2 = rest.slice(1, 5);
    const part3 = rest.slice(5);
    return `+56 ${part1} ${part2} ${part3}`;
  }
  return `+${numbersOnly}`;
};

export type SendWelcomeEmailParams = {
  email?: string | null;
  userId?: string | null;
};

export const sendWelcomeEmail = async ({ email, userId }: SendWelcomeEmailParams): Promise<void> => {
  if (!email && !userId) {
    throw new Error('email or userId required');
  }

  let targetUserId = (userId ?? undefined) as string | undefined;
  let targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
  let fetchedUser: any = {};
  let displayName = '';

  if (targetUserId) {
    try {
      const { data: userDataObj, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (!getUserErr && userDataObj) {
        fetchedUser = (userDataObj as any)?.user ?? userDataObj ?? {};
        if (!targetEmail && fetchedUser?.email) {
          targetEmail = fetchedUser.email.toLowerCase();
        }
        displayName = fetchedUser?.user_metadata?.full_name || '';
      }
    } catch (e) {
      console.warn('[sendWelcomeEmail] could not fetch user by id', e);
    }
  }

  if (!targetUserId && targetEmail) {
    try {
      const { data: listResult, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && listResult) {
        const users = (listResult as any).users || listResult || [];
        const userMatch = users.find((u: any) => (u?.email || '').toLowerCase() === targetEmail);
        if (userMatch) {
          fetchedUser = userMatch;
          targetUserId = userMatch.id;
          displayName = userMatch?.user_metadata?.full_name || '';
        }
      }
    } catch (e) {
      console.warn('[sendWelcomeEmail] could not list users to find by email', e);
    }
  }

  if (targetUserId && !displayName) {
    try {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', targetUserId)
        .single();
      if (profileData) {
        displayName = (profileData as any).full_name || '';
      }
    } catch (e) {
      console.warn('[sendWelcomeEmail] could not fetch profile', e);
    }
  }

  if (!targetEmail) {
    throw new Error('No email available');
  }

  const namePart = displayName && String(displayName).trim()
    ? String(displayName).trim()
    : String(targetEmail).split('@')[0];

  const whatsappDigits = String(WHATSAPP_SOURCE_NUMBER).replace(/\D/g, '');
  const waLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '';
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

  await sendEmail(String(targetEmail), 'Bienvenido a Masushi 🍣', html, text);
};

export default sendWelcomeEmail;
