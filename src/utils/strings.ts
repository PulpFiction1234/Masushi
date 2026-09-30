// Normaliza strings: sin tildes, trim y lowercase
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export const ensureSupabasePassword = (password: string) => {
  const raw = String(password ?? '').trim();
  const digits = raw.replace(/\D/g, '');

  if (!digits) return raw;
  if (/^\d{4}$/.test(digits)) return `${digits}00`;
  return raw;
};

export const getSupabasePasswordCandidates = (password: string) => {
  const raw = String(password ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  const candidates = new Set<string>();

  if (raw) candidates.add(raw);
  if (digits) candidates.add(digits);
  if (/^\d{4}$/.test(digits)) candidates.add(`${digits}00`);

  return Array.from(candidates);
};

