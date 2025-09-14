let forceClosed = false;

export function getForceClosed(): boolean {
  return forceClosed;
}

export function setForceClosed(closed: boolean): void {
  forceClosed = closed;
}