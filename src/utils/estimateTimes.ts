import { BUSINESS_TZ } from './horarios';

export type Range = { min: number; max: number };
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

function toMinutes(hhmm: string) { const [h,m] = hhmm.split(':').map(Number); return h*60 + m; }
function inInterval(nowMinutes: number, from: string, to: string) {
  const a = toMinutes(from), b = toMinutes(to);
  if (a <= b) return nowMinutes >= a && nowMinutes < b;
  // overnight
  return nowMinutes >= a || nowMinutes < b;
}

// Define schedules per day for pickup (retiro) and delivery
const SCHEDULE: Record<'retiro'|'delivery', Record<DayKey, Array<{ from: string; to: string; range: Range }>>> = {
  retiro: {
    mon: [
      { from: '18:00', to: '19:30', range: { min: 20, max: 30 } },
      { from: '19:30', to: '21:30', range: { min: 25, max: 40 } },
      { from: '21:30', to: '22:30', range: { min: 25, max: 35 } },
    ],
    tue: [
      { from: '18:00', to: '19:30', range: { min: 20, max: 30 } },
      { from: '19:30', to: '21:30', range: { min: 25, max: 40 } },
      { from: '21:30', to: '22:30', range: { min: 25, max: 35 } },
    ],
    wed: [
      { from: '18:00', to: '19:30', range: { min: 20, max: 30 } },
      { from: '19:30', to: '21:30', range: { min: 25, max: 40 } },
      { from: '21:30', to: '22:30', range: { min: 25, max: 35 } },
    ],
    thu: [
      { from: '18:00', to: '19:30', range: { min: 20, max: 40 } },
      { from: '19:30', to: '21:30', range: { min: 30, max: 40 } },
      { from: '21:30', to: '22:30', range: { min: 20, max: 40 } },
    ],
    fri: [
      { from: '18:00', to: '19:30', range: { min: 20, max: 40 } },
      { from: '19:30', to: '21:30', range: { min: 40, max: 60 } },
      { from: '21:30', to: '23:00', range: { min: 35, max: 45 } },
    ],
    sat: [
      { from: '13:30', to: '15:30', range: { min: 35, max: 45 } },
      { from: '15:30', to: '19:00', range: { min: 20, max: 35 } },
      { from: '19:00', to: '22:30', range: { min: 30, max: 50 } },
    ],
    sun: [],
  },
  delivery: {
    mon: [
      { from: '18:00', to: '19:30', range: { min: 30, max: 45 } },
      { from: '19:30', to: '21:30', range: { min: 45, max: 60 } },
      { from: '21:30', to: '22:30', range: { min: 30, max: 45 } },
    ],
    tue: [
      { from: '18:00', to: '19:30', range: { min: 30, max: 45 } },
      { from: '19:30', to: '21:30', range: { min: 45, max: 60 } },
      { from: '21:30', to: '22:30', range: { min: 30, max: 45 } },
    ],
    wed: [
      { from: '18:00', to: '19:30', range: { min: 30, max: 45 } },
      { from: '19:30', to: '21:30', range: { min: 45, max: 60 } },
      { from: '21:30', to: '22:30', range: { min: 30, max: 45 } },
    ],
    thu: [
      { from: '18:00', to: '19:30', range: { min: 30, max: 50 } },
      { from: '19:30', to: '21:30', range: { min: 50, max: 70 } },
      { from: '21:30', to: '22:30', range: { min: 30, max: 50 } },
    ],
    fri: [
      { from: '18:00', to: '19:30', range: { min: 30, max: 50 } },
      { from: '19:30', to: '21:30', range: { min: 60, max: 90 } },
      { from: '21:30', to: '23:00', range: { min: 30, max: 50 } },
    ],
    sat: [
      { from: '13:30', to: '15:30', range: { min: 30, max: 50 } },
      { from: '15:30', to: '19:00', range: { min: 30, max: 45 } },
      { from: '19:00', to: '22:30', range: { min: 60, max: 80 } },
    ],
    sun: [],
  }
};

// weekday: 0=Sun,1=Mon,...
function weekdayKeyFromDate(d: Date, tz = BUSINESS_TZ): DayKey {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, weekday: 'short' }).formatToParts(d).find(p => p.type === 'weekday');
  const w = (parts?.value || '').toLowerCase();
  const map: Record<string, DayKey> = { sun:'sun', mon:'mon', tue:'tue', wed:'wed', thu:'thu', fri:'fri', sat:'sat' };
  return map[w] ?? 'sun';
}

export function getEstimateRange(deliveryType: 'delivery'|'retiro', now = new Date(), tz = BUSINESS_TZ): Range | null {
  const day = weekdayKeyFromDate(now, tz);
  const minutes = (() => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
    const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return hour*60 + minute;
  })();

  const list = SCHEDULE[deliveryType][day] ?? [];
  for (const item of list) {
    if (inInterval(minutes, item.from, item.to)) return item.range;
  }

  return null;
}

export function formatEstimate(range: Range | null) {
  if (!range) return null;
  return `${range.min} a ${range.max} min`;
}

// Helper: return window in Date objects (in TZ) for min and max minutes added to now
export function getEstimateWindow(deliveryType: 'delivery'|'retiro', now = new Date(), tz = BUSINESS_TZ) {
  const range = getEstimateRange(deliveryType, now, tz);
  if (!range) return null;
  const minAt = new Date(now.getTime() + range.min * 60 * 1000);
  const maxAt = new Date(now.getTime() + range.max * 60 * 1000);
  return { minAt, maxAt };
}

export function formatWindow(window: { minAt: Date; maxAt: Date } | null, tz = BUSINESS_TZ) {
  if (!window) return null;
  const fmt = (d: Date) => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  };
  const a = fmt(window.minAt);
  const b = fmt(window.maxAt);
  if (a === b) return a;
  return `${a} - ${b}`;
}

export default { getEstimateRange, formatEstimate };
