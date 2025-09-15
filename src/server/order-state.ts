import {
  recordForceClosed,
  clearForceClosedDate,
  shouldResetForceClosed,
} from "@/server/schedule";
import {
  getForceClosed as getStoredForceClosed,
  setForceClosed as setStoredForceClosed,
} from "@/server/state";

export async function getForceClosed(): Promise<boolean> {
  const closed = await getStoredForceClosed();
  if (closed && shouldResetForceClosed()) {
    await setStoredForceClosed(false);
    clearForceClosedDate();
    return false;
  }
  return closed;
}

export async function setForceClosed(closed: boolean): Promise<void> {
  await setStoredForceClosed(closed);
  if (closed) {
    recordForceClosed();
  } else {
    clearForceClosedDate();
  }
}
