import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';
import { requireAdmin } from '@/server/adminAuthorization';

// Admin: lista mensajes registrados desde el webhook de WhatsApp Cloud API.
// Params: ?phone=569xxx (filtra por from_number) & ?limit=50 (max 200)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authorization = await requireAdmin(req, res);
  if (!authorization.authorized) return res.status(authorization.status).end();

  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
  const parsedLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;

  try {
    let query = supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .order('timestamp_ms', { ascending: false })
      .order('created_at', { ascending: false });

    if (phone) {
      query = query.eq('from_number', phone);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[admin:whatsapp-messages] error fetching messages', error);
      return res.status(500).json({ error: error.message || String(error) });
    }

    return res.status(200).json({ messages: data || [] });
  } catch (e: unknown) {
    console.error('[admin:whatsapp-messages] exception', e);
    const message = e && typeof e === 'object' && 'message' in e ? e.message : undefined;
    return res.status(500).json({ error: message || String(e) });
  }
}
