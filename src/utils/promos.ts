export const MASUSHI_DAY_CODE = 'MASUSHI5';
export const MASUSHI_DAY_PERCENT = 5;
export const MASUSHI_DAY_DATE = '2026-06-18';
export const DEFAULT_PROMO_TIME_ZONE = 'America/Santiago';

export const getYmdInTimeZone = (reference: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);

export const isMasushiDayActive = (
  reference: Date = new Date(),
  timeZone: string = DEFAULT_PROMO_TIME_ZONE,
): boolean => getYmdInTimeZone(reference, timeZone) === MASUSHI_DAY_DATE;