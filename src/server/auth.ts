export function getExpectedToken(): string | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) return null;
  return Buffer.from(`${user}:${pass}`).toString('base64');
}

export function validateCredentials(username?: string, password?: string): boolean {
  return (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  );
}

