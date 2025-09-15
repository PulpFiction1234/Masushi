import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

type LoginResponse =
  | { ok: true; role: 'admin' | 'user' }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end();
    return;
  }

  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing credentials' });
    return;
  }

  const supabase = createPagesServerClient({ req, res });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  });

  if (error || !data.session || !data.user) {
    res.status(401).json({ ok: false, error: error?.message ?? 'Invalid credentials' });
    return;
  }

  const role = data.user.user_metadata?.role;

  if (role !== 'admin' && role !== 'user') {
    await supabase.auth.signOut();
    res.status(403).json({ ok: false, error: 'Unauthorized role' });
    return;
  }

  res.status(200).json({ ok: true, role });
}