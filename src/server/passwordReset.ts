import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';
import { buildPasswordRecoveryUrl } from '@/utils/passwordRecovery';

const BRAND_NAME = process.env.APP_BRAND_NAME || 'Masushi';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const buildEmailHtml = (actionLink: string): string => {
  const safeLink = escapeHtml(actionLink);
  const safeBrandName = escapeHtml(BRAND_NAME);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #111827; margin-bottom: 16px;">${safeBrandName} — Recupera tu PIN</h2>
      <p style="color: #4b5563; font-size: 15px;">Recibimos una solicitud para restablecer el PIN de tu cuenta. Haz clic en el botón para crear uno nuevo:</p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${safeLink}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: #D1933E; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none;">Crear un nuevo PIN</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">El enlace tiene vigencia limitada y solo puede usarse una vez.</p>
      <p style="color: #6b7280; font-size: 13px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${safeLink}</p>
      <p style="color: #6b7280; font-size: 13px;">Si no solicitaste este correo, puedes ignorarlo. Tu PIN actual no cambiará.</p>
    </div>
  `;
};

const buildEmailText = (actionLink: string): string => {
  return `Recibimos una solicitud para restablecer tu PIN de ${BRAND_NAME}. Abre este enlace para crear uno nuevo. El enlace tiene vigencia limitada y solo puede usarse una vez: ${actionLink}\n\nSi no solicitaste este correo, puedes ignorarlo.`;
};

export type PasswordResetResult =
  | { sent: true }
  | { sent: false };

const isUserNotFoundError = (error: { message?: string; status?: number; code?: string }) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.status === 404 || message.includes('not found');
};

/**
 * Generates a Supabase recovery token server-side and emails it through the configured SMTP.
 *
 * Returns { sent: false } when the email is not registered, so callers can answer
 * with a generic success message without leaking account existence.
 */
export const createAndSendPasswordReset = async (
  email: string,
): Promise<PasswordResetResult> => {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error('email is required');

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: trimmedEmail,
  });

  if (error) {
    if (isUserNotFoundError(error)) return { sent: false };
    throw error;
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) throw new Error('Supabase did not return a recovery token hash');

  const recoveryLink = buildPasswordRecoveryUrl(tokenHash, {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    PIN_RECOVERY_SERVER_ENABLED: process.env.PIN_RECOVERY_SERVER_ENABLED,
    PIN_RECOVERY_PREVIEW_URL: process.env.PIN_RECOVERY_PREVIEW_URL,
    PIN_RECOVERY_PREVIEW_ALLOWED_HOST:
      process.env.PIN_RECOVERY_PREVIEW_ALLOWED_HOST,
  });
  try {
    await sendEmail(
      trimmedEmail,
      `${BRAND_NAME}: recupera tu PIN`,
      buildEmailHtml(recoveryLink),
      buildEmailText(recoveryLink),
      { requireTransportEncryption: true },
    );
  } catch {
    throw new Error('password_reset_email_delivery_failed');
  }

  return { sent: true };
};

export default createAndSendPasswordReset;
