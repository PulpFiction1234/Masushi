/**
 * Script para medir el ancho de línea en WhatsApp
 * 
 * Este script envía mensajes de prueba con diferentes longitudes
 * para determinar cuántos caracteres caben en una línea del Redmi Note 11
 */

import { sendWhatsAppMessage } from '../src/utils/sendWhatsapp.js';

const testPhone = process.env.TEST_PHONE || '56951869402'; // Reemplaza con tu número de prueba

async function testLineWidths() {
  console.log('🧪 Iniciando pruebas de ancho de línea...\n');

  // Prueba 1: Línea con guiones
  const test1 = '-'.repeat(50);
  console.log('📤 Enviando 50 guiones...');
  await sendWhatsAppMessage(testPhone, `TEST 1 (50 guiones):\n${test1}`);
  await sleep(2000);

  // Prueba 2: Línea con guiones
  const test2 = '-'.repeat(45);
  console.log('📤 Enviando 45 guiones...');
  await sendWhatsAppMessage(testPhone, `TEST 2 (45 guiones):\n${test2}`);
  await sleep(2000);

  // Prueba 3: Línea con guiones
  const test3 = '-'.repeat(40);
  console.log('📤 Enviando 40 guiones...');
  await sendWhatsAppMessage(testPhone, `TEST 3 (40 guiones):\n${test3}`);
  await sleep(2000);

  // Prueba 4: Línea con guiones
  const test4 = '-'.repeat(35);
  console.log('📤 Enviando 35 guiones...');
  await sendWhatsAppMessage(testPhone, `TEST 4 (35 guiones):\n${test4}`);
  await sleep(2000);

  // Prueba 5: Texto mixto (más realista)
  const test5 = 'Cod:003 | x2 | Total:$19.800' + '-'.repeat(20);
  console.log('📤 Enviando texto mixto...');
  await sendWhatsAppMessage(testPhone, `TEST 5 (texto + guiones):\n${test5}`);
  await sleep(2000);

  // Prueba 6: Letras (ocupan más espacio que guiones)
  const test6 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
  console.log('📤 Enviando 32 letras...');
  await sendWhatsAppMessage(testPhone, `TEST 6 (32 letras):\n${test6}`);
  await sleep(2000);

  // Prueba 7: Letras
  const test7 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  console.log('📤 Enviando 36 letras...');
  await sendWhatsAppMessage(testPhone, `TEST 7 (36 letras):\n${test7}`);
  await sleep(2000);

  console.log('\n✅ Pruebas completadas!');
  console.log('\n📋 Instrucciones:');
  console.log('1. Revisa los mensajes en WhatsApp');
  console.log('2. Identifica cuál es el último que cabe en UNA línea sin romper');
  console.log('3. Ese número será nuestro LINE_UNITS');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testLineWidths().catch(console.error);
