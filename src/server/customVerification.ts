import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';

const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_EXPIRY_MINUTES = Number(process.env.CUSTOM_VERIFICATION_EXPIRY_MINUTES || 60);
const BRAND_NAME = process.env.APP_BRAND_NAME || 'Masushi';

const generateNumericCode = (length: number = DEFAULT_CODE_LENGTH): string => {
  const digits: string[] = [];
  for (let i = 0; i < length; i += 1) {
    digits.push(Math.floor(Math.random() * 10).toString());
  }
  return digits.join('');
};

const buildEmailHtml = (code: string, expiresAt: Date): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #111827; margin-bottom: 16px;">${BRAND_NAME} — Código de verificación</h2>
      <p style="color: #4b5563; font-size: 15px;">Usa este código para terminar tu registro:</p>
      <div style="margin: 20px 0; padding: 16px 24px; border-radius: 12px; border: 2px solid #ef4444; background: #fef2f2; font-size: 32px; letter-spacing: 12px; font-weight: 700; color: #ef4444; text-align: center; font-family: 'Courier New', Courier, monospace;">
        ${code}
      </div>
      <p style="color: #6b7280; font-size: 14px;">El código expira el <strong>${expiresAt.toLocaleDateString('es-CL')} ${expiresAt.toLocaleTimeString('es-CL')}</strong>.</p>
      <p style="color: #6b7280; font-size: 13px;">Si no solicitaste este correo, puedes ignorarlo.</p>
    </div>
  `;
};

export type CustomVerificationResult = {
  code: string;
  expiresAt: Date;
};

/**
 * Generates a custom verification code, stores it in email_verifications and emails it to the user.
 * Throws if any step fails.
 */
export const createAndSendCustomVerification = async (
  userId: string,
  email: string,
  expiryMinutes: number = DEFAULT_EXPIRY_MINUTES,
): Promise<CustomVerificationResult> => {
  if (!userId) throw new Error('userId is required for custom verification');
  if (!email) throw new Error('email is required for custom verification');

  const trimmedEmail = email.trim().toLowerCase();
  const code = generateNumericCode();
  const expiresAt = new Date(Date.now() + Math.max(expiryMinutes, 1) * 60 * 1000);

  // Mark previous codes as used to avoid confusion.
  await supabaseAdmin.from('email_verifications').update({ used: true }).eq('user_id', userId).eq('used', false);

  const { error: insertErr } = await supabaseAdmin.from('email_verifications').insert({
    user_id: userId,
    code,
    used: false,
    expires_at: expiresAt.toISOString(),
  });
  if (insertErr) {
    console.error('[customVerification] insert error', insertErr);
    throw new Error(insertErr.message || 'No se pudo registrar el código alternativo');
  }

  const html = buildEmailHtml(code, expiresAt);
  const text = `Tu código de verificación para ${BRAND_NAME} es ${code}. Expira el ${expiresAt.toLocaleString('es-CL')}.`;

  await sendEmail(trimmedEmail, `${BRAND_NAME}: código de verificación`, html, text);

  return { code, expiresAt };
};

export default createAndSendCustomVerification;
