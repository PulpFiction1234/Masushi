import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';

/**
 * GET /api/address-overrides
 * Público — devuelve todas las direcciones override para que AddressSearch
 * las use en la validación de zona de reparto, sin requerir autenticación.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabaseAdmin
    .from('address_overrides')
    .select('id, display_label, lng, lat')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ overrides: data ?? [] });
}
