import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end();
    return;
  }

   let signToken: (
    username: string,
    role: 'admin' | 'user',
  ) => string;
  let validateCredentials: (
    username?: string,
    password?: string,
  ) => Promise<'admin' | 'user' | null>;
  try {
    ({ signToken, validateCredentials } = await import('@/server/auth'));
  } catch (err) {
    console.error(err);
    res.status(500).end();
    return;
  }

  const { username, password } = req.body ?? {};
  const role = await validateCredentials(username, password);
  if (!role) {
    res.status(401).end();
    return;
  }

    const token = signToken(username, role);
  // In production, send cookies only over HTTPS. For local tests you can omit this flag.
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`);
  res.status(200).json({ ok: true });
}