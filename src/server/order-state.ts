import {
  recordForceClosed,
  clearForceClosedDate,
  shouldResetForceClosed,
} from "@/server/schedule";
import { getItem, setItem } from "@/server/storage";

const FORCE_CLOSED_KEY = "forceClosed";

export async function getForceClosed(): Promise<boolean> {
  const closed = (await getItem<boolean>(FORCE_CLOSED_KEY)) ?? false;
  if (closed && shouldResetForceClosed()) {
    await setItem(FORCE_CLOSED_KEY, false);
    clearForceClosedDate();
    return false;
  }
  return closed;
}

export async function setForceClosed(closed: boolean): Promise<void> {
  await setItem(FORCE_CLOSED_KEY, closed);
  if (closed) {
    recordForceClosed();
  } else {
    clearForceClosedDate();
  }
}