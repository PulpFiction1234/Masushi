// scripts/sendWhatsapp.js
const axios = require('axios');
const token = 'EAAZApZAYHKmFIBPrqmyZCllZBctQCg9zEvJiRxlLMu2uTjg0lIl8Nfbxf4HrGSR0N32obTmu9XOWJxHtbiZAvrgubkJJvile5JsXRrEROYd4PNlm7ZAarWoYRcXzCcZAiUxn1AAZC9dFZCtfNaQmzoABlcezctmbWj3sTXym2yzvCqPyuO98SGnAKsjShXxCd0GcQ8993glzjHf8XgB4IZAVFbZC1b8FCEDZCORDNjpda4nWJMEhOn1cebZCxD8QM2wZDZD';
const phoneId = '787574747783391';

function getEstimatedDeliveryTime(date) {
  const day = date.getDay();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const time = hour * 60 + minute;
  if (day === 6) {
    if (time >= 13*60+30 && time < 15*60+30) return '30 a 50 min';
    if (time >= 15*60+30 && time < 19*60) return '30 a 45 min';
    if (time >= 19*60 && time < 22*60+30) return '60 a 80 min';
  }
  if (day === 5) {
    if (time >= 18*60 && time < 19*60+30) return '30 a 50 min';
    if (time >= 19*60+30 && time < 21*60+30) return '60 a 90 min';
    if (time >= 21*60+30 && time < 22*60+30) return '30 a 50 min';
  }
  if (day === 4) {
    if (time >= 18*60 && time < 19*60+30) return '30 a 50 min';
    if (time >= 19*60+30 && time < 21*60+30) return '50 a 70 min';
    if (time >= 21*60+30 && time < 22*60+30) return '30 a 50 min';
  }
  if (day >= 1 && day <= 3) {
    if (time >= 18*60 && time < 19*60+30) return '30 a 45 min';
    if (time >= 19*60+30 && time < 21*60+30) return '45 a 60 min';
    if (time >= 21*60+30 && time < 22*60+30) return '30 a 45 min';
  }
  return 'Fuera de horario de reparto';
}

function sendWhatsapp(to, nombreCliente) {
  const tiempo = getEstimatedDeliveryTime(new Date());
  const mensaje = `Hola ${nombreCliente}, tu pedido fue recibido y el tiempo estimado de entrega es: ${tiempo}. ¡Gracias por elegirnos!`;
  return axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: mensaje }
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

// Ejemplo de uso:
// sendWhatsapp('569XXXXXXXX', 'Rafael')
//   .then(res => console.log('Enviado:', res.data))
//   .catch(err => console.error('Error:', err.response?.data || err.message));

module.exports = { sendWhatsapp, getEstimatedDeliveryTime };
