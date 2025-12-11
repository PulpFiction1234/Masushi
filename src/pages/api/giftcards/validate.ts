export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';
import type { GiftCard } from '@/types/giftcard';

const normalizeCode = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = session.user.id;
  const code = normalizeCode(req.body?.code);
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  try {
    const { data: card, error } = await supabaseAdmin
      .from('gift_cards')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) throw error;
    if (!card) return res.status(404).json({ error: 'Gift card no encontrada' });

    if (card.status === 'pending') return res.status(400).json({ error: 'Aún no está activada por el admin' });
    if (card.status === 'disabled') return res.status(400).json({ error: 'Gift card desactivada' });
    if (card.amount_remaining <= 0 || card.status === 'exhausted') return res.status(400).json({ error: 'Gift card agotada' });

    // Asociar a la primera cuenta que la use
    if (!card.claimed_by_user_id) {
      const { data: updated, error: claimErr } = await supabaseAdmin
        .from('gift_cards')
        .update({ claimed_by_user_id: userId, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', card.id)
        .eq('claimed_by_user_id', null)
        .select('*')
        .maybeSingle();

      if (claimErr) throw claimErr;
      if (updated) {
        return res.status(200).json({ giftCard: updated as GiftCard });
      }

      // Si alguien la reclamó en la carrera, refetch para verificar dueño
      const { data: claimedCard } = await supabaseAdmin
        .from('gift_cards')
        .select('*')
        .eq('id', card.id)
        .maybeSingle();

      if (claimedCard?.claimed_by_user_id && claimedCard.claimed_by_user_id !== userId) {
        return res.status(400).json({ error: 'Este código ya se asoció a otra cuenta' });
      }

      return res.status(200).json({ giftCard: claimedCard as GiftCard });
    }

    if (card.claimed_by_user_id !== userId) {
      return res.status(400).json({ error: 'Este código ya se asoció a otra cuenta' });
    }

    return res.status(200).json({ giftCard: card as GiftCard });
  } catch (e: any) {
    console.error('[giftcards/validate] error', e);
    return res.status(500).json({ error: 'No se pudo validar la gift card' });
  }
}
