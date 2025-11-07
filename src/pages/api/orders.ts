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

      // Use provided template name or fallback to approved `confirmacion_cliente`
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'confirmacion_cliente';
      if (templateName && (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_TOKEN)) {
        const warning = 'WHATSAPP_TEMPLATE_NAME is set but WHATSAPP_API_URL or WHATSAPP_TOKEN is missing. Templates will not be sent.';
        console.warn(warning);
        whatsappResults.push({ warning });
      }

      // Envío de WhatsApp al cliente
      // Template: ¡Hola {{1}}! Tu pedido #{{2}} ha sido recibido exitosamente y ya está en preparación. 🍣
      // Hora estimada de entrega: {{3}} (el tiempo de espera puede variar según la demanda)
      // Dirección: {{4}}
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
              { type: 'text', text: sanitizeParam(customerName) },           // {{1}} - nombre del cliente
              { type: 'text', text: sanitizeParam(`${data.id}`) },           // {{2}} - número de pedido
              { type: 'text', text: sanitizeParam(estimatedText) },          // {{3}} - rango de hora estimada (ej: "19:00 - 19:40")
              { type: 'text', text: sanitizeParam(direccionResolved) },      // {{4}} - dirección
            ],
          });

          const sent = await sendWhatsAppTemplate(phoneNormalized, templateName, process.env.WHATSAPP_TEMPLATE_LANG || 'es_CL', components);
          whatsappResults.push({ target: phoneNormalized, type: 'template', result: sent });
        } else {
          const etaText = estimatedText;
          const templateUser = `¡Hola ${customerName}! Tu pedido #${data.id} ha sido recibido exitosamente y ya está en preparación. 🍣\n\nHora estimada de entrega: ${etaText} (el tiempo de espera puede variar según la demanda)\nDirección: ${direccionResolved}`;
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
        
        // Caso especial: Promo handrolls mantiene 4 dígitos
        if (trimmed === '0057') return '0057';
        
        // Por defecto, extraer 3 dígitos (ej: 041, 052)
        const match = trimmed.match(/\d{3}/);
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

      // Formatear precio para WhatsApp sin espacios (evita que se rompa la línea)
      const fmtWhatsApp = (n: number): string => {
        const formatted = fmt(n); // Usa el formato normal: "$ 19.800"
        return formatted.replace(/\s+/g, ''); // Quita espacios: "$19.800"
      };

      const extractBeverageFlavor = (nombre: string): string => {
        if (!nombre) return '';
        
        const lower = nombre.toLowerCase();
        
        // Mapeo de sabores/variantes comunes
        if (lower.includes('zero')) return 'Zero';
        if (lower.includes('original')) return 'Original';
        if (lower.includes('mango')) return 'Mango';
        if (lower.includes('piña') || lower.includes('pina')) {
          if (lower.includes('coco')) return 'Piña-Coco';
          return 'Piña';
        }
        if (lower.includes('sandía') || lower.includes('sandia')) return 'Sandía';
        if (lower.includes('uva')) return 'Uva';
        if (lower.includes('sprite')) return 'Sprite';
        if (lower.includes('verde')) return 'Verde';
        if (lower.includes('1.5') || lower.includes('litro')) return '1.5L';
        
        // Si no encuentra un sabor específico, intentar extraer la primera palabra relevante
        const palabras = nombre.split(' ');
        if (palabras.length >= 2) {
          // Buscar la palabra que no sea "Coca", "Cola", "Arizona", "Jumex", "Monster", "lata", "botella"
          const ignore = ['coca', 'cola', 'arizona', 'jumex', 'monster', 'lata', 'botella', 'ml', 'nectar', 'bebida', 'jugo'];
          for (const palabra of palabras) {
            const p = palabra.toLowerCase();
            if (!ignore.includes(p) && p.length > 2) {
              return palabra;
            }
          }
        }
        
        return '';
      };

      // Configuración para Redmi Note 11 (basado en pruebas reales)
      // Pruebas confirmadas: 65 guiones, 35 letras minúsculas, 29 letras mayúsculas
      const CHARS_PER_LINE = 65; // Línea base usando guiones
      
      const padLine = (text: string, charsPerLine = CHARS_PER_LINE, filler = '-') => {
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (!normalized) return filler.repeat(charsPerLine);

        // Calcular el "peso" visual de cada carácter basado en pruebas reales
        // 65 guiones = 1 línea → 1 guion = 1 unidad
        // 35 minúsculas = 1 línea → 1 minúscula = 65/35 = 1.857 unidades
        // 29 mayúsculas = 1 línea → 1 mayúscula = 65/29 = 2.241 unidades
        let visualWeight = 0;
        for (const char of normalized) {
          if (char === '-' || char === '_') {
            visualWeight += 1.0; // Guion = unidad base
          } else if (char === ' ') {
            visualWeight += 0.8; // Espacios un poco menos
          } else if (/[*|:]/.test(char)) {
            visualWeight += 1.0; // Símbolos delgados
          } else if (/[a-z0-9ñáéíóúü]/.test(char)) {
            visualWeight += 1.857; // Minúsculas (65/35)
          } else if (/[A-ZÑÁÉÍÓÚÜ]/.test(char)) {
            visualWeight += 2.241; // Mayúsculas (65/29)
          } else if (/[(),.$]/.test(char)) {
            visualWeight += 1.2; // Puntuación
          } else {
            visualWeight += 1.857; // Otros caracteres = minúsculas por defecto
          }
        }

        // Calcular cuántas líneas necesitamos
        const linesNeeded = Math.ceil(visualWeight / charsPerLine);
        // Margen proporcional: 8-10% menos para evitar exceso de guiones
        // Esto deja espacio para el • y evita que se pase
        const targetWeight = (charsPerLine * linesNeeded) * 0.92;

        // Rellenar con guiones hasta completar las líneas necesarias
        let result = normalized;
        const fillerWeight = 1.0; // Peso del guion
        while (visualWeight + fillerWeight <= targetWeight) {
          result += filler;
          visualWeight += fillerWeight;
        }

        // Agregar separador pegado (sin espacio) para evitar saltos de línea
        return result + '•';
      };

      const formatLine = (parts: string[]) => parts.filter(Boolean).join(' | ').replace(/\s{2,}/g, ' ').trim();

      const normalizeArmaloSegment = (segment: string) => {
        const cleaned = segment.replace(/\s{2,}/g, ' ').trim();
        if (!cleaned) return '';

        const replacements: Array<{ regex: RegExp; label: string }> = [
          { regex: /^P:\s*/i, label: 'Prot' },
          { regex: /^A:\s*/i, label: 'Acomp' },
          { regex: /^E:\s*/i, label: 'Env' },
          { regex: /^Prot\b[:\s]*/i, label: 'Prot' },
          { regex: /^Acomp\b[:\s]*/i, label: 'Acomp' },
          { regex: /^Env\b[:\s]*/i, label: 'Env' },
        ];

        for (const { regex, label } of replacements) {
          if (regex.test(cleaned)) {
            const value = cleaned.replace(regex, '').replace(/^[:\s]+/, '').trim();
            return value ? `${label}: ${value}` : `${label}: -`;
          }
        }

        return cleaned;
      };

      const localProductLines = Array.isArray(items)
        ? (items as unknown[])
            // Ordenar: productos normales primero, "Ármalo a tu gusto" al final
            .sort((a, b) => {
              const aIsArmalo = a && typeof a === 'object' && (
                // Buscar por opcion.id que empiece con 'armalo:'
                ((a as any).opcion && typeof (a as any).opcion === 'object' && typeof (a as any).opcion.id === 'string' && String((a as any).opcion.id).startsWith('armalo:')) ||
                // O buscar por nombre del producto
                (typeof (a as any).nombre === 'string' && String((a as any).nombre).toLowerCase().includes('ármalo a tu gusto'))
              );
              const bIsArmalo = b && typeof b === 'object' && (
                // Buscar por opcion.id que empiece con 'armalo:'
                ((b as any).opcion && typeof (b as any).opcion === 'object' && typeof (b as any).opcion.id === 'string' && String((b as any).opcion.id).startsWith('armalo:')) ||
                // O buscar por nombre del producto
                (typeof (b as any).nombre === 'string' && String((b as any).nombre).toLowerCase().includes('ármalo a tu gusto'))
              );
              
              // Si a es "Ármalo a tu gusto" y b no, a va después (return 1)
              if (aIsArmalo && !bIsArmalo) return 1;
              // Si b es "Ármalo a tu gusto" y a no, a va antes (return -1)
              if (!aIsArmalo && bIsArmalo) return -1;
              // Si ambos son del mismo tipo, mantener orden original
              return 0;
            })
            .map((raw: unknown) => {
              if (!raw || typeof raw !== 'object') return '';
              const entry = raw as {
                codigo?: unknown;
                nombre?: unknown;
                cantidad?: unknown;
                valor?: unknown;
                opcion?: { id?: unknown; label?: unknown } | null;
              };

              const code = cleanCode(entry.codigo);
              const nombre = typeof entry.nombre === 'string' ? entry.nombre : '';
              const quantityRaw = typeof entry.cantidad === 'number' ? entry.cantidad : Number(entry.cantidad);
              const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
              const unitRaw = typeof entry.valor === 'number' ? entry.valor : Number(entry.valor);
              const unitPrice = Number.isFinite(unitRaw) ? unitRaw : 0;
              const lineTotal = unitPrice * quantity;
              const pricePart = Number.isFinite(lineTotal) && lineTotal > 0 ? fmtWhatsApp(lineTotal) : '';

              const optionLabel = entry.opcion && typeof entry.opcion === 'object' && typeof (entry.opcion as any).label === 'string'
                ? String((entry.opcion as any).label)
                : '';

              const isArmalo = entry.opcion && typeof entry.opcion === 'object' && typeof (entry.opcion as any).id === 'string'
                ? String((entry.opcion as any).id).startsWith('armalo:')
                : false;

              // Para bebidas/jugos (códigos 83-89), extraer solo el sabor del nombre
              const isBeverage = code && /^8[3-9]$/.test(code); // Códigos 83-89
              const observation = !isArmalo 
                ? (isBeverage ? extractBeverageFlavor(nombre) : normalizeObservation(optionLabel)) 
                : '';
              
              // Construir líneas de forma inteligente según complejidad
              if (isArmalo) {
                // Producto "Arma tu roll" - formato en una línea con separadores
                const label = typeof optionLabel === 'string' ? optionLabel : '';
                const segments = label.split('·').map((seg) => seg.trim()).filter(Boolean);
                const normalizedSegments = segments.length ? segments : (label.trim() ? [label.trim()] : []);
                
                // Agrupar por tipo (Prot, Acomp, Env)
                const prots: string[] = [];
                const acomps: string[] = [];
                const envs: string[] = [];
                
                normalizedSegments.forEach((segment) => {
                  const formatted = normalizeArmaloSegment(segment);
                  if (!formatted) return;
                  
                  if (formatted.startsWith('Prot:')) {
                    prots.push(formatted.replace('Prot:', '').trim());
                  } else if (formatted.startsWith('Acomp:')) {
                    acomps.push(formatted.replace('Acomp:', '').trim());
                  } else if (formatted.startsWith('Env:')) {
                    envs.push(formatted.replace('Env:', '').trim());
                  }
                });

                // Construir todo en UNA línea con separadores
                const parts: string[] = [`*Cod:${code}*`, `x${quantity}`];
                
                if (prots.length > 0) {
                  parts.push(`Prot: ${prots.join('+')}`);
                }
                if (acomps.length > 0) {
                  parts.push(`Acomp: ${acomps.join('+')}`);
                }
                if (envs.length > 0) {
                  parts.push(`Env: ${envs.join('+')}`);
                }
                if (pricePart) {
                  parts.push(`Total:${pricePart}`);
                }
                
                // Sin padding para evitar límite de 1024 caracteres de WhatsApp
                return formatLine(parts);

              } else {
                // Todos los productos (con o sin observación) usan formato uniforme
                const lineParts: string[] = [`*Cod:${code}*`, `x${quantity}`];
                
                // SIEMPRE incluir campo Obs: (vacío si no hay observación)
                lineParts.push(`Obs:(${observation || ''})`);
                
                if (pricePart) lineParts.push(`Total:${pricePart}`);
                
                // Con padding para completar líneas y separar productos visualmente
                const fullLine = formatLine(lineParts);
                return fullLine ? padLine(fullLine) : '';
              }
            })
            .filter(Boolean)
        : [];

      const detailSections: string[] = [];
      if (localProductLines.length) {
        // Los productos ya están formateados, no agregar separador adicional
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
      // Priorizar el formato detallado si está disponible
      if (req.body?.extrasDetalle) {
        const det = req.body.extrasDetalle;
        const lines: string[] = [];
        
        // Salsas
        if (det.soya > 0 || det.teriyaki > 0) {
          if (det.soya > 0) lines.push(`Soya: ${det.soya}`);
          if (det.teriyaki > 0) lines.push(`Teriyaki: ${det.teriyaki}`);
        } else {
          lines.push('Sin Soya/Teriyaki');
        }
        
        // Jengibre/Wasabi (máximo 1 de cada uno gratis)
        if (det.jengibreGratis > 0 || det.wasabiGratis > 0) {
          if (det.jengibreGratis > 0) lines.push(`Jengibre: Sí`);
          if (det.wasabiGratis > 0) lines.push(`Wasabi: Sí`);
        } else {
          lines.push('Jengibre: No | Wasabi: No');
        }
        
        // Palitos
        if (det.palitosGratis > 0) lines.push(`Palitos: ${det.palitosGratis}`);
        if (det.palitosExtra > 0) lines.push(`Palitos extra: ${det.palitosExtra}`);
        if (det.ayudaPalitos > 0) lines.push(`Ayuda palitos: ${det.ayudaPalitos}`);
        
        extrasText = lines.join(' | ');
      } else if (typeof req.body?.extras === 'string') {
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

      // Debug: verificar observaciones
      console.log('[DEBUG orders.ts] observationsText:', observationsText);
      console.log('[DEBUG orders.ts] req.body.observaciones:', req.body?.observaciones);

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
