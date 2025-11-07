import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/server/supabase';
import { sendWhatsAppTemplate, sendWhatsAppMessage } from '@/utils/sendWhatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  // Check profile is admin
  try {
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (profileErr || !profile || !(profile as any).is_admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (e) {
    console.warn('Error checking admin profile', e);
    return res.status(500).json({ error: 'Server error' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, example_order_id, name, eta, address, detail, total, use_template = true, headerLink } = req.body ?? {};

  if (!to) return res.status(400).json({ error: 'Missing "to" phone number (digits only or with +)' });

  // Normalize remove non-digits
  const toDigits = to.toString().replace(/\D/g, '');

  const sanitizeParam = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
  };

  try {
    if (use_template && process.env.WHATSAPP_TEMPLATE_NAME) {
      const components: any[] = [];

      // Header image can be supplied via request body `headerLink` or env var `WHATSAPP_TEMPLATE_HEADER_LINK`.
      const headerImageLink = headerLink || process.env.WHATSAPP_TEMPLATE_HEADER_LINK;
      if (headerImageLink) {
        components.push({
          type: 'header',
          parameters: [ { type: 'image', image: { link: String(headerImageLink) } } ]
        });
      }

      components.push({
        type: 'body',
        parameters: [
          { type: 'text', text: sanitizeParam(name || 'Cliente') },              // {{1}} - nombre
          { type: 'text', text: sanitizeParam(String(example_order_id || 'TEST')) }, // {{2}} - pedido
          { type: 'text', text: sanitizeParam(eta || 'Tiempo de entrega') },     // {{3}} - hora estimada
          { type: 'text', text: sanitizeParam(address || 'Dirección') },         // {{4}} - dirección
        ],
      });

      const sent = await sendWhatsAppTemplate(toDigits, process.env.WHATSAPP_TEMPLATE_NAME, process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL', components);
      return res.status(200).json({ ok: true, method: 'template', to: toDigits, result: sent });
    }

    // Fallback: plain text
    const msg = `¡Hola ${name || 'Cliente'}! Tu pedido #${example_order_id || 'TEST'} ha sido recibido exitosamente y ya está en preparación. 🍣\n\nHora estimada de entrega: ${eta || 'Tiempo de entrega'}\nDirección: ${address || 'Dirección'}`;
    const sent = await sendWhatsAppMessage(toDigits, msg);
    return res.status(200).json({ ok: true, method: 'text', to: toDigits, result: sent });
  } catch (e) {
    console.error('Error sending test whatsapp', e);
    return res.status(500).json({ error: 'Error sending message', detail: e instanceof Error ? e.message : String(e) });
  }
}
