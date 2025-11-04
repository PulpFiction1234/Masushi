// Script de prueba adicional para medir ancho exacto
// Ejecutar con: node scripts/test-line-width-extended.mjs

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const TEST_PHONE = process.env.LOCAL_WHATSAPP_NUMBER || '56951869402';

async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN) {
    console.error('❌ Faltan variables de entorno');
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
  console.log('🧪 Pruebas adicionales de ancho de línea...\n');
  console.log(`📱 Enviando a: ${TEST_PHONE}\n`);

  const tests = [
    { name: 'TEST A', content: '-'.repeat(55), description: '55 guiones' },
    { name: 'TEST B', content: '-'.repeat(60), description: '60 guiones' },
    { name: 'TEST C', content: '-'.repeat(65), description: '65 guiones' },
    { name: 'TEST D', content: '-'.repeat(70), description: '70 guiones' },
    { name: 'TEST E', content: 'abcdefghijklmnopqrstuvwxyz0123456789', description: '36 letras minúsculas' },
    { name: 'TEST F', content: 'abcdefghijklmnopqrstuvwxyz0123456789abcd', description: '40 letras minúsculas' },
    { name: 'TEST G', content: 'abcdefghijklmnopqrstuvwxyz0123456789abcdefgh', description: '44 letras minúsculas' },
    { name: 'TEST H', content: 'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmn', description: '50 letras minúsculas' },
    { name: 'TEST I', content: 'Cod:003 | x2 | Obs:(Con extra de cibullete) | Total:$19.800', description: 'Texto real con obs' },
    { name: 'TEST J', content: '*Cod:008* | x1 | Prot: Salmón+Pollo | Acomp: Queso crema+Palmito | Env: Panko', description: 'Armalo real' },
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const message = `${test.name} (${test.description}):\n${test.content}`;
    
    console.log(`📤 ${test.name}: ${test.description}...`);
    const result = await sendWhatsAppMessage(TEST_PHONE, message);
    
    if (result.ok) {
      console.log(`   ✅ Enviado`);
    } else {
      console.log(`   ❌ Error: ${result.error || JSON.stringify(result.body)}`);
    }
    
    if (i < tests.length - 1) {
      await sleep(2000);
    }
  }

  console.log('\n✅ Todas las pruebas completadas!\n');
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Revisa los tests A, B, C, D para guiones');
  console.log('2. Revisa los tests E, F, G, H para letras minúsculas');
  console.log('3. Revisa los tests I y J para texto real');
  console.log('4. Dime cuál es el ÚLTIMO de cada tipo que cabe en UNA línea');
  console.log('\nEjemplo:');
  console.log('  - "TEST C (65 guiones) cabe en una línea pero TEST D (70) se rompe"');
  console.log('  - "TEST G (44 letras) cabe pero TEST H (50) se rompe"');
}

runTests().catch(console.error);
