import type { GiftCard } from '@/types/giftcard';

export const resolveSiteUrl = (fallback = 'https://www.masushi.cl') =>
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || fallback).replace(/\/$/, '');

export const imageForGiftcardAmount = (amount: number) => {
  if (amount >= 100000) return '/images/giftcards/giftcard-100000.jpg';
  if (amount >= 50000) return '/images/giftcards/giftcard-50000.jpg';
  return '/images/giftcards/giftcard-20000.jpg';
};

export const buildGiftcardEmailHtml = (card: GiftCard, opts?: { baseUrl?: string }) => {
  const site = (opts?.baseUrl || resolveSiteUrl()).replace(/\/$/, '');
  const img = `${site}${imageForGiftcardAmount(card.amount_total)}`;
  const senderName = card.purchaser_name?.trim() || 'Un cliente de Masushi';
  const recipientName = card.recipient_name?.trim() || 'ti';
  return `
    <div style="font-family:Arial,sans-serif;color:#111;">
      <p>¡Tu gift card está lista!</p>
      <p>Este es un regalo especialmente para ti 🎁 <strong>${recipientName}</strong>, con cariño de <strong>${senderName}</strong>. Para que la uses cuando quieras.</p>
      <p>Monto: <strong>$${card.amount_total.toLocaleString('es-CL')}</strong></p>
      <p>Código: <strong style="font-family:monospace;letter-spacing:1px;">${card.code}</strong></p>
      <p>Esta gift card es valida para utilizarla en nuestra pagina web.<br />Puedes usarla parcialmente hasta agotar el saldo y se asocia a la primera cuenta que ingrese el código.</p>
      <div style="margin-top:16px; max-width:640px; border-radius:16px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.25);">
        <table role="presentation" width="100%" height="420" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; background:url('${img}') center/cover no-repeat;">
          <tr>
            <td align="right" valign="bottom" style="padding:0 20px 13px 40px;">
              <span style="display:inline-block; background:#ffffff; color:#111; padding:10px 18px; border-radius:8px; font-family:monospace; letter-spacing:2px; font-size:18px; box-shadow:0 4px 12px rgba(0,0,0,0.18); min-width:190px; text-align:center;">
                ${card.code}
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
};

export const buildGiftcardEmailText = (card: GiftCard) => {
  const senderName = card.purchaser_name?.trim() || 'Un cliente de Masushi';
  const recipientName = card.recipient_name?.trim() || 'ti';
  return `Tu gift card Masushi está activa. Monto: $${card.amount_total.toLocaleString('es-CL')}. Código: ${card.code}. Este es un regalo especialmente para ti ( ${recipientName} ), con cariño de ${senderName}. Para que la uses cuando quieras.`;
};
