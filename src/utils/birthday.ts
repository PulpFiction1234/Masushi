export const BIRTHDAY_DISCOUNT_PERCENT = 10;
export const BIRTHDAY_WINDOW_DAYS = 3; // días antes y después del cumpleaños
export const BIRTHDAY_COUPON_CODE = 'BIRTHDAY10';
export const BIRTHDAY_MIN_MONTHS = 3;
export const BIRTHDAY_MIN_ORDERS = 6;

const DAY_NAMES_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;

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

const resolveBirthdayDate = (
  birthdayIso: string | null | undefined,
  window: BirthdayWindowLike,
  reference: Date,
): Date | null => {
  let birthdayDate: Date | null = null;
  let windowYear: number | null = null;

  if (window) {
    const startDate = new Date(window.start);
    const endDate = new Date(window.end);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      windowYear = startDate.getFullYear();
      const inferred = new Date(startDate);
      inferred.setDate(inferred.getDate() + BIRTHDAY_WINDOW_DAYS);
      if (inferred <= endDate) {
        birthdayDate = inferred;
      } else {
        const fallback = new Date(endDate);
        fallback.setDate(fallback.getDate() - BIRTHDAY_WINDOW_DAYS);
        birthdayDate = fallback;
      }
    }
  }

  if (!birthdayDate && birthdayIso) {
    const parts = birthdayIso.split('-');
    if (parts.length >= 3) {
      const monthIndex = Number.parseInt(parts[1] ?? '', 10) - 1;
      const dayNumber = Number.parseInt(parts[2] ?? '', 10);
      if (!Number.isNaN(monthIndex) && !Number.isNaN(dayNumber)) {
        const baseYear = windowYear ?? reference.getFullYear();
        let candidate = new Date(baseYear, Math.max(0, Math.min(11, monthIndex)), dayNumber, 12, 0, 0, 0);
        if (windowYear === null && candidate < reference) {
          candidate = new Date(baseYear + 1, Math.max(0, Math.min(11, monthIndex)), dayNumber, 12, 0, 0, 0);
        }
        birthdayDate = candidate;
      }
    }
  }

  if (!birthdayDate || Number.isNaN(birthdayDate.getTime())) return null;
  return birthdayDate;
};

export const getBirthdayWeekBounds = (
  birthdayIso: string | null | undefined,
  window: BirthdayWindowLike,
  reference: Date = new Date(),
): BirthdayWeekBounds | null => {
  const birthdayDate = resolveBirthdayDate(birthdayIso, window, reference);
  if (!birthdayDate) return null;

  const dayOfWeek = birthdayDate.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(birthdayDate);
  monday.setDate(birthdayDate.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday };
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
