export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';
import { buildFullName } from '@/utils/name';
import type { GiftCard } from '@/types/giftcard';

const resolveSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.masushi.cl';

const imageForAmount = (amount: number) => {
  if (amount >= 100000) return '/images/giftcards/giftcard-100000.jpg';
  if (amount >= 50000) return '/images/giftcards/giftcard-50000.jpg';
  return '/images/giftcards/giftcard-20000.jpg';
};

const buildEmailHtml = (card: GiftCard) => {
  const site = resolveSiteUrl().replace(/\/$/, '');
  const img = `${site}${imageForAmount(card.amount_total)}`;
  return `
    <div style="font-family:Arial,sans-serif;color:#111;">
      <p>¡Tu gift card está lista!</p>
      <p>Monto: <strong>$${card.amount_total.toLocaleString('es-CL')}</strong></p>
      <p>Código: <strong style="font-family:monospace;letter-spacing:1px;">${card.code}</strong></p>
      <p>Puedes usarla parcialmente hasta agotar el saldo. Se asocia a la primera cuenta que ingrese el código.</p>
      <div style="margin-top:16px; max-width:640px; border-radius:16px; overflow:hidden; position:relative; box-shadow:0 12px 30px rgba(0,0,0,0.25);">
        <img src="${img}" alt="Gift card Masushi" style="display:block; width:100%; height:auto;" />
        <div style="margin-top:-78px; text-align:right; padding-right:60px;">
          <span style="display:inline-block; background:#ffffff; color:#111; padding:10px 18px; border-radius:8px; font-family:monospace; letter-spacing:2px; font-size:18px; box-shadow:0 4px 12px rgba(0,0,0,0.18); min-width:220px; text-align:center;">
            ${card.code}
          </span>
        </div>
      </div>
    </div>
  `;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('role, is_admin')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileErr || !profile) return res.status(403).json({ error: 'Forbidden' });
  const isAdmin = Boolean((profile as any).is_admin || (profile as any).role === 'admin');
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const codeRaw = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!codeRaw) return res.status(400).json({ error: 'Código requerido' });

  try {
    const { data: card, error } = await supabaseAdmin
      .from('gift_cards')
      .select('*')
      .eq('code', codeRaw)
      .maybeSingle();

    if (error) throw error;
    if (!card) return res.status(404).json({ error: 'Gift card no encontrada' });

    if (card.status === 'exhausted') return res.status(400).json({ error: 'Gift card agotada' });
    if (card.status === 'disabled') return res.status(400).json({ error: 'Gift card desactivada' });

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('gift_cards')
      .update({ status: 'active', activated_at: nowIso, activated_by: session.user.id, updated_at: nowIso })
      .eq('id', card.id)
      .select('*')
      .maybeSingle();

    if (updateErr) throw updateErr;
    const finalCard = (updated || card) as GiftCard;

    const targetEmail = finalCard.recipient_email || finalCard.purchaser_email || session.user.email || null;
    const targetName = finalCard.recipient_name || finalCard.purchaser_name || buildFullName('', '', '');

    if (targetEmail) {
      const subject = 'Tu gift card Masushi fue activada';
      const html = buildEmailHtml(finalCard);
      const text = `Tu gift card Masushi está activa. Monto: $${finalCard.amount_total.toLocaleString('es-CL')}. Código: ${finalCard.code}`;
      try {
        await sendEmail(targetEmail, subject, html, text);
      } catch (err) {
        console.error('[admin/giftcards/activate] email error', err);
      }
    }

    return res.status(200).json({ giftCard: finalCard, notified: Boolean(targetEmail) });
  } catch (e: any) {
    console.error('[admin/giftcards/activate] error', e);
    return res.status(500).json({ error: 'No se pudo activar la gift card' });
  }
}
