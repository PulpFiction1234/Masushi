export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WEEK_LENGTH_DAYS = 7;
export const BIRTHDAY_COUPON_CODE = 'BIRTHDAY10';
export const BIRTHDAY_MIN_MONTHS = 3;
export const BIRTHDAY_MIN_ORDERS = 6;

const DAY_NAMES_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"] as const;

export type BirthdayWindowLike = { start: string; end: string } | null | undefined;
export type BirthdayWeekBounds = { monday: Date; sunday: Date };

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

  const diffToMonday = (base.getDay() + 6) % 7;
  const start = new Date(base);
  start.setDate(base.getDate() - diffToMonday);
  start.setUTCHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setUTCHours(12, 0, 0, 0);

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

export const getBirthdayWeekBounds = (
  birthdayIso: string | null | undefined,
  window: BirthdayWindowLike,
  reference: Date = new Date(),
): BirthdayWeekBounds | null => {
  if (window) {
    const monday = new Date(window.start);
    if (!Number.isNaN(monday.getTime())) {
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { monday, sunday };
    }
  }

  if (!birthdayIso) return null;

  const current = getBirthdayWindowForYear(birthdayIso, reference.getFullYear());
  if (current && reference <= current.end) {
    return { monday: current.start, sunday: current.end };
  }

  const next = getBirthdayWindowForYear(birthdayIso, reference.getFullYear() + 1);
  if (next) {
    return { monday: next.start, sunday: next.end };
  }

  return null;
};

export const formatBirthdayWeekRange = (bounds: BirthdayWeekBounds): string => {
  const format = (date: Date) => {
    const label = DAY_NAMES_ES[date.getDay()] ?? '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${label} ${day}-${month}`.trim();
  };

  return `Válido del ${format(bounds.monday)} al ${format(bounds.sunday)}`;
};
