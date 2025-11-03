import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '@/utils/sendWhatsapp';
import { notifyLocalNewOrder } from '@/utils/notifyLocalNewOrder';
import sendEmail from '@/utils/sendEmail';
import supabaseAdmin from '@/server/supabase';
import { normalizePhone } from '@/utils/phone';
import { getEstimateRange, formatEstimate, getEstimateWindow, formatWindow } from '@/utils/estimateTimes';
import { fmt } from '@/utils/checkout';
import { computeBirthdayEligibility, BIRTHDAY_COUPON_CODE } from '@/server/birthdayEligibility';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'GET') {
    // Obtener últimos 5 pedidos del usuario
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching orders:', error);
      // Si la tabla no existe, devolver array vacío en vez de error
      if (error.code === '42P01') {
        return res.status(200).json({ orders: [] });
      }
      return res.status(500).json({ error: error.message, code: error.code });
    }

    return res.status(200).json({
      orders: data || [],
      totalOrders: typeof count === 'number' ? count : (data?.length ?? 0),
    });
  }

  if (req.method === 'POST') {
    // Crear nuevo pedido
    const { items, total, delivery_type, address, customer, coupon_code } = req.body;

    if (!items || !total || !delivery_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const originalTotal = typeof total === 'number' ? total : Number(total);
    if (!Number.isFinite(originalTotal)) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Map delivery_type to smallint expected by DB: 0 = retiro, 1 = delivery
    let deliveryTypeValue: number | null = null;
    if (typeof delivery_type === 'string') {
      if (delivery_type === 'delivery') deliveryTypeValue = 1;
      else if (delivery_type === 'retiro') deliveryTypeValue = 0;
      else {
        // try numeric parse
        const n = Number(delivery_type);
        deliveryTypeValue = Number.isInteger(n) ? n : null;
      }
    } else if (typeof delivery_type === 'number') {
      deliveryTypeValue = delivery_type;
    }

    if (deliveryTypeValue === null) return res.status(400).json({ error: 'Invalid delivery_type' });

    // Antes de insertar, validar cupón si es provisto
    const normalizedCoupon = typeof coupon_code === 'string' ? coupon_code.trim().toUpperCase() : null;
  let finalTotal = originalTotal;
  let appliedCoupon: { id: number | null; code: string; type: 'manual' | 'birthday'; percent?: number; amount?: number } | null = null;
  let discountAmount = 0;
  let discountLabel: string | null = null;
    if (normalizedCoupon === BIRTHDAY_COUPON_CODE) {
      try {
        const eligibility = await computeBirthdayEligibility(userId);
        if (!eligibility.eligibleNow) {
          return res.status(400).json({ error: 'No cumples con los requisitos para el descuento de cumpleaños' });
        }
        finalTotal = Math.max(0, Math.round(originalTotal * (100 - eligibility.discountPercent) / 100));
        discountLabel = `Descuento cumpleaños (${eligibility.discountPercent}%)`;
        appliedCoupon = { id: null, code: BIRTHDAY_COUPON_CODE, type: 'birthday', percent: eligibility.discountPercent };
      } catch (error) {
        console.error('Error validating birthday coupon:', error);
        return res.status(500).json({ error: 'Error validando el cupón de cumpleaños' });
      }
    } else if (normalizedCoupon) {
      try {
        const { data: coupons, error: couponErr } = await supabaseAdmin
          .from('discount_codes')
          .select('*')
          .eq('code', normalizedCoupon)
          .eq('user_id', userId)
          .limit(1);

        if (couponErr) throw couponErr;

        const coupon = coupons && coupons[0];
        const now = new Date();
        if (!coupon || coupon.used) {
          return res.status(400).json({ error: 'Cupón inválido o ya usado' });
        }
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
          return res.status(400).json({ error: 'Cupón expirado' });
        }

        if (typeof coupon.percent === 'number') {
          finalTotal = Math.max(0, Math.round(originalTotal * (100 - coupon.percent) / 100));
        } else if (typeof coupon.amount === 'number') {
          finalTotal = Math.max(0, originalTotal - coupon.amount);
        }

        const percent = typeof coupon.percent === 'number' ? coupon.percent : undefined;
        const amount = typeof coupon.amount === 'number' ? coupon.amount : undefined;
        const labelSuffix = percent != null ? ` (${percent}% desc)` : '';
        discountLabel = `Cupón ${coupon.code}${labelSuffix}`;
        appliedCoupon = { id: coupon.id, code: coupon.code, type: 'manual', percent, amount };
      } catch (e) {
        console.error('Error validating coupon:', e);
        return res.status(500).json({ error: 'Error validating coupon' });
      }
    }

    discountAmount = Math.max(0, originalTotal - finalTotal);
    if (discountAmount <= 0) {
      discountAmount = 0;
      discountLabel = null;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items,
        total: finalTotal,
        delivery_type: deliveryTypeValue,
        address: address || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const mode: 'delivery' | 'retiro' = delivery_type === 'delivery' ? 'delivery' : 'retiro';
    const nowEstimate = new Date();
    const rangeForEta = getEstimateRange(mode, nowEstimate);
    const windowForEta = getEstimateWindow(mode, nowEstimate);
    const formattedWindow = formatWindow(windowForEta);
    const estimatedText = formattedWindow
      || (rangeForEta ? formatEstimate(rangeForEta) : (mode === 'delivery' ? 'Tiempo estimado de entrega' : 'Tiempo estimado de retiro'));
    const pickupLabel = process.env.STORE_PICKUP_LABEL || 'Retiro en local Masushi';
    const deliveryFallback = process.env.STORE_DELIVERY_FALLBACK || 'Dirección de entrega';
    const direccionResolved = (address && String(address).trim()) || (mode === 'delivery' ? deliveryFallback : pickupLabel);

    // Build template variables and send WhatsApp notifications (awaited, return results)
  const whatsappResults: Array<{ target?: string; type?: 'template' | 'text' | 'template-local'; result?: unknown } | { warning: string }> = [];
    try {
      // Prefer server-side profile values when available (safer than trusting client payload)
      let customerName = '';
      let customerPhoneRaw = '';
      try {
        const { data: profileData, error: profileErr } = await supabaseAdmin
          .from('profiles')
          .select('full_name, phone')
          .eq('id', userId)
          .single();

        if (!profileErr && profileData) {
          customerName = (profileData as any).full_name || '';
          customerPhoneRaw = (profileData as any).phone || '';
        }
      } catch (e) {
        console.warn('Could not fetch profile for user', userId, e);
      }

      // Allow client to override if profile lacks phone/name (but prefer DB values)
      if (!customerName && customer?.name) customerName = customer.name;
      if (!customerPhoneRaw && customer?.phone) customerPhoneRaw = customer.phone;
      const phoneNormalized = normalizePhone(customerPhoneRaw);

      // Helper to sanitize template parameters: remove newlines/tabs and collapse multiple spaces
      const sanitizeParam = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return s.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
      };

      const pickFirstString = (...values: unknown[]) => {
        for (const value of values) {
          if (typeof value === 'string' && value.trim()) {
            return value;
          }
        }
        return '';
      };

      const detalle = Array.isArray(items)
        ? items.map((it: unknown) => {
            const item = it as { nombre?: unknown; codigo?: unknown; cantidad?: unknown; valor?: unknown };
            const nombre = typeof item.nombre === 'string' ? item.nombre : (typeof item.codigo === 'string' ? String(item.codigo) : '');
            const cantidad = typeof item.cantidad === 'number' ? item.cantidad : 1;
            const valor = typeof item.valor === 'number' ? item.valor : '';
            return `${nombre || ''} x${cantidad} - $${valor}`;
          }).join('\n')
        : '';

  const totalResolved = typeof data.total === 'number' ? data.total : finalTotal;
  const totalText = fmt(totalResolved);

      // Use provided template name or fallback to approved `confirmacion_orden`
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'confirmacion_orden';
      if (templateName && (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_TOKEN)) {
        const warning = 'WHATSAPP_TEMPLATE_NAME is set but WHATSAPP_API_URL or WHATSAPP_TOKEN is missing. Templates will not be sent.';
        console.warn(warning);
        whatsappResults.push({ warning });
      }

      if (phoneNormalized) {
        if (templateName) {
          const components: any[] = [];
          const headerImageLink = process.env.WHATSAPP_TEMPLATE_HEADER_LINK; // optional env var with public image URL
          if (headerImageLink) {
            components.push({ type: 'header', parameters: [ { type: 'image', image: { link: String(headerImageLink) } } ] });
          }

          components.push({
            type: 'body',
            parameters: [
              { type: 'text', text: sanitizeParam(customerName) },
              { type: 'text', text: sanitizeParam(`${data.id}`) },
              { type: 'text', text: sanitizeParam(estimatedText) },
              { type: 'text', text: sanitizeParam(direccionResolved) },
              { type: 'text', text: sanitizeParam(detalle) },
              { type: 'text', text: sanitizeParam(`${totalResolved}`) },
            ],
          });

          const sent = await sendWhatsAppTemplate(phoneNormalized, templateName, process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL', components);
          whatsappResults.push({ target: phoneNormalized, type: 'template', result: sent });
        } else {
          const etaText = estimatedText;
          const templateUser = `¡Hola! ${customerName}, tu orden #${data.id} ya está en cocina.\n\nHora de entrega estimada: ${etaText}\nDirección: ${direccionResolved}\n\nDetalle:\n${detalle}\n\nTotal: ${totalText}\n\nGracias por preferirnos 🍣🥢`;
          const sent = await sendWhatsAppMessage(phoneNormalized, templateUser);
          whatsappResults.push({ target: phoneNormalized, type: 'text', result: sent });
        }
      } else {
        whatsappResults.push({ warning: 'No customer phone provided or could not be normalized' });
      }

      const internalNumber = process.env.INTERNAL_WHATSAPP_NUMBER;
      if (internalNumber) {
        if (templateName) {
          const internalComponents = [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: sanitizeParam(`${data.id}`) },
                { type: 'text', text: sanitizeParam(customerName) },
                { type: 'text', text: sanitizeParam(phoneNormalized) },
                { type: 'text', text: sanitizeParam(estimatedText) },
                { type: 'text', text: sanitizeParam(direccionResolved) },
                { type: 'text', text: sanitizeParam(detalle) },
              ],
            },
          ];
          const sentInternal = await sendWhatsAppTemplate(internalNumber.replace(/\D/g, ''), templateName, process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL', internalComponents);
          whatsappResults.push({ target: internalNumber.replace(/\D/g, ''), type: 'template', result: sentInternal });
        } else {
          const templateInternal = `Nuevo pedido #${data.id}\nCliente: ${customerName}\nTel: ${phoneNormalized}\nHora de entrega estimada: ${estimatedText}\nDireccion: ${direccionResolved}\nTotal: ${totalText}\n\nDetalle:\n${detalle}`;
          const sentInternal = await sendWhatsAppMessage(internalNumber.replace(/\D/g, ''), templateInternal);
          whatsappResults.push({ target: internalNumber.replace(/\D/g, ''), type: 'text', result: sentInternal });
        }
      }

      const cleanCode = (raw: unknown) => {
        if (typeof raw !== 'string') return '---';
        const trimmed = raw.trim();
        if (!trimmed) return '---';
        const match = trimmed.match(/\d{2,3}/);
        return match ? match[0] : trimmed.replace(/\|/g, '').trim() || '---';
      };

      const normalizeObservation = (raw: unknown) => {
        if (typeof raw !== 'string') return '';
        return raw
          .replace(/\b(de|en|con)\s+/gi, '')
          .replace(/\s*\bextra\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const padLine = (text: string, width = 37, filler = '-') => {
        const cleaned = text.trim();
        if (cleaned.length >= width) return cleaned.slice(0, width);
        return cleaned + filler.repeat(width - cleaned.length);
      };

      const formatLine = (parts: string[]) => padLine(parts.filter(Boolean).join(' | '));

      const localProductLines = Array.isArray(items)
        ? (items as unknown[])
            .flatMap((raw: unknown) => {
              if (!raw || typeof raw !== 'object') return [];
              const entry = raw as {
                codigo?: unknown;
                nombre?: unknown;
                cantidad?: unknown;
                valor?: unknown;
                opcion?: { id?: unknown; label?: unknown } | null;
              };

              const code = cleanCode(entry.codigo);
              const quantityRaw = typeof entry.cantidad === 'number' ? entry.cantidad : Number(entry.cantidad);
              const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
              const unitRaw = typeof entry.valor === 'number' ? entry.valor : Number(entry.valor);
              const unitPrice = Number.isFinite(unitRaw) ? unitRaw : 0;
              const lineTotal = unitPrice * quantity;
              const pricePart = Number.isFinite(lineTotal) && lineTotal > 0 ? fmt(lineTotal) : '';

              const optionLabel = entry.opcion && typeof entry.opcion === 'object' && typeof (entry.opcion as any).label === 'string'
                ? String((entry.opcion as any).label)
                : '';

              const isArmalo = entry.opcion && typeof entry.opcion === 'object' && typeof (entry.opcion as any).id === 'string'
                ? String((entry.opcion as any).id).startsWith('armalo:')
                : false;

              const observation = !isArmalo ? normalizeObservation(optionLabel) : '';
              const obsSegment = observation ? `Obs:(${observation})` : '';

              const baseLineParts = [
                `Cod:${code}`,
                `x${quantity}`,
                obsSegment,
                pricePart ? `Total:${pricePart}` : '',
              ];

              const lines: string[] = [formatLine(baseLineParts)];

              if (isArmalo) {
                const label = typeof optionLabel === 'string' ? optionLabel : '';
                const segments = label.split('·').map((seg) => seg.trim()).filter(Boolean);
                if (segments.length === 0 && label.trim()) segments.push(label.trim());
                segments.forEach((segment, idx) => {
                  const cleaned = segment
                    .replace(/^P:\s*/i, 'Prot: ')
                    .replace(/^A:\s*/i, 'Acomp: ')
                    .replace(/^Env:\s*/i, 'Env: ')
                    .replace(/\s+/g, ' ')
                    .trim();
                  const prefix = idx === 0 ? 'Det:' : '    ';
                  lines.push(formatLine([`${prefix}${cleaned}`]));
                });
              }

              return lines;
            })
        : [];

      const detailSections: string[] = [];
      if (localProductLines.length) {
        detailSections.push(...localProductLines);
      } else {
        detailSections.push('Sin productos registrados');
      }
      if (discountAmount > 0) {
        const discountLine = `${discountLabel ?? 'Descuento aplicado'}: -${fmt(discountAmount)}`;
        detailSections.push('', discountLine);
      }

      const localDetailText = detailSections.join('\n').replace(/\n{3,}/g, '\n\n').trim();

      let extrasText = '';
      if (typeof req.body?.extras === 'string') {
        extrasText = req.body.extras;
      } else if (Array.isArray(req.body?.extras)) {
        extrasText = req.body.extras
          .map((entry: unknown) =>
            typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean' ? String(entry) : ''
          )
          .filter(Boolean)
          .join('\n');
      } else if (typeof req.body?.extrasText === 'string') {
        extrasText = req.body.extrasText;
      } else if (typeof req.body?.extra_text === 'string') {
        extrasText = req.body.extra_text;
      }

      const observationsText = pickFirstString(
        req.body?.observaciones,
        req.body?.observations,
        req.body?.observation,
        req.body?.notes,
        req.body?.note,
        customer?.observacion,
        customer?.observations,
        customer?.observation,
        customer?.notes,
        customer?.note
      );

      const localNotify = await notifyLocalNewOrder({
        orderId: data.id,
        customerName,
        customerPhone: phoneNormalized || customerPhoneRaw || '',
        address: direccionResolved,
        detail: localDetailText || detalle,
        totalLabel: totalText,
        extras: extrasText,
        observations: observationsText,
      });

      if ('skipped' in localNotify) {
        whatsappResults.push({ warning: `Local WhatsApp skipped: ${localNotify.reason}` });
      } else {
        whatsappResults.push({ target: localNotify.target, type: 'template-local', result: localNotify.result });
      }
    } catch (e) {
      console.error('Error sending WhatsApp notifications', e);
      whatsappResults.push({ warning: `Error sending WhatsApp notifications: ${e instanceof Error ? e.message : String(e)}` });
    }

    // Si se aplicó un cupón, marcarlo como usado y referenciar el pedido
    if (appliedCoupon?.type === 'manual' && appliedCoupon.id && data?.id) {
      try {
        await supabaseAdmin
          .from('discount_codes')
          .update({ used: true, used_at: new Date().toISOString(), used_by_order_id: data.id })
          .eq('id', appliedCoupon.id);
      } catch (e) {
        console.error('Error marking coupon used:', e);
      }
    }

    // Contar pedidos del usuario en el mes actual
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data: monthData, count, error: countErr } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth);

      if (countErr) console.error('Error counting monthly orders:', countErr);

      const ordersThisMonth = typeof count === 'number' ? count : (Array.isArray(monthData) ? monthData.length : 0);

      // Si justo alcanzó 7 pedidos este mes, generar código y enviarlo por correo
      if (ordersThisMonth === 7) {
        try {
          const generateCode = (len = 8) => {
            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let s = '';
            for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
            return s;
          };

          let newCode = generateCode(8);
          // asegurar unicidad simple (re-intentar si existe)
          let attempts = 0;
          while (attempts < 5) {
            const { data: existing } = await supabaseAdmin.from('discount_codes').select('id').eq('code', newCode).limit(1);
            if (!existing || existing.length === 0) break;
            newCode = generateCode(8);
            attempts++;
          }

          // insertar código (10% por defecto, expira en 30 días)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          const { data: insertedCode, error: insertErr } = await supabaseAdmin
            .from('discount_codes')
            .insert({ user_id: userId, code: newCode, percent: 10, single_use: true, expires_at: expiresAt.toISOString() })
            .select()
            .single();

          if (insertErr) throw insertErr;

          // Enviar correo al usuario con el código
          const userEmail = session.user.email;
          if (userEmail) {
            const subject = '¡Gracias! Aquí está tu código de descuento';
            const html = `<p>¡Felicitaciones! Has completado 7 pedidos este mes. Aquí tienes un código de descuento del 10% para tu próxima compra:</p>
<h2 style="font-family:monospace;">${newCode}</h2>
<p>Este código es de uso único y está vinculado a tu cuenta. Expira en 30 días.</p>`;
            try {
              await sendEmail(userEmail, subject, html, `Tu código: ${newCode}`);
            } catch (e) {
              console.error('Error sending discount email:', e);
            }
          }
        } catch (e) {
          console.error('Error generating/sending discount code:', e);
        }
      }
    } catch (e) {
      console.error('Error checking monthly orders:', e);
    }

    return res.status(200).json({ order: data, whatsapp: whatsappResults });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
