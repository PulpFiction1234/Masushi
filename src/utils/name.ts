function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip common diacritics so "Pérez" == "Perez"
    .replace(/[^a-z\d]+/gi, ' ')
    .trim()
    .toLowerCase();
}

export function buildFullName(fullNameRaw?: string | null, apellidoPaterno?: string | null, apellidoMaterno?: string | null): string {
  const full = String(fullNameRaw || '').trim();
  const pat = String(apellidoPaterno || '').trim();
  const mat = String(apellidoMaterno || '').trim();

  const tokensNormalized = new Set(
    full
      .split(/\s+/)
      .map(token => normalizeWord(token))
      .filter(Boolean)
  );

  const patNorm = normalizeWord(pat);
  const matNorm = normalizeWord(mat);

  const needPat = Boolean(pat && !tokensNormalized.has(patNorm));
  const needMat = Boolean(mat && !tokensNormalized.has(matNorm) && matNorm !== patNorm);

  const parts: string[] = [];
  if (full) parts.push(full);
  if (needPat) parts.push(pat);
  if (needMat) parts.push(mat);

  return parts
    .map(segment => segment.trim())
    .filter(Boolean)
    .join(' ');
}

export default buildFullName;
