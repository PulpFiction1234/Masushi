export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WEEK_LENGTH_DAYS = 7;
export const BIRTHDAY_COUPON_CODE = 'BIRTHDAY10';
export const BIRTHDAY_MIN_MONTHS = 1;
export const BIRTHDAY_MIN_ORDERS = 3;
export const BIRTHDAY_TIME_ZONE = 'America/Santiago';

const DAY_NAMES_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"] as const;

const getTimeZoneDateParts = (date: Date, timeZone: string = BIRTHDAY_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [yearStr, monthStr, dayStr] = formatter.format(date).split('-');
  return {
    year: Number.parseInt(yearStr, 10),
    month: Number.parseInt(monthStr, 10),
    day: Number.parseInt(dayStr, 10),
  };
};

export const normalizeDateToBirthdayZone = (date: Date, timeZone: string = BIRTHDAY_TIME_ZONE): Date => {
  const { year, month, day } = getTimeZoneDateParts(date, timeZone);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
};

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
  const normalized = normalizeDateToBirthdayZone(reference);
  const window = getBirthdayWindowForYear(birthdayIso, normalized.getUTCFullYear());
  if (!window) return null;
  return window;
};

export const getNextBirthdayWindow = (birthdayIso: string, reference: Date = new Date()): BirthdayWindow | null => {
  const normalized = normalizeDateToBirthdayZone(reference);
  const current = getBirthdayWindowForYear(birthdayIso, normalized.getUTCFullYear());
  if (!current) return null;
  if (normalized <= current.end) return current;
  return getBirthdayWindowForYear(birthdayIso, normalized.getUTCFullYear() + 1);
};

export const isWithinBirthdayWindow = (birthdayIso: string, reference: Date = new Date()): boolean => {
  const referenceNormalized = normalizeDateToBirthdayZone(reference);
  const window = getBirthdayWindow(birthdayIso, referenceNormalized);
  if (!window) return false;
  const startNormalized = normalizeDateToBirthdayZone(window.start);
  const endNormalized = normalizeDateToBirthdayZone(window.end);
  return referenceNormalized >= startNormalized && referenceNormalized <= endNormalized;
};

export const monthsBetween = (startIso: string | null | undefined, reference: Date = new Date()): number => {
  if (!startIso) return 0;
  const startDate = new Date(startIso);
  if (Number.isNaN(startDate.getTime())) return 0;

  const referenceNormalized = normalizeDateToBirthdayZone(reference);
  const startNormalized = normalizeDateToBirthdayZone(startDate);

  let months = (referenceNormalized.getUTCFullYear() - startNormalized.getUTCFullYear()) * 12;
  months += referenceNormalized.getUTCMonth() - startNormalized.getUTCMonth();
  if (referenceNormalized.getUTCDate() < startNormalized.getUTCDate()) months -= 1;

  return Math.max(months, 0);
};

export const getBirthdayWeekBounds = (
  birthdayIso: string | null | undefined,
  window: BirthdayWindowLike,
  reference: Date = new Date(),
): BirthdayWeekBounds | null => {
  if (window) {
    const monday = normalizeDateToBirthdayZone(new Date(window.start));
    if (!Number.isNaN(monday.getTime())) {
      const sunday = normalizeDateToBirthdayZone(new Date(window.end));
      return { monday, sunday };
    }
  }

  if (!birthdayIso) return null;

  const referenceNormalized = normalizeDateToBirthdayZone(reference);
  const current = getBirthdayWindowForYear(birthdayIso, referenceNormalized.getUTCFullYear());
  if (current) {
    const monday = normalizeDateToBirthdayZone(current.start);
    const sunday = normalizeDateToBirthdayZone(current.end);
    if (referenceNormalized <= sunday) {
      return { monday, sunday };
    }
  }

  const next = getBirthdayWindowForYear(birthdayIso, referenceNormalized.getUTCFullYear() + 1);
  if (next) {
    const monday = normalizeDateToBirthdayZone(next.start);
    const sunday = normalizeDateToBirthdayZone(next.end);
    return { monday, sunday };
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
