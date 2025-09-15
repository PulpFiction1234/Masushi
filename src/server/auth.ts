import jwt from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import { getUsersCollection } from './db';

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return secret;
})();

export async function validateCredentials(
  username?: string,
  password?: string
): Promise<boolean> {
  if (!username || !password) return false;
  const users = await getUsersCollection();
  const user = await users.findOne({ username });
  if (!user) return false;
  return compare(password, user.passwordHash);
}

export function signToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token?: string): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}