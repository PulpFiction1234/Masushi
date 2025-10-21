import type { Producto } from "@/data/productos";

let cache: ReadonlyArray<Producto> | null = null;
let fetchInProgress: Promise<ReadonlyArray<Producto>> | null = null;

export async function fetchMergedProducts(): Promise<ReadonlyArray<Producto>> {
  if (cache) return cache;
  if (fetchInProgress) return fetchInProgress;
  fetchInProgress = (async () => {
    try {
      const r = await fetch('/api/products-merged');
      if (!r.ok) throw new Error('Failed fetching merged products');
      const j = await r.json();
      if (j?.products && Array.isArray(j.products)) {
        const products = j.products as ReadonlyArray<Producto>;
        cache = products;
        return products;
      }
    } catch (e) {
      console.error('fetchMergedProducts error', e);
    }
    // Always return a non-null array
    return [] as ReadonlyArray<Producto>;
  })();
  return fetchInProgress!;
}

export function getMergedProductsSync(): ReadonlyArray<Producto> | null {
  return cache;
}

export function clearMergedProductsCache() {
  cache = null;
}

// Listen for cross-tab updates (admin toggles) and clear cache
if (typeof window !== "undefined") {
  const KEY = "product-overrides-updated";
  window.addEventListener("storage", (e) => {
    try {
      if (e.key === KEY) clearMergedProductsCache();
    } catch {}
  });

  // In-page event as well
  window.addEventListener("product-overrides-changed", () => {
    try { clearMergedProductsCache(); } catch {}
  });
}
