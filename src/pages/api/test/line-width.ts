import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppMessage } from '@/utils/sendWhatsapp';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testPhone = process.env.LOCAL_WHATSAPP_NUMBER || '56951869402';
  const results: any[] = [];

  try {
    console.log('🧪 Iniciando pruebas de ancho de línea...\n');

    // Prueba 1: 50 guiones
    const test1 = '-'.repeat(50);
    console.log('📤 Enviando 50 guiones...');
    const result1 = await sendWhatsAppMessage(testPhone, `TEST 1 (50 guiones):\n${test1}`);
    results.push({ test: 1, chars: 50, type: 'guiones', result: result1 });
    await sleep(2000);

    // Prueba 2: 45 guiones
    const test2 = '-'.repeat(45);
    console.log('📤 Enviando 45 guiones...');
    const result2 = await sendWhatsAppMessage(testPhone, `TEST 2 (45 guiones):\n${test2}`);
    results.push({ test: 2, chars: 45, type: 'guiones', result: result2 });
    await sleep(2000);

    // Prueba 3: 40 guiones
    const test3 = '-'.repeat(40);
    console.log('📤 Enviando 40 guiones...');
    const result3 = await sendWhatsAppMessage(testPhone, `TEST 3 (40 guiones):\n${test3}`);
    results.push({ test: 3, chars: 40, type: 'guiones', result: result3 });
    await sleep(2000);

    // Prueba 4: 35 guiones
    const test4 = '-'.repeat(35);
    console.log('📤 Enviando 35 guiones...');
    const result4 = await sendWhatsAppMessage(testPhone, `TEST 4 (35 guiones):\n${test4}`);
    results.push({ test: 4, chars: 35, type: 'guiones', result: result4 });
    await sleep(2000);

    // Prueba 5: Texto mixto
    const test5 = 'Cod:003 | x2 | Total:$19.800' + '-'.repeat(20);
    console.log('📤 Enviando texto mixto...');
    const result5 = await sendWhatsAppMessage(testPhone, `TEST 5 (texto + guiones):\n${test5}`);
    results.push({ test: 5, content: test5, type: 'mixto', result: result5 });
    await sleep(2000);

    // Prueba 6: 32 letras
    const test6 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    console.log('📤 Enviando 32 letras...');
    const result6 = await sendWhatsAppMessage(testPhone, `TEST 6 (32 letras):\n${test6}`);
    results.push({ test: 6, chars: 32, type: 'letras', result: result6 });
    await sleep(2000);

    // Prueba 7: 36 letras
    const test7 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    console.log('📤 Enviando 36 letras...');
    const result7 = await sendWhatsAppMessage(testPhone, `TEST 7 (36 letras):\n${test7}`);
    results.push({ test: 7, chars: 36, type: 'letras', result: result7 });
    await sleep(2000);

    // Prueba 8: Ejemplo real de producto
    const test8 = '*Cod:003* | x2 | Total:$19.800' + '-'.repeat(15);
    console.log('📤 Enviando ejemplo real...');
    const result8 = await sendWhatsAppMessage(testPhone, `TEST 8 (producto real):\n${test8}`);
    results.push({ test: 8, content: test8, type: 'real', result: result8 });

    console.log('\n✅ Pruebas completadas!');

    return res.status(200).json({
      success: true,
      message: 'Pruebas enviadas. Revisa WhatsApp y dime cuál es el último test que cabe en UNA línea sin romper.',
      instructions: [
        '1. Revisa los mensajes en WhatsApp',
        '2. Identifica el último test que cabe en UNA línea sin romper',
        '3. Si es TEST 4 (35 guiones), entonces CHARS_PER_LINE = 35',
        '4. Si es TEST 3 (40 guiones), entonces CHARS_PER_LINE = 40',
        '5. Para letras, el número será menor (test 6 o 7)'
      ],
      results
    });

  } catch (error) {
    console.error('Error en pruebas:', error);
    return res.status(500).json({ 
      error: 'Error ejecutando pruebas', 
      details: error instanceof Error ? error.message : String(error),
      results 
    });
  }
}
