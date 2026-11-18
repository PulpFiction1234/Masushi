import * as nodemailer from 'nodemailer';
import { getSmtpTransportSecurityOptions } from '@/utils/smtpTransportSecurity';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'no-reply@example.com';

export type SendEmailOptions = {
  requireTransportEncryption?: boolean;
};

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  // Not throwing here to keep dev environment flexible; sendEmail will throw if used without config
  console.warn('SMTP credentials are not fully configured. Emails will fail until SMTP_HOST/SMTP_USER/SMTP_PASS are set.');
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string,
  options: SendEmailOptions = {},
) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS in env');
  }

  const securityOptions = getSmtpTransportSecurityOptions(
    SMTP_PORT,
    options.requireTransportEncryption,
  );
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    ...securityOptions,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    text: text || undefined,
    html,
  });

  return info;
}

export default sendEmail;
