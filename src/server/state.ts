import prisma from "@/server/db";

const FORCE_CLOSED_ID = "forceClosed";

export async function getForceClosed(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { id: FORCE_CLOSED_ID } });
  return setting?.value ?? false;
}

export async function setForceClosed(value: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { id: FORCE_CLOSED_ID },
    update: { value },
    create: { id: FORCE_CLOSED_ID, value },
  });
}