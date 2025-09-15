import type { NextApiRequest, NextApiResponse } from 'next';
import { getExpectedToken, validateCredentials } from '@/server/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end();
    return;
  }

  const { username, password } = req.body ?? {};
  if (!validateCredentials(username, password)) {
    res.status(401).end();
    return;
  }

  const token = getExpectedToken();
  if (!token) {
    res.status(500).end();
    return;
  }

  res.setHeader(
    'Set-Cookie',
    `token=${token}; Path=/; HttpOnly; SameSite=Lax`
  );
  res.status(200).json({ ok: true });
}

