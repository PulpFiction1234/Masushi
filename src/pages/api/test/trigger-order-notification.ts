import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppTemplate } from '@/utils/sendWhatsapp';

const sanitizeParam = (value: unknown) => {
  const str = value == null ? '' : String(value);
  return str.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
};

// Test endpoint to simulate order notification and send the approved template
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    phone,
    customerName,
    orderId,
    eta,
    address,
    detail,
    total,
    templateName,
    templateLang,
    headerLink,
  } = req.body ?? {};

  if (!phone) return res.status(400).json({ error: 'phone required' });

  const tpl = templateName || process.env.WHATSAPP_TEMPLATE_NAME;
  const lang = templateLang || process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL';

  if (!tpl) return res.status(500).json({ error: 'Template name not configured' });

  const components: any[] = [];
  const headerImageLink = headerLink || process.env.WHATSAPP_TEMPLATE_HEADER_LINK;
  if (headerImageLink) {
    components.push({
      type: 'header',
      parameters: [{ type: 'image', image: { link: String(headerImageLink) } }],
    });
  }

  components.push({
    type: 'body',
    parameters: [
      { type: 'text', text: sanitizeParam(customerName || '') },
      { type: 'text', text: sanitizeParam(orderId ?? '') },
      { type: 'text', text: sanitizeParam(eta ?? '') },
      { type: 'text', text: sanitizeParam(address ?? '') },
      { type: 'text', text: sanitizeParam(detail ?? '') },
      { type: 'text', text: sanitizeParam(total ?? '') },
    ],
  });

  try {
    const result = await sendWhatsAppTemplate(String(phone).replace(/\D/g, ''), tpl, lang, components);
    if (!result.ok) return res.status(result.status || 500).json({ ok: false, error: result.error, body: result.body });
    return res.status(200).json({ ok: true, body: result.body });
  } catch (e: any) {
    console.error('[test/trigger-order-notification] error', e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
