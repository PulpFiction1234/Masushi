import {
  recordForceClosed,
  clearForceClosedDate,
  shouldResetForceClosed,
} from "@/server/schedule";

let forceClosed = false;

export function getForceClosed(): boolean {
  if (forceClosed && shouldResetForceClosed()) {
    forceClosed = false;
    clearForceClosedDate();
  }
  return forceClosed;
}

export function setForceClosed(closed: boolean): void {
  forceClosed = closed;
  if (closed) {
    recordForceClosed();
  } else {
    clearForceClosedDate();
  }
}