export const MASUSHI_DAY_CODE = 'MASUSHI5';
export const MASUSHI_DAY_PERCENT = 5;
export const MASUSHI_DAY_MONTH = 6;
export const MASUSHI_DAY_DAY = 18;
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
): boolean => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(reference);
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? 0);
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? 0);
  return month === MASUSHI_DAY_MONTH && day === MASUSHI_DAY_DAY;
};