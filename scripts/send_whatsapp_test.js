#!/usr/bin/env node
// Simple test script to send a WhatsApp template message using env vars
// Usage:
//   node scripts/send_whatsapp_test.js <toNumber> <templateName> <lang> [param1] [param2] ...
// Example:
//   node scripts/send_whatsapp_test.js 56912345678 order_ready es_CL "Juan" "1234" "20:00"

const fetch = globalThis.fetch || require('node-fetch');

async function main() {
  const [,, to, templateName, lang = 'es_CL', ...params] = process.argv;

  if (!to || !templateName) {
    console.error('Usage: node scripts/send_whatsapp_test.js <toNumber> <templateName> <lang> [param1] [param2] ...');
    process.exit(1);
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;

  if (!apiUrl || !token) {
    console.error('Missing WHATSAPP_API_URL or WHATSAPP_TOKEN in environment. Set them and try again.');
    process.exit(1);
  }

  // Build body parameters from remaining CLI args
  const bodyParams = params.map(p => ({ type: 'text', text: String(p) }));

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: bodyParams,
        },
      ],
    },
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }

    console.log('Status:', res.status);
    console.log('Response:', parsed);
    if (!res.ok) process.exit(2);
    process.exit(0);
  } catch (err) {
    console.error('Request failed:', err && err.message ? err.message : String(err));
    process.exit(3);
  }
}

main();
