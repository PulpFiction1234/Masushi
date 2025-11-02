export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WINDOW_DAYS = 3; // días antes y después del cumpleaños
export const BIRTHDAY_COUPON_CODE = 'BIRTHDAY10';
export const BIRTHDAY_MIN_MONTHS = 3;
export const BIRTHDAY_MIN_ORDERS = 6;

export type BirthdayWindow = {
  start: Date;
  end: Date;
  year: number;
};

const clampDay = (year: number, monthIndex: number, day: number) => {
  const date = new Date(year, monthIndex, day);
  if (Number.isNaN(date.getTime())) return null;
  // Ajustar cuando el día no existe (ej. 29 febrero en año no bisiesto)
  if (date.getMonth() !== monthIndex) {
    date.setDate(0); // retrocede al último día del mes anterior
  }
  return date;
};

export const getBirthdayWindowForYear = (birthdayIso: string, year: number): BirthdayWindow | null => {
  const parts = birthdayIso.split('-').map((p) => Number.parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [, monthRaw, dayRaw] = parts;
  const monthIndex = Math.max(0, Math.min(11, monthRaw - 1));
  const base = clampDay(year, monthIndex, dayRaw);
  if (!base) return null;

  const start = new Date(base);
  start.setDate(base.getDate() - BIRTHDAY_WINDOW_DAYS);
  const end = new Date(base);
  end.setDate(base.getDate() + BIRTHDAY_WINDOW_DAYS);

  return { start, end, year };
};

export const getBirthdayWindow = (birthdayIso: string, reference: Date = new Date()): BirthdayWindow | null => {
  const window = getBirthdayWindowForYear(birthdayIso, reference.getFullYear());
  if (!window) return null;
  return window;
};

export const getNextBirthdayWindow = (birthdayIso: string, reference: Date = new Date()): BirthdayWindow | null => {
  const current = getBirthdayWindowForYear(birthdayIso, reference.getFullYear());
  if (!current) return null;
  if (reference <= current.end) return current;
  return getBirthdayWindowForYear(birthdayIso, reference.getFullYear() + 1);
};

export const isWithinBirthdayWindow = (birthdayIso: string, reference: Date = new Date()): boolean => {
  const window = getBirthdayWindow(birthdayIso, reference);
  if (!window) return false;
  return reference >= window.start && reference <= window.end;
};

export const monthsBetween = (startIso: string | null | undefined, reference: Date = new Date()): number => {
  if (!startIso) return 0;
  const startDate = new Date(startIso);
  if (Number.isNaN(startDate.getTime())) return 0;

  let months = (reference.getFullYear() - startDate.getFullYear()) * 12;
  months += reference.getMonth() - startDate.getMonth();
  if (reference.getDate() < startDate.getDate()) months -= 1;

  return Math.max(months, 0);
};
