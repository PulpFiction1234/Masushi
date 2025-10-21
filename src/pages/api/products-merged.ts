import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { productos as staticProductos } from '../../data/productos';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!serviceUrl || (!serviceRoleKey && !anonKey)) {
    console.error('products-merged missing SUPABASE config', { serviceUrl: !!serviceUrl, serviceRoleKey: !!serviceRoleKey, anonKey: !!anonKey });
    return res.status(500).json({ error: 'Missing Supabase config' });
  }

  const keyToUse = serviceRoleKey ?? anonKey!;
  const svc = createClient(serviceUrl, keyToUse, { auth: { persistSession: false } });
  try {
    const { data: overrides, error } = await svc.from('product_overrides').select('*');
    if (error) throw error;
    const map = new Map<string, boolean>();
    (overrides || []).forEach((o: any) => { if (o && o.codigo) map.set(o.codigo, !!o.enabled); });

    const merged = staticProductos.map((p) => {
      const override = map.get(p.codigo);
      // Normalize image to a string URL for JSON transport
      let imagen: string | undefined;
      if (typeof p.imagen === 'string') imagen = p.imagen;
      else if (p.imagen && typeof p.imagen === 'object' && 'src' in p.imagen) imagen = (p.imagen as any).src;

      return {
        ...p,
        imagen,
        // ensure enabled present and boolean
        enabled: typeof override === 'boolean' ? override : (p.enabled ?? true),
      };
    });

    return res.status(200).json({ products: merged });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? String(e) });
  }
}
