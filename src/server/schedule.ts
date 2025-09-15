import { BUSINESS_TZ } from "@/utils/horarios";

let lastForceClosedAt: Date | null = null;

export function recordForceClosed(date: Date = new Date()): void {
  lastForceClosedAt = date;
}

export function clearForceClosedDate(): void {
  lastForceClosedAt = null;
}

export function shouldResetForceClosed(now: Date = new Date()): boolean {
  if (!lastForceClosedAt) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now) !== fmt.format(lastForceClosedAt);
}