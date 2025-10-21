/**
 * Worker prototype to process outgoing_messages queue.
 * Usage (local):
 *   SUPABASE_URL=https://your.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node process_messages.js
 */
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);
const MAX_RETRIES = 5;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function processBatch() {
  try {
    // call the claim function to atomically mark a batch as processing
    const { data: rows, error } = await svc.rpc('claim_pending_messages', { batch_size: BATCH_SIZE });
    if (error) throw error;
    if (!rows || rows.length === 0) return 0;

    // process with limited concurrency
    let idx = 0;
    async function worker() {
      while (true) {
        const row = rows[idx++];
        if (!row) return;
        try {
          // placeholder: send message to provider
          // For demo we just log and set as sent
          console.log('Processing', row.id, row.phone, row.payload);
          // Example: await axios.post(PROVIDER_URL, { to: row.phone, body: row.payload });

          await svc.from('outgoing_messages').update({ status: 'sent', attempts: row.attempts + 1, updated_at: new Date().toISOString() }).eq('id', row.id);
        } catch (e) {
          console.error('Error sending', row.id, e?.message ?? e);
          const attempts = (row.attempts || 0) + 1;
          const newStatus = attempts >= MAX_RETRIES ? 'dead' : 'pending';
          await svc.from('outgoing_messages').update({ status: newStatus, attempts, last_error: String(e?.message ?? e), updated_at: new Date().toISOString() }).eq('id', row.id);
        }
      }
    }

    const workers = new Array(CONCURRENCY).fill(0).map(() => worker());
    await Promise.all(workers);
    return rows.length;
  } catch (e) {
    console.error('Batch error', e?.message ?? e);
    return 0;
  }
}

async function mainLoop() {
  while (true) {
    const count = await processBatch();
    if (count === 0) {
      await sleep(2000);
    }
  }
}

mainLoop().catch((err) => {
  console.error('Fatal worker error', err);
  process.exit(1);
});
