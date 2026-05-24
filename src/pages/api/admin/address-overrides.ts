import type { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '@/server/supabase';

/**
 * GET  /api/admin/address-overrides  — lista todos los overrides
 * POST /api/admin/address-overrides  — agrega uno nuevo
 *      body: { display_label: string, lng: number, lat: number }
 * DELETE /api/admin/address-overrides?id=123 — elimina por id
 *
 * Protegido por middleware (requiere sesión) y solo accesible por admins.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('address_overrides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ overrides: data ?? [] });
  }

  if (req.method === 'POST') {
    const { display_label, lng, lat } = req.body ?? {};

    if (!display_label || typeof display_label !== 'string' || !display_label.trim()) {
      return res.status(400).json({ error: 'display_label es requerido' });
    }
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return res.status(400).json({ error: 'lng y lat deben ser números' });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Coordenadas fuera de rango' });
    }

    const { data, error } = await supabaseAdmin
      .from('address_overrides')
      .insert({ display_label: display_label.trim(), lng, lat })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ override: data });
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const { error } = await supabaseAdmin
      .from('address_overrides')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
