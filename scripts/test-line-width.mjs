// Script de prueba de ancho de línea para WhatsApp
// Ejecutar con: node scripts/test-line-width.mjs

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const TEST_PHONE = process.env.LOCAL_WHATSAPP_NUMBER || '56951869402';

async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN) {
    console.error('❌ Faltan variables de entorno WHATSAPP_API_URL o WHATSAPP_TOKEN');
    return { ok: false, error: 'Missing credentials' };
  }

  const body = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message }
  };

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, body: data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de ancho de línea para WhatsApp...\n');
  console.log(`📱 Enviando a: ${TEST_PHONE}\n`);

  const tests = [
    { name: 'TEST 1', content: '-'.repeat(50), description: '50 guiones' },
    { name: 'TEST 2', content: '-'.repeat(45), description: '45 guiones' },
    { name: 'TEST 3', content: '-'.repeat(40), description: '40 guiones' },
    { name: 'TEST 4', content: '-'.repeat(35), description: '35 guiones' },
    { name: 'TEST 5', content: '-'.repeat(30), description: '30 guiones' },
    { name: 'TEST 6', content: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345', description: '32 letras mayúsculas' },
    { name: 'TEST 7', content: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', description: '36 letras' },
    { name: 'TEST 8', content: 'Cod:003 | x2 | Total:$19.800' + '-'.repeat(10), description: 'Texto real + guiones' },
    { name: 'TEST 9', content: '*Cod:003* | x2 | Total:$19.800' + '-'.repeat(10), description: 'Con negrita + guiones' },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const message = `${test.name} (${test.description}):\n${test.content}`;
    
    console.log(`📤 ${test.name}: ${test.description}...`);
    const result = await sendWhatsAppMessage(TEST_PHONE, message);
    
    if (result.ok) {
      console.log(`   ✅ Enviado exitosamente`);
    } else {
      console.log(`   ❌ Error: ${result.error || JSON.stringify(result.body)}`);
    }
    
    // Esperar 2 segundos entre mensajes para no saturar la API
    if (i < tests.length - 1) {
      await sleep(2000);
    }
  }

  console.log('\n✅ Todas las pruebas completadas!\n');
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Abre WhatsApp en tu Redmi Note 11');
  console.log('2. Encuentra el último TEST donde la línea NO se rompe (cabe todo en una línea)');
  console.log('3. Ese número será el valor de CHARS_PER_LINE que debemos usar');
  console.log('\nEjemplo:');
  console.log('  - Si TEST 4 (35 guiones) cabe en una línea → CHARS_PER_LINE = 35');
  console.log('  - Si TEST 3 (40 guiones) cabe en una línea → CHARS_PER_LINE = 40');
  console.log('  - Para letras el valor será menor (probablemente entre 30-36)');
}

runTests().catch(console.error);
