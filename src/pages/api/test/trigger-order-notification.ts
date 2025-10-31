import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppTemplate } from '@/utils/sendWhatsapp';

// Test endpoint to simulate order notification and send the approved template
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { phone, customerName, orderId, eta, address, detail, total, templateName, templateLang } = req.body;

  if (!phone) return res.status(400).json({ error: 'phone required' });

  const tpl = templateName || process.env.WHATSAPP_TEMPLATE_NAME;
  const lang = templateLang || process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL';

  if (!tpl) return res.status(500).json({ error: 'Template name not configured' });

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || '' },
        { type: 'text', text: String(orderId || '') },
        { type: 'text', text: String(eta || '') },
        { type: 'text', text: String(address || '') },
        { type: 'text', text: String(detail || '') },
        { type: 'text', text: String(total ?? '') },
      ],
    },
  ];

  try {
    const result = await sendWhatsAppTemplate(String(phone).replace(/\D/g, ''), tpl, lang, components as any[]);
    if (!result.ok) return res.status(result.status || 500).json({ ok: false, error: result.error, body: result.body });
    return res.status(200).json({ ok: true, body: result.body });
  } catch (e: any) {
    console.error('[test/trigger-order-notification] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
