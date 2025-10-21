/**
 * Normaliza una URL de imagen para que funcione correctamente con Next/Image.
 * Maneja StaticImageData y strings, escapando solo la parte del filename.
 */
export function normalizeImageUrl(imagen: string | { src: string } | null | undefined): string {
  if (!imagen) {
    console.log('[normalizeImageUrl] Input is null/undefined');
    return "";
  }
  
  // Si es StaticImageData, extraer src
  const rawUrl = typeof imagen === "string" ? imagen : imagen.src;
  console.log('[normalizeImageUrl] Input:', imagen, '→ rawUrl:', rawUrl);
  
  if (!rawUrl) {
    console.log('[normalizeImageUrl] rawUrl is empty');
    return "";
  }

  // Si es una URL absoluta (http/https) o data URI, retornar tal cual
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    console.log('[normalizeImageUrl] Absolute URL or data URI, returning as-is');
    return rawUrl;
  }

  // Para rutas que ya fueron procesadas por Next.js (/_next/ o /server/), retornar tal cual
  // Estas ya tienen el encoding correcto aplicado por el bundler
  if (rawUrl.startsWith('/_next/') || rawUrl.startsWith('/server/')) {
    console.log('[normalizeImageUrl] Next.js processed path, returning as-is:', rawUrl);
    return rawUrl;
  }

  // Para rutas /images/... que pueden tener espacios, encodear solo el filename
  if (rawUrl.startsWith('/images/')) {
    const parts = rawUrl.split('/');
    const filename = parts[parts.length - 1];
    const encodedFilename = encodeURIComponent(filename);
    parts[parts.length - 1] = encodedFilename;
    const result = parts.join('/');
    console.log('[normalizeImageUrl] /images/ path, encoded filename:', filename, '→', encodedFilename, 'final:', result);
    return result;
  }

  // Fallback: retornar tal cual (no encodear más de lo necesario)
  console.log('[normalizeImageUrl] Fallback, returning as-is:', rawUrl);
  return rawUrl;
}

/**
 * Extrae el blurDataURL de un objeto StaticImageData
 */
export function extractBlurDataUrl(imagen: string | { src: string; blurDataURL?: string } | null | undefined): string | undefined {
  if (!imagen || typeof imagen === 'string') return undefined;
  return imagen.blurDataURL;
}
