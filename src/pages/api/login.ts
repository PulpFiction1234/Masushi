import type { NextApiRequest, NextApiResponse } from 'next';
import { signToken, validateCredentials } from '@/server/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end();
    return;
  }

  const { username, password } = req.body ?? {};
  const valid = await validateCredentials(username, password);
  if (!valid) {
    res.status(401).end();
    return;
  }

  const token = signToken(username);
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax`);
  res.status(200).json({ ok: true });
}