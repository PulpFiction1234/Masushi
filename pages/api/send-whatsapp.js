// pages/api/send-whatsapp.js
import { sendOrderTemplate } from '../../scripts/sendWhatsapp';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { telefono, nombre, numeroOrden, horaEntrega, direccion, detalle, total } = req.body;
  try {
    await sendOrderTemplate(
      telefono,
      nombre,
      numeroOrden,
      horaEntrega,
      direccion,
      detalle,
      total
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
}
