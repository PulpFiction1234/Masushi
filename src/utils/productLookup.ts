import { productos } from "@/data/productos";
import { getMergedProductsSync } from "@/utils/mergedProducts";

/**
 * Busca un producto por su código
 * @param codigo - Código del producto (ej: "001", "002", "001 | ")
 * @returns Producto encontrado o undefined
 */
export function getProductByCode(codigo: string) {
  // Limpiar el código de espacios y pipes
  const codigoLimpio = codigo.replace(/\s*\|\s*$/, '').trim();
  
  console.log(`[getProductByCode] Buscando producto con código: "${codigo}" (limpio: "${codigoLimpio}")`);
  const merged = getMergedProductsSync();
  const source = merged && merged.length ? merged : productos;
  const producto = source.find((p) => p.codigo === codigoLimpio);
  
  if (!producto) {
    console.warn(`[getProductByCode] ❌ NO encontrado. Primeros códigos disponibles:`, 
      productos.slice(0, 10).map(p => p.codigo)
    );
  } else {
    console.log(`[getProductByCode] ✅ Encontrado:`, producto.nombre);
  }
  
  return producto;
}

/**
 * Obtiene el nombre del producto por su código
 * @param codigo - Código del producto
 * @returns Nombre del producto o "Producto desconocido"
 */
export function getProductName(codigo: string): string {
  const product = getProductByCode(codigo);
  return product?.nombre || `Producto ${codigo}`;
}

/**
 * Obtiene el valor del producto por su código
 * @param codigo - Código del producto
 * @returns Valor del producto o 0
 */
export function getProductPrice(codigo: string): number {
  const product = getProductByCode(codigo);
  return product?.valor || 0;
}

/**
 * Obtiene la imagen del producto por su código
 * @param codigo - Código del producto
 * @returns URL de la imagen o undefined
 */
export function getProductImage(codigo: string): string | undefined {
  // Normalizar código igual que getProductByCode
  const codigoLimpio = codigo.replace(/\s*\|\s*$/, '').trim();

  // Try merged products cache first (contains serialized imagen as string)
  try {
    const merged = getMergedProductsSync();
    if (merged && merged.length) {
      const mp = merged.find((p) => (p.codigo || '').trim() === codigoLimpio);
      if (mp && mp.imagen) return typeof mp.imagen === 'string' ? mp.imagen : (mp.imagen as any).src;
    }
  } catch {}

  // Fallback to static productos
  const product = productos.find((p) => (p.codigo || '').trim() === codigoLimpio);
  if (product && product.imagen) {
    if (typeof product.imagen === 'object' && 'src' in product.imagen) return product.imagen.src;
    if (typeof product.imagen === 'string') return product.imagen;
  }

  return undefined;
}

/**
 * Try more aggressively to resolve an image URL for a product code.
 * Tries merged cache, static productos, and fuzzy matches (contains/includes) as fallback.
 */
export function resolveProductImageUrl(codigo: string): string | undefined {
  const codigoLimpio = codigo.replace(/\s*\|\s*$/, '').trim();

  // 1) exact via merged cache or static (getProductImage already tries merged + static exact)
  const direct = getProductImage(codigoLimpio);
  if (direct) return direct;

  // 2) fuzzy: check merged cache items whose codigo contains the code or viceversa
  try {
    const merged = getMergedProductsSync();
    if (merged && merged.length) {
      const byContains = merged.find((p) => (p.codigo || '').includes(codigoLimpio) || codigoLimpio.includes((p.codigo || '').trim()));
      if (byContains && byContains.imagen) return typeof byContains.imagen === 'string' ? byContains.imagen : (byContains.imagen as any).src;
    }
  } catch {}

  // 3) fuzzy on static productos
  const byContainsStatic = productos.find((p) => (p.codigo || '').includes(codigoLimpio) || codigoLimpio.includes((p.codigo || '').trim()));
  if (byContainsStatic && byContainsStatic.imagen) {
    if (typeof byContainsStatic.imagen === 'object' && 'src' in byContainsStatic.imagen) return byContainsStatic.imagen.src;
    if (typeof byContainsStatic.imagen === 'string') return byContainsStatic.imagen;
  }

  // 4) try numeric-only compare (strip non-digits)
  const digits = codigoLimpio.replace(/\D/g, '');
  if (digits) {
    const byDigits = productos.find((p) => (p.codigo || '').replace(/\D/g, '') === digits);
    if (byDigits && byDigits.imagen) {
      if (typeof byDigits.imagen === 'object' && 'src' in byDigits.imagen) return byDigits.imagen.src;
      if (typeof byDigits.imagen === 'string') return byDigits.imagen;
    }
  }

  return undefined;
}
