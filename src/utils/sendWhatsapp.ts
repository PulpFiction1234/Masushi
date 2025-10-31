/**
 * sendWhatsAppMessage
 * - to: full phone number in international format without +, e.g. 56912345678
 * - message: plain text message
 *
 * Env vars used:
 * - WHATSAPP_API_URL: base url for provider (e.g. https://graph.facebook.com/v16.0/<PHONE_NUMBER_ID>/messages)
 * - WHATSAPP_TOKEN: bearer token or API key
 * - WHATSAPP_SENDER: id of sender (phone number id for Meta WhatsApp Cloud API)
 */

type SendResult = { ok: boolean; status: number; body?: unknown; error?: string };

export async function sendWhatsAppMessage(to: string, message: string): Promise<SendResult> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const sender = process.env.WHATSAPP_SENDER; // used for some providers

  if (!apiUrl || !token) {
    return { ok: false, status: 500, error: 'WhatsApp API config missing' };
  }

  try {
    // Default assume Meta/WhatsApp Cloud API JSON body
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    // If sender is required by provider (Meta uses endpoint with PHONE_NUMBER_ID and token)
    // send request
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

  const respBody = await res.text();
  let parsed: unknown = respBody;
  try { parsed = JSON.parse(respBody); } catch (e) { /* keep text */ }

    if (!res.ok) {
      return { ok: false, status: res.status, body: parsed, error: 'Provider returned error' };
    }

    return { ok: true, status: res.status, body: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 500, error: msg };
  }
}

/**
 * sendWhatsAppTemplate
 * - to: recipient phone number digits only
 * - templateName: string name of approved template
 * - languageCode: language code like 'es_CL' or 'en_US'
 * - components: optional array to fill template components (header/body/rows)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = 'es_CL',
  components?: unknown[]
): Promise<SendResult> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;

  if (!apiUrl || !token) {
    return { ok: false, status: 500, error: 'WhatsApp API config missing' };
  }

  try {
    const body: {
      messaging_product: 'whatsapp';
      to: string;
      type: 'template';
      template: {
        name: string;
        language: { code: string };
        components?: unknown[];
      };
    } = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components) body.template.components = components;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const respText = await res.text();
    let parsed: unknown = respText;
    try { parsed = JSON.parse(respText); } catch (e) { /* keep raw */ }
    if (!res.ok) return { ok: false, status: res.status, body: parsed, error: 'Provider error' };
    return { ok: true, status: res.status, body: parsed };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 500, error: msg };
  }
}
