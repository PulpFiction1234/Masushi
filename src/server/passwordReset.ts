import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

const BRAND_NAME = process.env.APP_BRAND_NAME || 'Masushi';
const RECOVERY_LINK_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 60);

const buildEmailHtml = (actionLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #111827; margin-bottom: 16px;">${BRAND_NAME} — Recupera tu PIN</h2>
      <p style="color: #4b5563; font-size: 15px;">Recibimos una solicitud para restablecer el PIN de tu cuenta. Haz clic en el botón para crear uno nuevo:</p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${actionLink}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: #D1933E; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none;">Crear un nuevo PIN</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">El enlace expira en <strong>${RECOVERY_LINK_EXPIRY_MINUTES} minutos</strong> y solo puede usarse una vez.</p>
      <p style="color: #6b7280; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${actionLink}</p>
      <p style="color: #6b7280; font-size: 13px;">Si no solicitaste este correo, puedes ignorarlo. Tu PIN actual no cambiará.</p>
    </div>
  `;
};

const buildEmailText = (actionLink: string): string => {
  return `Recibimos una solicitud para restablecer tu PIN de ${BRAND_NAME}. Abre este enlace para crear uno nuevo (expira en ${RECOVERY_LINK_EXPIRY_MINUTES} minutos): ${actionLink}\n\nSi no solicitaste este correo, puedes ignorarlo.`;
};

export type PasswordResetResult =
  | { sent: true; method: 'smtp' | 'supabase' }
  | { sent: false };

const isUserNotFoundError = (error: { message?: string; status?: number; code?: string }) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.status === 404 || message.includes('not found');
};

/**
 * Generates a Supabase recovery link server-side and emails it through our own SMTP,
 * which is far more reliable than Supabase's built-in email on the free tier.
 * Falls back to Supabase's email service if SMTP fails.
 *
 * Returns { sent: false } when the email is not registered, so callers can answer
 * with a generic success message without leaking account existence.
 */
export const createAndSendPasswordReset = async (
  email: string,
  redirectTo: string,
): Promise<PasswordResetResult> => {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error('email is required');
  if (!redirectTo) throw new Error('redirectTo is required');

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: trimmedEmail,
    options: { redirectTo },
  });

  if (error) {
    if (isUserNotFoundError(error)) return { sent: false };
    throw error;
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) throw new Error('Supabase did not return a recovery link');

  try {
    await sendEmail(
      trimmedEmail,
      `${BRAND_NAME}: recupera tu PIN`,
      buildEmailHtml(actionLink),
      buildEmailText(actionLink),
    );
    return { sent: true, method: 'smtp' };
  } catch (mailError) {
    console.error('[passwordReset] SMTP send failed, falling back to Supabase email', mailError);
    const { error: fallbackError } = await supabaseAdmin.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    if (fallbackError) throw fallbackError;
    return { sent: true, method: 'supabase' };
  }
};

export default createAndSendPasswordReset;
