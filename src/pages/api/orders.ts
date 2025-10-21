import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'GET') {
    // Obtener últimos 5 pedidos del usuario
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching orders:', error);
      // Si la tabla no existe, devolver array vacío en vez de error
      if (error.code === '42P01') {
        return res.status(200).json({ orders: [] });
      }
      return res.status(500).json({ error: error.message, code: error.code });
    }

    return res.status(200).json({ orders: data || [] });
  }

  if (req.method === 'POST') {
    // Crear nuevo pedido
    const { items, total, delivery_type, address } = req.body;

    if (!items || !total || !delivery_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items,
        total,
        delivery_type,
        address: address || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
