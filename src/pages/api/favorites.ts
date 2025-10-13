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
    // Obtener favoritos del usuario
    const { data, error } = await supabase
      .from('favorites')
      .select('product_code')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ favorites: data.map(f => f.product_code) });
  }

  if (req.method === 'POST') {
    // Agregar favorito
    const { productCode } = req.body;

    if (!productCode) {
      return res.status(400).json({ error: 'productCode is required' });
    }

    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, product_code: productCode });

    if (error) {
      // Si ya existe, no es error
      if (error.code === '23505') {
        return res.status(200).json({ success: true });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    // Eliminar favorito
    const { productCode } = req.query;

    if (!productCode || typeof productCode !== 'string') {
      return res.status(400).json({ error: 'productCode is required' });
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_code', productCode);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
