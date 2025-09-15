import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "kv.json");
let cache: Record<string, unknown> | null = null;

async function load(): Promise<Record<string, unknown>> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    cache = {};
  }
  return cache;
}

export async function getItem<T>(key: string): Promise<T | null> {
  const store = await load();
  return (store[key] as T) ?? null;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  const store = await load();
  store[key] = value;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store));
}