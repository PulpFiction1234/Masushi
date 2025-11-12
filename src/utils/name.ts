function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip common diacritics so "Pérez" == "Perez"
    .replace(/[^a-z\d]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function containsSegment(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;

  const haystackTokens = haystack.split(/\s+/).filter(Boolean);
  const needleTokens = needle.split(/\s+/).filter(Boolean);

  if (needleTokens.length === 0 || haystackTokens.length === 0) {
    return false;
  }

  if (needleTokens.length === 1) {
    return haystackTokens.includes(needleTokens[0]);
  }

  for (let i = 0; i <= haystackTokens.length - needleTokens.length; i += 1) {
    let matches = true;
    for (let j = 0; j < needleTokens.length; j += 1) {
      if (haystackTokens[i + j] !== needleTokens[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
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

  const normalizedFull = normalizeWord(full);

  const patNorm = normalizeWord(pat);
  const matNorm = normalizeWord(mat);

  const needPat = Boolean(
    pat &&
      !tokensNormalized.has(patNorm) &&
      !containsSegment(normalizedFull, patNorm)
  );
  const needMat = Boolean(
    mat &&
      matNorm !== patNorm &&
      !tokensNormalized.has(matNorm) &&
      !containsSegment(normalizedFull, matNorm)
  );

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
