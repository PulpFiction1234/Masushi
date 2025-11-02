import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const MAX_ADDRESSES_PER_USER = 2;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const userId = session.user.id;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ addresses: data });
  }

  if (req.method === 'POST') {
    const { label, address, coords, numeroCasa } = (req.body ?? {}) as {
      label?: string;
      address?: string;
      coords?: { lat?: number; lng?: number } | null;
      numeroCasa?: string | null;
    };
    if (!address) return res.status(400).json({ error: 'address is required' });

    const { count: existingCount, error: countError } = await supabase
      .from('addresses')
      .select('*', { head: true, count: 'exact' })
      .eq('user_id', userId);

    if (countError) return res.status(500).json({ error: countError.message });
    if ((existingCount ?? 0) >= MAX_ADDRESSES_PER_USER) {
      return res.status(400).json({ error: 'ADDRESS_LIMIT_REACHED' });
    }

    const sanitizedLabel = label ? String(label).trim().slice(0, 64) : null;
    const coordsPayload: Record<string, unknown> = {};
    const lat = typeof coords?.lat === 'number' ? coords.lat : undefined;
    const lng = typeof coords?.lng === 'number' ? coords.lng : undefined;
    if (typeof lat === 'number' && typeof lng === 'number') {
      coordsPayload.lat = lat;
      coordsPayload.lng = lng;
    }
    const numeroCasaTrimmed = typeof numeroCasa === 'string' ? numeroCasa.trim() : '';
    if (numeroCasaTrimmed) {
      coordsPayload.numeroCasa = numeroCasaTrimmed;
    }
    if (Object.keys(coordsPayload).length > 0) {
      coordsPayload.metaVersion = 1;
    }

    const payload = {
      user_id: userId,
      label: sanitizedLabel,
      address_text: address,
      coords: Object.keys(coordsPayload).length > 0 ? coordsPayload : null,
    };

    const { data, error } = await supabase
      .from('addresses')
      .insert(payload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ address: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { data, error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
