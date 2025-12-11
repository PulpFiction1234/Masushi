import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import supabaseAdmin from '@/server/supabase'
import { sendWhatsAppMessage } from '@/utils/sendWhatsapp'

export const runtime = 'nodejs'

function extractPhoneNumberIdFromUrl(apiUrl?: string | null): string | null {
  if (!apiUrl) return null
  const match = apiUrl.match(/\/([0-9]{6,})\/messages/i)
  return match ? match[1] : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('is_admin, role')
    .eq('id', session.user.id)
    .single()
  if (profileErr || !profile) return res.status(403).json({ error: 'Forbidden' })
  const isAdmin = Boolean((profile as any).is_admin || (profile as any).role === 'admin')
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const toRaw = typeof req.body?.to === 'string' ? req.body.to : ''
  const textRaw = typeof req.body?.text === 'string' ? req.body.text : ''
  const buttonPayload = typeof req.body?.buttonPayload === 'string' ? req.body.buttonPayload : ''
  const buttonTitle = typeof req.body?.buttonTitle === 'string' ? req.body.buttonTitle : ''
  const to = toRaw.replace(/\D/g, '')
  const text = textRaw.trim()

  if (!to || to.length < 8) return res.status(400).json({ error: 'Destinatario inválido' })
  if (!text && !buttonPayload) return res.status(400).json({ error: 'Texto o payload requerido' })

  let sendResult
  let persistedType = 'text'
  let persistedText = text
  if (buttonPayload) {
    // Enviar como "presionar" botón: type button con payload
    persistedType = 'button'
    persistedText = buttonTitle || buttonPayload
    try {
      const apiUrl = process.env.WHATSAPP_API_URL
      const token = process.env.WHATSAPP_TOKEN
      if (!apiUrl || !token) {
        return res.status(500).json({ error: 'WhatsApp API config missing' })
      }
      const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'button',
        button: { payload: buttonPayload },
      }
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const respText = await resp.text()
      let parsed: any = respText
      try { parsed = JSON.parse(respText) } catch (e) { /* keep raw */ }
      sendResult = { ok: resp.ok, status: resp.status, body: parsed, error: resp.ok ? undefined : 'Provider returned error' }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err)
      return res.status(500).json({ error: msg })
    }
  } else {
    sendResult = await sendWhatsAppMessage(to, text)
  }

  if (!sendResult?.ok) {
    return res.status((sendResult && sendResult.status) || 500).json({ error: sendResult?.error || 'Envio falló', body: sendResult?.body })
  }

  const body: any = sendResult?.body
  const waId = body?.messages?.[0]?.id || null
  const fromNumber = to // usamos el número del cliente como clave de conversación
  const phoneNumberId = extractPhoneNumberIdFromUrl(process.env.WHATSAPP_API_URL)

  try {
    const { error } = await supabaseAdmin.from('whatsapp_messages').insert({
      wa_id: waId,
      from_number: fromNumber,
      to_number: phoneNumberId,
      profile_name: null,
      type: persistedType,
      text_body: persistedText,
      direction: 'out',
      payload: body ?? null,
      timestamp_ms: Date.now(),
    })
    if (error) {
      console.error('[admin:whatsapp-send] failed to persist outgoing msg', error)
      return res.status(500).json({ error: 'Enviado pero no se pudo guardar en DB', body })
    }
  } catch (err: any) {
    console.error('[admin:whatsapp-send] exception persisting', err)
    return res.status(500).json({ error: 'Enviado pero error al guardar', body })
  }

  return res.status(200).json({ ok: true, wa_id: waId, body })
}
