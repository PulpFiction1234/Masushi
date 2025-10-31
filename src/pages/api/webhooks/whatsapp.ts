import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Simple webhook endpoint for WhatsApp Cloud API status updates.
// - GET: used by Meta to verify the webhook (hub.mode=subscribe & hub.verify_token & hub.challenge)
// - POST: receives events and appends them to logs/whatsapp-webhook.log

export const config = {
  api: {
    bodyParser: true, // keep default; if you need raw body for strict signature verification, change this
  },
}

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_FILE = path.join(LOG_DIR, 'whatsapp-webhook.log')

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
}

function verifySignature(req: NextApiRequest): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  const signature = req.headers['x-hub-signature-256'] as string | undefined
  if (!appSecret) return true // no secret configured, skip verification
  if (!signature) return false
  // compute signature over raw body. We will stringify the body because Next.js parsed it already.
  const payload = JSON.stringify(req.body)
  const hmac = crypto.createHmac('sha256', appSecret)
  hmac.update(payload)
  const expected = 'sha256=' + hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
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
    // Optional verification
    const ok = verifySignature(req)
    if (!ok) {
      console.error('Webhook signature verification failed')
      return res.status(401).send('Invalid signature')
    }

    ensureLogDir()
    const entry = {
      receivedAt: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
    }
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(entry, null, 2) + '\n---\n')
    } catch (err) {
      console.error('Failed to write webhook log', err)
    }
    // Also print to console for immediate dev feedback
    console.log('WhatsApp webhook event received:', JSON.stringify(req.body))

    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).end('Method Not Allowed')
}
// (duplicate handler removed) - keep the primary implementation above
