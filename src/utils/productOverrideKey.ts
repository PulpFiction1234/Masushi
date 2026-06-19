import { productos, type Producto } from '@/data/productos';

const CODE_COUNTS = productos.reduce((acc, p) => {
  const code = typeof p.codigo === 'string' ? p.codigo.trim() : '';
  if (!code) return acc;
  acc.set(code, (acc.get(code) ?? 0) + 1);
  return acc;
}, new Map<string, number>());

const normalizeCode = (code: unknown): string =>
  typeof code === 'string' ? code.trim() : '';

export const getProductOverrideKey = (product: Pick<Producto, 'id' | 'codigo'>): string => {
  const code = normalizeCode(product.codigo);
  if (!code) return String(product.id);
  if ((CODE_COUNTS.get(code) ?? 0) > 1) return `${code}#${product.id}`;
  return code;
};

export const getProductOverrideLookupKeys = (product: Pick<Producto, 'id' | 'codigo'>): string[] => {
  const code = normalizeCode(product.codigo);
  const keys: string[] = [];
  const hasDuplicateCode = code ? (CODE_COUNTS.get(code) ?? 0) > 1 : false;

  if (code && hasDuplicateCode) {
    keys.push(`${code}#${product.id}`);
  }

  if (code && !hasDuplicateCode) keys.push(code);
  keys.push(String(product.id));

  return Array.from(new Set(keys));
};
