export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';
import { buildFullName } from '@/utils/name';
import type { GiftCard } from '@/types/giftcard';

const ALLOWED_AMOUNTS = [20000, 50000, 100000];

const generateCode = (length = 12): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

async function uniqueCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 8) {
    const code = generateCode(12);
    const { data } = await supabaseAdmin
      .from('gift_cards')
      .select('id')
      .eq('code', code)
      .limit(1);
    if (!data || data.length === 0) return code;
    attempts += 1;
  }
  throw new Error('No se pudo generar un código único. Intenta nuevamente.');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const userId = session.user.id;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .or(`purchased_by_user_id.eq.${userId},claimed_by_user_id.eq.${userId}`);

      if (error) throw error;
      return res.status(200).json({ giftCards: (data ?? []) as GiftCard[] });
    } catch (e: any) {
      console.error('[giftcards/index GET] error', e);
      return res.status(500).json({ error: 'No se pudieron obtener tus gift cards' });
    }
  }

  if (req.method === 'POST') {
    try {
      const amount = Number(req.body?.amount ?? 0);
      if (!ALLOWED_AMOUNTS.includes(amount)) {
        return res.status(400).json({ error: 'Monto inválido. Usa 20000, 50000 o 100000.' });
      }

      const recipientEmailRaw = typeof req.body?.recipientEmail === 'string' ? req.body.recipientEmail.trim() : '';
      const recipientNameRaw = typeof req.body?.recipientName === 'string' ? req.body.recipientName.trim() : '';

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, apellido_paterno, apellido_materno, phone')
        .eq('id', userId)
        .maybeSingle();

      const purchaserName = buildFullName(profile?.full_name || '', profile?.apellido_paterno || '', profile?.apellido_materno || '') || session.user.email || 'Cliente';
      const purchaserEmail = session.user.email || null;

      const code = await uniqueCode();
      const nowIso = new Date().toISOString();

      const insertPayload = {
        code,
        amount_total: amount,
        amount_remaining: amount,
        status: 'pending' as const,
        purchased_by_user_id: userId,
        purchaser_email: purchaserEmail,
        purchaser_name: purchaserName,
        recipient_email: recipientEmailRaw || null,
        recipient_name: recipientNameRaw || null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const { data, error } = await supabaseAdmin
        .from('gift_cards')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      return res.status(201).json({ giftCard: data as GiftCard });
    } catch (e: any) {
      console.error('[giftcards/index POST] error', e);
      return res.status(500).json({ error: e?.message || 'No se pudo crear la gift card' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
