import { getSettingsCollection } from "@/server/db";

const FORCE_CLOSED_ID = "forceClosed";

export async function getForceClosed(): Promise<boolean> {
  const col = await getSettingsCollection();
  const doc = await col.findOne({ _id: FORCE_CLOSED_ID });
  return doc?.value ?? false;
}

export async function setForceClosed(value: boolean): Promise<void> {
  const col = await getSettingsCollection();
  await col.updateOne(
    { _id: FORCE_CLOSED_ID },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true },
  );
}