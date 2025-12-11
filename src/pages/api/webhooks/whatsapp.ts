import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import supabaseAdmin from '@/server/supabase'

// Simple webhook endpoint for WhatsApp Cloud API status updates.
// - GET: used by Meta to verify the webhook (hub.mode=subscribe & hub.verify_token & hub.challenge)
// - POST: receives events and appends them to logs/whatsapp-webhook.log

export const config = {
  api: {
    bodyParser: false, // necesitamos el raw body para validar firma correctamente
  },
}

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'whatsapp-webhook.log')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
}

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

function verifySignature(req: NextApiRequest, rawBody: Buffer): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  const signature = req.headers['x-hub-signature-256'] as string | undefined
  if (!appSecret) return true // sin secret configurado, no verificamos
  if (!signature) return true // permitimos si Meta no envía firma (por compatibilidad)
  const hmac = crypto.createHmac('sha256', appSecret)
  hmac.update(rawBody)
  const expected = 'sha256=' + hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function extractTextBody(msg: any): string | null {
  if (!msg) return null
  if (msg.text?.body) return String(msg.text.body)
  if (msg.button?.text) return String(msg.button.text)
  const interactive = msg.interactive
  if (interactive?.button_reply?.title) return String(interactive.button_reply.title)
  if (interactive?.button_reply?.id) return String(interactive.button_reply.id)
  if (interactive?.list_reply?.title) return String(interactive.list_reply.title)
  if (interactive?.list_reply?.description) return String(interactive.list_reply.description)
  return null
}

async function persistIncomingMessages(body: any) {
  const entries = Array.isArray(body?.entry) ? body.entry : []
  const rows: Array<Record<string, any>> = []

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const value = change?.value
      const messages = Array.isArray(value?.messages) ? value.messages : []
      const metadata = value?.metadata || {}

      for (const msg of messages) {
        const waId = msg?.id || null
        const fromNumber = msg?.from || null
        const toNumber = metadata?.phone_number_id || metadata?.display_phone_number || null
        const profileName = msg?.profile?.name || value?.contacts?.[0]?.profile?.name || null
        const type = msg?.type || null
        const textBody = extractTextBody(msg)
        const timestampMs = msg?.timestamp ? Number(msg.timestamp) * 1000 : null

        rows.push({
          wa_id: waId,
          from_number: fromNumber,
          to_number: toNumber,
          profile_name: profileName,
          type,
          text_body: textBody,
          direction: 'in',
          payload: msg ?? null,
          timestamp_ms: Number.isFinite(timestampMs) ? timestampMs : null,
        })
      }
    }
  }

  if (!rows.length) return

  try {
    const { error } = await supabaseAdmin
      .from('whatsapp_messages')
      .upsert(rows, { onConflict: 'wa_id' })
    if (error) console.error('Failed to upsert whatsapp messages', error)
  } catch (err) {
    console.error('Error upserting whatsapp messages', err)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    if (mode === 'subscribe' && token && expected && token === expected) {
      return res.status(200).send(String(challenge))
    }
    return res.status(403).send('Forbidden')
  }

  if (req.method === 'POST') {
    const rawBody = await getRawBody(req)

    let parsed: any
    try {
      parsed = JSON.parse(rawBody.toString('utf8'))
    } catch (err) {
      console.error('Failed to parse webhook body', err)
      return res.status(400).send('Invalid JSON')
    }

    const ok = verifySignature(req, rawBody)
    if (!ok) {
      console.error('Webhook signature verification failed')
      return res.status(401).send('Invalid signature')
    }

    ensureLogDir()
    const entry = {
      receivedAt: new Date().toISOString(),
      headers: req.headers,
      body: parsed,
    }
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry, null, 2) + '\n---\n')
    } catch (err) {
      console.error('Failed to write webhook log', err)
    }
    // Also print to console for immediate dev feedback
    console.log('WhatsApp webhook event received:', JSON.stringify(parsed))

    // Persist inbound messages for admin chat view (best-effort; non-blocking)
    persistIncomingMessages(parsed).catch(err => {
      console.error('Failed to persist whatsapp messages', err)
    })

    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).end('Method Not Allowed')
}
// (duplicate handler removed) - keep the primary implementation above
