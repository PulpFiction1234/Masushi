import { compare } from 'bcryptjs';
import supabase from './supabase';

type UserRow = {
  username: string;
  passwordHash: string;
  role: 'admin' | 'user' | string;
};

export async function validateCredentials(
  username?: string,
  password?: string
): Promise<'admin' | 'user' | null> {
  if (!username || !password) return null;

  // No tipamos .from(); tipamos el resultado con maybeSingle<...>
  const { data, error } = await supabase
    .from('User')
    .select('passwordHash, role')
    .eq('username', username)
    .maybeSingle<Pick<UserRow, 'passwordHash' | 'role'>>();

  if (error) {
    throw new Error(`Failed to retrieve user credentials: ${error.message}`);
  }

  if (!data) return null;

  const valid = await compare(password, data.passwordHash);
  if (!valid) return null;

  return data.role === 'admin' || data.role === 'user' ? data.role : null;
}