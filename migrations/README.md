This folder contains database migrations and worker helper for message queue and product overrides.

Quick start
1. Run the migration in Supabase SQL Editor: open `20251014_create_product_overrides_and_outgoing_messages.sql` and execute.
2. Set environment variables in your deployment (Vercel) or local env:

   - SUPABASE_URL=https://your-project.supabase.co
   - SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

3. API endpoints (Next.js serverless):
   - POST `/api/enqueue-message` - body: { phone, payload, channel? }
     - Inserts into `outgoing_messages`. This route requires a logged-in session; server uses service role key to insert safely.
   - GET/POST `/api/admin/product-overrides` - get overrides or upsert one. Requires admin role in `profiles.role`.

4. Worker (process queue):
   - Locally: from `migrations` folder run:

     ```powershell
     $env:SUPABASE_URL='https://your.supabase.co'; $env:SUPABASE_SERVICE_ROLE_KEY='xxx'; node ..\scripts\worker\process_messages.js
     ```

   - Deploy: host the worker as a small process on Render, Railway, or Cloud Run. Use the same env vars. Keep concurrency modest (CONCURRENCY env var).

Best practices for Supabase Free plan
- Use the claim pattern (SELECT FOR UPDATE SKIP LOCKED) to avoid contention.
- Process messages in batches and keep table small by archiving older rows.
- Cache product overrides at the edge or client to avoid per-request DB reads.

Testing load
- To simulate, insert N rows into `outgoing_messages` (via SQL or `/api/enqueue-message`) and run the worker locally to measure processing.
