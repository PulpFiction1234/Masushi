export function buildFullName(fullNameRaw?: string | null, apellidoPaterno?: string | null, apellidoMaterno?: string | null): string {
  const full = String(fullNameRaw || '').trim();
  const pat = String(apellidoPaterno || '').trim();
  const mat = String(apellidoMaterno || '').trim();

  // tokens from full (lowercase) for containment checks
  const tokens = full.toLowerCase().split(/\s+/).filter(Boolean);

  const needPat = pat && !tokens.includes(pat.toLowerCase());
  const needMat = mat && !tokens.includes(mat.toLowerCase());

  const parts: string[] = [];
  if (full) parts.push(full);
  if (needPat) parts.push(pat);
  if (needMat) parts.push(mat);

  let result = parts.map(s => s.trim()).filter(Boolean).join(' ');

  // Remove accidental duplicated adjacent words (e.g. "Perez Perez")
  // This is conservative and only collapses exact repeated words next to each other.
  result = result.replace(/\b(\S+)\b(?:\s+\1\b)+/gi, '$1');

  return result;
}

export default buildFullName;
