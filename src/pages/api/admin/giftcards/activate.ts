export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';
import sendEmail from '@/utils/sendEmail';
import { buildFullName } from '@/utils/name';
import type { GiftCard } from '@/types/giftcard';
import { buildGiftcardEmailHtml, buildGiftcardEmailText } from '@/server/emails/giftcardEmail';

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
      const html = buildGiftcardEmailHtml(finalCard);
      const text = buildGiftcardEmailText(finalCard);
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
