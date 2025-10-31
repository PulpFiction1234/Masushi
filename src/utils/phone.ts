/**
 * normalizePhone
 * - Removes non-digit characters and normalizes local Chilean numbers to international format.
 * - If the number already includes a country code (e.g. starts with '56'), it's returned as-is (digits only).
 * - If the number looks like a Chile local/mobile number (8 or 9 digits) it will prefix with '56'.
 * - Does not add a leading '+' since provider APIs usually expect digits only.
 */
export function normalizePhone(phone: unknown, defaultCountry = '56'): string {
  const s = (phone ?? '').toString();
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(defaultCountry)) return digits;

  // strip leading zeros
  const noZero = digits.replace(/^0+/, '');

  // Common local lengths: 8 (landline) or 9 (mobile). Prefix with country if so.
  if (noZero.length === 8 || noZero.length === 9) {
    return `${defaultCountry}${noZero}`;
  }

  // Fallback: return digits as-is (could already be international but missing +)
  return digits;
}
