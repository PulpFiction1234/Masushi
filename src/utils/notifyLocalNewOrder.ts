import { sendWhatsAppTemplate } from '@/utils/sendWhatsapp';

export type LocalOrderPayload = {
  orderId: number | string;
  customerName: string;
  customerPhone: string;
  address: string;
  detail: string;
  totalLabel: string;
  extras?: string;
  observations?: string;
};

type TemplateResult = Awaited<ReturnType<typeof sendWhatsAppTemplate>>;

type NotifyResult =
  | { target: string; result: TemplateResult }
  | { skipped: true; reason: string };

const sanitize = (value: unknown) => {
  if (value == null) return '';
  const normalized = String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t+/g, ' ');

  const separator = '\n';
  const flattened = normalized
    .split('\n')
    .map((line) => line.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join(separator);

  return flattened.replace(/ {2,}/g, ' ').trim();
};

const sanitizedOrFallback = (value: unknown, fallback: string) => {
  const cleaned = sanitize(value);
  return cleaned ? cleaned : fallback;
};

export async function notifyLocalNewOrder(payload: LocalOrderPayload): Promise<NotifyResult> {
  const target = process.env.LOCAL_WHATSAPP_NUMBER || '';
  if (!target) {
    return { skipped: true, reason: 'LOCAL_WHATSAPP_NUMBER env var is missing' };
  }

  const digits = target.replace(/\D/g, '');
  if (!digits) {
    return { skipped: true, reason: 'LOCAL_WHATSAPP_NUMBER does not contain digits' };
  }

  const templateName = process.env.LOCAL_WHATSAPP_TEMPLATE || 'nuevo_pedido_local';
  if (!templateName) {
    return { skipped: true, reason: 'LOCAL_WHATSAPP_TEMPLATE is empty' };
  }

  const parameters = [
    { type: 'text' as const, text: sanitizedOrFallback(payload.orderId, 'N/A') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.customerName, 'Cliente') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.customerPhone, 'Sin teléfono') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.address, 'Sin dirección') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.detail, 'Sin detalle') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.totalLabel, '$0') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.extras, 'Sin extras') },
    { type: 'text' as const, text: sanitizedOrFallback(payload.observations, 'Sin observaciones') },
  ];

  const components = [
    {
      type: 'body',
      parameters,
    },
  ];

  const result = await sendWhatsAppTemplate(
    digits,
    templateName,
    process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL',
    components
  );

  return { target: digits, result };
}
