const BASE_URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const READ_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN || TOKEN;

if (!BASE_URL || !TOKEN) {
  throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN must be set");
}

async function request(
  path: string,
  options: RequestInit = {},
  readOnly = false,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${readOnly ? READ_TOKEN : TOKEN}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(`${BASE_URL}/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    throw new Error(`KV request failed with ${res.status}`);
  }
  return res;
}

export async function getItem<T>(key: string): Promise<T | null> {
  const res = await request(`get/${encodeURIComponent(key)}`, {}, true);
  const data = (await res.json()) as { result: string | null };
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result) as T;
  } catch {
    return data.result as unknown as T;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await request(`set/${encodeURIComponent(key)}`, {
    method: "POST",
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}