import jwt from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import prisma from './db';

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return secret;
})();

export async function validateCredentials(
  username?: string,
  password?: string
): Promise<'admin' | 'user' | null> {
  if (!username || !password) return null;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const valid = await compare(password, user.passwordHash);
  if (!valid) return null;
  if (user.role === 'admin' || user.role === 'user') {
    return user.role;
  }
  return null;
}

export function signToken(
  username: string,
  role: 'admin' | 'user',
): string {
  return jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(
  token?: string,
): { username: string; role: 'admin' | 'user' } | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as {
      username: string;
      role: 'admin' | 'user';
    };
  } catch {
    return null;
  }
}