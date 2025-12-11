export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';

const isAdminUser = async (userId: string): Promise<boolean> => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) return false;
  return Boolean((profile as any).is_admin || (profile as any).role === 'admin');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const userId = session.user.id;

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'DELETE') {
    try {
      const codeRaw = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
      const idRaw = Number(req.body?.id);
      if (!codeRaw && !Number.isInteger(idRaw)) {
        return res.status(400).json({ error: 'Se requiere code o id' });
      }

      const { error: delErr } = await (codeRaw
        ? supabaseAdmin.from('gift_cards').delete().eq('code', codeRaw)
        : supabaseAdmin.from('gift_cards').delete().eq('id', idRaw));
      if (delErr) throw delErr;
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      console.error('[admin/giftcards DELETE] error', e);
      return res.status(500).json({ error: 'No se pudo eliminar la gift card' });
    }
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const statuses = statusParam ? statusParam.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const limitParam = Number(req.query.limit ?? 200);
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 200;

  try {
    const query = supabaseAdmin
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statuses && statuses.length > 0) {
      query.in('status', statuses);
    }

    const { data: cards, error } = await query;
    if (error) throw error;

    if (!cards || cards.length === 0) {
      return res.status(200).json({ giftCards: [], usages: [] });
    }

    const ids = cards.map((c) => c.id).filter((id) => typeof id === 'number');

    const { data: usages, error: usageErr } = await supabaseAdmin
      .from('gift_card_usages')
      .select('gift_card_id, amount_used, used_at, order_id, user_id')
      .in('gift_card_id', ids);

    if (usageErr) throw usageErr;

    const usageMap = new Map<number, { total: number; count: number; last_used_at: string | null }>();
    (usages || []).forEach((u) => {
      const id = Number(u.gift_card_id);
      const current = usageMap.get(id) || { total: 0, count: 0, last_used_at: null };
      current.total += Number(u.amount_used) || 0;
      current.count += 1;
      const ts = u.used_at ? new Date(u.used_at).toISOString() : null;
      if (ts && (!current.last_used_at || ts > current.last_used_at)) current.last_used_at = ts;
      usageMap.set(id, current);
    });

    const enriched = cards.map((c) => {
      const u = usageMap.get(c.id) || { total: 0, count: 0, last_used_at: null };
      return { ...c, usage_total: u.total, usage_count: u.count, last_used_at: u.last_used_at };
    });

    return res.status(200).json({ giftCards: enriched });
  } catch (e: any) {
    console.error('[admin/giftcards] error', e);
    return res.status(500).json({ error: 'No se pudieron obtener las gift cards' });
  }
}
